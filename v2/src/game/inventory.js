// 가방(인벤토리) — 전 판처럼 칸 36개(핫바 9 + 가방 27), 한 칸에 64개. 블록·재료·음식·도구가 다 들어가요. 제작도 여기서.
import { BLOCKS } from '../world/blocks.js';
import { ITEMS, STACK, RECIPES, itemOf } from './items.js';

export const HOTBAR_N = 9, BAG_N = 36;
const START = [['wooden_pickaxe', 1], ['wooden_axe', 1], ['wooden_shovel', 1], ['PLANKS', 24], ['STONE', 24], ['GRASS', 12], ['BRICK', 12], ['WINDOW', 8], ['bread', 2], ['LOG', 10], ['LEAVES', 16], ['LAMP_HEAD', 4], ['SCHOOL_WALL', 12], ['stick', 8]];

export class Inventory {
  constructor(save = {}) {
    this.slots = new Array(BAG_N).fill(null); // { id, n } | null
    this.onChange = null;
    const sv = save.inv;
    if (sv && Array.isArray(sv.s)) { sv.s.forEach((e, i) => { if (e && i < BAG_N && ITEMS[e[0]]) this.slots[i] = { id: e[0], n: Math.min(STACK, e[1] | 0) }; }); }
    else if (sv && typeof sv === 'object' && Object.keys(sv).length) { // 전 저장: { 블록번호: 개수 }
      for (const [k, n] of START) if (ITEMS[k]?.kind === 'tool') this.add(k, n);
      for (const [bid, n] of Object.entries(sv)) { const key = BLOCKS[+bid]?.key; if (key && n > 0) this.add(key, n); }
    }
    else for (const [k, n] of START) this.add(k, n);
  }
  toJSON() { return { s: this.slots.map((s) => (s ? [s.id, s.n] : 0)) }; }
  // 번호(블록 id) 또는 아이템 id
  static key(id) { return typeof id === 'number' ? BLOCKS[id]?.key : id; }
  count(id) { const k = Inventory.key(id); let n = 0; for (const s of this.slots) if (s && s.id === k) n += s.n; return n; }
  // 넣기 — 못 넣은 개수를 돌려줘요(가방이 꽉 차면)
  add(id, n = 1) {
    const k = Inventory.key(id); if (!k || !ITEMS[k] || n <= 0) return n;
    for (const s of this.slots) { if (n <= 0) break; if (s && s.id === k && s.n < STACK) { const t = Math.min(STACK - s.n, n); s.n += t; n -= t; } }
    for (let i = 0; i < BAG_N && n > 0; i++) if (!this.slots[i]) { const t = Math.min(STACK, n); this.slots[i] = { id: k, n: t }; n -= t; }
    this.onChange?.(); return n;
  }
  // 빼기 — 부족하면 false(아무것도 안 뺌)
  remove(id, n = 1) {
    const k = Inventory.key(id); if (this.count(k) < n) return false;
    for (let i = BAG_N - 1; i >= 0 && n > 0; i--) { const s = this.slots[i]; if (s && s.id === k) { const t = Math.min(s.n, n); s.n -= t; n -= t; if (s.n <= 0) this.slots[i] = null; } }
    this.onChange?.(); return true;
  }
  // 칸에서 빼기
  takeAt(i, n = 1) { const s = this.slots[i]; if (!s) return false; s.n -= n; if (s.n <= 0) this.slots[i] = null; this.onChange?.(); return true; }
  // 칸 옮기기: 같은 아이템이면 합치고, 다르면 서로 바꿔요
  move(a, b) {
    if (a === b || a < 0 || b < 0 || a >= BAG_N || b >= BAG_N) return;
    const A = this.slots[a], Bb = this.slots[b];
    if (A && Bb && A.id === Bb.id && Bb.n < STACK) { const t = Math.min(STACK - Bb.n, A.n); Bb.n += t; A.n -= t; if (A.n <= 0) this.slots[a] = null; }
    else { this.slots[a] = Bb; this.slots[b] = A; }
    this.onChange?.();
  }
  split(a) { const s = this.slots[a]; if (!s || s.n < 2) return false; const e = this.slots.indexOf(null); if (e < 0) return false; const h = Math.floor(s.n / 2); s.n -= h; this.slots[e] = { id: s.id, n: h }; this.onChange?.(); return true; }
  drop(a) { if (!this.slots[a]) return; this.slots[a] = null; this.onChange?.(); }
  get free() { return this.slots.filter((s) => !s).length; }
  get isFull() { return this.free === 0; }
  item(i) { const s = this.slots[i]; return s ? itemOf(s.id) : null; }
  // ---- 제작 ----
  canCraft(r) { return r.ins.every(([id, n]) => this.count(id) >= n); }
  maxCraft(r) { return Math.min(...r.ins.map(([id, n]) => Math.floor(this.count(id) / n))); }
  craft(r, times = 1) {
    times = Math.min(times, this.maxCraft(r)); if (times <= 0) return 0;
    // 결과가 들어갈 자리가 있는지(재료를 뺀 뒤 남는 칸 포함) 간단히 확인
    const need = r.n * times, room = this.count(r.out) % STACK ? STACK - (this.count(r.out) % STACK) : 0;
    const emptyAfter = this.free + r.ins.filter(([id, n]) => this.count(id) === n * times).length;
    if (need > room + emptyAfter * STACK) return -1;
    for (const [id, n] of r.ins) this.remove(id, n * times);
    this.add(r.out, need); return times;
  }
  recipes() { return RECIPES; }
}
