// REFRAC — control panel sections.

export const SECTIONS = [
  {
    title: 'Image',
    controls: [
      {
        id: 're-random-image',
        type: 'icon-button',
        label: 'Load Random Image',
        pair: true,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
      },
      { id: 're-upload-image', type: 'button', label: 'Upload Image', pair: true },
      {
        id: 're-image-size',
        type: 'select',
        label: 'Max Image Size',
        path: 'cnv.image.size',
        options: { 1024: 1024, 1536: 1536, 2048: 2048, 2560: 2560, 3072: 3072, 4096: 4096 },
        regen: 'image',
      },
      {
        id: 're-wrap',
        type: 'select',
        label: 'Texture Wrap',
        path: 'cnv.wrap',
        options: { Clamp: 'CLAMP', Mirror: 'MIRROR', Repeat: 'REPEAT' },
      },
      { id: 're-scale-x', type: 'slider', label: 'Content Scale X', path: 'cnv.scale.x', min: 0.5, max: 2, step: 0.01 },
      { id: 're-scale-y', type: 'slider', label: 'Content Scale Y', path: 'cnv.scale.y', min: 0.5, max: 2, step: 0.01 },
      {
        id: 're-bg-mode',
        type: 'select',
        label: 'Background',
        path: 'cnv.bg.mode',
        options: { Custom: 'custom', Transparent: 'transparent' },
      },
      { id: 're-bg-color', type: 'color', label: 'Canvas Color', path: 'cnv.bg.custom' },
    ],
  },
  {
    title: 'Displace',
    controls: [
      {
        id: 're-displace-type',
        type: 'select',
        label: 'Displace Type',
        path: 'displace.type',
        options: { None: 'none', 'Box Displace': 'box', 'Flow Displace': 'flow', 'Sine Displace': 'sine' },
      },
      { id: 're-seed', type: 'slider', label: 'Noise Seed', path: 'seed.value', min: 1, max: 1000, step: 1, regen: 'seed' },
      // Box
      { id: 're-box-amp-x', type: 'slider', label: 'Amplify X', path: 'displace.box.amp.x', min: 0, max: 100, step: 0.1 },
      { id: 're-box-amp-y', type: 'slider', label: 'Amplify Y', path: 'displace.box.amp.y', min: 0, max: 100, step: 0.1 },
      { id: 're-box-freq-x', type: 'slider', label: 'Frequency X', path: 'displace.box.freq.x', min: 0, max: 100, step: 0.1 },
      { id: 're-box-freq-y', type: 'slider', label: 'Frequency Y', path: 'displace.box.freq.y', min: 0, max: 100, step: 0.1 },
      { id: 're-box-speed-x', type: 'slider', label: 'Speed X', path: 'displace.box.speed.x', min: 0, max: 100, step: 1 },
      { id: 're-box-speed-y', type: 'slider', label: 'Speed Y', path: 'displace.box.speed.y', min: 0, max: 100, step: 1 },
      // Flow
      { id: 're-flow-octaves', type: 'slider', label: 'Complexity', path: 'displace.flow.octaves', min: 1, max: 5, step: 1 },
      { id: 're-flow-freq', type: 'slider', label: 'Frequency', path: 'displace.flow.freq', min: 0, max: 100, step: 0.1 },
      { id: 're-flow-amp-x', type: 'slider', label: 'Amplify X', path: 'displace.flow.amp.x', min: 0, max: 100, step: 0.1 },
      { id: 're-flow-amp-y', type: 'slider', label: 'Amplify Y', path: 'displace.flow.amp.y', min: 0, max: 100, step: 0.1 },
      { id: 're-flow-speed-x', type: 'slider', label: 'Speed X', path: 'displace.flow.speed.x', min: 0, max: 100, step: 1 },
      { id: 're-flow-speed-y', type: 'slider', label: 'Speed Y', path: 'displace.flow.speed.y', min: 0, max: 100, step: 1 },
      // Sine
      { id: 're-sine-amp-x', type: 'slider', label: 'Amplify X', path: 'displace.sine.amp.x', min: 0, max: 100, step: 0.1 },
      { id: 're-sine-amp-y', type: 'slider', label: 'Amplify Y', path: 'displace.sine.amp.y', min: 0, max: 100, step: 0.1 },
      { id: 're-sine-freq-x', type: 'slider', label: 'Frequency X', path: 'displace.sine.freq.x', min: 0, max: 100, step: 0.1 },
      { id: 're-sine-freq-y', type: 'slider', label: 'Frequency Y', path: 'displace.sine.freq.y', min: 0, max: 100, step: 0.1 },
      { id: 're-sine-cycle-x', type: 'slider', label: 'Loop Cycles X', path: 'displace.sine.cycle.x', min: -10, max: 10, step: 1 },
      { id: 're-sine-cycle-y', type: 'slider', label: 'Loop Cycles Y', path: 'displace.sine.cycle.y', min: -10, max: 10, step: 1 },
    ],
  },
  {
    title: 'Refract',
    controls: [
      {
        id: 're-refract-type',
        type: 'select',
        label: 'Refract Type',
        path: 'refract.type',
        options: { None: 'none', Grid: 'grid' },
      },
      { id: 're-refract-level-x', type: 'slider', label: 'Skew Level X', path: 'refract.level.x', min: 0, max: 5, step: 0.01 },
      { id: 're-refract-level-y', type: 'slider', label: 'Skew Level Y', path: 'refract.level.y', min: 0, max: 5, step: 0.01 },
      { id: 're-refract-grid-x', type: 'slider', label: 'Grid Amount X', path: 'refract.grid.x', min: 1, max: 100, step: 1 },
      { id: 're-refract-grid-y', type: 'slider', label: 'Grid Amount Y', path: 'refract.grid.y', min: 1, max: 100, step: 1 },
    ],
  },
];
