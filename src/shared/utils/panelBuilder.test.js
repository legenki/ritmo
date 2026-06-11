import { describe, it, expect } from 'vitest';
import { getByPath, setByPath } from '../ui/panelBuilder.js';

describe('getByPath', () => {
  it('reads a top-level key', () => {
    expect(getByPath({ a: 1 }, 'a')).toBe(1);
  });

  it('reads a nested dotted path', () => {
    expect(getByPath({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  it('returns undefined for missing key', () => {
    expect(getByPath({ a: 1 }, 'b')).toBeUndefined();
  });

  it('returns null without throwing when intermediate is null', () => {
    expect(getByPath({ a: null }, 'a.b')).toBeNull();
  });
});

describe('setByPath', () => {
  it('sets a top-level key', () => {
    const obj = { a: 0 };
    setByPath(obj, 'a', 99);
    expect(obj.a).toBe(99);
  });

  it('sets a nested dotted path', () => {
    const obj = { a: { b: { c: 0 } } };
    setByPath(obj, 'a.b.c', 7);
    expect(obj.a.b.c).toBe(7);
  });

  it('does not affect sibling keys', () => {
    const obj = { a: { x: 1, y: 2 } };
    setByPath(obj, 'a.x', 99);
    expect(obj.a.y).toBe(2);
  });
});
