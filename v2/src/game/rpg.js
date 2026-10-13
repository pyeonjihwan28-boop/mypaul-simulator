// RPG 핵심 — 전 판 표 그대로: 레벨·경험치·환생, 능력치 6, 무기 24(강화 +10 · 인챈트 10), 장비 4칸×7등급(강화·합성), 탈것 24.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const GRADES = [{ n: '일반', c: '#c8cfdc' }, { n: '고급', c: '#6ad48a' }, { n: '희귀', c: '#7ab4ff' }, { n: '영웅', c: '#b98cff' }, { n: '전설', c: '#f0c46a' }, { n: '신화', c: '#ff5ca8' }, { n: '초월', c: '#6ff3ff' }];
export const GRADE6 = [GRADES[0], GRADES[1], GRADES[2], GRADES[4], GRADES[5], GRADES[6]]; // 무기·탈것 6등급(일반·고급·희귀·전설·신화·초월)

// ---- 능력치 6 (전 판) ----
export const STATS = [
  { k: 'study', n: '학업', d: '보스에게 주는 피해 +' , icon: '📚' },
  { k: 'focus', n: '집중력', d: '무기 재사용 시간 −', icon: '🎯' },
  { k: 'body', n: '체력', d: '보스전 체력 · 달리기 +', icon: '💪' },
  { k: 'stress', n: '스트레스', d: '받는 피해 (낮을수록 좋아요)', icon: '😮‍💨', inverse: true },
  { k: 'project', n: '프로젝트', d: '폭발 범위 +', icon: '🧪' },
  { k: 'rep', n: '평판', d: '받는 피해 − · 호감도 보너스', icon: '🌟' },
];
export const STAT_MAX = 100, SP_PER_LEVEL = 4;
export const xpNeed = (lv) => 60 + lv * 40;

