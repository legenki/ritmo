// RITMO — control panel sections (declarative SECTIONS format consumed by
// shared/ui/panelBuilder.js).

const RATIOS = {
  '2:1': '2:1',
  '16:9': '16:9',
  '3:2': '3:2',
  '4:3': '4:3',
  '5:4': '5:4',
  '1:1': '1:1',
  '4:5': '4:5',
  '3:4': '3:4',
  '2:3': '2:3',
  '9:16': '9:16',
  '1:2': '1:2',
};

const SORT_OPTIONS = {
  'Random Colors': 'random',
  'Repeated Colors': 'repeat',
  'Colors Transition': 'transition',
};

export const SECTIONS = [
  {
    title: 'Canvas',
    controls: [
      { id: 'ri-ratio', type: 'select', label: 'Canvas Ratio', path: 'cnv.ratio', options: RATIOS, regen: 'canvas' },
      { id: 'ri-scale-x', type: 'slider', label: 'Content Scale X', path: 'cnv.scale.x', min: 100, max: 300, step: 1 },
      { id: 'ri-scale-y', type: 'slider', label: 'Content Scale Y', path: 'cnv.scale.y', min: 25, max: 300, step: 1 },
      { id: 'ri-offset', type: 'slider', label: 'Axis Offset', path: 'cnv.offset', min: -50, max: 50, step: 1 },
      { id: 'ri-rotate', type: 'slider', label: 'Content Rotate', path: 'cnv.rotate', min: -180, max: 180, step: 5 },
      { id: 'ri-reset-content', type: 'button', label: 'Reset Content Controls' },
    ],
  },
  {
    title: 'Shape',
    controls: [
      {
        id: 'ri-form-type',
        type: 'select',
        label: 'Form Type',
        path: 'form.type',
        options: { 'Wave: Full': 'waves', 'Wave: Stripes': 'stripes' },
      },
      { id: 'ri-stripe-width', type: 'slider', label: 'Wave Width', path: 'form.stripe.width', min: 1, max: 250, step: 1 },
      { id: 'ri-amount', type: 'slider', label: 'Waves Amount', path: 'form.amount.value', min: 2, max: 200, step: 1, regen: 'arrays' },
      { id: 'ri-quality', type: 'slider', label: 'Smoothness', path: 'form.quality.value', min: 2, max: 60, step: 1, regen: 'arrays' },
      { id: 'ri-amp-y', type: 'slider', label: 'Amplify', path: 'form.amp.y', min: 0, max: 100, step: 0.1 },
      { id: 'ri-freq-x', type: 'slider', label: 'Frequency', path: 'form.freq.x', min: 0, max: 100, step: 0.1 },
      { id: 'ri-freq-y', type: 'slider', label: 'Uniformity', path: 'form.freq.y', min: 0, max: 100, step: 0.1 },
      { id: 'ri-speed-y', type: 'slider', label: 'Speed', path: 'form.speed.y', min: 0, max: 100, step: 0.1 },
      { id: 'ri-seed', type: 'slider', label: 'Noise Seed', path: 'seed.simplex', min: 0, max: 10000, step: 1, regen: 'noise' },
      { id: 'ri-random', type: 'button', label: 'Random Parameters' },
    ],
  },
];

// Palette lives in a custom section built by the app (dynamic picker count).

export const COLOR_SECTIONS = [
  {
    title: 'Fill',
    controls: [
      {
        id: 'ri-fill-mode',
        type: 'select',
        label: 'Fill Mode',
        path: 'graphics.fill.mode',
        options: {
          None: 'none',
          'One Color': 'single',
          'Palette Colors': 'palette',
          'Palette Gradient Mix': 'gradient',
        },
        regen: 'colors',
      },
      { id: 'ri-fill-sort', type: 'select', label: 'Sorting Mode', path: 'graphics.fill.sort', options: SORT_OPTIONS, regen: 'colors' },
      { id: 'ri-fill-shuffle', type: 'button', label: 'Shuffle Fill Color' },
    ],
  },
  {
    title: 'Stroke',
    controls: [
      {
        id: 'ri-stroke-mode',
        type: 'select',
        label: 'Stroke Mode',
        path: 'graphics.stroke.mode',
        options: {
          None: 'none',
          'One Color': 'single',
          'Palette Colors': 'palette',
          'Palette Gradient Mix': 'gradient',
        },
        regen: 'colors',
      },
      { id: 'ri-stroke-sort', type: 'select', label: 'Sorting Mode', path: 'graphics.stroke.sort', options: SORT_OPTIONS, regen: 'colors' },
      { id: 'ri-stroke-weight', type: 'slider', label: 'Stroke Weight', path: 'graphics.stroke.weight', min: 1, max: 50, step: 1 },
      { id: 'ri-stroke-dash', type: 'slider', label: 'Stroke Dash', path: 'graphics.stroke.dash', min: 0, max: 100, step: 1 },
      { id: 'ri-stroke-gap', type: 'slider', label: 'Stroke Gap', path: 'graphics.stroke.gap', min: 2, max: 100, step: 1 },
      { id: 'ri-stroke-shuffle', type: 'button', label: 'Shuffle Stroke Color' },
    ],
  },
  {
    title: 'Background',
    controls: [
      {
        id: 'ri-bg-mode',
        type: 'select',
        label: 'Background',
        path: 'bg.mode',
        options: { Transparent: 'none', 'One Color': 'single', Gradient: 'gradient' },
      },
      { id: 'ri-bg-angle', type: 'slider', label: 'Direction', path: 'bg.gradient.angle', min: 0, max: 270, step: 90 },
      { id: 'ri-bg-shuffle', type: 'button', label: 'Shuffle Background Color' },
    ],
  },
];
