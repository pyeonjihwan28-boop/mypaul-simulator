// 절차적 PBR 텍스처 아틀라스 — 그림 파일 없이 코드로 만든다.
// 타일마다 albedo(sRGB)·height·roughness·metal·emissive·alpha 를 그린 뒤
// 4장의 아틀라스(albedo+alpha / normal / ORM / emissive)로 묶는다.
import { T, TILE_COUNT, ATLAS_COLS, ATLAS_ROWS } from './blocks.js';

import { hash, vnoise, fbm, clamp01, mix, smooth } from './noise.js';

// ---------- 타일 ----------
class Tile {
  constructor(n) {
    this.n = n; const m = n * n;
    this.a = new Float32Array(m * 3); this.h = new Float32Array(m); this.r = new Float32Array(m).fill(0.8);
    this.m = new Float32Array(m); this.e = new Float32Array(m * 3); this.al = new Float32Array(m).fill(1);
  }
  // 픽셀마다 콜백 (u,v,i) → 콜백이 색을 돌려주면 albedo 설정
  each(fn) { const n = this.n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) fn((x + 0.5) / n, (y + 0.5) / n, y * n + x, x, y); }
  set(i, rgb, h, r, m) { this.a[i * 3] = rgb[0]; this.a[i * 3 + 1] = rgb[1]; this.a[i * 3 + 2] = rgb[2]; if (h !== undefined) this.h[i] = h; if (r !== undefined) this.r[i] = r; if (m !== undefined) this.m[i] = m; }
  emit(i, rgb, k = 1) { this.e[i * 3] = rgb[0] * k; this.e[i * 3 + 1] = rgb[1] * k; this.e[i * 3 + 2] = rgb[2] * k; }
  scale(i, k) { this.a[i * 3] *= k; this.a[i * 3 + 1] *= k; this.a[i * 3 + 2] *= k; }
}
const col = (r, g, b) => [r, g, b];
const lerpc = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// 기본 재질: 색 + 미세 노이즈(얼룩) + 거친 정도
function base(t, color, { vary = 0.06, freq = 8, oct = 3, rough = 0.8, metal = 0, hAmp = 0.15, seed = 1 } = {}) {
  t.each((u, v, i) => {
    const n = fbm(u, v, freq, oct, seed);
    const k = 1 + (n - 0.5) * 2 * vary;
    t.set(i, [color[0] * k, color[1] * k, color[2] * k], (n - 0.5) * hAmp, rough, metal);
  });
}
// 벽돌: rows×cols, 교대로 반 칸 어긋남
function bricks(t, rows, cols, mortarW, brickColors, mortarColor, { rough = 0.85, seed = 5, depth = 0.6 } = {}) {
  t.each((u, v, i) => {
    const row = Math.floor(v * rows);
    const off = (row % 2) * 0.5;
    const bu = ((u + off / cols) * cols) % 1, bv = (v * rows) % 1;
    const inMortar = bu < mortarW || bu > 1 - mortarW || bv < mortarW || bv > 1 - mortarW;
    const bcol = Math.floor((u + off / cols) * cols);
    const pick = brickColors[Math.floor(hash(bcol, row, seed) * brickColors.length)];
    const grain = fbm(u, v, 16, 2, seed + 3) - 0.5;
    if (inMortar) t.set(i, lerpc(mortarColor, [0, 0, 0], 0.1 * grain + 0.05), -depth, 0.9, 0);
    else {
      const k = 1 + grain * 0.25;
      t.set(i, [pick[0] * k, pick[1] * k, pick[2] * k], 0.08 * fbm(u, v, 24, 2, seed + 7), rough, 0);
    }
  });
}
// 격자 타일(바닥·보도)
function tiles(t, nx, ny, groove, tileColor, grooveColor, { rough = 0.4, seed = 9, vary = 0.08, bevel = 0.08 } = {}) {
  t.each((u, v, i) => {
    const bu = (u * nx) % 1, bv = (v * ny) % 1;
    const d = Math.min(bu, 1 - bu, bv, 1 - bv);
    const tx = Math.floor(u * nx), ty = Math.floor(v * ny);
    const n = fbm(u, v, 12, 2, seed) - 0.5;
    if (d < groove) t.set(i, grooveColor, -0.8, 0.9, 0);
    else {
      const k = 1 + n * vary * 2 + (hash(tx, ty, seed) - 0.5) * vary;
      const h = smooth(groove, groove + bevel, d) * 0.9 - 0.9 + 0.9;
      t.set(i, [tileColor[0] * k, tileColor[1] * k, tileColor[2] * k], h * 0.5, rough, 0);
    }
  });
}
// 유리창: 틀 + 유리(알파) · lit 이면 안쪽을 따뜻하게 빛냄
function glass(t, { frame = 0.08, frameColor = col(0.9, 0.9, 0.9), tintColor = col(0.4, 0.5, 0.6), alpha = 0.45, lit = false, mullion = true, panes = 1 } = {}) {
  t.each((u, v, i) => {
    const d = Math.min(u, 1 - u, v, 1 - v);
    let isFrame = d < frame;
    if (mullion) {
      const mu = Math.abs(((u * panes) % 1) - 0.5) < frame * 0.5 * panes && panes > 1;
      const mv = Math.abs(v - 0.5) < frame * 0.45;
      if (mu || mv) isFrame = true;
    }
    if (isFrame) { t.set(i, frameColor, 0.6, 0.5, 0.15); t.al[i] = 1; }
    else {
      const n = fbm(u, v, 6, 2, 21) - 0.5;
      if (lit) {
        const warm = [1.0, 0.86, 0.62];
        const curtain = smooth(0.55, 0.75, fbm(u * 0.5, v, 4, 2, 44)) * 0.5;
        t.set(i, lerpc(lerpc(tintColor, col(0.85, 0.75, 0.55), 0.45), col(0.55, 0.47, 0.38), curtain), 0, 0.08, 0); // 낮엔 보통 창처럼, 밤엔 발광
        t.emit(i, warm, 0.85 - curtain * 0.6 + n * 0.1); t.al[i] = 0.62;
      } else { t.set(i, [tintColor[0] + n * 0.05, tintColor[1] + n * 0.05, tintColor[2] + n * 0.05], 0, 0.04, 0); t.al[i] = alpha; }
    }
  });
}
// 세로 판자/널빤지
function planks(t, count, color, { rough = 0.75, seed = 31, horizontal = false, gap = 0.03 } = {}) {
  t.each((u, v, i) => {
    const a = horizontal ? v : u, b = horizontal ? u : v;
    const p = Math.floor(a * count), pa = (a * count) % 1;
    const grain = fbm(b * 1, a * 6, 20, 3, seed + p * 3) - 0.5;
    const edge = pa < gap || pa > 1 - gap;
    const k = 1 + grain * 0.35 + (hash(p, 0, seed) - 0.5) * 0.15;
    if (edge) t.set(i, [color[0] * 0.4, color[1] * 0.4, color[2] * 0.4], -0.7, 0.9, 0);
    else t.set(i, [color[0] * k, color[1] * k, color[2] * k], grain * 0.2, rough, 0);
  });
}
// 글자 간판 (캔버스로 한글 렌더) — bg 위에 fg 글자, 글자와 바탕이 은은히 빛남
let _tc = null;
function text(t, str, { bg = col(0.8, 0.1, 0.1), fg = col(1, 1, 1), glow = 1.0, font = 'Black Han Sans', size = 0.45, bgGlow = 0.35, border = 0.05 } = {}) {
  const n = t.n;
  if (!_tc || _tc.width !== n) { _tc = document.createElement('canvas'); _tc.width = _tc.height = n; }
  const c = _tc.getContext('2d', { willReadFrequently: true });
  c.clearRect(0, 0, n, n); c.fillStyle = '#000'; c.fillRect(0, 0, n, n);
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let px = Math.floor(n * size); c.font = `700 ${px}px "${font}", "Noto Sans KR", "Noto Sans CJK KR", "Malgun Gothic", sans-serif`;
  while (c.measureText(str).width > n * (1 - border * 2 - 0.08) && px > 6) { px -= 2; c.font = `700 ${px}px "${font}", "Noto Sans KR", "Noto Sans CJK KR", "Malgun Gothic", sans-serif`; }
  c.fillText(str, n / 2, n / 2 + px * 0.04);
  const d = c.getImageData(0, 0, n, n).data;
  t.each((u, v, i, x, y) => {
    const m = d[(y * n + x) * 4] / 255; // 글자 마스크
    const dd = Math.min(u, 1 - u, v, 1 - v);
    if (dd < border) { t.set(i, lerpc(bg, [0, 0, 0], 0.55), 0.5, 0.5, 0.3); return; }
    const c2 = lerpc(bg, fg, m);
    t.set(i, c2, 0.1 * m, 0.35, 0);
    t.emit(i, lerpc(bg, fg, m), bgGlow + m * (glow - bgGlow));
  });
}
function stripeV(t, cx, w, color, { emissive = 0, h = 0.1, rough = 0.6, along = 'v', dash = null } = {}) {
  t.each((u, v, i) => {
    const a = along === 'v' ? u : v, b = along === 'v' ? v : u;
    if (Math.abs(a - cx) < w / 2 && (!dash || (b > dash[0] && b < dash[1]))) {
      const n = fbm(u, v, 16, 2, 77) - 0.5;
      t.set(i, [color[0] + n * 0.08, color[1] + n * 0.08, color[2] + n * 0.08], h, rough, 0);
      if (emissive) t.emit(i, color, emissive);
    }
  });
}

