// Pure palette math — no p5, no DOM, no side effects.

export function generatePalette(t, a, b, c, d, TWO_PI) {
  const vec3 = (x, y, z) => ({ x, y, z });
  const addVec3 = (v1, v2) => vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
  const cosVec3 = (v) => vec3(Math.cos(v.x), Math.cos(v.y), Math.cos(v.z));
  const mulVec3 = (v, s) => vec3(v.x * s, v.y * s, v.z * s);
  const mulCw = (v1, v2) => vec3(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z);

  const term1 = addVec3(d, mulCw(c, vec3(t, t, t)));
  const term2 = cosVec3(mulVec3(term1, TWO_PI));
  const result = addVec3(a, mulCw(b, term2));

  return { r: result.x * 255, g: result.y * 255, b: result.z * 255 };
}

export function componentToHex(c) {
  const hex = Math.round(c).toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
