// 생성 헬퍼 — 세계 W 와 공용 상태(높이맵·난수·props)를 받아 건축 도구를 돌려준다.
import { WORLD, B, SHAPE } from '../blocks.js';
import { hash } from '../noise.js';

const { SX, SZ, SY, GROUND } = WORLD;
export const G = GROUND; // 8: 서 있는 높이
export const TOP = G - 1; // 7: 땅 윗면 블록
export const { SLAB_BOTTOM: SB, SLAB_TOP: ST, HALF_XN, HALF_XP, HALF_ZN, HALF_ZP } = SHAPE;

export function makeTools(W, R, props, height, isRoad, isWalk) {
  const topY = (x, z) => height[x * SZ + z];
  const walls = (x0, z0, x1, z1, y0, y1, id, shape = 0) => { W.fill(x0, y0, z0, x1, y1, z0, id, shape); W.fill(x0, y0, z1, x1, y1, z1, id, shape); W.fill(x0, y0, z0, x0, y1, z1, id, shape); W.fill(x1, y0, z0, x1, y1, z1, id, shape); };
  const clearAbove = (x0, z0, x1, z1, floorId = B.CONCRETE) => { for (let x = Math.max(0, x0); x <= Math.min(SX - 1, x1); x++) for (let z = Math.max(0, z0); z <= Math.min(SZ - 1, z1); z++) { if (isRoad(x, z) || isWalk(x, z)) continue; for (let y = G; y < SY; y++) W.set(x, y, z, B.AIR); const t = W.get(x, TOP, z); if (t === B.GRASS || t === B.HILL_GRASS) W.set(x, TOP, z, floorId); height[x * SZ + z] = TOP; } };
  const floorSlab = (x0, z0, x1, z1, fy, id = B.CONCRETE) => W.fill(x0, fy - 1, z0, x1, fy - 1, z1, id, ST);
  const windowRow = (along, a0, a1, fixed, y0, y1, litP = 0.35, win = B.WINDOW, lit = B.WINDOW_LIT, period = 3, sill = null) => {
    for (let a = a0 + 1; a < a1; a++) {
      if ((a - a0) % period === 0) continue;
      const id = R() < litP ? lit : win;
      if (along === 'x') { W.fill(a, y0, fixed, a, y1, fixed, id); if (sill) W.set(a, y0 - 1, fixed + sill.out, sill.id, ST); }
      else { W.fill(fixed, y0, a, fixed, y1, a, id); if (sill) W.set(fixed + sill.out, y0 - 1, a, sill.id, ST); }
    }
  };
  const pitchedRoof = (x0, z0, x1, z1, y, id, alongX = true, overhang = 1) => {
    for (let k = 0; k < 40; k++) {
      const ax0 = alongX ? x0 - overhang : x0 - overhang + k, ax1 = alongX ? x1 + overhang : x1 + overhang - k;
      const az0 = alongX ? z0 - overhang + k : z0 - overhang, az1 = alongX ? z1 + overhang - k : z1 + overhang;
      if (ax0 > ax1 || az0 > az1) break;
      W.fill(ax0, y + (k >> 1), az0, ax1, y + (k >> 1), az1, id, (k & 1) ? ST : SB);
    }
  };
  // 계단: 폭 x0..x1, z0 에서 dirZ 방향으로 len 칸, 한 칸에 0.5m
  const stairsZ = (x0, x1, z0, dirZ, len, y, id = B.CONCRETE) => {
    for (let k = 0; k < len; k++) {
      const z = z0 + k * dirZ, h = 0.5 * (k + 1), fullH = Math.floor(h);
      if (fullH >= 1) W.fill(x0, y, z, x1, y + fullH - 1, z, id);
      if (h - fullH > 0.01) W.fill(x0, y + fullH, z, x1, y + fullH, z, id, SB);
    }
  };
  const stairsX = (z0, z1, x0, dirX, len, y, id = B.CONCRETE) => {
    for (let k = 0; k < len; k++) {
      const x = x0 + k * dirX, h = 0.5 * (k + 1), fullH = Math.floor(h);
      if (fullH >= 1) W.fill(x, y, z0, x, y + fullH - 1, z1, id);
      if (h - fullH > 0.01) W.fill(x, y + fullH, z0, x, y + fullH, z1, id, SB);
    }
  };
  const door = (x, y, z, w = 1, h = 2, along = 'x') => { if (along === 'x') W.fill(x, y, z, x + w - 1, y + h - 1, z, B.DOOR); else W.fill(x, y, z, x, y + h - 1, z + w - 1, B.DOOR); };
  const sign = (text, x, y, z, facing, w, color, bg, h = 0.9, extra = {}) => props.signs.push({ text, x, y, z, facing, w, h, color, bg, ...extra });
  const zone = (name, x0, z0, x1, z1) => props.zones.push({ name, x0, z0, x1, z1 });
  const place = (key, name, x, z, opt = {}) => props.places.push({ key, name, x, z, ...opt });
  const lamp = (x, z, h = 4, warm = false) => { const y0 = topY(x, z) + 1; W.fill(x, y0, z, x, y0 + h - 1, z, B.LAMP_POLE); W.set(x, y0 + h, z, B.LAMP_HEAD, ST); props.lamps.push({ x: x + 0.5, y: y0 + h + 0.6, z: z + 0.5, warm }); };
  const building = (x0, z0, x1, z1, floors, wall, opt = {}) => {
    if (typeof floors === 'number') floors = Array(floors).fill(opt.floorH ?? 3);
    const total = floors.reduce((a, b) => a + b, 0), yTop = G + total - 1;
    clearAbove(x0 - 1, z0 - 1, x1 + 1, z1 + 1);
    walls(x0, z0, x1, z1, G, yTop, wall);
    W.fill(x0 + 1, TOP, z0 + 1, x1 - 1, TOP, z1 - 1, opt.floor ?? B.FLOOR_TILE);
    let fy = G;
    floors.forEach((fh, f) => {
      if (f > 0) floorSlab(x0 + 1, z0 + 1, x1 - 1, z1 - 1, fy, opt.floor ?? B.FLOOR_TILE);
      if (opt.band) walls(x0, z0, x1, z1, fy + fh - 1, fy + fh - 1, opt.band);
      const wy0 = fy + 1, wy1 = fy + Math.min(2, fh - 2);
      if (!(f === 0 && opt.shopFront)) {
        windowRow('x', x0, x1, z0, wy0, wy1, opt.litP, opt.win, opt.lit, opt.period);
        windowRow('x', x0, x1, z1, wy0, wy1, opt.litP, opt.win, opt.lit, opt.period);
        windowRow('z', z0, z1, x0, wy0, wy1, opt.litP, opt.win, opt.lit, opt.period);
        windowRow('z', z0, z1, x1, wy0, wy1, opt.litP, opt.win, opt.lit, opt.period);
      }
      fy += fh;
    });
    if (opt.roof === 'pitched') pitchedRoof(x0, z0, x1, z1, yTop + 1, opt.roofId ?? B.ROOF_RED, (x1 - x0) >= (z1 - z0));
    else { W.fill(x0, yTop + 1, z0, x1, yTop + 1, z1, opt.roofId ?? B.ROOF_FLAT); walls(x0, z0, x1, z1, yTop + 2, yTop + 2, wall); }
    return { x0, z0, x1, z1, yTop };
  };
  const tree = (x, z, kind = 'oak') => {
    const y0 = topY(x, z) + 1; props.trees++;
    if (kind === 'pine') {
      const h = 6 + Math.floor(R() * 4);
      W.fill(x, y0, z, x, y0 + h, z, B.LOG);
      for (let k = 0; k <= h - 2; k++) { const r = Math.max(0.6, (h - 2 - k) * 0.42 + 0.6); const yy = y0 + 2 + k; for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { if (dx * dx + dz * dz <= r * r && W.get(x + dx, yy, z + dz) === B.AIR) W.set(x + dx, yy, z + dz, B.PINE_LEAVES); } }
      W.set(x, y0 + h + 1, z, B.PINE_LEAVES);
    } else {
      const h = 4 + Math.floor(R() * 3), rad = 2.2 + R() * 1.2;
      W.fill(x, y0, z, x, y0 + h - 1, z, B.LOG);
      const cy = y0 + h;
      for (let dx = -4; dx <= 4; dx++) for (let dy = -2; dy <= 3; dy++) for (let dz = -4; dz <= 4; dz++) {
        const d = Math.sqrt(dx * dx + (dy * 1.3) * (dy * 1.3) + dz * dz);
        if (d <= rad + (hash(x + dx, z + dz, dy + 300) - 0.5) * 1.2 && W.get(x + dx, cy + dy, z + dz) === B.AIR) W.set(x + dx, cy + dy, z + dz, B.LEAVES);
      }
    }
  };
  const bench = (x, z, alongX = true) => { const y = topY(x, z) + 1; if (alongX) W.fill(x, y, z, x + 1, y, z, B.BENCH, SB); else W.fill(x, y, z, x, y, z + 1, B.BENCH, SB); props.benches.push({ x, z }); };
  // 화단: 가장자리 반블록 테두리 + 꽃
  const flowerBed = (x0, z0, x1, z1) => { W.fill(x0, TOP, z0, x1, TOP, z1, B.FLOWERS); walls(x0, z0, x1, z1, G, G, B.STONE_PILLAR, SB); };
  return { topY, walls, clearAbove, floorSlab, windowRow, pitchedRoof, stairsZ, stairsX, door, sign, zone, place, lamp, building, tree, bench, flowerBed };
}
