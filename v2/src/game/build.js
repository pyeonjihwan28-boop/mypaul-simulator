// 짓기 — 조준한 블록 캐기(꾹 눌러서 · 블록 단단함 × 도구 속도)/놓기, 조준 표시, 핫바(가방 앞 9칸). 캔 블록은 가방에, 음식은 우클릭(놓기 버튼)으로 먹어요.
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { B, BLOCKS, SHAPE, SHAPE_NAMES } from '../world/blocks.js';
import { breakTime, dropOf, itemOf } from './items.js';
import { HOTBAR_N } from './inventory.js';

const REACH = 7;
export class Builder {
  constructor(scene, world, chunks, player, cam, input, inv) {
    this.scene = scene; this.world = world; this.chunks = chunks; this.player = player; this.cam = cam; this.input = input; this.inv = inv;
    this.active = false; this.sel = 0; this.shape = SHAPE.FULL; this.hit = null; this.cool = 0; this.edits = 0;
    this.prog = 0; this.progKey = ''; // 캐는 중(0~1) · 캐고 있는 블록 자리
    const box = MeshBuilder.CreateBox('aim', { size: 1.02 }, scene);
    const m = new StandardMaterial('aimMat', scene); m.wireframe = true; m.emissiveColor = new Color3(1, 0.85, 0.3); m.disableLighting = true; m.alpha = 0.9;
    box.material = m; box.isPickable = false; box.setEnabled(false); box.renderingGroupId = 1; this.aim = box; this.aimMat = m;
    this.onChange = null; this.onTip = null; this.onEdit = null; this.onEat = null; // HUD · 네트워크 · 먹기
    inv.onChange = () => this.onChange?.();
  }
  toggle() { this.active = !this.active; this.aim.setEnabled(false); this.prog = 0; this.cam.noWheel = this.active; this.onChange?.(); }
  get slots() { return this.inv.slots.slice(0, HOTBAR_N); }
  get slot() { return this.inv.slots[this.sel]; }
  get item() { const s = this.slot; return s ? itemOf(s.id) : null; }
  get blockId() { const it = this.item; return it && it.kind === 'block' ? it.block : null; }
  get tool() { const it = this.item; return it && it.kind === 'tool' ? it : null; }
  count(id = this.blockId) { return id === null || id === undefined ? 0 : this.inv.count(id); }
  add(id, n) { const left = this.inv.add(id, n); if (left > 0) this.onTip?.('가방이 가득 찼어요 — 가방(I)에서 정리해요'); return left; }
  // 한 줄 설명(HUD)
  describe() {
    const it = this.item; if (!it) return `빈 칸 · ${this.shapeName}`;
    if (it.kind === 'block') return `${it.n} ${this.count()}개 · ${this.shapeName} (V 로 모양)`;
    if (it.kind === 'tool') return `${it.n} — 캐는 속도 ×${it.speed}`;
    if (it.kind === 'food') return `${it.n} ${this.slot.n}개 — 우클릭(놓기 버튼)으로 먹어요`;
    return `${it.n} ${this.slot.n}개 — 제작 재료 (가방 I → 제작)`;
  }
  update(dt) {
    const inp = this.input;
    if (inp.consume('build')) this.toggle();
    if (inp.consume('hotbar')) { this.sel = Math.min(HOTBAR_N - 1, inp.hotbarSel); this.prog = 0; this.onChange?.(); }
    if (inp.consume('nextBlock')) { this.sel = (this.sel + 1) % HOTBAR_N; this.prog = 0; this.onChange?.(); }
    if (this.active && inp.wheel) { this.sel = (this.sel + (inp.wheel > 0 ? 1 : HOTBAR_N - 1)) % HOTBAR_N; this.prog = 0; this.onChange?.(); }
    if (inp.consume('shape')) { this.shape = (this.shape + 1) % 7; this.onChange?.(); }
    if (!this.active || this.player.inCar) { this.aim.setEnabled(false); this.prog = 0; return; }
    const r = this.cam.ray();
    const hit = this.world.raycast(r.ox, r.oy, r.oz, r.dx, r.dy, r.dz, REACH, (id) => id !== 0);
    this.hit = hit;
    if (hit) { this.aim.setEnabled(true); this.aim.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5); } else this.aim.setEnabled(false);
    this.cool -= dt;
    const it = this.item;
    // 음식: 우클릭(놓기)으로 먹기
    if (it && it.kind === 'food' && inp.consume('place')) { this.eat(this.sel); return; }
    // 캐기: 꾹 누르는 동안 진행
    const key = hit ? `${hit.x},${hit.y},${hit.z}` : '';
    if (hit && inp.breakHeld && hit.y > 1 && BLOCKS[hit.id]?.breakable) {
      if (key !== this.progKey) { this.prog = 0; this.progKey = key; }
      const t = breakTime(hit.id, this.tool), now = performance.now(), real = Math.min(0.3, (now - (this._lastT || now)) / 1000); this._lastT = now; // 느린 기기에서도 실제 시간대로
      this.prog += Math.max(dt, real) / Math.max(0.05, t);
      if (this.prog >= 1) {
        this.chunks.setBlock(hit.x, hit.y, hit.z, B.AIR); this.onEdit?.(hit.x, hit.y, hit.z, B.AIR, 0);
        const d = dropOf(hit.id); if (d) this.add(d[0], d[1]);
        this.edits++; this.prog = 0; this.progKey = ''; this.cool = 0.08;
      }
    } else { this.prog = 0; this.progKey = ''; this._lastT = 0; inp.consume('break'); }
    // 조준 상자 색: 캐는 정도에 따라 노랑 → 빨강
    this.aimMat.emissiveColor.set(1, 0.85 - this.prog * 0.6, 0.3 - this.prog * 0.3);
    const doPlace = inp.consume('place') || (inp.placeHeld && this.cool <= 0);
    if (hit && doPlace && this.cool <= 0) {
      const id = this.blockId;
      if (id === null) { this.onTip?.(it ? `${it.n}은(는) 놓을 수 없어요 — 블록 칸을 골라요` : '빈 칸이에요 — 숫자 키나 핫바를 눌러 블록을 골라요'); this.cool = 0.4; return; }
      const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
      if (!this._hitsPlayer(x, y, z) && this.world.get(x, y, z) === B.AIR) { const sh = this._autoShape(hit); this.chunks.setBlock(x, y, z, id, sh); this.onEdit?.(x, y, z, id, sh); this.inv.takeAt(this.sel, 1); this.edits++; this.cool = 0.18; }
    }
  }
  // 먹기 — 가방 칸 i의 음식
  eat(i) {
    const s = this.inv.slots[i]; const it = s && itemOf(s.id); if (!it || it.kind !== 'food') return false;
    this.inv.takeAt(i, 1); this.onEat?.(it); return true;
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
