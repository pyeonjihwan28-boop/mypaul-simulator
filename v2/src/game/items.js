// 아이템 표 — 블록(놓을 수 있는 것) · 재료 · 음식 · 도구(나무~네더라이트 곡괭이·도끼·삽) + 제작 레시피 + 블록 단단함(캐는 시간)·알맞은 도구.
import { BLOCKS, B } from '../world/blocks.js';

export const STACK = 64;
export const ITEMS = {}; // id → { n, icon, kind: 'block'|'mat'|'food'|'tool', block?, fx?, tier?, tool?, speed?, price? }
const def = (id, n, icon, kind, extra = {}) => { ITEMS[id] = { id, n, icon, kind, ...extra }; return id; };
// 블록: 블록 키 그대로가 아이템 id
for (const b of BLOCKS) { if (!b || b.id === B.AIR || !b.breakable) continue; def(b.key, b.name, b.icon, 'block', { block: b.id }); }
// 재료
def('stick', '막대기', '🪵', 'mat'); def('iron_ingot', '철 주괴', '⚙️', 'mat'); def('coal', '석탄', '⚫', 'mat'); def('string', '실', '🧵', 'mat'); def('paper', '종이', '📄', 'mat'); def('book', '책', '📕', 'mat'); def('clay', '점토', '🟤', 'mat'); def('glass_pane', '유리 조각', '🔷', 'mat'); def('gold_ingot', '금 주괴', '🟡', 'mat'); def('diamond', '다이아몬드', '💎', 'mat'); def('netherite', '네더라이트', '⬛', 'mat'); def('flower', '꽃', '🌼', 'mat'); def('seed', '씨앗', '🌱', 'mat'); def('gunpowder', '화약', '🧨', 'mat');
// 음식 (가방에 넣어 두고 먹기)
const food = (id, n, icon, fx, price) => def(id, n, icon, 'food', { fx, price });
food('bread', '빵', '🍞', { hunger: 20 }, 1000); food('ramen', '컵라면', '🍜', { hunger: 30 }, 1500); food('drink', '음료수', '🥤', { energy: 8, stress: -2 }, 800); food('milk', '우유', '🥛', { hunger: 8, energy: 3 }, 1000);
food('onigiri', '삼각김밥', '🍙', { hunger: 18 }, 1200); food('energy', '에너지 음료', '⚡', { energy: 15, stress: 2 }, 2000); food('snack', '과자', '🍪', { hunger: 15, stress: -2 }, 1500); food('lunchbox', '도시락', '🍱', { hunger: 45 }, 4500);
food('tteok', '떡볶이', '🥘', { hunger: 35, stress: -4 }, 3000); food('gimbap', '김밥', '🍣', { hunger: 30 }, 2500); food('chicken', '치킨', '🍗', { hunger: 60, stress: -15 }, 18000); food('cake', '조각 케이크', '🍰', { hunger: 15, stress: -8 }, 4000);
food('coffee', '커피', '☕', { energy: 12, stress: -5 }, 2500); food('juice', '생과일 주스', '🧃', { energy: 8, hunger: 10, stress: -8 }, 2500); food('saltbread', '소금빵', '🥐', { hunger: 20 }, 2000); food('vitamin', '피로회복제', '💊', { energy: 20 }, 3000); food('water', '생수', '💧', { hunger: 2, stress: -1 }, 800); food('apple', '사과', '🍎', { hunger: 12, energy: 2 }, 0); food('carrot', '당근', '🥕', { hunger: 10 }, 0); food('tomato', '토마토', '🍅', { hunger: 10, stress: -1 }, 0);
// 도구: 등급 [단계, 속도, 이름]
export const TIERS = { wooden: [1, 2, '나무'], stone: [2, 4, '돌'], iron: [3, 6, '철'], golden: [1, 12, '금'], diamond: [4, 8, '다이아몬드'], netherite: [5, 9, '네더라이트'] };
export const TOOL_KINDS = { pickaxe: ['곡괭이', '⛏️'], axe: ['도끼', '🪓'], shovel: ['삽', '🥄'] };
for (const [tn, [tier, speed, tk]] of Object.entries(TIERS)) for (const [kn, [kk, ki]] of Object.entries(TOOL_KINDS)) def(`${tn}_${kn}`, `${tk} ${kk}`, ki, 'tool', { tier, speed, tool: kn, dur: [0, 60, 130, 250, 32, 1560, 2030][tier] || 100 });
export const itemOf = (id) => ITEMS[id] || { id, n: id, icon: '❔', kind: 'mat' };

