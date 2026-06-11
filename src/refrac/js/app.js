// REFRAC — image displacement studio.
// Source photo -> gForm framebuffer (textured rect) -> displacement filter
// shader (box / flow / sine) -> refract grid filter -> WEBGL canvas composite
// over a custom color or checkerboard-transparent background.

import { createMap2 } from '../../ritmo/js/map2.js';
import { SECTIONS } from './controls.js';
import { boxShaderCode, flowShaderCode, sineShaderCode, refractShaderCode } from './shaders.js';
import { safeStorage } from '../../shared/utils/storage.js';
import { ensureHME } from '../../shared/utils/lazyLibs.js';
import { timestamp } from '../../shared/utils/datetime.js';
import {
  createPanelBuilder,
  buildPresetSection,
  openSections,
} from '../../shared/ui/panelBuilder.js';

const STORAGE_KEY = 'refrac-tool';
let PRESETS = {};

const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1532690261466-909b35d13f57',
  'https://images.unsplash.com/photo-1684298892790-aa1cbc2e3711',
  'https://images.unsplash.com/photo-1702306258947-162c0847db0c',
  'https://images.unsplash.com/photo-1567041747112-3f000732e361',
  'https://images.unsplash.com/photo-1506459225024-1428097a7e18',
  'https://images.unsplash.com/photo-1701621368096-50ef9c2fddef',
  'https://images.unsplash.com/photo-1567193528962-75ed7b575b76',
  'https://images.unsplash.com/photo-1701927460927-57af32b7e2f0',
  'https://images.unsplash.com/photo-1561478908-d067fe75a553',
  'https://images.unsplash.com/photo-1560958900-9b0e5f362382',
  'https://images.unsplash.com/photo-1559305616-ea1ba66035be',
  'https://images.unsplash.com/photo-1678769479329-2dd2adbd47d6',
  'https://images.unsplash.com/photo-1608048608029-99c772d199ed',
  'https://images.unsplash.com/photo-1647724063451-9092baa0f6f6',
  'https://images.unsplash.com/photo-1701329967792-8434ac9bb331',
  'https://images.unsplash.com/photo-1692649141362-a3be26b9747a',
  'https://images.unsplash.com/photo-1608209098851-e82b613e843c',
  'https://images.unsplash.com/photo-1449496967047-2a322e78ec26',
  'https://images.unsplash.com/photo-1698430484131-efc9f5ccba1a',
  'https://images.unsplash.com/photo-1698428059245-ba79cfe77030',
  'https://images.unsplash.com/photo-1509114397022-ed747cca3f65',
  'https://images.unsplash.com/photo-1696429738131-bb4123db6b66',
  'https://images.unsplash.com/photo-1519806390608-acf7ef9c8d1b',
  'https://images.unsplash.com/photo-1564591514815-114bbed2944c',
];

