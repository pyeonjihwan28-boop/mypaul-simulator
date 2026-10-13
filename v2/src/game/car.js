// 차 — 플레이어 차(아케이드 물리) + 도로를 도는 NPC 차. 밤에는 헤드라이트(스포트라이트)·후미등.
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { WORLD } from '../world/blocks.js';

const mats = new Map();
function mat(scene, key, fn) { if (!mats.has(key)) { const m = new PBRMaterial('car_' + key, scene); fn(m); mats.set(key, m); } return mats.get(key); }
const CAR_COLORS = ['#c8102e', '#f2f2f2', '#1b1b1f', '#2a5db0', '#d7a21a', '#4a4f57', '#1f7a46', '#8c8f94'];

export function makeCarMesh(scene, colorHex, name = 'car') {
  const root = new TransformNode(name, scene);
  const meshes = [];
  const paint = mat(scene, 'paint' + colorHex, (m) => { m.albedoColor = Color3.FromHexString(colorHex); m.metallic = 0.6; m.roughness = 0.25; m.clearCoat.isEnabled = true; m.clearCoat.intensity = 0.6; m.clearCoat.roughness = 0.08; });
  const glass = mat(scene, 'glass', (m) => { m.albedoColor = new Color3(0.08, 0.1, 0.13); m.metallic = 0.2; m.roughness = 0.05; m.alpha = 0.78; m.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND; });
  const rubber = mat(scene, 'rubber', (m) => { m.albedoColor = new Color3(0.06, 0.06, 0.06); m.roughness = 0.9; m.metallic = 0; });
  const rim = mat(scene, 'rim', (m) => { m.albedoColor = new Color3(0.75, 0.75, 0.78); m.roughness = 0.3; m.metallic = 1; });
  const dark = mat(scene, 'dark', (m) => { m.albedoColor = new Color3(0.1, 0.1, 0.11); m.roughness = 0.6; m.metallic = 0.3; });
  const head = mat(scene, 'head', (m) => { m.albedoColor = new Color3(0.9, 0.9, 0.85); m.emissiveColor = new Color3(1, 0.97, 0.85); m.emissiveIntensity = 0; m.roughness = 0.2; m.metallic = 0; });
  const tail = mat(scene, 'tail', (m) => { m.albedoColor = new Color3(0.6, 0.05, 0.05); m.emissiveColor = new Color3(1, 0.1, 0.05); m.emissiveIntensity = 0; m.roughness = 0.3; m.metallic = 0; });
  const box = (n, w, h, d, m, x, y, z, parent = root) => { const b = MeshBuilder.CreateBox(n, { width: w, height: h, depth: d }, scene); b.material = m; b.parent = parent; b.position.set(x, y, z); b.isPickable = false; b.receiveShadows = true; meshes.push(b); return b; };
  // 차체(앞 = +z)
  box('body', 1.9, 0.62, 4.4, paint, 0, 0.62, 0);
  box('hood', 1.8, 0.22, 1.2, paint, 0, 1.02, 1.5);
  box('cabin', 1.7, 0.62, 2.2, paint, 0, 1.22, -0.1);
  box('winF', 1.6, 0.5, 0.08, glass, 0, 1.25, 1.0); box('winB', 1.6, 0.46, 0.08, glass, 0, 1.25, -1.2);
  box('winL', 0.06, 0.44, 2.0, glass, -0.86, 1.25, -0.1); box('winR', 0.06, 0.44, 2.0, glass, 0.86, 1.25, -0.1);
  box('bumperF', 1.95, 0.25, 0.2, dark, 0, 0.42, 2.25); box('bumperB', 1.95, 0.25, 0.2, dark, 0, 0.42, -2.25);
  box('grill', 1.0, 0.2, 0.06, dark, 0, 0.72, 2.23);
  const hl = box('headL', 0.42, 0.18, 0.08, head, -0.62, 0.8, 2.22), hr = box('headR', 0.42, 0.18, 0.08, head, 0.62, 0.8, 2.22);
  box('tailL', 0.42, 0.16, 0.08, tail, -0.62, 0.8, -2.22); box('tailR', 0.42, 0.16, 0.08, tail, 0.62, 0.8, -2.22);
  box('plate', 0.5, 0.14, 0.03, mat(scene, 'plate', (m) => { m.albedoColor = new Color3(0.95, 0.95, 0.95); m.roughness = 0.5; }), 0, 0.55, -2.36);
  box('mirrorL', 0.12, 0.1, 0.22, paint, -1.0, 1.1, 0.95); box('mirrorR', 0.12, 0.1, 0.22, paint, 1.0, 1.1, 0.95);
  // 바퀴
  const wheels = [];
  for (const [x, z] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) {
    const w = new TransformNode('wheel', scene); w.parent = root; w.position.set(x, 0.36, z);
    const tyre = MeshBuilder.CreateCylinder('tyre', { diameter: 0.72, height: 0.26, tessellation: 14 }, scene); tyre.rotation.z = Math.PI / 2; tyre.material = rubber; tyre.parent = w; tyre.isPickable = false; meshes.push(tyre);
    const r = MeshBuilder.CreateCylinder('rim', { diameter: 0.42, height: 0.28, tessellation: 10 }, scene); r.rotation.z = Math.PI / 2; r.material = rim; r.parent = w; r.isPickable = false; meshes.push(r);
    wheels.push(w);
  }
  return { root, meshes, wheels, headMat: head, tailMat: tail, headL: hl, headR: hr };
}