// ---- 무기 24 (전 판 표) ----
export const WEAPONS = [
  { k: 'bazooka', n: '바주카포', e: '🚀', g: 0, price: 200, cd: 700, dmg: 24, d: '기본 무기 · 날아가서 터지는 로켓', type: 'rocket', r: 2.6, spd: 28, trait: '폭발' },
  { k: 'laser', n: '레이저건', e: '🔴', g: 0, price: 200, cd: 130, dmg: 7, d: '기본 무기 · 빠르게 연사하는 레이저 (누르고 있으면 연사)', type: 'beam', r: 1.2, auto: true, trait: '연발' },
  { k: 'cannon', n: '레이저 캐논', e: '🟣', g: 0, price: 200, cd: 1500, dmg: 30, d: '기본 무기 · 벽을 뚫는 굵은 광선', type: 'beam', r: 1.8, pierce: 3, trait: '관통' },
  { k: 'grenade', n: '플라즈마 수류탄', e: '💣', g: 0, price: 200, cd: 900, dmg: 26, d: '기본 무기 · 던지면 튀다가 터지는 수류탄', type: 'grenade', r: 3, spd: 18, trait: '던지기' },
  { k: 'shotgun', n: '샷건', e: '🔫', g: 1, price: 1500, cd: 900, dmg: 9, d: '가까이서 강력한 산탄 7발', type: 'pellets', count: 7, r: 1.0, spd: 34, trait: '다중 발사' },
  { k: 'boomer', n: '부메랑', e: '🪃', g: 1, price: 1500, cd: 1300, dmg: 7, d: '날아갔다가 돌아오면서 길목을 다 부숴요', type: 'boomer', r: 1.6, spd: 22, trait: '돌아오기' },
  { k: 'flame', n: '화염방사기', e: '🔥', g: 1, price: 1800, cd: 90, dmg: 6, d: '가까운 곳(8m)을 계속 태워요 · 누르고 있기', type: 'cone', range: 8, r: 1.2, auto: true, trait: '화염' },
  { k: 'freeze', n: '얼음총', e: '🧊', g: 1, price: 1800, cd: 100, dmg: 4, d: '맞은 보스가 2초 동안 느려져요 · 누르고 있기', type: 'cone', range: 9, r: 1.0, auto: true, slow: true, trait: '빙결' },
  { k: 'minigun', n: '미니건', e: '🔩', g: 2, price: 6000, cd: 75, dmg: 5, d: '총알이 비처럼 쏟아져요 · 누르고 있기', type: 'bullet', r: 0.9, spd: 60, auto: true, trait: '속사' },
  { k: 'homing', n: '유도 미사일', e: '🎯', g: 2, price: 6000, cd: 1100, dmg: 50, d: '보스·선생님을 알아서 따라가요', type: 'rocket', r: 2.8, spd: 22, homing: true, trait: '유도' },
  { k: 'tesla', n: '번개총', e: '⚡', g: 2, price: 12000, cd: 220, dmg: 16, d: '지지직! 맞은 곳 주변까지 번개가 튀어요 · 누르고 있기', type: 'beam', r: 1.5, auto: true, chain: true, trait: '연쇄 번개' },
  { k: 'planes', n: '종이비행기 편대', e: '✈️', g: 2, price: 13000, cd: 1600, dmg: 18, d: '종이비행기 5대가 선생님·보스를 알아서 따라가요', type: 'rocket', count: 5, spread: 0.25, r: 1.6, spd: 20, homing: true, trait: '유도' },
  { k: 'rail', n: '레일건', e: '🧲', g: 3, price: 25000, cd: 1800, dmg: 95, d: '벽을 뚫는 강력한 한 발', type: 'beam', r: 1.4, pierce: 8, trait: '관통' },
  { k: 'cluster', n: '클러스터 폭탄', e: '🎇', g: 3, price: 25000, cd: 1400, dmg: 35, d: '터지면서 작은 폭탄 6개가 흩어져요', type: 'rocket', r: 2.4, spd: 24, cluster: 6, trait: '분열' },
  { k: 'hammer', n: '중력 해머', e: '🔨', g: 3, price: 28000, cd: 2200, dmg: 85, d: '가까이에서 쾅! 내 주변을 크게 날려요', type: 'melee', r: 4.5, trait: '근접 충격파' },
  { k: 'blackhole', n: '블랙홀 수류탄', e: '🕳️', g: 3, price: 30000, cd: 3500, dmg: 120, d: '던지면 주변을 크게 집어삼켜요', type: 'grenade', r: 5, spd: 16, suck: true, trait: '빨아들이기' },
  { k: 'nuke', n: '초대형 폭탄', e: '☢️', g: 4, price: 100000, cd: 9000, dmg: 260, d: '학교 반쪽이 날아가는 거대한 폭발', type: 'rocket', r: 9, spd: 18, trait: '거대화' },
  { k: 'orbital', n: '궤도 레이저', e: '🛰️', g: 4, price: 110000, cd: 14000, dmg: 30, d: '조준한 곳에 하늘에서 레이저가 내리꽂혀요', type: 'strike', r: 4, count: 6, trait: '하늘 폭격' },
  { k: 'rainbow', n: '무지개 빔', e: '🌈', g: 4, price: 120000, cd: 160, dmg: 16, d: '벽을 4번까지 뚫는 무지개 광선 · 누르고 있기', type: 'beam', r: 1.3, pierce: 4, auto: true, trait: '관통' },
  { k: 'meteor', n: '운석 소환', e: '☄️', g: 4, price: 120000, cd: 6000, dmg: 70, d: '조준한 곳 주변에 운석 5개가 떨어져요', type: 'strike', r: 3.2, count: 5, spread: 6, trait: '하늘 폭격' },
  { k: 'timestop', n: '시간 정지 시계', e: '⏱️', g: 5, price: 450000, cd: 12000, dmg: 120, d: '보스와 날아오던 공격을 3초 동안 멈추고 큰 피해', type: 'timestop', r: 6, trait: '시간 정지' },
  { k: 'dragon', n: '드래곤 브레스', e: '🐉', g: 5, price: 500000, cd: 80, dmg: 30, d: '14m까지 닿는 용의 불길 · 누르고 있기', type: 'cone', range: 14, r: 1.8, auto: true, trait: '화염' },
  { k: 'starbow', n: '별똥별 활', e: '🌠', g: 5, price: 500000, cd: 650, dmg: 60, d: '보스를 따라가는 화살이 별똥별로 흩어져요', type: 'rocket', r: 2.2, spd: 30, homing: true, cluster: 4, trait: '유도' },
  { k: 'galaxy', n: '은하 대포', e: '🌌', g: 5, price: 550000, cd: 7000, dmg: 300, d: '은하를 쏘아 크게 빨아들인 뒤 별 폭탄을 흩뿌려요', type: 'rocket', r: 7, spd: 14, suck: true, cluster: 8, trait: '빨아들이기' },
];
export const WEAPON_BY = Object.fromEntries(WEAPONS.map((w) => [w.k, w]));
// 인챈트 10 (전 판)
export const ENCHANTS = {
  homing: { n: '유도', d: '가까운 선생님·보스 쪽으로 조준이 붙고, 미사일·수류탄이 따라가요', p: 400, c: '#40ff90' },
  pierce: { n: '관통', d: '맞힌 곳을 뚫고 뒤까지 한 번 더 · 미사일은 2번 더 뚫어요', p: 450, c: '#9fe8ff' },
  split: { n: '분열', d: '터질 때 작은 폭탄 3개가 튀어 나가요', p: 600, c: '#ffb040' },
  multi: { n: '다중 발사', d: '양옆으로 1발씩 더 쏴요 (옆 발은 피해 50%)', p: 700, c: '#ffe08a' },
  rapid: { n: '속사', d: '재사용 시간 −30%', p: 500, c: '#ffd040' },
  big: { n: '거대화', d: '폭발 범위 +40% · 보스 피해 +25%', p: 600, c: '#ff8a5c' },
  freeze: { n: '빙결', d: '맞은 보스가 2초 동안 느려져요 (4초에 한 번)', p: 500, c: '#a8ecff' },
  burn: { n: '화염', d: '맞은 곳이 3초 동안 불타요 · 보스에게 계속 피해', p: 550, c: '#ff7a3a' },
  chain: { n: '연쇄 번개', d: '맞은 곳에서 번개 2줄기가 근처 선생님·보스로 튀어요', p: 600, c: '#c9a0ff' },
  vamp: { n: '흡혈', d: '보스에게 준 피해의 8%만큼 내 체력 회복', p: 500, c: '#ff6a8a' },
};
// 강화 +1~+10 성공 확률(100% → 10%) · 실패하면 지나온 기준점(+1 · +4 · +7)으로
export const UP_RATE = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
export const upCost = (w, up) => Math.round((w.price * 0.12 + 150) * (1 + up * 0.6));
export const upFallback = (up) => (up >= 7 ? 7 : up >= 4 ? 4 : up >= 1 ? 1 : 0);
export const upMult = (up) => 1 + up * 0.09; // +10 → 피해 1.9배

