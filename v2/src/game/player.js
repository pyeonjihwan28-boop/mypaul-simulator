// 플레이어 — 복셀 충돌(AABB) · 점프 · 계단 자동 오르기 · 걷기 애니메이션.
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { makeCharacter, PALETTES } from './character.js';
import { WORLD } from '../world/blocks.js';

const HALF = 0.3, HEIGHT = 1.8, GRAVITY = 26, JUMP_V = 8.6, WALK = 4.3, RUN = 7.6, EYE = 1.62;

export class Player {
  constructor(scene, world, spawn, input) {
    this.scene = scene; this.world = world; this.input = input;
    this.position = new Vector3(spawn.x, spawn.y, spawn.z); // 발 중심
    this.vel = new Vector3(0, 0, 0);
    this.yaw = Math.PI; // 바라보는 방향(남쪽 = 교문 쪽)
    this.onGround = false; this.inCar = false; this.speed = 0; this.t = 0;
    this.moveYaw = 0; // 카메라가 넣어주는 이동 기준 방향
    this.speedMult = 1; // 탈것 · 능력치
    this.char = makeCharacter(scene, PALETTES[0], 0, 'player');
    this.meshes = this.char.meshes;
    this.visualY = this.position.y;
    this.fixSpawn();
  }
  fixSpawn() {
    // 단단한 블록 안이면 위로 밀어 올림
    const p = this.position; let y = p.y;
    for (let i = 0; i < 60 && this.collides(p.x, y, p.z); i++) y += 0.5;
    const floor = this.world.surfaceBelow(p.x - HALF, p.z - HALF, p.x + HALF, p.z + HALF, y + 0.001);
    if (y - floor > 0.01 && !this.collides(p.x, floor, p.z)) y = floor;
    p.y = y; this.visualY = y;
  }
  get eye() { return new Vector3(this.position.x, this.position.y + EYE, this.position.z); }
  collides(x, y, z) { return this.world.aabbSolid(x - HALF, y, z - HALF, x + HALF, y + HEIGHT, z + HALF); }
  update(dt) {
    const inp = this.input, p = this.position, v = this.vel;
    this.t += dt;
    // 이동 입력 → 카메라 기준
    const mx = inp.move.x, my = inp.move.y, mag = Math.hypot(mx, my);
    const target = mag > 0 ? (inp.run ? RUN : WALK) * this.speedMult : 0;
    const fx = Math.sin(this.moveYaw), fz = Math.cos(this.moveYaw), rx = Math.cos(this.moveYaw), rz = -Math.sin(this.moveYaw);
    let dx = 0, dz = 0;
    if (mag > 0) { dx = (fx * my + rx * mx) / mag; dz = (fz * my + rz * mx) / mag; const want = Math.atan2(dx, dz); let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * Math.min(1, dt * 14); }
    const accel = this.onGround ? 34 : 10;
    v.x += (dx * target * Math.min(1, mag) - v.x) * Math.min(1, accel * dt);
    v.z += (dz * target * Math.min(1, mag) - v.z) * Math.min(1, accel * dt);
    // 점프 · 중력
    if (inp.jump && this.onGround) { v.y = JUMP_V; this.onGround = false; }
    v.y -= GRAVITY * dt; if (v.y < -40) v.y = -40;
    // 축별 이동 + 충돌
    this._moveAxis(p, v, dt);
    this.speed = Math.hypot(v.x, v.z);
    // 세계 경계
    p.x = Math.max(1, Math.min(WORLD.SX - 1, p.x)); p.z = Math.max(1, Math.min(WORLD.SZ - 1, p.z));
    // 시각 위치(계단 오를 때 부드럽게)
    this.visualY += (p.y - this.visualY) * Math.min(1, dt * 18);
    const r = this.char.root; r.position.set(p.x, this.visualY, p.z); r.rotation.y = this.yaw;
    this.char.animate(this.t, this.onGround ? this.speed / WALK : 0.2, dt);
  }
  _moveAxis(p, v, dt) {
    const w = this.world;
    // y
    let ny = p.y + v.y * dt;
    if (v.y <= 0) {
      const floor = w.surfaceBelow(p.x - HALF, p.z - HALF, p.x + HALF, p.z + HALF, p.y + 0.001);
      if (ny <= floor) { ny = floor; v.y = 0; this.onGround = true; }
      else this.onGround = ny - floor < 0.02;
    } else {
      if (this.collides(p.x, ny, p.z)) { ny = p.y; v.y = 0; }
      this.onGround = false;
    }
    p.y = ny;
    // x, z (막히면 반 칸·한 칸 오르기 시도)
    for (const axis of ['x', 'z']) {
      const d = v[axis] * dt; if (d === 0) continue;
      const nx = axis === 'x' ? p.x + d : p.x, nz = axis === 'z' ? p.z + d : p.z;
      if (!this.collides(nx, p.y, nz)) { p[axis] += d; continue; }
      let stepped = false;
      if (this.onGround) for (const h of [0.5, 1.0]) {
        if (!this.collides(nx, p.y + h, nz) && !this.collides(p.x, p.y + h, p.z)) { p.y += h; p[axis] += d; stepped = true; break; }
      }
      if (!stepped) v[axis] = 0;
    }
  }
  setVisible(v) { this.char.setVisible(v); }
}