// 복셀 세계에서 차 바닥 높이 · 충돌
function carBlocked(world, x, y, z, heading, halfW = 1.0, halfL = 2.25) {
  const c = Math.cos(heading), s = Math.sin(heading);
  for (const [lx, lz] of [[-halfW, halfL], [halfW, halfL], [-halfW, -halfL], [halfW, -halfL], [0, halfL], [0, -halfL]]) {
    const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
    if (world.solidAt(wx, y + 0.55, wz) || world.solidAt(wx, y + 1.3, wz)) return true;
  }
  return false;
}

export class Car {
  constructor(scene, world, spawn, lighting) {
    this.scene = scene; this.world = world; this.lighting = lighting;
    this.position = new Vector3(spawn.x, world.topAt(spawn.x, spawn.z), spawn.z);
    this.heading = spawn.heading; this.speed = 0; this.steer = 0; this.vy = 0;
    this.fuel = 70; // 연료 % — 달리면 줄고, 주유기(마트)에서 채움
    this.mesh = makeCarMesh(scene, '#f5c542', 'playerCar');
    this.meshes = this.mesh.meshes;
    this.lights = null;
    this._sync();
  }
  get kmh() { return Math.abs(this.speed) * 3.6; }
  _sync() { const r = this.mesh.root; r.position.copyFrom(this.position); r.rotation.y = this.heading; }
  near(p, d = 3.6) { return Vector3.Distance(p, this.position) < d; }
  // 타고 있을 때 호출
  update(dt, input, player) {
    const fwd = input.move.y, turn = input.move.x;
    const empty = this.fuel <= 0;
    const maxF = empty ? 2.5 : (input.run ? 30 : 24), maxR = empty ? 1.5 : 8;
    this.fuel = Math.max(0, this.fuel - Math.abs(this.speed) * dt * (input.run ? 0.02 : 0.013));
    let acc = 0;
    if (fwd > 0) acc = this.speed < 0 ? 18 : 9.5 * fwd; else if (fwd < 0) acc = this.speed > 0.5 ? -16 : -6;
    if (input.brake) acc = -Math.sign(this.speed) * 20;
    this.speed += acc * dt;
    // 저항
    this.speed -= this.speed * (0.35 + (fwd === 0 && !input.brake ? 0.9 : 0)) * dt;
    this.speed = Math.max(-maxR, Math.min(maxF, this.speed));
    if (Math.abs(this.speed) < 0.05 && fwd === 0) this.speed = 0;
    // 조향(속도 느릴수록 많이 꺾임)
    const steerMax = 0.65 / (1 + Math.abs(this.speed) * 0.09);
    this.steer += (turn * steerMax - this.steer) * Math.min(1, dt * 7);
    this.heading += this.steer * this.speed * dt * 0.42;
    // 이동 + 충돌
    const nx = this.position.x + Math.sin(this.heading) * this.speed * dt, nz = this.position.z + Math.cos(this.heading) * this.speed * dt;
    if (carBlocked(this.world, nx, this.position.y, nz, this.heading)) {
      // 한 칸 올라갈 수 있으면 올라가고(경계석), 아니면 튕김
      if (Math.abs(this.speed) < 9 && !carBlocked(this.world, nx, this.position.y + 0.5, nz, this.heading)) { this.position.y += 0.5; this.position.x = nx; this.position.z = nz; }
      else if (Math.abs(this.speed) < 7 && !carBlocked(this.world, nx, this.position.y + 1, nz, this.heading)) { this.position.y += 1; this.position.x = nx; this.position.z = nz; }
      else { this.speed *= -0.25; this.bump = 0.2; }
    } else { this.position.x = nx; this.position.z = nz; }
    // 바닥 높이 따라가기
    const ground = this.world.topAt(this.position.x, this.position.z, Math.floor(this.position.y + 1.2));
    if (this.position.y > ground + 0.02) { this.vy -= 22 * dt; this.position.y = Math.max(ground, this.position.y + this.vy * dt); } else { this.position.y = ground; this.vy = 0; }
    this.position.x = Math.max(2, Math.min(WORLD.SX - 2, this.position.x)); this.position.z = Math.max(2, Math.min(WORLD.SZ - 2, this.position.z));
    // 바퀴
    for (let i = 0; i < 4; i++) { const w = this.mesh.wheels[i]; w.rotation.x += this.speed * dt / 0.36; if (i < 2) w.rotation.y = this.steer * 0.8; }
    this._sync();
    player.position.set(this.position.x, this.position.y, this.position.z); player.yaw = this.heading;
    // 플레이어가 서 있을 수 있는 자리 기억 (내릴 때)
  }
  setNight(night, on) {
    const k = on ? 1 : 0;
    this.mesh.headMat.emissiveIntensity = k * (0.6 + night * 1.6); this.mesh.tailMat.emissiveIntensity = k * (0.4 + night * 1.2);
    if (!this.lights && this.lighting.cluster) {
      this.lights = [this.lighting.addSpotLight(this.position, new Vector3(0, 0, 1), 0.9, 30, new Color3(1, 0.97, 0.88), 70), this.lighting.addSpotLight(this.position, new Vector3(0, 0, 1), 0.9, 30, new Color3(1, 0.97, 0.88), 70)];
    }
    if (this.lights) {
      const c = Math.cos(this.heading), s = Math.sin(this.heading);
      const inten = on ? 70 * (0.2 + night) : 0;
      this.lights.forEach((l, i) => { if (!l) return; const lx = i === 0 ? -0.62 : 0.62; l.position.set(this.position.x + lx * c + 2.2 * s, this.position.y + 0.85, this.position.z - lx * s + 2.2 * c); l.direction.set(s, -0.22, c); l.intensity = inten; l.metadata.base = inten; });
    }
  }
  // 내릴 자리
  exitPosition() { const c = Math.cos(this.heading), s = Math.sin(this.heading); return new Vector3(this.position.x - 1.9 * c, this.position.y, this.position.z + 1.9 * s); }
}