// 블록 단단함(초, 맨손) · 알맞은 도구
const K = (keys, hard, tool) => { for (const k of keys) { const b = B[k]; if (b !== undefined) { HARD[b] = hard; TOOL[b] = tool; } } };
export const HARD = {}, TOOL = {};
for (const b of BLOCKS) if (b) { HARD[b.id] = 1.2; TOOL[b.id] = 'pickaxe'; }
K(['GRASS', 'DIRT', 'SAND', 'GRAVEL', 'HILL_GRASS', 'FLOWERS', 'HEDGE', 'CARPET', 'PLAZA'], 0.6, 'shovel');
K(['LOG', 'PLANKS', 'PLANKS_LINE', 'PLANKS_LINE_X', 'WOOD_DARK', 'WOOD_FLOOR', 'BOOKSHELF', 'DESK', 'BENCH', 'FENCE', 'DOOR', 'PIANO', 'LOCKER', 'BED', 'WHITEBOARD', 'CHALKBOARD', 'BUS_STOP', 'MAILBOX'], 1.0, 'axe');
K(['LEAVES', 'PINE_LEAVES', 'FLAG', 'GOAL', 'TRACK', 'TRACK_LINE', 'TRACK_LINE_X', 'FIELD_LINE', 'FIELD_LINE_X', 'STAINED', 'WINDOW', 'WINDOW_LIT', 'APT_WINDOW', 'APT_WINDOW_LIT', 'SHOP_GLASS', 'GLASS_GREEN', 'LAMP_HEAD', 'MONITOR', 'CROSS', 'SCHOOL_SIGN', 'SIGN_BUNSIK', 'SIGN_CONV', 'SIGN_STATIONERY', 'SIGN_ACADEMY', 'SIGN_PC', 'SIGN_CAFE', 'SIGN_MART', 'SIGN_CHICKEN', 'SIGN_BAKERY', 'SIGN_PHARMACY', 'APT_SIGN', 'AWNING_RED', 'AWNING_BLUE', 'AWNING_GREEN'], 0.35, 'any');
K(['STONE', 'CONCRETE', 'BRICK', 'BRICK_DARK', 'MARBLE', 'STONE_PILLAR', 'SCHOOL_WALL', 'SCHOOL_BAND', 'WALL_GRAY', 'WALL_BEIGE', 'APT_WALL', 'DORM_WALL', 'ORANGE_WALL', 'TERRAZZO', 'FLOOR_TILE', 'TILE_DARK', 'ROOF_GREEN', 'ROOF_RED', 'ROOF_FLAT', 'ROOF_GRAY', 'CEILING', 'SIDEWALK', 'CURB', 'ASPHALT', 'LANE_W', 'LANE_Y', 'LANE_W_X', 'LANE_Y_X', 'LANE_EDGE', 'LANE_EDGE_X', 'CROSSWALK', 'CROSSWALK_X', 'STOP_LINE', 'STOP_LINE_X', 'PARKING', 'PARKING_X', 'BALCONY'], 1.8, 'pickaxe');
K(['IRON', 'LAMP_POLE', 'TANK', 'TRAFFIC_LIGHT'], 3.2, 'pickaxe');
// 캐는 데 걸리는 시간(초): 맨손이면 단단함 그대로, 알맞은 도구면 속도만큼 빨라짐 · 안 맞는 도구는 1.3배
export function breakTime(blockId, toolItem) {
  const hard = HARD[blockId] ?? 1.2, need = TOOL[blockId] || 'pickaxe';
  if (!toolItem || toolItem.kind !== 'tool') return hard;
  if (need === 'any' || need === toolItem.tool) return hard / toolItem.speed;
  return hard / Math.max(1.3, toolItem.speed * 0.4);
}
// 캤을 때 떨어지는 것 (돌·흙은 그대로, 유리는 깨져 유리 조각, 잎은 가끔 씨앗/사과)
export function dropOf(blockId) {
  const key = BLOCKS[blockId]?.key; if (!key) return null;
  if (/WINDOW|SHOP_GLASS|GLASS_GREEN|STAINED/.test(key)) return ['glass_pane', 1];
  if (key === 'LEAVES' || key === 'PINE_LEAVES') { const r = Math.random(); return r < 0.08 ? ['apple', 1] : r < 0.2 ? ['stick', 1] : r < 0.35 ? ['seed', 1] : null; }
  if (key === 'FLOWERS') return ['flower', 1];
  if (key === 'HEDGE') return Math.random() < 0.5 ? ['stick', 1] : ['seed', 1];
  return [key, 1];
}

