import { registerSW } from 'virtual:pwa-register';
import { ensureVendorLibs } from '../shared/utils/lazyLibs.js';

// Register Service Worker for PWA. The returned updater is invoked on
// onNeedRefresh so new content is applied without a manual reload.
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, updating…');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
});

/**
 * Single source of truth for the workspaces. Adding a new workspace means
 * adding one entry here — every routine below is data-driven off this list.
 *
 * The sketch is loaded lazily via dynamic import so each workspace's code is
 * code-split into its own chunk and only fetched on first activation.
 *
 * @typedef {Object} Workspace
 * @property {string}   name        Stable id used for tabs, views and shortcuts.
 * @property {Function} load        Resolves to the named sketch factory.
 * @property {string}   containerId DOM id the p5 instance mounts into.
 * @property {boolean}  animated    Whether the sketch runs a continuous loop.
 * @property {string}   [shortcut]  KeyboardEvent.code that activates it with Alt.
 * @property {string[]} [libs]      Vendor globals the sketch needs (see lazyLibs.js);
 *                                  loaded in parallel with the chunk, ready before setup().
 * @property {p5|null}  instance    Lazily created p5 instance (mutated at runtime).
 */
/** @type {Workspace[]} */
const workspaces = [
  { name: 'ritmo', load: () => import('../ritmo/js/app.js').then((m) => m.ritmoSketch), containerId: 'ritmo-canvas', animated: true, shortcut: 'KeyR' },
  { name: 'borro', load: () => import('../borro/js/app.js').then((m) => m.borroSketch), containerId: 'borro-canvas', animated: true, shortcut: 'KeyB', libs: ['paper', 'color'] },
  { name: 'copo', load: () => import('../copo/js/app.js').then((m) => m.copoSketch), containerId: 'copo-canvas', animated: true, shortcut: 'KeyC', libs: ['paper'] },
  { name: 'refrac', load: () => import('../refrac/js/app.js').then((m) => m.refracSketch), containerId: 'refrac-canvas', animated: true, shortcut: 'KeyF' },
].map((w) => ({ ...w, instance: null }));

const workspaceByName = new Map(workspaces.map((w) => [w.name, w]));

let currentApp = 'ritmo';
let currentTheme = 'light';

/**
 * Lazily loads a workspace's sketch chunk, creates its p5 instance on first
 * activation and applies the current theme. Concurrent calls share one promise
 * so a rapid double-activation can't create two instances.
 * @param {Workspace} ws
 * @returns {Promise<void>}
 */
function initApp(ws) {
  if (ws.instance) {
    if (currentTheme === 'dark') applyThemeToInstance(ws, currentTheme);
    return Promise.resolve();
  }
  if (ws.pending) return ws.pending;

  // Vendor globals download in parallel with the sketch chunk; both must be
  // ready before the instance is created (sketches touch globals in setup()).
  ws.pending = Promise.all([ws.load(), ensureVendorLibs(...(ws.libs || []))])
    .then(([sketch]) => {
      const container = document.getElementById(ws.containerId);
      if (container) ws.instance = new p5(sketch, container);
      if (currentTheme === 'dark') applyThemeToInstance(ws, currentTheme);
    })
    .catch((err) => console.error(`Failed to load workspace "${ws.name}":`, err))
    .finally(() => {
      ws.pending = null;
    });

  return ws.pending;
}

/**
 * Applies a theme to a workspace's p5 instance if it exposes applyTheme.
 * @param {Workspace} ws
 * @param {'light'|'dark'} theme
 */
function applyThemeToInstance(ws, theme) {
  if (ws.instance && typeof ws.instance.applyTheme === 'function') {
    ws.instance.applyTheme(theme);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize only the default app
  initApp(workspaceByName.get(currentApp));

  // 2. Setup tab switching
  workspaces.forEach((ws) => {
    const tabBtn = document.getElementById(`tab-${ws.name}`);
    if (tabBtn) tabBtn.addEventListener('click', () => switchApp(ws.name));
  });

  // 3. Setup global theme toggle
  const themeBtn = document.getElementById('btn-global-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleGlobalTheme);
  }

  // 4. Keyboard shortcuts
  window.addEventListener('keydown', handleGlobalKeys);
});

/**
 * Switches the active app, updating the UI and initializing the app if necessary.
 * @param {string} appName The name of the app to switch to
 */
function switchApp(appName) {
  if (!workspaceByName.has(appName) || currentApp === appName) return;

  if (document.startViewTransition) {
    document.startViewTransition(() => executeSwitchApp(appName));
  } else {
    executeSwitchApp(appName);
  }
}

function executeSwitchApp(appName) {
  currentApp = appName;
  const active = workspaceByName.get(appName);

  // Update tab + view visibility synchronously for an instant UI response.
  workspaces.forEach((ws) => {
    const btn = document.getElementById(`tab-${ws.name}`);
    const view = document.getElementById(`app-${ws.name}`);
    const isActive = ws.name === appName;

    if (btn) {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    }

    if (view) {
      view.style.display = isActive ? 'block' : 'none';
      view.classList.toggle('active', isActive);
    }

    // Pause hidden instances to save cycles; the active one's loop state is
    // (re)applied below once it's guaranteed to exist.
    if (!isActive && ws.instance) ws.instance.noLoop();
  });

  // The active sketch may load asynchronously on first activation, so apply
  // its loop state and trigger the canvas resize once the instance exists.
  initApp(active).then(() => {
    if (active.instance && active.animated) active.instance.loop();

    // Fix p5.js canvas dimensions if the view was hidden during initialization.
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 10);
  });
}

/**
 * Toggles the global theme between light and dark modes.
 */
function toggleGlobalTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.body.classList.toggle('theme-dark', currentTheme === 'dark');
  document.body.classList.toggle('theme-light', currentTheme === 'light');

  workspaces.forEach((ws) => applyThemeToInstance(ws, currentTheme));
}

/**
 * Handles global keyboard shortcuts for switching apps (Alt + workspace key).
 * @param {KeyboardEvent} e The keyboard event
 */
function handleGlobalKeys(e) {
  if (!e.altKey) return;
  const ws = workspaces.find((w) => w.shortcut === e.code);
  if (ws) {
    e.preventDefault();
    switchApp(ws.name);
  }
}
