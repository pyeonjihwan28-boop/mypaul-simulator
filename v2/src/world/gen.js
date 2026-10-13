// 세계 생성 — 지형 · 도로 → 학교(gen/school) · 도시·공원(gen/city) · 뒷산.
// 남쪽 = -z, 북쪽 = +z, 동쪽 = +x. 땅 위 첫 공기 칸 y = GROUND(8), 땅 윗면 블록 y = 7.
// 비율: 블록 1칸 = 1m · 사람 1.8m · 문 2m · 학교 층 4m(천장 3.5m) · 아파트·주택 층 3m(천장 2.5m) · 계단 한 단 0.5m
import { WORLD, B } from './blocks.js';
import { fbmWorld, rng, smooth } from './noise.js';
import { makeTools, G, TOP, SB, ST } from './gen/util.js';
import { buildSchool, CAMPUS } from './gen/school.js';
import { buildCity, buildHill } from './gen/city.js';

const { SX, SZ, SY } = WORLD;
export const ROADS = { vx: [56, 200], hz: [56, 200], half: 3, walk: 2 };
export { CAMPUS };

export function generateWorld(W, onStep) {
  const R = rng(20261013);
  const props = { lamps: [], signs: [], zones: [], lanes: [], npcAreas: [], trafficLights: [], spawn: null, carSpawn: null, benches: [], trees: 0, places: [], roads: ROADS };
  const step = (name) => onStep && onStep(name);

  // ---------- 지형 ----------
  step('땅 고르기');
  const hill = (x, z) => {
    let h = 0;
    const n = fbmWorld(x, z, 28, 3, 7);
    h += smooth(204, 236, z) * (4 + n * 9);
    h += smooth(226, 255, z) * 3 * n;
    const edge = Math.max(smooth(6, 0, x), smooth(249, 255, x), smooth(6, 0, z));
    h += edge * (2 + n * 3);
    return Math.round(h);
  };
  const height = new Uint8Array(SX * SZ);
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
    const h = TOP + hill(x, z);
    height[x * SZ + z] = h;
    const base = (x * SZ + z) * SY, d = W.data;
    d.fill(B.STONE, base, base + Math.max(1, h - 2));
    d.fill(B.DIRT, base + Math.max(1, h - 2), base + h);
    d[base + h] = h > TOP + 1 ? B.HILL_GRASS : B.GRASS;
  }

  // ---------- 도로 (턱 있는 보도 · 차선 · 횡단보도 · 신호등 · 가로등) ----------
  step('도로 깔기');
  const { half, walk } = ROADS;
  const isRoad = (x, z) => ROADS.vx.some((c) => Math.abs(x - c) <= half) || ROADS.hz.some((c) => Math.abs(z - c) <= half);
  const isWalk = (x, z) => !isRoad(x, z) && (ROADS.vx.some((c) => Math.abs(x - c) <= half + walk) || ROADS.hz.some((c) => Math.abs(z - c) <= half + walk));
  const nearCrosswalk = (x, z) => ROADS.vx.some((cx) => ROADS.hz.some((cz) => (Math.abs(x - cx) <= half && Math.abs(Math.abs(z - cz) - (half + 2)) <= 1) || (Math.abs(z - cz) <= half && Math.abs(Math.abs(x - cx) - (half + 2)) <= 1)));
  for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
    if (isRoad(x, z)) {
      for (let y = TOP + 1; y < SY; y++) W.set(x, y, z, B.AIR);
      W.set(x, TOP, z, B.ASPHALT); W.set(x, TOP - 1, z, B.GRAVEL); height[x * SZ + z] = TOP;
    } else if (isWalk(x, z)) {
      for (let y = TOP + 1; y < SY; y++) W.set(x, y, z, B.AIR);
      W.set(x, TOP, z, B.SIDEWALK);
      if (!nearCrosswalk(x, z)) W.set(x, G, z, B.SIDEWALK, SB);
      height[x * SZ + z] = TOP;
    }
  }
  for (const c of ROADS.vx) for (let z = 0; z < SZ; z++) {
    if (ROADS.hz.some((hc) => Math.abs(z - hc) <= half + 1)) continue;
    W.set(c, TOP, z, B.LANE_Y); W.set(c - half, TOP, z, B.LANE_EDGE); W.set(c + half, TOP, z, B.LANE_EDGE);
  }
  for (const c of ROADS.hz) for (let x = 0; x < SX; x++) {
    if (ROADS.vx.some((vc) => Math.abs(x - vc) <= half + 1)) continue;
    W.set(x, TOP, c, B.LANE_Y_X); W.set(x, TOP, c - half, B.LANE_EDGE_X); W.set(x, TOP, c + half, B.LANE_EDGE_X);
  }
  for (const cx of ROADS.vx) for (const cz of ROADS.hz) {
    for (let k = -half; k <= half; k++) {
      W.set(cx + k, TOP, cz - half - 2, B.CROSSWALK); W.set(cx + k, TOP, cz + half + 2, B.CROSSWALK);
      W.set(cx - half - 2, TOP, cz + k, B.CROSSWALK_X); W.set(cx + half + 2, TOP, cz + k, B.CROSSWALK_X);
    }
    for (let k = 1; k <= half; k++) { W.set(cx + k, TOP, cz - half - 3, B.STOP_LINE_X); W.set(cx - k, TOP, cz + half + 3, B.STOP_LINE_X); W.set(cx - half - 3, TOP, cz - k, B.STOP_LINE); W.set(cx + half + 3, TOP, cz + k, B.STOP_LINE); }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const px = cx + sx * (half + 1), pz = cz + sz * (half + 1);
      W.fill(px, G, pz, px, G + 3, pz, B.LAMP_POLE); W.set(px, G + 4, pz, B.TRAFFIC_LIGHT);
      props.trafficLights.push({ x: px, z: pz });
    }
  }
  const T = makeTools(W, R, props, height, isRoad, isWalk);
  for (const c of ROADS.vx) for (let z = 8; z < SZ - 4; z += 12) { if (!ROADS.hz.some((hc) => Math.abs(z - hc) < 7)) { T.lamp(c - half - walk, z, 5); T.lamp(c + half + walk, z + 6 < SZ - 4 ? z + 6 : z, 5); } }
  for (const c of ROADS.hz) for (let x = 8; x < SX - 4; x += 12) { if (!ROADS.vx.some((vc) => Math.abs(x - vc) < 7)) { T.lamp(x, c - half - walk, 5); T.lamp(x + 6 < SX - 4 ? x + 6 : x, c + half + walk, 5); } }

  step('본관 짓는 중 (흰 외벽 + 초록 띠)');
  buildSchool(W, T, R, props);
  step('학교 앞 거리·아파트·공원 세우는 중');
  buildCity(W, T, R, props, isRoad, isWalk);
  step('뒷산 숲 심는 중');
  buildHill(W, T, R, props, isRoad, isWalk);

  // ---------- 교통 차선(NPC 차) · NPC 구역 · 시작 위치 ----------
  const L = 1.5;
  props.lanes.push([[ROADS.vx[0] - L, ROADS.hz[0] - L], [ROADS.vx[1] + L, ROADS.hz[0] - L], [ROADS.vx[1] + L, ROADS.hz[1] + L], [ROADS.vx[0] - L, ROADS.hz[1] + L]]);
  props.lanes.push([[ROADS.vx[0] + L, ROADS.hz[0] + L], [ROADS.vx[0] + L, ROADS.hz[1] - L], [ROADS.vx[1] - L, ROADS.hz[1] - L], [ROADS.vx[1] - L, ROADS.hz[0] + L]]);
  props.lanes.push([[ROADS.vx[0] + L, 4], [ROADS.vx[0] + L, ROADS.hz[0] - 8], [ROADS.vx[0] - L, ROADS.hz[0] - 8], [ROADS.vx[0] - L, 4]]);
  props.lanes.push([[ROADS.vx[1] + L, ROADS.hz[1] + 8], [ROADS.vx[1] + L, SZ - 6], [ROADS.vx[1] - L, SZ - 6], [ROADS.vx[1] - L, ROADS.hz[1] + 8]]);
  props.npcAreas.push({ x0: 131, z0: 64, x1: 169, z1: 118, n: 10 }, { x0: 70, z0: 70, x1: 104, z1: 106, n: 6 }, { x0: 112, z0: 66, x1: 128, z1: 118, n: 3 });
  props.npcAreas.push({ x0: 64, z0: 51, x1: 194, z1: 52, n: 6 }, { x0: 64, z0: 60, x1: 194, z1: 61, n: 5 }, { x0: 6, z0: 66, x1: 48, z1: 190, n: 4 });
  props.spawn = { x: 150.5, y: G, z: 66.5 };
  props.busStops = [{ name: '학교 앞', x: 178.5, z: 58.5 }, { name: '마트', x: 206, z: 53.5 }, { name: '아파트', x: 206, z: 90 }, { name: '공원', x: 50, z: 128.5 }];
  return props;
}