// ---------- 타일 생성기 (T 순서와 같게) ----------
const GREEN = col(0.33, 0.52, 0.2), DIRT = col(0.42, 0.3, 0.2), ASPH = col(0.17, 0.17, 0.18), CONC = col(0.64, 0.63, 0.6);
const SCHOOL_GREEN = col(0.16, 0.5, 0.3), WHITE = col(0.93, 0.92, 0.88);
const GEN = {};
GEN[T.grass_top] = (t) => {
  base(t, GREEN, { vary: 0.14, freq: 6, oct: 4, rough: 0.9, hAmp: 0.3, seed: 2 });
  t.each((u, v, i) => { // 풀잎 점
    const s = hash(Math.floor(u * t.n), Math.floor(v * t.n), 99);
    if (s > 0.93) { t.scale(i, 1.25); t.h[i] += 0.3; } else if (s < 0.05) { t.scale(i, 0.8); }
    const patch = fbm(u, v, 3, 2, 8); const c = lerpc(GREEN, col(0.45, 0.55, 0.18), smooth(0.55, 0.75, patch) * 0.6);
    const k = t.a[i * 3] / GREEN[0]; t.set(i, [c[0] * k, c[1] * k, c[2] * k]);
  });
};
GEN[T.grass_side] = (t) => {
  base(t, DIRT, { vary: 0.14, freq: 8, oct: 3, rough: 0.9, hAmp: 0.25, seed: 3 });
  t.each((u, v, i) => {
    const edge = 0.18 + (fbm(u, 0, 8, 2, 12) - 0.5) * 0.14;
    if (v < edge) { const k = 1 + (fbm(u, v, 8, 3, 2) - 0.5) * 0.3; t.set(i, [GREEN[0] * k, GREEN[1] * k, GREEN[2] * k], 0.2, 0.9); }
  });
};
GEN[T.dirt] = (t) => {
  base(t, DIRT, { vary: 0.16, freq: 8, oct: 4, rough: 0.9, hAmp: 0.3, seed: 4 });
  t.each((u, v, i) => { const p = fbm(u, v, 14, 2, 41); if (p > 0.68) { t.scale(i, 1.2); t.h[i] += 0.4; t.r[i] = 0.7; } });
};
GEN[T.stone] = (t) => {
  base(t, col(0.5, 0.5, 0.49), { vary: 0.12, freq: 6, oct: 4, rough: 0.75, hAmp: 0.4, seed: 5 });
  t.each((u, v, i) => { const c = fbm(u, v, 5, 3, 51); if (Math.abs(c - 0.5) < 0.012) { t.scale(i, 0.6); t.h[i] -= 0.6; } });
};
GEN[T.asphalt] = (t) => {
  base(t, ASPH, { vary: 0.1, freq: 32, oct: 2, rough: 0.88, hAmp: 0.2, seed: 6 });
  t.each((u, v, i) => { const s = hash(Math.floor(u * t.n), Math.floor(v * t.n), 61); if (s > 0.97) { t.scale(i, 1.6); t.h[i] += 0.3; } });
};
GEN[T.lane_white] = (t) => { GEN[T.asphalt](t); stripeV(t, 0.5, 0.14, col(0.9, 0.9, 0.88), { dash: [0.15, 0.85], rough: 0.6 }); };
GEN[T.lane_yellow] = (t) => { GEN[T.asphalt](t); stripeV(t, 0.4, 0.1, col(0.95, 0.72, 0.15), { rough: 0.6 }); stripeV(t, 0.6, 0.1, col(0.95, 0.72, 0.15), { rough: 0.6 }); };
GEN[T.crosswalk] = (t) => { GEN[T.asphalt](t); stripeV(t, 0.5, 0.5, col(0.9, 0.9, 0.88), { along: 'h', rough: 0.6 }); };
GEN[T.sidewalk] = (t) => tiles(t, 2, 2, 0.025, col(0.72, 0.7, 0.66), col(0.4, 0.4, 0.38), { rough: 0.8, vary: 0.1, bevel: 0.05 });
GEN[T.curb] = (t) => { base(t, col(0.7, 0.69, 0.66), { vary: 0.06, freq: 12, rough: 0.8, seed: 7 }); t.each((u, v, i) => { if (v < 0.12) { t.scale(i, 0.85); t.h[i] -= 0.5; } }); };
GEN[T.school_wall] = (t) => base(t, WHITE, { vary: 0.035, freq: 10, oct: 3, rough: 0.62, hAmp: 0.12, seed: 8 });
GEN[T.school_band] = (t) => base(t, SCHOOL_GREEN, { vary: 0.03, freq: 8, oct: 2, rough: 0.45, hAmp: 0.05, seed: 9 });
GEN[T.window] = (t) => glass(t, { frame: 0.07, frameColor: WHITE, tintColor: col(0.42, 0.5, 0.58), alpha: 0.42, panes: 2 });
GEN[T.window_lit] = (t) => glass(t, { frame: 0.07, frameColor: WHITE, lit: true, panes: 2 });
GEN[T.door] = (t) => {
  planks(t, 3, col(0.2, 0.42, 0.3), { rough: 0.5, seed: 11, gap: 0.02 });
  t.each((u, v, i) => {
    const d = Math.min(u, 1 - u, v, 1 - v);
    if (d < 0.06) t.set(i, col(0.6, 0.6, 0.58), 0.5, 0.5, 0.2);
    if (Math.abs(u - 0.8) < 0.05 && Math.abs(v - 0.5) < 0.025) t.set(i, col(0.85, 0.8, 0.6), 0.8, 0.3, 1);
    if (u > 0.2 && u < 0.8 && v > 0.1 && v < 0.42) { t.set(i, col(0.5, 0.6, 0.68), 0.1, 0.05, 0); }
  });
};
GEN[T.roof_green] = (t) => {
  t.each((u, v, i) => {
    const rows = 4, row = Math.floor(v * rows), rv = (v * rows) % 1, off = (row % 2) * 0.5, cu = ((u + off / 3) * 3) % 1;
    const c = col(0.14, 0.36, 0.26); const n = fbm(u, v, 10, 3, 13) - 0.5;
    const shade = 0.75 + rv * 0.35 + n * 0.2 + (hash(Math.floor((u + off / 3) * 3), row, 14) - 0.5) * 0.15;
    const gapv = rv < 0.07, gapu = cu < 0.03;
    t.set(i, [c[0] * shade, c[1] * shade, c[2] * shade], gapv || gapu ? -0.6 : rv * 0.6, 0.7, 0);
  });
};
GEN[T.concrete] = (t) => { base(t, CONC, { vary: 0.07, freq: 10, oct: 4, rough: 0.78, hAmp: 0.2, seed: 15 }); t.each((u, v, i) => { if (fbm(u, v, 20, 2, 16) > 0.7) { t.scale(i, 0.85); t.h[i] -= 0.4; } }); };
GEN[T.floor_tile] = (t) => tiles(t, 4, 4, 0.02, col(0.86, 0.84, 0.78), col(0.45, 0.43, 0.4), { rough: 0.25, vary: 0.05 });
GEN[T.brick] = (t) => bricks(t, 4, 2, 0.06, [col(0.62, 0.3, 0.22), col(0.68, 0.36, 0.26), col(0.55, 0.27, 0.2), col(0.7, 0.42, 0.3)], col(0.72, 0.7, 0.65));
GEN[T.wall_beige] = (t) => base(t, col(0.84, 0.76, 0.62), { vary: 0.05, freq: 10, oct: 3, rough: 0.7, hAmp: 0.15, seed: 17 });
GEN[T.wall_gray] = (t) => base(t, col(0.68, 0.68, 0.66), { vary: 0.05, freq: 10, oct: 3, rough: 0.7, hAmp: 0.15, seed: 18 });
GEN[T.apt_wall] = (t) => {
  base(t, col(0.86, 0.82, 0.74), { vary: 0.04, freq: 8, oct: 3, rough: 0.65, hAmp: 0.1, seed: 19 });
  t.each((u, v, i) => { if (v > 0.95 || v < 0.02) { t.scale(i, 0.7); t.h[i] -= 0.5; } const stain = fbm(u * 0.3, v, 3, 2, 20); if (stain > 0.72) t.scale(i, 0.92); });
};
GEN[T.apt_window] = (t) => glass(t, { frame: 0.06, frameColor: col(0.55, 0.57, 0.6), tintColor: col(0.3, 0.38, 0.46), alpha: 0.5, panes: 2 });
GEN[T.apt_window_lit] = (t) => glass(t, { frame: 0.06, frameColor: col(0.55, 0.57, 0.6), lit: true, panes: 2 });
GEN[T.balcony] = (t) => { base(t, col(0.8, 0.78, 0.74), { vary: 0.04, freq: 8, rough: 0.7, seed: 21 }); t.each((u, v, i) => { if (v > 0.8) { t.scale(i, 0.9); t.h[i] += 0.6; } if (v < 0.1) { t.scale(i, 0.75); t.h[i] -= 0.4; } }); };
GEN[T.shop_glass] = (t) => glass(t, { frame: 0.04, frameColor: col(0.25, 0.25, 0.27), tintColor: col(0.45, 0.52, 0.58), alpha: 0.32, mullion: false });
GEN[T.sign_bunsik] = (t) => text(t, '분식', { bg: col(0.85, 0.12, 0.1), fg: col(1, 0.97, 0.85) });
GEN[T.sign_conv] = (t) => text(t, '편의점', { bg: col(0.1, 0.55, 0.3), fg: col(1, 1, 1), size: 0.38 });
GEN[T.sign_stationery] = (t) => text(t, '문구', { bg: col(0.15, 0.4, 0.8), fg: col(1, 0.9, 0.3) });
GEN[T.sign_academy] = (t) => text(t, '학원', { bg: col(0.1, 0.16, 0.36), fg: col(1, 1, 1) });
GEN[T.sign_pc] = (t) => text(t, 'PC방', { bg: col(0.35, 0.1, 0.5), fg: col(0.4, 1, 0.95), size: 0.4 });
GEN[T.sign_cafe] = (t) => text(t, '카페', { bg: col(0.35, 0.22, 0.14), fg: col(1, 0.93, 0.8) });
GEN[T.log_side] = (t) => {
  t.each((u, v, i) => {
    const ridge = fbm(u * 6, v, 12, 3, 23); const n = fbm(u, v, 8, 2, 24) - 0.5;
    const c = lerpc(col(0.36, 0.26, 0.16), col(0.5, 0.38, 0.24), ridge);
    t.set(i, [c[0] + n * 0.05, c[1] + n * 0.05, c[2] + n * 0.05], (ridge - 0.5) * 0.9, 0.85, 0);
  });
};
GEN[T.log_top] = (t) => {
  t.each((u, v, i) => {
    const dx = u - 0.5, dy = v - 0.5, d = Math.sqrt(dx * dx + dy * dy) * 2;
    const ring = Math.sin(d * 28 + fbm(u, v, 4, 2, 25) * 3) * 0.5 + 0.5;
    const c = d > 0.92 ? col(0.36, 0.26, 0.16) : lerpc(col(0.76, 0.62, 0.4), col(0.6, 0.46, 0.28), ring);
    t.set(i, c, d > 0.92 ? -0.3 : ring * 0.15, 0.75, 0);
  });
};
GEN[T.leaves] = (t) => {
  t.each((u, v, i) => {
    const n = fbm(u, v, 6, 4, 26); const n2 = fbm(u, v, 14, 2, 27);
    const c = lerpc(col(0.2, 0.42, 0.14), col(0.4, 0.62, 0.22), n);
    t.set(i, [c[0] * (0.9 + n2 * 0.3), c[1] * (0.9 + n2 * 0.3), c[2] * (0.9 + n2 * 0.3)], (n - 0.5) * 0.8, 0.9, 0);
    t.al[i] = n2 > 0.36 || n > 0.6 ? 1 : 0;
  });
};
GEN[T.planks] = (t) => planks(t, 4, col(0.68, 0.52, 0.32), { horizontal: true, seed: 28 });
GEN[T.fence] = (t) => {
  t.each((u, v, i) => {
    const post = Math.abs(u - 0.5) < 0.12, rail = Math.abs(v - 0.3) < 0.09 || Math.abs(v - 0.7) < 0.09;
    t.al[i] = post || rail ? 1 : 0;
    const g = fbm(u, v * 5, 10, 3, 29) - 0.5; const c = col(0.6, 0.46, 0.28);
    t.set(i, [c[0] * (1 + g * 0.4), c[1] * (1 + g * 0.4), c[2] * (1 + g * 0.4)], post ? 0.5 : 0, 0.8, 0);
  });
};
GEN[T.fence_white] = (t) => {
  t.each((u, v, i) => {
    const post = Math.abs(u - 0.5) < 0.1, rail = Math.abs(v - 0.25) < 0.07 || Math.abs(v - 0.62) < 0.07, pick = Math.abs(((u * 4) % 1) - 0.5) < 0.12 && v > 0.15;
    t.al[i] = post || rail || pick ? 1 : 0;
    t.set(i, col(0.93, 0.94, 0.93), post ? 0.4 : 0, 0.5, 0.3);
  });
};
GEN[T.paint_white] = (t) => base(t, col(0.94, 0.94, 0.92), { vary: 0.02, freq: 6, oct: 2, rough: 0.5, hAmp: 0.03, seed: 61 });
GEN[T.paint_red] = (t) => base(t, col(0.78, 0.2, 0.17), { vary: 0.03, freq: 6, oct: 2, rough: 0.55, hAmp: 0.03, seed: 62 });
GEN[T.paint_blue] = (t) => base(t, col(0.2, 0.36, 0.65), { vary: 0.03, freq: 6, oct: 2, rough: 0.55, hAmp: 0.03, seed: 63 });
GEN[T.paint_yellow] = (t) => base(t, col(0.9, 0.72, 0.18), { vary: 0.03, freq: 6, oct: 2, rough: 0.55, hAmp: 0.03, seed: 64 });
GEN[T.court] = (t) => base(t, col(0.72, 0.71, 0.66), { vary: 0.04, freq: 12, oct: 3, rough: 0.85, hAmp: 0.08, seed: 65 });
GEN[T.sand] = (t) => base(t, col(0.84, 0.76, 0.55), { vary: 0.08, freq: 24, oct: 3, rough: 0.95, hAmp: 0.15, seed: 30 });
GEN[T.track] = (t) => base(t, col(0.6, 0.26, 0.2), { vary: 0.1, freq: 32, oct: 2, rough: 0.92, hAmp: 0.12, seed: 31 });
GEN[T.field_line] = (t) => { GEN[T.grass_top](t); stripeV(t, 0.5, 0.16, col(0.95, 0.95, 0.92), { rough: 0.85, h: 0.05 }); };
GEN[T.iron] = (t) => { base(t, col(0.4, 0.41, 0.43), { vary: 0.06, freq: 8, oct: 3, rough: 0.4, metal: 1, hAmp: 0.08, seed: 32 }); t.each((u, v, i) => { if (fbm(u * 8, v, 16, 2, 33) > 0.74) { t.scale(i, 1.25); t.r[i] = 0.3; } }); };
GEN[T.lamp_head] = (t) => {
  t.each((u, v, i) => {
    const d = Math.min(u, 1 - u, v, 1 - v);
    if (d < 0.1) t.set(i, col(0.3, 0.31, 0.33), 0.4, 0.4, 1);
    else { t.set(i, col(1, 0.95, 0.85), 0, 0.3, 0); t.emit(i, col(1, 0.9, 0.72), 1.4); }
  });
};
GEN[T.stone_pillar] = (t) => { base(t, col(0.58, 0.55, 0.52), { vary: 0.1, freq: 32, oct: 3, rough: 0.55, hAmp: 0.1, seed: 34 }); t.each((u, v, i) => { const s = hash(Math.floor(u * t.n), Math.floor(v * t.n), 35); if (s > 0.9) t.scale(i, 1.3); else if (s < 0.08) t.scale(i, 0.7); const d = Math.min(u, 1 - u, v, 1 - v); if (d < 0.05) t.h[i] -= 0.5; }); };
GEN[T.water] = (t) => { t.each((u, v, i) => { const n = fbm(u, v, 4, 3, 36); t.set(i, col(0.2 + n * 0.1, 0.42 + n * 0.1, 0.6 + n * 0.1), (n - 0.5) * 0.5, 0.03, 0); t.al[i] = 0.6; }); };
GEN[T.gravel] = (t) => { base(t, col(0.55, 0.52, 0.47), { vary: 0.14, freq: 16, oct: 3, rough: 0.9, hAmp: 0.4, seed: 37 }); t.each((u, v, i) => { const p = fbm(u, v, 20, 2, 38); if (p > 0.6) { t.scale(i, 1.15); t.h[i] += 0.5; } }); };
GEN[T.school_sign] = (t) => text(t, '마이폴', { bg: col(0.12, 0.3, 0.22), fg: col(1, 1, 1), size: 0.4 });
GEN[T.roof_flat] = (t) => { base(t, col(0.22, 0.5, 0.36), { vary: 0.05, freq: 10, oct: 3, rough: 0.55, hAmp: 0.08, seed: 39 }); t.each((u, v, i) => { if (fbm(u, v, 6, 2, 40) > 0.68) t.scale(i, 0.9); }); };
GEN[T.glass_green] = (t) => glass(t, { frame: 0.05, frameColor: col(0.35, 0.37, 0.38), tintColor: col(0.3, 0.52, 0.45), alpha: 0.5, mullion: false });
GEN[T.cross] = (t) => { base(t, WHITE, { vary: 0.02, freq: 8, rough: 0.6, seed: 41 }); t.each((u, v, i) => { const inC = Math.abs(u - 0.5) < 0.1 || (Math.abs(v - 0.38) < 0.1 && Math.abs(u - 0.5) < 0.32); if (inC) { t.set(i, col(0.95, 0.9, 0.75), 0.6, 0.3, 0.6); t.emit(i, col(1, 0.9, 0.7), 0.8); } }); };
GEN[T.flag] = (t) => { // 태극기(단순화)
  t.each((u, v, i) => {
    t.al[i] = (v > 0.08 && v < 0.72) ? 1 : 0; let c = col(0.97, 0.97, 0.97);
    const dx = u - 0.5, dy = (v - 0.5) * 1.5, d = Math.sqrt(dx * dx + dy * dy);
    if (d < 0.17) { const s = Math.sin(Math.atan2(dy, dx) * 1 + 0.6) * 0.5 + 0.5; const sep = dy - 0.12 * Math.sin(dx / 0.17 * Math.PI); c = (dy * 0.9 + dx * 0.45 + (s - 0.5) * 0.06 + sep * 0.2) < 0 ? col(0.8, 0.1, 0.15) : col(0.05, 0.25, 0.6); }
    const bars = [[0.22, 0.28], [0.78, 0.28], [0.22, 0.72], [0.78, 0.72]];
    for (const [bx, by] of bars) if (Math.abs(u - bx) < 0.06 && Math.abs(v - by) < 0.07 && ((Math.abs((v - by) * 14) % 1) < 0.65)) c = col(0.05, 0.05, 0.05);
    t.set(i, c, 0, 0.7, 0);
  });
};
GEN[T.bench] = (t) => planks(t, 3, col(0.5, 0.34, 0.2), { horizontal: true, seed: 42, gap: 0.08 });
GEN[T.goal] = (t) => { t.each((u, v, i) => { const post = Math.abs(u - 0.5) < 0.1 || v < 0.1; const net = (Math.abs(((u * 6) % 1) - 0.5) < 0.05) || (Math.abs(((v * 6) % 1) - 0.5) < 0.05); t.al[i] = post ? 1 : net ? 0.8 : 0; t.set(i, post ? col(0.95, 0.95, 0.95) : col(0.9, 0.9, 0.9), post ? 0.5 : 0, post ? 0.4 : 0.9, post ? 0.3 : 0); }); };
GEN[T.hedge] = (t) => { t.each((u, v, i) => { const n = fbm(u, v, 8, 4, 43); const c = lerpc(col(0.1, 0.28, 0.1), col(0.28, 0.5, 0.18), n); t.set(i, c, (n - 0.5) * 0.9, 0.9, 0); if (hash(Math.floor(u * t.n / 2), Math.floor(v * t.n / 2), 44) > 0.985) t.set(i, col(0.5, 0.75, 0.3)); }); };
GEN[T.flowers] = (t) => { GEN[T.grass_top](t); t.each((u, v, i) => { const s = hash(Math.floor(u * 16), Math.floor(v * 16), 45); const cu = ((u * 16) % 1) - 0.5, cv = ((v * 16) % 1) - 0.5; if (s > 0.55 && cu * cu + cv * cv < 0.09) { const pal = [col(0.95, 0.35, 0.55), col(0.98, 0.85, 0.25), col(0.98, 0.98, 0.95), col(0.9, 0.2, 0.25), col(0.6, 0.4, 0.9)]; t.set(i, pal[Math.floor(s * 97) % 5], 0.3, 0.8, 0); } }); };
GEN[T.plaza] = (t) => tiles(t, 1, 1, 0.03, col(0.72, 0.66, 0.58), col(0.42, 0.4, 0.37), { rough: 0.65, vary: 0.05, bevel: 0.06 });
GEN[T.stop_line] = (t) => { GEN[T.asphalt](t); stripeV(t, 0.5, 0.35, col(0.9, 0.9, 0.88), { rough: 0.6 }); };
GEN[T.pine_leaves] = (t) => { t.each((u, v, i) => { const n = fbm(u, v, 8, 4, 46), n2 = fbm(u * 3, v, 24, 2, 47); const c = lerpc(col(0.08, 0.26, 0.14), col(0.22, 0.45, 0.24), n); t.set(i, c, (n - 0.5) * 0.8, 0.9, 0); t.al[i] = n2 > 0.4 || n > 0.62 ? 1 : 0; }); };
const awning = (c1) => (t) => t.each((u, v, i) => { const s = Math.floor(u * 6) % 2 === 0; const c = s ? c1 : col(0.95, 0.94, 0.9); const n = fbm(u, v, 12, 2, 48) - 0.5; t.set(i, [c[0] + n * 0.04, c[1] + n * 0.04, c[2] + n * 0.04], Math.sin(u * 6 * Math.PI) * 0.1, 0.85, 0); });
GEN[T.awning_red] = awning(col(0.8, 0.15, 0.15)); GEN[T.awning_blue] = awning(col(0.15, 0.3, 0.7)); GEN[T.awning_green] = awning(col(0.15, 0.5, 0.3));
GEN[T.parking] = (t) => { GEN[T.asphalt](t); stripeV(t, 0.06, 0.12, col(0.9, 0.9, 0.88), { rough: 0.6 }); };
GEN[T.tank] = (t) => { base(t, col(0.78, 0.8, 0.82), { vary: 0.05, freq: 6, rough: 0.35, metal: 0.9, seed: 49 }); t.each((u, v, i) => { if (Math.abs(((u * 4) % 1) - 0.5) < 0.04) { t.scale(i, 0.8); t.h[i] -= 0.5; } }); };
GEN[T.chalkboard] = (t) => { t.each((u, v, i) => { const d = Math.min(u, 1 - u, v, 1 - v); if (d < 0.06) { const g = fbm(u, v * 4, 10, 2, 50) - 0.5; t.set(i, col(0.55 + g * 0.1, 0.4 + g * 0.08, 0.25), 0.5, 0.7, 0); } else { const n = fbm(u, v, 8, 3, 51); t.set(i, col(0.12 + n * 0.05, 0.3 + n * 0.05, 0.22 + n * 0.04), 0, 0.6, 0); if (fbm(u * 2, v, 30, 2, 52) > 0.78 && v > 0.2 && v < 0.6) t.set(i, col(0.85, 0.85, 0.8)); } }); };
GEN[T.bookshelf] = (t) => { t.each((u, v, i) => { const row = Math.floor(v * 3), rv = (v * 3) % 1; if (rv < 0.12 || u < 0.04 || u > 0.96) { t.set(i, col(0.4, 0.28, 0.16), 0.5, 0.7, 0); return; } const b = Math.floor(u * 9 + row * 3); const pal = [col(0.7, 0.2, 0.2), col(0.2, 0.3, 0.6), col(0.85, 0.75, 0.3), col(0.2, 0.5, 0.3), col(0.9, 0.9, 0.85), col(0.5, 0.25, 0.4)]; const c = pal[Math.floor(hash(b, row, 53) * pal.length)]; const h = hash(b, row + 7, 54); if (rv > 0.3 + h * 0.5) t.set(i, c, 0, 0.6, 0); else t.set(i, col(0.12, 0.09, 0.06), -0.8, 0.9, 0); }); };
GEN[T.desk] = (t) => planks(t, 1, col(0.76, 0.62, 0.42), { horizontal: true, seed: 55, gap: 0.0, rough: 0.45 });
GEN[T.lamp_pole] = (t) => { t.each((u, v, i) => { t.al[i] = Math.abs(u - 0.5) < 0.14 ? 1 : 0; const sh = 1 - Math.abs(u - 0.5) / 0.14 * 0.5; t.set(i, col(0.3 * sh, 0.31 * sh, 0.33 * sh), 0.5, 0.4, 1); }); };
GEN[T.sign_mart] = (t) => text(t, '마트', { bg: col(0.95, 0.75, 0.1), fg: col(0.8, 0.1, 0.1) });
GEN[T.sign_chicken] = (t) => text(t, '치킨', { bg: col(0.9, 0.45, 0.1), fg: col(1, 1, 1) });
GEN[T.sign_bakery] = (t) => text(t, '빵집', { bg: col(0.45, 0.28, 0.15), fg: col(1, 0.93, 0.78) });
GEN[T.sign_pharmacy] = (t) => text(t, '약국', { bg: col(0.1, 0.5, 0.25), fg: col(1, 1, 1) });
GEN[T.brick_dark] = (t) => bricks(t, 4, 2, 0.06, [col(0.22, 0.2, 0.2), col(0.28, 0.25, 0.24), col(0.18, 0.17, 0.17)], col(0.45, 0.44, 0.42));
GEN[T.roof_red] = (t) => { GEN[T.roof_green](t); t.each((u, v, i) => { const k = t.a[i * 3 + 1] / 0.36; t.set(i, [0.55 * k, 0.22 * k, 0.16 * k]); }); };
GEN[T.apt_sign] = (t) => text(t, '아파트', { bg: col(0.1, 0.18, 0.4), fg: col(1, 1, 1), size: 0.36, glow: 0.8 });
GEN[T.bus_stop] = (t) => glass(t, { frame: 0.06, frameColor: col(0.2, 0.35, 0.6), tintColor: col(0.5, 0.56, 0.62), alpha: 0.3, mullion: false });
GEN[T.traffic_light] = (t) => { t.each((u, v, i) => { t.set(i, col(0.1, 0.1, 0.1), 0, 0.5, 0.6); const lights = [[0.2, col(1, 0.15, 0.1), 0.15], [0.5, col(1, 0.8, 0.1), 0.0], [0.8, col(0.2, 1, 0.3), 1.2]]; for (const [cy, c, e] of lights) { const d = Math.hypot(u - 0.5, (v - cy) * 1.0); if (d < 0.12) { t.set(i, e > 0.5 ? c : lerpc(c, col(0, 0, 0), 0.6), 0.3, 0.2, 0); t.emit(i, c, e); } } }); };
GEN[T.water_deep] = (t) => { GEN[T.water](t); t.each((u, v, i) => { t.scale(i, 0.6); t.al[i] = 0.78; }); };
GEN[T.wood_dark] = (t) => planks(t, 4, col(0.34, 0.24, 0.15), { horizontal: true, seed: 56 });
GEN[T.marble] = (t) => { t.each((u, v, i) => { const n = fbm(u, v, 3, 4, 57), vein = Math.abs(fbm(u, v, 5, 3, 58) - 0.5); const c = lerpc(col(0.93, 0.92, 0.9), col(0.6, 0.6, 0.62), smooth(0.0, 0.03, vein) < 1 ? 0.6 : n * 0.15); t.set(i, c, 0, 0.18, 0); }); };
GEN[T.lane_edge] = (t) => { GEN[T.asphalt](t); stripeV(t, 0.5, 0.12, col(0.9, 0.9, 0.88), { rough: 0.6 }); };
GEN[T.hill_grass] = (t) => { GEN[T.grass_top](t); t.each((u, v, i) => { const k = 0.95 + fbm(u, v, 4, 2, 59) * 0.2; t.set(i, [t.a[i * 3] * k * 1.08, t.a[i * 3 + 1] * k, t.a[i * 3 + 2] * k * 0.8]); if (hash(Math.floor(u * 24), Math.floor(v * 24), 60) > 0.97 && ((u * 24) % 1) < 0.5 && ((v * 24) % 1) < 0.5) t.set(i, col(0.98, 0.95, 0.6)); }); };

