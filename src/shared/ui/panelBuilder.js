// panelBuilder.js — shared control-panel construction for the workspaces.
// Each workspace passes its own state object,
// applyChange dispatcher and refreshVisibility; per-workspace differences are
// expressed as options instead of forked copies of the same builder:
//   compact sliders   — sections with `compact: true`
//   color style       — 'code' shows a hex label; 'code-upper' also stores the
//                       value uppercased; 'alpha' renders the
//                       #RRGGBBAA picker + alpha slider pair
//   onSliderInput     — extra hook after a slider writes state

/** Reads a dotted path ("params.size.font") from a state object. */
export function getByPath(root, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
}

/** Writes a dotted path on a state object. */
export function setByPath(root, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const obj = keys.reduce((o, k) => o[k], root);
  obj[last] = value;
}

const CHEVRON = `
        <svg class="chevron-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

/**
 * Creates the builder bound to one workspace.
 *
 * @param {Object} opts
 * @param {Object}   opts.state             Shared state object for path reads/writes.
 * @param {Function} opts.applyChange       (ctrl) => void — change dispatcher.
 * @param {Function} opts.refreshVisibility () => void — re-evaluate row visibility.
 * @param {'code'|'code-upper'|'alpha'} [opts.colorStyle='code']
 * @param {Function} [opts.onSliderInput]   (ctrl, n) => void — after state write.
 */
export function createPanelBuilder({
  state,
  applyChange,
  refreshVisibility,
  colorStyle = 'code',
  onSliderInput,
}) {
  function buildControl(ctrl, compact = false) {
    const row = document.createElement('div');
    row.className = compact && ctrl.type === 'slider' ? 'parameter-row compact' : 'parameter-row';
    row.dataset.controlId = ctrl.id;
    if (ctrl.group) row.dataset.group = ctrl.group;
    const val = ctrl.path ? getByPath(state, ctrl.path) : undefined;

    if (ctrl.type === 'slider') {
      if (compact) {
        row.innerHTML = `
          <span class="parameter-label">${ctrl.label}</span>
          <input type="range" class="custom-slider" id="${ctrl.id}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${val}">
          <div class="num-input-wrapper">
            <input type="number" class="grafema-num-input" id="${ctrl.id}-num" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${val}">
          </div>`;
      } else {
        row.innerHTML = `
          <div class="parameter-header">
            <span class="parameter-label">${ctrl.label}</span>
            <div class="num-input-wrapper">
              <input type="number" class="grafema-num-input" id="${ctrl.id}-num" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${val}">
            </div>
          </div>
          <input type="range" class="custom-slider" id="${ctrl.id}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${val}">`;
      }
      const slide = row.querySelector(`#${ctrl.id}`);
      const num = row.querySelector(`#${ctrl.id}-num`);
      slide.addEventListener('input', (e) => {
        const n = parseFloat(e.target.value);
        num.value = n;
        setByPath(state, ctrl.path, n);
        if (onSliderInput) onSliderInput(ctrl, n);
        applyChange(ctrl);
      });
      num.addEventListener('input', (e) => {
        const n = parseFloat(e.target.value);
        if (!Number.isFinite(n)) return;
        slide.value = n;
        setByPath(state, ctrl.path, n);
        if (onSliderInput) onSliderInput(ctrl, n);
        applyChange(ctrl);
      });
    } else if (ctrl.type === 'select') {
      const opts = Object.entries(ctrl.options)
        .map(
          ([label, v]) => `<option value="${v}"${v === val ? ' selected' : ''}>${label}</option>`
        )
        .join('');
      row.innerHTML = `
        <div class="parameter-header"><span class="parameter-label">${ctrl.label}</span></div>
        <select class="grafema-select" id="${ctrl.id}">${opts}</select>`;
      row.querySelector(`#${ctrl.id}`).addEventListener('change', (e) => {
        setByPath(state, ctrl.path, e.target.value);
        applyChange(ctrl);
        refreshVisibility();
      });
    } else if (ctrl.type === 'check') {
      row.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" id="${ctrl.id}"${val ? ' checked' : ''}>
          <span class="custom-checkbox"></span>
          <span>${ctrl.label}</span>
        </label>`;
      row.querySelector(`#${ctrl.id}`).addEventListener('change', (e) => {
        setByPath(state, ctrl.path, e.target.checked);
        applyChange(ctrl);
        refreshVisibility();
      });
    } else if (ctrl.type === 'color') {
      if (colorStyle === 'alpha') {
        // Colors are #RRGGBBAA. <input type=color> only does #RRGGBB, so keep
        // alpha in state and show a separate alpha slider.
        const hex6 = String(val).slice(0, 7);
        const aHex = String(val).length >= 9 ? String(val).slice(7, 9) : 'FF';
        const aVal = parseInt(aHex, 16) / 255;
        row.innerHTML = `
        <div class="parameter-header"><span class="parameter-label">${ctrl.label}</span></div>
        <div class="color-picker-wrapper">
          <input type="color" id="${ctrl.id}" value="${hex6}">
          <input type="range" id="${ctrl.id}-a" min="0" max="1" step="0.01" value="${aVal}" class="custom-slider" style="flex:1; margin-left:8px;" title="Alpha">
        </div>`;
        const update = () => {
          const c = row.querySelector(`#${ctrl.id}`).value;
          const a = parseFloat(row.querySelector(`#${ctrl.id}-a`).value);
          const aH = Math.round(a * 255)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();
          setByPath(state, ctrl.path, c.toUpperCase() + aH);
          applyChange(ctrl);
        };
        row.querySelector(`#${ctrl.id}`).addEventListener('input', update);
        row.querySelector(`#${ctrl.id}-a`).addEventListener('input', update);
      } else {
        const hex =
          colorStyle === 'code-upper'
            ? String(val).slice(0, 7)
            : String(val).startsWith('#')
              ? val
              : '#000000';
        row.innerHTML = `
        <div class="parameter-header"><span class="parameter-label">${ctrl.label}</span></div>
        <div class="color-picker-wrapper">
          <input type="color" id="${ctrl.id}" value="${hex}">
          <span class="color-code" id="${ctrl.id}-code">${hex.toUpperCase()}</span>
        </div>`;
        const code = row.querySelector(`#${ctrl.id}-code`);
        row.querySelector(`#${ctrl.id}`).addEventListener('input', (e) => {
          const stored = colorStyle === 'code-upper' ? e.target.value.toUpperCase() : e.target.value;
          setByPath(state, ctrl.path, stored);
          code.innerText = e.target.value.toUpperCase();
          applyChange(ctrl);
        });
      }
    } else if (ctrl.type === 'text') {
      row.innerHTML = `
        <div class="parameter-header"><span class="parameter-label">${ctrl.label}</span></div>
        <input type="text" class="grafema-text-input" id="${ctrl.id}" value="${String(val).replace(/"/g, '&quot;')}">`;
      row.querySelector(`#${ctrl.id}`).addEventListener('input', (e) => {
        setByPath(state, ctrl.path, e.target.value);
        applyChange(ctrl);
      });
    } else if (ctrl.type === 'button') {
      // Action button: no state path; the workspace dispatches on ctrl.id
      // inside its applyChange.
      row.innerHTML = `<button id="${ctrl.id}" class="btn btn-secondary" style="width:100%;">${ctrl.label}</button>`;
      row.querySelector(`#${ctrl.id}`).addEventListener('click', () => {
        applyChange(ctrl);
        refreshVisibility();
      });
    } else if (ctrl.type === 'icon-button') {
      row.innerHTML = `<button id="${ctrl.id}" class="btn btn-icon" title="${ctrl.label}">${ctrl.icon}</button>`;
      row.querySelector(`#${ctrl.id}`).addEventListener('click', () => {
        applyChange(ctrl);
        refreshVisibility();
      });
    }

    return row;
  }

  /** Builds all SECTIONS into root: collapsible header + control rows. */
  function buildSections(root, sections) {
    for (const section of sections) {
      const sec = document.createElement('section');
      sec.className = 'panel-section';

      const h2 = document.createElement('h2');
      h2.className = 'section-title';
      h2.innerHTML = `<span>${section.title}</span>${CHEVRON}`;
      const content = document.createElement('div');
      content.className = 'section-content';
      sec.classList.add('collapsed');
      h2.addEventListener('click', () => sec.classList.toggle('collapsed'));

      let pairContainer = null;
      for (const ctrl of section.controls) {
        const row = buildControl(ctrl, section.compact);
        if (!row) continue;
        if ((ctrl.type === 'slider' && ctrl.pair) || (ctrl.pair && ctrl.type !== 'slider')) {
          if (!pairContainer) {
            pairContainer = document.createElement('div');
            pairContainer.className = 'parameter-row-group';
            if (ctrl.type === 'icon-button') pairContainer.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:8px;';
            content.appendChild(pairContainer);
          }
          pairContainer.appendChild(row);
        } else {
          pairContainer = null;
          content.appendChild(row);
        }
      }

      sec.appendChild(h2);
      sec.appendChild(content);
      root.appendChild(sec);
    }
  }

  /** Pushes current state values back into the built inputs. */
  function syncUIFromState(sections) {
    for (const section of sections) {
      for (const ctrl of section.controls) {
        const el = document.getElementById(ctrl.id);
        if (!el) continue;
        const val = ctrl.path ? getByPath(state, ctrl.path) : undefined;
        if (ctrl.type === 'slider') {
          el.value = val;
          const num = document.getElementById(`${ctrl.id}-num`);
          if (num) num.value = val;
        } else if (ctrl.type === 'select' || ctrl.type === 'text') {
          el.value = val;
        } else if (ctrl.type === 'check') {
          el.checked = val;
        } else if (ctrl.type === 'color') {
          el.value = String(val).slice(0, 7);
          if (colorStyle === 'alpha') {
            const aEl = document.getElementById(`${ctrl.id}-a`);
            if (aEl)
              aEl.value =
                String(val).length >= 9 ? parseInt(String(val).slice(7, 9), 16) / 255 : 1;
          } else {
            const code = document.getElementById(`${ctrl.id}-code`);
            if (code) code.innerText = String(val).toUpperCase();
          }
        }
      }
    }
  }

  return { buildControl, buildSections, syncUIFromState };
}

