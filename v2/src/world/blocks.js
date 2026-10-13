// 블록 · 타일 레지스트리 — 메인 스레드와 메셔 워커가 같이 쓰는 순수 데이터.
// 좌표 규약: x 동쪽(+), y 위(+), z 북쪽(+). 블록 한 칸 = 1m.
// 면 순서: 0:+x 1:-x 2:+y(위) 3:-y(아래) 4:+z 5:-z

export const WORLD = Object.freeze({ SX: 256, SY: 64, SZ: 256, CHUNK: 16, GROUND: 8 });
export const idx = (x, y, z) => (x * WORLD.SZ + z) * WORLD.SY + y;

// 아틀라스 타일 번호 (textures.js 의 생성기 순서와 같아야 함)
let _t = 0;
export const T = {};
for (const name of [
  'grass_top', 'grass_side', 'dirt', 'stone', 'asphalt', 'lane_white', 'lane_yellow', 'crosswalk',
  'sidewalk', 'curb', 'school_wall', 'school_band', 'window', 'window_lit', 'door', 'roof_green',
  'concrete', 'floor_tile', 'brick', 'wall_beige', 'wall_gray', 'apt_wall', 'apt_window', 'apt_window_lit',
  'balcony', 'shop_glass', 'sign_bunsik', 'sign_conv', 'sign_stationery', 'sign_academy', 'sign_pc', 'sign_cafe',
  'log_side', 'log_top', 'leaves', 'planks', 'fence', 'sand', 'track', 'field_line',
  'iron', 'lamp_head', 'stone_pillar', 'water', 'gravel', 'school_sign', 'roof_flat', 'glass_green',
  'cross', 'flag', 'bench', 'goal', 'hedge', 'flowers', 'plaza', 'stop_line',
  'pine_leaves', 'awning_red', 'awning_blue', 'awning_green', 'parking', 'tank', 'chalkboard', 'bookshelf',
  'desk', 'lamp_pole', 'sign_mart', 'sign_chicken', 'sign_bakery', 'sign_pharmacy', 'brick_dark', 'roof_red',
  'apt_sign', 'bus_stop', 'traffic_light', 'water_deep', 'wood_dark', 'marble', 'lane_edge', 'hill_grass',
  'planks_line', 'track_line', 'stained', 'locker', 'monitor', 'bed', 'piano', 'whiteboard', 'carpet', 'tile_dark',
  'orange_wall', 'dorm_wall', 'terrazzo', 'mailbox', 'roof_gray', 'ceil', 'fence_white', 'paint_white', 'paint_red', 'paint_blue', 'paint_yellow', 'court',
]) T[name] = _t++;
export const TILE_COUNT = _t;
export const ATLAS_COLS = 16;
export const ATLAS_ROWS = Math.ceil(TILE_COUNT / ATLAS_COLS); // 5 → 2048×640 (128px) 또는 1024×320 (64px)

// 렌더 종류: 0 불투명(컬링 기준) · 1 컷아웃(나뭇잎·울타리) · 2 유리(반투명)
export const KIND = Object.freeze({ OPAQUE: 0, CUTOUT: 1, GLASS: 2 });

// 블록 모양: 온블록 · 가로 반(아래/위 슬래브) · 세로 반(서/동/남/북 반쪽 벽). 칸 안에서 차지하는 상자 [x0,y0,z0,x1,y1,z1]
export const SHAPE = Object.freeze({ FULL: 0, SLAB_BOTTOM: 1, SLAB_TOP: 2, HALF_XN: 3, HALF_XP: 4, HALF_ZN: 5, HALF_ZP: 6 });
export const SHAPE_BOX = Object.freeze([
  [0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 0.5, 1], [0, 0.5, 0, 1, 1, 1],
  [0, 0, 0, 0.5, 1, 1], [0.5, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 0.5], [0, 0, 0.5, 1, 1, 1],
]);
export const SHAPE_NAMES = ['온블록', '아래 반블록', '위 반블록', '서쪽 반블록', '동쪽 반블록', '남쪽 반블록', '북쪽 반블록'];

