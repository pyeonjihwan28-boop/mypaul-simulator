// 청크 메셔 — 보이는 면만 쿼드로 만들고, 꼭짓점마다 AO(모서리 그늘)를 계산한다.
// 반블록(슬래브·반쪽 벽)은 칸 안의 상자 모양대로 면을 만든다. 순수 함수라 워커에서 돈다.
import { KIND, SHAPE_BOX } from './blocks.js';

// 면: a 축, s 방향 · R(오른쪽) 축/부호 · U(위) 축/부호 — 바깥에서 봤을 때 O→O+R→O+R+U→O+U 가 반시계
const FACES = [
  { a: 0, s: 1, ra: 2, rs: 1, ua: 1, us: 1, n: [1, 0, 0] },   // +x: R=+z U=+y
  { a: 0, s: -1, ra: 2, rs: -1, ua: 1, us: 1, n: [-1, 0, 0] }, // -x: R=-z
  { a: 1, s: 1, ra: 0, rs: 1, ua: 2, us: 1, n: [0, 1, 0] },   // +y: R=+x U=+z
  { a: 1, s: -1, ra: 0, rs: -1, ua: 2, us: 1, n: [0, -1, 0] }, // -y: R=-x U=+z
  { a: 2, s: 1, ra: 0, rs: -1, ua: 1, us: 1, n: [0, 0, 1] },  // +z: R=-x U=+y
  { a: 2, s: -1, ra: 0, rs: 1, ua: 1, us: 1, n: [0, 0, -1] }, // -z: R=+x U=+y
];
const AO_LEVELS = [0.38, 0.62, 0.82, 1.0];
// 꼭짓점 4개의 (R,U) 부호
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

class GeoBuilder {
  constructor(quads = 1024) {
    this.v = 0; this.q = 0;
    this.pos = new Float32Array(quads * 12); this.nrm = new Int8Array(quads * 12);
    this.uv = new Float32Array(quads * 8); this.col = new Uint8Array(quads * 16); this.idx = new Uint32Array(quads * 6);
  }
  grow() {
    const g = (a) => { const b = new a.constructor(a.length * 2); b.set(a); return b; };
    this.pos = g(this.pos); this.nrm = g(this.nrm); this.uv = g(this.uv); this.col = g(this.col); this.idx = g(this.idx);
  }
  quad(p, n, uv, col, flip) {
    if ((this.v + 4) * 3 > this.pos.length) this.grow();
    const v = this.v;
    this.pos.set(p, v * 3); this.uv.set(uv, v * 2); this.col.set(col, v * 4);
    for (let k = 0; k < 4; k++) { this.nrm[(v + k) * 3] = n[0] * 127; this.nrm[(v + k) * 3 + 1] = n[1] * 127; this.nrm[(v + k) * 3 + 2] = n[2] * 127; }
    const o = this.q * 6;
    if (flip) { this.idx[o] = v + 1; this.idx[o + 1] = v + 2; this.idx[o + 2] = v + 3; this.idx[o + 3] = v + 1; this.idx[o + 4] = v + 3; this.idx[o + 5] = v; }
    else { this.idx[o] = v; this.idx[o + 1] = v + 1; this.idx[o + 2] = v + 2; this.idx[o + 3] = v; this.idx[o + 4] = v + 2; this.idx[o + 5] = v + 3; }
    this.v += 4; this.q++;
  }
  pack() {
    if (this.q === 0) return null;
    return { count: this.v, pos: this.pos.slice(0, this.v * 3), nrm: this.nrm.slice(0, this.v * 3), uv: this.uv.slice(0, this.v * 2), col: this.col.slice(0, this.v * 4), idx: this.idx.slice(0, this.q * 6) };
  }
}

function hash3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * @param world Uint8Array 블록 id · shape Uint8Array 모양
 * @param dims {SX,SY,SZ,CHUNK}
 * @param table packBlockTable() 결과
 * @param atlas {cols, rows, tile, inset}
 */