// ---- 제작 레시피: [결과, 개수, [[재료, 개수]...], 종류] ----
export const RECIPES = [];
const R = (out, n, ins, cat) => RECIPES.push({ out, n, ins, cat });
R('PLANKS', 4, [['LOG', 1]], '블록'); R('stick', 4, [['PLANKS', 2]], '재료'); R('WOOD_DARK', 4, [['PLANKS', 4], ['coal', 1]], '블록'); R('WOOD_FLOOR', 4, [['WOOD_DARK', 4]], '블록');
R('PLANKS_LINE', 4, [['PLANKS', 4]], '블록'); R('FENCE', 3, [['PLANKS', 4], ['stick', 2]], '블록'); R('DOOR', 1, [['PLANKS', 6]], '블록'); R('BENCH', 2, [['PLANKS', 3], ['stick', 2]], '블록'); R('DESK', 1, [['PLANKS', 4], ['stick', 4]], '블록');
R('BOOKSHELF', 1, [['PLANKS', 6], ['book', 3]], '블록'); R('LOCKER', 1, [['iron_ingot', 4], ['PLANKS', 2]], '블록'); R('BED', 1, [['PLANKS', 3], ['string', 3]], '블록'); R('PIANO', 1, [['WOOD_DARK', 6], ['iron_ingot', 2], ['string', 4]], '블록'); R('WHITEBOARD', 1, [['glass_pane', 2], ['iron_ingot', 1], ['paper', 2]], '블록'); R('MAILBOX', 1, [['iron_ingot', 4], ['paper', 1]], '블록');
R('CONCRETE', 4, [['GRAVEL', 2], ['SAND', 2]], '블록'); R('BRICK', 4, [['clay', 4]], '블록'); R('clay', 2, [['DIRT', 2], ['water', 1]], '재료'); R('MARBLE', 2, [['STONE', 4], ['glass_pane', 1]], '블록'); R('STONE_PILLAR', 2, [['STONE', 4]], '블록');
R('SCHOOL_WALL', 4, [['CONCRETE', 3], ['paper', 1]], '블록'); R('SCHOOL_BAND', 4, [['CONCRETE', 3], ['flower', 1]], '블록'); R('WALL_GRAY', 4, [['CONCRETE', 4]], '블록'); R('WALL_BEIGE', 4, [['CONCRETE', 3], ['SAND', 1]], '블록'); R('DORM_WALL', 4, [['CONCRETE', 3], ['clay', 1]], '블록'); R('ORANGE_WALL', 4, [['CONCRETE', 3], ['clay', 2]], '블록');
R('FLOOR_TILE', 4, [['STONE', 2], ['clay', 2]], '블록'); R('TERRAZZO', 4, [['CONCRETE', 2], ['glass_pane', 1], ['MARBLE', 1]], '블록'); R('TILE_DARK', 4, [['STONE', 3], ['coal', 1]], '블록'); R('CARPET', 3, [['string', 4]], '블록'); R('CEILING', 4, [['paper', 2], ['PLANKS', 2]], '블록');
R('ROOF_GREEN', 4, [['CONCRETE', 2], ['flower', 2]], '블록'); R('ROOF_RED', 4, [['BRICK', 2], ['clay', 2]], '블록'); R('ROOF_GRAY', 4, [['CONCRETE', 2], ['GRAVEL', 2]], '블록'); R('SIDEWALK', 4, [['CONCRETE', 2], ['STONE', 2]], '블록'); R('ASPHALT', 4, [['GRAVEL', 3], ['coal', 1]], '블록');
R('WINDOW', 2, [['glass_pane', 4], ['PLANKS', 1]], '블록'); R('SHOP_GLASS', 2, [['glass_pane', 4]], '블록'); R('STAINED', 1, [['glass_pane', 2], ['flower', 2]], '블록'); R('glass_pane', 4, [['SAND', 2], ['coal', 1]], '재료');
R('LAMP_HEAD', 1, [['iron_ingot', 1], ['glass_pane', 2]], '블록'); R('LAMP_POLE', 2, [['iron_ingot', 2]], '블록'); R('MONITOR', 1, [['iron_ingot', 2], ['glass_pane', 1]], '블록'); R('IRON', 1, [['iron_ingot', 9]], '블록'); R('iron_ingot', 9, [['IRON', 1]], '재료');
R('HEDGE', 2, [['LEAVES', 4]], '블록'); R('FLOWERS', 1, [['GRASS', 1], ['flower', 1]], '블록'); R('GRASS', 1, [['DIRT', 1], ['seed', 1]], '블록'); R('LEAVES', 4, [['stick', 2], ['seed', 2]], '블록');
R('paper', 3, [['stick', 3]], '재료'); R('book', 1, [['paper', 3], ['string', 1]], '재료'); R('string', 2, [['flower', 2]], '재료'); R('coal', 1, [['LOG', 2]], '재료'); R('gunpowder', 1, [['coal', 2], ['SAND', 1]], '재료');
for (const [tn, mat] of [['wooden', 'PLANKS'], ['stone', 'STONE'], ['iron', 'iron_ingot'], ['golden', 'gold_ingot'], ['diamond', 'diamond'], ['netherite', 'netherite']]) {
  R(`${tn}_pickaxe`, 1, [[mat, 3], ['stick', 2]], '도구'); R(`${tn}_axe`, 1, [[mat, 3], ['stick', 2]], '도구'); R(`${tn}_shovel`, 1, [[mat, 1], ['stick', 2]], '도구');
}
R('bread', 1, [['seed', 3]], '음식'); R('apple', 1, [['flower', 2], ['seed', 1]], '음식'); R('water', 1, [['glass_pane', 1]], '음식');
export const CATS = ['블록', '재료', '도구', '음식'];
