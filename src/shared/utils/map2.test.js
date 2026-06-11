import { describe, it, expect } from 'vitest';
import { createMap2 } from '../../ritmo/js/map2.js';

// Minimal p5 stub — only the math functions map2 calls.
const p = {
  pow: Math.pow,
  cos: Math.cos,
  sin: Math.sin,
  sqrt: Math.sqrt,
  PI: Math.PI,
};

const map2 = createMap2(p);

describe('map2 Linear', () => {
  it('maps start1 to start2', () => {
    expect(map2(0, 0, 100, 0, 200, 'Linear', 0)).toBeCloseTo(0);
  });

  it('maps stop1 to stop2', () => {
    expect(map2(100, 0, 100, 0, 200, 'Linear', 0)).toBeCloseTo(200);
  });

  it('maps midpoint linearly', () => {
    expect(map2(50, 0, 100, 0, 200, 'Linear', 0)).toBeCloseTo(100);
  });
});

describe('map2 Quadratic IN', () => {
  it('returns start2 at t=0', () => {
    expect(map2(0, 0, 1, 0, 1, 'Quadratic', 0)).toBeCloseTo(0);
  });

  it('returns stop2 at t=1', () => {
    expect(map2(1, 0, 1, 0, 1, 'Quadratic', 0)).toBeCloseTo(1);
  });

  it('is less than Linear at midpoint (ease-in is slow start)', () => {
    const quad = map2(0.5, 0, 1, 0, 1, 'Quadratic', 0);
    expect(quad).toBeLessThan(0.5);
  });
});

describe('map2 Quadratic OUT', () => {
  it('is greater than Linear at midpoint (ease-out is fast start)', () => {
    const quad = map2(0.5, 0, 1, 0, 1, 'Quadratic', 1);
    expect(quad).toBeGreaterThan(0.5);
  });
});

describe('map2 edge cases', () => {
  it('returns 0 for unknown type', () => {
    expect(map2(0.5, 0, 1, 0, 1, 'Unknown', 0)).toBe(0);
  });
});
