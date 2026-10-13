// 학교 앞 도시 — 가게 줄 · 주택가 · 마트 · 정류장 · 아파트 단지 · 공원 · 뒷산
import { WORLD, B } from '../blocks.js';
import { fbmWorld, hash } from '../noise.js';
import { G, TOP, SB, ST, HALF_XN, HALF_XP, HALF_ZN, HALF_ZP } from './util.js';

const { SX, SZ } = WORLD;

export function buildCity(W, T, R, props, isRoad, isWalk) {
  const { walls, clearAbove, windowRow, door, sign, zone, place, lamp, building, tree, bench, flowerBed, topY, stairsZ } = T;

  // ===== 가게 줄: 남쪽 도로 남쪽 보도 아래, 정면 z=50 (북향) =====
  const shops = [
    ['분식', B.SIGN_BUNSIK, B.AWNING_RED, B.WALL_BEIGE], ['편의점', B.SIGN_CONV, B.AWNING_GREEN, B.WALL_GRAY], ['문구', B.SIGN_STATIONERY, B.AWNING_BLUE, B.BRICK],
    ['학원', B.SIGN_ACADEMY, null, B.WALL_GRAY], ['PC방', B.SIGN_PC, null, B.BRICK_DARK], ['카페', B.SIGN_CAFE, B.AWNING_RED, B.WALL_BEIGE],
    ['치킨', B.SIGN_CHICKEN, B.AWNING_RED, B.BRICK], ['빵집', B.SIGN_BAKERY, B.AWNING_BLUE, B.WALL_BEIGE], ['약국', B.SIGN_PHARMACY, B.AWNING_GREEN, B.WALL_GRAY],
    ['마트', B.SIGN_MART, null, B.WALL_GRAY], ['분식', B.SIGN_BUNSIK, B.AWNING_GREEN, B.BRICK_DARK], ['학원', B.SIGN_ACADEMY, null, B.WALL_BEIGE], ['카페', B.SIGN_CAFE, B.AWNING_BLUE, B.BRICK],
  ];
  const shopNames = ['마이폴 분식', '행복 편의점', '별빛 문구', '수학의 숲 학원', '번개 PC방', '카페 느티', '바삭 치킨', '아침 빵집', '튼튼 약국', '우리 마트', '왕 떡볶이', '영어 나라 학원', '카페 모모'];
  const shopKeys = ['bunsik', 'conv', 'stationery', 'academy', 'pc', 'cafe', 'chicken', 'bakery', 'pharmacy', 'minimart', 'bunsik', 'academy', 'cafe'];
  const shopColors = ['#b3261e', '#1e7a4a', '#2456c8', '#1a2a5c', '#5a1e80', '#5a3a24', '#e07019', '#73482a', '#1a8040', '#f2c21a', '#b3261e', '#1a2a5c', '#5a3a24'];
  let sx = 64;
  shops.forEach(([name, signId, awning, wall], i) => {
    const x0 = sx, x1 = sx + 9, z0 = 38, z1 = 50, floors = i % 3 === 1 ? [4, 3, 3] : [4, 3];
    building(x0, z0, x1, z1, floors, wall, { roof: i % 2 ? 'flat' : 'pitched', roofId: i % 4 === 0 ? B.ROOF_RED : B.ROOF_GREEN, shopFront: true, litP: 0.55 });
    W.fill(x0 + 1, G, z1, x1 - 1, G + 2, z1, B.SHOP_GLASS); door(x0 + 4, G, z1, 2, 2);
    W.fill(x0 + 1, G + 3, z1, x1 - 1, G + 3, z1, B.WALL_GRAY); W.fill(x0 + 3, G + 3, z1, x0 + 6, G + 3, z1, signId);
    if (awning) W.fill(x0 + 1, G + 2, z1 + 1, x1 - 1, G + 2, z1 + 1, awning, ST);
    sign(shopNames[i], x0 + 5, G + 3.5, z1 + 1.06, 'north', 8, '#ffffff', shopColors[i]);
    W.fill(x0 + 1, TOP, z0 + 1, x1 - 1, TOP, z1 - 1, B.FLOOR_TILE); W.fill(x0 + 2, G, z0 + 2, x1 - 2, G + 1, z0 + 2, B.BOOKSHELF); W.fill(x0 + 2, G, z0 + 5, x0 + 2, G, z1 - 3, B.DESK, ST);
    W.fill(x0 + 6, G, z0 + 5, x1 - 2, G, z0 + 5, B.DESK, ST); W.fill(x0 + 6, G + 1, z0 + 5, x1 - 2, G + 1, z0 + 5, B.SHOP_GLASS, SB);
    if (shopKeys[i] === 'pc') { for (let dx = 2; dx <= 7; dx++) for (let dz = 7; dz <= 10; dz += 3) { W.set(x0 + dx, G, z0 + dz, B.DESK, ST); W.set(x0 + dx, G + 1, z0 + dz, B.MONITOR, HALF_ZP); W.set(x0 + dx, G, z0 + dz - 1, B.BENCH, SB); } }
    if (shopKeys[i] === 'cafe' || shopKeys[i] === 'bunsik' || shopKeys[i] === 'chicken') { for (let dx = 3; dx <= 7; dx += 2) for (let dz = 7; dz <= 9; dz += 2) { W.set(x0 + dx, G, z0 + dz, B.DESK, ST); W.set(x0 + dx - 1, G, z0 + dz, B.BENCH, SB); } }
    if (shopKeys[i] === 'academy') { for (let dx = 2; dx <= 7; dx += 2) for (let dz = 6; dz <= 10; dz += 2) { W.set(x0 + dx, G, z0 + dz, B.DESK, ST); W.set(x0 + dx + 1, G, z0 + dz, B.BENCH, SB); } W.fill(x0 + 1, G + 1, z0 + 3, x0 + 1, G + 2, z0 + 9, B.WHITEBOARD, HALF_XN); }
    place(shopKeys[i], shopNames[i], x0 + 5, z1 + 2.5);
    sx += 10;
  });
  zone('학교 앞 거리', 62, 36, 196, 62);

  // ===== 주택가 (z 6..34): 9×9 집(층 3m) · 담장 · 골목 =====
  const houseWalls = [B.BRICK, B.WALL_BEIGE, B.WALL_GRAY, B.BRICK_DARK, B.WALL_BEIGE];
  const houseAt = (x0, z0, i) => {
    const wall = houseWalls[i % houseWalls.length];
    building(x0, z0, x0 + 8, z0 + 8, [3, 3], wall, { roof: 'pitched', roofId: i % 3 === 0 ? B.ROOF_GREEN : B.ROOF_RED, litP: 0.5 });
    door(x0 + 4, G, z0 + 8, 1, 2); W.set(x0 + 4, G, z0 + 9, B.CONCRETE, SB);
    W.fill(x0 - 1, TOP, z0 - 1, x0 + 9, TOP, z0 + 9, B.SIDEWALK); W.fill(x0, TOP, z0, x0 + 8, TOP, z0 + 8, B.CONCRETE);
    for (let x = x0 - 1; x <= x0 + 9; x++) { if (Math.abs(x - (x0 + 4)) > 1) { W.set(x, G, z0 + 10, B.BRICK, HALF_ZN); W.set(x, G + 1, z0 + 10, B.BRICK, SB); } }
    W.set(x0 + 2, G, z0 + 10, B.FENCE); W.set(x0 + 6, G, z0 + 10, B.FENCE);
    if (i % 2 === 0 && W.get(x0 + 10, TOP, z0 + 4) === B.GRASS) tree(x0 + 10, z0 + 4);
    W.fill(x0 + 1, G, z0 + 1, x0 + 2, G, z0 + 2, B.BED, SB); W.set(x0 + 6, G, z0 + 1, B.DESK, ST); W.fill(x0 + 2, G, z0 + 6, x0 + 5, G, z0 + 6, B.BENCH, SB);
  };
  let hi = 0;
  for (let x = 66; x <= 180; x += 13) for (let z = 8; z <= 21; z += 13) { if (!isRoad(x + 4, z + 4) && !isWalk(x + 4, z + 4)) houseAt(x, z, hi++); }
  for (let x = 6; x <= 32; x += 13) for (let z = 8; z <= 34; z += 13) houseAt(x, z, hi++);
  for (let x = 62; x <= 194; x++) for (let z = 4; z <= 36; z++) if (W.get(x, TOP, z) === B.GRASS && !isRoad(x, z)) W.set(x, TOP, z, hash(x, z, 9) < 0.5 ? B.SIDEWALK : B.ASPHALT);
  zone('주택가', 0, 0, 196, 36);

  // ===== 마트(동남) + 주차장 =====
  building(210, 14, 246, 40, [7], B.WALL_GRAY, { roof: 'flat', shopFront: true, litP: 0.8 });
  W.fill(211, G, 40, 245, G + 3, 40, B.SHOP_GLASS); door(226, G, 40, 4, 2); W.fill(226, G + 2, 40, 229, G + 2, 40, B.SHOP_GLASS); W.fill(220, G + 4, 40, 236, G + 5, 40, B.SIGN_MART);
  sign('우리 마트', 228.5, G + 5, 41.06, 'north', 12, '#b3261e', '#f2c21a', 1.6);
  W.fill(208, TOP, 42, 248, TOP, 50, B.ASPHALT); for (let x = 208; x <= 248; x += 3) W.fill(x, TOP, 42, x, TOP, 50, B.PARKING);
  W.fill(211, TOP, 15, 245, TOP, 39, B.FLOOR_TILE); for (let x = 214; x <= 242; x += 4) W.fill(x, G, 18, x, G + 1, 36, B.BOOKSHELF);
  W.fill(214, G, 37, 230, G, 37, B.DESK, ST); for (let x = 215; x <= 229; x += 3) W.set(x, G + 1, 37, B.MONITOR, ST);
  W.fill(240, G, 38, 244, G, 38, B.DESK, ST); sign('주유', 246.5, G + 2.5, 43.5, 'west', 3, '#ffffff', '#b3261e', 0.6); W.fill(246, G, 43, 246, G + 1, 44, B.IRON); W.set(246, G + 2, 43, B.TRAFFIC_LIGHT);
  place('mart', '우리 마트', 228, 42.5); place('fuel', '주유기', 245, 44);
  // 정류장 (남쪽 도로 북쪽 보도 x 176..181)
  W.fill(176, G, 61, 181, G, 61, B.BENCH, SB); W.fill(175, G, 60, 175, G + 2, 60, B.IRON); W.fill(182, G, 60, 182, G + 2, 60, B.IRON); W.fill(175, G + 3, 59, 182, G + 3, 61, B.CONCRETE, ST); W.fill(176, G + 1, 61, 181, G + 2, 61, B.BUS_STOP);
  sign('마이폴학교 앞', 178.5, G + 3.4, 58.94, 'south', 6, '#ffffff', '#2456c8', 0.7);
  place('bus', '버스 정류장', 178.5, 59.5);
  zone('마트', 206, 4, 255, 52);

  // ===== 아파트 단지(동쪽): 15층 3동 · 발코니 · 주차장 · 놀이터 =====
  W.fill(208, TOP, 64, 250, TOP, 192, B.SIDEWALK);
  for (let z = 66; z <= 190; z++) { W.set(209, G, z, B.HEDGE, HALF_XP); W.set(249, G, z, B.HEDGE, HALF_XN); }
  W.fill(210, TOP, 66, 216, TOP, 190, B.ASPHALT); for (let z = 66; z <= 190; z += 3) W.fill(210, TOP, z, 216, TOP, z, B.PARKING_X);
  const towers = [[70, '101동'], [110, '102동'], [150, '103동']];
  towers.forEach(([tz, name]) => {
    const x0 = 220, x1 = 241, z0 = tz, z1 = tz + 11, floors = 15, fh = 3, yTop = G + floors * fh - 1;
    clearAbove(x0 - 1, z0 - 2, x1 + 1, z1 + 1); walls(x0, z0, x1, z1, G, yTop, B.APT_WALL); W.fill(x0, TOP, z0, x1, TOP, z1, B.FLOOR_TILE);
    for (let f = 0; f < floors; f++) {
      const fy = G + f * fh;
      if (f > 0) T.floorSlab(x0 + 1, z0 + 1, x1 - 1, z1 - 1, fy, B.FLOOR_TILE);
      windowRow('x', x0, x1, z0, fy + 1, fy + 2, 0.45, B.APT_WINDOW, B.APT_WINDOW_LIT);
      windowRow('x', x0, x1, z1, fy + 1, fy + 2, 0.45, B.APT_WINDOW, B.APT_WINDOW_LIT);
      if (f > 0) { W.fill(x0, fy, z0 - 1, x1, fy, z0 - 1, B.BALCONY, SB); W.fill(x0, fy + 1, z0 - 1, x1, fy + 1, z0 - 1, B.BALCONY, HALF_ZN); }
      windowRow('z', z0, z1, x0, fy + 1, fy + 1, 0.3, B.APT_WINDOW, B.APT_WINDOW_LIT, 4); windowRow('z', z0, z1, x1, fy + 1, fy + 1, 0.3, B.APT_WINDOW, B.APT_WINDOW_LIT, 4);
      // 층 복도 + 집 칸막이
      W.fill(x0 + 1, fy, z0 + 6, x1 - 1, fy + fh - 2, z0 + 6, B.APT_WALL); for (let x = x0 + 6; x < x1; x += 5) { W.fill(x, fy, z0 + 1, x, fy + fh - 2, z0 + 5, B.APT_WALL); W.fill(x - 2, fy, z0 + 6, x - 2, fy + 1, z0 + 6, B.DOOR); }
    }
    W.fill(x0, yTop + 1, z0, x1, yTop + 1, z1, B.ROOF_FLAT); walls(x0, z0, x1, z1, yTop + 2, yTop + 2, B.APT_WALL);
    W.fill(x0 + 3, yTop + 2, z0 + 3, x0 + 5, yTop + 4, z0 + 5, B.TANK); W.fill(x1 - 6, yTop + 2, z1 - 5, x1 - 3, yTop + 3, z1 - 3, B.CONCRETE);
    door(230, G, z0, 2, 2); W.fill(228, G + 2, z0 - 2, 233, G + 2, z0 - 1, B.CONCRETE, ST); sign(name, 231, G + 2.6, z0 - 2.06, 'south', 3, '#ffffff', '#1a2a5c', 0.8);
    sign('푸른솔', 231, yTop - 2, z0 - 0.06, 'south', 10, '#ffffff', '#1a2a5c', 2.2);
    for (let x = x0 + 2; x <= x1 - 2; x += 6) tree(x, z0 - 4);
    lamp(218, tz + 5, 5); lamp(244, tz + 5, 5);
    place('apt' + name, '푸른솔 ' + name, 231, z0 - 2.5);
  });
  W.fill(222, TOP, 168, 240, TOP, 184, B.SAND); W.fill(226, G, 172, 226, G + 2, 172, B.LAMP_POLE); W.fill(230, G, 172, 230, G + 2, 172, B.LAMP_POLE); W.fill(226, G + 3, 172, 230, G + 3, 172, B.IRON, SB);
  stairsZ(234, 235, 176, 1, 4, G, B.PLANKS); W.fill(234, G + 2, 180, 235, G + 2, 181, B.PLANKS, SB); W.fill(236, G + 1, 180, 239, G + 1, 181, B.AWNING_BLUE, ST); W.fill(236, G, 180, 239, G, 181, B.AWNING_BLUE, SB);
  for (let z = 174; z <= 182; z += 4) bench(241, z, false);
  W.fill(212, G, 64, 212, G + 3, 64, B.STONE_PILLAR); W.fill(220, G, 64, 220, G + 3, 64, B.STONE_PILLAR); W.fill(212, G + 4, 64, 220, G + 4, 64, B.CONCRETE, SB);
  sign('푸른솔 아파트', 216.5, G + 4.3, 63.94, 'south', 9, '#ffffff', '#1a2a5c', 1.0);
  place('aptplay', '아파트 놀이터', 231, 176);
  zone('아파트 단지', 206, 62, 255, 194);

  // ===== 공원(서쪽): 연못 · 산책로 · 정자 · 운동기구 =====
  const pond = { x: 27, z: 128, r: 9 };
  for (let x = 4; x <= 50; x++) for (let z = 64; z <= 192; z++) {
    const d = Math.hypot(x - pond.x, z - pond.z) + (fbmWorld(x, z, 6, 2, 71) - 0.5) * 3;
    if (d < pond.r) { W.set(x, TOP, z, d < pond.r - 3 ? B.WATER_DEEP : B.WATER); W.set(x, TOP - 1, z, B.SAND); }
    else if (d < pond.r + 1.5) W.set(x, TOP, z, B.SAND);
  }
  W.fill(27, TOP, 64, 28, TOP, 117, B.GRAVEL); W.fill(27, TOP, 139, 28, TOP, 192, B.GRAVEL); W.fill(4, TOP, 128, 16, TOP, 129, B.GRAVEL); W.fill(38, TOP, 128, 50, TOP, 129, B.GRAVEL);
  for (let a = 0; a < 64; a++) { const px = Math.round(pond.x + Math.cos(a / 64 * Math.PI * 2) * (pond.r + 3)), pz = Math.round(pond.z + Math.sin(a / 64 * Math.PI * 2) * (pond.r + 3)); if (W.get(px, TOP, pz) === B.GRASS) W.set(px, TOP, pz, B.GRAVEL); }
  // 연못 다리(나무 판자, 반블록)
  W.fill(18, G, 128, 36, G, 129, B.PLANKS, SB); W.fill(18, G + 1, 127, 36, G + 1, 127, B.FENCE); W.fill(18, G + 1, 130, 36, G + 1, 130, B.FENCE);
  const pav = { x: 14, z: 96 };
  W.fill(pav.x - 3, G, pav.z - 3, pav.x + 3, G, pav.z + 3, B.PLANKS, SB);
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) W.fill(pav.x + dx, G, pav.z + dz, pav.x + dx, G + 3, pav.z + dz, B.LOG);
  W.fill(pav.x - 4, G + 4, pav.z - 4, pav.x + 4, G + 4, pav.z + 4, B.ROOF_GREEN, SB); W.fill(pav.x - 3, G + 4, pav.z - 3, pav.x + 3, G + 4, pav.z + 3, B.ROOF_GREEN, ST); W.fill(pav.x - 2, G + 5, pav.z - 2, pav.x + 2, G + 5, pav.z + 2, B.ROOF_GREEN, SB); W.fill(pav.x - 1, G + 5, pav.z - 1, pav.x + 1, G + 5, pav.z + 1, B.ROOF_GREEN, ST);
  W.fill(pav.x - 2, G, pav.z - 2, pav.x + 2, G, pav.z - 2, B.BENCH, SB); W.fill(pav.x - 2, G, pav.z + 2, pav.x + 2, G, pav.z + 2, B.BENCH, SB);
  for (let i = 0; i < 70; i++) { const x = 5 + Math.floor(R() * 45), z = 66 + Math.floor(R() * 125); if (W.get(x, TOP, z) === B.GRASS && Math.hypot(x - pond.x, z - pond.z) > pond.r + 5 && Math.hypot(x - pav.x, z - pav.z) > 7) tree(x, z, R() < 0.3 ? 'pine' : 'oak'); }
  for (let z = 70; z <= 186; z += 16) { bench(30, z, false); if (W.get(24, TOP, z) === B.GRASS) bench(24, z, false); }
  for (let z = 72; z <= 184; z += 24) lamp(29, z, 4);
  for (let x = 8; x <= 46; x += 8) for (let z = 68; z <= 188; z += 40) if (W.get(x, TOP, z) === B.GRASS) flowerBed(x, z, x + 1, z + 1);
  // 운동기구(철봉·평행봉)
  W.fill(40, G, 70, 40, G + 2, 70, B.LAMP_POLE); W.fill(44, G, 70, 44, G + 2, 70, B.LAMP_POLE); W.fill(40, G + 3, 70, 44, G + 3, 70, B.IRON, SB);
  W.fill(40, G, 74, 40, G, 76, B.IRON, HALF_XP); W.fill(43, G, 74, 43, G, 76, B.IRON, HALF_XN);
  zone('공원', 0, 62, 52, 194); place('park', '공원 정자', pav.x + 0.5, pav.z + 5.5); place('parkgym', '공원 운동기구', 42, 72);

  // 가로수
  const { half, walk } = props.roads;
  for (const c of props.roads.vx) for (let z = 14; z < SZ - 6; z += 12) for (const side of [-1, 1]) { const x = c + side * (half + walk + 1); if (W.get(x, TOP, z) === B.GRASS && W.get(x, G, z) === B.AIR) tree(x, z); }
  for (const c of props.roads.hz) for (let x = 14; x < SX - 6; x += 12) for (const side of [-1, 1]) { const z = c + side * (half + walk + 1); if (W.get(x, TOP, z) === B.GRASS && W.get(x, G, z) === B.AIR) tree(x, z); }
}