// ---- 장비: 4칸 × 7등급 (전 판 표) ----
export const SLOTS = [{ k: 'hat', n: '모자' }, { k: 'top', n: '옷' }, { k: 'shoes', n: '신발' }, { k: 'acc', n: '장신구' }];
export const GEAR_NAMES = { hat: ['야구모자', '비니', '헬멧', '용사의 투구', '기사 투구', '마법사 모자', '별빛 왕관'], top: ['체육복', '후드티', '교복 재킷', '사슬 갑옷', '강철 갑옷', '용비늘 갑옷', '은하 망토'], shoes: ['실내화', '운동화', '농구화', '로켓 운동화', '바람 부츠', '번개 부츠', '시간의 신발'], acc: ['이름표', '손목시계', '학생증 목걸이', '은메달', '금메달', '용의 눈 반지', '무한의 펜던트'] };
const GEAR_FX = { hat: ['taken', [-0.04, -0.07, -0.1, -0.12, -0.14, -0.18, -0.22], 'xp', [0.1, 0.2]], top: ['hp', [0.1, 0.16, 0.22, 0.26, 0.3, 0.38, 0.46], 'coin', [0.1, 0.2]], shoes: ['run', [0.04, 0.06, 0.09, 0.105, 0.12, 0.15, 0.18], 'rad', [0.08, 0.15]], acc: ['dmg', [0.04, 0.07, 0.1, 0.12, 0.14, 0.18, 0.22], 'cd', [-0.04, -0.08]] };
export const FX_LABEL = { dmg: '피해', hp: '체력', taken: '받는 피해', run: '달리기', cd: '재사용', rad: '폭발 범위', coin: '코인', xp: '경험치' };
export const gearFx = (slot, r) => { const f = GEAR_FX[slot]; const o = { [f[0]]: f[1][r] || 0 }; if (r >= 5) o[f[2]] = f[3][r - 5]; return o; };
export const gearPrice = (r) => [30, 80, 200, 350, 500, 1500, 5000][r] * 10;
export const makeGear = (slot, r, from = '') => ({ id: 0, s: slot, r: clamp(r | 0, 0, 6), n: GEAR_NAMES[slot][clamp(r | 0, 0, 6)], up: 0, from });
// 장비 뽑기 확률(레벨대별, 전 판 표)
const GEAR_DROP = [[1, [74, 22, 3, 0.8, 0.2, 0, 0]], [3, [60, 29, 8, 2.2, 0.6, 0.15, 0.05]], [5, [47, 33, 13, 5, 1.5, 0.4, 0.1]], [8, [34, 35, 19, 8, 3, 0.8, 0.2]], [10, [26, 36, 22, 10, 4.5, 1.1, 0.4]], [15, [14, 34, 28, 14, 7, 2.3, 0.7]], [20, [8, 29, 31, 18, 9.5, 3.3, 1.2]], [30, [3, 22, 31, 22, 14, 6, 2]], [50, [0, 14, 28, 26, 19, 9, 4]]];
export function rollGearGrade(lv, rnd = Math.random) { let t = GEAR_DROP[0][1]; for (const [l, w] of GEAR_DROP) if (lv >= l) t = w; const sum = t.reduce((a, b) => a + b, 0); let x = rnd() * sum; for (let i = 0; i < t.length; i++) { x -= t[i]; if (x <= 0) return i; } return 0; }

