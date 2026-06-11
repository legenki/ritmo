// RITMO — layered simplex-noise waves.
// Renders into an offscreen gForm buffer that is displayed fitted to the
// viewport and reused for PNG/MP4 export.

import { createMap2 } from './map2.js';
import { Gradient } from './gradient.js';
import { SECTIONS, COLOR_SECTIONS } from './controls.js';
import { safeStorage } from '../../shared/utils/storage.js';
import { ensureHME } from '../../shared/utils/lazyLibs.js';
import { timestamp } from '../../shared/utils/datetime.js';
import { downloadPresetJSON, openPresetFile } from '../../shared/utils/presetIO.js';
import {
  createPanelBuilder,
  buildPresetSection,
  openSections,
} from '../../shared/ui/panelBuilder.js';

const STORAGE_KEY = 'ritmo-tool';
const MAX_SEED = 10000;
let PRESETS = {};

export function ritmoSketch(p) {
  let canvasContainer;
  const map2 = createMap2(p);

  // ---- State ----
  const seed = {
    simplex: Math.floor(Math.random() * MAX_SEED) + 1,
    number: Math.floor(Math.random() * MAX_SEED) + 1,
    random: Math.floor(Math.random() * MAX_SEED) + 1,
    fill: Math.floor(Math.random() * MAX_SEED) + 1,
    stroke: Math.floor(Math.random() * MAX_SEED) + 1,
  };

  const cnv = {
    ratio: '1:1',
    frame: 0,
    rotate: 0,
    offset: 25,
    animation: true,
    density: { base: 2, export: 4 },
    scale: { x: 100, y: 100, xMin: 100, xMax: 300, yMin: 25, yMax: 300 },
  };

  const form = {
    type: 'waves',
    formTypes: ['waves', 'stripes'],
    stripe: { width: 50, min: 1, max: 250 },
    amount: { value: 20, min: 2, max: 200 },
    quality: { value: 33, min: 2, max: 60 },
    amp: { x: 0, y: 25, max: 10 },
    freq: { x: 35, y: 90, xmax: 25, ymax: 10 },
    speed: { x: 0, y: 20 },
  };

  const palette = {
    total: Math.floor(Math.random() * 5) + 2,
    min: 2,
    max: 6,
    base: [],
    step: { mix: 10, wMin: 0.75, wMax: 1, hMin: 0.25, hMax: 0.75 },
  };

  const bg = {
    mode: 'gradient',
    modeTypes: ['single', 'gradient', 'none'],
    array: [],
    gradient: { angle: 0 },
  };

  const graphics = {
    sortTypes: ['random', 'repeat', 'transition'],
    fillTypes: ['single', 'palette', 'gradient', 'none'],
    strokeTypes: ['single', 'palette', 'gradient', 'none'],
    fill: {
      mode: 'palette',
      sort: 'transition',
      array: [],
      random: [],
      repeat: [],
      transition: { a: [], b: [] },
    },
    stroke: {
      mode: 'none',
      sort: 'random',
      array: [],
      weight: 2,
      dash: 0,
      gap: 20,
      random: [],
      repeat: [],
      transition: { a: [], b: [] },
    },
  };

  const rec = { frame: 0, frameRate: 60, length: { value: 10, min: 1, max: 60 } };
  const recVideo = { active: false, seconds: 4 };

  const resolutions = {
    '2:1': { width: 640, height: 320 },
    '16:9': { width: 640, height: 360 },
    '3:2': { width: 600, height: 400 },
    '4:3': { width: 512, height: 384 },
    '5:4': { width: 600, height: 480 },
    '1:1': { width: 480, height: 480 },
    '4:5': { width: 480, height: 600 },
    '3:4': { width: 384, height: 512 },
    '2:3': { width: 400, height: 600 },
    '9:16': { width: 360, height: 640 },
    '1:2': { width: 320, height: 640 },
  };

  const noiseArray = { x: [], y: [] };
  let simplex = null;
  let formQuality = 0;
  let gForm = null;

  const state = { seed, cnv, form, palette, bg, graphics, rec };

  // ---- Panel UI ----
  const panel = createPanelBuilder({ state, applyChange, refreshVisibility });

  function buildUI() {
    const root = document.getElementById('ri-controls');
    if (!root) return;
    root.innerHTML = '';
    buildPresetSection(root, {
      idPrefix: 'ri',
      presets: PRESETS,
      onExport: exportPreset,
      onImport: importPreset,
    });
    panel.buildSections(root, SECTIONS);
    buildPaletteSection(root);
    panel.buildSections(root, COLOR_SECTIONS);
    // Open Preset + Canvas by default.
    openSections(root, [0, 1]);
    refreshVisibility();
  }

  // Palette section is custom: the number of color pickers follows
  // palette.total, so the picker list rebuilds in place.
  function buildPaletteSection(root) {
    const sec = document.createElement('section');
    sec.className = 'panel-section collapsed';
    sec.innerHTML = `
      <h2 class="section-title"><span>Palette</span>
        <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </h2>
      <div class="section-content">
        <div class="parameter-row">
          <button id="ri-palette-generate" class="btn btn-secondary" style="width:100%;">Generate New Palette</button>
        </div>
        <div class="parameter-row">
          <div class="parameter-header">
            <span class="parameter-label">Colors Total</span>
            <div class="num-input-wrapper">
              <input type="number" class="grafema-num-input" id="ri-palette-total-num" min="2" max="6" step="1" value="${palette.total}">
            </div>
          </div>
          <input type="range" class="custom-slider" id="ri-palette-total" min="2" max="6" step="1" value="${palette.total}">
        </div>
        <div id="ri-palette-colors"></div>
      </div>`;
    sec.querySelector('.section-title').addEventListener('click', () => {
      sec.classList.toggle('collapsed');
    });

    sec.querySelector('#ri-palette-generate').addEventListener('click', (e) => {
      e.stopPropagation();
      randomSeedUpdate();
      getRandomPalette();
      saveState();
    });

    const total = sec.querySelector('#ri-palette-total');
    const totalNum = sec.querySelector('#ri-palette-total-num');
    const onTotal = (v) => {
      const n = parseInt(v, 10);
      if (!Number.isFinite(n) || n < palette.min || n > palette.max) return;
      total.value = n;
      totalNum.value = n;
      palette.total = n;
      while (palette.base.length < n) addRandomColorToPalette(1);
      updateColors();
      rebuildPalettePickers();
      saveState();
    };
    total.addEventListener('input', (e) => onTotal(e.target.value));
    totalNum.addEventListener('input', (e) => onTotal(e.target.value));

    root.appendChild(sec);
    rebuildPalettePickers();
  }

  function rebuildPalettePickers() {
    const holder = document.getElementById('ri-palette-colors');
    if (!holder) return;
    holder.innerHTML = '';
    for (let i = 0; i < palette.total; i++) {
      const row = document.createElement('div');
      row.className = 'parameter-row';
      const hex = String(palette.base[i] || '#000000').slice(0, 7);
      row.innerHTML = `
        <div class="parameter-header"><span class="parameter-label">Color ${i + 1}</span></div>
        <div class="color-picker-wrapper">
          <input type="color" id="ri-palette-color-${i}" value="${hex}">
          <span class="color-code" id="ri-palette-color-${i}-code">${hex.toUpperCase()}</span>
        </div>`;
      const input = row.querySelector('input');
      const code = row.querySelector('.color-code');
      input.addEventListener('input', (e) => {
        updateColorsByPicker(i, e.target.value);
        code.innerText = e.target.value.toUpperCase();
        updateColors();
        saveState();
      });
      holder.appendChild(row);
    }
  }

  function syncPaletteSection() {
    const total = document.getElementById('ri-palette-total');
    const totalNum = document.getElementById('ri-palette-total-num');
    if (total) total.value = palette.total;
    if (totalNum) totalNum.value = palette.total;
    rebuildPalettePickers();
  }

  function applyChange(ctrl) {
    switch (ctrl.id) {
      case 'ri-reset-content':
        cnv.rotate = 0;
        cnv.offset = 0;
        cnv.scale.x = 100;
        cnv.scale.y = 100;
        syncUIFromState();
        break;
      case 'ri-random':
        randomParams();
        return; // randomParams syncs + saves
      case 'ri-fill-shuffle':
        shuffleFill();
        fillColorsUpdate();
        break;
      case 'ri-stroke-shuffle':
        shuffleStroke();
        strokeColorsUpdate();
        break;
      case 'ri-bg-shuffle':
        shuffleBG();
        break;
    }

    switch (ctrl.regen) {
      case 'canvas':
        setupBuffers();
        break;
      case 'arrays':
        fillColorsUpdate();
        strokeColorsUpdate();
        arrayUpdate();
        break;
      case 'noise':
        noiseSeedUpdate();
        break;
      case 'colors':
        updateColors();
        break;
    }
    saveState();
  }

  function refreshVisibility() {
    const show = (id, vis) => {
      const el = document.querySelector(`[data-control-id="${id}"]`);
      if (el) el.style.display = vis ? '' : 'none';
    };
    show('ri-stripe-width', form.type === 'stripes');

    const fm = graphics.fill.mode;
    show('ri-fill-sort', fm !== 'none' && fm !== 'single');
    show('ri-fill-shuffle', fm !== 'none');

    const sm = graphics.stroke.mode;
    show('ri-stroke-sort', sm !== 'none' && sm !== 'single');
    show('ri-stroke-weight', sm !== 'none');
    show('ri-stroke-dash', sm !== 'none');
    show('ri-stroke-gap', sm !== 'none' && graphics.stroke.dash > 0);
    show('ri-stroke-shuffle', sm !== 'none');

    show('ri-bg-angle', bg.mode === 'gradient');
    show('ri-bg-shuffle', bg.mode !== 'none');
  }

  function syncUIFromState() {
    panel.syncUIFromState(SECTIONS);
    panel.syncUIFromState(COLOR_SECTIONS);
    syncPaletteSection();
    refreshVisibility();
  }

  // ---- Seeds & noise ----
  function noiseSeedUpdate() {
    simplex = new SimplexNoise(alea(seed.simplex));
  }

  function randomSeedUpdate() {
    seed.number = Math.floor(Math.random() * MAX_SEED) + 1;
    seed.random = p.round(p.noise(seed.number * 0.034) * seed.number);
    seed.fill = p.round(p.noise(seed.number * 18.1, seed.number * 2.7) * 720);
    seed.stroke = p.round(p.noise(seed.number * 121.4, seed.number * 81.2) * 480);
  }

  // ---- Geometry arrays ----
  function updateQuality() {
    formQuality = form.quality.value;
    if (form.quality.value > 10)
      formQuality = p.round(p.pow(form.quality.value, `1.${form.quality.value}`));
  }

  function arrayUpdate() {
    updateQuality();
    for (let x = 0; x < formQuality; x++) {
      noiseArray.x[x] = [];
      noiseArray.y[x] = [];
      for (let y = 0; y < form.amount.value; y++) {
        noiseArray.x[x][y] = 0;
        noiseArray.y[x][y] = 0;
      }
    }
  }

  // ---- Palette (HSLuv generator + sorting arrays) ----
  function getRandomPalette() {
    p.randomSeed(seed.random);

    const tempColors = [];
    const conv = new Hsluv();
    const num = palette.total;
    const startHue = p.random(0, 360);
    let startSat = p.random(20, 35);
    let startLig = p.random(5, 25);

    if (palette.total === 2) {
      startSat = p.random(30, 70);
      startLig = p.random(15, 60);
    }

    const hueValue = [40, 65, 80, 90, 120, 135, 150, 210, 235, 265];
    const changeHue = hueValue[p.int(p.random(hueValue.length))];

    for (let i = 0; i < palette.total; i++) {
      const hue = p.random(25, changeHue);
      const sat = p.random(70 / num, 130 / num);
      const lig = p.random(60 / num, 110 / num);

      conv.hsluv_h = (startHue + i * hue) % 360;
      conv.hsluv_s = p.min(startSat + i * sat, 100);
      conv.hsluv_l = p.min(startLig + i * lig, 100);
      conv.hsluvToHex();
      tempColors.push(conv.hex);
    }

    if (p.random() < 0.5) tempColors.reverse();

    bg.array = tempColors.slice();
    graphics.fill.array = tempColors.slice();
    graphics.stroke.array = tempColors.slice();
    palette.base = tempColors;
    shuffleBG();
    updateColors();
    syncPaletteSection();
  }

  function updateColors() {
    bgArrayUpdate();
    fillArrayUpdate();
    strokeArrayUpdate();
    fillColorsUpdate();
    strokeColorsUpdate();
    refreshVisibility();
  }

  function fillColorsUpdate() {
    p.randomSeed(seed.fill);
    switch (graphics.fill.sort) {
      case 'random':
        graphics.fill.random = getRandomArrayColors(graphics.fill.array);
        break;
      case 'repeat':
        graphics.fill.repeat = getRepeatArrayColors(graphics.fill.array);
        break;
      case 'transition': {
        const tempArray = getTransitionArrayColors(graphics.fill.array);
        graphics.fill.transition.a = tempArray[0];
        graphics.fill.transition.b = tempArray[1];
        break;
      }
    }
  }

  function strokeColorsUpdate() {
    p.randomSeed(seed.stroke);
    switch (graphics.stroke.sort) {
      case 'random':
        graphics.stroke.random = getRandomArrayColors(graphics.stroke.array);
        break;
      case 'repeat':
        graphics.stroke.repeat = getRepeatArrayColors(graphics.stroke.array);
        break;
      case 'transition': {
        const tempArray = getTransitionArrayColors(graphics.stroke.array);
        graphics.stroke.transition.a = tempArray[0].reverse();
        graphics.stroke.transition.b = tempArray[1].reverse();
        break;
      }
    }
  }

  // Keep a color array in step with palette.total (same logic as the source).
  function resizeColorArray(array) {
    if (array.length > palette.total) {
      const amountToRemove = array.length - palette.total;
      const tempColors = palette.base.slice(palette.total);
      let num = 0;
      do {
        for (let i = 0; i < array.length; i++) {
          if (array[i] === tempColors[num]) {
            array.splice(i, 1);
            i = array.length;
          }
        }
        num++;
      } while (num < amountToRemove);
      // If the overflow colors were edited away, trim from the tail.
      while (array.length > palette.total) array.pop();
    } else if (array.length < palette.total) {
      const max = palette.total - array.length;
      const start = array.length;
      for (let i = 0; i < max; i++) {
        array.push(palette.base[start + i]);
      }
    }
  }

  function bgArrayUpdate() {
    resizeColorArray(bg.array);
  }
  function fillArrayUpdate() {
    resizeColorArray(graphics.fill.array);
  }
  function strokeArrayUpdate() {
    resizeColorArray(graphics.stroke.array);
  }

  function shuffleFill() {
    if (palette.total === 2) {
      [graphics.fill.array[0], graphics.fill.array[1]] = [
        graphics.fill.array[1],
        graphics.fill.array[0],
      ];
    } else {
      p.randomSeed(Math.floor(Math.random() * MAX_SEED) + 1);
      graphics.fill.array = p.shuffle(graphics.fill.array);
    }
  }

  function shuffleStroke() {
    if (palette.total === 2) {
      [graphics.stroke.array[0], graphics.stroke.array[1]] = [
        graphics.stroke.array[1],
        graphics.stroke.array[0],
      ];
    } else {
      p.randomSeed(Math.floor(Math.random() * MAX_SEED) + 1);
      graphics.stroke.array = p.shuffle(graphics.stroke.array);
    }
  }

  function shuffleBG() {
    if (palette.total === 2) {
      [bg.array[0], bg.array[1]] = [bg.array[1], bg.array[0]];
    } else {
      p.randomSeed(Math.floor(Math.random() * MAX_SEED) + 1);
      bg.array = p.shuffle(bg.array);
    }
  }

  function getRandomArrayColors(array) {
    const tempArray = [];
    for (let i = 0; i <= form.amount.max + 1; i++) {
      tempArray[i] = array[p.int(p.random(palette.total))];
    }
    return tempArray;
  }

  function getRepeatArrayColors(array) {
    const tempArray = [];
    const tempP = array.slice(0, palette.total);
    p.shuffle(tempP, true);
    let n = 0;
    for (let i = 0; i <= form.amount.max + 1; i++) {
      tempArray[i] = tempP[n];
      n < tempP.length - 1 ? n++ : (n = 0);
    }
    return tempArray;
  }

  function getTransitionArrayColors(array) {
    const gradientArray = new Gradient();
    gradientArray.setColorGradient(...array.slice(0, palette.total));
    gradientArray.setMidpoint(form.amount.value + 1);
    const tempArray1 = gradientArray.getColors();

    const tempPalette = [];
    let num = p.floor(p.random(palette.total));
    for (let i = 0; i < palette.total; i++) {
      tempPalette[i] = array[num];
      num < palette.total - 1 ? num++ : (num = 0);
    }
    gradientArray.setColorGradient(...tempPalette);
    gradientArray.setMidpoint(form.amount.value + 1);
    const tempArray2 = gradientArray.getColors();
    return [tempArray1, tempArray2];
  }

  function addRandomColorToPalette(count) {
    for (let i = 0; i < count; i++) {
      const one = palette.base[Math.floor(Math.random() * palette.base.length)];
      let two;
      do {
        two = palette.base[Math.floor(Math.random() * palette.base.length)];
      } while (one === two && palette.base.length > 1);

      const middleColor = p.lerpColor(p.color(`${one}`), p.color(`${two}`), 0.5);
      palette.base.push(middleColor.toString('#rrggbb'));
    }
  }

  function updateColorsByPicker(num, value) {
    const changedColor = palette.base[num];
    const replaceIn = (array) => {
      for (let i = 0; i < array.length; i++) {
        if (changedColor === array[i]) {
          array[i] = value;
          break;
        }
      }
    };
    replaceIn(bg.array);
    replaceIn(graphics.fill.array);
    replaceIn(graphics.stroke.array);
    palette.base[num] = value;
  }

  // ---- Random parameters ----
  function randomParams() {
    p.randomSeed(Math.floor(Math.random() * MAX_SEED) + 1);

    cnv.scale.x = p.random() <= 0.5 ? 100 : p.round(p.random(cnv.scale.xMin, cnv.scale.xMax));
    cnv.scale.y = p.random() <= 0.5 ? 100 : p.round(p.random(cnv.scale.yMin, cnv.scale.yMax));
    cnv.rotate = p.random() <= 0.75 ? 0 : p.round(p.random(-36, 36)) * 5;
    cnv.offset = p.random() <= 0.5 ? 0 : p.round(p.random(-25, 25));

    form.type = p.random(form.formTypes);
    form.stripe.width = p.round(p.random(1, 50));
    form.amount.value =
      p.random() <= 0.5
        ? p.round(p.random(form.amount.min, 16))
        : p.round(p.random(form.amount.min, form.amount.max));
    form.quality.value =
      p.random() <= 0.15
        ? p.round(p.random(form.quality.min, 12))
        : p.round(p.random(25, form.quality.max));

    form.amp.y = p.random() <= 0.6 ? p.round(p.random(5, 25), 1) : p.round(p.random(1, 100), 1);
    form.freq.x = p.round(p.random(0, 100), 1);
    form.freq.y = p.round(p.random(0, 100), 1);
    form.speed.y = p.random() <= 0.6 ? p.round(p.random(5, 20), 1) : p.round(p.random(0, 100), 1);

    palette.total = p.round(p.random(palette.min, palette.max));

    bg.mode = p.random(bg.modeTypes.slice(0, -1));
    bg.gradient.angle = p.round(p.random(4)) * 90;

    graphics.fill.mode = p.random(graphics.fillTypes);
    graphics.stroke.mode = p.random(graphics.strokeTypes);

    if (
      (graphics.fill.mode === 'none' && graphics.stroke.mode === 'none') ||
      (graphics.fill.mode === 'single' && graphics.stroke.mode === 'none')
    ) {
      p.random() <= 0.5
        ? (graphics.fill.mode = p.random(graphics.fillTypes.slice(1, -1)))
        : (graphics.stroke.mode = p.random(graphics.strokeTypes.slice(0, -1)));
    }

    graphics.fill.sort = p.random(graphics.sortTypes);
    graphics.stroke.sort = p.random(graphics.sortTypes);
    graphics.stroke.weight = p.random() <= 0.9 ? 2 : p.round(p.random(1, 20));
    graphics.stroke.dash =
      p.random() <= 0.5 ? 0 : p.random() <= 0.5 ? 1 : p.round(p.random(1, 100));
    graphics.stroke.gap = p.random() <= 0.5 ? 0 : p.round(p.random(1, 100));

    rec.length.value =
      p.random() <= 0.5 ? p.round(p.random(1, 12)) : p.round(p.random(1, rec.length.max));

    arrayUpdate();
    noiseSeedUpdate();
    randomSeedUpdate();
    getRandomPalette();
    syncUIFromState();
    saveState();
  }

  // ---- Presets ----
  function applyPreset(preset) {
    if (!preset) return;
    deepMerge(seed, preset.seed);
    deepMerge(cnv, preset.cnv);
    deepMerge(form, preset.form);
    deepMerge(palette, preset.palette);
    deepMerge(bg, preset.bg);
    deepMerge(graphics, preset.graphics);
    if (preset.rec) deepMerge(rec, preset.rec);
    cnv.frame = preset.cnv?.frame ?? 0;

    setupBuffers();
    arrayUpdate();
    noiseSeedUpdate();
    updateColors();
    syncUIFromState();
    saveState();
  }

  function deepMerge(target, src) {
    if (!src || typeof src !== 'object') return;
    for (const key of Object.keys(src)) {
      const v = src[key];
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        deepMerge(target[key], v);
      } else if (Array.isArray(v)) {
        target[key] = v.slice();
      } else {
        target[key] = v;
      }
    }
  }

  // ---- Persistence ----
  function serializeState() {
    return {
      seed: { ...seed },
      cnv: {
        ratio: cnv.ratio,
        rotate: cnv.rotate,
        offset: cnv.offset,
        scale: { x: cnv.scale.x, y: cnv.scale.y },
      },
      form: {
        type: form.type,
        stripe: { width: form.stripe.width },
        amount: { value: form.amount.value },
        quality: { value: form.quality.value },
        amp: { x: form.amp.x, y: form.amp.y },
        freq: { x: form.freq.x, y: form.freq.y },
        speed: { x: form.speed.x, y: form.speed.y },
      },
      palette: { total: palette.total, base: palette.base },
      bg: { mode: bg.mode, array: bg.array, gradient: { angle: bg.gradient.angle } },
      graphics: {
        fill: {
          mode: graphics.fill.mode,
          sort: graphics.fill.sort,
          array: graphics.fill.array,
        },
        stroke: {
          mode: graphics.stroke.mode,
          sort: graphics.stroke.sort,
          array: graphics.stroke.array,
          weight: graphics.stroke.weight,
          dash: graphics.stroke.dash,
          gap: graphics.stroke.gap,
        },
      },
      rec: { length: { value: rec.length.value } },
    };
  }

  let saveTimer = null;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
    }, 500);
  }

  function exportPreset() {
    downloadPresetJSON(`ritmo-preset-${timestamp()}.json`, serializeState());
  }

  function importPreset() {
    openPresetFile(
      (data) => applyPreset(data),
      () => setStatus('Invalid preset file')
    );
  }

  function loadState() {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      deepMerge(seed, data.seed);
      deepMerge(cnv, data.cnv);
      deepMerge(form, data.form);
      deepMerge(palette, data.palette);
      deepMerge(bg, data.bg);
      deepMerge(graphics, data.graphics);
      deepMerge(rec, data.rec);
      return true;
    } catch (e) {
      console.warn('[ritmo] state restore failed:', e);
      return false;
    }
  }

  // ---- Canvas / buffers ----
  function setupBuffers() {
    const res = resolutions[cnv.ratio];
    if (!gForm) {
      gForm = p.createGraphics(res.width, res.height);
      gForm.pixelDensity(cnv.density.base);
    } else if (gForm.width !== res.width || gForm.height !== res.height) {
      // resizeCanvas instead of remove+create: p5.Graphics.remove() throws
      // in instance mode (see the try/catch around recBuffer below).
      gForm.resizeCanvas(res.width, res.height);
    }
  }

  function fitCanvas() {
    const w = canvasContainer.clientWidth || window.innerWidth;
    const h = canvasContainer.clientHeight || window.innerHeight;
    p.resizeCanvas(w, h);
  }

  // ---- Render core ----
  function drawFrame(g) {
    const gw = g.width;
    const gh = g.height;
    g.clear();

    g.noFill();
    g.noStroke();
    bgFunction(g, gw, gh);

    g.push();
    g.translate(gw / 2, gh / 2);
    g.rotate(p.radians(cnv.rotate));
    g.translate(0, gh * p.map(cnv.offset, -50, 50, -0.5, 0.5));

    const frame = cnv.frame / (rec.length.value * rec.frameRate);
    const ampY = map2(form.amp.y, 0, 100, 0, form.amp.max, 'Quadratic', 0);
    const freqX = map2(form.freq.x, 0, 100, 0, form.freq.xmax, 'Quadratic', 0);
    const freqY = map2(form.freq.y, 0, 100, form.freq.ymax, 0, 'Quadratic', 0);
    const speedY = rec.length.value * rec.frameRate * p.map(form.speed.y, 0, 100, 0, 0.005);

    noiseFunction(gw, gh, frame, ampY, freqX, freqY, speedY);
    formFunction(g, gw, gh);

    g.pop();
  }

  function noiseFunction(gw, gh, frame, ampY, freqX, freqY, speedY) {
    let sWidth = 0;
    if (graphics.stroke.mode !== 'none') sWidth = graphics.stroke.weight / gw;

    for (let x = 0; x < formQuality; x++) {
      for (let y = 0; y < form.amount.value; y++) {
        const xPos = p.map(x, 0, formQuality - 1, -0.5 - sWidth, 0.5 + sWidth);
        const yPos = p.map(y, 0, form.amount.value - 1, -0.5, 0.5);

        const warp = getNoise(frame, xPos, yPos, ampY, freqX, freqY, speedY);

        noiseArray.x[x][y] = warp[0] * gw * p.map(cnv.scale.x, 100, 300, 1, 3);
        noiseArray.y[x][y] = warp[1] * gh * p.map(cnv.scale.y, 25, 300, 0.25, 3);
      }
    }
  }

  function getNoise(frame, x, y, ampY, freqX, freqY, speedY) {
    const octave = simplex.noise4D(
      x * freqX,
      y * freqY,
      speedY * p.cos(p.TWO_PI * frame),
      speedY * p.sin(p.TWO_PI * frame)
    );
    y += octave * ampY;
    y = y / (1 + ampY);
    return [x, y];
  }

  // ---- Fill / stroke / bg ----
  function makePaletteGradient(g, gw, gh, sort, colorArrayOne, colorArrayTwo, y) {
    let gradient;
    if (sort === 'transition') {
      gradient = g.drawingContext.createLinearGradient(-gw / 2, 0, gw / 2, 0);
      gradient.addColorStop(0, colorArrayOne[y]);
      gradient.addColorStop(1, colorArrayTwo[y]);
    } else {
      const x1 = (gw / 2) * p.random(palette.step.wMin, palette.step.wMax);
      const y1 = (gh / 2) * p.random(palette.step.hMin, palette.step.hMax);
      const x2 = (gw / 2) * p.random(palette.step.wMin, palette.step.wMax);
      const y2 = (gh / 2) * p.random(palette.step.hMin, palette.step.hMax);

      gradient =
        p.random() > 0.5
          ? g.drawingContext.createLinearGradient(-x1, -y1, x2, y2)
          : g.drawingContext.createLinearGradient(x1, -y1, -x2, y2);

      gradient.addColorStop(0, colorArrayOne[y]);
      gradient.addColorStop(p.random(palette.step.hMin, palette.step.hMax), colorArrayOne[y + 1]);
      gradient.addColorStop(1, colorArrayOne[y + 2]);
    }
    return gradient;
  }

  function fillFunction(g, gw, gh, y, colorArrayOne, colorArrayTwo) {
    p.randomSeed(seed.fill * y);
    switch (graphics.fill.mode) {
      case 'single':
        g.fill(graphics.fill.array[0]);
        break;

      case 'palette':
        g.fill(colorArrayOne[y]);
        break;

      case 'gradient':
        g.fill(0);
        g.drawingContext.fillStyle = makePaletteGradient(
          g,
          gw,
          gh,
          graphics.fill.sort,
          colorArrayOne,
          colorArrayTwo,
          y
        );
        break;
    }
  }

  function strokeFunction(g, gw, gh, y, colorArrayOne, colorArrayTwo) {
    p.randomSeed(seed.stroke * y);
    switch (graphics.stroke.mode) {
      case 'single':
        g.stroke(graphics.stroke.array[1]);
        break;

      case 'palette':
        g.stroke(colorArrayOne[y]);
        break;

      case 'gradient':
        g.stroke(0);
        g.drawingContext.strokeStyle = makePaletteGradient(
          g,
          gw,
          gh,
          graphics.stroke.sort,
          colorArrayOne,
          colorArrayTwo,
          y
        );
        break;
    }
  }

  function bgFunction(g, gw, gh) {
    switch (bg.mode) {
      case 'none':
        g.noFill();
        break;

      case 'single':
        g.fill(bg.array[0]);
        g.rect(0, 0, gw, gh);
        break;

      case 'gradient':
        g.push();
        g.fill(0);
        g.translate(gw / 2, gh / 2);
        g.rotate(p.radians(bg.gradient.angle));

        if (bg.gradient.angle === 0 || bg.gradient.angle === 180)
          drawGradientBG(g, gw * 0.5, gh * 0.5, gw, gh);
        if (bg.gradient.angle === 90 || bg.gradient.angle === 270)
          drawGradientBG(g, gh * 0.5, gw * 0.5, gh, gw);

        g.pop();
        break;
    }
  }

  function drawGradientBG(g, xStart, yStart, xEnd, yEnd) {
    const gradient = g.drawingContext.createLinearGradient(xStart, -yStart, xEnd * 0.5, yEnd * 0.5);
    gradient.addColorStop(0, bg.array[0]);
    gradient.addColorStop(1, bg.array[1]);
    g.drawingContext.fillStyle = gradient;
    g.rect(-xStart, -yStart, xEnd, yEnd);
  }

  // ---- Forms ----
  function formFunction(g, gw, gh) {
    g.push();

    g.noFill();
    g.noStroke();
    g.strokeJoin(p.ROUND);
    g.strokeWeight(graphics.stroke.weight);

    if (graphics.stroke.dash > 0)
      g.drawingContext.setLineDash([graphics.stroke.dash, graphics.stroke.gap]);

    let fillArrayOne, fillArrayTwo;
    switch (graphics.fill.sort) {
      case 'random':
        fillArrayOne = graphics.fill.random;
        break;
      case 'repeat':
        fillArrayOne = graphics.fill.repeat;
        break;
      case 'transition':
        fillArrayOne = graphics.fill.transition.a;
        fillArrayTwo = graphics.fill.transition.b;
        break;
    }

    let strokeArrayOne, strokeArrayTwo;
    switch (graphics.stroke.sort) {
      case 'random':
        strokeArrayOne = graphics.stroke.random;
        break;
      case 'repeat':
        strokeArrayOne = graphics.stroke.repeat;
        break;
      case 'transition':
        strokeArrayOne = graphics.stroke.transition.a;
        strokeArrayTwo = graphics.stroke.transition.b;
        break;
    }

    switch (form.type) {
      case 'waves':
        formWavesShape(g, gw, gh, fillArrayOne, fillArrayTwo, strokeArrayOne, strokeArrayTwo);
        break;
      case 'stripes':
        formStripesShape(g, gw, gh, fillArrayOne, fillArrayTwo, strokeArrayOne, strokeArrayTwo);
        break;
    }
    g.pop();
  }

  function formWavesShape(g, gw, gh, fillArrayOne, fillArrayTwo, strokeArrayOne, strokeArrayTwo) {
    const bottom = p.max(gw, gh);
    for (let y = 0; y < form.amount.value; y++) {
      fillFunction(g, gw, gh, y, fillArrayOne, fillArrayTwo);
      strokeFunction(g, gw, gh, y, strokeArrayOne, strokeArrayTwo);

      g.beginShape();
      for (let x = 0; x < formQuality; x++) g.vertex(noiseArray.x[x][y], noiseArray.y[x][y]);
      g.vertex(noiseArray.x[formQuality - 1][0], p.max(noiseArray.y[formQuality - 1][0], bottom));
      g.vertex(noiseArray.x[0][0], p.max(noiseArray.y[0][0], bottom));
      g.endShape(p.CLOSE);
    }
  }

  function formStripesShape(g, gw, gh, fillArrayOne, fillArrayTwo, strokeArrayOne, strokeArrayTwo) {
    for (let y = 0; y < form.amount.value; y++) {
      g.push();
      g.translate(0, -form.stripe.width / 2);
      fillFunction(g, gw, gh, y, fillArrayOne, fillArrayTwo);
      strokeFunction(g, gw, gh, y, strokeArrayOne, strokeArrayTwo);

      g.beginShape();
      for (let x = 0; x < formQuality; x++) g.vertex(noiseArray.x[x][y], noiseArray.y[x][y]);
      for (let x = formQuality - 1; x >= 0; x--)
        g.vertex(noiseArray.x[x][0], noiseArray.y[x][y] + form.stripe.width);
      g.endShape(p.CLOSE);
      g.pop();
    }
  }

  // ---- Export ----
  function setStatus(msg) {
    const el = document.getElementById('ri-export-status');
    if (el) el.innerText = msg;
  }

  function exportPNG() {
    const res = resolutions[cnv.ratio];
    const buffer = p.createGraphics(res.width, res.height);
    buffer.pixelDensity(cnv.density.export);
    drawFrame(buffer);
    p.saveCanvas(buffer, `ritmo-${timestamp()}`, 'png');
    setTimeout(() => {
      try {
        buffer.remove();
      } catch {
        /* p5 Graphics.remove() can throw in instance mode */
      }
    }, 100);
  }

  async function exportMP4() {
    if (recVideo.active) return;
    recVideo.active = true;
    setStatus('Preparing video…');

    const res = resolutions[cnv.ratio];
    const scale = 2;
    const w = res.width * scale;
    const h = res.height * scale;
    const recBuffer = p.createGraphics(w, h);
    recBuffer.pixelDensity(1);
    recBuffer.imageMode(p.CORNER);

    let encoder;
    try {
      encoder = await (await ensureHME()).createH264MP4Encoder();
    } catch (e) {
      console.error(e);
      setStatus('Video export failed');
      recVideo.active = false;
      return;
    }

    encoder.outputFilename = `ritmo-${timestamp()}.mp4`;
    encoder.width = w;
    encoder.height = h;
    encoder.frameRate = rec.frameRate;
    encoder.quantizationParameter = 22;
    encoder.groupOfPictures = 1;
    encoder.initialize();

    const totalFrames = recVideo.seconds * rec.frameRate;
    const savedFrame = cnv.frame;

    for (let f = 0; f < totalFrames; f++) {
      cnv.frame = Math.round((f / totalFrames) * (rec.length.value * rec.frameRate));
      drawFrame(gForm);
      recBuffer.clear();
      recBuffer.image(gForm, 0, 0, w, h);
      const imageData = recBuffer.drawingContext.getImageData(0, 0, w, h);
      encoder.addFrameRgba(imageData.data);
      if (f % 10 === 0) setStatus(`Encoding ${f}/${totalFrames}`);
      if (f % 15 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    cnv.frame = savedFrame;
    setStatus('Finalizing…');
    try {
      encoder.finalize();
      const uint8 = encoder.FS.readFile(encoder.outputFilename);
      const blob = new Blob([uint8], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = encoder.outputFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('Video exported ✓');
    } catch (e) {
      console.error('[ritmo] MP4 finalize failed:', e);
      setStatus('Video export failed');
    } finally {
      try {
        encoder.delete();
      } catch {
        /* */
      }
      try {
        recBuffer.remove();
      } catch {
        /* */
      }
      recVideo.active = false;
      setTimeout(() => setStatus(''), 3000);
    }
  }

  function bindFooter() {
    document.getElementById('ri-btn-save-png')?.addEventListener('click', exportPNG);
    document.getElementById('ri-btn-save-mp4')?.addEventListener('click', exportMP4);
    document.getElementById('ri-mp4-length')?.addEventListener('change', (e) => {
      recVideo.seconds = parseInt(e.target.value, 10);
    });
    document.getElementById('ri-preset')?.addEventListener('change', (e) => {
      const preset = PRESETS[e.target.value];
      if (preset) applyPreset(preset);
    });
  }

  // ---- p5 lifecycle ----
  p.setup = () => {
    canvasContainer = document.getElementById('ritmo-canvas');
    if (!canvasContainer) return;

    p.createCanvas(
      canvasContainer.clientWidth || window.innerWidth,
      canvasContainer.clientHeight || window.innerHeight
    );
    p.pixelDensity(1);
    p.imageMode(p.CENTER);
    p.frameRate(rec.frameRate);

    setupBuffers();

    const restored = loadState();
    arrayUpdate();
    noiseSeedUpdate();

    fetch(`${import.meta.env.BASE_URL}assets/ritmo/presets.json`)
      .then((r) => r.json())
      .then((data) => {
        PRESETS = data;
        buildUI();
        bindFooter();
        if (restored) {
          setupBuffers();
          updateColors();
          syncUIFromState();
        } else {
          const keys = Object.keys(PRESETS);
          const pick = keys[Math.floor(Math.random() * keys.length)];
          applyPreset(PRESETS[pick]);
          const sel = document.getElementById('ri-preset');
          if (sel) sel.value = pick;
        }
      })
      .catch((e) => console.warn('[ritmo] presets load failed:', e));
  };

  p.draw = () => {
    if (!gForm) return;
    drawFrame(gForm);

    p.clear();
    const scale = Math.min((p.width * 0.85) / gForm.width, (p.height * 0.85) / gForm.height);
    p.image(gForm, p.width / 2, p.height / 2, gForm.width * scale, gForm.height * scale);

    if (cnv.animation) {
      const total = rec.length.value * rec.frameRate;
      cnv.frame >= total ? (cnv.frame = 0) : cnv.frame++;
    }
  };

  p.windowResized = () => {
    if (canvasContainer) fitCanvas();
  };
}
