import { describe, it, expect } from 'vitest';
import { generatePalette, componentToHex, rgbToHex } from './palette.js';

const TWO_PI = Math.PI * 2;

describe('componentToHex', () => {
  it('pads single-digit values', () => {
    expect(componentToHex(0)).toBe('00');
    expect(componentToHex(15)).toBe('0f');
  });

  it('returns two chars for values >= 16', () => {
    expect(componentToHex(255)).toBe('ff');
    expect(componentToHex(128)).toBe('80');
  });
});

describe('rgbToHex', () => {
  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts a known color', () => {
    expect(rgbToHex(255, 0, 128)).toBe('#ff0080');
  });
});

describe('generatePalette', () => {
  const a = { x: 0.5, y: 0.5, z: 0.5 };
  const b = { x: 0.5, y: 0.5, z: 0.5 };
  const c = { x: 1, y: 1, z: 1 };
  const d = { x: 0, y: 0.33, z: 0.67 };

  it('returns r, g, b in [0, 255]', () => {
    const result = generatePalette(0, a, b, c, d, TWO_PI);
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThanOrEqual(255);
  });

  it('is deterministic for same inputs', () => {
    const first = generatePalette(0.25, a, b, c, d, TWO_PI);
    const second = generatePalette(0.25, a, b, c, d, TWO_PI);
    expect(first).toEqual(second);
  });

  it('varies with t', () => {
    const at0 = generatePalette(0, a, b, c, d, TWO_PI);
    const at05 = generatePalette(0.5, a, b, c, d, TWO_PI);
    expect(at0).not.toEqual(at05);
  });
});
