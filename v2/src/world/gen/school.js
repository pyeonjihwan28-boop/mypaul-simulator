// 마이폴학교 캠퍼스 v3 — 전 판(three.js 판)에서 디자인한 학교를 모티브로 + 실제 학교 정보(나무위키·뉴스)를 합침
//  · 본관: 2층 긴 건물(81m) · 흰 외벽 + 초록 띠 + 회색 굽도리 · 평지붕 · 둥근 기둥 3개 현관(2층이 앞으로 나옴) · 주황 복도 · 테라초 바닥
//    1층 남: 매점·데네브반·알리사반·현관 로비·행정실·진학지도실·식당(카페 가이아) / 1층 북: 연구실 3·계단실·교무실·상담실·방송실·창고
//    2층 남: 동아리실·연구실 2·교장실·채플실(두란노 도서관)·독서실·작업실 / 2층 북: 스피카·카펠라·메라크·계단실·폴스타반·연구실 2
//  · 운동장 64×38 잔디(양 끝 골대) · 농구장(동쪽) · 야구 백네트 · 조회대 · 국기게양대 · 야외 체육관
//  · 생활관: 별도 2층 + 지하 · 남학생(북)/여학생(남) · 사감실 · 휴게실·독서실 · 지하 세탁실·체력단련실
//  · 별관 연구실(빨간 지붕) · 컨테이너 보건실 · 노래방 · 창고 · 사택 · 텃밭 · 정자 · 뒷산 길
//  비율: 1칸 = 1m · 층 4m(천장 3m) · 문 2m · 책상 0.5m(위 반블록) · 의자 0.5m(아래 반블록) · 계단 한 단 0.5m
import { B } from '../blocks.js';
import { G, TOP, SB, ST, HALF_XN, HALF_XP, HALF_ZN, HALF_ZP } from './util.js';

export const CAMPUS = { x0: 62, z0: 62, x1: 194, z1: 194 };