GEN[T.planks_line] = (t) => { GEN[T.planks](t); stripeV(t, 0.5, 0.14, col(0.95, 0.95, 0.92), { rough: 0.5, h: 0.02 }); };
GEN[T.track_line] = (t) => { GEN[T.track](t); stripeV(t, 0.5, 0.12, col(0.95, 0.95, 0.92), { rough: 0.8, h: 0.02 }); };
GEN[T.stained] = (t) => { // 색유리 조각(납선 포함)
  t.each((u, v, i) => {
    const cx = Math.floor(u * 4), cy = Math.floor(v * 5); const d = Math.min(Math.abs(((u * 4) % 1) - 0.5), Math.abs(((v * 5) % 1) - 0.5));
    const pal = [col(0.85, 0.2, 0.25), col(0.2, 0.4, 0.85), col(0.95, 0.75, 0.2), col(0.2, 0.65, 0.35), col(0.6, 0.3, 0.7), col(0.9, 0.5, 0.2)];
    const c = pal[Math.floor(hash(cx, cy, 91) * pal.length)];
    if (d > 0.44) { t.set(i, col(0.15, 0.15, 0.15), 0.5, 0.5, 0.8); t.al[i] = 1; }
    else { const n = fbm(u, v, 8, 2, 92) - 0.5; t.set(i, [c[0] + n * 0.1, c[1] + n * 0.1, c[2] + n * 0.1], 0, 0.08, 0); t.al[i] = 0.62; t.emit(i, c, 0.25); }
  });
};
GEN[T.locker] = (t) => { t.each((u, v, i) => { const col2 = Math.floor(u * 2), lu = (u * 2) % 1; const edge = lu < 0.05 || lu > 0.95 || v < 0.04 || v > 0.96; const c = col(0.55, 0.62, 0.7); const n = fbm(u, v, 10, 2, 93) - 0.5; if (edge) t.set(i, lerpc(c, [0, 0, 0], 0.45), -0.6, 0.5, 0.8); else { t.set(i, [c[0] + n * 0.05, c[1] + n * 0.05, c[2] + n * 0.05], 0, 0.4, 0.7); if (Math.abs(lu - 0.8) < 0.06 && Math.abs(v - 0.5) < 0.1) t.set(i, col(0.3, 0.3, 0.32), 0.4, 0.3, 1); if (Math.abs(v - 0.2) < 0.03 && lu > 0.15 && lu < 0.85) { t.scale(i, 0.6); t.h[i] -= 0.4; } } }); };
GEN[T.monitor] = (t) => { t.each((u, v, i) => { const d = Math.min(u, 1 - u, v, 1 - v); if (d < 0.08 || v > 0.86) t.set(i, col(0.08, 0.08, 0.09), 0.3, 0.4, 0.6); else { const n = fbm(u, v, 6, 2, 94); const c = col(0.15 + n * 0.1, 0.35 + n * 0.2, 0.7 + n * 0.2); t.set(i, c, 0, 0.1, 0); t.emit(i, c, 0.6); if (hash(Math.floor(u * 12), Math.floor(v * 10), 95) > 0.8 && v > 0.2 && v < 0.75) t.set(i, col(0.9, 0.95, 1)); } }); };
GEN[T.bed] = (t) => { t.each((u, v, i) => { const n = fbm(u, v, 8, 2, 96) - 0.5; if (v < 0.3) t.set(i, col(0.95 + n * 0.03, 0.95 + n * 0.03, 0.97), 0.3 * (1 - v / 0.3), 0.8, 0); else { const stripe = Math.floor(v * 10) % 2 === 0; const c = stripe ? col(0.55, 0.68, 0.85) : col(0.7, 0.8, 0.92); t.set(i, [c[0] + n * 0.05, c[1] + n * 0.05, c[2] + n * 0.05], n * 0.2, 0.9, 0); } }); };
GEN[T.piano] = (t) => { base(t, col(0.06, 0.06, 0.07), { vary: 0.03, freq: 6, rough: 0.12, hAmp: 0.02, seed: 97 }); t.each((u, v, i) => { if (v > 0.6 && v < 0.75) { const k = Math.floor(u * 14) % 2; t.set(i, k ? col(0.95, 0.93, 0.88) : col(0.9, 0.88, 0.82), 0.2, 0.4, 0); if (((u * 14) % 1) < 0.4 && hash(Math.floor(u * 14), 0, 98) > 0.3) t.set(i, col(0.05, 0.05, 0.05), 0.5, 0.2, 0); } }); };
GEN[T.whiteboard] = (t) => { t.each((u, v, i) => { const d = Math.min(u, 1 - u, v, 1 - v); if (d < 0.05) t.set(i, col(0.75, 0.76, 0.78), 0.4, 0.4, 0.8); else { t.set(i, col(0.96, 0.96, 0.95), 0, 0.3, 0); if (fbm(u * 2, v, 24, 2, 99) > 0.76 && v > 0.2 && v < 0.6) t.set(i, hash(Math.floor(u * 8), 0, 100) > 0.5 ? col(0.2, 0.3, 0.7) : col(0.75, 0.15, 0.15)); } }); };
GEN[T.carpet] = (t) => base(t, col(0.55, 0.14, 0.16), { vary: 0.08, freq: 24, oct: 2, rough: 0.95, hAmp: 0.15, seed: 101 });
GEN[T.tile_dark] = (t) => tiles(t, 2, 2, 0.03, col(0.3, 0.32, 0.35), col(0.15, 0.15, 0.16), { rough: 0.35, vary: 0.06 });

