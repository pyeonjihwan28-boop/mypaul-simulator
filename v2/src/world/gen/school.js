// 마이폴학교 캠퍼스 v4 — 전 판(three.js 판) 학교를 거의 그대로: 전 판 장면을 복셀로 떠 온 자료(classic-campus.json · 0.7배)로
//  본관 · 생활관 · 별관 · 운동장 · 농구장 · 트랙 · 텃밭 · 교문 · 울타리 · 조명을 놓고, 건물 안은 전 판 방 표(이름 · 위치 · 문)대로 다시 꾸며요.
//  좌표: 새 x = 128 + 0.7 × (옛 x + 3), 새 z = 62.1 + 0.7 × (옛 z + 70), y = 땅 윗면 7 · 서 있는 칸 8 · 2층 바닥 11 · 지붕 15
//  비율: 1칸 = 1m · 층 4m(천장 3m) · 문 2m · 책상 0.5m(위 반블록) · 의자 0.5m(아래 반블록) · 계단 한 단 0.5m
import { B } from '../blocks.js';
import { G, TOP, SB, ST, HALF_XN, HALF_XP, HALF_ZN, HALF_ZP } from './util.js';
import campus from './classic-campus.json';

export const CAMPUS = { x0: 62, z0: 62, x1: 194, z1: 194 };
const S = 0.7, OX = 128, OZ = 62.1;
const TX = (x) => OX + S * (x + 3), TZ = (z) => OZ + S * (z + 70);
const CX = (x) => Math.floor(TX(x)), CZ = (z) => Math.floor(TZ(z));
const FH = 4;

// 전 판 방 표: [id, 이름, 층, x1, z1, x2, z2, 종류, 문[ [벽, 자리, 폭?] ... ]]  (옛 좌표 · 전 판에서 'n' = -z 쪽(교문 쪽) · 's' = +z 쪽 · 'w' = -x · 'e' = +x)
const MAIN_ROOMS = [
  ['lobby', '1층 로비', 0, -8, -6, 8, 6, 'lobby', [['n', 0, 3.2]]],
  ['nkw', '복도', 0, -10, -6, -8, -2, 'hall', []], ['nke', '복도', 0, 8, -6, 10, -2, 'hall', []],
  ['cw', '복도', 0, -40, -2, -8, 2, 'hall', [['w', 0, 2]]], ['ce', '복도', 0, 8, -2, 40, 2, 'hall', [['e', 0, 2]]],
  ['shin', '신동호 연구실', 0, -40, -12, -30, -2, 'lab', [['s', -34]]], ['pjh1', '박남규 연구실', 0, -30, -12, -18, -2, 'lab', [['s', -22]]], ['ksh', '강승환 연구실', 0, -18, -12, -10, -2, 'lab', [['s', -14]]],
  ['adm', '행정실', 0, 10, -12, 24, -2, 'admin', [['s', 15]]], ['cat', '식당 · 카페 가이아', 0, 24, -12, 36, -2, 'cafeteria', [['s', 30]]], ['shop', '매점', 0, 36, -12, 40, -2, 'store', [['s', 38, 1.6]]],
  ['tch', '교무실', 0, -16, 2, -8, 10, 'office', [['n', -12]]], ['cns', '상담실', 0, 8, 2, 20, 10, 'counsel2', [['n', 13.5]]],
  ['cx', '교차구역', 1, -5, -5, 5, 5, 'board', []], ['cw2', '복도', 1, -40, -2, -5, 2, 'hall', []], ['ce2', '복도', 1, 5, -2, 40, 2, 'hall', []],
  ['club', '동아리실', 1, -40, -12, -28, -2, 'club', [['s', -34]]], ['pjh2', '박재현 연구실', 1, -28, -12, -20, -2, 'lab', [['s', -24]]], ['sto', '창고', 1, -20, -12, -16, -2, 'storage', [['s', -18, 1.4]]],
  ['kkh', '김광호 연구실', 1, -16, -12, -5, -2, 'lab', [['s', -12]]], ['prn', '교장실', 1, -5, -12, 5, -5, 'principal', [['s', 0]]], ['chp', '채플실 · 두란노 도서관', 1, 5, -12, 24, -2, 'chapel', [['s', 12], ['s', 20]]],
  ['lib', '독서실', 1, 24, -12, 34, -2, 'reading', [['s', 29]]], ['work', '작업실', 1, 34, -12, 40, -2, 'workshop', [['s', 37, 1.6]]],
  ['ymj', '육민정 연구실', 1, -16, 2, -8, 10, 'lab', [['n', -12]]], ['lsm', '이상문 연구실', 1, 8, 2, 20, 10, 'lab', [['n', 14]]],
];
// 방 → 새 좌표 칸: 벽 칸(wx0 wz0 wx1 wz1) · 안쪽 칸(ix0..ix1 × iz0..iz1)
const roomCells = (r) => { const [id, name, f, x1, z1, x2, z2, st, doors] = r; const wx0 = CX(x1), wx1 = CX(x2), wz0 = CZ(z1), wz1 = CZ(z2); return { id, name, f, st, doors, ox: (x1 + x2) / 2, wx0, wx1, wz0, wz1, ix0: wx0 + 1, ix1: wx1 - 1, iz0: wz0 + 1, iz1: wz1 - 1, fy: G + f * FH }; };
const FLOOR_OF = { hall: 'TERRAZZO', lobby: 'TERRAZZO', board: 'TERRAZZO', lab: 'FLOOR_TILE', admin: 'WOOD_FLOOR', office: 'WOOD_FLOOR', counsel2: 'WOOD_FLOOR', chapel: 'WOOD_FLOOR', reading: 'MARBLE', cafeteria: 'TILE_DARK', store: 'FLOOR_TILE', club: 'WOOD_FLOOR', storage: 'CONCRETE', principal: 'CARPET', workshop: 'FLOOR_TILE' };

