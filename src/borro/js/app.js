// BORRO — blurred form grids with shader post-processing.
// Pipeline: forms grid -> gForm (2D, HSB, per-form ctx.filter blur + blend) ->
// blurBuffer (framebuffer + gaussian/brightness/contrast shader) ->
// grainBuffer (WEBGL graphics + grain shader) -> main WEBGL canvas composite.
// `Color` (colorjs) is loaded per-workspace by main.js before setup() runs.

import { createMap2 } from '../../ritmo/js/map2.js';
import { SECTIONS } from './controls.js';
import { baseVert, blurFrag, grainFrag } from './shaders.js';
import { safeStorage } from '../../shared/utils/storage.js';
import { ensureHME } from '../../shared/utils/lazyLibs.js';
import { timestamp } from '../../shared/utils/datetime.js';
import {
  createPanelBuilder,
  buildPresetSection,
  openSections,
} from '../../shared/ui/panelBuilder.js';

const STORAGE_KEY = 'borro-tool';
const MAX_SEED = 10000;
let PRESETS = {};

export function borroSketch(p) {
  let canvasContainer;
  const map2 = createMap2(p);

  // ---- State ----
  const cnv = {
    ratio: '1:1',
    blend: 'SOFT_LIGHT',
    frame: 0,
    animation: true,
    density: { base: 2 },
    scale: { x: 0.0, y: 0.0 },
    seed: { base: Math.floor(Math.random() * MAX_SEED), max: MAX_SEED },
  };

  const svg = { seed: 500, sort: 'random', shape: [], temp: [] };

  const form = {
    type: 'form',
    count: { max: 10, x: 6, y: 6 },
    corners: { type: 'uniform', seed: 100, level: 0 },
    size: {
      type: 'canvas',
      seed: 1,
      uni: 1,
      x: 0.0,
      y: 0.0,
      min: 5,
      random: { mode: 'uniform', x: 0, y: 0 },
    },
    angle: { mode: 'random', seed: 200, random: 0, range: 0 },
    offset: { seed: 10, random: 0, x: -0.25, y: -0.25 },
    blur: { seed: 5, freq: 0.0, range: { min: 0, max: 0 }, max: 150 },
    blend: { seed: 25, freq: 0.0, range: { min: 0, max: 0.4 } },
  };

  const post = {
    blur: { radius: 0 },
    color: { brightness: 0.0, contrast: 1.0 },
    grain: { scale: 0.8, opacity: 0.2, freq: 0.1, contrast: 0.2, brightness: 0.5 },
  };

  const palette = {
    type: 'generative',
    defined: { array: [], max: 150 },
    custom: {
      index: 1,
      array: ['#3c2706', '#7a5649', '#cc3904', '#e5cf0a', '#faf5c6'],
      color: {
        0: '#3c2706',
        1: '#7a5649',
        2: '#cc3904',
        3: '#e5cf0a',
        4: '#faf5c6',
      },
    },
    bg: { seed: 50, color: '#FFFFFF', type: 'random' },
    offset: { x: 0.5, y: 0.5, z: 0.5 },
    amp: { x: 0.5, y: 0.5, z: 0.5 },
    freq: { x: 1.0, y: 1.0, z: 1.0 },
    phase: { x: 0.0, y: 0.33, z: 0.67 },
  };

  const rec = { frame: 0, frameRate: 60, length: { value: 10, min: 1, max: 60 } };
  const recVideo = { active: false, seconds: 4 };

  const resolutions = {
    '2:1': { width: 480, height: 240 },
    '16:9': { width: 640, height: 360 },
    '3:2': { width: 480, height: 320 },
    '4:3': { width: 480, height: 360 },
    '5:4': { width: 600, height: 480 },
    '1:1': { width: 480, height: 480 },
    '4:5': { width: 480, height: 600 },
    '3:4': { width: 360, height: 480 },
    '2:3': { width: 320, height: 480 },
    '9:16': { width: 360, height: 640 },
    '1:2': { width: 240, height: 480 },
  };

  const forms = [];
  let simplex = null;
  let gForm = null;
  let blurBuffer = null;
  let blurShader = null;
  let grainBuffer = null;
  let grainShader = null;
  let palettesArray = null;
  let isReady = false;

  const state = { cnv, svg, form, post, palette, rec };

  // ---- Panel UI ----
  const panel = createPanelBuilder({
    state,
    applyChange,
    refreshVisibility,
    colorStyle: 'code-upper',
  });

  function buildUI() {
    const root = document.getElementById('bo-controls');
    if (!root) return;
    root.innerHTML = '';
    buildPresetSection(root, { idPrefix: 'bo', presets: PRESETS });
    panel.buildSections(root, SECTIONS);
    openSections(root, [0, 1]);
    refreshVisibility();
  }

  function applyChange(ctrl) {
    switch (ctrl.id) {
      case 'bo-random':
        randomParams();
        return;
      case 'bo-random-count':
        randomCount();
        break;
      case 'bo-random-size':
        randomSize();
        break;
      case 'bo-random-offset':
        randomOffset();
        break;
      case 'bo-random-angle':
        randomAngle();
        break;
      case 'bo-random-blur':
        randomBlur();
        break;
      case 'bo-random-blend':
        randomBlend();
        break;
      case 'bo-random-palette':
        generateColorPalette();
        syncUIFromState();
        break;
      case 'bo-populate':
        populateColors();
        break;
      case 'bo-shuffle-colors':
        shuffleColors();
        break;
      case 'bo-bg-color':
        palette.bg.type = 'custom';
        syncUIFromState();
        break;
    }

    switch (ctrl.regen) {
      case 'canvas':
        updateCanvas();
        break;
      case 'buffers':
        createPostBuffers();
        break;
      case 'seed':
        seedEvent();
        break;
      case 'bg':
        updateColorBG();
        syncUIFromState();
        break;
      case 'forms':
        if (isReady) createForms();
        break;
      case 'palette':
        updatePalette();
        syncUIFromState();
        break;
    }
    saveState();
  }

  function refreshVisibility() {
    const show = (id, vis) => {
      const el = document.querySelector(`[data-control-id="${id}"]`);
      if (el) el.style.display = vis ? '' : 'none';
    };
    const isCustomShape = form.type === 'custom';
    show('bo-svg-sort', isCustomShape);
    show('bo-svg-seed', isCustomShape);

    show('bo-corners-level', form.corners.type === 'uniform' && !isCustomShape);
    show('bo-corners-seed', form.corners.type === 'random' && !isCustomShape);
    show('bo-corners-type', !isCustomShape);

    const uniformSize = form.size.type === 'uniform';
    show('bo-size-uni', uniformSize);
    show('bo-size-x', !uniformSize);
    show('bo-size-y', !uniformSize);
    const uniRandom = form.size.random.mode === 'uniform';
    show('bo-size-random-x', true);
    show('bo-size-random-y', !uniRandom);

    show('bo-angle-random', form.angle.mode === 'random');

    show('bo-palette-index', palette.type === 'defined');
    show('bo-populate', palette.type === 'defined');
    for (let i = 0; i < 5; i++) show(`bo-color-${i}`, palette.type === 'custom');
    show('bo-shuffle-colors', palette.type === 'custom');
    const gen = palette.type === 'generative';
    ['x', 'y', 'z'].forEach((axis) => {
      show(`bo-off-${axis}`, gen);
      show(`bo-amp-${axis}`, gen);
      show(`bo-freq-${axis}`, gen);
      show(`bo-phase-${axis}`, gen);
    });
    show('bo-random-palette', gen);

    show('bo-bg-color', palette.bg.type === 'custom');
  }

  function syncUIFromState() {
    panel.syncUIFromState(SECTIONS);
    refreshVisibility();
  }

  // ---- Program functions ----
  function seedEvent() {
    simplex = new SimplexNoise(alea(cnv.seed.base));
    p.randomSeed(cnv.seed.base);
    updateColorBG();
    createForms();
  }

  // ---- Canvas & buffers ----
  function fitSize() {
    const res = resolutions[cnv.ratio];
    const boxW = (canvasContainer.clientWidth || window.innerWidth) * 0.9;
    const boxH = (canvasContainer.clientHeight || window.innerHeight) * 0.9;
    const aspect = res.width / res.height;
    let w = boxW;
    let h = w / aspect;
    if (h > boxH) {
      h = boxH;
      w = h * aspect;
    }
    return { width: Math.floor(w), height: Math.floor(h) };
  }

  function updateCanvas() {
    const size = fitSize();
    p.resizeCanvas(size.width, size.height);
    p.pixelDensity(cnv.density.base);
    p.imageMode(p.CENTER);
    p.noStroke();

    if (gForm) {
      try {
        gForm.remove();
      } catch {
        /* p5 Graphics.remove() can throw in instance mode */
      }
    }
    gForm = p.createGraphics(p.width, p.height);
    gForm.pixelDensity(1);
    gForm.imageMode(p.CENTER);
    gForm.rectMode(p.CENTER);
    gForm.colorMode(p.HSB, 360, 100, 100, 100);
    gForm.angleMode(p.DEGREES);
    gForm.noStroke();

    createPostBuffers();

    if (isReady) createForms();
  }

  function createPostBuffers() {
    // Grain buffer: separate WEBGL graphics with its own shader.
    if (grainBuffer) {
      try {
        grainBuffer.remove();
      } catch {
        /* see above */
      }
    }
    const grainW = Math.max(1, Math.floor(p.width / post.grain.scale));
    const grainH = Math.max(1, Math.floor(p.height / post.grain.scale));
    grainBuffer = p.createGraphics(grainW, grainH, p.WEBGL);
    grainBuffer.setAttributes({ antialias: false });
    grainBuffer.pixelDensity(cnv.density.base);
    grainBuffer.noSmooth();
    grainBuffer.noStroke();
    grainShader = grainBuffer.createShader(baseVert, grainFrag);

    // Blur framebuffer on the main canvas; shrinks as the radius grows so a
    // big gaussian stays cheap (the shader upsamples back).
    const radius = post.blur.radius;
    const w = map2(radius, 0, 30, gForm.width, Math.floor(gForm.width * 0.1), 'Exponential', 1);
    const h = map2(radius, 0, 30, gForm.height, Math.floor(gForm.height * 0.1), 'Exponential', 1);
    blurBuffer = p.createFramebuffer({
      width: Math.max(1, Math.floor(w)),
      height: Math.max(1, Math.floor(h)),
      density: cnv.density.base,
      format: p.FLOAT,
    });
    blurShader = p.createShader(baseVert, blurFrag);
  }

  // ---- Forms ----
  function createForms() {
    gForm.randomSeed(cnv.seed.base);
    forms.length = 0;
    let index = 0;
    for (let row = 0; row < form.count.y; row++) {
      for (let col = 0; col < form.count.x; col++) {
        forms.push(new Form(col, row, index));
        index++;
      }
    }
    gForm.shuffle(forms, true);
  }

  function drawForms(frame) {
    gForm.reset();
    gForm.clear();
    gForm.randomSeed(cnv.seed.base);
    cnv.blend === 'XOR'
      ? (gForm.drawingContext.globalCompositeOperation = 'xor')
      : gForm.blendMode(p[cnv.blend]);
    gForm.translate(gForm.width * 0.5, gForm.height * 0.5);
    gForm.scale(1 + cnv.scale.x, 1 + cnv.scale.y);

    let formColor = 'generativeColor';
    let usePalette;
    if (palette.type === 'defined') {
      formColor = 'customColor';
      usePalette = palette.defined.array;
    } else if (palette.type === 'custom') {
      formColor = 'customColor';
      usePalette = palette.custom.array;
    }

    let formSize = 'formSize';
    let formDisplay = 'formDisplay';
    if (form.type === 'custom' && svg.shape.length !== 0) {
      formSize = 'customSize';
      formDisplay = 'customDisplay';
    }

    const size = { x: form.size.x, y: form.size.y };
    if (form.size.type === 'uniform') {
      size.x = form.size.uni;
      size.y = form.size.uni;
    }

    for (let i = 0; i < forms.length; i++) {
      gForm.push();
      forms[i].formCoords();
      forms[i].formAngle(frame);
      forms[i][formSize](size);
      forms[i].formBlur(frame);
      forms[i][formColor](frame, usePalette);
      forms[i][formDisplay]();
      gForm.pop();
    }
  }

  class Form {
    constructor(row, col, index) {
      this.index = { number: index, x: row, y: col };
      this.coords = { x: 0, y: 0 };
      this.position = { x: 0, y: 0 };

      this.size = {
        x: 0,
        y: 0,
        random: {
          x: form.size.random.x,
          y: form.size.random.mode === 'independent' ? form.size.random.y : form.size.random.x,
        },
      };

      this.corners = {
        level: 0,
        random: simplex.noise2D(form.corners.seed + this.index.number * 1.5, -72341.8),
      };

      this.scale = {
        x:
          form.size.type === 'canvas'
            ? gForm.width / form.count.x
            : Math.min(gForm.width, gForm.height) / 2,
        y:
          form.size.type === 'canvas'
            ? gForm.height / form.count.y
            : Math.min(gForm.width, gForm.height) / 2,
        random: {
          x: p.map(simplex.noise2D(form.size.seed + this.index.number, -3197.1), -1, 1, 0.5, -1.5),
          y: p.map(simplex.noise2D(form.size.seed + this.index.number, 218910.7), -1, 1, 0.5, -1.5),
        },
      };
      if (form.size.random.mode === 'uniform') this.scale.random.y = this.scale.random.x;

      this.svg = { index: 0 };
      if (svg.shape.length > 1) {
        switch (svg.sort) {
          case 'random': {
            const noiseIndexSVG = p.map(
              simplex.noise2D(
                svg.seed + this.index.number * 19.4,
                -5548.2 + this.index.number * 7.17
              ),
              -1,
              1,
              0,
              1
            );
            this.svg.index = Math.floor(noiseIndexSVG * svg.shape.length);
            break;
          }
          case 'asc':
            this.svg.index = index % svg.shape.length;
            break;
          case 'desc':
            this.svg.index = Math.abs(svg.shape.length - 1 - (index % svg.shape.length));
            break;
        }
      }

      this.shape = {
        path: svg.shape.length === 0 ? new Path2D() : new Path2D(svg.shape[this.svg.index].path),
        x:
          svg.shape.length === 0
            ? 0
            : this.scale.x /
              Math.max(svg.shape[this.svg.index].width, svg.shape[this.svg.index].height),
        y:
          svg.shape.length === 0
            ? 0
            : this.scale.y /
              Math.max(svg.shape[this.svg.index].width, svg.shape[this.svg.index].height),
        width: svg.shape.length === 0 ? 0 : svg.shape[this.svg.index].width / 2,
        height: svg.shape.length === 0 ? 0 : svg.shape[this.svg.index].height / 2,
      };

      this.angle = {
        rotate: 0,
        random: p.map(
          simplex.noise2D(form.angle.seed + this.index.number, 54216.1),
          -1,
          1,
          -form.angle.random * 180,
          form.angle.random * 180
        ),
      };

      if (form.angle.mode === 'right') {
        const angle = p.map(
          simplex.noise2D(form.angle.seed + this.index.number, 15951.4),
          -1,
          1,
          0,
          4
        );
        this.angle.random = Math.floor(angle) * 90;
      }

      this.offset = {
        xrand: simplex.noise2D(form.offset.seed + this.index.number, 81943.4),
        yrand: simplex.noise2D(form.offset.seed * 7.1 + this.index.number, 5092.5),
        x: 0,
        y: 0,
      };

      this.blur = {
        quality: gForm.pixelDensity(),
        freq: p.map(
          simplex.noise2D(form.blur.seed - 2081.7 + this.index.number * 2.8, 7212.3),
          -1,
          1,
          0.001,
          0.01
        ),
        noise: p.map(
          simplex.noise2D(form.blur.seed + 627.8 + this.index.number * 11.4, -11501.2),
          -1,
          1,
          -1000,
          1000
        ),
        start: p.map(
          simplex.noise2D(form.blur.seed + 1793.5 + this.index.number * 3.1, 39702.7),
          -1,
          1,
          0,
          form.blur.range.min
        ),
        range: p.map(
          simplex.noise2D(form.blur.seed - 8521.2 + this.index.number * 6.3, 1532.7),
          -1,
          1,
          form.blur.range.min,
          form.blur.range.max
        ),
      };
    }

    formCoords() {
      const posX = (gForm.width / form.count.x) * 0.5;
      const posY = (gForm.height / form.count.y) * 0.5;
      this.position.x =
        p.map(this.index.x, 0, form.count.x, -gForm.width * 0.5, gForm.width * 0.5) + posX;
      this.position.y =
        p.map(this.index.y, 0, form.count.y, -gForm.height * 0.5, gForm.height * 0.5) + posY;
      const offsetX =
        this.position.x <= gForm.width * 0.5
          ? this.position.x * form.offset.x
          : -this.position.x * form.offset.x;
      const offsetY =
        this.position.y <= gForm.height * 0.5
          ? this.position.y * form.offset.y
          : -this.position.y * form.offset.y;
      this.offset.x = offsetX + gForm.width * 0.25 * this.offset.xrand * form.offset.random;
      this.offset.y = offsetY + gForm.height * 0.25 * this.offset.yrand * form.offset.random;
      this.coords.x = this.position.x + this.offset.x;
      this.coords.y = this.position.y + this.offset.y;
    }

    formAngle() {
      this.angle.rotate = form.angle.range + this.angle.random;
    }

    formSize(size) {
      const xscale = this.scale.x * (size.x + this.scale.random.x * this.size.random.x);
      const yscale = this.scale.y * (size.y + this.scale.random.y * this.size.random.y);
      this.size.x = Math.max(form.size.min, xscale);
      this.size.y = Math.max(form.size.min, yscale);

      const maxCorner = Math.max(this.size.x, this.size.y);
      let corners = p.map(form.corners.level, 0, 100, 0, maxCorner);
      if (form.corners.type === 'random')
        corners = map2(this.corners.random, -0.95, 0.95, -5, maxCorner, 'Cubic', 0);
      this.corners.level = Math.max(0, Math.min(corners, maxCorner));
    }

    customSize(size) {
      this.size.x = Math.max(form.size.min / 100, size.x + this.scale.random.x * this.size.random.x);
      this.size.y = Math.max(form.size.min / 100, size.y + this.scale.random.y * this.size.random.y);
    }

    formBlur(frame) {
      const blurFreq = rec.length.value * rec.frameRate * this.blur.freq * form.blur.freq;
      const noiseBlur = simplex.noise3D(
        this.blur.noise,
        blurFreq * Math.cos(p.TWO_PI * frame),
        blurFreq * Math.sin(p.TWO_PI * frame)
      );
      const blur = map2(
        this.blur.start + p.map(noiseBlur, -1, 1, 0, this.blur.range),
        0,
        form.blur.max,
        0,
        form.blur.max,
        'Sinusoidal',
        2
      );
      if (form.blur.range.max !== 0)
        gForm.drawingContext.filter = 'blur(' + String(blur * this.blur.quality) + 'px)';
    }

    generativeColor(frame) {
      const colorRange = form.blend.range.max - form.blend.range.min;
      const freqMin = p.map(colorRange, 0, 1, 0.0008, 0.0002);
      const freqMax = p.map(colorRange, 0, 1, 0.008, 0.002);

      const colorRandomRange = p.map(
        simplex.noise2D(form.blend.seed + this.index.number * 0.1, -61712.7),
        -1,
        1,
        0,
        colorRange
      );
      const colorStart = p.map(
        simplex.noise2D(form.blend.seed + this.index.number * 8.2, 2612.7),
        -1,
        1,
        form.blend.range.min * Math.PI,
        form.blend.range.max * Math.PI
      );
      const noiseStart = p.map(
        simplex.noise2D(form.blend.seed + this.index.number * 1.0, 19511.2),
        -1,
        1,
        0,
        p.TWO_PI
      );
      const noiseFreq = p.map(
        simplex.noise2D(form.blend.seed + this.index.number * 10.1, -13542.5),
        -1,
        1,
        freqMin * form.blend.freq,
        freqMax * form.blend.freq
      );
      const colorNoiseFreq = rec.length.value * rec.frameRate * noiseFreq;

      const simplexColor = simplex.noise3D(
        noiseStart,
        colorNoiseFreq * Math.cos(p.TWO_PI * frame),
        colorNoiseFreq * Math.sin(p.TWO_PI * frame)
      );
      const blend = generatePalette(
        colorStart + simplexColor * colorRandomRange,
        palette.offset,
        palette.amp,
        palette.freq,
        palette.phase
      );

      gForm.fill(blend);
    }

    customColor(frame, usePalette) {
      const blendFreq = p.map(form.blend.freq, 0, 1, 0, 0.0012);
      const colorFreq = rec.length.value * rec.frameRate * blendFreq;

      const noiseColor = simplex.noise3D(
        form.blend.seed + this.index.number * 21.7,
        colorFreq * Math.cos(p.TWO_PI * frame),
        colorFreq * Math.sin(p.TWO_PI * frame)
      );
      const noiseIndex = p.map(noiseColor, -1, 1, form.blend.range.min, form.blend.range.max);
      const blend = getInterpolatedColor(noiseIndex, usePalette);

      gForm.fill(blend);
    }

    formDisplay() {
      gForm.translate(this.coords.x, this.coords.y);
      gForm.rotate(this.angle.rotate);
      gForm.rect(0, 0, this.size.x, this.size.y, this.corners.level);
    }

    customDisplay() {
      gForm.translate(this.coords.x, this.coords.y);
      gForm.scale(this.size.x, this.size.y);
      gForm.scale(this.shape.x, this.shape.y);
      gForm.rotate(this.angle.rotate);
      gForm.translate(-this.shape.width, -this.shape.height);
      gForm.drawingContext.fill(this.shape.path, 'evenodd');
    }
  }

  // ---- Palette / colors ----
  function updatePalette() {
    switch (palette.type) {
      case 'generative':
        break;
      case 'defined':
        if (palettesArray) palette.defined.array = palettesArray[palette.custom.index - 1] || [];
        break;
      case 'custom': {
        const customColors = [];
        for (let i = 0; i < Object.keys(palette.custom.color).length; i++) {
          customColors.push(palette.custom.color[i]);
        }
        palette.custom.array = customColors;
        break;
      }
    }
    updateColorBG();
  }

  function populateColors() {
    palette.custom.array = [];
    for (let i = 0; i < palette.defined.array.length; i++) {
      palette.custom.color[i] = palette.defined.array[i];
    }
    palette.type = 'custom';
    updatePalette();
    syncUIFromState();
  }

  function shuffleColors() {
    p.shuffle(palette.custom.array, true);
    for (let i = 0; i < palette.custom.array.length; i++) {
      palette.custom.color[i] = palette.custom.array[i];
    }
    updateColorBG();
    syncUIFromState();
  }

  function updateColorBG() {
    if (palette.bg.type === 'custom') return;
    if (!simplex) return;

    const lchBg = (hex) => {
      const hue = new Color(hex).to('lch');
      const light = p.map(simplex.noise2D(-352.6, 819.2), -1, 1, 0.84, 0.99);
      const chroma = p.map(simplex.noise2D(8731.1, 7325.3), -1, 1, 0, 0.11);
      return new Color('oklch', [light, chroma, hue.h]).toString({ format: 'hex' });
    };

    switch (palette.type) {
      case 'generative': {
        const genIndex = p.map(simplex.noise2D(-7158.2, -8391.2), -1, 1, 0, p.TWO_PI);
        const bgRandom = generatePalette(
          genIndex,
          palette.offset,
          palette.amp,
          palette.freq,
          palette.phase
        );
        const genHex = rgbToHex(bgRandom.levels);
        const genHue = new Color(genHex).to('lch');
        const genLight = p.map(simplex.noise2D(-23054.1, 9081.4), -1, 1, 0.84, 0.99);
        const genColor = p.map(simplex.noise2D(71536.2, -17623.1), -1, 1, 0, 0.11);
        palette.bg.color = new Color('oklch', [genLight, genColor, genHue.h]).toString({
          format: 'hex',
        });
        break;
      }
      case 'defined': {
        if (!palette.defined.array.length) break;
        const idx = p.floor(
          p.map(simplex.noise2D(-12452.6, -2814.8), -1, 1, 0, palette.defined.array.length)
        );
        palette.bg.color = lchBg(palette.defined.array[idx]);
        break;
      }
      case 'custom': {
        const idx = p.floor(
          p.map(simplex.noise2D(-12452.6, -2814.8), -1, 1, 0, palette.custom.array.length)
        );
        palette.bg.color = lchBg(palette.custom.array[idx]);
        break;
      }
    }
  }

  function generateColorPalette() {
    palette.offset.x = Math.random() < 0.4 ? 0.1 + Math.random() * 0.8 : 0.5;
    palette.offset.y = Math.random() < 0.4 ? 0.1 + Math.random() * 0.8 : 0.5;
    palette.offset.z = Math.random() < 0.4 ? 0.1 + Math.random() * 0.8 : 0.5;

    palette.amp.x = Math.random() < 0.4 ? 0.1 + Math.random() * 0.8 : 0.5;
    palette.amp.y = Math.random() < 0.4 ? 0.1 + Math.random() * 0.8 : 0.5;
    palette.amp.z = Math.random() < 0.4 ? 0.1 + Math.random() * 0.8 : 0.5;

    palette.freq.x = Math.random() * map2(Math.random(), 0, 1, 0, p.HALF_PI, 'Sqrt', 0);
    palette.freq.y = Math.random() * map2(Math.random(), 0, 1, 0, p.HALF_PI, 'Sqrt', 0);
    palette.freq.z = Math.random() * map2(Math.random(), 0, 1, 0, p.HALF_PI, 'Sqrt', 0);
    palette.phase.x = Math.random() * 2 - 1;
    palette.phase.y = Math.random() * 2 - 1;
    palette.phase.z = Math.random() * 2 - 1;

    updateColorBG();
  }

  function getInterpolatedColor(noiseValue, paletteArr) {
    if (!paletteArr || !paletteArr.length) return '#000000';
    const scaledIndex = noiseValue * (paletteArr.length - 1);
    const lowerIndex = Math.max(0, p.floor(scaledIndex));
    const upperIndex = (lowerIndex + 1) % paletteArr.length;
    const index = p.fract(scaledIndex);

    const colorA = new Color(paletteArr[lowerIndex]);
    const colorB = new Color(paletteArr[upperIndex]);
    const mixedColor = colorA.range(colorB, { space: 'lch' });
    return mixedColor(index).toString({ format: 'hex' });
  }

  function generatePalette(t, a, b, c, d) {
    const vec3 = (x, y, z) => ({ x, y, z });
    const addVec3 = (v1, v2) => vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    const cosVec3 = (v) => vec3(Math.cos(v.x), Math.cos(v.y), Math.cos(v.z));
    const mulVec3 = (v, s) => vec3(v.x * s, v.y * s, v.z * s);
    const mulCw = (v1, v2) => vec3(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z);

    const term1 = addVec3(d, mulCw(c, vec3(t, t, t)));
    const term2 = cosVec3(mulVec3(term1, p.TWO_PI));
    const result = addVec3(a, mulCw(b, term2));

    return p.color(result.x * 255, result.y * 255, result.z * 255);
  }

  function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }

  function rgbToHex(c) {
    return '#' + componentToHex(c[0]) + componentToHex(c[1]) + componentToHex(c[2]);
  }

  // ---- Random settings ----
  function randomCount() {
    form.corners.seed = Math.floor(Math.random() * MAX_SEED);
    svg.seed = Math.floor(Math.random() * MAX_SEED);
    form.corners.type = Math.random() < 0.5 ? 'random' : 'uniform';
    form.corners.level = Math.random() <= 0.5 ? 0 : 100;
    form.corners.level =
      Math.random() <= 0.5 ? form.corners.level : map2(Math.random(), 0, 1, 0, 100, 'Quadratic', 0);
    form.count.x = p.floor(map2(Math.random(), 0, 1, 1, form.count.max, 'Sqrt', 2));
    form.count.y =
      Math.random() < 0.5
        ? form.count.x
        : p.floor(map2(Math.random(), 0, 1, 1, form.count.max, 'Sqrt', 2));
    if (isReady) createForms();
    syncUIFromState();
  }

  function randomSize() {
    form.size.type = Math.random() < 0.5 ? 'uniform' : Math.random() < 0.5 ? 'canvas' : 'default';
    form.size.seed = Math.floor(Math.random() * MAX_SEED);
    form.size.random.mode = Math.random() < 0.5 ? 'independent' : 'uniform';
    form.size.random.x = Math.random() < 0.25 ? 0 : map2(Math.random(), 0, 1, 0, 1, 'Quadratic', 1);
    form.size.random.y = Math.random() < 0.25 ? 0 : map2(Math.random(), 0, 1, 0, 1, 'Quadratic', 1);
    form.size.uni = Math.random() < 0.2 ? 1 : Math.random() * 2;
    form.size.x = Math.random() < 0.2 ? 1 : Math.random() * 2;
    form.size.y = Math.random() < 0.2 ? 1 : Math.random() * 2;
    if (isReady) createForms();
    syncUIFromState();
  }

  function randomAngle() {
    form.angle.mode = Math.random() < 0.3 ? 'right' : 'random';
    form.angle.seed = Math.floor(Math.random() * MAX_SEED);
    form.angle.range = Math.random() < 0.5 ? 0 : Math.random() * 360 - 180;
    form.angle.random = Math.random() < 0.5 ? 0 : Math.random();
    if (isReady) createForms();
    syncUIFromState();
  }

  function randomOffset() {
    form.offset.seed = Math.floor(Math.random() * MAX_SEED);
    form.offset.random = Math.random() < 0.25 ? 0 : map2(Math.random(), 0, 1, 0, 1, 'Sqrt', 2);
    form.offset.x = Math.random() < 0.1 ? 0 : map2(Math.random(), 0, 1, 0, -1, 'Circular', 0);
    form.offset.y = Math.random() < 0.1 ? 0 : map2(Math.random(), 0, 1, 0, -1, 'Circular', 0);
    if (isReady) createForms();
    syncUIFromState();
  }

  function randomBlur() {
    form.blur.seed = Math.floor(Math.random() * MAX_SEED);
    form.blur.range.max = map2(Math.random(), 0, 1, 2, form.blur.max - 30, 'Sqrt', 2);
    form.blur.range.min =
      form.blur.range.max === 0
        ? 0
        : map2(Math.random(), 0, 1, 0, form.blur.range.max, 'Quintic', 0);
    form.blur.freq = form.blur.range.max === 0 ? 0 : Math.random() < 0.1 ? 0 : Math.random();
    if (isReady) createForms();
    syncUIFromState();
  }

  function randomBlend() {
    form.blend.seed = Math.floor(Math.random() * MAX_SEED);
    form.blend.range.max = map2(Math.random(), 0, 1, 0, 1, 'Sqrt', 2);
    form.blend.range.min =
      Math.random() < 0.2 ? 0 : map2(Math.random(), 0, 1, 0, form.blend.range.max, 'Quintic', 0);
    form.blend.freq = form.blend.range.max === 0 ? 0 : Math.random() < 0.2 ? 0 : Math.random();
    if (isReady) createForms();
    syncUIFromState();
  }

  function randomParams() {
    cnv.seed.base = Math.floor(Math.random() * MAX_SEED);

    const ratios = Object.keys(resolutions);
    cnv.ratio = Math.random() < 0.5 ? '1:1' : ratios[Math.floor(Math.random() * ratios.length)];

    const blends = [
      'BLEND',
      'ADD',
      'SCREEN',
      'OVERLAY',
      'MULTIPLY',
      'LIGHTEST',
      'DARKEST',
      'HARD_LIGHT',
      'SOFT_LIGHT',
      'EXCLUSION',
      'DIFFERENCE',
      'XOR',
    ];
    cnv.blend = Math.random() < 0.5 ? 'BLEND' : 'SOFT_LIGHT';
    cnv.blend = Math.random() < 0.5 ? cnv.blend : blends[Math.floor(Math.random() * blends.length)];

    updateCanvas();
    randomCount();
    randomSize();
    randomOffset();
    randomAngle();
    randomBlur();
    randomBlend();
    generateColorPalette();
    seedEvent();
    syncUIFromState();
    saveState();
  }

  // ---- Presets ----
  function applyPreset(preset) {
    if (!preset) return;
    deepMerge(cnv, preset.cnv);
    deepMerge(svg, preset.svg);
    deepMerge(form, preset.form);
    deepMerge(post, preset.post);
    deepMerge(palette, preset.palette);
    if (preset.rec) deepMerge(rec, preset.rec);
    cnv.frame = 0;

    // Preset svg shapes may store the path as an array of segments.
    if (preset.svg?.shape !== undefined) {
      svg.shape = JSON.parse(JSON.stringify(preset.svg.shape));
      svg.shape.forEach((item) => {
        if (Array.isArray(item.path)) item.path = item.path.join(' ');
      });
      if (svg.shape.length > 0) svg.temp = svg.shape;
    }
    if (svg.shape.length === 0 && svg.temp.length !== 0) svg.shape = svg.temp;

    updatePalette();
    updateCanvas();
    seedEvent();
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
        target[key] = JSON.parse(JSON.stringify(v));
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
          ratio: cnv.ratio,
          blend: cnv.blend,
          scale: { x: cnv.scale.x, y: cnv.scale.y },
          seed: { base: cnv.seed.base },
        },
        svg: { seed: svg.seed, sort: svg.sort, shape: svg.shape },
        form,
        post,
        palette: {
          type: palette.type,
          custom: palette.custom,
          bg: palette.bg,
          offset: palette.offset,
          amp: palette.amp,
          freq: palette.freq,
          phase: palette.phase,
        },
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
      deepMerge(svg, data.svg);
      deepMerge(form, data.form);
      deepMerge(post, data.post);
      deepMerge(palette, data.palette);
      deepMerge(rec, data.rec);
      return true;
    } catch (e) {
      console.warn('[borro] state restore failed:', e);
      return false;
    }
  }

  // ---- Export ----
  function setStatus(msg) {
    const el = document.getElementById('bo-export-status');
    if (el) el.innerText = msg;
  }

  function exportPNG() {
    p.saveCanvas(`borro-${timestamp()}`, 'png');
  }

  async function exportMP4() {
    if (recVideo.active) return;
    recVideo.active = true;
    setStatus('Preparing video…');

    // Read the WEBGL canvas through a 2D buffer (getImageData needs a 2D ctx).
    const w = p.width * cnv.density.base;
    const h = p.height * cnv.density.base;
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

    encoder.outputFilename = `borro-${timestamp()}.mp4`;
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
      console.error('[borro] MP4 export failed:', e);
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
    document.getElementById('bo-btn-save-png')?.addEventListener('click', exportPNG);
    document.getElementById('bo-btn-save-mp4')?.addEventListener('click', exportMP4);
    document.getElementById('bo-mp4-length')?.addEventListener('change', (e) => {
      recVideo.seconds = parseInt(e.target.value, 10);
    });
    document.getElementById('bo-preset')?.addEventListener('change', (e) => {
      const preset = PRESETS[e.target.value];
      if (preset) applyPreset(preset);
    });
  }

  // ---- Composite ----
  function drawComposite() {
    p.clear();
    grainBuffer.clear();

    p.background(p.color(palette.bg.color));

    const frame = cnv.frame / (rec.length.value * rec.frameRate);
    drawForms(frame);

    blurBuffer.draw(() => {
      p.clear();
      p.shader(blurShader);
      const sigma = 1 + post.blur.radius / 1.3;
      blurShader.setUniform('iResolution', [blurBuffer.width, blurBuffer.height]);
      blurShader.setUniform('iPixelDensity', p.pixelDensity());
      blurShader.setUniform('iCanvas', gForm);
      blurShader.setUniform('iRadius', [
        post.blur.radius * p.pixelDensity(),
        post.blur.radius * p.pixelDensity(),
      ]);
      blurShader.setUniform('iSigma', sigma * p.pixelDensity());
      blurShader.setUniform('iBrightness', post.color.brightness);
      blurShader.setUniform('iContrast', post.color.contrast);
      p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
    });

    grainBuffer.shader(grainShader);
    grainShader.setUniform('iCanvas', grainBuffer);
    grainShader.setUniform('iPixelDensity', grainBuffer.pixelDensity());
    grainShader.setUniform('iTime', frame);
    grainShader.setUniform(
      'iMult',
      p.ceil(p.map(p.round(post.grain.freq, 3), 0, 1, 0, rec.length.value))
    );
    grainShader.setUniform('iOpacity', post.grain.opacity);
    grainShader.setUniform('iBright', p.map(post.grain.brightness, 0.1, 1, 1, 0.1));
    grainShader.setUniform('iContrast', map2(post.grain.contrast, 0.1, 1, 0.5, 10, 'Cubic', 0));
    grainBuffer.rect(0, 0, grainBuffer.width, grainBuffer.height);

    p.image(blurBuffer, 0, 0, p.width, p.height);
    p.image(grainBuffer, 0, 0, p.width, p.height);
  }

  // ---- p5 lifecycle ----
  p.setup = () => {
    canvasContainer = document.getElementById('borro-canvas');
    if (!canvasContainer) return;

    const size = { width: 480, height: 480 };
    p.createCanvas(size.width, size.height, p.WEBGL);
    p.frameRate(rec.frameRate);

    const restored = loadState();
    updateCanvas();
    seedEvent();
    isReady = true;

    // Palettes and presets load async in parallel.
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}assets/borro/palettes.json`).then((r) => r.json()),
      fetch(`${import.meta.env.BASE_URL}assets/borro/presets.json`).then((r) => r.json()),
    ])
      .then(([palettesData, presetsData]) => {
        palettesArray = Object.values(palettesData);
        PRESETS = presetsData;
        buildUI();
        bindFooter();
        if (restored) {
          updatePalette();
          createForms();
          syncUIFromState();
        } else {
          const keys = Object.keys(PRESETS);
          const pick = keys[Math.floor(Math.random() * keys.length)];
          applyPreset(PRESETS[pick]);
          const sel = document.getElementById('bo-preset');
          if (sel) sel.value = pick;
        }
        if (palette.type === 'defined') {
          updatePalette();
          createForms();
        }
      })
      .catch((e) => console.warn('[borro] assets load failed:', e));
  };

  p.draw = () => {
    if (!gForm || !blurBuffer || !grainBuffer) return;
    drawComposite();
    if (cnv.animation) {
      const total = rec.length.value * rec.frameRate;
      cnv.frame >= total ? (cnv.frame = 0) : cnv.frame++;
    }
  };

  p.windowResized = () => {
    if (canvasContainer && isReady) updateCanvas();
  };
}
