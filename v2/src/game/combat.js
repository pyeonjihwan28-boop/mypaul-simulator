// 전투·부수기 — 무기 발사(24종을 몇 가지 움직임으로) · 투사체 · 폭발로 블록 날리기 · 잠시 뒤 되돌리기 · 같이 하기 동기화 · 보스에게 피해.
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import '@babylonjs/core/Meshes/instancedMesh.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { WORLD, B, BLOCKS } from '../world/blocks.js';
import { WEAPON_BY } from './rpg.js';

const G = WORLD.GROUND, TOP = G - 1;
const RESTORE_AFTER = 50; // 초
const mats = new Map();
function emat(scene, hex, alpha = 1) {
  const key = hex + alpha; if (mats.has(key)) return mats.get(key);
  const m = new StandardMaterial('fx' + key, scene); m.emissiveColor = Color3.FromHexString(hex); m.diffuseColor = Color3.Black(); m.disableLighting = true; m.alpha = alpha; m.backFaceCulling = false;
  mats.set(key, m); return m;
}
const WCOL = { bazooka: '#ffb347', laser: '#ff4d4d', cannon: '#c58cff', grenade: '#7cff6a', shotgun: '#ffd27a', boomer: '#d9b36a', flame: '#ff7a1a', freeze: '#9fe8ff', minigun: '#ffe08a', homing: '#40ff90', tesla: '#c9a0ff', planes: '#ffffff', rail: '#9fe8ff', cluster: '#ffb040', hammer: '#ff8a5c', blackhole: '#8a7cff', nuke: '#ff5a3a', orbital: '#6ff3ff', rainbow: '#ff9ad5', meteor: '#ff8a3a', timestop: '#ffe9a0', dragon: '#ff6a2a', starbow: '#fff2a8', galaxy: '#b48cff' };