// ---- 탈것 24 (전 판 표): [이름, 그림, 등급(0~5), 값, 속도 배수, 높이] ----
export const VEHICLES = [
  ['kick', '킥보드', '🛴', 0, 1500, 1.25, 0.12], ['roller', '롤러스케이트', '🛼', 0, 2000, 1.3, 0.1], ['skate', '스케이트보드', '🛹', 0, 2500, 1.35, 0.14], ['bike', '자전거', '🚲', 0, 3000, 1.45, 0.32],
  ['mart', '마트 카트', '🛒', 1, 10000, 1.6, 0.5], ['ekick', '전동 킥보드', '⚡', 1, 12000, 1.7, 0.13], ['wheel', '전동휠', '🛞', 1, 15000, 1.75, 0.22], ['scoot', '스쿠터', '🛵', 1, 18000, 1.9, 0.54],
  ['mtb', '산악자전거', '🚵', 2, 50000, 2.05, 0.36], ['cart', '골프 카트', '🏌️', 2, 60000, 2.15, 0.6], ['atv', '사륜 바이크', '🚜', 2, 70000, 2.25, 0.62], ['gokart', '고카트', '🏎️', 2, 80000, 2.35, 0.3],
  ['tank', '미니 탱크', '🪖', 3, 250000, 2.4, 0.95], ['sled', '썰매', '🛷', 3, 300000, 2.55, 0.3], ['moto', '오토바이', '🏍️', 3, 350000, 2.7, 0.8], ['hover', '호버보드', '🌀', 3, 400000, 2.85, 0.3],
  ['broom', '마법 빗자루', '🧹', 4, 1200000, 3, 0.75], ['carpet', '하늘 양탄자', '🧞', 4, 1400000, 3.1, 0.55], ['jetpack', '제트팩', '🎒', 4, 1600000, 3.25, 0.45], ['rocket', '로켓 의자', '🚀', 4, 1800000, 3.4, 0.55],
  ['unicorn', '유니콘', '🦄', 5, 6000000, 3.6, 1.05], ['ufo', 'UFO', '🛸', 5, 7000000, 3.75, 0.68], ['drake', '용', '🐉', 5, 8000000, 3.9, 1.25], ['gboard', '은하 서핑보드', '🏄', 5, 10000000, 4, 0.5],
].map(([k, n, e, g, price, spd, h]) => ({ k, n, e, g, price, spd, h }));
export const VEHICLE_BY = Object.fromEntries(VEHICLES.map((v) => [v.k, v]));

