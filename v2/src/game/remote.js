// 다른 사람(같이 하기) — 캐릭터 + 이름표 + (차에 탔으면) 차. 위치는 받은 값으로 부드럽게 따라감.
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { makeCharacter, PALETTES } from './character.js';
import { makeCarMesh } from './car.js';

const hashStr = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const CAR_COLORS = ['#e04a4a', '#3b7ddd', '#3fa65b', '#e08a2a', '#9b59b6', '#17b8b0'];

export class RemotePlayers {
  constructor(app) { this.app = app; this.scene = app.scene; this.map = new Map(); this.t = 0; }
  _nameTag(name, color) {
    const w = 256, h = 64, tex = new DynamicTexture('tag_' + name, { width: w, height: h }, this.scene, true);
    const c = tex.getContext(); c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(11,17,32,.78)'; c.beginPath(); c.roundRect(8, 8, w - 16, h - 16, 14); c.fill();
    c.font = '600 28px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(name, w / 2, h / 2 + 1);
    tex.update(true); tex.hasAlpha = true;
    const m = new StandardMaterial('tagM_' + name, this.scene); m.diffuseTexture = tex; m.opacityTexture = tex; m.emissiveColor = new Color3(1, 1, 1); m.disableLighting = true; m.backFaceCulling = false;
    const p = MeshBuilder.CreatePlane('tagP_' + name, { width: 1.4, height: 0.35 }, this.scene); p.material = m; p.billboardMode = Mesh.BILLBOARDMODE_ALL; p.isPickable = false; p.renderingGroupId = 1;
    return p;
  }
  _make(id, name) {
    const h = hashStr(id);
    const ch = makeCharacter(this.scene, PALETTES[h % PALETTES.length], h % 4, 'rp_' + id);
    const tag = this._nameTag(name || '친구', '#f5c542'); tag.parent = ch.root; tag.position.set(0, 2.15, 0);
    const car = makeCarMesh(this.scene, CAR_COLORS[h % CAR_COLORS.length], 'rcar_' + id); car.root.setEnabled(false);
    for (const m of [...ch.meshes, ...car.meshes]) this.app.lighting.addCaster(m);
    const r = { id, name, ch, tag, car, pos: new Vector3(0, 8, 0), target: new Vector3(0, 8, 0), yaw: 0, tyaw: 0, speed: 0, inCar: false, heading: 0, theading: 0, last: performance.now(), got: false };
    this.map.set(id, r); return r;
  }
  state(id, d, name) {
    if (!d || typeof d.x !== 'number') return;
    const r = this.map.get(id) || this._make(id, name || d.n);
    if (name && name !== r.name) { r.name = name; r.tag.dispose(); r.tag = this._nameTag(name, '#f5c542'); r.tag.parent = r.ch.root; r.tag.position.set(0, 2.15, 0); }
    if (!r.got) { r.pos.set(d.x, d.y, d.z); r.yaw = d.r || 0; r.heading = d.h || 0; r.got = true; }
    r.target.set(d.x, d.y, d.z); r.tyaw = d.r || 0; r.speed = d.a || 0; r.inCar = !!d.c; r.theading = d.h || 0; r.last = performance.now();
  }
  remove(id) { const r = this.map.get(id); if (!r) return; r.ch.setVisible(false); for (const m of r.ch.meshes) m.dispose(); r.tag.dispose(); for (const m of r.car.meshes) m.dispose(); r.car.root.dispose(); this.map.delete(id); }
  clear() { for (const id of [...this.map.keys()]) this.remove(id); }
  get count() { return this.map.size; }
  update(dt) {
    this.t += dt; const now = performance.now();
    for (const r of this.map.values()) {
      const k = Math.min(1, dt * 12);
      r.pos.x += (r.target.x - r.pos.x) * k; r.pos.y += (r.target.y - r.pos.y) * k; r.pos.z += (r.target.z - r.pos.z) * k;
      let d = r.tyaw - r.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); r.yaw += d * Math.min(1, dt * 10);
      let dh = r.theading - r.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); r.heading += dh * Math.min(1, dt * 10);
      const stale = now - r.last > 6000;
      if (r.inCar) {
        r.ch.setVisible(false); r.car.root.setEnabled(!stale); r.car.root.position.copyFrom(r.pos); r.car.root.rotation.y = r.heading;
        r.tag.parent = r.car.root; r.tag.position.set(0, 2.0, 0);
      } else {
        r.car.root.setEnabled(false); r.ch.setVisible(!stale); r.tag.parent = r.ch.root; r.tag.position.set(0, 2.15, 0);
        r.ch.root.position.copyFrom(r.pos); r.ch.root.rotation.y = r.yaw; r.ch.animate(this.t, r.speed, dt);
      }
    }
  }
}