GEN[T.orange_wall] = (t) => base(t, col(0.92, 0.6, 0.23), { vary: 0.03, freq: 10, oct: 3, rough: 0.8, hAmp: 0.1, seed: 102 });
GEN[T.dorm_wall] = (t) => base(t, col(0.91, 0.82, 0.77), { vary: 0.035, freq: 10, oct: 3, rough: 0.85, hAmp: 0.12, seed: 103 });
GEN[T.terrazzo] = (t) => { base(t, col(0.86, 0.84, 0.8), { vary: 0.03, freq: 8, rough: 0.2, hAmp: 0.02, seed: 104 }); t.each((u, v, i) => { const s = hash(Math.floor(u * 40), Math.floor(v * 40), 105); if (s > 0.86) { const pal = [col(0.4, 0.4, 0.42), col(0.7, 0.55, 0.45), col(0.3, 0.35, 0.3), col(0.95, 0.95, 0.92)]; const c = pal[Math.floor(s * 50) % 4]; t.set(i, c, 0, 0.2, 0); } }); };
GEN[T.mailbox] = (t) => { t.each((u, v, i) => { const c = col(0.78, 0.13, 0.1); const n = fbm(u, v, 6, 2, 106) - 0.5; t.set(i, [c[0] + n * 0.05, c[1] + n * 0.03, c[2] + n * 0.03], 0, 0.35, 0.3); if (Math.abs(v - 0.35) < 0.03 && u > 0.2 && u < 0.8) t.set(i, col(0.1, 0.1, 0.1), -0.5, 0.6, 0.6); if (v > 0.5 && v < 0.75 && u > 0.25 && u < 0.75) { t.set(i, col(0.98, 0.95, 0.9), 0.1, 0.5, 0); } }); };
GEN[T.roof_gray] = (t) => { base(t, col(0.55, 0.6, 0.57), { vary: 0.05, freq: 10, oct: 3, rough: 0.9, hAmp: 0.15, seed: 107 }); t.each((u, v, i) => { if (fbm(u, v, 6, 2, 108) > 0.68) t.scale(i, 0.9); }); };
GEN[T.ceil] = (t) => { base(t, col(0.93, 0.93, 0.91), { vary: 0.015, freq: 12, oct: 2, rough: 0.8, hAmp: 0.03, seed: 109 }); t.each((u, v, i) => { const g = Math.min(Math.abs(((u * 2) % 1) - 0.5), Math.abs(((v * 2) % 1) - 0.5)); if (g > 0.485) t.scale(i, 0.82); else if (hash(Math.floor(u * 48), Math.floor(v * 48), 110) > 0.93) t.scale(i, 0.9); }); };