// NPC 교통
export class Traffic {
  constructor(scene, world, lanes, count, lighting) {
    this.scene = scene; this.world = world; this.lighting = lighting; this.cars = []; this.meshes = [];
    const n = Math.min(count, 12);
    for (let i = 0; i < n; i++) {
      const path = lanes[i % lanes.length];
      const m = makeCarMesh(scene, CAR_COLORS[i % CAR_COLORS.length], 'npcCar' + i);
      this.meshes.push(...m.meshes);
      const seg = Math.floor((i / n) * path.length);
      this.cars.push({ mesh: m, path, seg, t: (i * 0.37) % 1, speed: 7 + (i % 3) * 1.2, v: 0, heading: 0, pos: new Vector3(), lights: null });
    }
  }
  update(dt, night, playerPos) {
    const on = night > 0.05 || this.lighting.lightsOn;
    for (const c of this.cars) {
      const a = c.path[c.seg], b = c.path[(c.seg + 1) % c.path.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // 코너 근처 감속 · 플레이어 가까우면 감속
      const distToEnd = (1 - c.t) * len;
      let want = c.speed; if (distToEnd < 10) want = Math.min(want, 3 + distToEnd * 0.5);
      const px = a[0] + (b[0] - a[0]) * c.t, pz = a[1] + (b[1] - a[1]) * c.t;
      const dp = Math.hypot(playerPos.x - px, playerPos.z - pz);
      if (dp < 5) want = 0; else if (dp < 10) want = Math.min(want, 2);
      c.v += (want - c.v) * Math.min(1, dt * 2.5);
      c.t += c.v * dt / len;
      if (c.t >= 1) { c.t -= 1; c.seg = (c.seg + 1) % c.path.length; }
      const heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
      let d = heading - c.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); c.heading += d * Math.min(1, dt * 4);
      c.pos.set(px, this.world.topAt(px, pz), pz);
      const r = c.mesh.root; r.position.copyFrom(c.pos); r.rotation.y = c.heading;
      for (const w of c.mesh.wheels) w.rotation.x += c.v * dt / 0.36;
      c.mesh.headMat.emissiveIntensity = on ? 0.6 + night * 1.6 : 0; c.mesh.tailMat.emissiveIntensity = on ? 0.3 + night * 1.0 : 0;
      // 헤드라이트(가까운 차만)
      if (this.lighting.cluster) {
        if (!c.lights) c.lights = [this.lighting.addSpotLight(c.pos, new Vector3(0, 0, 1), 0.95, 24, new Color3(1, 0.96, 0.85), 0), this.lighting.addSpotLight(c.pos, new Vector3(0, 0, 1), 0.95, 24, new Color3(1, 0.96, 0.85), 0)];
        const cs = Math.cos(c.heading), sn = Math.sin(c.heading);
        const inten = on && dp < 90 ? 50 * (0.2 + night) : 0;
        c.lights.forEach((l, i) => { if (!l) return; const lx = i === 0 ? -0.62 : 0.62; l.position.set(c.pos.x + lx * cs + 2.2 * sn, c.pos.y + 0.85, c.pos.z - lx * sn + 2.2 * cs); l.direction.set(sn, -0.2, cs); l.intensity = inten; l.metadata.base = inten; });
      }
    }
  }
}
