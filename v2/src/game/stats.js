// 상태(배고픔·에너지·스트레스·용돈·성적·체력) + 하루 일과표(실제 마이폴 시간표) + 출석.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 일과 한 칸: t = 시작 시각(시), len = 길이(시간), place = 장소 종류(아래 PLACE_GROUPS), act = 활동
// 실제 시간표: 06:50 기상 점호 · 08:00 아침 · 09:20~12:00 수업 · 12:00 점심 · 13:00~15:40 수업 · 16:10~18:00 IR · 18:00 저녁 · 19:00~21:00 자습 · 20:30 간식(월수금) · 22:00 점호·취침 · 수요일 채플
export const SCHEDULE = [
  { t: 6.83, len: 0.67, name: '기상 점호', place: 'dorm', act: 'rollcall', fx: { stress: -2 } },
  { t: 8.0, len: 0.9, name: '아침 식사', place: 'cafeteria', act: 'eat' },
  { t: 9.33, len: 1.25, name: '1교시', place: 'class', act: 'class' },
  { t: 10.67, len: 1.33, name: '2교시', place: 'class', act: 'class', wedChapel: true },
  { t: 12.0, len: 1.0, name: '점심 식사', place: 'cafeteria', act: 'eat' },
  { t: 13.0, len: 1.3, name: '3교시', place: 'class', act: 'class' },
  { t: 14.33, len: 1.33, name: '4교시', place: 'class', act: 'class' },
  { t: 16.17, len: 1.83, name: 'IR 연구', place: 'lab', act: 'research' },
  { t: 18.0, len: 1.0, name: '저녁 식사', place: 'cafeteria', act: 'eat' },
  { t: 19.0, len: 2.0, name: '자습', place: 'study', act: 'study' },
  { t: 20.5, len: 0.5, name: '간식 시간', place: 'snack', act: 'snack', days: [0, 2, 4] },
  { t: 22.0, len: 1.0, name: '점호 · 취침', place: 'myroom', act: 'sleep' },
];
export const WEEKEND = [
  { t: 8.0, len: 1.0, name: '늦잠 기상', place: 'dorm', act: 'rollcall', fx: { stress: -2 } },
  { t: 9.0, len: 1.0, name: '아침 식사', place: 'cafeteria', act: 'eat' },
  { t: 10.5, len: 1.5, name: '자유 운동', place: 'sport', act: 'sport' },
  { t: 12.0, len: 1.0, name: '점심 식사', place: 'cafeteria', act: 'eat' },
  { t: 14.0, len: 1.5, name: '주일 예배', place: 'chapel', act: 'chapel', days: [6] },
  { t: 14.0, len: 2.0, name: '텃밭 가꾸기', place: 'garden', act: 'garden', days: [5] },
  { t: 18.0, len: 1.0, name: '저녁 식사', place: 'cafeteria', act: 'eat' },
  { t: 19.5, len: 1.5, name: '자습', place: 'study', act: 'study' },
  { t: 22.0, len: 1.0, name: '점호 · 취침', place: 'myroom', act: 'sleep' },
];
// 일과의 장소 종류 → 실제 장소 키들
export const PLACE_GROUPS = {
  dorm: ['dorm', 'myroom', 'lounge', 'dormoffice'],
  myroom: ['myroom'],
  cafeteria: ['cafeteria'],
  class: ['class', 'lab'],
  lab: ['lab', 'lab2', 'workshop'],
  study: ['reading', 'chapel', 'dormstudy', 'class', 'club'],
  snack: ['store', 'cafeteria', 'lounge'],
  sport: ['field', 'basketball', 'fitness', 'outgym'],
  chapel: ['chapel'],
  garden: ['garden'],
};
export const LABEL = { hunger: '배부름', energy: '에너지', stress: '스트레스', coins: '용돈', grade: '성적', fitness: '체력' };