// ---------- 아틀라스로 묶기 ----------
export const ATLAS_INSET = 0.5; // 텍셀 단위 안쪽 여백(번짐 방지)
export async function buildAtlas(tileSize, onProgress) {
  const n = tileSize, W = ATLAS_COLS * n, H = ATLAS_ROWS * n;
  const albedo = new Uint8Array(W * H * 4), normal = new Uint8Array(W * H * 4), orm = new Uint8Array(W * H * 4), emissive = new Uint8Array(W * H * 4);
  const t = new Tile(n);
  const bumpStrength = n / 32; // 해상도가 높을수록 기울기가 완만해지므로 보정
  for (let id = 0; id < TILE_COUNT; id++) {
    const gen = GEN[id];
    t.a.fill(0.8); t.h.fill(0); t.r.fill(0.8); t.m.fill(0); t.e.fill(0); t.al.fill(1);
    if (gen) gen(t); else base(t, col(1, 0, 1));
    const cx = (id % ATLAS_COLS) * n, cy = Math.floor(id / ATLAS_COLS) * n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = y * n + x, o = ((cy + y) * W + cx + x) * 4;
      albedo[o] = clamp01(t.a[i * 3]) * 255; albedo[o + 1] = clamp01(t.a[i * 3 + 1]) * 255; albedo[o + 2] = clamp01(t.a[i * 3 + 2]) * 255; albedo[o + 3] = clamp01(t.al[i]) * 255;
      // 높이 → 노멀 (타일 안에서 순환)
      const xl = (x + n - 1) % n, xr = (x + 1) % n, yu = (y + n - 1) % n, yd = (y + 1) % n;
      const dx = (t.h[y * n + xr] - t.h[y * n + xl]) * bumpStrength, dy = (t.h[yd * n + x] - t.h[yu * n + x]) * bumpStrength;
      const len = Math.hypot(dx, dy, 1);
      normal[o] = (-dx / len * 0.5 + 0.5) * 255; normal[o + 1] = (-dy / len * 0.5 + 0.5) * 255; normal[o + 2] = (1 / len * 0.5 + 0.5) * 255; normal[o + 3] = 255;
      orm[o] = 255; orm[o + 1] = clamp01(t.r[i]) * 255; orm[o + 2] = clamp01(t.m[i]) * 255; orm[o + 3] = 255;
      emissive[o] = clamp01(t.e[i * 3]) * 255; emissive[o + 1] = clamp01(t.e[i * 3 + 1]) * 255; emissive[o + 2] = clamp01(t.e[i * 3 + 2]) * 255; emissive[o + 3] = 255;
    }
    if (onProgress && (id & 3) === 3) { onProgress((id + 1) / TILE_COUNT); await new Promise((r) => setTimeout(r, 0)); }
  }
  return { albedo, normal, orm, emissive, width: W, height: H, tile: n };
}