export function meshChunk(world, shape, dims, table, atlas, cx, cz) {
  const { SX, SY, SZ, CHUNK } = dims;
  const { solid, kind, vary, rot, tiles, tint } = table;
  const W = atlas.cols * atlas.tile, H = atlas.rows * atlas.tile, inset = atlas.inset;
  const x0 = cx * CHUNK, z0 = cz * CHUNK;
  const builders = [new GeoBuilder(2048), new GeoBuilder(256), new GeoBuilder(256)];
  const index = (x, y, z) => (x * SZ + z) * SY + y;
  const get = (x, y, z) => {
    if (y < 0 || x < 0 || z < 0 || x >= SX || z >= SZ) return 255; // 바깥: 막힌 것으로
    if (y >= SY) return 0;
    return world[index(x, y, z)];
  };
  const shapeAt = (x, y, z) => (y < 0 || y >= SY || x < 0 || z < 0 || x >= SX || z >= SZ) ? 0 : shape[index(x, y, z)];
  const occludes = (id) => id === 255 || (kind[id] === KIND.OPAQUE) || (kind[id] === KIND.CUTOUT && solid[id] === 1 && id !== 0);
  const p = new Float32Array(12), uvs = new Float32Array(8), cols = new Uint8Array(16), c = [0, 0, 0];

  for (let x = x0; x < x0 + CHUNK; x++) for (let z = z0; z < z0 + CHUNK; z++) {
    const colBase = (x * SZ + z) * SY;
    for (let y = 0; y < SY; y++) {
      const id = world[colBase + y];
      if (id === 0) continue;
      const k = kind[id];
      const b = SHAPE_BOX[shape[colBase + y]] || SHAPE_BOX[0];
      const vr = vary[id] / 255;
      const bright = vr ? 1 + (hash3(x, y, z) - 0.5) * 2 * vr : 1;
      const tr = Math.min(255, tint[id * 3] * bright * 255), tg = Math.min(255, tint[id * 3 + 1] * bright * 255), tb = Math.min(255, tint[id * 3 + 2] * bright * 255);
      const cell = [x, y, z];
      for (let f = 0; f < 6; f++) {
        const F = FACES[f];
        const plane = F.s > 0 ? b[F.a + 3] : b[F.a];
        const atEdge = plane === (F.s > 0 ? 1 : 0);
        const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
        if (atEdge) {
          const nb = get(nx, ny, nz);
          if (nb === 255) continue;
          if (nb !== 0) {
            const nbox = SHAPE_BOX[shapeAt(nx, ny, nz)] || SHAPE_BOX[0];
            const touches = F.s > 0 ? nbox[F.a] === 0 : nbox[F.a + 3] === 1;
            const covers = touches && nbox[F.ra] <= b[F.ra] && nbox[F.ra + 3] >= b[F.ra + 3] && nbox[F.ua] <= b[F.ua] && nbox[F.ua + 3] >= b[F.ua + 3];
            if (covers) {
              const nk = kind[nb];
              if (nk === KIND.OPAQUE) continue;
              if (nb === id) continue;
              if (k === KIND.GLASS && nk === KIND.GLASS) continue;
            }
          }
        }
        // 텍스처 좌표(타일 안 범위)
        const tile = tiles[id * 6 + f];
        const tc = tile % atlas.cols, trow = (tile / atlas.cols) | 0;
        const u0 = (tc * atlas.tile + inset) / W, u1 = ((tc + 1) * atlas.tile - inset) / W;
        const v0 = (trow * atlas.tile + inset) / H, v1 = ((trow + 1) * atlas.tile - inset) / H;
        const rotate = rot[id] && (f === 2 || f === 3);
        const rlo = b[F.ra], rhi = b[F.ra + 3], ulo = b[F.ua], uhi = b[F.ua + 3];
        let ao0 = 0, ao1 = 0, ao2 = 0, ao3 = 0;
        for (let ci = 0; ci < 4; ci++) {
          const rs = CORNERS[ci][0], us = CORNERS[ci][1];
          c[F.a] = plane;
          c[F.ra] = (rs * F.rs > 0) ? rhi : rlo; // R 방향으로 양끝이면 hi
          c[F.ua] = (us * F.us > 0) ? uhi : ulo;
          p[ci * 3] = x - x0 + c[0]; p[ci * 3 + 1] = y + c[1]; p[ci * 3 + 2] = z - z0 + c[2];
          let s = F.rs > 0 ? c[F.ra] : 1 - c[F.ra], t = F.us > 0 ? 1 - c[F.ua] : c[F.ua];
          if (rotate) { const tmp = s; s = t; t = tmp; }
          uvs[ci * 2] = u0 + s * (u1 - u0); uvs[ci * 2 + 1] = v0 + t * (v1 - v0);
          // AO: 면 바깥쪽 이웃 3개 (R·U 방향은 부호 rs/us 를 축 방향으로 환산)
          const dr = rs * F.rs, du = us * F.us;
          const r1 = [0, 0, 0], u1v = [0, 0, 0]; r1[F.ra] = dr; u1v[F.ua] = du;
          const s1 = occludes(get(nx + r1[0], ny + r1[1], nz + r1[2]));
          const s2 = occludes(get(nx + u1v[0], ny + u1v[1], nz + u1v[2]));
          const cc = occludes(get(nx + r1[0] + u1v[0], ny + r1[1] + u1v[1], nz + r1[2] + u1v[2]));
          const level = (s1 && s2) ? 0 : 3 - ((s1 ? 1 : 0) + (s2 ? 1 : 0) + (cc ? 1 : 0));
          const ao = k === KIND.GLASS ? 1 : AO_LEVELS[level];
          if (ci === 0) ao0 = level; else if (ci === 1) ao1 = level; else if (ci === 2) ao2 = level; else ao3 = level;
          cols[ci * 4] = tr; cols[ci * 4 + 1] = tg; cols[ci * 4 + 2] = tb; cols[ci * 4 + 3] = ao * 255;
        }
        builders[k].quad(p, F.n, uvs, cols, ao0 + ao2 > ao1 + ao3);
      }
    }
  }
  return { opaque: builders[0].pack(), cutout: builders[1].pack(), glass: builders[2].pack() };
}