export function buildSchool(W, T, R, props) {
  const { walls, clearAbove, windowRow, stairsX, door, sign, zone, place, lamp, building, tree, bench, flowerBed } = T;
  const C = CAMPUS;
  zone('학교 안', C.x0, C.z0, C.x1, C.z1);

  // ---- 작은 도구들 ----
  // 방 안쪽 가장자리를 따라 벽에 붙는 반블록 굽도리(나무 합판)
  const wainscot = (x0, z0, x1, z1, y, id = B.PLANKS) => {
    W.fill(x0, y, z0, x1, y, z0, id, HALF_ZN); W.fill(x0, y, z1, x1, y, z1, id, HALF_ZP);
    W.fill(x0, y, z0 + 1, x0, y, z1 - 1, id, HALF_XN); W.fill(x1, y, z0 + 1, x1, y, z1 - 1, id, HALF_XP);
  };
  // 천장 LED 판: 천장(cy, 꽉 찬 블록) 바로 아래 칸의 윗반쪽에 붙임
  const ceilLights = (x0, z0, x1, z1, cy, step = 3) => { for (let x = x0 + 1; x < x1; x += step) for (let z = z0 + 1; z < z1; z += step) if (W.get(x, cy - 1, z) === B.AIR) W.set(x, cy - 1, z, B.LAMP_HEAD, ST); };
  // 바닥: 1층은 땅 윗면(TOP), 위층은 fy-1 꽉 찬 블록
  const floorFill = (x0, z0, x1, z1, fy, id) => { if (fy === G) W.fill(x0, TOP, z0, x1, TOP, z1, id); else W.fill(x0, fy - 1, z0, x1, fy - 1, z1, id); };
  // 모둠 책상(2×3) + 의자 6개
  const groupTable = (x, z, y = G) => { W.fill(x, y, z, x + 1, y, z + 2, B.DESK, ST); for (let dz = 0; dz < 3; dz++) { W.set(x - 1, y, z + dz, B.BENCH, SB); W.set(x + 2, y, z + dz, B.BENCH, SB); } };
  // 책상 + 모니터 + 의자(dir: 의자가 놓이는 z 방향)
  const deskSet = (x, z, y, dir = -1) => { W.set(x, y, z, B.DESK, ST); W.set(x, y + 1, z, B.MONITOR, dir < 0 ? HALF_ZP : HALF_ZN); W.set(x, y, z + dir, B.BENCH, SB); };
  const flat = (x0, z0, x1, z1, id) => W.fill(x0, TOP, z0, x1, TOP, z1, id);

  // ===== 울타리 · 교문(아치) · 안내판 · 주차장 · 자전거 보관대 =====
  for (let x = C.x0; x <= C.x1; x++) { if (x < 146 || x > 154) W.set(x, G, C.z0, B.HEDGE, HALF_ZP); if (x < 148 || x > 152) W.set(x, G, C.z1, B.HEDGE, HALF_ZN); }
  for (let z = C.z0; z <= C.z1; z++) { W.set(C.x0, G, z, B.HEDGE, HALF_XP); W.set(C.x1, G, z, B.HEDGE, HALF_XN); }
  for (let x = C.x0; x <= C.x1; x += 8) if (x < 144 || x > 156) { W.set(x, G, C.z0, B.STONE_PILLAR); W.set(x, G + 1, C.z0, B.STONE_PILLAR, SB); }
  for (const px of [145, 155]) { W.fill(px, G, C.z0, px, G + 3, C.z0, B.STONE_PILLAR); W.set(px, G + 4, C.z0, B.LAMP_HEAD, SB); props.lamps.push({ x: px + 0.5, y: G + 4.3, z: C.z0 + 0.5, warm: true }); }
  W.fill(146, G + 3, C.z0, 154, G + 3, C.z0, B.STONE_PILLAR); // 아치 보
  flat(146, C.z0, 154, 69, B.ASPHALT); W.fill(146, G, 66, 154, G, 66, B.ASPHALT, SB);
  sign('마이폴학교', 150.5, G + 3.5, C.z0 - 0.06, 'south', 8.6, '#f0c46a', '#13213d', 0.96, { text2: 'MY PAUL SCHOOL · 충청북도 대안교육기관 1호', color2: '#eef1f6' });
  sign('마이폴학교', 150.5, G + 3.5, C.z0 + 1.06, 'north', 8.6, '#f0c46a', '#13213d', 0.96, { text2: '사유의 힘 · 감사의 마음', color2: '#eef1f6' });
  W.fill(140, G, 65, 140, G + 2, 65, B.IRON); W.fill(141, G + 1, 65, 143, G + 2, 65, B.WHITEBOARD); W.fill(144, G, 65, 144, G + 2, 65, B.IRON);
  sign('캠퍼스 안내', 142.5, G + 2.05, 64.94, 'south', 2.8, '#1a1a1a', '#f7f5ef', 0.42, { text2: '본관 · 운동장 · 농구장 · 생활관 · 텃밭 · 뒷산', color2: '#555555' });
  zone('교문', 142, 56, 158, 70); place('gate', '교문', 150.5, 60.5);
  flat(158, 64, 172, 72, B.ASPHALT); for (let x = 158; x <= 172; x += 3) W.fill(x, TOP, 64, x, TOP, 72, B.PARKING);
  W.fill(157, G, 64, 157, G, 72, B.STONE_PILLAR, SB); W.fill(158, G, 73, 172, G, 73, B.STONE_PILLAR, SB);
  props.carSpawn = { x: 160.5, z: 68.5, heading: Math.PI / 2 }; place('parking', '주차장', 165, 68);
  for (let x = 134; x <= 138; x++) W.set(x, G, 65, B.IRON, SB); sign('자전거 보관대', 136.5, G + 1.3, 64.94, 'south', 2, '#ffffff', '#444444', 0.32);

  // ===== 운동장 64×38 잔디 (양 끝 골대 · 라인) =====
  const F = { x0: 96, z0: 70, x1: 159, z1: 107 };
  flat(F.x0 - 1, F.z0 - 1, F.x1 + 1, F.z1 + 1, B.GRAVEL); flat(F.x0, F.z0, F.x1, F.z1, B.GRASS);
  const fcz = Math.floor((F.z0 + F.z1) / 2), fcx = Math.floor((F.x0 + F.x1) / 2);
  W.fill(F.x0 + 1, TOP, F.z0 + 1, F.x1 - 1, TOP, F.z0 + 1, B.FIELD_LINE_X); W.fill(F.x0 + 1, TOP, F.z1 - 1, F.x1 - 1, TOP, F.z1 - 1, B.FIELD_LINE_X);
  W.fill(F.x0 + 1, TOP, F.z0 + 1, F.x0 + 1, TOP, F.z1 - 1, B.FIELD_LINE); W.fill(F.x1 - 1, TOP, F.z0 + 1, F.x1 - 1, TOP, F.z1 - 1, B.FIELD_LINE); W.fill(fcx, TOP, F.z0 + 1, fcx, TOP, F.z1 - 1, B.FIELD_LINE);
  for (let a = 0; a < 40; a++) { const px = Math.round(fcx + Math.cos(a / 40 * Math.PI * 2) * 6), pz = Math.round(fcz + Math.sin(a / 40 * Math.PI * 2) * 6); W.set(px, TOP, pz, B.FIELD_LINE); }
  for (const gx of [F.x0 + 1, F.x1 - 1]) {
    const d = gx === F.x0 + 1 ? 1 : -1;
    W.fill(gx, G, fcz - 3, gx, G + 1, fcz + 3, B.GOAL);
    W.fill(gx + d * 6, TOP, fcz - 8, gx + d * 6, TOP, fcz + 8, B.FIELD_LINE); W.fill(gx, TOP, fcz - 8, gx + d * 6, TOP, fcz - 8, B.FIELD_LINE_X); W.fill(gx, TOP, fcz + 8, gx + d * 6, TOP, fcz + 8, B.FIELD_LINE_X);
  }
  props.field = { x0: F.x0 + 1, x1: F.x1 - 1, z0: F.z0 + 1, z1: F.z1 - 1, cx: fcx + 0.5, cz: fcz + 0.5, goalZ0: fcz - 3, goalZ1: fcz + 4 };
  for (let z = F.z0 + 5; z <= F.z1 - 5; z += 10) bench(F.x0 - 4, z, false);
  for (const [lx, lz] of [[F.x0 - 1, F.z0 - 2], [F.x1 + 1, F.z0 - 2]]) { W.fill(lx, G, lz, lx, G + 10, lz, B.LAMP_POLE); W.fill(lx - 1, G + 11, lz, lx + 1, G + 11, lz, B.LAMP_HEAD, SB); props.lamps.push({ x: lx + 0.5, y: G + 10.5, z: lz + 0.5, big: true }); }
  zone('운동장', 94, 68, 161, 109); place('field', '운동장', fcx + 0.5, fcz + 0.5);
  // 야구 백네트 (운동장 북동쪽 모서리) · 모래 멀리뛰기장 · 트랙
  W.fill(161, G, 99, 161, G + 4, 108, B.GOAL); W.fill(161, G, 108, 169, G + 4, 108, B.GOAL);
  for (const [px, pz] of [[161, 99], [161, 108], [169, 108], [165, 108], [161, 104]]) W.fill(px, G, pz, px, G + 5, pz, B.LAMP_POLE);
  flat(F.x0 + 2, F.z1 + 2, F.x0 + 12, F.z1 + 3, B.SAND); W.fill(F.x0 + 13, TOP, F.z1 + 2, F.x0 + 20, TOP, F.z1 + 3, B.TRACK);

  // ===== 농구장 (운동장 동쪽) · 야외 체육관 =====
  const BK = { x0: 164, z0: 80, x1: 186, z1: 98 };
  flat(BK.x0 - 1, BK.z0 - 1, BK.x1 + 1, BK.z1 + 1, B.CONCRETE);
  W.fill(BK.x0 + 1, TOP, BK.z0 + 1, BK.x1 - 1, TOP, BK.z0 + 1, B.MARBLE); W.fill(BK.x0 + 1, TOP, BK.z1 - 1, BK.x1 - 1, TOP, BK.z1 - 1, B.MARBLE);
  W.fill(BK.x0 + 1, TOP, BK.z0 + 1, BK.x0 + 1, TOP, BK.z1 - 1, B.MARBLE); W.fill(BK.x1 - 1, TOP, BK.z0 + 1, BK.x1 - 1, TOP, BK.z1 - 1, B.MARBLE); W.fill(175, TOP, BK.z0 + 1, 175, TOP, BK.z1 - 1, B.MARBLE);
  for (let a = 0; a < 16; a++) { const px = Math.round(175 + Math.cos(a / 16 * Math.PI * 2) * 2.5), pz = Math.round(89 + Math.sin(a / 16 * Math.PI * 2) * 2.5); W.set(px, TOP, pz, B.MARBLE); }
  for (const [px, d] of [[BK.x0 + 1, 1], [BK.x1 - 1, -1]]) { // 골대: 기둥 · 백보드 · 림(3m)
    W.fill(px, G, 89, px, G + 2, 89, B.LAMP_POLE); W.fill(px + d, G + 3, 88, px + d, G + 3, 90, B.WINDOW, d > 0 ? HALF_XN : HALF_XP); W.set(px + d * 2, G + 2, 89, B.IRON, ST);
    W.fill(px + d, TOP, 86, px + d * 5, TOP, 86, B.MARBLE); W.fill(px + d, TOP, 92, px + d * 5, TOP, 92, B.MARBLE); W.fill(px + d * 5, TOP, 86, px + d * 5, TOP, 92, B.MARBLE);
  }
  sign('농구장', 175.5, G + 1.4, BK.z0 - 1.06, 'south', 3, '#ff8a8d', '#2a0f14', 0.5); zone('농구장', 162, 78, 188, 100); place('basketball', '농구장', 175.5, 89.5);
  for (let x = BK.x0; x <= BK.x1; x += 11) W.fill(x, G, BK.z1 + 2, x, G + 2, BK.z1 + 2, B.IRON, HALF_ZP);
  W.fill(166, G, 105, 166, G + 2, 105, B.LAMP_POLE); W.fill(170, G, 105, 170, G + 2, 105, B.LAMP_POLE); W.fill(166, G + 3, 105, 170, G + 3, 105, B.IRON, SB); // 철봉
  W.fill(173, G, 104, 173, G, 106, B.IRON, HALF_XP); W.fill(176, G, 104, 176, G, 106, B.IRON, HALF_XN); // 평행봉
  W.fill(178, G, 104, 180, G, 104, B.BENCH, SB); W.set(181, G, 105, B.IRON, SB); // 윗몸일으키기 벤치
  sign('야외 체육관', 171.5, G + 3.6, 104.94, 'south', 3, '#ffffff', '#444444', 0.4); place('outgym', '야외 체육관', 172.5, 102.5);

  // ===== 본관 (2층 · 흰 외벽 + 초록 띠 + 회색 굽도리 · 평지붕) x 88..168, z 118..140 =====
  const MW = { x0: 88, x1: 168, z0: 118, z1: 140 };
  const FH = 4, YTOP = G + FH * 2 - 1; // 벽 꼭대기 y=15, 지붕 16, 난간 17
  clearAbove(MW.x0 - 3, 109, MW.x1 + 12, MW.z1 + 2, B.GRASS);
  flat(86, 109, 170, 117, B.PLAZA); // 앞마당
  flat(MW.x0 - 1, MW.z1 + 1, MW.x1 + 1, MW.z1 + 1, B.SIDEWALK); flat(MW.x0 - 1, MW.z0, MW.x0 - 1, MW.z1, B.SIDEWALK); flat(MW.x1 + 1, MW.z0, MW.x1 + 1, MW.z1, B.SIDEWALK);
  walls(MW.x0, MW.z0, MW.x1, MW.z1, G, YTOP, B.SCHOOL_WALL);
  flat(MW.x0, MW.z0, MW.x1, MW.z1, B.FLOOR_TILE);
  for (let f = 0; f < 2; f++) {
    const fy = G + f * FH;
    W.fill(MW.x0 + 1, fy + FH - 1, MW.z0 + 1, MW.x1 - 1, fy + FH - 1, MW.z1 - 1, B.FLOOR_TILE); // 천장 = 위층 바닥 (천장 높이 3m)
    walls(MW.x0, MW.z0, MW.x1, MW.z1, fy + FH - 1, fy + FH - 1, B.SCHOOL_BAND);
    const sillS = f ? { out: -1, id: B.SCHOOL_WALL } : null, sillN = f ? { out: 1, id: B.SCHOOL_WALL } : null;
    windowRow('x', MW.x0, MW.x1, MW.z0, fy + 1, fy + 2, 0.3, B.WINDOW, B.WINDOW_LIT, 3, sillS);
    windowRow('x', MW.x0, MW.x1, MW.z1, fy + 1, fy + 2, 0.3, B.WINDOW, B.WINDOW_LIT, 3, sillN);
    windowRow('z', MW.z0, MW.z1, MW.x0, fy + 1, fy + 2, 0.3); windowRow('z', MW.z0, MW.z1, MW.x1, fy + 1, fy + 2, 0.3);
  }
  // 회색 굽도리(바깥 둘레 반 두께) · 지붕 · 처마 턱 · 난간 · 모서리 기둥 · 앞면 벽 기둥 · 옥상 설비
  W.fill(MW.x0, G, MW.z0 - 1, MW.x1, G, MW.z0 - 1, B.WALL_GRAY, HALF_ZP); W.fill(MW.x0, G, MW.z1 + 1, MW.x1, G, MW.z1 + 1, B.WALL_GRAY, HALF_ZN);
  W.fill(MW.x0 - 1, G, MW.z0, MW.x0 - 1, G, MW.z1, B.WALL_GRAY, HALF_XP); W.fill(MW.x1 + 1, G, MW.z0, MW.x1 + 1, G, MW.z1, B.WALL_GRAY, HALF_XN);
  W.fill(MW.x0, YTOP + 1, MW.z0, MW.x1, YTOP + 1, MW.z1, B.ROOF_GRAY);
  walls(MW.x0 - 1, MW.z0 - 1, MW.x1 + 1, MW.z1 + 1, YTOP + 1, YTOP + 1, B.SCHOOL_WALL, ST);
  walls(MW.x0, MW.z0, MW.x1, MW.z1, YTOP + 2, YTOP + 2, B.SCHOOL_WALL); walls(MW.x0, MW.z0, MW.x1, MW.z1, YTOP + 3, YTOP + 3, B.SCHOOL_BAND, SB);
  for (const [x, z] of [[MW.x0 - 1, MW.z0 - 1], [MW.x1 + 1, MW.z0 - 1], [MW.x0 - 1, MW.z1 + 1], [MW.x1 + 1, MW.z1 + 1]]) W.fill(x, G, z, x, YTOP + 1, z, B.SCHOOL_WALL);
  for (const x of [97, 112, 145, 154]) W.fill(x, G, MW.z0 - 1, x, YTOP, MW.z0 - 1, B.SCHOOL_WALL, HALF_ZP);
  W.fill(100, YTOP + 2, 124, 102, YTOP + 4, 126, B.TANK); W.fill(150, YTOP + 2, 124, 153, YTOP + 3, 126, B.CONCRETE); W.fill(150, YTOP + 4, 124, 153, YTOP + 4, 126, B.IRON, SB);
  for (let x = 92; x <= 164; x += 8) W.set(x, YTOP + 2, 136, B.IRON, SB);

  // ---- 현관 포치: 2층이 앞으로 나와(x 118..138, z 112..117) 둥근 기둥 3개가 받침 · 돌 테라스 · 유리문 · 시계 · 현판 ----
  const PX0 = 118, PX1 = 138, PZ0 = 112, PZ1 = MW.z0 - 1;
  flat(PX0, PZ0, PX1, PZ1, B.MARBLE); flat(PX0 - 1, PZ0 - 2, PX1 + 1, PZ0 - 1, B.MARBLE);
  W.fill(PX0, G, PZ1, PX1, G, PZ1, B.AIR); // 굽도리 제거(현관 앞)
  W.fill(PX0, G + FH - 1, PZ0, PX1, G + FH - 1, PZ1, B.FLOOR_TILE); // 포치 천장 = 2층 앞방 바닥 (높이 3m)
  W.fill(PX0, G + FH, PZ0, PX1, YTOP, PZ0, B.SCHOOL_WALL); W.fill(PX0, G + FH, PZ0, PX0, YTOP, PZ1, B.SCHOOL_WALL); W.fill(PX1, G + FH, PZ0, PX1, YTOP, PZ1, B.SCHOOL_WALL);
  W.fill(PX0 + 1, G + FH, PZ0 + 1, PX1 - 1, G + FH + 2, PZ1, B.AIR); // 앞방 안 비우기(창틀 제거)
  W.fill(PX0, YTOP, PZ0, PX1, YTOP, PZ0, B.SCHOOL_BAND); W.fill(PX0, YTOP, PZ0, PX0, YTOP, PZ1, B.SCHOOL_BAND); W.fill(PX1, YTOP, PZ0, PX1, YTOP, PZ1, B.SCHOOL_BAND);
  W.fill(PX0 + 1, YTOP, PZ0 + 1, PX1 - 1, YTOP, PZ1, B.FLOOR_TILE); // 앞방 천장
  W.fill(PX0, YTOP + 1, PZ0, PX1, YTOP + 1, PZ1, B.ROOF_GRAY); W.fill(PX0 + 1, YTOP + 2, MW.z0, PX1 - 1, YTOP + 2, MW.z0, B.AIR); // 지붕 잇기
  W.fill(PX0, YTOP + 2, PZ0, PX1, YTOP + 2, PZ0, B.SCHOOL_WALL); W.fill(PX0, YTOP + 2, PZ0, PX0, YTOP + 2, PZ1, B.SCHOOL_WALL); W.fill(PX1, YTOP + 2, PZ0, PX1, YTOP + 2, PZ1, B.SCHOOL_WALL); W.fill(PX0, YTOP + 3, PZ0, PX1, YTOP + 3, PZ0, B.SCHOOL_BAND, SB);
  W.fill(PX0 - 1, YTOP + 1, PZ0 - 1, PX1 + 1, YTOP + 1, PZ0 - 1, B.SCHOOL_WALL, ST); W.fill(PX0 - 1, YTOP + 1, PZ0, PX0 - 1, YTOP + 1, PZ1, B.SCHOOL_WALL, ST); W.fill(PX1 + 1, YTOP + 1, PZ0, PX1 + 1, YTOP + 1, PZ1, B.SCHOOL_WALL, ST);
  windowRow('z', PZ0 - 1, MW.z0, PX0, G + FH + 1, G + FH + 2, 0.4); windowRow('z', PZ0 - 1, MW.z0, PX1, G + FH + 1, G + FH + 2, 0.4);
  W.fill(PX0 + 1, G + FH + 1, PZ0, PX0 + 1, G + FH + 2, PZ0, B.WINDOW); W.fill(PX1 - 1, G + FH + 1, PZ0, PX1 - 1, G + FH + 2, PZ0, B.WINDOW);
  W.fill(121, G + FH, PZ0 + 1, 121, G + FH + 2, PZ1, B.SCHOOL_WALL); W.fill(135, G + FH, PZ0 + 1, 135, G + FH + 2, PZ1, B.SCHOOL_WALL); // 앞방 양 옆 벽
  W.fill(123, G + FH, MW.z0, 133, G + FH + 2, MW.z0, B.AIR); // 교장실 ↔ 앞방 트기
  for (const cx of [122, 128, 134]) W.fill(cx, G, PZ0, cx, G + 2, PZ0, B.MARBLE); // 둥근 기둥(흰 대리석)
  for (let x = PX0 + 2; x < PX1; x += 4) W.set(x, G + 2, 115, B.LAMP_HEAD, ST);
  W.fill(122, G, MW.z0, 134, G + 1, MW.z0, B.SHOP_GLASS); W.fill(127, G, MW.z0, 128, G + 1, MW.z0, B.DOOR); W.fill(122, G + 2, MW.z0, 134, G + 2, MW.z0, B.SCHOOL_WALL);
  sign('마이폴학교', 128, G + 2.5, MW.z0 - 0.06, 'south', 12, '#f0c46a', '#13213d', 0.92, { text2: '20대에 독립하는 능력있는 전문가 양성', color2: '#cfd8ea' });
  sign('', 128, G + 6.0, PZ0 - 0.06, 'south', 1.9, '#1a1a1a', '#ffffff', 1.9, { clock: true });
  sign('마이폴학교', 123.2, G + 6.0, PZ0 - 0.06, 'south', 6.6, '#13213d', '#f7f3ea', 1.4, { text2: 'MY PAUL SCHOOL', color2: '#1b7a63' });
  sign('Step I – IV', 132.8, G + 6.0, PZ0 - 0.06, 'south', 6.6, '#1b7a63', '#f7f3ea', 1.4, { text2: '자기설계 · 메타인지 · 개별화 · 프로젝트', color2: '#3b4660' });
  sign('축 2022 최우수 대안교육기관 선정', 102, G + 5.9, MW.z0 - 0.08, 'south', 10, '#f0c46a', '#13213d', 1.5, { text2: '마이폴학교 · KCAE', color2: '#eef1f6' });
  sign('충청북도 대안교육기관 1호', 154, G + 5.9, MW.z0 - 0.08, 'south', 10, '#f4efe4', '#1b7a63', 1.5, { text2: '무학년 · 융합형 · 의사소통 중심', color2: '#d8efe6' });
  W.set(115, G, 113, B.MAILBOX); sign('감사편지 우체통', 115.5, G + 1.3, 112.94, 'south', 1.5, '#ffffff', '#c8302c', 0.3);
  for (const x of [90, 104, 146, 160]) flowerBed(x, 115, x + 4, 116);
  door(127, G, MW.z1, 2, 2); W.fill(MW.x0, G, 128, MW.x0, G + 1, 130, B.DOOR); // 뒷문 · 서쪽 출구
  place('main', '본관 현관', 128, 114.5);

  // ---- 방 배치: 남쪽 z119..126 · 복도 z128..130(주황 벽·테라초) · 북쪽 z132..139 ----
  const S0 = 119, S1 = 126, N0 = 132, N1 = 139, HW0 = 127, HW1 = 131;
  const roomsF0S = [[89, 98, '매점', 'store'], [100, 109, '데네브반', 'class'], [111, 120, '알리사반', 'class'], [122, 134, '현관 로비', 'lobby'], [136, 144, '행정실', 'admin'], [146, 151, '진학지도실', 'counsel'], [153, 167, '식당 · 카페 가이아', 'cafeteria']];
  const roomsF0N = [[89, 98, '신동호 연구실', 'lab'], [100, 109, '박남규 연구실', 'lab'], [111, 120, '강승환 연구실', 'lab'], [122, 134, '계단실', 'stairhall'], [136, 145, '교무실', 'office'], [147, 155, '상담실', 'counsel2'], [157, 161, '방송실', 'studio'], [163, 167, '창고', 'storage']];
  const roomsF1S = [[89, 98, '동아리실', 'club'], [100, 107, '박재현 연구실', 'lab'], [109, 120, '김광호 연구실', 'lab'], [122, 134, '교장실', 'principal'], [136, 151, '채플실 · 두란노 도서관', 'chapel'], [153, 159, '독서실', 'reading'], [161, 167, '작업실', 'workshop']];
  const roomsF1N = [[89, 98, '스피카반', 'class'], [100, 109, '카펠라반', 'class'], [111, 120, '메라크반', 'class'], [122, 134, '계단실', 'stairhall'], [136, 145, '폴스타반', 'class'], [147, 155, '육민정 연구실', 'lab'], [157, 167, '이상문 연구실', 'lab']];
  const teacherBoards = { '신동호 연구실': ['DLM', '수학 + 코딩 연구'], '박남규 연구실': ['Individual Research', '나만의 연구 주제 · 논문 초안'], '강승환 연구실': ['PROJECT', '창의융합탐구 · Step IV'], '박재현 연구실': ['수리통합논술', 'LST 문제 30개 풀기'], '김광호 연구실': ['융합연구', '세미나 · 발표 연습'], '육민정 연구실': ['English Immersion', 'translate → summarize → present'], '이상문 연구실': ['교무 안내', '학술제 준비 · 논문 마감 D-7'] };
  const classBoards = { '데네브반': ['데네브반 Deneb', '백조자리 으뜸별 · Step I'], '알리사반': ['알리사반 Alisa', '우리 반 약속: 먼저 인사하기'], '스피카반': ['스피카반 Spica', '처녀자리 으뜸별 · Step II'], '카펠라반': ['카펠라반 Capella', '마차부자리 으뜸별 · Step III'], '메라크반': ['메라크반 Merak', '큰곰자리 · 오늘 과제: 논술 1편'], '폴스타반': ['폴스타반 Polaris', '북극성 · Step IV 졸업 프로젝트'] };

  const furnish = (xa, xb, z0, z1, fy, key, name, north) => {
    const hallZ = north ? z0 : z1, winZ = north ? z1 : z0; // 복도 쪽 줄 · 창문 쪽 줄
    const hallHug = north ? HALF_ZN : HALF_ZP, winHug = north ? HALF_ZP : HALF_ZN; // 그 줄에서 벽에 붙는 반쪽
    const cy = fy + FH - 1; // 천장
    if (key === 'class') {
      W.fill(xa, fy + 1, z0 + 1, xa, fy + 2, z1 - 1, B.WHITEBOARD, HALF_XN);
      W.set(xa + 1, fy, z0 + 3, B.DESK, ST); W.set(xa + 1, fy + 1, z0 + 3, B.MONITOR, HALF_XN); W.set(xa + 1, fy, z0 + 4, B.BENCH, SB);
      groupTable(xa + 3, z0 + 1, fy); groupTable(xa + 3, z0 + 4, fy); groupTable(xa + 7, z0 + 1, fy); groupTable(xa + 7, z0 + 4, fy);
      W.fill(xa + 3, fy, hallZ, xb - 3, fy + 1, hallZ, B.LOCKER, hallHug);
      const cb = classBoards[name]; if (cb) sign(cb[0], (xa + xb) / 2 + 0.5, fy + 2.55, hallZ + (north ? 0.06 : 0.94), north ? 'north' : 'south', 5, '#f0c46a', '#13213d', 0.8, { text2: cb[1], color2: '#eef1f6' });
    } else if (key === 'lab') {
      W.fill(xa + 1, fy, z0 + 1, xa + 2, fy, z0 + 1, B.DESK, ST); W.set(xa + 1, fy + 1, z0 + 1, B.MONITOR, HALF_ZN); W.set(xa + 1, fy, z0 + 2, B.BENCH, SB); W.set(xa + 2, fy + 1, z0 + 1, B.BOOKSHELF, HALF_ZN);
      W.fill(xa, fy, z0 + 3, xa, fy + 1, z1 - 1, B.BOOKSHELF);
      W.fill(xa + 3, fy, z0 + 3, xa + 4, fy, z0 + 5, B.DESK, ST); for (let k = 3; k <= 5; k++) { W.set(xa + 2, fy, z0 + k, B.BENCH, SB); W.set(xa + 5, fy, z0 + k, B.BENCH, SB); }
      W.fill(xb, fy + 1, z0 + 1, xb, fy + 2, z1 - 1, B.WHITEBOARD, HALF_XP);
      W.fill(xa + 3, fy, hallZ, xb - 3, fy + 1, hallZ, B.BOOKSHELF);
      if (xb - xa >= 9) { W.set(xb - 1, fy, winZ, B.IRON, ST); W.set(xb - 2, fy, winZ, B.BENCH, SB); } // 프린터 · 소파
      const tb = teacherBoards[name]; if (tb) sign(tb[0], xa + 0.06, fy + 2.15, z0 + 1.5, 'east', 2.6, '#f0c46a', '#13213d', 0.8, { text2: tb[1], color2: '#eef1f6' });
    } else if (key === 'store') {
      W.fill(xa + 1, fy, z1 - 2, xa + 6, fy, z1 - 2, B.DESK, ST); W.fill(xa + 1, fy + 1, z1 - 2, xa + 6, fy + 1, z1 - 2, B.SHOP_GLASS, SB); W.set(xa + 3, fy + 1, z1 - 2, B.MONITOR, HALF_ZP);
      W.fill(xa + 1, fy, winZ, xb - 1, fy + 1, winZ, B.BOOKSHELF); W.fill(xa, fy, z0 + 1, xa, fy + 1, z0 + 3, B.IRON); W.set(xa, fy + 2, z0 + 2, B.MONITOR, HALF_XN);
      W.fill(xb, fy, z0 + 1, xb, fy + 1, z1 - 3, B.BOOKSHELF); W.fill(xa + 2, fy, z0 + 2, xa + 5, fy, z0 + 2, B.BOOKSHELF, SB);
      sign('매점', xa + 3.5, fy + 2.45, winZ + 1.06, 'north', 1.6, '#2a1e05', '#f2c14e', 0.42, { text2: '간식 · 음료 · 학용품', color2: '#4a3a10' });
    } else if (key === 'lobby') {
      flat(xa, z0, xb, z1, B.TERRAZZO);
      W.fill(xa, fy, z0 + 1, xa + 1, fy + 1, z0 + 3, B.LOCKER, HALF_XN); W.fill(xb - 1, fy, z0 + 1, xb, fy + 1, z0 + 3, B.LOCKER, HALF_XP);
      W.fill(xa + 1, fy, z0 + 5, xa + 2, fy, z0 + 5, B.BENCH, SB); W.fill(xb - 2, fy, z0 + 5, xb - 1, fy, z0 + 5, B.BENCH, SB); W.set(xa + 1, fy, z0 + 6, B.FLOWERS, SB); W.set(xb - 1, fy, z0 + 6, B.FLOWERS, SB);
      W.fill(xa, fy + 1, z0 + 5, xa, fy + 2, z1, B.WHITEBOARD, HALF_XN);
      sign('게시판', xa + 0.56, fy + 2.6, z0 + 6.5, 'east', 1.8, '#ffffff', '#163d2b', 0.38);
      sign('이번 주 안내', xa + 0.56, fy + 1.7, z0 + 6.5, 'east', 2.6, '#1a1a1a', '#fff7d6', 0.9, { text2: '수요일 채플 · 금요일 학술제 리허설 · 급식 설문', color2: '#444444' });
      sign('사유의 힘 · 감사의 마음', xb + 0.94, fy + 2.1, z0 + 5.5, 'west', 3.2, '#f0c46a', '#13213d', 0.95, { text2: '수학으로 꿈꾸는 미래', color2: '#eef1f6' });
      place('board', '게시판', xa + 1.5, z0 + 6.5, { floor: 0, y: fy });
    } else if (key === 'stairhall') {
      floorFill(xa, z0, xb, z1, fy, B.TERRAZZO);
      if (fy === G) {
        stairsX(133, 135, 123, 1, 8, G, B.FLOOR_TILE);
        W.fill(122, fy, z1, 125, fy + 1, z1, B.LOCKER, HALF_ZP); W.fill(130, fy, z1, 134, fy + 1, z1, B.LOCKER, HALF_ZP); W.fill(xa + 1, fy, z1 - 2, xa + 1, fy, z1 - 1, B.BENCH, SB); W.fill(xb - 1, fy, z1 - 2, xb - 1, fy, z1 - 1, B.BENCH, SB);
        sign('2층 ↑', xa + 0.06, fy + 2.4, 134.5, 'east', 2.2, '#f0c46a', '#13213d', 0.8, { text2: '교장실 · 채플실 · 스피카·카펠라·메라크·폴스타반', color2: '#eef1f6' });
        sign('안전 제일', xb + 0.94, fy + 2.4, 134.5, 'west', 2.2, '#ffffff', '#b3261e', 0.5, { text2: '계단에서 뛰지 않기', color2: '#ffe3e0' });
      } else {
        W.fill(125, fy - 1, 133, 128, fy - 1, 135, B.AIR); W.fill(129, fy - 1, 133, 129, fy - 1, 135, B.FLOOR_TILE, SB); // 계단 위 구멍 · 마지막 반 단
        W.fill(125, fy, 132, 129, fy, 132, B.IRON, HALF_ZP); W.fill(125, fy, 136, 129, fy, 136, B.IRON, HALF_ZN); W.fill(124, fy, 133, 124, fy, 135, B.IRON, HALF_XP);
        W.fill(xa, fy + 1, z0 + 1, xa, fy + 2, z0 + 3, B.WHITEBOARD, HALF_XN); sign('학술제 D-7', xa + 0.56, fy + 2.0, z0 + 2.5, 'east', 2.4, '#1a1a1a', '#fff7d6', 0.9, { text2: '발표 순서표 · 포스터 제출', color2: '#444444' });
        sign('1층 ↓', xb + 0.94, fy + 2.4, 134.5, 'west', 2.2, '#f0c46a', '#13213d', 0.8, { text2: '현관 · 교무실 · 식당 · 매점', color2: '#eef1f6' });
        W.fill(xa + 1, fy, z1 - 1, xa + 3, fy, z1 - 1, B.BENCH, SB); W.fill(xb - 3, fy, z1 - 1, xb - 1, fy, z1 - 1, B.BENCH, SB);
      }
    } else if (key === 'admin') {
      W.fill(xa + 1, fy, z1 - 1, xa + 5, fy, z1 - 1, B.DESK, ST); W.fill(xa + 1, fy + 1, z1 - 1, xa + 5, fy + 1, z1 - 1, B.SHOP_GLASS, SB);
      deskSet(xa + 2, z0 + 2, fy, -1); deskSet(xa + 4, z0 + 2, fy, -1); deskSet(xa + 6, z0 + 2, fy, -1);
      deskSet(xa + 2, z0 + 4, fy, 1); deskSet(xa + 4, z0 + 4, fy, 1);
      W.fill(xa, fy, z0 + 1, xa, fy + 1, z1 - 1, B.LOCKER, HALF_XN); W.set(xb, fy, z0 + 1, B.IRON, ST); W.fill(xb, fy, z0 + 3, xb, fy + 1, z0 + 4, B.BOOKSHELF);
      sign('행정실 · 민원 창구', xa + 3.5, fy + 2.4, z1 + 0.94, 'south', 2.6, '#ffffff', '#1d3f73', 0.42);
    } else if (key === 'counsel' || key === 'counsel2') {
      W.fill(xa + 2, fy, z0 + 3, xa + 3, fy, z0 + 4, B.DESK, ST); W.fill(xa + 1, fy, z0 + 3, xa + 1, fy, z0 + 4, B.BENCH, SB); W.fill(xa + 4, fy, z0 + 3, xa + 4, fy, z0 + 4, B.BENCH, SB);
      W.fill(xa + 1, fy, winZ, xa + 2, fy, winZ, B.DESK, ST); W.set(xa + 1, fy + 1, winZ, B.MONITOR, winHug); W.set(xa + 1, fy, winZ + (north ? -1 : 1), B.BENCH, SB);
      W.fill(xb, fy, z0 + 1, xb, fy + 1, z1 - 1, B.BOOKSHELF); W.fill(xa, fy + 1, z0 + 1, xa, fy + 2, z1 - 1, B.WHITEBOARD, HALF_XN);
      W.set(xb - 1, fy, winZ, B.FLOWERS, SB);
      sign(key === 'counsel' ? '진학 로드맵' : '마음 쉼터', xa + 0.56, fy + 2.0, z0 + 3.5, 'east', 2.4, '#1a1a1a', '#fff7d6', 0.9, { text2: key === 'counsel' ? '대학 · 유학 · 창업 · 취업' : '언제든 노크하세요', color2: '#444444' });
    } else if (key === 'office') {
      for (let dx = 2; dx <= 6; dx += 2) { deskSet(xa + dx, z0 + 2, fy, -1); deskSet(xa + dx, z0 + 5, fy, 1); }
      W.fill(xa, fy, z0 + 1, xa, fy + 1, z1 - 1, B.BOOKSHELF); W.fill(xb, fy, z0 + 1, xb, fy + 1, z0 + 2, B.IRON); W.set(xb, fy, z1 - 1, B.IRON, ST);
      W.fill(xa + 2, fy, z1, xa + 4, fy, z1, B.BENCH, SB); W.set(xa + 5, fy, z1, B.FLOWERS, SB);
      sign('교무실', xa + 1.06, fy + 2.5, z0 + 4.5, 'east', 1.6, '#ffffff', '#163d2b', 0.4);
      sign('이번 주 일정', xb + 0.94, fy + 2.0, z0 + 4.5, 'west', 3, '#1a1a1a', '#fff7d6', 0.95, { text2: '월 IR 발표 · 수 채플 · 금 학술제 리허설', color2: '#444444' });
    } else if (key === 'studio') {
      W.fill(xa + 1, fy, z0 + 1, xa + 3, fy, z0 + 1, B.DESK, ST); for (let x = xa + 1; x <= xa + 3; x++) { W.set(x, fy + 1, z0 + 1, B.MONITOR, HALF_ZN); W.set(x, fy, z0 + 2, B.BENCH, SB); }
      W.fill(xb, fy, z0 + 1, xb, fy + 2, z1 - 1, B.IRON, HALF_XP); W.fill(xa + 1, fy, z1 - 1, xa + 2, fy + 1, z1 - 1, B.BOOKSHELF);
      sign('ON AIR', xa + 0.06, fy + 2.3, z0 + 2.5, 'east', 1.6, '#ff4d4d', '#1a1a1a', 0.45);
    } else if (key === 'storage') {
      W.fill(xa + 1, fy, z0 + 1, xb - 1, fy + 1, z0 + 1, B.BOOKSHELF); W.fill(xa + 1, fy, z1 - 1, xb - 1, fy + 1, z1 - 1, B.BOOKSHELF); W.fill(xa + 1, fy, z0 + 3, xa + 2, fy, z0 + 4, B.PLANKS); W.set(xa + 3, fy, z0 + 3, B.PLANKS, SB);
    } else if (key === 'cafeteria') {
      flat(xa, z0, xb, z1, B.TILE_DARK);
      for (const x of [xa + 2, xa + 7]) for (const z of [z0 + 1, z0 + 4]) { W.fill(x, fy, z, x + 1, fy, z + 2, B.DESK, ST); for (let k = 0; k < 3; k++) { W.set(x - 1, fy, z + k, B.BENCH, SB); W.set(x + 2, fy, z + k, B.BENCH, SB); } }
      W.fill(xb - 3, fy, z0 + 1, xb - 3, fy, z1 - 1, B.DESK, ST); W.fill(xb - 3, fy + 1, z0 + 1, xb - 3, fy + 1, z1 - 1, B.SHOP_GLASS, SB); // 배식대
      W.fill(xb, fy, z0 + 1, xb, fy, z1 - 1, B.IRON); W.fill(xb - 1, fy, z0 + 1, xb - 1, fy, z0 + 2, B.IRON, ST); W.fill(xb, fy + 2, z0 + 2, xb, fy + 2, z1 - 2, B.IRON, HALF_XP); // 주방 · 후드
      W.fill(xa, fy, z0 + 1, xa, fy, z1 - 1, B.DESK, ST); W.set(xa, fy + 1, z0 + 2, B.IRON, HALF_XN); W.set(xa, fy + 1, z0 + 4, B.MONITOR, HALF_XN); // 카페 바
      W.fill(xa + 1, fy, hallZ, xa + 2, fy, hallZ, B.IRON, hallHug); // 정수기
      sign('카페 가이아', xa + 0.56, fy + 2.5, z0 + 3.5, 'east', 3, '#f5c542', '#163d2b', 0.6, { text2: '아메리카노 · 라떼 · 생과일 주스', color2: '#d8efe6' });
      sign('오늘의 급식', xb - 2.06, fy + 2.5, (z0 + z1) / 2 + 0.5, 'west', 3.6, '#ffffff', '#444444', 0.9, { text2: '김치볶음밥 · 계란국 · 돈까스 · 요구르트', color2: '#eeeeee' });
    } else if (key === 'principal') {
      floorFill(xa, z0, xb, z1, fy, B.CARPET);
      W.fill(xa + 5, fy, z0 + 2, xa + 7, fy, z0 + 2, B.DESK, ST); W.set(xa + 6, fy + 1, z0 + 2, B.MONITOR, HALF_ZN); W.set(xa + 6, fy, z0 + 3, B.BENCH, SB); W.set(xa + 5, fy + 1, z0 + 2, B.FLOWERS, SB);
      W.fill(xa + 3, fy, z0 + 5, xa + 4, fy, z0 + 5, B.DESK, ST); W.fill(xa + 2, fy, z0 + 4, xa + 5, fy, z0 + 4, B.BENCH, SB); W.fill(xa + 2, fy, z0 + 6, xa + 5, fy, z0 + 6, B.BENCH, SB);
      W.fill(xa, fy, z0 + 1, xa, fy + 1, z1 - 1, B.BOOKSHELF); W.fill(xb, fy, z0 + 1, xb, fy + 1, z1 - 1, B.BOOKSHELF); W.fill(xa + 8, fy, hallZ, xb - 3, fy, hallZ, B.LOCKER, hallHug);
      sign('2022 최우수 대안교육기관', xa + 1.06, fy + 2.5, z0 + 3.5, 'east', 2.2, '#f0c46a', '#2a2416', 0.6, { text2: 'KCAE 선정', color2: '#efe6cf' });
      sign('교장실', xb - 0.06, fy + 2.5, z0 + 3.5, 'west', 1.6, '#f0c46a', '#13213d', 0.5);
      // 포치 위 앞방(회의 공간)
      W.fill(124, fy - 1, 113, 132, fy - 1, 117, B.CARPET); W.fill(126, fy, 114, 130, fy, 115, B.DESK, ST); W.fill(126, fy, 113, 130, fy, 113, B.BENCH, SB); W.fill(126, fy, 116, 130, fy, 116, B.BENCH, SB);
      W.set(122, fy + 1, 114, B.WHITEBOARD, HALF_XN); W.set(122, fy + 1, 115, B.WHITEBOARD, HALF_XN); for (let x = 124; x <= 132; x += 4) W.set(x, fy + 2, 115, B.LAMP_HEAD, ST);
    } else if (key === 'chapel') {
      floorFill(xa, z0, xb, z1, fy, B.WOOD_FLOOR); W.fill(xa + 1, fy - 1, z0 + 3, xb - 4, fy - 1, z0 + 3, B.CARPET);
      W.fill(xa, fy, z0 + 1, xa, fy + 1, z1 - 1, B.BOOKSHELF); W.fill(xa + 3, fy, hallZ, xb - 3, fy + 1, hallZ, B.BOOKSHELF); W.fill(xa + 1, fy, winZ, xa + 5, fy + 1, winZ, B.BOOKSHELF);
      for (let x = xa + 3; x <= xb - 6; x += 2) { W.fill(x, fy, z0 + 1, x, fy, z0 + 2, B.BENCH, SB); W.fill(x, fy, z0 + 4, x, fy, z0 + 5, B.BENCH, SB); }
      W.fill(xb - 3, fy, z0 + 1, xb, fy, z1 - 1, B.WOOD_DARK, SB); W.set(xb - 2, fy + 1, z0 + 3, B.WOOD_DARK, HALF_XP); W.set(xb, fy + 1, z0 + 3, B.CROSS, HALF_XP);
      W.fill(xb - 2, fy, z1 - 1, xb - 1, fy, z1 - 1, B.PIANO); W.set(xb - 1, fy + 1, z0 + 1, B.FLOWERS, SB);
      W.fill(xa + 1, fy, z0 + 2, xa + 2, fy, z0 + 2, B.DESK, ST); W.set(xa + 1, fy, z0 + 1, B.BENCH, SB); W.set(xa + 2, fy, z0 + 1, B.BENCH, SB);
      sign('두란노 도서관', xa + 1.06, fy + 2.5, z0 + 3.5, 'east', 2.6, '#f0c46a', '#13213d', 0.6, { text2: '채플실 · 매주 수요일 예배', color2: '#eef1f6' });
    } else if (key === 'reading') {
      for (let x = xa + 1; x <= xb - 1; x += 2) { W.fill(x, fy, z0 + 1, x, fy, z1 - 1, B.DESK, ST); for (let z = z0 + 1; z <= z1 - 1; z++) W.set(x, fy + 1, z, B.WHITEBOARD, HALF_XN); if (x + 1 <= xb - 1) for (let z = z0 + 1; z <= z1 - 1; z += 2) W.set(x + 1, fy, z, B.BENCH, SB); }
      sign('독서실 · 정숙', xa + 0.06, fy + 2.5, z0 + 3.5, 'east', 1.8, '#ffffff', '#444444', 0.4);
    } else if (key === 'workshop') {
      W.fill(xa + 1, fy, z0 + 2, xb - 1, fy, z0 + 2, B.DESK, ST); W.set(xa + 2, fy + 1, z0 + 2, B.IRON, ST); W.set(xa + 4, fy + 1, z0 + 2, B.IRON, ST); W.set(xa + 3, fy + 1, z0 + 2, B.MONITOR, HALF_ZN);
      W.fill(xa + 1, fy, hallZ, xb - 3, fy + 1, hallZ, B.BOOKSHELF); W.fill(xa + 1, fy, z0 + 5, xa + 4, fy, z0 + 5, B.DESK, ST); W.set(xb - 1, fy, z0 + 5, B.IRON);
      sign('3D 프린터 예약제', xa + 0.06, fy + 2.5, z0 + 3.5, 'east', 2.4, '#ffffff', '#2b2b2b', 0.5, { text2: '출력 전 선생님 확인', color2: '#dddddd' });
    } else if (key === 'club') {
      groupTable(xa + 3, z0 + 1, fy); groupTable(xa + 3, z0 + 4, fy); W.fill(xa + 7, fy, z0 + 1, xa + 8, fy, z0 + 1, B.PIANO); W.fill(xa + 7, fy, z0 + 4, xa + 8, fy, z0 + 5, B.CARPET, SB);
      W.fill(xa + 3, fy, hallZ, xb - 3, fy + 1, hallZ, B.BOOKSHELF); W.fill(xb, fy + 1, z0 + 1, xb, fy + 2, z1 - 1, B.WHITEBOARD, HALF_XP);
      sign('동아리실', xb + 0.44, fy + 2.0, z0 + 3.5, 'west', 2.8, '#1a1a1a', '#fff7d6', 0.9, { text2: '밴드 · 보드게임 · 영상 · 코딩', color2: '#444444' });
    }
    ceilLights(xa - 1, z0 - 1, xb + 1, z1 + 1, cy);
  };

  for (let f = 0; f < 2; f++) {
    const fy = G + f * FH, cy = fy + FH - 1;
    const south = f ? roomsF1S : roomsF0S, north = f ? roomsF1N : roomsF0N;
    // 복도: 주황 벽 · 테라초 바닥 · 나무 굽도리 · 천장 등 · 화분
    W.fill(MW.x0 + 1, fy, HW0, MW.x1 - 1, fy + FH - 2, HW0, B.ORANGE_WALL); W.fill(MW.x0 + 1, fy, HW1, MW.x1 - 1, fy + FH - 2, HW1, B.ORANGE_WALL);
    floorFill(MW.x0 + 1, HW0 + 1, MW.x1 - 1, HW1 - 1, fy, B.TERRAZZO);
    W.fill(MW.x0 + 1, fy, HW0 + 1, MW.x1 - 1, fy, HW0 + 1, B.WOOD_DARK, HALF_ZN); W.fill(MW.x0 + 1, fy, HW1 - 1, MW.x1 - 1, fy, HW1 - 1, B.WOOD_DARK, HALF_ZP);
    for (let x = MW.x0 + 3; x < MW.x1 - 2; x += 4) W.set(x, cy - 1, 129, B.LAMP_HEAD, ST);
    for (let x = MW.x0 + 6; x < MW.x1 - 4; x += 20) W.set(x, fy, 130, B.FLOWERS, SB);
    const doRooms = (rooms, isNorth) => rooms.forEach(([xa, xb, name, key], i) => {
      const z0 = isNorth ? N0 : S0, z1 = isNorth ? N1 : S1, hallZ = isNorth ? HW1 : HW0, hallRow = isNorth ? z0 : z1;
      if (i > 0) W.fill(xa - 1, fy, z0, xa - 1, fy + FH - 2, z1, B.SCHOOL_WALL);
      wainscot(xa, z0, xb, z1, fy, key === 'lab' || key === 'cafeteria' || key === 'class' || key === 'club' ? B.PLANKS : B.WOOD_DARK);
      if (key === 'lobby' || key === 'stairhall') {
        W.fill(xa, fy, hallZ, xb, fy + 2, hallZ, B.AIR); W.fill(xa, fy, isNorth ? HW1 - 1 : HW0 + 1, xb, fy, isNorth ? HW1 - 1 : HW0 + 1, B.AIR);
        W.fill(xa, fy, hallRow, xb, fy, hallRow, B.AIR); if (key === 'lobby') W.fill(xa, fy, z0, xb, fy, z0, B.AIR);
        floorFill(xa, hallZ, xb, hallZ, fy, B.TERRAZZO);
      } else {
        W.fill(xb - 2, fy, hallZ, xb - 2, fy + 1, hallZ, B.DOOR); W.set(xb - 2, fy, hallRow, B.AIR); W.fill(xa + 1, fy + 1, hallZ, xa + 2, fy + 2, hallZ, B.WINDOW);
        sign(name, xb - 1.5, fy + 2.6, hallZ + (isNorth ? -0.06 : 1.06), isNorth ? 'south' : 'north', 2.8, '#ffffff', '#163d2b', 0.5);
      }
      place(key, name, (xa + xb) / 2 + 0.5, (z0 + z1) / 2 + 0.5, { floor: f, y: fy });
      furnish(xa, xb, z0, z1, fy, key, name, isNorth);
    });
    doRooms(south, false); doRooms(north, true);
  }

  // ---- 화장실 별채(동쪽 끝, 복도와 이어짐) 남·여 ----
  const AX = { x0: 169, x1: 178, z0: 122, z1: 136 };
  clearAbove(AX.x0, AX.z0 - 1, AX.x1 + 1, AX.z1 + 1, B.GRASS);
  W.fill(MW.x1, G, AX.z0 + 1, MW.x1, G + 2, AX.z1 - 1, B.SCHOOL_WALL);
  walls(AX.x0, AX.z0, AX.x1, AX.z1, G, G + 2, B.SCHOOL_WALL); flat(AX.x0, AX.z0, AX.x1, AX.z1, B.FLOOR_TILE);
  W.fill(AX.x0, G + 3, AX.z0, AX.x1, G + 3, AX.z1, B.ROOF_GRAY); walls(AX.x0, AX.z0, AX.x1, AX.z1, G + 4, G + 4, B.SCHOOL_WALL, SB);
  W.fill(AX.x0, G, AX.z1 + 1, AX.x1, G, AX.z1 + 1, B.WALL_GRAY, HALF_ZN); W.fill(AX.x0, G, AX.z0 - 1, AX.x1, G, AX.z0 - 1, B.WALL_GRAY, HALF_ZP); W.fill(AX.x1 + 1, G, AX.z0, AX.x1 + 1, G, AX.z1, B.WALL_GRAY, HALF_XN);
  W.fill(MW.x1, G, 128, MW.x1, G + 2, 130, B.AIR); W.fill(AX.x0, G, 128, AX.x0, G + 2, 130, B.AIR); // 복도 → 별채
  W.fill(AX.x0 + 1, G, 127, AX.x1 - 1, G + 2, 127, B.ORANGE_WALL); W.fill(AX.x0 + 1, G, 131, AX.x1 - 1, G + 2, 131, B.ORANGE_WALL); flat(AX.x0 + 1, 128, AX.x1 - 1, 130, B.TERRAZZO);
  W.fill(171, G, 127, 171, G + 1, 127, B.DOOR); W.fill(171, G, 131, 171, G + 1, 131, B.DOOR); W.fill(AX.x1, G, 128, AX.x1, G + 1, 130, B.DOOR);
  for (const [z0, z1, hugWall, hugMirror] of [[123, 126, HALF_ZN, HALF_ZP], [132, 135, HALF_ZP, HALF_ZN]]) {
    const back = hugWall === HALF_ZN ? z0 : z1, front = hugWall === HALF_ZN ? z1 : z0;
    for (let x = 170; x <= 176; x += 2) { W.set(x, G, back, B.MARBLE, SB); W.set(x + 1, G, back, B.WALL_GRAY, HALF_XN); W.set(x + 1, G + 1, back, B.WALL_GRAY, HALF_XN); }
    W.fill(170, G, front, 173, G, front, B.MARBLE, ST); W.fill(170, G + 1, front, 173, G + 1, front, B.WHITEBOARD, hugMirror); W.set(175, G + 1, front, B.IRON, hugMirror);
    W.set(AX.x1, G + 1, back === z0 ? z0 + 1 : z1 - 1, B.WINDOW);
    ceilLights(169, z0 - 1, 178, z1 + 1, G + 3, 2);
  }
  ceilLights(169, 127, 178, 131, G + 3, 2);
  sign('남자 화장실', 173.5, G + 2.5, 128.06, 'north', 2.2, '#ffffff', '#2456c8', 0.45); sign('여자 화장실', 173.5, G + 2.5, 130.94, 'south', 2.2, '#ffffff', '#b3261e', 0.45);
  flat(AX.x1 + 1, 128, AX.x1 + 3, 130, B.SIDEWALK);
  zone('본관', 86, 110, 180, 141);

  // ===== 조회대 · 국기게양대 (운동장 북쪽 가장자리, 본관 앞마당) =====
  W.fill(100, G, 109, 111, G, 111, B.CONCRETE); W.fill(99, G, 109, 99, G, 111, B.CONCRETE, SB); W.fill(112, G, 109, 112, G, 111, B.CONCRETE, SB);
  W.fill(104, G + 1, 109, 106, G + 1, 109, B.WOOD_DARK, HALF_ZN); W.set(105, G + 2, 109, B.WOOD_DARK, ST);
  for (const px of [102, 105, 108]) { W.fill(px - 1, G, 112, px + 1, G, 114, B.MARBLE, SB); W.fill(px, G + 1, 113, px, G + 10, 113, B.LAMP_POLE); W.set(px + 1, G + 10, 113, B.FLAG); }
  sign('조회대', 105.5, G + 1.5, 108.94, 'south', 1.8, '#ffffff', '#444444', 0.4); place('podium', '조회대', 105.5, 107.5);

  // ===== 생활관(기숙사): 2층 + 지하 · 남학생(북)/여학생(남) x 66..82, z 118..163 =====
  const D = { x0: 66, z0: 118, x1: 82, z1: 163 };
  clearAbove(D.x0 - 2, D.z0 - 3, D.x1 + 4, D.z1 + 3, B.GRASS);
  walls(D.x0, D.z0, D.x1, D.z1, G, G + 7, B.DORM_WALL); flat(D.x0, D.z0, D.x1, D.z1, B.FLOOR_TILE);
  walls(D.x0, D.z0, D.x1, D.z1, G + 3, G + 3, B.SCHOOL_BAND); walls(D.x0, D.z0, D.x1, D.z1, G + 7, G + 7, B.SCHOOL_BAND);
  for (const fy of [G, G + 4]) {
    windowRow('z', D.z0, D.z1, D.x0, fy + 1, fy + 2, 0.5, B.APT_WINDOW, B.APT_WINDOW_LIT); windowRow('z', D.z0, D.z1, D.x1, fy + 1, fy + 2, 0.5, B.APT_WINDOW, B.APT_WINDOW_LIT);
    windowRow('x', D.x0, D.x1, D.z0, fy + 1, fy + 2, 0.5, B.APT_WINDOW, B.APT_WINDOW_LIT); windowRow('x', D.x0, D.x1, D.z1, fy + 1, fy + 2, 0.5, B.APT_WINDOW, B.APT_WINDOW_LIT);
    W.fill(D.x0 + 1, fy + 3, D.z0 + 1, D.x1 - 1, fy + 3, D.z1 - 1, B.FLOOR_TILE); // 천장 / 위층 바닥
  }
  W.fill(D.x0, G + 8, D.z0, D.x1, G + 8, D.z1, B.ROOF_GRAY); walls(D.x0 - 1, D.z0 - 1, D.x1 + 1, D.z1 + 1, G + 8, G + 8, B.DORM_WALL, ST); walls(D.x0, D.z0, D.x1, D.z1, G + 9, G + 9, B.DORM_WALL); walls(D.x0, D.z0, D.x1, D.z1, G + 10, G + 10, B.SCHOOL_BAND, SB);
  W.fill(D.x0, G, D.z0 - 1, D.x1, G, D.z0 - 1, B.WALL_GRAY, HALF_ZP); W.fill(D.x0, G, D.z1 + 1, D.x1, G, D.z1 + 1, B.WALL_GRAY, HALF_ZN); W.fill(D.x0 - 1, G, D.z0, D.x0 - 1, G, D.z1, B.WALL_GRAY, HALF_XP); W.fill(D.x1 + 1, G, D.z0, D.x1 + 1, G, D.z1, B.WALL_GRAY, HALF_XN);
  W.fill(70, G + 9, 125, 72, G + 11, 127, B.TANK); W.fill(76, G + 9, 150, 78, G + 9, 152, B.CONCRETE); W.fill(76, G + 10, 150, 78, G + 10, 152, B.IRON, SB);
  // 현관(동쪽 가운데 z 138..140) + 캐노피 + 앞마당 길
  W.fill(D.x1, G, 138, D.x1, G + 1, 140, B.DOOR); W.fill(D.x1 + 1, G + 3, 136, D.x1 + 3, G + 3, 142, B.CONCRETE, SB); W.fill(D.x1 + 3, G, 136, D.x1 + 3, G + 2, 136, B.MARBLE); W.fill(D.x1 + 3, G, 142, D.x1 + 3, G + 2, 142, B.MARBLE);
  flat(D.x1 + 1, 135, D.x1 + 5, 143, B.PLAZA); flat(83, 128, 87, 140, B.SIDEWALK); flat(86, 118, 87, 141, B.SIDEWALK);
  sign('생활관', D.x1 + 1.06, G + 4.5, 139.5, 'east', 2.8, '#ffffff', '#1b7a63', 0.8, { text2: 'MY PAUL DORMITORY', color2: '#d8efe6' });
  sign('남학생 생활관', D.x1 + 1.06, G + 4.5, 152.5, 'east', 2.8, '#ffffff', '#1d3f73', 0.5); sign('여학생 생활관', D.x1 + 1.06, G + 4.5, 126.5, 'east', 2.8, '#ffffff', '#7a2350', 0.5);
  // 안: 가운데 복도 x 73..75 · 방 x 67..71 / 77..81 (5칸 베이) · 가운데 베이 z 137..144 = 로비·계단·사감실
  const bays = [119, 125, 131, 146, 152, 158], CB0 = 137, CB1 = 144;
  for (let f = 0; f < 2; f++) {
    const fy = G + f * 4, cy = fy + 3;
    W.fill(72, fy, D.z0 + 1, 72, fy + 2, D.z1 - 1, B.DORM_WALL); W.fill(76, fy, D.z0 + 1, 76, fy + 2, D.z1 - 1, B.DORM_WALL);
    floorFill(73, D.z0 + 1, 75, D.z1 - 1, fy, B.TILE_DARK);
    W.fill(76, fy, CB0, 76, fy + 2, CB1, B.AIR); // 로비(복도 + 동쪽 가운데 베이)
    for (const z of [CB0 - 1, CB1 + 1]) { W.fill(67, fy, z, 71, fy + 2, z, B.DORM_WALL); W.fill(77, fy, z, 81, fy + 2, z, B.DORM_WALL); }
    for (let z = D.z0 + 3; z < D.z1 - 1; z += 4) W.set(74, cy - 1, z, B.LAMP_HEAD, ST);
    let bn = 1, gn = 1;
    for (const z of bays) {
      for (const [xa, xb, wx] of [[67, 71, 72], [77, 81, 76]]) {
        const west = xa === 67;
        W.fill(xa, fy, z + 5, xb, fy + 2, z + 5, B.DORM_WALL);
        W.fill(xa + 1, fy, z + 1, xa + 2, fy, z + 1, B.BED, SB); W.fill(xa + 1, fy, z + 3, xa + 2, fy, z + 3, B.BED, SB);
        const dx = west ? xa + 4 : xa; W.set(dx, fy, z + 1, B.DESK, ST); W.set(dx, fy, z + 3, B.DESK, ST); W.set(dx, fy + 1, z + 1, B.MONITOR, west ? HALF_XP : HALF_XN);
        W.set(west ? xa + 3 : xa + 1, fy, z + 1, B.BENCH, SB); W.set(west ? xa + 3 : xa + 1, fy, z + 3, B.BENCH, SB);
        W.fill(west ? xa : xb, fy, z + 4, west ? xa : xb, fy + 1, z + 4, B.LOCKER, west ? HALF_XN : HALF_XP); W.set(west ? xa + 1 : xb - 1, fy, z + 4, B.BOOKSHELF);
        W.fill(wx, fy, z + 2, wx, fy + 1, z + 2, B.DOOR);
        const boy = z >= 146, no = (f + 1) * 100 + (boy ? bn++ : 10 + gn++);
        sign(`${no}호 · ${boy ? '남' : '여'}`, wx === 72 ? 73.06 : 75.94, fy + 2.5, z + 2.5, wx === 72 ? 'east' : 'west', 1.8, '#ffffff', boy ? '#1d3f73' : '#7a2350', 0.42);
        if (f === 0 && z === 146 && west) place('myroom', `내 방 (${no}호)`, xa + 2.5, z + 2.5, { floor: 0, y: fy });
        ceilLights(xa - 1, z, xb + 1, z + 5, cy, 2);
      }
    }
    // 가운데 서쪽 베이: 1층 사감실 · 2층 독서실
    if (f === 0) {
      W.fill(68, fy, CB0 + 1, 70, fy, CB0 + 1, B.DESK, ST); W.set(69, fy + 1, CB0 + 1, B.MONITOR, HALF_ZP); W.set(69, fy, CB0 + 2, B.BENCH, SB); W.fill(67, fy, CB0 + 4, 67, fy + 1, CB1 - 1, B.BOOKSHELF); W.set(70, fy, CB1 - 1, B.BENCH, SB); W.set(71, fy, CB1 - 1, B.BENCH, SB);
      W.fill(72, fy, 140, 72, fy + 1, 140, B.DOOR); W.fill(72, fy + 1, 138, 72, fy + 1, 139, B.SHOP_GLASS);
      sign('사감실 · 생활관장실', 73.06, fy + 2.5, 139.5, 'east', 2.8, '#ffffff', '#5b3f1d', 0.45); place('dormoffice', '사감실', 69.5, 140.5, { floor: 0, y: fy });
    } else {
      for (let x = 68; x <= 70; x += 2) { W.fill(x, fy, CB0 + 1, x, fy, CB1 - 1, B.DESK, ST); for (let z = CB0 + 1; z <= CB1 - 1; z++) W.set(x, fy + 1, z, B.WHITEBOARD, HALF_XN); for (let z = CB0 + 2; z <= CB1 - 1; z += 2) W.set(x + 1, fy, z, B.BENCH, SB); }
      W.fill(72, fy, 140, 72, fy + 1, 140, B.DOOR); sign('독서실 · 정숙', 73.06, fy + 2.5, 139.5, 'east', 2.4, '#ffffff', '#5b3f1d', 0.45); place('dormstudy', '생활관 독서실', 69.5, 140.5, { floor: 1, y: fy });
    }
    // 로비(1층) / 휴게실(2층) — 동쪽 가운데 베이 + 복도
    if (f === 0) {
      W.fill(81, fy, 141, 81, fy + 1, 142, B.LOCKER, HALF_XP); W.fill(77, fy, 140, 79, fy, 140, B.BENCH, SB); W.set(77, fy, 142, B.FLOWERS, SB);
      sign('생활관 안내', 78.5, fy + 2.4, 137.06, 'north', 3.2, '#1a1a1a', '#fff7d6', 0.95, { text2: '22:00 점호 · 06:50 기상 · 세탁실은 지하', color2: '#444444' });
      place('dorm', '생활관 로비', 79.5, 141.5, { floor: 0, y: fy });
    } else {
      W.fill(77, fy, 138, 80, fy, 138, B.BENCH, SB); W.fill(77, fy, 140, 80, fy, 140, B.BENCH, SB); W.fill(78, fy, 139, 79, fy, 139, B.DESK, ST); W.set(81, fy + 1, 139, B.MONITOR, HALF_XP); W.set(81, fy, 141, B.IRON, ST);
      sign('휴게실', 78.5, fy + 2.4, 144.94, 'south', 2.0, '#ffffff', '#5b3f1d', 0.45); place('lounge', '생활관 휴게실', 78.5, 139.5, { floor: 1, y: fy });
    }
    ceilLights(76, CB0 - 1, 82, CB1 + 1, cy, 2);
  }
  // 계단(로비): 2층 계단(z 143..144, 동→서, 복도에 닿음) · 지하 계단(z 137..138, 서→동) — 바닥 다 깐 뒤에
  W.fill(76, G + 3, 143, 79, G + 3, 144, B.AIR); stairsX(143, 144, 81, -1, 8, G, B.FLOOR_TILE);
  W.fill(75, G + 4, 142, 79, G + 4, 142, B.IRON, HALF_ZP); W.fill(80, G + 4, 143, 80, G + 4, 144, B.IRON, HALF_XN);
  // 지하: 세탁실(남쪽) · 체력단련실(북쪽) · 가운데 홀 — 바닥 y=4, 천장 y=7
  W.fill(D.x0, 2, D.z0, D.x1, 6, D.z1, B.CONCRETE); W.fill(D.x0 + 1, 4, D.z0 + 1, D.x1 - 1, 6, D.z1 - 1, B.AIR); W.fill(D.x0 + 1, 3, D.z0 + 1, D.x1 - 1, 3, D.z1 - 1, B.TILE_DARK);
  W.fill(76, TOP, 137, 79, TOP, 138, B.AIR); stairsX(137, 138, 74, 1, 8, 4, B.CONCRETE); W.fill(75, G, 139, 80, G, 139, B.IRON, HALF_ZN);
  W.fill(D.x0 + 1, 4, CB0 - 1, D.x1 - 1, 6, CB0 - 1, B.CONCRETE); W.fill(D.x0 + 1, 4, CB1 + 1, D.x1 - 1, 6, CB1 + 1, B.CONCRETE); W.fill(74, 4, CB0 - 1, 75, 5, CB0 - 1, B.DOOR); W.fill(74, 4, CB1 + 1, 75, 5, CB1 + 1, B.DOOR);
  for (let z = 120; z <= 134; z += 2) { W.set(D.x0 + 1, 4, z, B.IRON); W.set(D.x0 + 2, 4, z, B.SHOP_GLASS, HALF_XN); W.set(D.x1 - 1, 4, z, B.IRON); W.set(D.x1 - 2, 4, z, B.SHOP_GLASS, HALF_XP); } // 세탁기 줄
  W.fill(72, 4, 122, 76, 4, 122, B.DESK, ST); W.fill(72, 4, 128, 76, 4, 128, B.DESK, ST); W.fill(70, 4, 133, 78, 4, 133, B.IRON, HALF_ZN); // 개는 탁자 · 건조대
  for (let z = 148; z <= 160; z += 4) { W.fill(68, 4, z, 69, 4, z, B.BENCH, SB); W.set(70, 4, z, B.IRON, SB); W.fill(79, 4, z, 79, 5, z, B.LAMP_POLE); W.set(79, 6, z, B.IRON, SB); W.set(80, 4, z, B.IRON, ST); } // 벤치 · 샌드백 · 러닝머신
  W.fill(68, 4, 162, 80, 4, 162, B.IRON, HALF_ZP); W.fill(74, 5, 162, 76, 5, 162, B.WHITEBOARD, HALF_ZP); W.fill(72, 4, 147, 77, 4, 147, B.CARPET, SB);
  W.fill(67, 4, 139, 67, 5, 140, B.IRON); W.set(69, 4, 141, B.IRON, SB); // 자판기 · 의자
  sign('세탁실', 74.5, 6.5, 137.06, 'north', 2.6, '#ffffff', '#2456c8', 0.5, { text2: '세탁 40분 · 건조 60분', color2: '#dbe6ff' }); sign('체력단련실', 74.5, 6.5, 144.94, 'south', 3, '#ffffff', '#b3261e', 0.5, { text2: '운동 후 정리 · 땀 닦기', color2: '#ffe3e0' });
  ceilLights(D.x0, D.z0, D.x1, D.z1, 7, 3);
  place('laundry', '세탁실', 74.5, 127.5, { y: 4, floor: -1 }); place('fitness', '체력단련실', 74.5, 154.5, { y: 4, floor: -1 });
  zone('생활관', 64, 116, 88, 166);
  for (let z = 121; z <= 158; z += 12) flowerBed(D.x1 + 2, z, D.x1 + 2, z + 2);
  for (const z of [124, 154]) lamp(D.x1 + 4, z, 4, true);

  // ===== 별관 연구실(빨간 지붕) · 컨테이너 보건실 · 노래방 · 창고 · 사택 · 텃밭 · 정자 =====
  building(176, 64, 188, 74, [4], B.BRICK, { roof: 'pitched', roofId: B.ROOF_RED, litP: 0.6 }); door(176, G, 68, 2, 2, 'z');
  W.fill(178, G, 72, 186, G, 72, B.DESK, ST); for (let x = 178; x <= 186; x += 2) { W.set(x, G + 1, 72, B.MONITOR, HALF_ZP); W.set(x, G, 71, B.BENCH, SB); } W.fill(177, G, 65, 187, G + 1, 65, B.BOOKSHELF); W.fill(180, G, 68, 183, G, 69, B.DESK, ST);
  flat(173, 68, 175, 69, B.SIDEWALK);
  sign('현지우 연구실', 175.94, G + 3.0, 69, 'west', 4, '#ffffff', '#2b2b2b', 0.6, { text2: '별관 · 컴퓨터 연구', color2: '#dddddd' }); place('lab2', '별관 연구실', 174.5, 69);
  for (const [cz, name, key] of [[106, '보건실 (남)', 'nurse'], [110, '보건실 (여)', 'nurse2']]) {
    clearAbove(183, cz - 1, 191, cz + 3, B.GRASS); flat(184, cz, 190, cz + 2, B.CONCRETE); walls(184, cz, 190, cz + 2, G, G + 2, B.SCHOOL_WALL); W.fill(184, G + 2, cz, 190, G + 2, cz + 2, B.AWNING_BLUE); W.fill(184, G + 3, cz, 190, G + 3, cz + 2, B.IRON, SB);
    W.fill(186, G + 1, cz, 187, G + 1, cz, B.WINDOW); door(189, G, cz, 1, 2); W.fill(185, G, cz + 1, 186, G, cz + 1, B.BED, SB); W.set(188, G, cz + 1, B.IRON, SB); W.set(185, G + 1, cz + 2, B.BOOKSHELF, HALF_ZP);
    sign(name, 187.5, G + 2.5, cz - 0.06, 'south', 2.6, '#ffffff', '#1e7a4a', 0.5); place(key, name, 189.5, cz - 1.5);
  }
  clearAbove(183, 114, 191, 120, B.GRASS); walls(184, 115, 190, 119, G, G + 2, B.WOOD_DARK); W.fill(184, G + 3, 115, 190, G + 3, 119, B.ROOF_RED, SB); door(187, G, 115, 1, 2); W.fill(185, G, 118, 189, G, 118, B.BENCH, SB); W.set(187, G + 1, 118, B.MONITOR, HALF_ZP); W.set(185, G, 116, B.DESK, ST); W.set(189, G + 1, 116, B.STAINED);
  sign('노래방', 187.5, G + 2.5, 114.94, 'south', 2.4, '#ffd400', '#5a1e80', 0.5); place('karaoke', '노래방', 187.5, 113.5);
  clearAbove(183, 124, 191, 130, B.GRASS); walls(184, 125, 190, 129, G, G + 2, B.PLANKS); W.fill(183, G + 3, 124, 191, G + 3, 130, B.ROOF_FLAT, SB); door(187, G, 125, 2, 2); W.fill(185, G, 128, 189, G + 1, 128, B.BOOKSHELF); W.set(185, G, 126, B.PLANKS, SB);
  sign('창고', 188, G + 2.5, 124.94, 'south', 1.6, '#ffffff', '#444444', 0.4);
  building(66, 172, 76, 180, [3, 3], B.WALL_BEIGE, { roof: 'pitched', roofId: B.ROOF_RED, litP: 0.4 }); door(70, G, 172, 1, 2); sign('사택', 70.5, G + 2.6, 171.94, 'south', 1.6, '#ffffff', '#5b3f1d', 0.4);
  // 텃밭 (울타리 안 고랑)
  for (let x = 96; x <= 146; x += 2) { flat(x, 144, x, 153, B.DIRT); W.fill(x, G, 145, x, G, 152, B.HEDGE, SB); }
  W.fill(94, G, 143, 94, G, 154, B.FENCE); W.fill(148, G, 143, 148, G, 154, B.FENCE); W.fill(94, G, 143, 148, G, 143, B.FENCE); W.fill(94, G, 154, 148, G, 154, B.FENCE); W.fill(120, G, 143, 122, G, 143, B.AIR);
  sign('텃밭', 121.5, G + 1.4, 142.94, 'south', 2, '#ffffff', '#1e7a4a', 0.4, { text2: '상추 · 토마토 · 고추', color2: '#d8efe6' }); place('garden', '텃밭', 121.5, 142.5);
  W.set(95, G, 156, B.IRON); W.set(95, G + 1, 156, B.IRON, SB);
  // 정자
  const pav = { x: 160, z: 170 };
  W.fill(pav.x - 2, G, pav.z - 2, pav.x + 2, G, pav.z + 2, B.PLANKS, SB); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) W.fill(pav.x + dx, G, pav.z + dz, pav.x + dx, G + 3, pav.z + dz, B.LOG);
  W.fill(pav.x - 3, G + 4, pav.z - 3, pav.x + 3, G + 4, pav.z + 3, B.ROOF_GREEN, SB); W.fill(pav.x - 2, G + 4, pav.z - 2, pav.x + 2, G + 4, pav.z + 2, B.ROOF_GREEN, ST); W.fill(pav.x - 1, G + 5, pav.z - 1, pav.x + 1, G + 5, pav.z + 1, B.ROOF_GREEN, SB);
  W.fill(pav.x - 1, G, pav.z + 2, pav.x + 1, G, pav.z + 2, B.BENCH, SB); W.fill(pav.x - 2, G, pav.z - 1, pav.x - 2, G, pav.z + 1, B.BENCH, SB); place('pavilion', '학교 정자', pav.x + 0.5, pav.z - 3.5);
  // 나무 · 조명 · 북문 · 뒷산 길
  const tryTree = (x, z, kind) => { if (W.get(x, TOP, z) === B.GRASS && W.get(x, G, z) === B.AIR && W.get(x, G + 1, z) === B.AIR) tree(x, z, kind); };
  for (let x = C.x0 + 4; x < C.x1; x += 9) { if (x < 140 || x > 174) tryTree(x, C.z0 + 3); if (x < 146 || x > 154) tryTree(x, C.z1 - 3); }
  for (let z = C.z0 + 6; z < C.z1; z += 9) { tryTree(C.x0 + 3, z); tryTree(C.x1 - 3, z); }
  for (let x = 100; x <= 156; x += 8) tryTree(x, 67);
  for (let z = 158; z <= 190; z += 8) for (let x = 90; x <= 190; x += 12) if (Math.hypot(x - pav.x, z - pav.z) > 6) tryTree(x, z, (x + z) % 3 === 0 ? 'pine' : 'oak');
  for (const x of [91, 165]) for (const z of [112, 116]) tryTree(x, z);
  W.fill(148, G, C.z1, 152, G, C.z1, B.AIR); flat(148, C.z1 - 2, 152, C.z1 + 2, B.GRAVEL); flat(127, 141, 151, 142, B.GRAVEL); flat(149, 141, 151, C.z1, B.GRAVEL);
  for (let z = 94; z <= 106; z += 6) { lamp(93, z, 4); lamp(162, z, 4); } lamp(112, 112, 4); lamp(144, 112, 4); lamp(150, 141, 4); lamp(85, 141, 4); lamp(172, 139, 4); lamp(181, 76, 4);
}