export class Combat {
  constructor(app) {
    this.app = app; this.scene = app.scene; this.projs = []; this.fx = []; this.cool = 0; this.armed = false;
    this.destroyed = new Map(); // "x,y,z" → { id, shape, t }
    this.restoreT = 0; this.flashT = 0; this.destroyCount = 0; this.hitTargets = () => []; // 보스/적 목록 (bosses.js 가 넣음)
    this.srcs = new Map(); // 색깔별 원본 메시 (인스턴스용)
    this.tmp = new Vector3();
  }
  _src(kind, col) {
    const key = kind + col; if (this.srcs.has(key)) return this.srcs.get(key);
    const m = kind === 'cube' ? MeshBuilder.CreateBox('pc' + key, { size: 0.36 }, this.scene) : MeshBuilder.CreateSphere('pj' + key, { diameter: 0.5, segments: 6 }, this.scene);
    m.material = emat(this.scene, col); m.isVisible = false; m.isPickable = false; m.setEnabled(true);
    this.srcs.set(key, m); return m;
  }
  get weapon() { return WEAPON_BY[this.app.rpg.weapon]; }
  toggleArmed(v) { this.armed = v ?? !this.armed; if (this.armed && this.app.builder.active) this.app.builder.toggle(); this.app.hud.onArmed?.(); }
  // ---- 발사 ----
  update(dt) {
    const app = this.app, inp = app.input;
    this.cool = Math.max(0, this.cool - dt * 1000);
    if (inp.consume('weapon')) this.toggleArmed();
    if (app.builder.active && this.armed) this.armed = false;
    const w = this.weapon;
    if (this.armed && w && !app.player.inCar && app.state === 'play' && !app.dialog.open) {
      const want = inp.consume('break') || (inp.breakHeld && w.auto);
      if (want && this.cool <= 0) { this.fire(w); }
    }
    this._simProjs(dt); this._simFx(dt); this._restore(dt);
  }
  fire(w) {
    const app = this.app, rpg = app.rpg, s = rpg.weapons[w.k] || { ench: [] };
    this.cool = rpg.weaponCd(w.k);
    const r = app.followCam.ray(); const eye = app.player.eye;
    const dir = new Vector3(r.dx, r.dy, r.dz).normalize();
    // 조준: 카메라 광선이 닿는 곳을 향해 눈에서 쏨
    const hit = app.world.raycast(r.ox, r.oy, r.oz, r.dx, r.dy, r.dz, 80, (id) => id !== 0);
    const target = hit ? new Vector3(hit.x + 0.5 + hit.nx * 0.5, hit.y + 0.5 + hit.ny * 0.5, hit.z + 0.5 + hit.nz * 0.5) : new Vector3(r.ox + r.dx * 80, r.oy + r.dy * 80, r.oz + r.dz * 80);
    const aim = target.subtract(eye).normalize();
    const dmg = rpg.weaponDmg(w.k), rad = rpg.weaponRadius(w.k), col = WCOL[w.k] || '#ffffff';
    const ench = s.ench || [];
    const shots = []; // [방향]
    const pushSpread = (base, n, spread) => { for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * spread; shots.push(rotY(base, a)); } };
    const multi = ench.includes('multi') || w.type === 'pellets';
    if (w.type === 'pellets') { for (let i = 0; i < (w.count || 7); i++) shots.push(jitter(aim, 0.09)); }
    else if (w.count && w.spread) pushSpread(aim, w.count, w.spread);
    else if (multi) pushSpread(aim, 3, 0.18);
    else shots.push(aim);
    switch (w.type) {
      case 'beam': for (const d of shots) this._beam(eye, d, w, dmg * (multi && d !== aim ? 0.5 : 1), rad, (w.pierce || 0) + (ench.includes('pierce') ? 1 : 0), col, ench); break;
      case 'cone': this._cone(eye, aim, w, dmg, rad, col, ench); break;
      case 'melee': this._boom(app.player.position.x, app.player.position.y + 0.5, app.player.position.z, rad, dmg, col, { ench, shake: 1 }); break;
      case 'strike': { const n = w.count || 1; for (let i = 0; i < n; i++) { const sp = w.spread || 0; const tx = target.x + (sp ? (Math.random() - 0.5) * sp * 2 : 0), tz = target.z + (sp ? (Math.random() - 0.5) * sp * 2 : 0); this.projs.push(this._proj({ x: tx, y: target.y + 40 + i * 6, z: tz }, new Vector3(0, -1, 0), 36 + i * 4, w, dmg, rad, col, { ench, kind: 'cube', scale: 1.6, noDrag: true, delay: i * 0.15 })); } break; }
      case 'timestop': this._boom(target.x, target.y, target.z, rad, dmg, col, { ench, slow: 3 }); break;
      default: for (const d of shots) this.projs.push(this._proj(eye.clone(), d, w.spd || 24, w, dmg * (multi && d !== aim ? 0.5 : 1), rad, col, { ench, grav: w.type === 'grenade' ? 16 : 0, bounce: w.type === 'grenade', homing: w.homing || ench.includes('homing'), cluster: (w.cluster || 0) + (ench.includes('split') ? 3 : 0), suck: w.suck, boomer: w.type === 'boomer' }));
    }
    app.net?.fired?.(w.k, eye, aim);
  }
  _proj(pos, dir, spd, w, dmg, rad, col, o = {}) {
    const m = this._src(o.kind || 'ball', col).createInstance('p' + Math.random()); m.isVisible = true; m.isPickable = false; m.scaling.setAll(o.scale || Math.max(0.6, Math.min(2.4, rad * 0.5)));
    const p = { pos: pos instanceof Vector3 ? pos : new Vector3(pos.x, pos.y, pos.z), vel: dir.scale(spd), w, dmg, rad, col, life: o.boomer ? 2.4 : 6, t: 0, m, delay: o.delay || 0, ...o, start: pos instanceof Vector3 ? pos.clone() : new Vector3(pos.x, pos.y, pos.z) };
    m.position.copyFrom(p.pos); return p;
  }
  _simProjs(dt) {
    const w = this.app.world, out = [];
    for (const p of this.projs) {
      if (p.delay > 0) { p.delay -= dt; p.m.isVisible = p.delay <= 0; if (p.delay > 0) { out.push(p); continue; } }
      p.t += dt; p.life -= dt;
      if (p.grav) p.vel.y -= p.grav * dt;
      if (p.homing) { const tg = this._nearestTarget(p.pos, 30); if (tg) { const d = tg.subtract(p.pos).normalize(); const sp = p.vel.length(); p.vel.addInPlace(d.scaleInPlace(sp * 4 * dt)).normalize().scaleInPlace(sp); } }
      if (p.boomer && p.t > 1.0 && !p.back) { p.back = true; p.vel.scaleInPlace(-1); }
      const steps = Math.max(1, Math.ceil(p.vel.length() * dt / 0.4)); let done = false;
      for (let i = 0; i < steps && !done; i++) {
        const nx = p.pos.x + p.vel.x * dt / steps, ny = p.pos.y + p.vel.y * dt / steps, nz = p.pos.z + p.vel.z * dt / steps;
        const hitTarget = this._hitTarget(nx, ny, nz, 0.9);
        if (hitTarget || (w.solidAt(nx, ny, nz) && !(p.boomer && p.back))) {
          if (p.bounce && !hitTarget && p.bounces < 2) { p.bounces = (p.bounces || 0) + 1; if (w.solidAt(nx, p.pos.y, nz)) { p.vel.x *= -0.5; p.vel.z *= -0.5; } else p.vel.y = Math.abs(p.vel.y) * 0.45; continue; }
          if (p.boomer && !hitTarget) { this._boom(nx, ny, nz, p.rad, p.dmg * 0.5, p.col, { ench: p.ench, quiet: true }); continue; }
          this._explodeProj(p, nx, ny, nz); done = true; break;
        }
        p.pos.set(nx, ny, nz);
      }
      if (done) continue;
      if (p.bounce && p.t > 1.6) { this._explodeProj(p, p.pos.x, p.pos.y, p.pos.z); continue; }
      if (p.life <= 0 || p.pos.y < 0 || p.pos.y > 120) { if (p.boomer) { p.m.dispose(); continue; } this._explodeProj(p, p.pos.x, p.pos.y, p.pos.z); continue; }
      p.m.position.copyFrom(p.pos); p.m.rotation.x += dt * 9; p.m.rotation.y += dt * 7;
      out.push(p);
    }
    this.projs = out;
  }
  _explodeProj(p, x, y, z) {
    p.m.dispose();
    this._boom(x, y, z, p.rad, p.dmg, p.col, { ench: p.ench, suck: p.suck });
    if (p.cluster) for (let i = 0; i < p.cluster; i++) { const d = new Vector3((Math.random() - 0.5) * 2, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 2).normalize(); this.projs.push(this._proj(new Vector3(x, y + 0.5, z), d, 9 + Math.random() * 5, p.w, p.dmg * 0.4, Math.max(1.2, p.rad * 0.5), p.col, { ench: [], grav: 16, bounce: true, kind: 'cube' })); }
  }
  _beam(from, dir, w, dmg, rad, pierce, col, ench) {
    const world = this.app.world; let ox = from.x, oy = from.y, oz = from.z, left = pierce + 1, total = 0; const pts = [from.clone()];
    while (left-- > 0 && total < 90) {
      const tg = this._rayTarget(ox, oy, oz, dir, 90 - total);
      const hit = world.raycast(ox, oy, oz, dir.x, dir.y, dir.z, 90 - total, (id) => id !== 0);
      let hx, hy, hz;
      if (tg && (!hit || tg.d < Vector3.Distance(new Vector3(ox, oy, oz), new Vector3(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5)))) { hx = tg.p.x; hy = tg.p.y; hz = tg.p.z; total += tg.d; }
      else if (hit) { hx = hit.x + 0.5; hy = hit.y + 0.5; hz = hit.z + 0.5; total += Vector3.Distance(new Vector3(ox, oy, oz), new Vector3(hx, hy, hz)); }
      else { hx = ox + dir.x * (90 - total); hy = oy + dir.y * (90 - total); hz = oz + dir.z * (90 - total); pts.push(new Vector3(hx, hy, hz)); break; }
      pts.push(new Vector3(hx, hy, hz));
      this._boom(hx, hy, hz, rad, dmg, col, { ench, quiet: true, chain: w.chain || ench.includes('chain') });
      ox = hx + dir.x * (rad + 0.6); oy = hy + dir.y * (rad + 0.6); oz = hz + dir.z * (rad + 0.6);
    }
    for (let i = 0; i + 1 < pts.length; i++) this._line(pts[i], pts[i + 1], col, Math.max(0.08, rad * 0.12));
  }
  _cone(from, dir, w, dmg, rad, col, ench) {
    const world = this.app.world; const len = w.range || 8;
    for (let k = 0; k < 3; k++) {
      const d = jitter(dir, 0.14); const hit = world.raycast(from.x, from.y, from.z, d.x, d.y, d.z, len, (id) => id !== 0);
      const tg = this._rayTarget(from.x, from.y, from.z, d, len);
      const px = tg ? tg.p.x : hit ? hit.x + 0.5 : from.x + d.x * len, py = tg ? tg.p.y : hit ? hit.y + 0.5 : from.y + d.y * len, pz = tg ? tg.p.z : hit ? hit.z + 0.5 : from.z + d.z * len;
      this._boom(px, py, pz, rad, dmg / 3, col, { ench, quiet: true, slow: w.slow ? 2 : 0, burn: w.trait === '화염' });
      this._puff(px, py, pz, col, 0.5 + Math.random() * 0.6);
    }
  }
  // ---- 폭발: 블록 날리기 + 보스 피해 ----
  _boom(x, y, z, rad, dmg, col, o = {}) {
    const app = this.app;
    this._removeSphere(x, y, z, rad, true);
    for (const t of this.hitTargets()) { const d = Vector3.Distance(t.pos, new Vector3(x, y, z)); if (d < rad + t.r) { const k = d < rad * 0.5 ? 1 : 0.6; t.hit(dmg * k, { slow: o.slow, burn: o.burn, from: app.player.position }); if (o.ench?.includes('vamp')) app.rpg.hp = Math.min(app.rpg.maxHp, app.rpg.hp + dmg * k * 0.08); } }
    if (o.chain) { const near = this.hitTargets().filter((t) => Vector3.Distance(t.pos, new Vector3(x, y, z)) < 14).slice(0, 2); for (const t of near) { t.hit(dmg * 0.5, {}); this._line(new Vector3(x, y, z), t.pos, '#c9a0ff', 0.06); } }
    if (!o.quiet) this._flash(x, y, z, rad, col);
    else this._puff(x, y, z, col, rad * 0.6);
    if (o.shake) app.followCam.shake?.(0.4);
  }
  _removeSphere(cx, cy, cz, rad, broadcast) {
    const w = this.app.world, ch = this.app.chunks; const r2 = rad * rad; let n = 0;
    const x0 = Math.floor(cx - rad), x1 = Math.ceil(cx + rad), y0 = Math.max(G, Math.floor(cy - rad)), y1 = Math.min(WORLD.SY - 1, Math.ceil(cy + rad)), z0 = Math.floor(cz - rad), z1 = Math.ceil(cz + rad);
    const debris = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz; if (dx * dx + dy * dy + dz * dz > r2) continue;
      const id = w.get(x, y, z); if (!id || !BLOCKS[id]?.breakable) continue;
      const key = `${x},${y},${z}`; if (!this.destroyed.has(key)) this.destroyed.set(key, { id, shape: w.getShape(x, y, z), t: performance.now() });
      ch.setBlock(x, y, z, B.AIR); n++;
      if (debris.length < 14 && Math.random() < 0.25) debris.push([x + 0.5, y + 0.5, z + 0.5, id]);
    }
    if (n) { this.destroyCount += n; this.app.rpg.destroyed += n; this._onDestroyed(n); for (const d of debris) this._debris(d[0], d[1], d[2], cx, cy, cz); }
    if (broadcast && n) this.app.net?.boom?.(cx, cy, cz, rad);
    return n;
  }
  _onDestroyed(n) { const rpg = this.app.rpg; this._destAcc = (this._destAcc || 0) + n; while (this._destAcc >= 40) { this._destAcc -= 40; const ups = rpg.addXp(2); this.app.stats.apply({ coins: 20 }); if (ups) this.app.hud.levelUp(ups); } this.app.hud.refreshStats(); }
  remoteBoom(x, y, z, r) { this._removeSphere(x, y, z, r, false); this._flash(x, y, z, r, '#ffb347'); }
  // 되돌리기: 50초 지난 조각부터 차례로 제자리에
  _restore(dt) {
    this.restoreT += dt; if (this.restoreT < 0.12 || !this.destroyed.size) return; this.restoreT = 0;
    const now = performance.now(), w = this.app.world, ch = this.app.chunks; let n = 0;
    for (const [key, d] of this.destroyed) {
      if (now - d.t < RESTORE_AFTER * 1000) continue;
      const [x, y, z] = key.split(',').map(Number);
      if (w.get(x, y, z) === B.AIR && !this._hitsPlayer(x, y, z)) { ch.setBlock(x, y, z, d.id, d.shape); this._puff(x + 0.5, y + 0.5, z + 0.5, '#ffffff', 0.35); }
      this.destroyed.delete(key); if (++n >= 24) break;
    }
  }
  _hitsPlayer(x, y, z) { const p = this.app.player.position; return x + 1 > p.x - 0.3 && x < p.x + 0.3 && z + 1 > p.z - 0.3 && z < p.z + 0.3 && y + 1 > p.y && y < p.y + 1.8; }
  // ---- 보스 대상 ----
  _nearestTarget(pos, maxD) { let best = null, bd = maxD; for (const t of this.hitTargets()) { const d = Vector3.Distance(t.pos, pos); if (d < bd) { bd = d; best = t.pos; } } return best; }
  _hitTarget(x, y, z, r) { for (const t of this.hitTargets()) { const dx = t.pos.x - x, dy = t.pos.y - y, dz = t.pos.z - z; if (dx * dx + dy * dy + dz * dz < (t.r + r) * (t.r + r)) return t; } return null; }
  _rayTarget(ox, oy, oz, dir, max) { let best = null; for (const t of this.hitTargets()) { const to = t.pos.subtract(new Vector3(ox, oy, oz)); const along = Vector3.Dot(to, dir); if (along < 0 || along > max) continue; const perp = to.subtract(dir.scale(along)).length(); if (perp < t.r + 0.4 && (!best || along < best.d)) best = { d: along, p: t.pos.clone() }; } return best; }
  // ---- 효과 ----
  _flash(x, y, z, r, col) { const m = MeshBuilder.CreateSphere('fl', { diameter: 1, segments: 8 }, this.scene); m.material = emat(this.scene, col, 0.75).clone('flm'); m.position.set(x, y, z); m.isPickable = false; this.fx.push({ m, t: 0, life: 0.35, grow: r * 2.2, kind: 'flash', ownMat: true }); }
  _puff(x, y, z, col, r) { const m = this._src('ball', col).createInstance('pf'); m.isVisible = true; m.isPickable = false; m.position.set(x, y, z); m.scaling.setAll(r); this.fx.push({ m, t: 0, life: 0.25, grow: r * 2, kind: 'puff' }); }
  _line(a, b, col, w) { const d = Vector3.Distance(a, b); if (d < 0.05) return; const m = MeshBuilder.CreateCylinder('ln', { height: d, diameter: w * 2, tessellation: 5 }, this.scene); m.material = emat(this.scene, col, 0.9); m.position.copyFrom(a.add(b).scale(0.5)); const dir = b.subtract(a).normalize(); const up = new Vector3(0, 1, 0); const axis = Vector3.Cross(up, dir); const ang = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(up, dir)))); if (axis.length() > 1e-4) m.rotate(axis.normalize(), ang); else if (dir.y < 0) m.rotation.z = Math.PI; m.isPickable = false; this.fx.push({ m, t: 0, life: 0.09, kind: 'line' }); }
  _debris(x, y, z, cx, cy, cz) { const m = this._src('cube', '#9a9a9a').createInstance('db'); m.isVisible = true; m.isPickable = false; m.position.set(x, y, z); const d = new Vector3(x - cx + (Math.random() - 0.5), y - cy + 1.5, z - cz + (Math.random() - 0.5)).normalize().scaleInPlace(6 + Math.random() * 6); this.fx.push({ m, t: 0, life: 1.1, kind: 'debris', vel: d, rot: Math.random() * 6 }); }
  _simFx(dt) {
    const out = [];
    for (const f of this.fx) {
      f.t += dt; const k = f.t / f.life;
      if (k >= 1) { if (f.ownMat) f.m.material.dispose(); f.m.dispose(); continue; }
      if (f.kind === 'flash') { f.m.scaling.setAll(0.3 + f.grow * Math.sqrt(k)); f.m.material.alpha = 0.75 * (1 - k); }
      else if (f.kind === 'puff') { f.m.scaling.setAll(f.m.scaling.x + f.grow * dt); }
      else if (f.kind === 'debris') { f.vel.y -= 22 * dt; f.m.position.addInPlace(f.vel.scale(dt)); f.m.rotation.x += f.rot * dt; f.m.rotation.z += f.rot * 0.7 * dt; }
      out.push(f);
    }
    this.fx = out;
  }
}
function rotY(v, a) { const c = Math.cos(a), s = Math.sin(a); return new Vector3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
function jitter(v, k) { return new Vector3(v.x + (Math.random() - 0.5) * k, v.y + (Math.random() - 0.5) * k, v.z + (Math.random() - 0.5) * k).normalize(); }
