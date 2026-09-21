export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
};
export const signNotZero = (value) => (value < 0 ? -1 : 1);

export function hashNoise(x, seed = 1337) {
  const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export function smoothNoise1D(x, seed = 1337) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hashNoise(i, seed), hashNoise(i + 1, seed), u) * 2 - 1;
}

export function seededRandom(seedObj) {
  seedObj.value |= 0;
  seedObj.value = (seedObj.value + 0x6D2B79F5) | 0;
  let t = seedObj.value;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