// 블록 정의. tiles: 숫자 하나 또는 [+x,-x,+y,-y,+z,-z] · solid: 충돌 · vary: 밝기 랜덤 변주(0~1)
const defs = [];
export const B = {};
function def(key, name, tiles, opt = {}) {
  const id = defs.length;
  if (id > 255) throw new Error('블록 256개 초과');
  const t = Array.isArray(tiles) ? tiles : [tiles, tiles, tiles, tiles, tiles, tiles];
  defs.push({ id, key, name, tiles: t, solid: opt.solid ?? true, kind: opt.kind ?? KIND.OPAQUE,
    vary: opt.vary ?? 0, tint: opt.tint ?? [1, 1, 1], icon: opt.icon ?? '⬜', breakable: opt.breakable ?? true,
    light: opt.light ?? 0, rot: opt.rot ?? 0 });
  B[key] = id;
  return id;
}

def('AIR', '공기', 0, { solid: false, kind: KIND.CUTOUT, breakable: false });
def('GRASS', '잔디', [T.grass_side, T.grass_side, T.grass_top, T.dirt, T.grass_side, T.grass_side], { vary: 0.08, icon: '🟩' });
def('DIRT', '흙', T.dirt, { vary: 0.08, icon: '🟫' });
def('STONE', '돌', T.stone, { vary: 0.06, icon: '🪨' });
def('ASPHALT', '아스팔트', T.asphalt, { vary: 0.03, icon: '⬛' });
def('LANE_W', '차선(흰)', [T.asphalt, T.asphalt, T.lane_white, T.asphalt, T.asphalt, T.asphalt], { icon: '⬜' });
def('LANE_Y', '중앙선', [T.asphalt, T.asphalt, T.lane_yellow, T.asphalt, T.asphalt, T.asphalt], { icon: '🟨' });
def('CROSSWALK', '횡단보도', [T.asphalt, T.asphalt, T.crosswalk, T.asphalt, T.asphalt, T.asphalt], { icon: '🦓' });
def('SIDEWALK', '보도블록', T.sidewalk, { vary: 0.03, icon: '🔲' });
def('CURB', '경계석', T.curb, { icon: '▫️' });
def('SCHOOL_WALL', '학교 외벽', T.school_wall, { vary: 0.02, icon: '⬜' });
def('SCHOOL_BAND', '초록 띠', T.school_band, { icon: '🟩' });
def('WINDOW', '유리창', T.window, { kind: KIND.GLASS, icon: '🪟' });
def('WINDOW_LIT', '불 켜진 창', T.window_lit, { kind: KIND.GLASS, icon: '🪟', light: 1 });
def('DOOR', '문', T.door, { solid: false, kind: KIND.CUTOUT, icon: '🚪' });
def('ROOF_GREEN', '초록 지붕', T.roof_green, { vary: 0.03, icon: '🟩' });
def('CONCRETE', '콘크리트', T.concrete, { vary: 0.04, icon: '⬜' });
def('FLOOR_TILE', '바닥 타일', [T.floor_tile, T.floor_tile, T.floor_tile, T.ceil, T.floor_tile, T.floor_tile], { icon: '🔳' }); // 아랫면 = 아래층 천장
def('BRICK', '벽돌', T.brick, { vary: 0.03, icon: '🧱' });
def('WALL_BEIGE', '베이지 벽', T.wall_beige, { vary: 0.02, icon: '🟨' });
def('WALL_GRAY', '회색 벽', T.wall_gray, { vary: 0.02, icon: '⬜' });
def('APT_WALL', '아파트 외벽', T.apt_wall, { vary: 0.02, icon: '🏢' });
def('APT_WINDOW', '아파트 창', T.apt_window, { kind: KIND.GLASS, icon: '🪟' });
def('APT_WINDOW_LIT', '아파트 불 켜진 창', T.apt_window_lit, { kind: KIND.GLASS, icon: '🪟', light: 1 });
def('BALCONY', '발코니', T.balcony, { icon: '▪️' });
def('SHOP_GLASS', '가게 유리', T.shop_glass, { kind: KIND.GLASS, icon: '🪟' });
def('SIGN_BUNSIK', '분식 간판', T.sign_bunsik, { icon: '🍢', light: 1 });
def('SIGN_CONV', '편의점 간판', T.sign_conv, { icon: '🏪', light: 1 });
def('SIGN_STATIONERY', '문구점 간판', T.sign_stationery, { icon: '✏️', light: 1 });
def('SIGN_ACADEMY', '학원 간판', T.sign_academy, { icon: '📚', light: 1 });
def('SIGN_PC', 'PC방 간판', T.sign_pc, { icon: '🖥️', light: 1 });
def('SIGN_CAFE', '카페 간판', T.sign_cafe, { icon: '☕', light: 1 });
def('LOG', '참나무 원목', [T.log_side, T.log_side, T.log_top, T.log_top, T.log_side, T.log_side], { vary: 0.05, icon: '🪵' });
def('LEAVES', '나뭇잎', T.leaves, { kind: KIND.CUTOUT, vary: 0.12, icon: '🍃' });
def('PLANKS', '나무 판자', T.planks, { vary: 0.04, icon: '🟫' });
def('FENCE', '울타리', T.fence, { kind: KIND.CUTOUT, icon: '🚧' });
def('SAND', '모래', T.sand, { vary: 0.05, icon: '🟨' });
def('TRACK', '트랙', T.track, { vary: 0.03, icon: '🟥' });
def('FIELD_LINE', '운동장 선', [T.grass_side, T.grass_side, T.field_line, T.dirt, T.grass_side, T.grass_side], { icon: '⬜' });
def('IRON', '철', T.iron, { icon: '⚙️' });
def('LAMP_HEAD', '가로등 머리', T.lamp_head, { icon: '💡', light: 1 });
def('STONE_PILLAR', '석재 기둥', T.stone_pillar, { icon: '🏛️' });
def('WATER', '물', T.water, { solid: false, kind: KIND.GLASS, icon: '💧' });
def('GRAVEL', '자갈', T.gravel, { vary: 0.06, icon: '🪨' });
def('SCHOOL_SIGN', '학교 간판', T.school_sign, { icon: '🏫' });
def('ROOF_FLAT', '옥상 바닥', T.roof_flat, { vary: 0.03, icon: '◻️' });
def('GLASS_GREEN', '초록 유리', T.glass_green, { kind: KIND.GLASS, icon: '🪟' });
def('CROSS', '십자가', T.cross, { icon: '✝️', light: 1 });
def('FLAG', '태극기', T.flag, { kind: KIND.CUTOUT, solid: false, icon: '🇰🇷' });
def('BENCH', '벤치', T.bench, { icon: '🪑' });
def('GOAL', '골대', T.goal, { kind: KIND.CUTOUT, icon: '🥅' });
def('HEDGE', '울타리 나무', T.hedge, { vary: 0.1, icon: '🌳' });
def('FLOWERS', '꽃밭', [T.dirt, T.dirt, T.flowers, T.dirt, T.dirt, T.dirt], { vary: 0.08, icon: '🌸' });
def('PLAZA', '광장 바닥', T.plaza, { vary: 0.02, icon: '🔲' });
def('STOP_LINE', '정지선', [T.asphalt, T.asphalt, T.stop_line, T.asphalt, T.asphalt, T.asphalt], { icon: '⬜' });
def('PINE_LEAVES', '소나무 잎', T.pine_leaves, { kind: KIND.CUTOUT, vary: 0.12, icon: '🌲' });
def('AWNING_RED', '빨간 차양', T.awning_red, { icon: '🟥' });
def('AWNING_BLUE', '파란 차양', T.awning_blue, { icon: '🟦' });
def('AWNING_GREEN', '초록 차양', T.awning_green, { icon: '🟩' });
def('PARKING', '주차선', [T.asphalt, T.asphalt, T.parking, T.asphalt, T.asphalt, T.asphalt], { icon: '🅿️' });
def('TANK', '물탱크', T.tank, { icon: '🛢️' });
def('CHALKBOARD', '칠판', T.chalkboard, { icon: '📗' });
def('BOOKSHELF', '책장', [T.bookshelf, T.bookshelf, T.planks, T.planks, T.bookshelf, T.bookshelf], { icon: '📚' });
def('DESK', '책상', [T.desk, T.desk, T.desk, T.desk, T.desk, T.desk], { icon: '🪵' });
def('LAMP_POLE', '가로등 기둥', T.lamp_pole, { kind: KIND.CUTOUT, icon: '🔩' });
def('SIGN_MART', '마트 간판', T.sign_mart, { icon: '🛒', light: 1 });
def('SIGN_CHICKEN', '치킨 간판', T.sign_chicken, { icon: '🍗', light: 1 });
def('SIGN_BAKERY', '빵집 간판', T.sign_bakery, { icon: '🥐', light: 1 });
def('SIGN_PHARMACY', '약국 간판', T.sign_pharmacy, { icon: '💊', light: 1 });
def('BRICK_DARK', '검은 벽돌', T.brick_dark, { vary: 0.03, icon: '🧱' });
def('ROOF_RED', '빨간 지붕', T.roof_red, { vary: 0.03, icon: '🟥' });
def('APT_SIGN', '아파트 이름', T.apt_sign, { icon: '🏢', light: 1 });
def('BUS_STOP', '정류장', T.bus_stop, { kind: KIND.GLASS, icon: '🚏' });
def('TRAFFIC_LIGHT', '신호등', T.traffic_light, { icon: '🚦', light: 1 });
def('WATER_DEEP', '깊은 물', T.water_deep, { solid: false, kind: KIND.GLASS, icon: '🌊' });
def('WOOD_DARK', '짙은 나무', T.wood_dark, { vary: 0.04, icon: '🟫' });
def('MARBLE', '대리석', T.marble, { vary: 0.02, icon: '⬜' });
def('LANE_EDGE', '차선(가장자리)', [T.asphalt, T.asphalt, T.lane_edge, T.asphalt, T.asphalt, T.asphalt], { icon: '⬜' });
def('HILL_GRASS', '산 잔디', [T.grass_side, T.grass_side, T.hill_grass, T.dirt, T.grass_side, T.grass_side], { vary: 0.1, icon: '🟩' });
// 윗면 무늬를 90° 돌린 변형 (x 방향 도로용)
def('LANE_W_X', '차선(흰·가로)', [T.asphalt, T.asphalt, T.lane_white, T.asphalt, T.asphalt, T.asphalt], { icon: '⬜', rot: 1 });
def('LANE_Y_X', '중앙선(가로)', [T.asphalt, T.asphalt, T.lane_yellow, T.asphalt, T.asphalt, T.asphalt], { icon: '🟨', rot: 1 });
def('CROSSWALK_X', '횡단보도(가로)', [T.asphalt, T.asphalt, T.crosswalk, T.asphalt, T.asphalt, T.asphalt], { icon: '🦓', rot: 1 });
def('STOP_LINE_X', '정지선(가로)', [T.asphalt, T.asphalt, T.stop_line, T.asphalt, T.asphalt, T.asphalt], { icon: '⬜', rot: 1 });
def('FIELD_LINE_X', '운동장 선(가로)', [T.grass_side, T.grass_side, T.field_line, T.dirt, T.grass_side, T.grass_side], { icon: '⬜', rot: 1 });
def('PARKING_X', '주차선(가로)', [T.asphalt, T.asphalt, T.parking, T.asphalt, T.asphalt, T.asphalt], { icon: '🅿️', rot: 1 });
def('LANE_EDGE_X', '차선(가장자리·가로)', [T.asphalt, T.asphalt, T.lane_edge, T.asphalt, T.asphalt, T.asphalt], { icon: '⬜', rot: 1 });
def('PLANKS_LINE', '코트 선', [T.planks, T.planks, T.planks_line, T.planks, T.planks, T.planks], { icon: '⬜' });
def('PLANKS_LINE_X', '코트 선(가로)', [T.planks, T.planks, T.planks_line, T.planks, T.planks, T.planks], { icon: '⬜', rot: 1 });
def('TRACK_LINE', '트랙 선', [T.track, T.track, T.track_line, T.track, T.track, T.track], { icon: '⬜' });
def('TRACK_LINE_X', '트랙 선(가로)', [T.track, T.track, T.track_line, T.track, T.track, T.track], { icon: '⬜', rot: 1 });
def('STAINED', '스테인드글라스', T.stained, { kind: KIND.GLASS, icon: '🪟' });
def('LOCKER', '사물함', T.locker, { icon: '🗄️' });
def('MONITOR', '모니터', T.monitor, { icon: '🖥️', light: 1 });
def('BED', '침대', [T.bed, T.bed, T.bed, T.planks, T.bed, T.bed], { icon: '🛏️' });
def('PIANO', '피아노', T.piano, { icon: '🎹' });
def('WHITEBOARD', '화이트보드', T.whiteboard, { icon: '📋' });
def('CARPET', '카펫', [T.carpet, T.carpet, T.carpet, T.ceil, T.carpet, T.carpet], { icon: '🟥' });
def('TILE_DARK', '짙은 타일', [T.tile_dark, T.tile_dark, T.tile_dark, T.ceil, T.tile_dark, T.tile_dark], { icon: '◼️' });
def('ORANGE_WALL', '주황 벽', T.orange_wall, { vary: 0.03, icon: '🟧' });
def('DORM_WALL', '생활관 외벽', T.dorm_wall, { vary: 0.03, icon: '🏠' });
def('TERRAZZO', '테라초 바닥', [T.terrazzo, T.terrazzo, T.terrazzo, T.ceil, T.terrazzo, T.terrazzo], { vary: 0.02, icon: '⬜' });
def('MAILBOX', '우체통', T.mailbox, { icon: '📮' });
def('ROOF_GRAY', '회색 옥상', [T.roof_gray, T.roof_gray, T.roof_gray, T.ceil, T.roof_gray, T.roof_gray], { vary: 0.03, icon: '◻️' });
def('WOOD_FLOOR', '나무 마루', [T.wood_dark, T.wood_dark, T.wood_dark, T.ceil, T.wood_dark, T.wood_dark], { vary: 0.03, icon: '🟫' });
def('CEILING', '천장 판', T.ceil, { icon: '⬜' });
def('FENCE_WHITE', '흰 울타리', T.fence_white, { kind: KIND.CUTOUT, icon: '🏳️' });
def('PAINT_WHITE', '흰 칠', T.paint_white, { icon: '⬜' });
def('PAINT_RED', '빨간 칠', T.paint_red, { icon: '🟥' });
def('PAINT_BLUE', '파란 칠', T.paint_blue, { icon: '🟦' });
def('PAINT_YELLOW', '노란 칠', T.paint_yellow, { icon: '🟨' });
def('COURT', '코트 바닥', T.court, { vary: 0.02, icon: '🏀' });

export const BLOCKS = defs;

// 워커로 보내는 압축 테이블
export function packBlockTable() {
  const n = 256;
  const solid = new Uint8Array(n), kind = new Uint8Array(n), vary = new Uint8Array(n), rot = new Uint8Array(n);
  const tiles = new Uint16Array(n * 6), tint = new Float32Array(n * 3);
  kind.fill(KIND.CUTOUT);
  for (const d of defs) {
    solid[d.id] = d.solid ? 1 : 0; kind[d.id] = d.kind; vary[d.id] = Math.round(d.vary * 255); rot[d.id] = d.rot;
    for (let f = 0; f < 6; f++) tiles[d.id * 6 + f] = d.tiles[f];
    tint.set(d.tint, d.id * 3);
  }
  return { solid, kind, vary, rot, tiles, tint };
}

// 핫바(짓기)에 보여줄 블록
export const HOTBAR = ['GRASS', 'STONE', 'PLANKS', 'BRICK', 'SCHOOL_WALL', 'WINDOW', 'LOG', 'LEAVES', 'LAMP_HEAD'];