/**
 * Preset dropdown section. Keys are humanized: fooBarPreset -> "Foo Bar".
 * Optional onExport/onImport callbacks add an Export/Import button pair.
 */
export function buildPresetSection(root, { idPrefix, presets, onExport, onImport }) {
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  const opts = Object.keys(presets)
    .map((key) => {
      const label = key
        .replace(/Preset$/, '')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
      return `<option value="${key}">${label}</option>`;
    })
    .join('');
  const ioButtons =
    onExport || onImport
      ? `
        <div class="parameter-row" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${onExport ? `<button id="${idPrefix}-preset-export" class="btn btn-secondary">Export</button>` : ''}
          ${onImport ? `<button id="${idPrefix}-preset-import" class="btn btn-secondary">Import</button>` : ''}
        </div>`
      : '';
  sec.innerHTML = `
      <h2 class="section-title"><span>Preset</span></h2>
      <div class="section-content">
        <div class="parameter-row">
          <div class="parameter-header"><span class="parameter-label">Preset List</span></div>
          <select class="grafema-select" id="${idPrefix}-preset">${opts}</select>
        </div>${ioButtons}
      </div>`;
  if (onExport) sec.querySelector(`#${idPrefix}-preset-export`).addEventListener('click', onExport);
  if (onImport) sec.querySelector(`#${idPrefix}-preset-import`).addEventListener('click', onImport);
  root.appendChild(sec);
}