// ---- 상태 ----
export class RPG {
  constructor(save = {}, stats) {
    const r = save.rpg || {};
    this.stats = stats;
    this.lv = r.lv ?? 1; this.xp = r.xp ?? 0; this.sp = r.sp ?? 0; this.rebirth = r.rebirth ?? 0;
    this.st = { study: 10, focus: 10, body: 10, stress: 10, project: 10, rep: 10, ...(r.st || {}) };
    this.weapons = r.weapons || { bazooka: { up: 0, ench: [] } }; // k → { up, ench[] }
    this.weapon = r.weapon || 'bazooka';
    this.gear = r.gear || []; this.gearSeq = r.gearSeq ?? 0; this.on = r.on || { hat: 0, top: 0, shoes: 0, acc: 0 };
    this.vehicles = r.vehicles || {}; this.vehicle = r.vehicle || '';
    this.hp = r.hp ?? 100; this.kills = r.kills ?? 0; this.destroyed = r.destroyed ?? 0; this.bossLv = r.bossLv || {};
    this.extra = {}; // 호감도 보너스 능력치
    this.log = [];
  }
  S(k) { return (this.st[k] || 0) + (this.extra[k] || 0); }
  toJSON() { return { lv: this.lv, xp: this.xp, sp: this.sp, rebirth: this.rebirth, st: this.st, weapons: this.weapons, weapon: this.weapon, gear: this.gear, gearSeq: this.gearSeq, on: this.on, vehicles: this.vehicles, vehicle: this.vehicle, hp: this.hp, kills: this.kills, destroyed: this.destroyed, bossLv: this.bossLv }; }
  get need() { return xpNeed(this.lv); }
  get bonus() { return 1 + this.rebirth * 0.1; } // 환생 보너스(코인·경험치)
  // 장비 효과 합
  fx() { const o = {}; for (const s of SLOTS) { const g = this.gear.find((x) => x.id === this.on[s.k]); if (!g) continue; const f = gearFx(g.s, g.r); for (const k in f) o[k] = (o[k] || 0) + f[k] * (1 + g.up * 0.1); } return o; }
  addXp(n) {
    n = Math.round(n * this.bonus * (1 + (this.fx().xp || 0))); if (n <= 0) return 0;
    this.xp += n; let ups = 0;
    while (this.xp >= this.need && this.lv < 9999) { this.xp -= this.need; this.lv++; ups++; }
    if (ups) { this.sp += SP_PER_LEVEL * ups; this.stats.apply({ coins: 50 * ups }); }
    return ups;
  }
  spend(k) { if (this.sp <= 0 || !(k in this.st)) return false; const inv = STATS.find((s) => s.k === k)?.inverse; this.st[k] = clamp(this.st[k] + (inv ? -2 : 2), 0, STAT_MAX); this.sp--; return true; }
  canRebirth() { return this.lv >= 30 + this.rebirth * 10; }
  doRebirth() {
    if (!this.canRebirth()) return false;
    this.rebirth++; this.lv = 1; this.xp = 0; this.sp = 0; this.st = { study: 10, focus: 10, body: 10, stress: 10, project: 10, rep: 10 }; this.stats.coins = 0; this.gear = []; this.on = { hat: 0, top: 0, shoes: 0, acc: 0 };
    return true;
  }
  // ---- 무기 ----
  ownW(k) { return !!this.weapons[k]; }
  buyW(k) { const w = WEAPON_BY[k]; if (!w || this.ownW(k) || !this.stats.canPay(w.price)) return false; this.stats.apply({ coins: -w.price }); this.weapons[k] = { up: 0, ench: [] }; return true; }
  weaponDmg(k = this.weapon) { const w = WEAPON_BY[k], s = this.weapons[k]; if (!w) return 0; const ench = s?.ench || []; return w.dmg * upMult(s?.up || 0) * (1 + this.S('study') * 0.012) * (1 + (this.fx().dmg || 0)) * (ench.includes('big') ? 1.25 : 1); }
  weaponCd(k = this.weapon) { const w = WEAPON_BY[k], s = this.weapons[k]; if (!w) return 1000; const ench = s?.ench || []; return w.cd * (1 - this.S('focus') * 0.004) * (1 + (this.fx().cd || 0)) * (ench.includes('rapid') ? 0.7 : 1); }
  weaponRadius(k = this.weapon) { const w = WEAPON_BY[k], s = this.weapons[k]; if (!w) return 1; const ench = s?.ench || []; return w.r * (1 + this.S('project') * 0.01) * (1 + (this.fx().rad || 0)) * (ench.includes('big') ? 1.4 : 1); }
  upgradeW(k, rnd = Math.random) {
    const w = WEAPON_BY[k], s = this.weapons[k]; if (!w || !s || s.up >= 10) return { ok: false, msg: s?.up >= 10 ? '이미 +10이에요' : '없는 무기예요' };
    const cost = upCost(w, s.up); if (!this.stats.canPay(cost)) return { ok: false, msg: `코인이 모자라요 (${cost.toLocaleString()}원)` };
    this.stats.apply({ coins: -cost });
    if (rnd() < UP_RATE[s.up]) { s.up++; return { ok: true, msg: `강화 성공! ${w.n} +${s.up}` }; }
    const fb = upFallback(s.up); const dropped = s.up - fb; s.up = fb; return { ok: false, fail: true, msg: `강화 실패… ${w.n} +${fb}${dropped ? ` (${dropped}단계 떨어짐)` : ' (유지)'}` };
  }
  enchantW(k, e) {
    const s = this.weapons[k], en = ENCHANTS[e]; if (!s || !en) return { ok: false, msg: '안 돼요' };
    if (s.ench.includes(e)) return { ok: false, msg: '이미 붙어 있어요' };
    if (s.ench.length >= 2) return { ok: false, msg: '인챈트는 무기마다 2개까지' };
    if (!this.stats.canPay(en.p * 10)) return { ok: false, msg: `코인이 모자라요 (${(en.p * 10).toLocaleString()}원)` };
    this.stats.apply({ coins: -en.p * 10 }); s.ench.push(e); return { ok: true, msg: `${WEAPON_BY[k].n}에 ${en.n} 인챈트!` };
  }
  // ---- 장비 ----
  addGear(slot, r, from) { const g = makeGear(slot, r, from); g.id = ++this.gearSeq; this.gear.push(g); return g; }
  equip(id) { const g = this.gear.find((x) => x.id === id); if (!g) return false; this.on[g.s] = this.on[g.s] === id ? 0 : id; return true; }
  gearPrice(g) { return Math.round([30, 80, 200, 350, 500, 1500, 5000][g.r] * 10 * (1 + 0.15 * g.up) / 10) * 10; }
  sellGear(id) { const i = this.gear.findIndex((x) => x.id === id); if (i < 0) return 0; const g = this.gear[i]; if (Object.values(this.on).includes(id)) return 0; const p = Math.round(this.gearPrice(g) * 0.4); this.gear.splice(i, 1); this.stats.apply({ coins: p }); return p; }
  upgradeGear(id, rnd = Math.random) {
    const g = this.gear.find((x) => x.id === id); if (!g || g.up >= 10) return { ok: false, msg: g?.up >= 10 ? '이미 +10이에요' : '없어요' };
    const cost = Math.round(this.gearPrice(g) * 0.5); if (!this.stats.canPay(cost)) return { ok: false, msg: `코인이 모자라요 (${cost.toLocaleString()}원)` };
    this.stats.apply({ coins: -cost });
    if (rnd() < UP_RATE[g.up]) { g.up++; return { ok: true, msg: `강화 성공! ${g.n} +${g.up}` }; }
    const fb = upFallback(g.up); g.up = fb; return { ok: false, fail: true, msg: `강화 실패… ${g.n} +${fb}` };
  }
  fuse(slot, r) {
    const worn = new Set(Object.values(this.on)); const cands = this.gear.filter((g) => g.s === slot && g.r === r && !worn.has(g.id)).sort((a, b) => a.up - b.up);
    if (r >= 6) return { ok: false, msg: '초월은 더 합성할 수 없어요' };
    if (cands.length < 3) return { ok: false, msg: '같은 장비가 3개 있어야 해요 (끼고 있는 건 빼고)' };
    for (const g of cands.slice(0, 3)) this.gear.splice(this.gear.indexOf(g), 1);
    const n = this.addGear(slot, r + 1, '합성'); return { ok: true, msg: `합성 성공! ${n.n} (${GRADES[n.r].n})`, gear: n };
  }
  gachaGear(rnd = Math.random) { // 장비 뽑기 (코인)
    const cost = 2000 + this.lv * 100; if (!this.stats.canPay(cost)) return { ok: false, msg: `코인이 모자라요 (${cost.toLocaleString()}원)` };
    this.stats.apply({ coins: -cost }); const slot = SLOTS[Math.floor(rnd() * 4)].k; const g = this.addGear(slot, rollGearGrade(this.lv, rnd), '뽑기');
    return { ok: true, msg: `${g.n} (${GRADES[g.r].n}) 나왔어요!`, gear: g, cost };
  }
  // ---- 탈것 ----
  buyV(k) { const v = VEHICLE_BY[k]; if (!v || this.vehicles[k] || !this.stats.canPay(v.price)) return false; this.stats.apply({ coins: -v.price }); this.vehicles[k] = { up: 0 }; return true; }
  // ---- 체력 ----
  get maxHp() { return Math.round(100 * (1 + this.S('body') * 0.01) * (1 + (this.fx().hp || 0))); }
  takenMult() { return Math.max(0.3, (1 + this.S('stress') * 0.004 - this.S('rep') * 0.004) * (1 + (this.fx().taken || 0))); }
  runMult() { return 1 + this.S('body') * 0.003 + (this.fx().run || 0); }
}