export function buildSchool(W, T, R, props) {
  const { walls, stairsZ, door, sign, zone, place, lamp, tree, bench, building } = T;
  const C = CAMPUS;
  zone('학교 안', C.x0, C.z0, C.x1, C.z1);
  props.homes = {}; props.field = null;
  const flat = (x0, z0, x1, z1, id) => W.fill(x0, TOP, z0, x1, TOP, z1, id);
  const put = (x, y, z, id, sh = 0) => { if (W.get(x, y, z) === B.AIR) W.set(x, y, z, id, sh); };
  const ceilLights = (x0, z0, x1, z1, cy, step = 3) => { for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) put(x, cy - 1, z, B.LAMP_HEAD, ST); };
  const wainscot = (x0, z0, x1, z1, y, id = B.PLANKS) => {
    for (let x = x0; x <= x1; x++) { put(x, y, z0, id, HALF_ZN); put(x, y, z1, id, HALF_ZP); }
    for (let z = z0 + 1; z <= z1 - 1; z++) { put(x0, y, z, id, HALF_XN); put(x1, y, z, id, HALF_XP); }
  };

  // ===== 1. 전 판 장면 복셀 놓기 (울타리 · 교문 · 본관 · 생활관 · 별관 · 운동장 · 농구장 · 트랙 · 조명 · 화단 · 버스) =====
  {
    const { x0, y0, z0, h, d, keys, rle } = campus; const ids = keys.map((k) => B[k]);
    let i = 0;
    for (const run of rle.split(',')) {
      const xi = run.indexOf('x'); const val = xi < 0 ? +run : +run.slice(0, xi), cnt = xi < 0 ? 1 : +run.slice(xi + 1);
      for (let k = 0; k < cnt; k++, i++) {
        if (!val) continue;
        const y = y0 + (i % h), r = (i - (i % h)) / h, z = z0 + (r % d), x = x0 + (r - (r % d)) / d;
        const id = ids[(val >> 3) - 1]; if (id === undefined) continue;
        W.set(x, y, z, id, val & 7);
      }
    }
    // 가로등: 쇠 기둥이 5칸 넘게 서 있으면 가로등 기둥 + 머리 + 불
    for (let x = C.x0; x <= C.x1; x++) for (let z = C.z0; z <= C.z1; z++) {
      let n = 0; while (W.get(x, G + n, z) === B.IRON) n++;
      if (n >= 5) { for (let y = G; y < G + n; y++) W.set(x, y, z, B.LAMP_POLE); const top = G + n; W.set(x, top, z, B.LAMP_HEAD, SB); props.lamps.push({ x: x + 0.5, y: top + 0.3, z: z + 0.5, big: n > 6 }); }
    }
  }

  // ===== 2. 본관 안: 전 판 방 표대로 (바깥 벽 · 창은 복셀 그대로, 안쪽만 다시) =====
  const rooms = MAIN_ROOMS.map(roomCells);
  const bld = { x0: CX(-40), x1: CX(40), z0: CZ(-12), z1: CZ(10) };
  const key2 = (x, z) => x * 512 + z;
  const mark = (f) => { const set = new Set(); for (const r of rooms) if (r.f === f) for (let x = r.wx0; x <= r.wx1; x++) for (let z = r.wz0; z <= r.wz1; z++) set.add(key2(x, z)); return set; };
  const ring = (set) => { const ex = new Set(); for (const k of set) { const x = (k / 512) | 0, z = k % 512; if (!set.has(key2(x - 1, z)) || !set.has(key2(x + 1, z)) || !set.has(key2(x, z - 1)) || !set.has(key2(x, z + 1))) ex.add(k); } return ex; };
  const open = ['hall', 'lobby', 'board'];
  for (let f = 0; f < 2; f++) {
    const fy = G + f * FH, inside = mark(f), ex = ring(inside);
    // 안쪽 비우기(바깥 벽 고리는 남김) · 바닥 · 천장(= 위층 바닥 / 지붕)
    for (const k of inside) {
      const x = (k / 512) | 0, z = k % 512;
      if (!ex.has(k)) { for (let y = fy; y <= fy + 2; y++) W.set(x, y, z, B.AIR); W.set(x, fy + 3, z, f ? B.ROOF_GRAY : B.FLOOR_TILE); }
      W.set(x, fy - 1, z, B.FLOOR_TILE);
    }
    for (const r of rooms.filter((q) => q.f === f)) {
      const fl = B[FLOOR_OF[r.st]] || B.FLOOR_TILE, isOpen = open.includes(r.st);
      for (let x = r.wx0; x <= r.wx1; x++) for (let z = r.wz0; z <= r.wz1; z++) {
        const edge = x === r.wx0 || x === r.wx1 || z === r.wz0 || z === r.wz1;
        if (edge && !ex.has(key2(x, z)) && !isOpen) for (let y = fy; y <= fy + 2; y++) put(x, y, z, B.SCHOOL_WALL);
        if (!edge || isOpen) W.set(x, fy - 1, z, fl);
      }
      for (const [wall, at, w = 1] of r.doors) {
        const wide = w >= 1.5 ? 2 : 1;
        if (wall === 's' || wall === 'n') { const z = wall === 'n' ? r.wz0 : r.wz1, x = CX(at); for (let dx = 0; dx < wide; dx++) { W.fill(x + dx, fy, z, x + dx, fy + 1, z, B.DOOR); W.set(x + dx, fy + 2, z, B.SCHOOL_WALL); } }
        else { const x = wall === 'w' ? r.wx0 : r.wx1, z = CZ(at); for (let dz = 0; dz < wide; dz++) { W.fill(x, fy, z + dz, x, fy + 1, z + dz, B.DOOR); W.set(x, fy + 2, z + dz, B.SCHOOL_WALL); } }
      }
      if (r.st === 'hall') { for (let x = r.wx0; x <= r.wx1; x++) for (const z of [r.wz0, r.wz1]) for (let y = fy; y <= fy + 2; y++) if (W.get(x, y, z) === B.SCHOOL_WALL) W.set(x, y, z, B.ORANGE_WALL); }
      if (!isOpen) {
        wainscot(r.ix0, r.iz0, r.ix1, r.iz1, fy, ['lab', 'cafeteria', 'club', 'workshop'].includes(r.st) ? B.PLANKS : B.WOOD_DARK);
        const hallS = !r.doors[0] || r.doors[0][0] === 'n'; // 복도(문)가 작은 z 쪽인가
        sign(r.name, TX(r.ox), fy + 2.6, hallS ? r.wz0 - 0.06 : r.wz1 + 1.06, hallS ? 'south' : 'north', Math.min(2.8, (r.ix1 - r.ix0 + 1) * 0.9), '#ffffff', '#163d2b', 0.5);
      }
      ceilLights(r.ix0, r.iz0, r.ix1, r.iz1, fy + 3, r.st === 'hall' ? 4 : 3);
      if (r.st !== 'hall') place(r.st, r.name, (r.ix0 + r.ix1) / 2 + 0.5, (r.iz0 + r.iz1) / 2 + 0.5, { x0: r.ix0, z0: r.iz0, x1: r.ix1, z1: r.iz1, floor: f, y: fy });
      furnish(r);
    }
    // 바깥 벽 정리(전 판 모습): 흰 벽 · 창 2칸마다 벽 1칸 · 1층 위 초록 띠 · 지붕 테두리 초록 (문 · 현관 틈은 그대로)
    for (const k of ex) {
      const x = (k / 512) | 0, z = k % 512;
      for (let y = f ? fy - 1 : fy; y <= fy + 3; y++) {
        const id = W.get(x, y, z);
        if (id === B.DOOR || (id === B.AIR && y < fy + 3 && y >= fy)) continue;
        if (y === fy + 3) W.set(x, y, z, f ? B.ROOF_GREEN : B.SCHOOL_BAND);
        else if (y === fy - 1) W.set(x, y, z, B.SCHOOL_BAND); // 2층 바닥 높이 = 초록 띠
        else if (y === fy) W.set(x, y, z, B.SCHOOL_WALL);
        else W.set(x, y, z, (x + z) % 3 ? B.WINDOW : B.SCHOOL_WALL);
      }
    }
    // 복도 · 로비 · 교차구역끼리는 트여 있음
    const openRooms = rooms.filter((q) => q.f === f && open.includes(q.st));
    for (const a of openRooms) for (const b of openRooms) {
      if (a === b) continue;
      const x0 = Math.max(a.wx0, b.wx0), x1 = Math.min(a.wx1, b.wx1), z0 = Math.max(a.wz0, b.wz0), z1 = Math.min(a.wz1, b.wz1);
      if (x0 > x1 || z0 > z1) continue;
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { if (ex.has(key2(x, z))) continue; for (let y = fy; y <= fy + 2; y++) { const id = W.get(x, y, z); if (id === B.SCHOOL_WALL || id === B.ORANGE_WALL) W.set(x, y, z, B.AIR); } }
    }
  }
  // 본관 계단: 로비 가운데 (옛 x -1.5..1.5 · z 3.6 → -1.2 쪽으로 오르기) — 2층 교차구역 바닥에 구멍 · 난간
  {
    const sx0 = CX(-1.5), sx1 = sx0 + 1, zb = CZ(3.6), len = 7;
    W.fill(sx0, G + 3, zb - len + 1, sx1, G + 4, zb, B.AIR);
    stairsZ(sx0, sx1, zb, -1, len, G, B.MARBLE);
    W.fill(sx0 - 1, G + 4, zb - len + 1, sx0 - 1, G + 4, zb, B.IRON, HALF_XP); W.fill(sx1 + 1, G + 4, zb - len + 1, sx1 + 1, G + 4, zb, B.IRON, HALF_XN); W.fill(sx0, G + 4, zb + 1, sx1, G + 4, zb + 1, B.IRON, HALF_ZN);
    sign('2층 ↑', sx0 - 0.44, G + 2.3, zb + 0.5, 'east', 1.6, '#f0c46a', '#13213d', 0.5, { text2: '교장실 · 채플실 · 독서실 · 작업실', color2: '#eef1f6' });
  }
  // 현관 · 간판 · 현판 (옛 자리)
  const porch = { x: TX(0), z: CZ(-12) }; // 벽 칸 남쪽 면
  sign('마이폴학교', porch.x, G + 6.6, porch.z - 0.08, 'south', 5.2, '#1b7a63', '#f7f3ea', 0.76, { text2: 'MY PAUL SCHOOL', color2: '#5b6067' });
  sign('축 2022 최우수 대안교육기관 선정', TX(-26), G + 5.6, porch.z - 0.08, 'south', 6.3, '#f0c46a', '#13213d', 1.0, { text2: '마이폴학교 · KCAE', color2: '#eef1f6' });
  sign('충청북도 대안교육기관 1호', TX(26), G + 5.6, porch.z - 0.08, 'south', 6.3, '#f4efe4', '#1b7a63', 1.0, { text2: '20대에 독립하는 능력있는 전문가 양성', color2: '#d8efe6' });
  sign('마이폴학교', porch.x, G + 2.6, CZ(-6) - 0.06, 'south', 4.6, '#f0c46a', '#13213d', 0.8, { text2: '사유의 힘 · 감사의 마음', color2: '#cfd8ea' });
  place('main', '본관 현관', porch.x, TZ(-9), { x0: CX(-6), z0: CZ(-12), x1: CX(6), z1: CZ(-6) });
  zone('본관', bld.x0 - 2, bld.z0 - 4, bld.x1 + 2, bld.z1 + 2);

  // ===== 3. 생활관 안 (옛 -78..-64 × -28..18): 바깥 벽은 복셀, 안은 가운데 복도 + 양쪽 방 =====
  const D = { x0: CX(-78), x1: CX(-64), z0: CZ(-28), z1: CZ(18) }; // 75..85 × 91..123
  {
    const ix0 = D.x0 + 1, ix1 = D.x1 - 1, iz0 = D.z0 + 1, iz1 = D.z1 - 1; // 76..84 × 92..122
    for (let f = 0; f < 2; f++) {
      const fy = G + f * FH;
      for (let x = ix0; x <= ix1; x++) for (let z = iz0; z <= iz1; z++) { for (let y = fy; y <= fy + 2; y++) W.set(x, y, z, B.AIR); W.set(x, fy + 3, z, f ? B.ROOF_GRAY : B.FLOOR_TILE); W.set(x, fy - 1, z, B.WOOD_FLOOR); }
      // 방 줄: 남쪽(여학생) z 92..102 · 가운데 104..110 (로비 동 · 사감실/계단 서) · 북쪽(남학생) 112..122 — 복도 x 80..81
      const bays = [[92, 94], [96, 98], [100, 102], [112, 114], [116, 118], [120, 122]];
      let bn = 0, gn = 0;
      for (const [za, zb] of bays) {
        for (const west of [true, false]) {
          const xa = west ? ix0 : 82, xb = west ? 79 : ix1, wx = west ? 79 : 82, hug = west ? HALF_XP : HALF_XN;
          W.fill(xa, fy, zb + 1, xb, fy + 2, zb + 1, B.SCHOOL_WALL); W.fill(xa, fy, za - 1, xb, fy + 2, za - 1, B.SCHOOL_WALL);
          W.fill(wx, fy, za, wx, fy + 2, zb, B.SCHOOL_WALL); W.fill(wx, fy, za + 1, wx, fy + 1, za + 1, B.DOOR);
          const bx = west ? xa + 1 : xb - 1, dx = west ? xb - 1 : xa + 1;
          W.set(bx, fy, za, B.BED, SB); W.set(bx, fy, zb, B.BED, SB); W.set(dx, fy, zb, B.DESK, ST); W.set(dx, fy + 1, zb, B.MONITOR, hug); W.set(dx, fy, za, B.LOCKER, hug); W.set(dx, fy + 1, za, B.LOCKER, hug);
          wainscot(xa, za, xb, zb, fy, B.PLANKS); put(bx, fy + 2, za + 1, B.LAMP_HEAD, ST);
          const boy = za >= 112, no = (f + 1) * 100 + (boy ? ++bn : 12 + ++gn);
          sign(`${no}호 · ${boy ? '남' : '여'}`, west ? 80.06 : 81.94, fy + 2.5, za + 1.5, west ? 'east' : 'west', 1.6, '#ffffff', boy ? '#1d3f73' : '#7a2350', 0.4);
          if (f === 0 && boy && bn === 1 && west) place('myroom', `내 방 (${no}호)`, xa + 2, za + 1.5, { x0: xa, z0: za, x1: xb, z1: zb, floor: 0, y: fy });
        }
      }
      W.fill(ix0, fy, 103, ix1, fy + 2, 103, B.SCHOOL_WALL); W.fill(ix0, fy, 111, ix1, fy + 2, 111, B.SCHOOL_WALL);
      W.fill(80, fy, 103, 81, fy + 1, 103, B.AIR); W.fill(80, fy, 111, 81, fy + 1, 111, B.AIR);
      for (let z = iz0; z <= iz1; z += 4) put(80, fy + 2, z, B.LAMP_HEAD, ST);
      W.fill(79, fy, 104, 79, fy + 2, 110, B.SCHOOL_WALL); W.fill(79, fy, 109, 79, fy + 1, 109, B.DOOR); // 서쪽 가운데 방(사감실/세탁실) 문
      W.fill(ix0, fy, 108, 78, fy + 2, 108, B.SCHOOL_WALL); // 계단실(104..107) ↔ 방(109..110)
      W.fill(78, fy, 104, 78, fy + 2, 107, B.AIR); // 계단실은 복도 쪽으로 트임
      if (f === 0) {
        W.fill(ix0, fy, 109, 78, fy, 109, B.DESK, ST); W.set(77, fy + 1, 109, B.MONITOR, HALF_ZP); W.set(77, fy, 110, B.BENCH, SB); W.fill(ix0, fy, 110, ix0, fy + 1, 110, B.BOOKSHELF);
        sign('사감실', 79.06, fy + 2.5, 109.5, 'east', 1.6, '#ffffff', '#5b3f1d', 0.4); place('dormoffice', '사감실', 77.5, 109.5, { x0: ix0, z0: 109, x1: 78, z1: 110, floor: 0, y: fy });
        W.fill(ix1, fy, 105, ix1, fy + 1, 106, B.LOCKER, HALF_XP); W.fill(82, fy, 109, 83, fy, 109, B.BENCH, SB); W.set(ix1, fy, 110, B.FLOWERS, SB);
        sign('생활관 안내', 83.5, fy + 2.4, 104.06, 'north', 2.8, '#1a1a1a', '#fff7d6', 0.9, { text2: '22:00 점호 · 06:50 기상 · 세탁은 2층', color2: '#444444' });
        place('dorm', '생활관 로비', 83, 107.5, { x0: 80, z0: 104, x1: ix1, z1: 110, floor: 0, y: fy });
      } else {
        for (const z of [109, 110]) { W.set(ix0, fy, z, B.IRON); W.set(ix0 + 1, fy, z, B.SHOP_GLASS, HALF_XN); } W.set(78, fy, 110, B.IRON, SB);
        sign('세탁실', 79.06, fy + 2.5, 109.5, 'east', 1.6, '#ffffff', '#2456c8', 0.4); place('laundry', '세탁실', 77.5, 109.5, { x0: ix0, z0: 109, x1: 78, z1: 110, floor: 1, y: fy });
        W.fill(82, fy, 105, ix1, fy, 105, B.BENCH, SB); W.fill(82, fy, 107, ix1, fy, 107, B.BENCH, SB); W.fill(82, fy, 106, ix1, fy, 106, B.DESK, ST); W.set(ix1, fy + 1, 109, B.MONITOR, HALF_XP); W.fill(82, fy, 109, 83, fy, 110, B.CARPET, SB);
        sign('휴게실', 83.5, fy + 2.4, 104.06, 'north', 2.0, '#ffffff', '#5b3f1d', 0.4); place('lounge', '생활관 휴게실', 83, 107.5, { x0: 82, z0: 104, x1: ix1, z1: 110, floor: 1, y: fy });
        W.fill(82, fy, 112, ix1, fy, 112, B.DESK, ST); for (let x = 82; x <= ix1; x++) W.set(x, fy + 1, 112, B.WHITEBOARD, HALF_ZN);
        place('dormstudy', '생활관 독서실', 83, 113.5, { x0: 82, z0: 112, x1: ix1, z1: 114, floor: 1, y: fy });
      }
    }
    // 계단: 서쪽 가운데 x 76..77, z 104(아래) → 110 쪽으로 오르기 — 2층 바닥에 구멍 · 난간
    W.fill(76, G + 3, 104, 77, G + 4, 107, B.AIR); W.fill(76, G + 4, 104, 77, G + 4, 107, B.AIR);
    stairsZ(76, 77, 104, 1, 7, G, B.FLOOR_TILE);
    W.fill(76, G + 4, 103, 77, G + 4, 103, B.IRON, HALF_ZP); W.fill(78, G + 4, 104, 78, G + 4, 107, B.IRON, HALF_XN);
    // 바깥 벽 정리(전 판 모습): 베이지 벽 · 창 · 1층 위 초록 띠 · 초록 지붕 테두리
    for (let f = 0; f < 2; f++) {
      const fy = G + f * FH;
      for (let x = D.x0; x <= D.x1; x++) for (let z = D.z0; z <= D.z1; z++) {
        if (x !== D.x0 && x !== D.x1 && z !== D.z0 && z !== D.z1) continue;
        for (let y = f ? fy - 1 : fy; y <= fy + 3; y++) {
          const id = W.get(x, y, z);
          if (id === B.DOOR || (id === B.AIR && y < fy + 3 && y >= fy)) continue;
          if (y === fy + 3) W.set(x, y, z, f ? B.ROOF_GREEN : B.SCHOOL_BAND);
          else if (y === fy - 1) W.set(x, y, z, B.SCHOOL_BAND);
          else if (y === fy) W.set(x, y, z, B.DORM_WALL);
          else W.set(x, y, z, (x + z) % 3 ? B.WINDOW : B.DORM_WALL);
        }
      }
    }
    // 현관(동쪽 가운데) 문 · 간판
    W.fill(D.x1, G, 106, D.x1, G + 1, 107, B.DOOR); W.fill(D.x1, G + 2, 106, D.x1, G + 2, 107, B.DORM_WALL);
    sign('생활관', D.x1 + 1.06, G + 3.2, 107, 'east', 2.6, '#1b7a63', '#ffffff', 0.7, { text2: 'MY PAUL DORMITORY', color2: '#5b6067' });
    sign('남학생 생활관', D.x1 + 1.06, G + 3.3, 117, 'east', 2.4, '#ffffff', '#1d3f73', 0.45); sign('여학생 생활관', D.x1 + 1.06, G + 3.3, 97, 'east', 2.4, '#ffffff', '#7a2350', 0.45);
    zone('생활관', D.x0 - 2, D.z0 - 2, D.x1 + 4, D.z1 + 2);
  }

  // ===== 4. 별관 연구실(현지우 · 빨간 지붕, 옛 56..66 × -48..-38) · 보건실 컨테이너(옛 -48, 6) =====
  {
    const H = { x0: CX(56), x1: CX(66), z0: CZ(-48), z1: CZ(-38) };
    for (let x = H.x0 + 1; x <= H.x1 - 1; x++) for (let z = H.z0 + 1; z <= H.z1 - 1; z++) { for (let y = G; y <= G + 2; y++) W.set(x, y, z, B.AIR); W.set(x, TOP, z, B.FLOOR_TILE); }
    W.fill(H.x0, G, H.z0 + 3, H.x0, G + 1, H.z0 + 3, B.DOOR); W.set(H.x0, G + 2, H.z0 + 3, B.SCHOOL_WALL);
    W.fill(H.x0 + 2, G, H.z1 - 1, H.x1 - 2, G, H.z1 - 1, B.DESK, ST); for (let x = H.x0 + 2; x <= H.x1 - 2; x += 2) { W.set(x, G + 1, H.z1 - 1, B.MONITOR, HALF_ZP); W.set(x, G, H.z1 - 2, B.BENCH, SB); }
    W.fill(H.x1 - 1, G, H.z0 + 1, H.x1 - 1, G + 1, H.z1 - 2, B.BOOKSHELF); ceilLights(H.x0 + 1, H.z0 + 1, H.x1 - 1, H.z1 - 1, G + 3, 2);
    sign('현지우 연구실', H.x0 - 0.06, G + 2.6, H.z0 + 3.5, 'west', 2.6, '#f0c46a', '#13213d', 0.5, { text2: '별관 · 컴퓨터 연구', color2: '#eef1f6' });
    place('lab2', '별관 연구실', (H.x0 + H.x1) / 2 + 0.5, (H.z0 + H.z1) / 2 + 0.5, { x0: H.x0 + 1, z0: H.z0 + 1, x1: H.x1 - 1, z1: H.z1 - 1 }); zone('별관', H.x0 - 1, H.z0 - 1, H.x1 + 1, H.z1 + 1);
    props.homes['현지우 선생님'] = [(H.x0 + H.x1) / 2 + 0.5, (H.z0 + H.z1) / 2 + 0.5, G, 2];
    const nx = CX(-48), nz = CZ(6);
    for (let x = nx - 2; x <= nx + 2; x++) for (let z = nz - 1; z <= nz; z++) for (let y = G; y <= G + 3; y++) W.set(x, y, z, B.AIR);
    walls(nx - 2, nz - 1, nx + 2, nz, G, G + 1, B.PAINT_WHITE); W.fill(nx - 2, G + 2, nz - 1, nx + 2, G + 2, nz, B.AWNING_BLUE); flat(nx - 2, nz - 1, nx + 2, nz, B.FLOOR_TILE);
    W.fill(nx, G, nz, nx, G + 1, nz, B.DOOR); W.set(nx - 1, G, nz - 1, B.BED, SB); W.set(nx + 1, G, nz - 1, B.IRON, SB); W.set(nx + 1, G + 1, nz - 1, B.WINDOW);
    sign('보건실', nx + 0.5, G + 2.5, nz + 1.06, 'north', 2, '#ffffff', '#1e7a4a', 0.45); place('nurse', '보건실', nx + 0.5, nz + 1.5, { x0: nx - 2, z0: nz - 1, x1: nx + 2, z1: nz + 1 });
  }

  // ===== 5. 운동장(옛 -32..32 × -62..-22) · 농구장(40..54 × -58..-32) · 텃밭(-62..-42 × -36..-16) · 조회대(12, -21) · 주차장(56..82 × -36..-20) =====
  const F = { x0: CX(-32), z0: CZ(-62), x1: CX(32), z1: CZ(-22) };
  props.field = { x0: F.x0, x1: F.x1, z0: F.z0, z1: F.z1, cx: (F.x0 + F.x1) / 2 + 0.5, cz: (F.z0 + F.z1) / 2 + 0.5, r: Math.min(F.x1 - F.x0, F.z1 - F.z0) / 2 - 2 };
  zone('운동장', F.x0 - 2, F.z0 - 2, F.x1 + 2, F.z1 + 2); place('field', '운동장', props.field.cx, props.field.cz, { x0: F.x0, z0: F.z0, x1: F.x1, z1: F.z1 });
  { const zc = Math.floor((F.z0 + F.z1) / 2); for (const gx of [F.x0 + 1, F.x1 - 1]) for (let y = G; y <= G + 1; y++) for (let z = zc - 2; z <= zc + 2; z++) { const id = W.get(gx, y, z); if (id === B.AIR || id === B.PAINT_WHITE || id === B.FENCE_WHITE) W.set(gx, y, z, B.GOAL); } }
  const BK = { x0: CX(40), z0: CZ(-58), x1: CX(54), z1: CZ(-32) };
  zone('농구장', BK.x0 - 2, BK.z0 - 2, BK.x1 + 2, BK.z1 + 2); place('basketball', '농구장', (BK.x0 + BK.x1) / 2 + 0.5, (BK.z0 + BK.z1) / 2 + 0.5, { x0: BK.x0, z0: BK.z0, x1: BK.x1, z1: BK.z1 });
  sign('농구장', (BK.x0 + BK.x1) / 2 + 0.5, G + 1.5, BK.z0 - 1.06, 'south', 2.6, '#ff8a8d', '#2a0f14', 0.45);
  place('garden', '텃밭 · 쉼터', TX(-52), TZ(-26), { x0: CX(-62), z0: CZ(-36), x1: CX(-42), z1: CZ(-16) }); zone('텃밭', CX(-62), CZ(-36), CX(-42), CZ(-16));
  sign('텃밭 · 쉼터', TX(-52), G + 1.4, CZ(-16) + 1.06, 'north', 2.4, '#ffffff', '#1e7a4a', 0.4, { text2: '상추 · 토마토 · 고추 · 그네', color2: '#d8efe6' });
  place('podium', '조회대', TX(12), TZ(-23), { x0: CX(8), z0: CZ(-23), x1: CX(16), z1: CZ(-19) });
  flat(CX(56), CZ(-36), CX(82), CZ(-20), B.GRAVEL); for (let x = CX(58); x <= CX(80); x += 3) W.fill(x, TOP, CZ(-34), x, TOP, CZ(-22), B.PARKING);
  props.carSpawn = { x: TX(76), z: TZ(-32), heading: 0 }; place('parking', '주차장', TX(69), TZ(-28), { x0: CX(56), z0: CZ(-36), x1: CX(82), z1: CZ(-20) }); zone('주차장', CX(56), CZ(-36), CX(82), CZ(-20));
  for (let z = F.z0 + 3; z <= F.z1 - 3; z += 8) bench(F.x0 - 3, z, false);
  { const gx = BK.x0 + 2, gz = BK.z1 + 3; W.fill(gx, G, gz, gx, G + 2, gz, B.LAMP_POLE); W.fill(gx + 3, G, gz, gx + 3, G + 2, gz, B.LAMP_POLE); W.fill(gx, G + 3, gz, gx + 3, G + 3, gz, B.IRON, SB); W.fill(gx + 5, G, gz, gx + 5, G, gz + 2, B.IRON, HALF_XP); W.fill(gx + 7, G, gz, gx + 7, G, gz + 2, B.IRON, HALF_XN); W.fill(gx + 9, G, gz, gx + 11, G, gz, B.BENCH, SB);
    sign('야외 체육관', gx + 5.5, G + 3.6, gz - 0.06, 'south', 3, '#ffffff', '#444444', 0.4); place('outgym', '야외 체육관', gx + 5.5, gz - 1.5, { x0: gx - 1, z0: gz - 2, x1: gx + 12, z1: gz + 3 }); }

  // ===== 6. 교문(옛 0, -70) =====
  const gate = { x: CX(0), z: CZ(-70) };
  W.fill(gate.x - 4, G, gate.z, gate.x + 4, G + 2, gate.z, B.AIR); flat(gate.x - 4, gate.z - 6, gate.x + 4, gate.z + 4, B.SIDEWALK);
  for (const px of [gate.x - 5, gate.x + 5]) { W.fill(px, G, gate.z, px, G + 3, gate.z, B.PAINT_WHITE); W.set(px, G + 4, gate.z, B.LAMP_HEAD, SB); props.lamps.push({ x: px + 0.5, y: G + 4.3, z: gate.z + 0.5, warm: true }); }
  sign('마이폴학교', gate.x - 4.5, G + 1.9, gate.z - 0.06, 'south', 1.0, '#f0c46a', '#13213d', 1.0, { text2: 'MY PAUL', color2: '#eef1f6' }); sign('마이폴학교', gate.x + 5.5, G + 1.9, gate.z - 0.06, 'south', 1.0, '#f0c46a', '#13213d', 1.0, { text2: 'SCHOOL', color2: '#eef1f6' });
  zone('교문', gate.x - 8, gate.z - 6, gate.x + 8, gate.z + 6); place('gate', '교문', gate.x + 0.5, gate.z + 2.5);
  props.spawn = { x: gate.x + 0.5, y: G, z: gate.z + 5.5 };

  // ===== 7. 나무(전 판 자리) · 뒤쪽 캠퍼스(사택 · 정자 · 뒷산 길) · 조명 =====
  const tryTree = (x, z, kind) => { x = Math.round(x); z = Math.round(z); if (W.get(x, TOP, z) === B.GRASS && W.get(x, G, z) === B.AIR && W.get(x, G + 1, z) === B.AIR && W.get(x, G + 6, z) === B.AIR) tree(x, z, kind); };
  for (const [x, z] of [[-50, -24], [-58, -18], [-62, -30], [-44, -32], [70, -50], [76, -14], [-86, -10], [-74, 14]]) tryTree(TX(x), TZ(z));
  for (let a = -80; a <= 80; a += 13) tryTree(TX(a + (R() - 0.5) * 4), TZ(17 + R() * 8), R() < 0.4 ? 'pine' : 'oak');
  tryTree(TX(-9.5), TZ(-76.5), 'pine');
  const back = CZ(16);
  W.fill(gate.x - 2, G, back, gate.x + 2, G + 1, back, B.AIR); flat(gate.x - 2, back - 1, gate.x + 2, back + 2, B.GRAVEL);
  building(66, 160, 76, 168, [3, 3], B.WALL_BEIGE, { roof: 'pitched', roofId: B.ROOF_RED, litP: 0.4 }); door(70, G, 160, 1, 2); sign('사택', 70.5, G + 2.6, 159.94, 'south', 1.6, '#ffffff', '#5b3f1d', 0.4);
  const pav = { x: 160, z: 160 };
  W.fill(pav.x - 2, G, pav.z - 2, pav.x + 2, G, pav.z + 2, B.PLANKS, SB); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) W.fill(pav.x + dx, G, pav.z + dz, pav.x + dx, G + 3, pav.z + dz, B.LOG);
  W.fill(pav.x - 3, G + 4, pav.z - 3, pav.x + 3, G + 4, pav.z + 3, B.ROOF_GREEN, SB); W.fill(pav.x - 2, G + 4, pav.z - 2, pav.x + 2, G + 4, pav.z + 2, B.ROOF_GREEN, ST); W.fill(pav.x - 1, G + 5, pav.z - 1, pav.x + 1, G + 5, pav.z + 1, B.ROOF_GREEN, SB);
  W.fill(pav.x - 1, G, pav.z + 2, pav.x + 1, G, pav.z + 2, B.BENCH, SB); W.fill(pav.x - 2, G, pav.z - 1, pav.x - 2, G, pav.z + 1, B.BENCH, SB); place('pavilion', '학교 정자', pav.x + 0.5, pav.z - 3.5);
  flat(gate.x - 1, back + 3, gate.x + 1, 192, B.GRAVEL); flat(gate.x + 2, 158, pav.x - 3, 159, B.GRAVEL);
  for (let z = 132; z <= 190; z += 8) for (let x = 90; x <= 190; x += 12) if (Math.hypot(x - pav.x, z - pav.z) > 6 && Math.abs(x - gate.x) > 3) tryTree(x + (R() - 0.5) * 4, z + (R() - 0.5) * 4, (x + z) % 3 === 0 ? 'pine' : 'oak');
  for (let x = C.x0 + 4; x < C.x1; x += 11) tryTree(x, C.z1 - 3); for (let z = C.z0 + 6; z < C.z1; z += 11) { tryTree(C.x0 + 3, z); tryTree(C.x1 - 3, z); }
  for (const [x, z] of [[bld.x0 - 3, bld.z0 - 3], [bld.x1 + 3, bld.z0 - 3], [D.x1 + 3, D.z0 + 3], [D.x1 + 3, D.z1 - 3], [gate.x - 12, gate.z + 6], [gate.x + 12, gate.z + 6], [gate.x, back + 8], [gate.x + 8, 150], [gate.x - 8, 176]]) if (W.get(x, G, z) === B.AIR) lamp(x, z, 4, true);

  // 선생님 자리: 방 이름 → 방 가운데
  const homeOf = (id, r = 2) => { const q = rooms.find((m) => m.id === id); return q ? [(q.ix0 + q.ix1) / 2 + 0.5, (q.iz0 + q.iz1) / 2 + 0.5, q.fy, Math.max(0.8, Math.min(r, (q.ix1 - q.ix0) / 2))] : null; };
  Object.assign(props.homes, {
    '박남규 선생님': homeOf('pjh1'), '육민정 선생님': homeOf('ymj'), '김광호 선생님': homeOf('kkh'), '박재현 선생님': homeOf('pjh2'), '강승환 선생님': homeOf('ksh'), '교장선생님': homeOf('prn'), '이상문 선생님': homeOf('lsm'), '신동호 선생님': homeOf('shin'),
    '교감선생님': homeOf('tch'), '유 목사님': homeOf('chp'), '체육쌤': [props.field.cx, props.field.cz, G, 8], '홍 선생님': homeOf('adm'), '행정 선생님': homeOf('adm', 1.5), '상담선생님': homeOf('cns'),
    '사감쌤': [77.5, 109.5, G, 1], '여사감쌤': [83, 97, G, 1.5], '수탉': [TX(-52), TZ(-26), G, 4], '폴': [pav.x + 0.5, pav.z + 4.5, G, 6], '몽이': [TX(70), TZ(-45), G, 5],
  });

  // ---- 방 꾸미기(본관): 방 크기에 맞춰 놓고, 벽·문 자리는 피함 ----
  function furnish(r) {
    const { ix0, ix1, iz0, iz1, fy, st } = r; const w = ix1 - ix0 + 1, d = iz1 - iz0 + 1; if (w < 2 || d < 2) return;
    const hallS = !r.doors[0] || r.doors[0][0] === 'n'; const winZ = hallS ? iz1 : iz0, hallZ = hallS ? iz0 : iz1, winHug = hallS ? HALF_ZP : HALF_ZN, hallHug = hallS ? HALF_ZN : HALF_ZP;
    const inr = (x, z) => x >= ix0 && x <= ix1 && z >= iz0 && z <= iz1;
    const set = (x, y, z, id, sh = 0) => { if (inr(x, z) && W.get(x, y, z) === B.AIR) W.set(x, y, z, id, sh); };
    const deskSet = (x, z, dir) => { set(x, fy, z, B.DESK, ST); set(x, fy + 1, z, B.MONITOR, dir < 0 ? HALF_ZP : HALF_ZN); set(x, fy, z + dir, B.BENCH, SB); };
    const groupTable = (x, z) => { for (let dz = 0; dz < 2; dz++) { set(x, fy, z + dz, B.DESK, ST); set(x + 1, fy, z + dz, B.DESK, ST); set(x - 1, fy, z + dz, B.BENCH, SB); set(x + 2, fy, z + dz, B.BENCH, SB); } };
    const mid = Math.floor((iz0 + iz1) / 2);
    switch (st) {
      case 'lab':
        for (let x = ix0 + 1; x <= ix1 - 1; x += 2) set(x, fy + 1, winZ, B.WHITEBOARD, winHug);
        groupTable(ix0 + 1, mid - 1); if (w >= 7) groupTable(ix0 + 5, mid - 1);
        set(ix0, fy, hallZ, B.BOOKSHELF); set(ix1, fy, hallZ, B.BOOKSHELF); set(ix1, fy + 1, hallZ, B.BOOKSHELF);
        deskSet(ix1, winZ, hallS ? -1 : 1); set(ix0, fy, winZ, B.FLOWERS, SB);
        break;
      case 'admin': case 'office':
        for (let x = ix0 + 1; x <= ix1 - 1; x += 2) deskSet(x, iz0 + 1, 1);
        if (d >= 5) for (let x = ix0 + 1; x <= ix1 - 1; x += 2) deskSet(x, iz1 - 1, -1);
        set(ix0, fy, mid, B.LOCKER, HALF_XN); set(ix0, fy + 1, mid, B.LOCKER, HALF_XN); set(ix1, fy, mid, B.IRON, ST);
        break;
      case 'counsel2':
        set(ix0 + 1, fy, mid, B.DESK, ST); set(ix0 + 2, fy, mid, B.DESK, ST); set(ix0 + 1, fy, mid - 1, B.BENCH, SB); set(ix0 + 2, fy, mid + 1, B.BENCH, SB);
        set(ix1, fy, iz0, B.BOOKSHELF); set(ix1, fy + 1, iz0, B.BOOKSHELF); set(ix1 - 1, fy, winZ, B.FLOWERS, SB); for (let x = ix0; x <= ix0 + 1; x++) set(x, fy + 1, winZ, B.WHITEBOARD, winHug);
        break;
      case 'cafeteria':
        for (let x = ix0 + 1; x <= ix1 - 3; x += 4) for (let z = iz0; z <= iz1 - 2; z += 3) groupTable(x, z);
        set(ix1, fy, iz0, B.IRON); set(ix1, fy, iz0 + 1, B.IRON, ST); set(ix1 - 1, fy, winZ, B.DESK, ST); set(ix1 - 1, fy + 1, winZ, B.SHOP_GLASS, SB);
        set(ix0, fy, hallZ, B.IRON, hallHug);
        sign('카페 가이아', ix0 + 0.5, fy + 2.5, winZ + (hallS ? 0.94 : 0.06), hallS ? 'south' : 'north', 2.4, '#f5c542', '#163d2b', 0.5, { text2: '아메리카노 · 생과일 주스', color2: '#d8efe6' });
        break;
      case 'store':
        for (let x = ix0; x <= ix1; x++) { set(x, fy, winZ, B.BOOKSHELF); set(x, fy + 1, winZ, B.BOOKSHELF); }
        set(ix0, fy, hallZ + (hallS ? 1 : -1), B.DESK, ST); set(ix0, fy + 1, hallZ + (hallS ? 1 : -1), B.MONITOR, hallHug);
        break;
      case 'club':
        groupTable(ix0 + 1, mid - 1); set(ix1, fy, iz0, B.PIANO); set(ix1 - 1, fy, iz0, B.PIANO); for (let x = ix0; x <= ix1; x += 2) set(x, fy + 1, winZ, B.WHITEBOARD, winHug); set(ix1, fy, iz1, B.CARPET, SB);
        break;
      case 'storage':
        for (let x = ix0; x <= ix1; x++) { set(x, fy, winZ, B.BOOKSHELF); set(x, fy + 1, winZ, B.BOOKSHELF); } set(ix0, fy, mid, B.PLANKS);
        break;
      case 'principal':
        set(ix1 - 1, fy, iz0 + 1, B.DESK, ST); set(ix1 - 2, fy, iz0 + 1, B.DESK, ST); set(ix1 - 1, fy + 1, iz0 + 1, B.MONITOR, HALF_ZN); set(ix1 - 1, fy, iz0 + 2, B.BENCH, SB);
        set(ix0 + 1, fy, mid, B.DESK, ST); set(ix0 + 2, fy, mid, B.DESK, ST); for (let x = ix0 + 1; x <= ix0 + 2; x++) { set(x, fy, mid - 1, B.BENCH, SB); set(x, fy, mid + 1, B.BENCH, SB); }
        for (let z = iz0; z <= iz1; z++) { set(ix0, fy, z, B.BOOKSHELF); set(ix0, fy + 1, z, B.BOOKSHELF); } set(ix1, fy, iz1, B.FLOWERS, SB);
        sign('교장실', ix1 + 0.94, fy + 2.5, mid + 0.5, 'west', 1.4, '#f0c46a', '#13213d', 0.45); sign('2022 최우수 대안교육기관', ix0 + 0.06, fy + 2.5, mid + 0.5, 'east', 2.2, '#f0c46a', '#2a2416', 0.5, { text2: 'KCAE 선정', color2: '#efe6cf' });
        break;
      case 'chapel':
        for (let x = ix0 + 1; x <= ix1 - 3; x += 2) for (const z of [iz0 + 1, iz0 + 2, iz1 - 2, iz1 - 1]) set(x, fy, z, B.BENCH, SB);
        set(ix1, fy, mid, B.WOOD_DARK, SB); set(ix1, fy + 1, mid, B.CROSS, HALF_XP); set(ix1 - 1, fy, iz1, B.PIANO); set(ix1 - 2, fy, iz1, B.PIANO);
        for (let z = iz0; z <= iz1; z++) { set(ix0, fy, z, B.BOOKSHELF); set(ix0, fy + 1, z, B.BOOKSHELF); }
        sign('두란노 도서관', ix0 + 0.06, fy + 2.5, mid + 0.5, 'east', 2.4, '#f0c46a', '#13213d', 0.5, { text2: '채플실 · 매주 수요일 예배', color2: '#eef1f6' });
        break;
      case 'reading':
        for (let x = ix0; x <= ix1; x += 2) for (let z = iz0; z <= iz1; z++) { set(x, fy, z, B.DESK, ST); set(x, fy + 1, z, B.WHITEBOARD, HALF_XN); if (x + 1 <= ix1) set(x + 1, fy, z, B.BENCH, SB); }
        break;
      case 'workshop':
        for (let x = ix0; x <= ix1; x++) set(x, fy, winZ, B.DESK, ST); set(ix0, fy + 1, winZ, B.IRON, ST); set(ix1, fy + 1, winZ, B.MONITOR, winHug); set(ix0, fy, hallZ, B.IRON); set(ix1, fy, hallZ, B.BOOKSHELF);
        break;
      case 'lobby':
        set(ix0, fy, iz0, B.LOCKER, HALF_XN); set(ix0, fy + 1, iz0, B.LOCKER, HALF_XN); set(ix1, fy, iz0, B.LOCKER, HALF_XP); set(ix1, fy + 1, iz0, B.LOCKER, HALF_XP);
        set(ix0, fy, iz1 - 1, B.BENCH, SB); set(ix0, fy, iz1, B.FLOWERS, SB); set(ix1, fy, iz1 - 1, B.BENCH, SB); set(ix1, fy, iz1, B.FLOWERS, SB);
        for (let z = iz0 + 2; z <= iz1 - 2; z++) set(ix0, fy + 1, z, B.WHITEBOARD, HALF_XN);
        sign('게시판 · 이번 주 안내', ix0 + 0.56, fy + 2.0, mid + 0.5, 'east', 2.6, '#1a1a1a', '#fff7d6', 0.9, { text2: '수요일 채플 · 금요일 학술제 리허설', color2: '#444444' });
        break;
      case 'board':
        set(ix0, fy + 1, iz0 + 1, B.WHITEBOARD, HALF_XN); sign('학술제 D-7', ix0 + 0.56, fy + 2.0, iz0 + 1.5, 'east', 2.0, '#1a1a1a', '#fff7d6', 0.9, { text2: '발표 순서표 · 포스터 제출', color2: '#444444' });
        set(ix1, fy, iz1, B.BENCH, SB); set(ix1, fy, iz0, B.FLOWERS, SB);
        break;
      default: break;
    }
  }
}
