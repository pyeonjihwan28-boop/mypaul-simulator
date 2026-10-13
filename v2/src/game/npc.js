// 학생 NPC — 구역 안에서 목적지를 골라 걷고, 막히면 다른 곳으로. (실제 인물 아님)
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { makeCharacter, PALETTES } from './character.js';
import { rng } from '../world/noise.js';

export class Students {
  constructor(scene, world, areas, count) {
    this.scene = scene; this.world = world; this.list = []; this.meshes = [];
    const R = rng(777);
    const pool = [];
    for (const a of areas) for (let i = 0; i < a.n; i++) pool.push(a);
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const a = pool[Math.floor(R() * pool.length)];
      const ch = makeCharacter(scene, PALETTES[i % PALETTES.length], i, 'npc' + i);
      this.meshes.push(...ch.meshes);
      const x = a.x0 + R() * (a.x1 - a.x0), z = a.z0 + R() * (a.z1 - a.z0);
      const s = { ch, area: a, pos: new Vector3(x, world.topAt(x, z), z), target: null, yaw: R() * 6.28, wait: R() * 2, speed: 1.1 + R() * 0.6, t: R() * 10, R };
      this.list.push(s); this._pick(s);
    }
  }
  _pick(s) { const a = s.area; s.target = { x: a.x0 + s.R() * (a.x1 - a.x0), z: a.z0 + s.R() * (a.z1 - a.z0) }; }
  update(dt, playerPos) {
    for (const s of this.list) {
      s.t += dt;
      const far = Vector3.DistanceSquared(s.pos, playerPos) > 90 * 90;
      if (far) { s.ch.root.setEnabled(false); continue; } else s.ch.root.setEnabled(true);
      let speed = 0;
      if (s.wait > 0) s.wait -= dt;
      else {
        const dx = s.target.x - s.pos.x, dz = s.target.z - s.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.6) { s.wait = 1 + s.R() * 4; this._pick(s); }
        else {
          const want = Math.atan2(dx, dz); let dd = want - s.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); s.yaw += dd * Math.min(1, dt * 6);
          const nx = s.pos.x + Math.sin(s.yaw) * s.speed * dt, nz = s.pos.z + Math.cos(s.yaw) * s.speed * dt;
          const w = this.world, hw = 0.28;
          const free = (y) => !w.aabbSolid(nx - hw, y + 0.02, nz - hw, nx + hw, y + 1.75, nz + hw);
          let ny = -1;
          if (free(s.pos.y)) ny = s.pos.y; else if (free(s.pos.y + 0.5)) ny = s.pos.y + 0.5; else if (free(s.pos.y + 1)) ny = s.pos.y + 1;
          if (ny < 0) { this._pick(s); s.wait = 0.3; }
          else {
            const floor = w.surfaceBelow(nx - hw, nz - hw, nx + hw, nz + hw, ny + 0.001);
            if (ny - floor > 1.2) { this._pick(s); s.wait = 0.3; } // 낭떠러지
            else { s.pos.x = nx; s.pos.z = nz; s.pos.y = floor; speed = s.speed; }
          }
        }
      }
      const r = s.ch.root; r.position.copyFrom(s.pos); r.rotation.y = s.yaw;
      s.ch.animate(s.t, speed / 4.3 * 1.6, dt);
    }
  }
}
