// 탈것 24종 — 타면 걷기가 빨라지고 발밑에 탈것 모양이 따라와요 (날아다니는 종류는 살짝 떠서). 건물 안·차 안에서는 자동으로 내려요.
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VEHICLE_BY, GRADE6 } from './rpg.js';

const FLY = new Set(['broom', 'carpet', 'jetpack', 'rocket', 'unicorn', 'ufo', 'drake', 'gboard', 'hover']);
const WHEELS = new Set(['kick', 'roller', 'skate', 'bike', 'mart', 'ekick', 'wheel', 'scoot', 'mtb', 'cart', 'atv', 'gokart', 'tank', 'moto']);

export class Ride {
  constructor(app) { this.app = app; this.scene = app.scene; this.k = ''; this.node = null; this.t = 0; }
  _mat(hex, emis = 0) { const m = new StandardMaterial('rm' + hex + emis, this.scene); m.diffuseColor = Color3.FromHexString(hex); m.specularColor = Color3.Black(); if (emis) m.emissiveColor = Color3.FromHexString(hex).scale(emis); return m; }
  set(k) {
    if (this.node) { this.node.dispose(false, true); this.node = null; }
    this.k = k || ''; this.app.rpg.vehicle = this.k;
    if (!this.k) { this.app.player.speedMult = 1; return; }
    const v = VEHICLE_BY[this.k]; if (!v) { this.k = ''; return; }
    const g = GRADE6[v.g], col = g.c; const root = new TransformNode('ride', this.scene);
    const body = MeshBuilder.CreateBox('rb', { width: 0.7, height: 0.18, depth: 1.5 }, this.scene); body.material = this._mat(col, FLY.has(this.k) ? 0.5 : 0.1); body.parent = root; body.position.y = 0.12 + (FLY.has(this.k) ? 0.35 : 0);
    if (WHEELS.has(this.k)) { for (const dz of [-0.55, 0.55]) { const w = MeshBuilder.CreateCylinder('rw', { diameter: 0.34, height: 0.16, tessellation: 10 }, this.scene); w.rotation.z = Math.PI / 2; w.material = this._mat('#222222'); w.parent = root; w.position.set(0, 0.17, dz); } }
    if (['kick', 'ekick', 'scoot', 'moto', 'bike', 'mtb', 'wheel', 'broom'].includes(this.k)) { const pole = MeshBuilder.CreateBox('rp', { width: 0.06, height: 0.9, depth: 0.06 }, this.scene); pole.material = this._mat('#888888'); pole.parent = root; pole.position.set(0, 0.6, 0.6); const bar = MeshBuilder.CreateBox('rbar', { width: 0.5, height: 0.05, depth: 0.05 }, this.scene); bar.material = this._mat('#444444'); bar.parent = root; bar.position.set(0, 1.05, 0.6); }
    // 이름표(그림 + 이름)
    const tex = new DynamicTexture('rt' + this.k, { width: 256, height: 64 }, this.scene, true); const c = tex.getContext(); c.clearRect(0, 0, 256, 64); c.font = '600 30px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(`${v.e} ${v.n}`, 128, 34); tex.update(true); tex.hasAlpha = true;
    const tm = new StandardMaterial('rtm', this.scene); tm.diffuseTexture = tex; tm.opacityTexture = tex; tm.emissiveColor = Color3.White(); tm.disableLighting = true; tm.backFaceCulling = false;
    const tag = MeshBuilder.CreatePlane('rtag', { width: 1.4, height: 0.35 }, this.scene); tag.material = tm; tag.billboardMode = Mesh.BILLBOARDMODE_ALL; tag.parent = root; tag.position.y = 2.45; tag.isPickable = false;
    for (const m of root.getChildMeshes()) { m.isPickable = false; this.app.lighting.addCaster(m); }
    this.node = root; this.app.player.speedMult = v.spd;
  }
  update(dt) {
    if (!this.node) return; this.t += dt;
    const p = this.app.player, a = this.app;
    // 건물 안(머리 위 2.5m 안에 블록) · 차 안 · 1인칭이면 숨김, 건물 안이면 내림
    const inside = a.world.solidAt(p.position.x, p.position.y + 2.6, p.position.z) && a.world.solidAt(p.position.x, p.position.y + 3.2, p.position.z);
    if (p.inCar || inside) { if (inside && this.k) { a.hud.tip('건물 안이라 탈것에서 내렸어요'); this.set(''); } this.node && this.node.setEnabled(false); return; }
    this.node.setEnabled(!a.followCam.firstPerson);
    const bob = FLY.has(this.k) ? Math.sin(this.t * 2.2) * 0.08 : 0;
    this.node.position.set(p.position.x, p.visualY + bob, p.position.z); this.node.rotation.y = p.yaw;
    a.player.speedMult = (VEHICLE_BY[this.k]?.spd || 1) * a.rpg.runMult();
  }
}