/** Font section: List (catalog) vs Custom (upload) toggle + font picker. */
export function buildFontSection(root, { idPrefix, fontList, font, accept }) {
  const sec = document.createElement('section');
  sec.className = 'panel-section';
  const fontOpts = fontList
    .map((f) => `<option value="${f}"${f === font.name ? ' selected' : ''}>${f}</option>`)
    .join('');
  sec.innerHTML = `
      <h2 class="section-title"><span>Font</span>${CHEVRON}
      </h2>
      <div class="section-content">
        <div class="mode-selector" id="${idPrefix}-font-mode" style="margin-bottom:12px;">
          <button class="mode-btn${font.mode === 'list' ? ' active' : ''}" data-mode="list"><span>List</span></button>
          <button class="mode-btn${font.mode === 'custom' ? ' active' : ''}" data-mode="custom"><span>Custom</span></button>
        </div>
        <div class="parameter-row" id="${idPrefix}-font-list-row">
          <div class="parameter-header"><span class="parameter-label">Choose Font</span></div>
          <select class="grafema-select" id="${idPrefix}-font-list">${fontOpts}</select>
        </div>
        <div class="parameter-row" id="${idPrefix}-font-custom-row">
          <button id="${idPrefix}-font-upload" class="btn btn-secondary" style="width:100%;">Load Local Font</button>
          <span class="color-code" id="${idPrefix}-font-custom-name" style="display:block; margin-top:6px;">${font.customName || 'no file'}</span>
        </div>
        <input type="file" id="${idPrefix}-font-input" accept="${accept}" style="display:none;">
      </div>`;
  root.appendChild(sec);
}

/** Expands the panel sections at the given indices (the rest stay collapsed). */
export function openSections(root, indices) {
  const sections = root.querySelectorAll('.panel-section');
  indices.forEach((i) => {
    if (sections[i]) sections[i].classList.remove('collapsed');
  });
}
