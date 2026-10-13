// 짓기 — 조준한 블록 캐기/놓기, 조준 표시, 핫바 + 블록 주머니(캐면 들어오고, 놓으면 나감 · 매점·문방구에서 살 수 있음).
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { B, BLOCKS, HOTBAR, SHAPE, SHAPE_NAMES } from '../world/blocks.js';

const REACH = 7;
const START = { GRASS: 12, STONE: 24, PLANKS: 24, BRICK: 12, SCHOOL_WALL: 12, WINDOW: 8, LOG: 10, LEAVES: 16, LAMP_HEAD: 4 };
export class Builder {
  constructor(scene, world, chunks, player, cam, input, save = {}) {
    this.scene = scene; this.world = world; this.chunks = chunks; this.player = player; this.cam = cam; this.input = input;
    this.active = false; this.sel = 0; this.shape = SHAPE.FULL; this.hit = null; this.cool = 0; this.edits = 0;
    this.inv = save.inv || Object.fromEntries(Object.entries(START).map(([k, n]) => [B[k], n]));
    const box = MeshBuilder.CreateBox('aim', { size: 1.02 }, scene);
    const m = new StandardMaterial('aimMat', scene); m.wireframe = true; m.emissiveColor = new Color3(1, 0.85, 0.3); m.disableLighting = true; m.alpha = 0.9;
    box.material = m; box.isPickable = false; box.setEnabled(false); box.renderingGroupId = 1; this.aim = box;
    this.onChange = null; this.onTip = null; this.onEdit = null; // HUD · 네트워크 알림
  }
  toggle() { this.active = !this.active; this.aim.setEnabled(false); this.onChange?.(); }
  // 핫바 칸: 기본 9개 + 주머니에 있는 다른 블록(최대 9개)
  get slots() { const base = HOTBAR.map((k) => B[k]); const extra = Object.keys(this.inv).map(Number).filter((id) => this.inv[id] > 0 && !base.includes(id)).slice(0, 9); return base.concat(extra); }
  get blockId() { const s = this.slots; return s[Math.min(this.sel, s.length - 1)]; }
  count(id = this.blockId) { return this.inv[id] || 0; }
  add(id, n) { this.inv[id] = (this.inv[id] || 0) + n; this.onChange?.(); }
  update(dt) {
    const inp = this.input;
    if (inp.consume('build')) this.toggle();
    if (inp.consume('hotbar')) { this.sel = Math.min(this.slots.length - 1, inp.hotbarSel); this.onChange?.(); }
    if (inp.consume('nextBlock')) { this.sel = (this.sel + 1) % this.slots.length; this.onChange?.(); }
    if (inp.consume('shape')) { this.shape = (this.shape + 1) % 7; this.onChange?.(); }
    if (!this.active || this.player.inCar) { this.aim.setEnabled(false); return; }
    const r = this.cam.ray();
    const hit = this.world.raycast(r.ox, r.oy, r.oz, r.dx, r.dy, r.dz, REACH, (id) => id !== 0);
    this.hit = hit;
    if (hit) { this.aim.setEnabled(true); this.aim.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5); } else this.aim.setEnabled(false);
    this.cool -= dt;
    const doBreak = inp.consume('break') || (inp.breakHeld && this.cool <= 0);
    const doPlace = inp.consume('place') || (inp.placeHeld && this.cool <= 0);
    if (hit && doBreak && this.cool <= 0) {
      if (hit.y > 1 && BLOCKS[hit.id]?.breakable) { this.chunks.setBlock(hit.x, hit.y, hit.z, B.AIR); this.onEdit?.(hit.x, hit.y, hit.z, B.AIR, 0); this.add(hit.id, 1); this.edits++; this.cool = 0.18; }
    } else if (hit && doPlace && this.cool <= 0) {
      const id = this.blockId;
      if (this.count(id) <= 0) { this.onTip?.(`${BLOCKS[id].name} 블록이 없어요 — 캐서 모으거나 매점·문방구에서 사요`); this.cool = 0.4; return; }
      const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
      if (!this._hitsPlayer(x, y, z) && this.world.get(x, y, z) === B.AIR) { const sh = this._autoShape(hit); this.chunks.setBlock(x, y, z, id, sh); this.onEdit?.(x, y, z, id, sh); this.inv[id]--; this.edits++; this.cool = 0.18; this.onChange?.(); }
    }
  }
  // 슬래브는 조준한 면의 위/아래에 따라 자동으로 아래/위 반블록
  _autoShape(hit) {
    if (this.shape === SHAPE.SLAB_BOTTOM || this.shape === SHAPE.SLAB_TOP) { if (hit.ny < 0) return SHAPE.SLAB_TOP; if (hit.ny > 0) return SHAPE.SLAB_BOTTOM; }
    return this.shape;
  }
  get shapeName() { return SHAPE_NAMES[this.shape]; }
  _hitsPlayer(x, y, z) {
    const p = this.player.position; const half = 0.3;
    return x + 1 > p.x - half && x < p.x + half && z + 1 > p.z - half && z < p.z + half && y + 1 > p.y && y < p.y + 1.8;
  }
}
