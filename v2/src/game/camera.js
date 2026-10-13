// 3인칭 추적 카메라 — 마우스/터치로 돌리고, 벽에 막히면 당겨 온다. 아주 가까이 당기면 1인칭.
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import '@babylonjs/core/Culling/ray.js';

export class FollowCamera {
  constructor(camera, world, player, input, canvas) {
    this.camera = camera; this.world = world; this.player = player; this.input = input; this.canvas = canvas;
    this.yaw = 0; this.pitch = 0.32; this.dist = 4.6; this.targetDist = 4.6;
    this.pos = camera.position.clone(); this.target = new Vector3();
    this.car = null; // 타고 있는 차
    this._tmp = new Vector3(); this._dir = new Vector3();
    this.firstPerson = false;
  }
  update(dt) {
    const inp = this.input;
    const sens = 0.0022;
    this.yaw -= inp.look.dx * sens; this.pitch += inp.look.dy * sens;
    this.pitch = Math.max(-0.6, Math.min(1.3, this.pitch));
    if (inp.wheel && !this.noWheel) { this.targetDist = Math.max(0.0, Math.min(10, this.targetDist + inp.wheel * 0.7)); }
    if (inp.consume('camera')) this.targetDist = this.targetDist < 1 ? 4.6 : 0;
    // 차 안: 뒤에서 멀리
    const inCar = !!this.car && this.player.inCar;
    const wantDist = inCar ? Math.max(this.targetDist, 6.5) : this.targetDist;
    this.dist += (wantDist - this.dist) * Math.min(1, dt * 8);
    if (inCar && Math.abs(inp.look.dx) < 0.5) { let d = this.car.heading - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * Math.min(1, dt * 1.6); }
    this.player.moveYaw = this.yaw;
    this.firstPerson = this.dist < 0.9 && !inCar;
    // 목표점(머리)
    const p = inCar ? this.car.position : this.player.position;
    this.target.set(p.x, p.y + (inCar ? 1.3 : 1.55), p.z);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    this._dir.set(-Math.sin(this.yaw) * cp, sp, -Math.cos(this.yaw) * cp); // 뒤쪽 방향
    let d = this.dist;
    if (!this.firstPerson) {
      // 벽 뚫기 방지: 머리에서 카메라 쪽으로 레이
      const hit = this.world.raycast(this.target.x, this.target.y, this.target.z, this._dir.x, this._dir.y, this._dir.z, d + 0.4);
      if (hit) d = Math.max(0.5, hit.dist - 0.45);
      const want = this._tmp.copyFrom(this._dir).scaleInPlace(d).addInPlace(this.target);
      this.pos.x += (want.x - this.pos.x) * Math.min(1, dt * 22); this.pos.y += (want.y - this.pos.y) * Math.min(1, dt * 22); this.pos.z += (want.z - this.pos.z) * Math.min(1, dt * 22);
      // 어깨 너머 살짝 오른쪽
      this.camera.position.copyFrom(this.pos);
      this.camera.setTarget(this.target);
      this.player.setVisible(true);
    } else {
      const eye = this.player.eye; this.pos.copyFrom(eye); this.camera.position.copyFrom(eye);
      const look = this._tmp.set(Math.sin(this.yaw) * cp, -sp, Math.cos(this.yaw) * cp).addInPlace(eye);
      this.camera.setTarget(look);
      this.player.setVisible(false);
    }
    if (inCar) this.player.setVisible(false);
  }
  // 조준 레이(화면 중앙)
  ray() { const o = this.camera.position, f = this.camera.getForwardRay(1).direction; return { ox: o.x, oy: o.y, oz: o.z, dx: f.x, dy: f.y, dz: f.z }; }
}
