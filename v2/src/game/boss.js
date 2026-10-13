// 보스전 — 전 판처럼: 선생님마다 공격 순서(투사체 · 비 · 내려찍기 · 돌진 · 레이저 · 방어막 · 애교) + 필살기(18가지) · 3페이즈(2페이즈 탄막 · 광폭화 분신+돌진 3연속) ·
//  보스 레벨(이길 때마다 +1) · 결과(경험치 · 코인 · 장비) · 호감도 높으면 살살.
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { WORLD } from '../world/blocks.js';
import { makeCharacter, PALETTES } from './character.js';
import { GRADES, rollGearGrade, SLOTS } from './rpg.js';
import { ITEMS } from './items.js';

const G = WORLD.GROUND;
// 투사체 종류(전 판 ml 표): s 속도 · n 개수 · r 크기 · d 피해 · sp 회전 · slow 느려짐 · sh 방어막 뚫림
const KINDS = { word: { s: 11, n: 5, r: 0.9, d: 10, col: '#8ab4ff' }, math: { s: 13, n: 5, r: 0.8, d: 10, col: '#ffd27a' }, pil: { s: 12, n: 4, r: 0.8, d: 10, col: '#c9a0ff' }, clean: { s: 14, n: 4, r: 0.7, d: 11, col: '#7ee0a0' }, a4: { s: 8, n: 7, r: 0.6, d: 8, col: '#ffffff' }, student: { s: 13, n: 3, r: 0.8, d: 14, col: '#ffb347' }, laptop: { s: 14, n: 4, r: 0.7, d: 12, col: '#6fb7ff' }, bolt: { s: 22, n: 3, r: 0.5, d: 9, col: '#fff2a8' }, chalk: { s: 16, n: 3, r: 0.4, d: 10, col: '#ffffff' }, ball: { s: 15, n: 3, r: 0.6, d: 10, col: '#ff6a5a' }, doc: { s: 12, n: 5, r: 0.6, d: 9, col: '#f0e6c8' }, stamp: { s: 15, n: 3, r: 0.6, d: 12, col: '#ff5c5c' }, bible: { s: 12, n: 4, r: 0.6, d: 10, col: '#ffe9a0' }, heart: { s: 9, n: 6, r: 0.6, d: 6, col: '#ff7ab8', charm: true }, bone: { s: 15, n: 3, r: 0.5, d: 10, col: '#f4efe0' }, egg: { s: 13, n: 4, r: 0.45, d: 9, col: '#fff4d6' } };
const ARENA = { x: 128.5, z: 88.5, r: 26 }; // 운동장 가운데
const fxm = new Map();
function mat(scene, hex, alpha = 1) { const k = hex + alpha; if (fxm.has(k)) return fxm.get(k); const m = new StandardMaterial('bm' + k, scene); m.emissiveColor = Color3.FromHexString(hex); m.diffuseColor = Color3.Black(); m.disableLighting = true; m.alpha = alpha; m.backFaceCulling = false; fxm.set(k, m); return m; }