export function buildHill(W, T, R, props, isRoad, isWalk) {
  const { tree, place, zone, topY, bench } = T;
  const C = { z1: 194 };
  for (let z = C.z1 + 1; z < SZ - 2; z++) { const wob = Math.round(Math.sin(z * 0.15) * 3); for (let dx = -1; dx <= 1; dx++) { const x = 150 + wob + dx; if (isRoad(x, z) || isWalk(x, z)) continue; const h = topY(x, z); W.set(x, h, z, B.GRAVEL); } }
  for (let x = 2; x < SX - 2; x += 1) for (let z = 206; z < SZ - 2; z += 1) {
    if (hash(x, z, 501) < 0.045 && W.get(x, topY(x, z), z) === B.HILL_GRASS && Math.abs(x - 150 - Math.round(Math.sin(z * 0.15) * 3)) > 3) tree(x, z, hash(x, z, 502) < 0.75 ? 'pine' : 'oak');
  }
  const hx = 150, hz = 236, hy = topY(hx, hz) + 1;
  W.fill(hx - 3, hy - 1, hz - 3, hx + 3, hy - 1, hz + 3, B.PLANKS); for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) W.fill(hx + dx, hy, hz + dz, hx + dx, hy + 3, hz + dz, B.LOG);
  W.fill(hx - 4, hy + 4, hz - 4, hx + 4, hy + 4, hz + 4, B.ROOF_GREEN, SB); W.fill(hx - 2, hy + 4, hz - 2, hx + 2, hy + 4, hz + 2, B.ROOF_GREEN, ST); W.fill(hx - 2, hy, hz - 2, hx + 2, hy, hz - 2, B.BENCH, SB);
  place('hill', '뒷산 전망대', hx + 0.5, hz + 0.5);
  zone('뒷산', 0, 206, 255, 255);
}
