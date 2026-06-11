// COPO — kaleidoscopic flake patterns from points
// sampled on a grid, driven by 4D simplex noise with branch symmetry, swirl,
// pattern tiling and parametric/image masks. Renders into gForm (2D buffer)
// composited over a custom color or checkerboard-transparent background.
// `paper` (SVG export) is loaded per-workspace by main.js before setup().

import { easeFunctions } from './ease.js';
import { shapeTypesData } from './shapes.js';
import { SECTIONS } from './controls.js';
import { PRESETS } from './presets.js';
import { safeStorage } from '../../shared/utils/storage.js';
import { ensureHME } from '../../shared/utils/lazyLibs.js';
import { timestamp } from '../../shared/utils/datetime.js';
import { saveSVG } from '../../shared/utils/svgDownload.js';
import {
  createPanelBuilder,
  buildPresetSection,
  openSections,
} from '../../shared/ui/panelBuilder.js';

const STORAGE_KEY = 'copo-tool';

export function copoSketch(p) {
  let canvasContainer;

  // ---- State ----
  const seed = { value: 0, max: 100000 };
  const simplex = { base: null };

  const cnv = {
    density: { base: 2, export: 4 },
    scale: 0.9,
    ratio: '1:1',
    animation: false,
    frame: 0,
    bg: { mode: 'custom', custom: '#FFFFFF' },
  };

  const params = {
    count: { value: 5000, min: 500, max: 16000, step: 25 },
    grid: { x: 2, y: 2 },
    scale: { value: 2.5, power: 1.4, easeType: 'none', easeOffset: 0.5 },
    stroke: { width: 1, scale: false, minWidth: 0.25, maxWidth: 3 },
    color: {
      mixed: 0.5,
      style: 'fill',
      blend: 'source-over',
      type: 'transition',
      base: '#0055ff',
    },
    branch: { amount: 4, amountMax: 10, angle: 1, symmetry: 'standard' },
    freq: {
      mode: 'sin',
      easeType: 'none',
      easeOffset: 0,
      layers: 12,
      minLayers: 2,
      maxLayers: 16,
      base: 0.55,
      amp: 0.3,
    },
    swirl: { mode: 'none', base: 0, amp: 0.25, freq: 0.25 },
    rotate: { mult: -0.17, shape: 0.17 },
    motion: { mode: 'noise', amp: 20 },
  };

  const pattern = {
    seed: { value: 0, random: 0 },
    cells: { x: 1, y: 1 },
    offset: { x: 0, y: 0 },
    rotate: 0,
  };

  const mask = {
    mode: 'none',
    branchMode: 'ignore',
    branch: 0,
    maxBranch: 12,
    branchRound: false,
    margin: { min: 0.25, max: 0.9 },
    image: {
      data: null,
      temp: null,
      scale: 1,
      brightness: 0,
      contrast: 1,
      invert: { alpha: false, light: false },
    },
  };

  const shape = {
    type: 'oval',
    path: null,
    svg: shapeTypesData.custom.svg,
    width: shapeTypesData.custom.width,
    height: shapeTypesData.custom.height,
    defaultSize: 10,
  };

  const palette = {
    index: 0,
    data: null,
    array: ['#FFFFFF', '#D1D1D1', '#808080', '#585858', '#000000'],
    temp: ['#FFFFFF', '#D1D1D1', '#808080', '#585858', '#000000'],
    use: [true, true, true, true, true],
  };

  const rec = { frame: 0, frameRate: 30, length: { value: 10, min: 1, max: 60 } };
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

  let gForm = null;
  let alphaImg = null;
  let frameData = {};
  let frame = 0;
  let isReady = false;

  const state = { seed, cnv, params, pattern, mask, shape, palette, rec };

  // ---- Panel UI ----
  const panel = createPanelBuilder({
    state,
    applyChange,
    refreshVisibility,
    colorStyle: 'code-upper',
  });

  function buildUI() {
    const root = document.getElementById('co-controls');
    if (!root) return;
    root.innerHTML = '';
    buildPresetSection(root, { idPrefix: 'co', presets: PRESETS });
    panel.buildSections(root, SECTIONS);
    openSections(root, [0, 1]);
    refreshVisibility();
  }

  function applyChange(ctrl) {
    switch (ctrl.id) {
      case 'co-gen-seed':
        seedEvent();
        syncUIFromState();
        break;
      case 'co-random-palette':
        getRandomPalette();
        syncUIFromState();
        break;
      case 'co-shuffle-palette':
        shufflePalette();
        syncUIFromState();
        break;
    }

    switch (ctrl.regen) {
      case 'canvas':
        updateCanvas();
        restartProgram();
        break;
      case 'seed':
        simplex.base = new SimplexNoise(alea(seed.value));
        restartProgram();
        break;
      case 'shape':
        switchShape();
        restartProgram();
        break;
      case 'palette':
        populatePaletteColors();
        restartProgram();
        break;
      case 'frame':
        restartProgram();
        break;
    }
    saveState();
  }

  function refreshVisibility() {
    const show = (id, vis) => {
      const el = document.querySelector(`[data-control-id="${id}"]`);
      if (el) el.style.display = vis ? '' : 'none';
    };

    show('co-bg-color', cnv.bg.mode === 'custom');
    show('co-motion-mode', cnv.animation);
    show('co-motion-amp', cnv.animation);

    show('co-mixed', params.color.style === 'mixed');
    const hasStroke = params.color.style !== 'fill';
    show('co-stroke-width', hasStroke);
    show('co-stroke-scale', hasStroke);

    const solid = params.color.type === 'color';
    show('co-base-color', solid);
    for (let i = 0; i < 5; i++) show(`co-color-${i}`, !solid);
    show('co-random-palette', !solid);
    show('co-shuffle-palette', !solid);

    const m = mask.mode;
    show('co-mask-branch-mode', m === 'parametric');
    show('co-mask-branch', m === 'parametric');
    show('co-mask-round', m === 'parametric');
    show('co-mask-min', m === 'parametric');
    show('co-mask-max', m === 'parametric');
    show('co-mask-scale', m === 'image');
    show('co-mask-bright', m === 'image');
    show('co-mask-contrast', m === 'image');
    show('co-mask-invert-light', m === 'image');
    show('co-mask-invert-alpha', m === 'image');
  }

  function syncUIFromState() {
    panel.syncUIFromState(SECTIONS);
    refreshVisibility();
  }

  // ---- Seeds / shapes / palette ----
  function seedEvent(value = Math.floor(Math.random() * seed.max)) {
    seed.value = value;
    simplex.base = new SimplexNoise(alea(seed.value));
  }

  function switchShape() {
    const shapeData = shapeTypesData[shape.type] || shapeTypesData.custom;
    shape.path = new Path2D(shapeData.svg);
    shape.svg = shapeData.svg;
    shape.width = shapeData.width;
    shape.height = shapeData.height;
  }

  function getRandomPalette() {
    if (!palette.data) return;
    const keys = Object.keys(palette.data);
    const index = Math.floor(Math.random() * keys.length);
    let randomPalette = palette.data[index];
    if (Math.random() < 0.5) randomPalette = randomPalette.slice().reverse();
    palette.array = randomPalette.slice(0, 5);
    populatePaletteColors();
    restartProgram();
  }

  function shufflePalette() {
    const tempArray = [];
    for (let i = 0; i < palette.array.length; i++) {
      if (palette.use[i]) tempArray.push(palette.array[i]);
    }
    p.shuffle(tempArray, true);
    let index = 0;
    for (let i = 0; i < palette.array.length; i++) {
      if (palette.use[i]) {
        palette.array[i] = tempArray[index];
        index++;
      }
    }
    populatePaletteColors();
    restartProgram();
  }

  function populatePaletteColors() {
    p.randomSeed(seed.value);
    const tempArray = [];
    palette.temp = [];

    for (let i = 0; i < palette.array.length; i++) {
      if (palette.use[i]) tempArray.push(palette.array[i]);
    }
    if (!tempArray.length) tempArray.push('#000000');

    for (let i = 0; i < params.freq.layers; i++) {
      palette.temp.push(tempArray[i % tempArray.length]);
    }

    p.shuffle(palette.temp, true);

    if (params.color.type === 'transition') {
      const tempColors = palette.temp;
      palette.temp = [];
      for (let i = 0; i < params.freq.layers; i++) {
        palette.temp.push([tempColors[i], i / (params.freq.layers - 1)]);
      }
    }
  }

  // Interpolates within [hex, stop] palette pairs via p.lerpColor.
  function paletteLerp(pairs, t) {
    if (!pairs.length) return '#000000';
    if (!Array.isArray(pairs[0])) return pairs[0];
    let lower = pairs[0];
    let upper = pairs[pairs.length - 1];
    for (let i = 0; i < pairs.length - 1; i++) {
      if (t >= pairs[i][1] && t <= pairs[i + 1][1]) {
        lower = pairs[i];
        upper = pairs[i + 1];
        break;
      }
    }
    const span = upper[1] - lower[1] || 1;
    const localT = (t - lower[1]) / span;
    return p.lerpColor(p.color(lower[0]), p.color(upper[0]), localT);
  }

  // ---- Canvas ----
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

    if (gForm) {
      try {
        gForm.remove();
      } catch {
        /* p5 Graphics.remove() can throw in instance mode */
      }
    }
    gForm = p.createGraphics(p.width, p.height);
    gForm.pixelDensity(cnv.density.base + 1);

    if (alphaImg) {
      try {
        alphaImg.remove();
      } catch {
        /* see above */
      }
    }
    alphaImg = createAlphaImage(p.width, p.height, 1);
  }

  // Transparency checkerboard shown behind transparent backgrounds.
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

  // ---- Frame data generation ----
  function restartProgram() {
    if (!isReady) return;
    generateFrameData();
    if (cnv.animation && params.motion.amp !== 0) {
      p.loop();
    } else {
      p.noLoop();
      p.redraw();
    }
  }

  function generateFrameData() {
    frameData = {};

    frameData.translate = {};
    frameData.translate.x = gForm.width * (1 - cnv.scale) * 0.5;
    frameData.translate.y = gForm.height * (1 - cnv.scale) * 0.5;

    frameData.colorRatio = params.color.mixed;
    frameData.colorBlend = params.color.blend;
    frameData.canvasScale = cnv.scale;

    frameData.shapePath = new Path2D(shape.svg);
    frameData.sizeScale = params.scale.value;
    frameData.sizePower = params.scale.power;

    frameData.strokeWidth = params.stroke.width;
    frameData.strokeScale = params.stroke.scale ? 1 : 0;
    frameData.strokeControl = params.stroke.scale ? 0 : 1;

    frameData.motionMode = params.motion.mode;
    const motionMin = -params.freq.base * 0.2 - 0.01;
    const motionMax = params.freq.base * 0.2 + 0.01;
    frameData.motionAmp =
      p.map(params.motion.amp, -100, 100, motionMin, motionMax) * rec.length.value;

    const data = generatePoints(gForm.width, gForm.height, params);
    const imageMask = getImageLightnessMap(data, gForm.width, gForm.height, mask.image.data);
    const gridSeed = generateSeedGrid(pattern.cells.x, pattern.cells.y, pattern.seed.random);

    frameData.offset = getCanvasOffset(data, gForm.width, gForm.height);
    frameData.count = data.length;
    frameData.x = [];
    frameData.y = [];
    frameData.seed = [];
    frameData.noise = [];
    frameData.freq = [];
    frameData.scale = [];
    frameData.scaleEase = [];
    frameData.rotate = [];
    frameData.color = [];
    frameData.strokeSize = [];
    frameData.randomColor = [];

    p.randomSeed(seed.value);

    for (let i = 0; i < frameData.count; i++) {
      const x = data[i][0];
      const y = data[i][1];

      const xOffset = frameData.offset.x / pattern.cells.x;
      const yOffset = frameData.offset.y / pattern.cells.y;

      const xSize = gForm.width / pattern.cells.x;
      const ySize = gForm.height / pattern.cells.y;

      const col = Math.floor(data[i][0] / xSize);
      const row = Math.floor(data[i][1] / ySize);

      const xShift = (col + 0.5) * xSize - gForm.width / 2;
      const yShift = (row + 0.5) * ySize - gForm.height / 2;

      const xCenter = ((col * 2 + 1) * xSize) / 2 - xOffset;
      const yCenter = ((row * 2 + 1) * ySize) / 2 - yOffset;

      // Shifted distance (the source kept normal-distance variants commented)
      const xCenterShift = xCenter - xShift * pattern.offset.x;
      const yCenterShift = yCenter - yShift * pattern.offset.y;
      const vxShift = x - xCenterShift;
      const vyShift = y - yCenterShift;

      const tileCenterShift = maxTileDistance(col, row, xSize, ySize, xCenterShift, yCenterShift);
      const distanceShift = Math.sqrt(vxShift * vxShift + vyShift * vyShift);

      const swirlCenter = tileCenterShift / 2;
      let centerDistance = distanceShift;
      const scaleDistance = distanceShift / tileCenterShift;
      const freqDistance = distanceShift / tileCenterShift;
      const centerDirection = Math.atan2(vxShift, vyShift);
      const centerAngle = Math.atan2(xCenterShift - x, yCenterShift - y);

      const maskDistance = distanceShift;
      const maskMax = tileCenterShift * Math.max(0.05, mask.margin.max);
      const maskMin = tileCenterShift * Math.min(0.95, mask.margin.min);

      const shapeRotate = p.map(params.rotate.shape, -1, 1, -p.PI, p.PI);
      const shapeRotateDirection = centerAngle * p.map(params.rotate.mult, -1, 1, -p.TWO_PI, p.TWO_PI);
      const patternRotate = p.map(pattern.rotate, -1, 1, -p.PI, p.PI);

      let scaleValue = 1;
      let freqEase = 1;

      const pSeed = pattern.seed.value * gridSeed[col][row];
      frameData.seed.push(pSeed);

      // Random color data
      let randomColor = p.random();
      switch (params.color.style) {
        case 'fill':
          randomColor = 2;
          break;
        case 'stroke':
          randomColor = -1;
          break;
      }

      // Swirl data
      let swirlValue = 0;
      const baseSwirl = p.map(params.swirl.base, 0, 1, 0, 0.05);
      const swirlFreq = p.map(easeFunctions['Expo Out'](params.swirl.freq), 0, 1, swirlCenter, 1);
      const swirlAmp = params.swirl.amp * p.HALF_PI;

      switch (params.swirl.mode) {
        case 'rotary': {
          const sinValue = Math.sin(p.HALF_PI + centerDistance / swirlFreq);
          const cosValue = Math.cos(centerDistance / swirlFreq);
          swirlValue = Math.round(sinValue * cosValue) * swirlAmp;
          break;
        }
        case 'wave': {
          const waveCos = Math.cos(centerDistance / swirlFreq);
          swirlValue = Math.sin(waveCos) * swirlAmp;
          break;
        }
      }

      swirlValue += centerDistance * baseSwirl;

      // Branch calculation
      const branchAmount = Math.max(0.01, params.branch.amount);
      const branchAngle = params.branch.angle;

      const centerDirectionAngled = centerDirection + swirlValue + patternRotate;

      const nearestBranch =
        (Math.round((centerDirectionAngled * branchAmount) / p.TWO_PI) * p.TWO_PI) / branchAmount;

      const angleToNearestBranch = centerDirectionAngled - nearestBranch;
      centerDistance *= Math.cos(angleToNearestBranch * branchAngle);

      // Mask mode
      switch (mask.mode) {
        case 'none':
          break;

        case 'image':
          scaleValue *= imageMask[i];
          if (scaleValue < 0.05) scaleValue = 0;
          break;

        case 'parametric': {
          let distValue;
          const maskBranch = mask.branch / 2;

          switch (mask.branchMode) {
            case 'ignore':
              distValue = maskDistance * Math.abs(Math.cos(maskBranch * centerDirectionAngled));
              break;
            case 'apply':
              distValue = centerDistance * Math.abs(Math.cos(maskBranch * centerDirectionAngled));
              break;
          }

          if (distValue < maskMin || distValue > maskMax) {
            scaleValue = 0;
          }

          if (mask.branchRound) {
            if (maskDistance < maskMin || maskDistance > maskMax) {
              scaleValue = 0;
            }
          }
          break;
        }
      }

      // Scale easing
      if (params.scale.easeType !== 'none') {
        let minScale = 0;
        let maxScale = 0;
        const scaleOffset = Math.round(params.scale.easeOffset * 100) / 100;

        if (scaleOffset < 0) {
          minScale = 1;
          maxScale = 1 - Math.abs(params.scale.easeOffset);
        } else if (scaleOffset > 0) {
          minScale = 0;
          maxScale = params.scale.easeOffset;
        }

        let normScale = (scaleDistance - minScale) / (maxScale - minScale);
        normScale = normScale < 0 ? 0 : normScale > 1 ? 1 : normScale;

        scaleValue *= p.lerp(0, 1, easeFunctions[params.scale.easeType](normScale));
      }

      // Freq easing
      if (params.freq.easeType !== 'none') {
        let minFreq = 0;
        let maxFreq = 0;
        const freqOffset = Math.round(params.freq.easeOffset * 100) / 100;

        if (freqOffset < 0) {
          minFreq = 1;
          maxFreq = 1 - Math.abs(params.freq.easeOffset);
        } else if (freqOffset > 0) {
          minFreq = 0;
          maxFreq = params.freq.easeOffset;
        }

        let normFreq = (freqDistance - minFreq) / (maxFreq - minFreq);
        normFreq = normFreq < 0 ? 0 : normFreq > 1 ? 1 : normFreq;

        freqEase = p.lerp(0, 1, easeFunctions[params.freq.easeType](normFreq));
      }

      const freqMode = params.freq.mode === 'cos';
      const freqAmount = params.branch.amountMax - params.branch.amount * 0.5;
      const freqBase = easeFunctions['Sine In'](params.freq.base);
      const freqAmp = easeFunctions['Sine In'](params.freq.amp);
      const branchMirror = params.branch.symmetry !== 'standard';

      let branchFreq = Math.cos(branchAmount * centerDirectionAngled);
      branchFreq = branchMirror ? Math.abs(branchFreq) * freqAmp : branchFreq * freqAmp;

      const freqValue = freqMode ? Math.round(branchFreq * freqAmount) / freqAmount : branchFreq;
      const rotateValue = shapeRotate + shapeRotateDirection;

      const noiseData =
        Math.log(Math.max(0.001, centerDistance / freqEase) / p.TWO_PI) * (freqBase * freqEase);

      frameData.x.push(x);
      frameData.y.push(y);
      frameData.noise.push(noiseData);
      frameData.freq.push(freqValue);
      frameData.randomColor.push(randomColor);
      frameData.scaleEase.push(scaleValue);
      frameData.rotate.push(rotateValue);
    }
  }

  // ---- Rendering ----
  function drawForms() {
    p.randomSeed(seed.value);

    gForm.drawingContext.globalCompositeOperation = frameData.colorBlend;
    gForm.translate(frameData.offset.x, frameData.offset.y);
    gForm.translate(frameData.translate.x, frameData.translate.y);
    gForm.scale(frameData.canvasScale);

    frame = cnv.frame / (rec.length.value * rec.frameRate);
    let noiseFrame = 0;
    let sinFrame = 0;
    let cosFrame = 0;

    switch (frameData.motionMode) {
      case 'oneway':
        noiseFrame = p.TWO_PI * frame * frameData.motionAmp;
        break;
      case 'loop':
        noiseFrame = Math.sin(p.TWO_PI * frame) * frameData.motionAmp;
        break;
      case 'noise':
        sinFrame = Math.sin(p.TWO_PI * frame) * frameData.motionAmp;
        cosFrame = Math.cos(p.TWO_PI * frame) * frameData.motionAmp;
    }

    for (let i = 0; i < frameData.count; i++) {
      let sNoise = simplex.base.noise4D(
        frameData.seed[i] + frameData.noise[i] - noiseFrame,
        frameData.freq[i],
        sinFrame,
        cosFrame
      );

      sNoise = (1 + sNoise) * 0.5;

      const colorIndex = Math.min(
        Math.abs(~~(sNoise * palette.temp.length)),
        Math.max(0, palette.temp.length - 1)
      );

      const fractSize = 1 / palette.temp.length;
      const valueInRange = (sNoise - colorIndex * fractSize) / fractSize;
      const scaledValue = 2 * (0.5 - Math.abs(valueInRange - 0.5));

      let size =
        Math.pow(scaledValue, frameData.sizePower) * frameData.sizeScale * frameData.scaleEase[i];

      if (Number.isNaN(size)) size = 0;
      if (size < 0.05) continue;

      frameData.scale[i] = size;

      gForm.push();
      gForm.translate(frameData.x[i], frameData.y[i]);
      gForm.scale(size);
      gForm.rotate(frameData.rotate[i]);
      gForm.translate(-shape.width, -shape.height);

      switch (params.color.type) {
        case 'color':
          frameData.color[i] = params.color.base || '#000000';
          break;
        case 'sequence':
          frameData.color[i] = palette.temp[colorIndex] || '#000000';
          // Defensive check if it's an array (shouldn't happen but protects against state desync)
          if (Array.isArray(frameData.color[i])) frameData.color[i] = frameData.color[i][0];
          break;
        case 'transition':
          frameData.color[i] = paletteLerp(palette.temp, sNoise) || '#000000';
          break;
        default:
          frameData.color[i] = '#000000';
      }

      if (frameData.randomColor[i] > frameData.colorRatio) {
        gForm.fill(frameData.color[i]);
        gForm.drawingContext.fill(frameData.shapePath, 'evenodd');
      } else {
        frameData.strokeSize[i] =
          frameData.strokeWidth / (size * frameData.strokeControl + frameData.strokeScale);
        gForm.strokeWeight(frameData.strokeSize[i]);
        gForm.stroke(frameData.color[i]);
        gForm.drawingContext.stroke(frameData.shapePath, 'evenodd');
      }

      gForm.pop();
    }
  }

  // ---- Frame data helpers ----
  function maxTileDistance(col, row, xSize, ySize, xCenter, yCenter) {
    const x0 = col * xSize;
    const x1 = (col + 1) * xSize;
    const y0 = row * ySize;
    const y1 = (row + 1) * ySize;

    const d1 = p.dist(xCenter, yCenter, x0, y0);
    const d2 = p.dist(xCenter, yCenter, x1, y0);
    const d3 = p.dist(xCenter, yCenter, x1, y1);
    const d4 = p.dist(xCenter, yCenter, x0, y1);

    return Math.max(d1, d2, d3, d4);
  }

  function generatePoints(width, height, params) {
    p.randomSeed(seed.value);

    const gridX = params.grid.x;
    const gridY = params.grid.y;
    const count = params.count.value;

    const cols = Math.floor(width / gridX);
    const rows = Math.floor(height / gridY);

    const allPoints = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        allPoints.push([i * gridX, j * gridY]);
      }
    }

    for (let i = allPoints.length - 1; i > 0; i--) {
      const j = Math.floor(p.random(i + 1));
      [allPoints[i], allPoints[j]] = [allPoints[j], allPoints[i]];
    }

    return allPoints.slice(0, count);
  }

  function getCanvasOffset(points, width, height) {
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;

    for (const [x, y] of points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    return { x: width / 2 - (minX + maxX) / 2, y: height / 2 - (minY + maxY) / 2 };
  }

  function generateSeedGrid(cols, rows, randomAmount = 0, maxValue = 5) {
    const grid = [];
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const maxDist = Math.max(Math.sqrt(cx * cx + cy * cy), 0.0001);

    for (let i = 0; i < cols; i++) {
      grid[i] = [];
      for (let j = 0; j < rows; j++) {
        const dx = i - cx;
        const dy = j - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const base = (dist / maxDist) * maxValue;
        const jitter = p.random(-randomAmount, randomAmount);
        grid[i][j] = base + jitter;
      }
    }

    const ci = Math.floor(cols / 2);
    const cj = Math.floor(rows / 2);
    if (cols >= 2 && rows >= 2 && cols % 2 === 0 && rows % 2 === 0) {
      grid[ci][cj] = 0;
      grid[ci - 1][cj] = 0;
      grid[ci][cj - 1] = 0;
      grid[ci - 1][cj - 1] = 0;
    } else {
      grid[ci][cj] = 0;
    }

    return grid;
  }

  // ---- Image mask ----
  function getImageLightnessMap(points, canvasWidth, canvasHeight, img) {
    if (!img || mask.mode !== 'image') return [];

    const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height);
    const drawW = img.width * scale * mask.image.scale;
    const drawH = img.height * scale * mask.image.scale;
    const offsetX = (canvasWidth - drawW) / 2;
    const offsetY = (canvasHeight - drawH) / 2;

    const resized = p.createImage(canvasWidth, canvasHeight);
    resized.copy(img, 0, 0, img.width, img.height, offsetX, offsetY, drawW, drawH);
    resized.loadPixels();

    const data = [];
    for (const [x, y] of points) {
      const ix = p.constrain(x, 0, resized.width - 1);
      const iy = p.constrain(y, 0, resized.height - 1);
      const idx = 4 * (iy * resized.width + ix);

      const r = resized.pixels[idx];
      const g = resized.pixels[idx + 1];
      const b = resized.pixels[idx + 2];
      let a = resized.pixels[idx + 3] / 255;

      if (mask.image.invert.alpha) a = 1 - a;

      let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      brightness += mask.image.brightness;
      brightness = p.constrain(brightness, 0, 1);
      brightness = (brightness - 0.5) * mask.image.contrast + 0.5;
      brightness = p.constrain(brightness, 0, 1);

      if (!mask.image.invert.light) brightness = 1 - brightness;

      data.push(brightness * a);
    }
    return data;
  }

  // ---- Presets ----
  function applyPreset(preset) {
    if (!preset) return;
    deepMerge(seed, preset.seed);
    deepMerge(cnv, preset.cnv);
    deepMerge(params, preset.params);
    deepMerge(pattern, preset.pattern);
    deepMerge(mask, { ...preset.mask, image: { ...(preset.mask?.image || {}), data: undefined } });
    deepMerge(palette, preset.palette);
    if (preset.rec) deepMerge(rec, preset.rec);
    if (preset.shape?.type) shape.type = preset.shape.type;
    cnv.frame = preset.cnv?.frame ?? 0;

    // Custom shape carried by the preset
    if (preset.shape?.svg) {
      shapeTypesData.custom.svg = preset.shape.svg;
      if (preset.shape.width) shapeTypesData.custom.width = preset.shape.width;
      if (preset.shape.height) shapeTypesData.custom.height = preset.shape.height;
    }
    switchShape();

    simplex.base = new SimplexNoise(alea(seed.value));
    updateCanvas();
    populatePaletteColors();

    // Mask image carried by the preset (base64) loads async.
    const imgData = preset.mask?.image?.data;
    if (imgData && mask.mode === 'image') {
      p.loadImage(
        imgData,
        (img) => {
          mask.image.data = img;
          restartProgram();
        },
        () => {
          console.warn('[copo] preset mask image failed to load');
          restartProgram();
        }
      );
    } else if (mask.mode === 'image' && !mask.image.data && mask.image.temp) {
      mask.image.data = mask.image.temp;
    }

    restartProgram();
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
        seed: { value: seed.value },
        cnv: {
          ratio: cnv.ratio,
          scale: cnv.scale,
          animation: cnv.animation,
          bg: cnv.bg,
        },
        params,
        pattern,
        mask: { ...mask, image: { ...mask.image, data: undefined, temp: undefined } },
        shape: { type: shape.type, svg: shape.svg, width: shape.width, height: shape.height },
        palette: { array: palette.array, use: palette.use },
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
      deepMerge(seed, data.seed);
      deepMerge(cnv, data.cnv);
      deepMerge(params, data.params);
      deepMerge(pattern, data.pattern);
      deepMerge(mask, data.mask);
      deepMerge(palette, data.palette);
      deepMerge(rec, data.rec);
      if (data.shape?.type) shape.type = data.shape.type;
      if (data.shape?.svg) {
        shapeTypesData.custom.svg = data.shape.svg;
        shapeTypesData.custom.width = data.shape.width || shapeTypesData.custom.width;
        shapeTypesData.custom.height = data.shape.height || shapeTypesData.custom.height;
      }
      return true;
    } catch (e) {
      console.warn('[copo] state restore failed:', e);
      return false;
    }
  }

  // ---- Export ----
  function setStatus(msg) {
    const el = document.getElementById('co-export-status');
    if (el) el.innerText = msg;
  }

  function drawComposite() {
    p.clear();
    gForm.clear();
    gForm.reset();

    if (cnv.bg.mode === 'custom') {
      p.background(cnv.bg.custom);
    } else {
      p.image(alphaImg, 0, 0, p.width, p.height);
    }

    drawForms();
    p.image(gForm, 0, 0, p.width, p.height, 0, 0, gForm.width, gForm.height);
  }

  function exportPNG() {
    p.saveCanvas(`copo-${timestamp()}`, 'png');
  }

  function exportSVG() {
    try {
      generateSVG();
    } catch (e) {
      console.error('[copo] SVG export failed:', e);
      setStatus('SVG export failed');
    }
  }

  // SVG export (paper-based).
  function generateSVG() {
    paper.setup();
    paper.pixelRatio = 1;
    paper.view.viewSize = new paper.Size(gForm.width, gForm.height);

    if (cnv.bg.mode === 'custom') {
      const bgLayer = new paper.Layer();
      bgLayer.name = 'Background';
      bgLayer.activate();
      bgLayer.addChild(
        new paper.Path.Rectangle({
          point: [0, 0],
          size: [paper.view.viewSize.width, paper.view.viewSize.height],
          fillColor: cnv.bg.custom,
          locked: true,
        })
      );
    }

    const shapeLayer = new paper.Layer();
    shapeLayer.name = 'Graphics';
    shapeLayer.activate();

    const xTranslate = frameData.translate.x + frameData.offset.x;
    const yTranslate = frameData.translate.y + frameData.offset.y;

    const shapeGroup = new paper.Group({
      position: new paper.Point(xTranslate, yTranslate),
      scaling: frameData.canvasScale,
      applyMatrix: false,
    });

    const clipMask = new paper.Path.Rectangle({
      point: [0, 0],
      size: [paper.view.viewSize.width, paper.view.viewSize.height],
    });

    const shapeArray = [];
    for (let i = 0; i < frameData.count; i++) {
      if (
        frameData.x[i] === undefined ||
        frameData.y[i] === undefined ||
        frameData.scale[i] === undefined ||
        frameData.rotate[i] === undefined ||
        frameData.color[i] === undefined
      ) {
        continue;
      }

      const sh = new paper.CompoundPath(shape.svg);
      sh.translate(new paper.Point(frameData.x[i], frameData.y[i]));
      sh.scale(frameData.scale[i]);
      sh.rotate(p.degrees(frameData.rotate[i]));
      sh.translate(new paper.Point(-shape.width, -shape.height));

      let colorString = frameData.color[i];
      if (params.color.type === 'transition') {
        colorString = p5ColorToCSS(frameData.color[i]);
      }

      if (frameData.randomColor[i] > frameData.colorRatio) {
        sh.fillColor = colorString;
        sh.strokeColor = null;
      } else {
        sh.fillColor = null;
        sh.strokeColor = colorString;
        sh.strokeWidth = frameData.strokeSize[i] * frameData.scale[i];
      }
      shapeArray.push(sh);
    }

    if (params.color.blend === 'xor' && params.color.type === 'color' && params.color.style === 'fill') {
      shapeGroup.addChild(
        new paper.CompoundPath({
          children: shapeArray,
          fillColor: params.color.base,
          fillRule: 'evenodd',
        })
      );
    } else {
      shapeGroup.addChildren(shapeArray);
    }

    shapeLayer.addChild(new paper.Group({ children: [clipMask, shapeGroup], clipped: true }));
    paper.view.draw();

    const svgString = paper.project.exportSVG({ asString: true });

    paper.project.activeLayer.removeChildren();
    paper.project.clear();
    paper.view.draw();

    saveSVG(svgString, `copo-${timestamp()}.svg`);
  }

  function p5ColorToCSS(col) {
    if (typeof col === 'string') return col;
    const [r, g, b] = col.levels;
    return `#${p.hex(r, 2)}${p.hex(g, 2)}${p.hex(b, 2)}`;
  }

  async function exportMP4() {
    if (recVideo.active) return;
    recVideo.active = true;
    setStatus('Preparing video…');

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

    encoder.outputFilename = `copo-${timestamp()}.mp4`;
    encoder.width = w;
    encoder.height = h;
    encoder.frameRate = rec.frameRate;
    encoder.quantizationParameter = 22;
    encoder.groupOfPictures = 1;
    encoder.initialize();

    const totalFrames = recVideo.seconds * rec.frameRate;
    const savedFrame = cnv.frame;

    try {
      for (let f = 0; f < totalFrames; f++) {
        cnv.frame = Math.round((f / totalFrames) * (rec.length.value * rec.frameRate));
        drawComposite();
        copyCtx.clearRect(0, 0, w, h);
        copyCtx.drawImage(p.canvas, 0, 0, w, h);
        const imageData = copyCtx.getImageData(0, 0, w, h);
        encoder.addFrameRgba(imageData.data);
        if (f % 5 === 0) setStatus(`Encoding ${f}/${totalFrames}`);
        if (f % 10 === 0) await new Promise((r) => setTimeout(r, 0));
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
      console.error('[copo] MP4 export failed:', e);
      setStatus('Video export failed');
    } finally {
      try {
        encoder.delete();
      } catch {
        /* */
      }
      cnv.frame = savedFrame;
      recVideo.active = false;
      restartProgram();
      setTimeout(() => setStatus(''), 3000);
    }
  }

  function bindFooter() {
    document.getElementById('co-btn-save-png')?.addEventListener('click', exportPNG);
    document.getElementById('co-btn-save-svg')?.addEventListener('click', exportSVG);
    document.getElementById('co-btn-save-mp4')?.addEventListener('click', exportMP4);
    document.getElementById('co-mp4-length')?.addEventListener('change', (e) => {
      recVideo.seconds = parseInt(e.target.value, 10);
    });
    document.getElementById('co-preset')?.addEventListener('change', (e) => {
      const preset = PRESETS[e.target.value];
      if (preset) applyPreset(preset);
    });
  }

  // ---- p5 lifecycle ----
  p.setup = () => {
    canvasContainer = document.getElementById('copo-canvas');
    if (!canvasContainer) return;

    p.createCanvas(480, 480);
    p.frameRate(rec.frameRate);

    buildUI();
    bindFooter();

    // Default mask image + palettes load async.
    p.loadImage(`${import.meta.env.BASE_URL}assets/copo/mask.webp`, (img) => {
      mask.image.temp = img;
      if (!mask.image.data) mask.image.data = img;
      if (mask.mode === 'image') restartProgram();
    });
    fetch(`${import.meta.env.BASE_URL}assets/copo/palettes.json`)
      .then((r) => r.json())
      .then((data) => {
        palette.data = data;
      })
      .catch((e) => console.warn('[copo] palettes load failed:', e));

    const restored = loadState();
    switchShape();
    seedEvent(restored ? seed.value : undefined);
    updateCanvas();
    isReady = true;

    if (restored) {
      populatePaletteColors();
      restartProgram();
      syncUIFromState();
    } else {
      const keys = Object.keys(PRESETS);
      const pick = keys[Math.floor(Math.random() * keys.length)];
      applyPreset(PRESETS[pick]);
      const sel = document.getElementById('co-preset');
      if (sel) sel.value = pick;
    }
  };

  p.draw = () => {
    if (!gForm || !frameData.count) return;
    drawComposite();
    if (cnv.animation) {
      frame >= 1 ? (cnv.frame = 0) : cnv.frame++;
    }
  };

  p.windowResized = () => {
    if (canvasContainer && isReady) {
      updateCanvas();
      restartProgram();
    }
  };
}