export class Boss {
  constructor(app) { this.app = app; this.scene = app.scene; this.b = null; this.projs = []; this.marks = []; this.minions = []; this.t = 0; }
  get active() { return !!this.b; }
  // Combat 이 맞힐 대상
  targets() { if (!this.b) return []; const b = this.b; const out = [{ pos: b.pos.clone().addInPlaceFromFloats(0, 1, 0), r: 1.1, hit: (dmg, o) => this.hitBoss(dmg, o) }]; for (const m of this.minions) out.push({ pos: m.pos.clone().addInPlaceFromFloats(0, 0.8, 0), r: 0.7, hit: (dmg) => { m.hp -= dmg; } }); return out; }
  start(o) {
    const app = this.app; if (this.b) return;
    const d = o.d, lv = app.rpg.bossLv[d.n] || 0, aff = app.teachers.affinity(d.n);
    app.dialog.close();
    const maxHp = Math.round(d.hp * 2.25 * (1 + lv * 0.15));
    this.b = { o, d, lv, aff, hp: maxHp, maxHp, phase: 1, pos: new Vector3(ARENA.x, G, ARENA.z + 10), yaw: Math.PI, atkT: 2.5, atkI: 0, sigT: 9, shield: 0, slow: 0, stop: 0, dashT: 0, dashDir: null, dashLeft: 0, jump: 0, jumpV: 0, t: 0, enraged: false, clones: [] };
    // 선생님을 경기장으로 · 플레이어도
    app.teachers.setHidden(o, false); o.pos.copyFrom(this.b.pos); o.ch.root.position.copyFrom(this.b.pos);
    this.returnPos = app.player.position.clone(); app.player.position.set(ARENA.x, G, ARENA.z - 8); app.player.vel.set(0, 0, 0); app.player.fixSpawn();
    app.rpg.hp = app.rpg.maxHp; app.combat.toggleArmed(true);
    this.t = 0; this.projs = []; this.minions = []; this.marks = [];
    app.hud.bossIntro(d, lv, maxHp);
    app.net?.room?.send('chat', { n: app.save.name, x: `⚔️ ${d.n}(${d.t})과 보스전 시작!` });
  }
  end(win) {
    const app = this.app, b = this.b; if (!b) return; this.b = null;
    for (const p of this.projs) p.m.dispose(); this.projs = []; for (const m of this.marks) m.m?.dispose(); this.marks = []; for (const m of this.minions) this._killMinion(m); this.minions = []; for (const c of b.clones) c.ch.root.dispose(false, true); b.clones = [];
    const d = b.d, o = b.o; o.pos.copyFrom(o.home); o.target.copyFrom(o.home); o.ch.root.position.copyFrom(o.home); app.teachers.setHidden(o, false);
    app.hud.bossEnd();
    if (win) {
      const lv = b.lv, rpg = app.rpg, xp = Math.round(120 + 60 * lv + d.hp * 0.1), coins = Math.round(600 + 350 * lv + d.hp * 0.3);
      rpg.bossLv[d.n] = lv + 1; rpg.kills++; app.teachers.addAff(d.n, 5);
      const ups = rpg.addXp(xp); app.stats.apply({ coins, stress: -6 });
      let drop = null; if (Math.random() < 0.55 + lv * 0.05) { const slot = SLOTS[Math.floor(Math.random() * 4)].k; drop = rpg.addGear(slot, Math.min(6, rollGearGrade(rpg.lv + lv * 2)), d.n); }
      // 재료 드롭: 철 · 금 · 다이아몬드 · 네더라이트(보스 레벨이 높을수록)
      const mats = [['iron_ingot', 3 + lv], ['coal', 2 + lv], ['gold_ingot', 1 + Math.floor(lv / 2)]]; if (lv >= 1 || Math.random() < 0.5) mats.push(['diamond', 1 + Math.floor(lv / 2)]); if (lv >= 3 && Math.random() < 0.6) mats.push(['netherite', 1]);
      for (const [id, n] of mats) app.inv.add(id, n);
      const matText = mats.map(([id, n]) => `${ITEMS[id].icon} ${ITEMS[id].n} ${n}`).join(' · ');
      const t = Math.round(b.t);
      app.dialog.show({ title: `🏆 ${d.n} 승리!`, sub: `${d.t} · 보스 Lv.${lv + 1}이 됐어요 · ${t}초`, lines: [`경험치 +${xp} · 코인 +${coins.toLocaleString()}원 · 호감도 +5${ups ? ` · LEVEL UP! Lv.${rpg.lv}` : ''}`, drop ? `🎽 ${drop.n} (${GRADES[drop.r].n}) 을(를) 얻었어요 — 가방에서 끼워요` : '장비는 이번엔 안 나왔어요 (다음엔 확률 ↑)', `재료: ${matText} — 가방 → 제작에서 도구를 만들어요`, `"${d.lines[2]}" — 이겨도 선생님은 그대로 계셔서 또 도전할 수 있어요`], options: [{ label: '좋아요!', accent: true, run: () => false }] });
      if (ups) app.hud.levelUp(ups);
      app.net?.room?.send('chat', { n: app.save.name, x: `🏆 ${d.n} 보스전 승리! (Lv.${lv + 1})` });
    } else {
      app.rpg.hp = Math.round(app.rpg.maxHp * 0.5); app.stats.apply({ stress: 10 });
      app.player.position.set(79.5, G, 141.5); app.player.vel.set(0, 0, 0); app.player.fixSpawn();
      app.dialog.show({ title: '쓰러졌어요…', sub: `${d.n}의 ${d.sn}에 당했어요`, lines: ['생활관 로비에서 깨어났어요. 체력은 절반 · 스트레스 +10', '팁: 능력치(체력 · 평판)를 올리거나 장비를 끼고, 무기를 강화해서 다시 도전해요'], options: [{ label: '다시 일어나기', accent: true, run: () => false }] });
    }
    app.hud.refreshStats(); app.saveNow();
    if (this.returnPos && win) { app.player.position.copyFrom(this.returnPos); app.player.fixSpawn(); }
    app.combat.toggleArmed(false);
  }
  hitBoss(dmg, o = {}) {
    const b = this.b; if (!b) return; if (b.shield > 0) { this.app.hud.bossText('방어막!'); return; }
    b.hp -= dmg; this.app.hud.dmgNum(Math.round(dmg)); if (o.slow) b.slow = Math.max(b.slow, 2); if (o.burn) b.burn = 3;
    if (b.hp <= b.maxHp * 0.33 && b.phase < 3) this._phase(3); else if (b.hp <= b.maxHp * 0.66 && b.phase < 2) this._phase(2);
    if (b.hp <= 0) this.end(true);
  }
  _phase(p) {
    const b = this.b; b.phase = p; b.atkT = 1.2;
    this.app.hud.bossText(p === 3 ? `광폭화! ${b.d.n}이(가) 분신을 불러요` : '2페이즈 — 탄막이 늘어나요', 3);
    if (p === 3) { for (let i = 0; i < 2; i++) { const ch = makeCharacter(this.scene, PALETTES[(i + 2) % PALETTES.length], 2, 'clone' + i); ch.root.position.copyFrom(b.pos); for (const m of ch.meshes) m.visibility = 0.55; b.clones.push({ ch, ang: i * Math.PI, pos: b.pos.clone() }); } }
  }
  // ---- 매 프레임 ----
  update(dt) {
    const b = this.b; if (!b) return;
    const app = this.app, p = app.player, pp = p.position; this.t += dt; b.t += dt;
    if (Vector3.Distance(pp, new Vector3(ARENA.x, pp.y, ARENA.z)) > ARENA.r + 14) { app.hud.tip('경기장에서 너무 멀어져서 보스전이 끝났어요'); this.end(false); return; }
    const stopped = b.stop > 0; if (stopped) b.stop -= dt;
    const slowK = b.slow > 0 ? 0.45 : 1; if (b.slow > 0) b.slow -= dt;
    if (b.burn > 0) { b.burn -= dt; b.hp -= dt * 6; if (b.hp <= 0) { this.end(true); return; } }
    if (b.shield > 0) b.shield -= dt;
    const rate = b.phase === 1 ? 1.7 : b.phase === 2 ? 1.25 : 0.95;
    if (!stopped) {
      // 움직임: 6m 거리 유지하며 옆으로 돌기 · 돌진 중이면 직진 · 내려찍기 점프
      const sp = 2.6 * (b.d.spd || 1) * slowK * (b.phase === 3 ? 1.2 : 1);
      if (b.dashLeft > 0) { b.dashT -= dt; const nx = b.pos.x + b.dashDir.x * 13 * dt, nz = b.pos.z + b.dashDir.z * 13 * dt; if (!app.world.solidAt(nx, b.pos.y + 0.6, nz)) { b.pos.x = nx; b.pos.z = nz; } if (Vector3.Distance(b.pos, pp) < 1.3) this.hurt(14, '돌진'); if (b.dashT <= 0) { b.dashLeft--; if (b.dashLeft > 0) { b.dashDir = this._dirTo(pp); b.dashT = 0.9; } } }
      else if (b.jump > 0) { b.jump -= dt; b.jumpV -= 30 * dt; b.pos.y = Math.max(G, b.pos.y + b.jumpV * dt); const to = pp.subtract(b.pos); to.y = 0; const dl = to.length(); if (dl > 0.2) { const st = Math.min(dl, 9 * dt); b.pos.x += to.x / dl * st; b.pos.z += to.z / dl * st; } if (b.pos.y <= G && b.jumpV < 0) { b.jump = 0; b.pos.y = G; this._shock(b.pos, 4.2, 16, '#ffb347', '내려찍기'); } }
      else {
        const to = pp.subtract(b.pos); to.y = 0; const dl = to.length(); const want = 6.5;
        let mx = 0, mz = 0; if (dl < 0.05) { mx = 1; mz = 0; } else if (dl > want + 1) { mx = to.x / dl; mz = to.z / dl; } else if (dl < want - 1.5) { mx = -to.x / dl; mz = -to.z / dl; } else { mx = -to.z / dl * 0.7; mz = to.x / dl * 0.7; }
        const nx = b.pos.x + mx * sp * dt, nz = b.pos.z + mz * sp * dt; if (!app.world.solidAt(nx, b.pos.y + 0.6, nz) && !app.world.solidAt(nx, b.pos.y + 1.4, nz)) { b.pos.x = nx; b.pos.z = nz; }
        if (dl > 0.05) b.yaw = Math.atan2(to.x, to.z);
      }
      // 공격
      b.atkT -= dt * (b.phase === 3 ? 1.15 : 1);
      if (b.atkT <= 0 && b.dashLeft <= 0 && b.jump <= 0) { b.atkT = rate; this._attack(b.d.at[b.atkI % b.d.at.length]); b.atkI++; }
      b.sigT -= dt; if (b.sigT <= 0) { b.sigT = b.phase === 3 ? 8 : 11; this._signature(b.d.sig); app.hud.bossText(`${b.d.sn}!`, 2.2); }
    }
    // 분신
    for (const c of b.clones) { c.ang += dt * 1.3; c.pos.set(b.pos.x + Math.cos(c.ang) * 3, G, b.pos.z + Math.sin(c.ang) * 3); c.ch.root.position.copyFrom(c.pos); c.ch.root.rotation.y = b.yaw; c.ch.animate(this.t, 1, dt); if (Math.random() < dt * 0.5) this._proj(c.pos.clone().addInPlaceFromFloats(0, 1.2, 0), pp.subtract(c.pos).normalize(), KINDS[b.d.pk], 0.5); }
    // 투사체 · 표시 · 부하
    this._simProjs(dt, stopped); this._simMarks(dt); this._simMinions(dt);
    // 보스 메시
    const o = b.o; o.pos.copyFrom(b.pos); o.yaw = b.yaw; o.ch.root.position.copyFrom(b.pos); o.ch.root.rotation.y = b.yaw; o.ch.animate(this.t, b.dashLeft > 0 ? 2 : 1, dt);
    if (b.shieldM) { b.shieldM.position.set(b.pos.x, b.pos.y + 1, b.pos.z); b.shieldM.setEnabled(b.shield > 0); }
    app.hud.bossBar(b);
  }
  _dirTo(pp) { const b = this.b; const d = pp.subtract(b.pos); d.y = 0; return d.length() < 0.05 ? new Vector3(1, 0, 0) : d.normalize(); }
  // ---- 기본 공격들 ----
  _attack(kind) {
    const b = this.b, pp = this.app.player.position, k = KINDS[b.d.pk] || KINDS.chalk; const from = b.pos.clone().addInPlaceFromFloats(0, 1.3, 0);
    const n = k.n + (b.phase - 1);
    switch (kind) {
      case 'proj': { const base = pp.clone().addInPlaceFromFloats(0, 0.9, 0).subtract(from).normalize(); for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.16; this._proj(from, rotY(base, a), k, 1, b.phase === 3 && i === 0); } break; }
      case 'rain': { for (let i = 0; i < n + 3; i++) { const x = pp.x + (Math.random() - 0.5) * 9, z = pp.z + (Math.random() - 0.5) * 9; this._mark(x, z, 1.1, 1.0, k.col); this._proj(new Vector3(x, pp.y + 14, z), new Vector3(0, -1, 0), { ...k, s: 11 }, 1); } break; }
      case 'slam': b.jump = 1.2; b.jumpV = 12; break;
      case 'dash': b.dashDir = this._dirTo(pp); b.dashT = 0.9; b.dashLeft = b.phase === 3 ? 3 : 1; this.app.hud.bossText('돌진!', 1); break;
      case 'laser': { const dir = pp.subtract(b.pos).normalize(); this._laser(from, dir); break; }
      case 'shield': b.shield = 2.2; if (!b.shieldM) { b.shieldM = MeshBuilder.CreateSphere('bsh', { diameter: 2.6, segments: 8 }, this.scene); b.shieldM.material = mat(this.scene, '#6ff3ff', 0.35); b.shieldM.isPickable = false; } this.app.hud.bossText('방어막!', 1.5); break;
      case 'aegyo': { const base = pp.clone().addInPlaceFromFloats(0, 0.9, 0).subtract(from).normalize(); for (let i = 0; i < 5; i++) this._proj(from, rotY(base, (i - 2) * 0.22), KINDS.heart, 1); this.app.hud.bossText('애교 공격! 하트에 맞으면 방향이 반대로', 2); break; }
      case 'peck': case 'bite': { if (Vector3.Distance(b.pos, pp) < 2.2) this.hurt(k.d * 1.4, kind === 'bite' ? '물기' : '쪼기'); else { b.dashDir = this._dirTo(pp); b.dashT = 0.5; b.dashLeft = 1; } break; }
    }
  }
  // ---- 필살기 18 ----
  _signature(sig) {
    const b = this.b, pp = this.app.player.position, k = KINDS[b.d.pk] || KINDS.chalk, from = b.pos.clone().addInPlaceFromFloats(0, 1.2, 0);
    const ring = (center, radius, count, dir, kind, speed) => { for (let i = 0; i < count; i++) { const a = i / count * Math.PI * 2; const p = new Vector3(center.x + Math.cos(a) * radius, center.y + 1, center.z + Math.sin(a) * radius); const d = dir === 'in' ? center.subtract(p).normalize() : p.subtract(center).normalize(); d.y = 0; this._proj(p, d, { ...kind, s: speed }, 1); } };
    switch (sig) {
      case 'wall': case 'rows': { // 가로줄(빈틈 하나)이 플레이어 쪽으로
        const rows = sig === 'rows' ? 3 : 1; const dir = pp.subtract(b.pos); dir.y = 0; dir.normalize(); const side = new Vector3(-dir.z, 0, dir.x);
        for (let r = 0; r < rows; r++) { const gap = Math.floor(Math.random() * 9); for (let i = 0; i < 11; i++) { if (i === gap || i === gap + 1) continue; const p = from.clone().addInPlace(side.scale((i - 5) * 1.3)).addInPlace(dir.scale(r * 3)); this._proj(p, dir, { ...k, s: 7 }, 1); } }
        break; }
      case 'spell': ring(pp, 9, 14, 'in', k, 5); break;
      case 'closein': ring(pp, 11, 18, 'in', k, 4); this.app.hud.bossText('포위망! 빈틈으로 빠져나가요', 2); break;
      case 'storm': { for (let i = 0; i < 6; i++) { const x = pp.x + (Math.random() - 0.5) * 10, z = pp.z + (Math.random() - 0.5) * 10; this._mark(x, z, 2.0, 1.1, '#fff2a8', () => { this._shock(new Vector3(x, G, z), 2.2, 14, '#fff2a8', '번개'); }); } break; }
      case 'quiz': { const ok = Math.floor(Math.random() * 3); const spots = []; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.random(); spots.push([pp.x + Math.cos(a) * 4, pp.z + Math.sin(a) * 4]); }
        spots.forEach(([x, z], i) => this._mark(x, z, 2.2, 2.4, i === ok ? '#7ee0a0' : '#ff5c5c', i === ok ? () => { if (Vector3.Distance(pp, new Vector3(x, pp.y, z)) > 2.2) this.hurt(24, '수학 시험 오답'); else this.app.hud.bossText('정답! 👍', 1.5); } : null));
        this.app.hud.bossText('수학 시험! 초록 원 안에 서요', 2.4); break; }
      case 'sine': { const dir = pp.subtract(b.pos); dir.y = 0; dir.normalize(); const side = new Vector3(-dir.z, 0, dir.x); for (let i = 0; i < 12; i++) { const p = from.clone().addInPlace(side.scale(Math.sin(i * 0.8) * 3)).addInPlace(dir.scale(i * 0.5)); this._proj(p, dir, { ...k, s: 9 }, 1); } break; }
      case 'stamp': { const x = pp.x, z = pp.z; this._mark(x, z, 4, 1.3, '#ff5c5c', () => { this._shock(new Vector3(x, G, z), 4, 26, '#ff5c5c', '결재 도장'); }); this.app.hud.bossText('초대형 결재 도장! 빨간 원 밖으로', 2); break; }
      case 'pillar': { for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; this.marks.push({ kind: 'pillar', a, t: 0, life: 4, m: this._disc(b.pos.x, b.pos.z, 1.2, '#ffe9a0') }); } break; }
      case 'bounce': { for (let i = 0; i < 3 + b.phase; i++) { const d = pp.subtract(from).normalize(); d.y = 0.45; this._proj(from, rotY(d, (Math.random() - 0.5) * 0.8).normalize(), { ...KINDS.ball, s: 12 }, 1, false, { bounce: 5, grav: 14 }); } break; }
      case 'grid': { for (const ax of ['x', 'z']) this.marks.push({ kind: 'grid', ax, t: 0, life: 3.5, off: -12, m: this._bar(ax, b.pos, '#6fb7ff') }); this.app.hud.bossText('레이저 그리드! 선을 뛰어넘어요', 2); break; }
      case 'minion': { for (let i = 0; i < 2 + (b.phase === 3 ? 1 : 0); i++) this._minion(b.pos.x + (Math.random() - 0.5) * 3, b.pos.z + (Math.random() - 0.5) * 3, 60, '#ffb347'); break; }
      case 'whirl': { this.app.player.pullTo = { p: b.pos.clone(), t: 2.2, k: 5 }; ring(b.pos, 3, 10, 'out', k, 6); this.app.hud.bossText('논문 회오리! 빨려 들어가요', 2); break; }
      case 'sweep': { this._shock(b.pos, 5.5, 22, '#7ee0a0', '대걸레 휘두르기', true); break; }
      case 'queue': { const dir = pp.clone().addInPlaceFromFloats(0, 0.9, 0).subtract(from).normalize(); for (let i = 0; i < 8; i++) setTimeout(() => { if (this.b === b) this._proj(from.clone(), dir, { ...k, s: 18 }, 1); }, i * 120); break; }
      case 'charm': ring(pp, 8, 10, 'in', KINDS.heart, 6); break;
      case 'eggs': { for (let i = 0; i < 4; i++) { const d = pp.subtract(from).normalize(); d.y = 0.6; this._proj(from, rotY(d, (Math.random() - 0.5) * 0.9).normalize(), { ...KINDS.egg, s: 11 }, 1, false, { bounce: 1, grav: 16, hatch: true }); } break; }
      case 'zoom': b.dashDir = this._dirTo(pp); b.dashT = 0.8; b.dashLeft = 3; this.app.hud.bossText('우다다 질주!', 1.5); break;
      default: ring(pp, 8, 12, 'in', k, 5);
    }
  }
  // ---- 피해 ----
  hurt(dmg, what) {
    const app = this.app, b = this.b, rpg = app.rpg; if (!b) return;
    if (app.player.invT > 0) return; app.player.invT = 0.45;
    let k = rpg.takenMult() * (1 + b.lv * 0.1); if (b.aff >= 60) k *= 0.8; if (b.aff >= 90) k *= 0.8;
    const d = Math.max(1, Math.round(dmg * k)); rpg.hp -= d; app.hud.hurt(d, what);
    if (rpg.hp <= 0) { rpg.hp = 0; this.end(false); }
  }
  _shock(center, r, dmg, col, what, jumpDodge = false) {
    this.app.combat._flash(center.x, center.y + 0.3, center.z, r * 0.7, col);
    const pp = this.app.player.position; const d = Vector3.Distance(new Vector3(pp.x, 0, pp.z), new Vector3(center.x, 0, center.z));
    if (d < r && (!jumpDodge || this.app.player.onGround) && pp.y < center.y + 1.6) this.hurt(dmg, what);
  }
  _proj(from, dir, k, dmgK = 1, homing = false, o = {}) {
    if (!Number.isFinite(dir.x) || !Number.isFinite(dir.z) || dir.length() < 1e-4) dir = new Vector3(0, 0, 1);
    const m = MeshBuilder.CreateSphere('bp', { diameter: k.r * 1.4, segments: 6 }, this.scene); m.material = mat(this.scene, k.col); m.isPickable = false; m.position.copyFrom(from);
    this.projs.push({ m, pos: from.clone(), vel: dir.scale(k.s), d: k.d * 1.15 * dmgK, r: k.r * 0.7, life: 6, charm: !!k.charm, homing, ...o });
  }
  _simProjs(dt, stopped) {
    const out = [], pp = this.app.player.position, w = this.app.world;
    for (const p of this.projs) {
      if (!stopped) {
        p.life -= dt; if (p.grav) p.vel.y -= p.grav * dt;
        if (p.homing) { const d = pp.clone().addInPlaceFromFloats(0, 0.9, 0).subtract(p.pos).normalize(); const sp = p.vel.length(); p.vel.addInPlace(d.scaleInPlace(sp * 2.5 * dt)).normalize().scaleInPlace(sp); }
        const nx = p.pos.x + p.vel.x * dt, ny = p.pos.y + p.vel.y * dt, nz = p.pos.z + p.vel.z * dt;
        if (w.solidAt(nx, ny, nz)) { if (p.bounce > 0) { p.bounce--; if (w.solidAt(nx, p.pos.y, nz)) { p.vel.x *= -0.7; p.vel.z *= -0.7; } else p.vel.y = Math.abs(p.vel.y) * 0.6; if (p.hatch && p.bounce === 0) { this._minion(p.pos.x, p.pos.z, 25, '#f2c230'); p.m.dispose(); continue; } } else { p.m.dispose(); this.app.combat._puff(nx, ny, nz, '#ffffff', 0.4); continue; } }
        else p.pos.set(nx, ny, nz);
        const dx = p.pos.x - pp.x, dy = p.pos.y - (pp.y + 0.9), dz = p.pos.z - pp.z;
        if (dx * dx + dz * dz < (p.r + 0.4) * (p.r + 0.4) && Math.abs(dy) < 1.1 + p.r) { this.hurt(p.d, p.charm ? '하트' : '공격'); if (p.charm) this.app.input.reverseT = 2; p.m.dispose(); continue; }
        if (p.life <= 0) { p.m.dispose(); continue; }
      }
      p.m.position.copyFrom(p.pos); out.push(p);
    }
    this.projs = out;
  }
  _laser(from, dir) { const b = this.b; this.marks.push({ kind: 'laser', from: from.clone(), a: Math.atan2(dir.x, dir.z) - 0.5, t: 0, life: 1.3 }); this.app.hud.bossText('레이저!', 1); }
  _mark(x, z, r, delay, col, onEnd) { this.marks.push({ kind: 'mark', x, z, r, t: 0, life: delay, m: this._disc(x, z, r, col), onEnd }); }
  _disc(x, z, r, col) { const m = MeshBuilder.CreateDisc('mk', { radius: r, tessellation: 24 }, this.scene); m.rotation.x = Math.PI / 2; m.position.set(x, G + 0.06, z); m.material = mat(this.scene, col, 0.45); m.isPickable = false; return m; }
  _bar(ax, c, col) { const m = MeshBuilder.CreateBox('gb', { width: ax === 'x' ? 0.25 : 40, height: 2.2, depth: ax === 'x' ? 40 : 0.25 }, this.scene); m.material = mat(this.scene, col, 0.6); m.position.set(c.x, G + 1.1, c.z); m.isPickable = false; return m; }
  _simMarks(dt) {
    const out = [], pp = this.app.player.position, b = this.b, combat = this.app.combat;
    for (const k of this.marks) {
      k.t += dt;
      if (k.kind === 'mark') { if (k.m) k.m.scaling.setAll(1 + Math.sin(k.t * 12) * 0.05); if (k.t >= k.life) { k.m?.dispose(); k.onEnd?.(); continue; } }
      else if (k.kind === 'laser') { const a = k.a + k.t / k.life * 1.0; const dir = new Vector3(Math.sin(a), 0, Math.cos(a)); const end = k.from.add(dir.scale(28)); if (Math.floor(k.t * 20) !== Math.floor((k.t - dt) * 20)) combat._line(k.from, end, '#ff5c5c', 0.12); const to = new Vector3(pp.x - k.from.x, 0, pp.z - k.from.z); const along = Vector3.Dot(to, dir); const perp = to.subtract(dir.scale(along)).length(); if (along > 0 && along < 28 && perp < 0.9 && pp.y < k.from.y + 0.8) this.hurt(9, '레이저'); if (k.t >= k.life) continue; }
      else if (k.kind === 'pillar') { k.a += dt * 1.1; const x = b.pos.x + Math.cos(k.a) * 5, z = b.pos.z + Math.sin(k.a) * 5; k.m.position.set(x, G + 0.06, z); if (Math.hypot(pp.x - x, pp.z - z) < 1.3) this.hurt(8, '빛기둥'); if (k.t >= k.life) { k.m.dispose(); continue; } }
      else if (k.kind === 'grid') { k.off += dt * 7; const x = b.pos.x + (k.ax === 'x' ? k.off : 0), z = b.pos.z + (k.ax === 'z' ? k.off : 0); k.m.position.set(x, G + 1.1, z); const d = k.ax === 'x' ? Math.abs(pp.x - x) : Math.abs(pp.z - z); if (d < 0.5 && pp.y < G + 1.2) this.hurt(10, '레이저 그리드'); if (k.t >= k.life) { k.m.dispose(); continue; } }
      out.push(k);
    }
    this.marks = out;
  }
  _minion(x, z, hp, col) {
    const ch = makeCharacter(this.scene, PALETTES[Math.floor(Math.random() * PALETTES.length)], Math.floor(Math.random() * 4), 'mn'); ch.root.scaling.setAll(0.7); ch.root.position.set(x, G, z);
    this.minions.push({ ch, pos: new Vector3(x, G, z), hp, life: 16, atk: 0 });
  }
  _killMinion(m) { m.ch.root.dispose(false, true); }
  _simMinions(dt) {
    const pp = this.app.player.position, out = [];
    for (const m of this.minions) {
      m.life -= dt; m.atk -= dt; if (m.hp <= 0 || m.life <= 0) { this._killMinion(m); this.app.combat._puff(m.pos.x, m.pos.y + 0.8, m.pos.z, '#ffffff', 0.6); continue; }
      const to = pp.subtract(m.pos); to.y = 0; const d = to.length(); if (d > 1.2) { const st = Math.min(d, 3.6 * dt); m.pos.x += to.x / d * st; m.pos.z += to.z / d * st; } else if (m.atk <= 0) { m.atk = 1.2; this.hurt(7, '학생 돌격대'); }
      m.ch.root.position.copyFrom(m.pos); m.ch.root.rotation.y = Math.atan2(to.x, to.z); m.ch.animate(this.t, 1, dt); out.push(m);
    }
    this.minions = out;
  }
}
function rotY(v, a) { const c = Math.cos(a), s = Math.sin(a); return new Vector3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