export function refracSketch(p) {
  let canvasContainer;
  const map2 = createMap2(p);

  // ---- State ----
  const cnv = {
    img: null,
    frame: 0,
    animation: true,
    wrap: 'MIRROR',
    scale: { x: 1, y: 1 },
    bg: { mode: 'custom', custom: '#FFFFFF' },
    image: { size: 2048, min: 1024, max: 4096 },
  };

  const seed = { value: Math.floor(Math.random() * 1000) + 1, x: 0, y: 0, max: 1000 };

  const displace = {
    type: 'none',
    box: {
      amp: { x: 20, y: 20 },
      freq: { x: 20, y: 20 },
      speed: { x: 15, y: 10 },
    },
    flow: {
      octaves: 3,
      octavesMax: 5,
      freq: 15,
      amp: { x: 20, y: 5 },
      speed: { x: 10, y: 15 },
    },
    sine: {
      amp: { x: 30, y: 30 },
      freq: { x: 25, y: 25 },
      cycle: { x: 0, y: 1 },
    },
  };

  const refract = {
    type: 'none',
    level: { x: 0.25, y: 0.25 },
    grid: { x: 20, y: 20 },
  };

  const rec = { frame: 0, frameRate: 60, length: { value: 5, min: 1, max: 60 } };
  const recVideo = { active: false, seconds: 4 };

  let simplex = null;
  let gForm = null;
  let alphaImg = null;
  let sineShader = null;
  let boxShader = null;
  let flowShader = null;
  let refractShader = null;
  let isLoadingImage = true;
  let isReady = false;

  const state = { cnv, seed, displace, refract, rec };

  // ---- Panel UI ----
  const panel = createPanelBuilder({
    state,
    applyChange,
    refreshVisibility,
    colorStyle: 'code-upper',
  });

  function buildUI() {
    const root = document.getElementById('re-controls');
    if (!root) return;
    root.innerHTML = '';
    buildPresetSection(root, { idPrefix: 're', presets: PRESETS });
    panel.buildSections(root, SECTIONS);
    openSections(root, [0, 1, 2]);
    refreshVisibility();
  }

  function applyChange(ctrl) {
    switch (ctrl.id) {
      case 're-random-image':
        loadRandomImage();
        break;
    }
    switch (ctrl.regen) {
      case 'seed':
        seedEvent();
        break;
      case 'image':
        loadRandomImage();
        break;
    }
    saveState();
  }

  function refreshVisibility() {
    const show = (id, vis) => {
      const el = document.querySelector(`[data-control-id="${id}"]`);
      if (el) el.style.display = vis ? '' : 'none';
    };

    show('re-bg-color', cnv.bg.mode === 'custom');

    const t = displace.type;
    ['amp-x', 'amp-y', 'freq-x', 'freq-y', 'speed-x', 'speed-y'].forEach((s) =>
      show(`re-box-${s}`, t === 'box')
    );
    ['octaves', 'freq', 'amp-x', 'amp-y', 'speed-x', 'speed-y'].forEach((s) =>
      show(`re-flow-${s}`, t === 'flow')
    );
    ['amp-x', 'amp-y', 'freq-x', 'freq-y', 'cycle-x', 'cycle-y'].forEach((s) =>
      show(`re-sine-${s}`, t === 'sine')
    );
    show('re-seed', t === 'box' || t === 'flow');

    const r = refract.type === 'grid';
    show('re-refract-level-x', r);
    show('re-refract-level-y', r);
    show('re-refract-grid-x', r);
    show('re-refract-grid-y', r);
  }

  function syncUIFromState() {
    panel.syncUIFromState(SECTIONS);
    refreshVisibility();
  }

  // ---- Seeds / image ----
  function seedEvent() {
    simplex = new SimplexNoise(alea(seed.value));
    seed.x = simplex.noise2D(13.24 / seed.value, 213.343) * 1000;
    seed.y = simplex.noise2D(-122.977, -16.221 * seed.value) * 1000;
  }

  function adjustImageSize(img, maxImageSize) {
    if (Math.max(img.width, img.height) > maxImageSize) {
      const scale = maxImageSize / Math.max(img.width, img.height);
      img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
    }
    return img;
  }

  function loadDefaultImage() {
    isLoadingImage = true;
    p.loadImage(
      `${import.meta.env.BASE_URL}assets/refrac/default-image.webp`,
      (img) => {
        cnv.img = adjustImageSize(img, cnv.image.size);
        updateCanvas();
        isLoadingImage = false;
      },
      (e) => console.error('[refrac] default image failed:', e)
    );
  }

  function loadRandomImage() {
    isLoadingImage = true;
    const url =
      UNSPLASH_IMAGES[Math.floor(Math.random() * UNSPLASH_IMAGES.length)] +
      '?q=85&w=' +
      cnv.image.size;
    p.loadImage(
      url,
      (img) => {
        cnv.img = adjustImageSize(img, cnv.image.size);
        updateCanvas();
        isLoadingImage = false;
      },
      () => {
        console.warn('[refrac] unsplash image failed, falling back to default');
        loadDefaultImage();
      }
    );
  }

  // ---- Canvas / buffers ----
  function fitCanvasCSS() {
    if (!cnv.img) return;
    const boxW = (canvasContainer.clientWidth || window.innerWidth) * 0.9;
    const boxH = (canvasContainer.clientHeight || window.innerHeight) * 0.9;
    const aspect = cnv.img.width / cnv.img.height;
    let w = boxW;
    let h = w / aspect;
    if (h > boxH) {
      h = boxH;
      w = h * aspect;
    }
    const canvasEl = p.canvas;
    canvasEl.style.width = Math.floor(w) + 'px';
    canvasEl.style.height = Math.floor(h) + 'px';
  }

  function updateCanvas() {
    if (!cnv.img) return;
    // Canvas at image resolution; CSS scales it down to fit the viewport.
    p.resizeCanvas(cnv.img.width, cnv.img.height);
    p.pixelDensity(1);
    fitCanvasCSS();

    if (alphaImg) {
      try {
        alphaImg.remove();
      } catch {
        /* p5 Graphics.remove() can throw in instance mode */
      }
    }
    alphaImg = createAlphaImage(cnv.img.width, cnv.img.height, 1);

    gForm = p.createFramebuffer({
      width: cnv.img.width,
      height: cnv.img.height,
      density: 1,
      format: p.FLOAT,
    });

    sineShader = p.createFilterShader(sineShaderCode);
    flowShader = p.createFilterShader(flowShaderCode);
    boxShader = p.createFilterShader(boxShaderCode);
    refractShader = p.createFilterShader(refractShaderCode);
  }

  // Transparency checkerboard (same construction as the other tools).
  function createAlphaImage(width, height, density) {
    const buffer = p.createGraphics(width, height);
    buffer.pixelDensity(density);
    buffer.noStroke();
    buffer.push();
    buffer.fill(255);
    buffer.rect(0, 0, width, height);

    const size = (height + width) / 100;
    let xBool = true;
    let yBool;
    const modY = height % size;
    const modX = width % size;
    const divY = modY / (height / size);
    const divX = modX / (width / size);

    for (let y = 0; y < height - modY; y += size + divY) {
      xBool = !xBool;
      yBool = xBool;
      for (let x = 0; x < width - modX; x += size + divX) {
        yBool = !yBool;
        buffer.fill(yBool ? 255 : 220);
        buffer.rect(x, y, size + divX, size + divY);
      }
    }
    buffer.pop();
    return buffer;
  }

  // ---- Filters ----
  function addBoxFilter(frame, totalFrames) {
    const xSpeed = totalFrames * p.map(displace.box.speed.x, 0, 100, 0, 0.005);
    const ySpeed = totalFrames * p.map(displace.box.speed.y, 0, 100, 0, 0.005);
    const xAmp = p.map(displace.box.amp.x, 0, 100, 0, 0.5);
    const yAmp = p.map(displace.box.amp.y, 0, 100, 0, 0.5);
    const xFreq = map2(displace.box.freq.x, 0, 100, 0, 100, 'Quadratic', 0);
    const yFreq = map2(displace.box.freq.y, 0, 100, 0, 100, 'Quadratic', 0);

    boxShader.setUniform('tex0', gForm);
    boxShader.setUniform('seed', [seed.x, seed.y]);
    boxShader.setUniform('amp', [xAmp, yAmp]);
    boxShader.setUniform('freq', [xFreq, yFreq]);
    boxShader.setUniform('xTime', [
      xSpeed * Math.sin(p.TWO_PI * frame),
      xSpeed * Math.cos(p.TWO_PI * frame),
    ]);
    boxShader.setUniform('yTime', [
      ySpeed * Math.sin(p.TWO_PI * frame),
      ySpeed * Math.cos(p.TWO_PI * frame),
    ]);

    p.filter(boxShader);
  }

  function addFlowFilter(frame, totalFrames) {
    const xSpeed = totalFrames * p.map(displace.flow.speed.x, 0, 100, 0, 0.005);
    const ySpeed = totalFrames * p.map(displace.flow.speed.y, 0, 100, 0, 0.005);
    const xAmp = p.map(displace.flow.amp.x, 0, 100, 0, 0.5);
    const yAmp = p.map(displace.flow.amp.y, 0, 100, 0, 0.5);
    const freq = map2(displace.flow.freq, 0, 100, 0, 100, 'Quadratic', 0);

    flowShader.setUniform('tex0', gForm);
    flowShader.setUniform('freq', freq);
    flowShader.setUniform('octaves', displace.flow.octaves - 1);
    flowShader.setUniform('seed', [seed.x, seed.y]);
    flowShader.setUniform('amp', [xAmp, yAmp]);
    flowShader.setUniform('xTime', [
      xSpeed * Math.sin(p.TWO_PI * frame),
      xSpeed * Math.cos(p.TWO_PI * frame),
    ]);
    flowShader.setUniform('yTime', [
      ySpeed * Math.sin(p.TWO_PI * frame),
      ySpeed * Math.cos(p.TWO_PI * frame),
    ]);

    p.filter(flowShader);
  }

  function addSineFilter(frame) {
    const xAmp = map2(displace.sine.amp.x, 0, 100, 0, 0.25, 'Quadratic', 0);
    const yAmp = map2(displace.sine.amp.y, 0, 100, 0, 0.25, 'Quadratic', 0);
    const xFreq = map2(displace.sine.freq.x, 0, 100, 0, 100, 'Quadratic', 0);
    const yFreq = map2(displace.sine.freq.y, 0, 100, 0, 100, 'Quadratic', 0);

    sineShader.setUniform('tex0', gForm);
    sineShader.setUniform('amp', [xAmp, yAmp]);
    sineShader.setUniform('freq', [xFreq, yFreq]);
    sineShader.setUniform('cycle', [displace.sine.cycle.x, displace.sine.cycle.y]);
    sineShader.setUniform('time', frame);

    p.filter(sineShader);
  }

  function addRefractFilter() {
    refractShader.setUniform('tex0', gForm);
    refractShader.setUniform('grid', [refract.grid.x, refract.grid.y]);
    refractShader.setUniform('amp', [refract.level.x, refract.level.y]);

    p.filter(refractShader);
  }

  // ---- Composite ----
  function drawComposite() {
    p.clear();

    if (cnv.bg.mode === 'transparent') {
      p.image(alphaImg, 0, 0, p.width, p.height);
    } else {
      p.background(cnv.bg.custom);
    }

    const totalFrames = rec.length.value * rec.frameRate;
    const frame = cnv.frame / totalFrames;

    gForm.draw(() => {
      p.clear();
      p.textureWrap(p[cnv.wrap], p[cnv.wrap]);
      p.texture(cnv.img);
      p.scale(cnv.scale.x, cnv.scale.y);
      p.rect(-gForm.width / 2, -gForm.height / 2, gForm.width, gForm.height);

      switch (displace.type) {
        case 'box':
          addBoxFilter(frame, totalFrames);
          break;
        case 'flow':
          addFlowFilter(frame, totalFrames);
          break;
        case 'sine':
          addSineFilter(frame);
          break;
      }

      if (refract.type !== 'none') {
        addRefractFilter();
      }
    });

    p.image(gForm, 0, 0, p.width, p.height);
  }

  // ---- Presets ----
  function applyPreset(preset) {
    if (!preset) return;
    deepMerge(cnv, { ...preset.cnv, img: undefined });
    deepMerge(seed, preset.seed);
    deepMerge(displace, preset.displace);
    deepMerge(refract, preset.refract);
    if (preset.rec) deepMerge(rec, preset.rec);
    cnv.frame = preset.cnv?.frame ?? 0;

    seedEvent();
    syncUIFromState();
    saveState();
  }

  function deepMerge(target, src) {
    if (!src || typeof src !== 'object') return;
    for (const key of Object.keys(src)) {
      const v = src[key];
      if (v === undefined) continue;
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
  let saveTimer = null;
  function saveState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const data = {
        cnv: {
          wrap: cnv.wrap,
          scale: cnv.scale,
          bg: cnv.bg,
          image: { size: cnv.image.size },
          animation: cnv.animation,
        },
        seed: { value: seed.value },
        displace,
        refract,
        rec: { length: { value: rec.length.value } },
      };
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 500);
  }

  function loadState() {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      deepMerge(cnv, data.cnv);
      deepMerge(seed, data.seed);
      deepMerge(displace, data.displace);
      deepMerge(refract, data.refract);
      deepMerge(rec, data.rec);
      return true;
    } catch (e) {
      console.warn('[refrac] state restore failed:', e);
      return false;
    }
  }

  // ---- Export ----
  function setStatus(msg) {
    const el = document.getElementById('re-export-status');
    if (el) el.innerText = msg;
  }

  function exportPNG() {
    p.saveCanvas(`refrac-${timestamp()}`, 'png');
  }

  async function exportMP4() {
    if (recVideo.active || !cnv.img) return;
    recVideo.active = true;
    setStatus('Preparing video…');

    const w = p.width - (p.width % 2);
    const h = p.height - (p.height % 2);
    const copy = document.createElement('canvas');
    copy.width = w;
    copy.height = h;
    const copyCtx = copy.getContext('2d');

    let encoder;
    try {
      encoder = await (await ensureHME()).createH264MP4Encoder();
    } catch (e) {
      console.error(e);
      setStatus('Video export failed');
      recVideo.active = false;
      return;
    }

    encoder.outputFilename = `refrac-${timestamp()}.mp4`;
    encoder.width = w;
    encoder.height = h;
    encoder.frameRate = rec.frameRate;
    encoder.quantizationParameter = 22;
    encoder.groupOfPictures = 1;
    encoder.initialize();

    const totalFrames = recVideo.seconds * rec.frameRate;
    const savedFrame = cnv.frame;
    const savedAnimation = cnv.animation;
    cnv.animation = false;

    try {
      for (let f = 0; f < totalFrames; f++) {
        cnv.frame = Math.round((f / totalFrames) * (rec.length.value * rec.frameRate));
        drawComposite();
        copyCtx.clearRect(0, 0, w, h);
        copyCtx.drawImage(p.canvas, 0, 0, w, h);
        const imageData = copyCtx.getImageData(0, 0, w, h);
        encoder.addFrameRgba(imageData.data);
        if (f % 10 === 0) setStatus(`Encoding ${f}/${totalFrames}`);
        if (f % 15 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      setStatus('Finalizing…');
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
      console.error('[refrac] MP4 export failed:', e);
      setStatus('Video export failed');
    } finally {
      try {
        encoder.delete();
      } catch {
        /* */
      }
      cnv.frame = savedFrame;
      cnv.animation = savedAnimation;
      recVideo.active = false;
      setTimeout(() => setStatus(''), 3000);
    }
  }

  function bindFooter() {
    document.getElementById('re-btn-save-png')?.addEventListener('click', exportPNG);
    document.getElementById('re-btn-save-mp4')?.addEventListener('click', exportMP4);
    document.getElementById('re-mp4-length')?.addEventListener('change', (e) => {
      recVideo.seconds = parseInt(e.target.value, 10);
    });
    document.getElementById('re-preset')?.addEventListener('change', (e) => {
      const preset = PRESETS[e.target.value];
      if (preset) applyPreset(preset);
    });
  }

  // ---- p5 lifecycle ----
  p.setup = () => {
    canvasContainer = document.getElementById('refrac-canvas');
    if (!canvasContainer) return;

    p.createCanvas(480, 480, p.WEBGL);
    p.pixelDensity(1);
    p.imageMode(p.CENTER);
    p.noStroke();
    p.frameRate(rec.frameRate);

    const restored = loadState();
    seedEvent();
    isReady = true;
    loadDefaultImage();

    fetch(`${import.meta.env.BASE_URL}assets/refrac/presets.json`)
      .then((r) => r.json())
      .then((data) => {
        PRESETS = data;
        buildUI();
        bindFooter();
        if (!restored) {
          const keys = Object.keys(PRESETS);
          const pick = keys[Math.floor(Math.random() * keys.length)];
          applyPreset(PRESETS[pick]);
          const sel = document.getElementById('re-preset');
          if (sel) sel.value = pick;
        } else {
          syncUIFromState();
        }
      })
      .catch((e) => console.warn('[refrac] presets load failed:', e));
  };

  p.draw = () => {
    if (isLoadingImage || !cnv.img || !gForm) return;
    drawComposite();
    if (cnv.animation) {
      const total = rec.length.value * rec.frameRate;
      cnv.frame >= total ? (cnv.frame = 0) : cnv.frame++;
    }
  };

  p.windowResized = () => {
    if (canvasContainer && isReady) fitCanvasCSS();
  };
}
