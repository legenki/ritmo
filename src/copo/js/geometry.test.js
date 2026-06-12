import { describe, it, expect } from 'vitest';
import {
  getCanvasOffset,
  generateSeedGrid,
  generatePoints,
  deepMerge,
  maxTileDistance,
} from './geometry.js';

const euclidean = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

describe('getCanvasOffset', () => {
  it('returns zero offset when bounding box is already centered', () => {
    // Points span [0,200]×[0,200], center = (100,100), canvas 200×200 center = (100,100)
    const points = [[0, 0], [200, 0], [0, 200], [200, 200]];
    const off = getCanvasOffset(points, 200, 200);
    expect(off.x).toBeCloseTo(0);
    expect(off.y).toBeCloseTo(0);
  });

  it('returns correct offset for a single point', () => {
    // Point at (30,40), canvas 100×100: offset = 100/2 - 30 = 20, 100/2 - 40 = 10
    const off = getCanvasOffset([[30, 40]], 100, 100);
    expect(off.x).toBeCloseTo(20);
    expect(off.y).toBeCloseTo(10);
  });
});

describe('generateSeedGrid', () => {
  const noRandom = () => 0;

  it('returns grid with correct dimensions', () => {
    const g = generateSeedGrid(noRandom, 3, 3);
    expect(g.length).toBe(3);
    expect(g[0].length).toBe(3);
  });

  it('center cell is always 0', () => {
    const g = generateSeedGrid(noRandom, 3, 3);
    expect(g[1][1]).toBe(0);
  });

  it('2x2: all four center cells are 0', () => {
    const g = generateSeedGrid(noRandom, 2, 2);
    expect(g[0][0]).toBe(0);
    expect(g[1][0]).toBe(0);
    expect(g[0][1]).toBe(0);
    expect(g[1][1]).toBe(0);
  });
});

describe('generatePoints', () => {
  const seqRandom = (() => {
    let n = 0;
    return (max) => (n++ % (Math.ceil(max) || 1)) * 0;
  })();

  it('returns at most count points', () => {
    const pts = generatePoints(() => 0, 100, 100, 10, 10, 5);
    expect(pts.length).toBe(5);
  });

  it('returns all grid points when count is large', () => {
    const pts = generatePoints(() => 0, 40, 40, 10, 10, 100);
    expect(pts.length).toBe(16); // 4×4
  });
});

describe('deepMerge', () => {
  it('merges a flat value', () => {
    const t = { a: 1 };
    deepMerge(t, { a: 2 });
    expect(t.a).toBe(2);
  });

  it('merges nested objects', () => {
    const t = { a: { b: 1, c: 2 } };
    deepMerge(t, { a: { b: 99 } });
    expect(t.a.b).toBe(99);
    expect(t.a.c).toBe(2);
  });

  it('replaces arrays wholesale', () => {
    const t = { arr: [1, 2, 3] };
    deepMerge(t, { arr: [4, 5] });
    expect(t.arr).toEqual([4, 5]);
  });

  it('ignores undefined values', () => {
    const t = { a: 1 };
    deepMerge(t, { a: undefined });
    expect(t.a).toBe(1);
  });

  it('is a no-op when src is falsy', () => {
    const t = { a: 1 };
    deepMerge(t, null);
    deepMerge(t, undefined);
    expect(t.a).toBe(1);
  });
});

describe('maxTileDistance', () => {
  it('returns correct max corner distance', () => {
    // Center of tile (0,0) with size 10×10 is (5,5)
    const d = maxTileDistance(euclidean, 5, 5, 0, 0, 10, 10);
    expect(d).toBeCloseTo(Math.sqrt(50)); // distance to corner
  });
});
