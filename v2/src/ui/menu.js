// 메뉴 — 능력치(레벨·환생) · 가방(블록·무기·장비·탈것) · 상점(무기 24·장비 뽑기·탈것 24). 전 판 구성.
import { ITEMS, RECIPES, CATS, itemOf } from '../game/items.js';
import { HOTBAR_N } from '../game/inventory.js';
import { STATS, WEAPONS, WEAPON_BY, ENCHANTS, GRADE6, GRADES, SLOTS, VEHICLES, VEHICLE_BY, UP_RATE, upCost, xpNeed, FX_LABEL, gearFx } from '../game/rpg.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const won = (n) => Math.round(n).toLocaleString() + '원';
const pct = (v) => Math.round(v * 100) + '%';
const TABS = [['stat', '능력치'], ['bag', '가방'], ['craft', '제작'], ['shop', '상점'], ['ride', '탈것']];
const FX_N = { hunger: '배부름', energy: '에너지', stress: '스트레스', grade: '성적', fitness: '체력', coins: '코인' };
const fxText = (fx) => Object.entries(fx || {}).map(([k, v]) => `${FX_N[k] || k} ${v > 0 ? '+' : ''}${v}`).join(' · ');

export class Menu {
  constructor(app) {
    this.app = app; this.open = false; this.tab = 'stat'; this.el = $('menuPanel'); this.selSlot = -1; this.craftCat = '블록';
    $('menuClose').onclick = () => this.toggle(false);
    $('menuTabs').innerHTML = TABS.map(([k, n]) => `<button class="btn mt" data-tab="${k}">${n}</button>`).join('');
    $('menuTabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) { this.tab = b.dataset.tab; this.render(); } };
    $('menuBody').onclick = (e) => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act, b.dataset.a, b.dataset.b); };
    window.addEventListener('keydown', (e) => { if (this.open && e.code === 'Escape') { e.preventDefault(); this.toggle(false); } }, true);
  }
  toggle(force, tab) {
    this.open = force ?? !this.open; if (tab) this.tab = tab;
    this.el.hidden = !this.open; this.app.input.uiOpen = this.open || this.app.dialog.open || this.app.hud.settingsOpen;
    if (this.open) { this.app.input.releaseLock(); this.app.input.keys.clear(); this.render(); }
  }
  toast(t) { this.app.hud.tip(t, 4); }
  act(a, x, y) {
    const app = this.app, rpg = app.rpg, s = app.stats;
    switch (a) {
      case 'sp': if (rpg.spend(x)) this.toast(`${STATS.find((t) => t.k === x).n} ${STATS.find((t) => t.k === x).inverse ? '−2' : '+2'}`); break;
      case 'rebirth': app.dialog.show({ title: '환생할까요?', lines: [`레벨 · 코인 · 능력치 · 장비는 처음부터. 무기(강화 포함) · 탈것 · 심부름 기록은 그대로.`, `환생하면 코인 · 경험치가 영원히 +10% (지금 +${rpg.rebirth * 10}%), 이름 앞에 ★이 붙어요.`], options: [{ label: '환생하기', accent: true, run: () => { if (rpg.doRebirth()) { this.toast(`★ ${rpg.rebirth}번째 환생! 코인·경험치 +${rpg.rebirth * 10}%`); app.saveNow(); } this.render(); return false; } }, { label: '아직', run: () => false }] }); return;
      case 'equipW': rpg.weapon = x; app.combat.toggleArmed(true); this.toast(`${WEAPON_BY[x].n} 장착 — 왼쪽 클릭(발사 버튼)으로 쏴요`); break;
      case 'buyW': this.toast(rpg.buyW(x) ? `${WEAPON_BY[x].n} 샀어요!` : '코인이 모자라요'); break;
      case 'upW': { const r = rpg.upgradeW(x); this.toast(r.msg); break; }
      case 'enchW': { const w = WEAPON_BY[x], st = rpg.weapons[x]; app.dialog.show({ title: `${w.n} 인챈트`, sub: `지금: ${st.ench.map((e) => ENCHANTS[e].n).join(', ') || '없음'} · 무기마다 2개까지`, options: Object.entries(ENCHANTS).map(([k, en]) => ({ label: `${en.n} — ${won(en.p * 10)}`, sub: en.d, disabled: st.ench.includes(k) || st.ench.length >= 2, run: () => { const r = rpg.enchantW(x, k); this.toast(r.msg); this.render(); return false; } })) }); return; }
      case 'equipG': rpg.equip(+x); break;
      case 'upG': { const r = rpg.upgradeGear(+x); this.toast(r.msg); break; }
      case 'sellG': { const p = rpg.sellGear(+x); this.toast(p ? `팔았어요 +${won(p)}` : '끼고 있는 장비는 못 팔아요'); break; }
      case 'fuse': { const r = rpg.fuse(x, +y); this.toast(r.msg); break; }
      case 'gacha': { const r = rpg.gachaGear(); this.toast(r.msg); break; }
      case 'buyV': this.toast(rpg.buyV(x) ? `${VEHICLE_BY[x].n} 샀어요!` : '코인이 모자라요'); break;
      case 'rideV': rpg.vehicle = x; app.ride?.set(x); this.toast(x ? `${VEHICLE_BY[x].n} 탔어요 — 걷기가 ${VEHICLE_BY[x].spd}배 빨라요` : '내렸어요'); break;
      case 'tab': this.tab = x; break;
      // ---- 가방 ----
      case 'slot': { const i = +x; if (this.selSlot < 0) { if (app.inv.slots[i]) this.selSlot = i; } else if (this.selSlot === i) this.selSlot = -1; else { app.inv.move(this.selSlot, i); this.selSlot = -1; } break; }
      case 'eat': if (app.builder.eat(this.selSlot)) { if (!app.inv.slots[this.selSlot]) this.selSlot = -1; } break;
      case 'tohb': { const i = this.selSlot; if (i >= 0) { let e = -1; for (let k = 0; k < HOTBAR_N; k++) if (!app.inv.slots[k]) { e = k; break; } if (e < 0) e = app.builder.sel; if (i !== e) app.inv.move(i, e); this.selSlot = -1; } break; }
      case 'split': app.inv.split(this.selSlot); break;
      case 'drop': { const sl = app.inv.slots[this.selSlot]; if (sl) { const it = itemOf(sl.id); app.inv.drop(this.selSlot); this.toast(`${it.n} ${sl.n}개를 버렸어요`); } this.selSlot = -1; break; }
      case 'hold': { const i = this.selSlot; if (i >= 0 && i < HOTBAR_N) { app.builder.sel = i; if (!app.builder.active) app.builder.toggle(); this.toast(`${itemOf(app.inv.slots[i].id).n} 들었어요`); } break; }
      // ---- 제작 ----
      case 'ccat': this.craftCat = x; break;
      case 'craft': { const r = RECIPES[+x]; const n = app.inv.craft(r, +y || 1); const it = itemOf(r.out); this.toast(n > 0 ? `${it.icon} ${it.n} ${r.n * n}개 만들었어요` : n < 0 ? '가방에 자리가 없어요' : '재료가 모자라요'); break; }
    }
    app.hud.refreshStats(); this.render();
  }
  render() {
    for (const b of $('menuTabs').querySelectorAll('[data-tab]')) b.classList.toggle('on', b.dataset.tab === this.tab);
    const f = { stat: this.rStat, bag: this.rBag, craft: this.rCraft, shop: this.rShop, ride: this.rRide }[this.tab] || this.rStat;
    $('menuBody').innerHTML = f.call(this);
  }
  rStat() {
    const rpg = this.app.rpg, s = this.app.stats, fx = rpg.fx();
    const bar = `<div class="xp"><i style="width:${Math.min(100, rpg.xp / rpg.need * 100).toFixed(1)}%"></i></div>`;
    return `<div class="card"><div class="row"><b>${rpg.rebirth ? '★'.repeat(Math.min(5, rpg.rebirth)) + ' ' : ''}Lv.${rpg.lv}</b><span>경험치 ${rpg.xp} / ${xpNeed(rpg.lv)}</span></div>${bar}
      <div class="row"><span>체력 ${Math.round(rpg.hp)} / ${rpg.maxHp} · 능력치 포인트 <b class="acc">${rpg.sp}</b></span><span>코인 <b class="acc">${won(s.coins)}</b></span></div></div>
      <div class="grid2">${STATS.map((t) => `<div class="card st"><div class="row"><b>${t.icon} ${t.n}</b><b class="acc">${rpg.st[t.k]}</b></div><small>${t.d}</small><button class="btn mini" data-act="sp" data-a="${t.k}" ${rpg.sp > 0 ? '' : 'disabled'}>+ 포인트 쓰기 (${t.inverse ? '−2' : '+2'})</button></div>`).join('')}</div>
      <div class="card"><div class="row"><b>장비 효과</b><span>${Object.keys(fx).length ? Object.entries(fx).map(([k, v]) => `${FX_LABEL[k]} ${v > 0 ? '+' : ''}${pct(v)}`).join(' · ') : '없음'}</span></div>
      <div class="row"><span>부순 블록 ${rpg.destroyed.toLocaleString()} · 보스 ${rpg.kills}번 · 환생 ${rpg.rebirth}번</span><button class="btn mini ${rpg.canRebirth() ? 'acc' : ''}" data-act="rebirth" ${rpg.canRebirth() ? '' : 'disabled'}>환생 (Lv.${30 + rpg.rebirth * 10}부터)</button></div></div>
      <div class="card"><div class="row"><b>학교생활</b><span>배부름 ${Math.round(s.hunger)} · 에너지 ${Math.round(s.energy)} · 스트레스 ${Math.round(s.stress)} · 성적 ${Math.round(s.grade)} · 체력 ${Math.round(s.fitness)}</span></div><small>D+${s.day} ${s.weekdayName}요일 · 출석 ${s.attendCount} · 결석 ${s.missed} · 심부름 ${s.total.quests}번 · 퀴즈 ${s.total.quizOk}/${s.total.quizAll}</small></div>`;
  }
  rBag() {
    const app = this.app, rpg = app.rpg, b = app.builder;
    const inv = app.inv, sel = this.selSlot, selIt = sel >= 0 && inv.slots[sel] ? itemOf(inv.slots[sel].id) : null;
    const grid = inv.slots.map((s, i) => { const it = s ? itemOf(s.id) : null; return `<div class="islot${i < HOTBAR_N ? ' hb' : ''}${i === b.sel ? ' on' : ''}${i === sel ? ' sel' : ''}" data-act="slot" data-a="${i}" title="${it ? it.n : ''}">${i < HOTBAR_N ? `<i>${i + 1}</i>` : ''}${it ? it.icon : ''}${s && it.kind !== 'tool' ? `<em>${s.n}</em>` : ''}</div>`; }).join('');
    const info = selIt ? `<div class="row isel"><span><b>${selIt.icon} ${selIt.n}</b> <small>× ${inv.slots[sel].n} · ${{ block: '블록 — 핫바에 두고 놓기', mat: '재료 — 제작에 써요', food: '음식 — ' + fxText(selIt.fx), tool: `도구 — 캐는 속도 ×${selIt.speed}` }[selIt.kind] || ''}</small></span>
      <span class="btns">${selIt.kind === 'food' ? '<button class="btn mini acc" data-act="eat">먹기</button>' : ''}${sel < HOTBAR_N ? '<button class="btn mini acc" data-act="hold">손에 들기</button>' : '<button class="btn mini" data-act="tohb">핫바로</button>'}<button class="btn mini" data-act="split" ${inv.slots[sel].n > 1 ? '' : 'disabled'}>반 나누기</button><button class="btn mini" data-act="drop">버리기</button></span></div>` : `<small>칸을 누르면 고르고, 다른 칸을 누르면 옮겨요 · 윗줄 9칸이 핫바(숫자 키) · 빈 칸 ${inv.free}</small>`;
    const blocks = `<div class="inv">${grid}</div>${info}`;
    const weapons = Object.keys(rpg.weapons).map((k) => { const w = WEAPON_BY[k], st = rpg.weapons[k], g = GRADE6[w.g], on = rpg.weapon === k; return `<div class="card w ${on ? 'on' : ''}"><div class="row"><b style="color:${g.c}">${w.e} ${w.n}${st.up ? ` +${st.up}` : ''}</b><span style="color:${g.c}">${g.n}</span></div><small>${w.d} · 피해 ${Math.round(rpg.weaponDmg(k))} · 재사용 ${(rpg.weaponCd(k) / 1000).toFixed(2)}초 · 범위 ${rpg.weaponRadius(k).toFixed(1)}m${st.ench.length ? ' · ' + st.ench.map((e) => `<i style="color:${ENCHANTS[e].c}">${ENCHANTS[e].n}</i>`).join(' ') : ''}</small>
      <div class="btns"><button class="btn mini ${on ? 'acc' : ''}" data-act="equipW" data-a="${k}">${on ? '장착 중' : '장착'}</button><button class="btn mini" data-act="upW" data-a="${k}" ${st.up >= 10 ? 'disabled' : ''}>강화 +${Math.min(10, st.up + 1)} · ${won(upCost(w, st.up))} · ${Math.round((UP_RATE[st.up] || 0) * 100)}%</button><button class="btn mini" data-act="enchW" data-a="${k}">인챈트</button></div></div>`; }).join('');
    const worn = new Set(Object.values(rpg.on));
    const gear = SLOTS.map((sl) => { const items = rpg.gear.filter((g) => g.s === sl.k).sort((a, b) => b.r - a.r || b.up - a.up); const groups = {}; for (const g of items) if (!worn.has(g.id)) groups[g.r] = (groups[g.r] || 0) + 1;
      return `<div class="card"><div class="row"><b>${sl.n}</b><span>${items.length}개 · 끼는 중: ${(items.find((g) => g.id === rpg.on[sl.k]) || {}).n || '없음'}</span></div>${items.map((g) => { const fx = gearFx(g.s, g.r); const on = rpg.on[sl.k] === g.id; return `<div class="row gi"><span><b style="color:${GRADES[g.r].c}">${g.n}${g.up ? ` +${g.up}` : ''}</b> <small>${GRADES[g.r].n} · ${Object.entries(fx).map(([k, v]) => `${FX_LABEL[k]} ${v > 0 ? '+' : ''}${pct(v * (1 + g.up * 0.1))}`).join(' · ')}</small></span><span class="btns"><button class="btn mini ${on ? 'acc' : ''}" data-act="equipG" data-a="${g.id}">${on ? '빼기' : '끼기'}</button><button class="btn mini" data-act="upG" data-a="${g.id}" ${g.up >= 10 ? 'disabled' : ''}>강화 ${Math.round((UP_RATE[g.up] || 0) * 100)}%</button><button class="btn mini" data-act="sellG" data-a="${g.id}" ${on ? 'disabled' : ''}>팔기</button></span></div>`; }).join('') || '<small>없어요 — 상점에서 뽑거나 보스를 잡으면 나와요</small>'}
      ${Object.entries(groups).filter(([, n]) => n >= 3).map(([r]) => `<button class="btn mini" data-act="fuse" data-a="${sl.k}" data-b="${r}">${GRADES[r].n} 3개 합성 → ${GRADES[Math.min(6, +r + 1)].n}</button>`).join('')}</div>`; }).join('');
    return `<div class="card"><div class="row"><b>🎒 가방 (${inv.slots.filter(Boolean).length}/36칸)</b><button class="btn mini" data-act="tab" data-a="craft">🔨 제작하기</button></div>${blocks}</div><h4>🔫 무기 (${Object.keys(rpg.weapons).length}/24) — 왼쪽 클릭 · 발사 버튼 · R 로 꺼내고 넣기</h4>${weapons}<h4>🎽 장비 (${rpg.gear.length})</h4>${gear}`;
  }
  rCraft() {
    const inv = this.app.inv, cat = this.craftCat;
    const tabs = CATS.map((c) => `<button class="btn mini ${c === cat ? 'acc' : ''}" data-act="ccat" data-a="${c}">${c}</button>`).join('');
    const rows = RECIPES.map((r, i) => ({ r, i })).filter(({ r }) => r.cat === cat).sort((a, b) => (inv.canCraft(b.r) ? 1 : 0) - (inv.canCraft(a.r) ? 1 : 0)).map(({ r, i }) => {
      const it = itemOf(r.out), can = inv.canCraft(r), mx = inv.maxCraft(r);
      const ins = r.ins.map(([id, n]) => { const ii = itemOf(id), h = inv.count(id); return `<span class="${h >= n ? 'ok' : 'no'}">${ii.icon} ${ii.n} ${h}/${n}</span>`; }).join(' + ');
      return `<div class="row gi rc ${can ? 'can' : ''}"><span><b>${it.icon} ${it.n}</b> <small>× ${r.n}</small><br><small>${ins}</small></span><span class="btns"><button class="btn mini ${can ? 'acc' : ''}" data-act="craft" data-a="${i}" data-b="1" ${can ? '' : 'disabled'}>만들기</button>${mx >= 5 ? `<button class="btn mini" data-act="craft" data-a="${i}" data-b="${Math.min(10, mx)}">×${Math.min(10, mx)}</button>` : ''}</span></div>`; }).join('');
    return `<div class="card"><div class="row"><b>🔨 제작</b><span class="btns">${tabs}</span></div><small>재료는 블록을 캐서 모아요 · 통나무 → 판자 → 막대기 → 도구 · 돌·철·다이아 도구는 더 빨리 캐요 · 금 주괴·다이아몬드·네더라이트는 보스가 떨어뜨려요</small></div><div class="card">${rows || '<small>없어요</small>'}</div>`;
  }
  rShop() {
    const rpg = this.app.rpg, s = this.app.stats;
    const ws = WEAPONS.map((w) => { const g = GRADE6[w.g], own = rpg.ownW(w.k); return `<div class="row gi"><span><b style="color:${g.c}">${w.e} ${w.n}</b> <small style="color:${g.c}">${g.n}</small><br><small>${w.d} · 피해 ${w.dmg} · 재사용 ${(w.cd / 1000).toFixed(2)}초</small></span><button class="btn mini ${own ? '' : s.canPay(w.price) ? 'acc' : ''}" data-act="buyW" data-a="${w.k}" ${own || !s.canPay(w.price) ? 'disabled' : ''}>${own ? '가지고 있어요' : won(w.price)}</button></div>`; }).join('');
    const gcost = 2000 + rpg.lv * 100;
    return `<div class="card"><div class="row"><b>코인 <span class="acc">${won(s.coins)}</span></b><span>코인은 심부름 · 수업 퀴즈 · 출석 · 텃밭 · 학교 부수기 · 보스로 벌어요</span></div></div>
      <div class="card"><div class="row"><b>🎽 장비 뽑기</b><button class="btn mini ${s.canPay(gcost) ? 'acc' : ''}" data-act="gacha" ${s.canPay(gcost) ? '' : 'disabled'}>뽑기 ${won(gcost)}</button></div><small>모자 · 옷 · 신발 · 장신구 중 하나 · 레벨이 높을수록 좋은 등급이 잘 나와요 · 같은 등급 3개는 합성</small></div>
      <h4>🔫 무기 24종</h4><div class="card">${ws}</div>`;
  }
  rRide() {
    const rpg = this.app.rpg, s = this.app.stats;
    const rows = VEHICLES.map((v) => { const g = GRADE6[v.g], own = !!rpg.vehicles[v.k], on = rpg.vehicle === v.k; return `<div class="row gi"><span><b style="color:${g.c}">${v.e} ${v.n}</b> <small style="color:${g.c}">${g.n}</small> <small>· 걷기 ${v.spd}배</small></span><span class="btns">${own ? `<button class="btn mini ${on ? 'acc' : ''}" data-act="rideV" data-a="${on ? '' : v.k}">${on ? '내리기' : '타기'}</button>` : `<button class="btn mini ${s.canPay(v.price) ? 'acc' : ''}" data-act="buyV" data-a="${v.k}" ${s.canPay(v.price) ? '' : 'disabled'}>${won(v.price)}</button>`}</span></div>`; }).join('');
    return `<div class="card"><div class="row"><b>🛴 탈것 24종</b><span>${rpg.vehicle ? `타는 중: ${VEHICLE_BY[rpg.vehicle].n}` : '걷는 중'} · 코인 <span class="acc">${won(s.coins)}</span></span></div><small>타면 걷기가 빨라져요 · 건물 안에서는 자동으로 내려요 · 노란 차(E)는 따로</small></div><div class="card">${rows}</div>`;
  }
}