export class Stats {
  constructor(save = {}) {
    const s = save.stats || {};
    this.hunger = s.hunger ?? 70; this.energy = s.energy ?? 85; this.stress = s.stress ?? 20;
    this.coins = s.coins ?? 12000; this.grade = s.grade ?? 50; this.fitness = s.fitness ?? 40;
    this.day = s.day ?? 1; this.attended = new Set(s.attended || []); this.missed = s.missed ?? 0; this.attendCount = s.attendCount ?? 0;
    this.daily = s.daily || {}; // 하루 한 번짜리 행동 기록 { key: day }
    this.total = s.total || { quests: 0, quizOk: 0, quizAll: 0, days: 0, earned: 0 };
  }
  toJSON() { return { hunger: this.hunger, energy: this.energy, stress: this.stress, coins: this.coins, grade: this.grade, fitness: this.fitness, day: this.day, attended: [...this.attended], missed: this.missed, attendCount: this.attendCount, daily: this.daily, total: this.total }; }
  get weekday() { return (this.day - 1) % 7; }
  get weekdayName() { return WEEKDAYS[this.weekday]; }
  get isWeekend() { return this.weekday >= 5; }
  schedule() {
    const wd = this.weekday, sch = this.isWeekend ? WEEKEND : SCHEDULE;
    return sch.filter((e) => !e.days || e.days.includes(wd)).map((e) => (e.wedChapel && wd === 2) ? { ...e, name: '채플', place: 'chapel', act: 'chapel' } : e);
  }
  // 시간이 흐를 때 (게임 시간 단위: 시간)
  tick(hours, ctx = {}) {
    if (hours <= 0) return;
    this.hunger = clamp(this.hunger - hours * (ctx.running ? 9 : ctx.sleeping ? 2.5 : 5), 0, 100);
    this.energy = clamp(this.energy - hours * (ctx.running ? 7 : ctx.sleeping ? -14 : 3.2), 0, 100);
    if (this.hunger < 15) this.stress = clamp(this.stress + hours * 4, 0, 100);
    if (this.energy < 15) this.stress = clamp(this.stress + hours * 3, 0, 100);
    this.grade = clamp(this.grade - hours * 0.15, 0, 100); // 안 배우면 조금씩 잊어버림
    this.fitness = clamp(this.fitness - hours * 0.12, 0, 100);
  }
  apply(fx) {
    const before = { ...this.toJSON() };
    for (const k of ['hunger', 'energy', 'stress', 'grade', 'fitness']) if (fx[k]) this[k] = clamp(this[k] + fx[k], 0, 100);
    if (fx.coins) { this.coins = Math.max(0, this.coins + fx.coins); if (fx.coins > 0) this.total.earned += fx.coins; }
    const parts = [];
    for (const k of Object.keys(LABEL)) { const d = (k === 'coins' ? this.coins - before.coins : this[k] - before[k]); if (Math.abs(d) >= 0.5) parts.push(`${LABEL[k]} ${d > 0 ? '+' : ''}${k === 'coins' ? Math.round(d).toLocaleString() + '원' : Math.round(d)}`); }
    return parts.join(' · ');
  }
  canPay(c) { return this.coins >= c; }
  // 하루 한 번만 되는 행동
  didToday(key) { return this.daily[key] === this.day; }
  markToday(key) { this.daily[key] = this.day; }
  // 지금 일정(출석 가능한 것)
  current(time) { return this.schedule().find((e) => time >= e.t && time < e.t + e.len) || null; }
  next(time) { return this.schedule().find((e) => e.t > time) || null; }
  attend(ev) { const key = `${this.day}:${ev.name}`; if (this.attended.has(key)) return false; this.attended.add(key); this.attendCount++; return true; }
  isAttended(ev) { return this.attended.has(`${this.day}:${ev.name}`); }
  // 새 날
  newDay() { this.day++; this.attended.clear(); this.total.days++; }
  warnings() {
    const w = [];
    if (this.hunger < 20) w.push('배고파요 — 식당 · 매점 · 편의점');
    if (this.energy < 20) w.push('너무 피곤해요 — 생활관에서 자요');
    if (this.stress > 80) w.push('스트레스가 높아요 — 농구장 · 노래방 · 정자 · 상담실');
    return w;
  }
}
