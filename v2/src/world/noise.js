// 해시 · 값 노이즈 · fbm (텍스처와 지형 생성이 같이 씀)
export function hash(ix, iy, seed) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// 주기 period 로 이어지는 값 노이즈 (period 가 0 이면 비주기)
export function vnoise(x, y, period, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  let X0 = x0, X1 = x0 + 1, Y0 = y0, Y1 = y0 + 1;
  if (period) { X0 = ((x0 % period) + period) % period; X1 = (X0 + 1) % period; Y0 = ((y0 % period) + period) % period; Y1 = (Y0 + 1) % period; }
  const a = hash(X0, Y0, seed), b = hash(X1, Y0, seed), c = hash(X0, Y1, seed), d = hash(X1, Y1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
export function fbm(u, v, freq, oct, seed) {
  let s = 0, amp = 0.5, f = freq, norm = 0;
  for (let i = 0; i < oct; i++) { s += amp * vnoise(u * f, v * f, f, seed + i * 17); norm += amp; amp *= 0.5; f *= 2; }
  return s / norm;
}
// 비주기 fbm (지형용) — x,y 는 월드 좌표, scale 은 기본 파장
export function fbmWorld(x, y, scale, oct, seed) {
  let s = 0, amp = 0.5, f = 1 / scale, norm = 0;
  for (let i = 0; i < oct; i++) { s += amp * vnoise(x * f, y * f, 0, seed + i * 17); norm += amp; amp *= 0.5; f *= 2; }
  return s / norm;
}
// 시드 난수 (mulberry32)
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
