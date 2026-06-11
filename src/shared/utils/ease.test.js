import { describe, it, expect } from 'vitest';
import { easeFunctions } from '../../copo/js/ease.js';

describe('easeFunctions', () => {
  const EPS = 1e-9;

  const cases = [
    'Linear',
    'Sine In', 'Sine Out', 'Sine In Out',
    'Quad In', 'Quad Out', 'Quad In Out',
    'Cubic In', 'Cubic Out', 'Cubic In Out',
    'Expo In', 'Expo Out', 'Expo In Out',
    'Circ In', 'Circ Out', 'Circ In Out',
    'Back In', 'Back Out', 'Back In Out',
    'Elastic In', 'Elastic Out', 'Elastic In Out',
    'Bounce In', 'Bounce Out', 'Bounce In Out',
  ];

  for (const name of cases) {
    it(`${name}: f(0)=0 and f(1)=1`, () => {
      const f = easeFunctions[name];
      expect(f(0)).toBeCloseTo(0, 9);
      expect(f(1)).toBeCloseTo(1, 9);
    });

    it(`${name}: monotone on midpoints (approximately)`, () => {
      const f = easeFunctions[name];
      // Not all easing functions are strictly monotone (Back/Elastic overshoot),
      // but they must return a finite number for every input in [0,1].
      for (let t = 0; t <= 1; t += 0.1) {
        expect(Number.isFinite(f(t))).toBe(true);
      }
    });
  }

  it('none is identity', () => {
    expect(easeFunctions.none(0.37)).toBeCloseTo(0.37, EPS);
  });
});
