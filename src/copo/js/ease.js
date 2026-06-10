// COPO — easing catalog.

export const easeFunctions = {
  // Linear
  none: (t) => t,
  Linear: (t) => t,

  // Sine
  "Sine In": (t) => 1 - Math.cos((t * Math.PI) / 2),
  "Sine Out": (t) => Math.sin((t * Math.PI) / 2),
  "Sine In Out": (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Quad
  "Quad In": (t) => t * t,
  "Quad Out": (t) => 1 - (1 - t) * (1 - t),
  "Quad In Out": (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  // Cubic
  "Cubic In": (t) => t * t * t,
  "Cubic Out": (t) => 1 - Math.pow(1 - t, 3),
  "Cubic In Out": (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  // Expo
  "Expo In": (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  "Expo Out": (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  "Expo In Out": (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circ
  "Circ In": (t) => 1 - Math.sqrt(1 - t * t),
  "Circ Out": (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  "Circ In Out": (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back
  "Back In": (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  "Back Out": (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  "Back In Out": (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  "Elastic In": (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  "Elastic Out": (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  "Elastic In Out": (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  "Bounce In": (t) => 1 - easeFunctions["Bounce Out"](1 - t),
  "Bounce Out": (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    } else if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    } else {
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  },
  "Bounce In Out": (t) =>
    t < 0.5
      ? (1 - easeFunctions["Bounce Out"](1 - 2 * t)) / 2
      : (1 + easeFunctions["Bounce Out"](2 * t - 1)) / 2
};
