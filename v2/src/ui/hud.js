// HUD — 시계 · 날짜 · 장소 · 일과 · 상태 바 · 심부름 · 안내줄(E) · 성능 · 설정 · 핫바 · 안내.
import { itemOf } from '../game/items.js';
import { PRESETS } from '../render/quality.js';

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const hm = (t) => `${pad(Math.floor(t) % 24)}:${pad(Math.floor((t - Math.floor(t)) * 60))}`;

export class HUD {
  constructor(app) {
    this.app = app; this.draggingTime = false; this.tipT = 0; this.statT = 0;
    const { input, sky, builder } = app;
    $('selQuality').value = app.tierName;
    $('selQuality').onchange = (e) => app.changeQuality(e.target.value, true);
    $('chkDyn').checked = app.dyn.enabled; $('chkDyn').onchange = (e) => { app.dyn.enabled = e.target.checked; app.save.dyn = e.target.checked; if (!e.target.checked) { app.dyn.scale = 1; app.dyn.apply(); } app._store(); };
    const rt = $('rngTime'); rt.value = sky.time;
    rt.oninput = () => { this.draggingTime = true; sky.time = +rt.value; };
    rt.onchange = () => { this.draggingTime = false; };
    $('selFlow').value = String(app.save.flow ?? 1); $('selFlow').onchange = (e) => { app.timeFlow = +e.target.value; app.save.flow = app.timeFlow; app._store(); };
    $('rngFov').value = app.save.fov || 72; $('rngFov').oninput = (e) => { app.camera.fov = +e.target.value * Math.PI / 180; app.save.fov = +e.target.value; app._store(); };
    $('chkStats').onchange = (e) => { $('fps').hidden = !e.target.checked; };
    $('btnSettings').onclick = () => this.toggleSettings();
    $('btnBuild').onclick = () => { builder.toggle(); };
    $('btnCar').onclick = () => input.edges.add('action');
    $('btnMenu').onclick = () => app.menu.toggle(undefined, 'stat');
    $('btnBag').onclick = () => app.menu.toggle(undefined, 'bag');
    $('btnWeapon').onclick = () => input.edges.add('weapon');
    builder.onChange = () => this.renderHotbar();
    builder.onTip = (t) => this.tip(t, 4);
    this.renderHotbar();
    this.zones = app.props.zones;
    this.lastZone = '';
    this.settingsOpen = false;
    window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && this.settingsOpen) this.toggleSettings(false); });
    this.tip(app.mobile ? '왼쪽 조이스틱으로 걷고, 오른쪽 화면을 밀어 둘러봐요. 장소에서 E 버튼!' : '마우스로 둘러보고 W A S D 로 걸어요. 장소 앞에서 E — 먹고, 수업 듣고, 심부름하고, 자요!', 9);
    this.refreshStats();
    // 채팅 입력
    this.chatOpen = false;
    const cin = $('cIn');
    cin.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); this.sendChat(); } if (e.key === 'Escape') { e.preventDefault(); this.openChat(false); } });
    $('cSend').onclick = () => this.sendChat();
  }
  openChat(open = true) {
    this.chatOpen = open; $('chat').hidden = !open && !$('cList').children.length; $('cInWrap').hidden = !open;
    this.app.input.uiOpen = open || this.settingsOpen || this.app.dialog.open;
    if (open) { this.app.input.releaseLock(); this.app.input.keys.clear(); setTimeout(() => $('cIn').focus(), 30); } else { $('cIn').blur(); this.app.canvas.focus(); }
  }
  sendChat() {
    const v = $('cIn').value.trim(); $('cIn').value = '';
    if (v) { if (this.app.net?.transport) this.app.net.chat(v); else this.tip('채팅은 같이 하기(서버 접속) 중에만 돼요 — 첫 화면에서 같이 하기'); }
    this.openChat(false);
  }
  toggleSettings(force) {
    this.settingsOpen = force ?? !this.settingsOpen;
    $('settings').hidden = !this.settingsOpen;
    this.app.input.uiOpen = this.settingsOpen || this.app.dialog.open;
    if (this.settingsOpen) this.app.input.releaseLock();
  }
  renderHotbar() {
    const b = this.app.builder, el = $('hotbar');
    el.hidden = !b.active; $('cross').hidden = !b.active; if (!b.active) $('breakBar').hidden = true;
    if (!b.active) return;
    el.innerHTML = b.slots.map((s, i) => { const it = s ? itemOf(s.id) : null; return `<div class="slot${i === b.sel ? ' on' : ''}${!s ? ' empty' : ''}${it && it.kind !== 'block' ? ' ' + it.kind : ''}" data-i="${i}" title="${it ? it.n : '빈 칸'}"><i>${i + 1}</i>${it ? it.icon : ''}${s && it.kind !== 'tool' ? `<em>${s.n}</em>` : ''}</div>`; }).join('');
    for (const sl of el.querySelectorAll('.slot')) sl.onclick = () => { const i = +sl.dataset.i; if (b.sel === i && b.item?.kind === 'food') { b.eat(i); return; } b.sel = i; this.renderHotbar(); };
    this.tip(`짓기: ${b.describe()} · ${this.app.mobile ? '캐기 버튼 꾹 · 놓기 버튼' : '좌클릭 꾹 캐기 · 우클릭 놓기 · 휠/Q 칸 바꾸기 · I 가방 · X 끄기'}`, 4);
  }
  tip(text, sec = 4) { const t = $('tip'); t.textContent = text; t.hidden = false; this.tipT = sec; }
  // ---- 보스전 ----
  bossIntro(d, lv, maxHp) { $('biSub').textContent = `${d.t} · 보스 Lv.${lv + 1}`; $('biName').textContent = d.n; $('biSig').textContent = `필살기: ${d.sn}`; $('bossIntro').hidden = false; setTimeout(() => { $('bossIntro').hidden = true; }, 2600); $('bossbar').hidden = false; $('bossName').textContent = `${d.n} · ${d.t}`; this.bossText('대결 시작! 공격을 피하면서 쏴요', 3); }
  bossBar(b) { $('bossHp').style.width = `${Math.max(0, b.hp / b.maxHp * 100).toFixed(1)}%`; $('bossPh').textContent = `${b.phase === 3 ? '광폭화' : b.phase + '페이즈'} · ${Math.max(0, Math.round(b.hp))} / ${b.maxHp}${b.shield > 0 ? ' · 방어막' : ''}${b.slow > 0 ? ' · 느려짐' : ''}`; const r = this.app.rpg; $('myHp').style.width = `${Math.max(0, r.hp / r.maxHp * 100).toFixed(1)}%`; $('myHpT').textContent = `${Math.max(0, Math.round(r.hp))} / ${r.maxHp}`; if (this.bossMsgT > 0) { this.bossMsgT -= 1 / 60; if (this.bossMsgT <= 0) $('bossMsg').textContent = ''; } }
  bossEnd() { $('bossbar').hidden = true; $('bossIntro').hidden = true; }
  bossText(t, sec = 2) { $('bossMsg').textContent = t; this.bossMsgT = sec; }
  dmgNum(n) { const el = document.createElement('span'); el.textContent = n; el.style.left = `${(Math.random() - 0.5) * 160}px`; $('dmgNums').appendChild(el); setTimeout(() => el.remove(), 1000); }
  hurt(d, what) { const el = document.createElement('span'); el.className = 'me'; el.textContent = `−${d} ${what || ''}`; el.style.left = `${(Math.random() - 0.5) * 120}px`; el.style.top = '60px'; $('dmgNums').appendChild(el); setTimeout(() => el.remove(), 1000); const fx = $('hurtFx'); fx.classList.add('on'); setTimeout(() => fx.classList.remove('on'), 60); }
  levelUp(ups) { const r = this.app.rpg; this.tip(`🎉 LEVEL UP! Lv.${r.lv} · 능력치 포인트 +${4 * ups} · 코인 +${50 * ups} — 메뉴(M) → 능력치에서 써요`, 7); }
  onArmed() {
    const c = this.app.combat, w = c.weapon, el = $('weap');
    el.hidden = !c.armed || !w;
    if (c.armed && w) { const st = this.app.rpg.weapons[w.k] || { up: 0, ench: [] }; $('weapName').textContent = `${w.e} ${w.n}${st.up ? ' +' + st.up : ''}`; $('weapSub').textContent = `${this.app.mobile ? '발사 버튼' : '왼쪽 클릭'} · 피해 ${Math.round(this.app.rpg.weaponDmg(w.k))} · ${this.app.mobile ? '무기 버튼으로 넣기' : 'R 넣기'}`; }
    const tb = $('tBreak'); if (tb) tb.textContent = c.armed ? '발사' : '캐기';
    $('btnWeapon').classList.toggle('acc', c.armed);
  }
  setStats(fps, scale, active) { $('fps').textContent = `${fps.toFixed(0)} fps · ${Math.round(100 / scale)}% · ${PRESETS[this.app.tierName].label} · 메시 ${active}`; }
  // 상태 바 · 용돈 · 심부름
  refreshStats() {
    const s = this.app.stats; if (!s) return;
    const bar = (id, v, lowBad = true) => { const el = $(id); el.firstElementChild.style.width = `${Math.round(v)}%`; el.classList.toggle('low', lowBad ? v < 25 : v > 75); };
    bar('bHunger', s.hunger); bar('bEnergy', s.energy); bar('bStress', s.stress, false); bar('bGrade', s.grade); bar('bFit', s.fitness);
    $('vHunger').textContent = Math.round(s.hunger); $('vEnergy').textContent = Math.round(s.energy); $('vStress').textContent = Math.round(s.stress); $('vGrade').textContent = Math.round(s.grade); $('vFit').textContent = Math.round(s.fitness);
    $('vCoins').textContent = `${Math.round(s.coins).toLocaleString()}원`;
    const q = this.app.quests, qe = $('vQuest');
    if (q && q.active) { qe.hidden = false; qe.innerHTML = `<b>심부름</b> ${q.activeQuest.title}<br>→ ${q.activeStep.text}`; } else qe.hidden = true;
    $('day').textContent = `D+${s.day} ${s.weekdayName}요일`;
    const r = this.app.rpg; if (r) $('lvl').textContent = `${r.rebirth ? '★' + r.rebirth + ' ' : ''}Lv.${r.lv} · ${Math.round(r.xp / r.need * 100)}% · 체력 ${Math.round(r.hp)}`;
  }
  update(dt) {
    const app = this.app, sky = app.sky, s = app.stats;
    $('clock').textContent = hm(sky.time);
    if (!this.draggingTime) $('rngTime').value = sky.time;
    // 장소
    const p = app.player.position; let best = null;
    for (const z of this.zones) if (p.x >= z.x0 && p.x <= z.x1 && p.z >= z.z0 && p.z <= z.z1) { const area = (z.x1 - z.x0) * (z.z1 - z.z0); if (!best || area < best.area) best = { ...z, area }; }
    const name = best ? best.name : '마이폴 마을';
    if (name !== this.lastZone) { this.lastZone = name; $('place').firstChild.textContent = name; }
    $('placeSub').textContent = app.player.inCar ? `${app.car.kmh.toFixed(0)} km/h · 연료 ${Math.round(app.car.fuel)}%` : `${p.x.toFixed(0)}, ${p.z.toFixed(0)}`;
    // 일과 한 줄
    const nowMs = performance.now();
    if (nowMs - (this._statAt || 0) > 500) {
      this._statAt = nowMs; this.statT = 0; this.refreshStats();
      const ev = s.current(sky.time), nx = s.next(sky.time);
      $('sched').innerHTML = ev ? `<b>${ev.name}</b> ${hm(ev.t)}~${hm(ev.t + ev.len)} ${s.isAttended(ev) ? '<span class="ok">✓ 출석</span>' : '· 장소로 가면 출석'}${nx ? ` → ${nx.name} ${hm(nx.t)}` : ''}` : (nx ? `자유 시간 → <b>${nx.name}</b> ${hm(nx.t)}` : '자유 시간 · 22시 점호 후 내 방에서 자요');
    }
    // 안내줄 (가까운 장소)
    const pr = $('prompt'), text = app.interact.prompt();
    if (text && !app.dialog.open && !app.builder.active) { pr.hidden = false; pr.innerHTML = `<kbd>E</kbd>${text.replace(/^E( 버튼)? · /, '')}`; } else pr.hidden = true;
    if (this.tipT > 0) { this.tipT -= dt; if (this.tipT <= 0) $('tip').hidden = true; }
    const bb = $('breakBar'); if (app.builder.active && app.builder.prog > 0) { bb.hidden = false; bb.firstElementChild.style.width = `${Math.round(app.builder.prog * 100)}%`; } else bb.hidden = true;
    // E: 차 타기/내리기 → 장소 상호작용
    if (app.input.consume('action') && !app.dialog.open) {
      if (app.player.inCar) { app.player.inCar = false; app.followCam.car = null; const e = app.car.exitPosition(); app.player.position.copyFrom(e); app.player.fixSpawn(); app.player.setVisible(true); this.tip('내렸어요'); }
      else if (app.car.near(app.player.position)) { app.player.inCar = true; app.followCam.car = app.car; app.player.setVisible(false); this.tip('W/S 가속 · A/D 조향 · Space 브레이크 · Shift 부스트 · E 내리기 · 기름은 마트 주유기', 6); }
      else if (!app.interact.open()) this.tip('여기선 할 일이 없어요 — 간판 있는 방·가게·운동장 앞에서 E');
    }
    if (app.input.consume('chat') && !app.dialog.open) this.openChat(!this.chatOpen);
    if (app.input.consume('menu')) app.menu.toggle(undefined, app.menu.open ? undefined : 'stat');
    if (app.input.consume('settings')) this.toggleSettings();
    if (app.input.consume('bag')) app.menu.toggle(!app.menu.open || app.menu.tab !== 'bag', 'bag');
    if (app.combat.armed) { const w = app.combat.weapon; $('weapCd').style.width = `${Math.round((1 - Math.min(1, app.combat.cool / Math.max(1, app.rpg.weaponCd(w.k)))) * 100)}%`; }
    if (app.input.consume('timeFast')) { app.timeFlow = app.timeFlow >= 4 ? 1 : 4; $('selFlow').value = String(app.timeFlow); this.tip(app.timeFlow >= 4 ? '시간이 빨리 흘러요' : '시간 흐름 보통'); }
    if (app.input.consume('escape')) { if (this.chatOpen) this.openChat(false); else if (this.settingsOpen) this.toggleSettings(false); else if (app.menu.open) app.menu.toggle(false); }
    if (app.net?.transport) { const o = $('cOnline'); if (o && !o.textContent) app.net._online(); }
    app.car.setNight(sky.night, app.lighting.lightsOn);
    app.input.endFrame();
  }
}
