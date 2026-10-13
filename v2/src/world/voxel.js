// 복셀 세계 데이터 + 청크 메시 관리(워커와 통신).
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { WORLD, B, BLOCKS, KIND, SHAPE_BOX, packBlockTable, ATLAS_COLS, ATLAS_ROWS } from './blocks.js';

const { SX, SY, SZ, CHUNK } = WORLD;
const CX = SX / CHUNK, CZ = SZ / CHUNK;

export class VoxelWorld {
  constructor() {
    this.data = new Uint8Array(SX * SY * SZ); this.shape = new Uint8Array(SX * SY * SZ);
    this.solid = new Uint8Array(256); for (const d of BLOCKS) this.solid[d.id] = d.solid ? 1 : 0;
  }
  inBounds(x, y, z) { return x >= 0 && z >= 0 && y >= 0 && x < SX && z < SZ && y < SY; }
  get(x, y, z) { return this.inBounds(x, y, z) ? this.data[(x * SZ + z) * SY + y] : (y >= SY ? 0 : B.STONE); }
  getShape(x, y, z) { return this.inBounds(x, y, z) ? this.shape[(x * SZ + z) * SY + y] : 0; }
  set(x, y, z, id, shape = 0) { if (this.inBounds(x, y, z)) { const i = (x * SZ + z) * SY + y; this.data[i] = id; this.shape[i] = id === 0 ? 0 : shape; } }
  // 칸 단위: 단단한 블록이 있나 (모양 무시)
  isSolid(x, y, z) {
    if (y < 0) return true; if (y >= SY) return false;
    if (x < 0 || z < 0 || x >= SX || z >= SZ) return true;
    return this.solid[this.data[(x * SZ + z) * SY + y]] === 1;
  }
  // 칸의 충돌 상자(월드 좌표) 또는 null
  boxAt(x, y, z, out) {
    if (!this.isSolid(x, y, z)) return null;
    const b = this.inBounds(x, y, z) ? SHAPE_BOX[this.shape[(x * SZ + z) * SY + y]] : SHAPE_BOX[0];
    out[0] = x + b[0]; out[1] = y + b[1]; out[2] = z + b[2]; out[3] = x + b[3]; out[4] = y + b[4]; out[5] = z + b[5];
    return out;
  }
  // 점이 단단한 곳 안인가
  solidAt(px, py, pz) {
    const x = Math.floor(px), y = Math.floor(py), z = Math.floor(pz);
    if (!this.isSolid(x, y, z)) return false;
    const b = this.inBounds(x, y, z) ? SHAPE_BOX[this.shape[(x * SZ + z) * SY + y]] : SHAPE_BOX[0];
    const fx = px - x, fy = py - y, fz = pz - z;
    return fx >= b[0] && fx < b[3] && fy >= b[1] && fy < b[4] && fz >= b[2] && fz < b[5];
  }
  // 상자(월드 좌표)가 단단한 것과 겹치나
  aabbSolid(x0, y0, z0, x1, y1, z1) {
    const bx = _box;
    const ix0 = Math.floor(x0), ix1 = Math.floor(x1 - 1e-6), iz0 = Math.floor(z0), iz1 = Math.floor(z1 - 1e-6), iy0 = Math.floor(y0), iy1 = Math.floor(y1 - 1e-6);
    for (let x = ix0; x <= ix1; x++) for (let z = iz0; z <= iz1; z++) for (let y = iy0; y <= iy1; y++) {
      if (!this.boxAt(x, y, z, bx)) continue;
      if (x1 > bx[0] + 1e-6 && x0 < bx[3] - 1e-6 && y1 > bx[1] + 1e-6 && y0 < bx[4] - 1e-6 && z1 > bx[2] + 1e-6 && z0 < bx[5] - 1e-6) return true;
    }
    return false;
  }
  // 발자국(x0..x1, z0..z1) 아래 가장 높은 바닥 윗면 (yTop 이하)
  surfaceBelow(x0, z0, x1, z1, yTop) {
    const bx = _box; let best = 0;
    const ix0 = Math.floor(x0), ix1 = Math.floor(x1 - 1e-6), iz0 = Math.floor(z0), iz1 = Math.floor(z1 - 1e-6);
    for (let x = ix0; x <= ix1; x++) for (let z = iz0; z <= iz1; z++) {
      for (let y = Math.min(SY - 1, Math.floor(yTop)); y >= 0 && y > best - 1; y--) {
        if (!this.boxAt(x, y, z, bx)) continue;
        if (x1 > bx[0] + 1e-6 && x0 < bx[3] - 1e-6 && z1 > bx[2] + 1e-6 && z0 < bx[5] - 1e-6 && bx[4] <= yTop + 1e-6) { if (bx[4] > best) best = bx[4]; break; }
      }
    }
    return best;
  }
  // 점 (x,z) 에서 from 아래 가장 높은 바닥 윗면 (모양 반영)
  topAt(x, z, from = SY - 1) {
    const ix = Math.floor(x), iz = Math.floor(z);
    if (ix < 0 || iz < 0 || ix >= SX || iz >= SZ) return WORLD.GROUND;
    const fx = x - ix, fz = z - iz; const base = (ix * SZ + iz) * SY;
    for (let y = Math.min(Math.floor(from), SY - 1); y >= 0; y--) {
      const id = this.data[base + y]; if (!this.solid[id]) continue;
      const b = SHAPE_BOX[this.shape[base + y]];
      if (fx >= b[0] && fx < b[3] && fz >= b[2] && fz < b[5]) { if (y + b[4] <= from + 1e-6) return y + b[4]; }
      else if (b[0] === 0 && b[3] === 1 && b[2] === 0 && b[5] === 1) return y + b[4];
    }
    return 0;
  }
  // 상자 채우기 (양 끝 포함)
  fill(x0, y0, z0, x1, y1, z1, id, shape = 0) {
    if (x0 > x1) [x0, x1] = [x1, x0]; if (y0 > y1) [y0, y1] = [y1, y0]; if (z0 > z1) [z0, z1] = [z1, z0];
    x0 = Math.max(0, x0); z0 = Math.max(0, z0); y0 = Math.max(0, y0); x1 = Math.min(SX - 1, x1); z1 = Math.min(SZ - 1, z1); y1 = Math.min(SY - 1, y1);
    const d = this.data, sh = this.shape, sv = id === 0 ? 0 : shape;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const base = (x * SZ + z) * SY; d.fill(id, base + y0, base + y1 + 1); sh.fill(sv, base + y0, base + y1 + 1); }
  }
  // 속이 빈 상자(벽 두께 1)
  hollow(x0, y0, z0, x1, y1, z1, wall, inner = B.AIR) { this.fill(x0, y0, z0, x1, y1, z1, wall); if (x1 - x0 > 1 && z1 - z0 > 1 && y1 - y0 > 1) this.fill(x0 + 1, y0 + 1, z0 + 1, x1 - 1, y1 - 1, z1 - 1, inner); }
  // DDA 레이캐스트. 단단한 블록(또는 pick 가능한 블록)에 닿으면 {x,y,z,nx,ny,nz,dist}
  raycast(ox, oy, oz, dx, dy, dz, maxDist, hitFn = null) {
    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const sx = Math.sign(dx), sy = Math.sign(dy), sz = Math.sign(dz);
    const tdx = dx === 0 ? Infinity : Math.abs(1 / dx), tdy = dy === 0 ? Infinity : Math.abs(1 / dy), tdz = dz === 0 ? Infinity : Math.abs(1 / dz);
    let tx = dx === 0 ? Infinity : ((sx > 0 ? x + 1 - ox : ox - x) * tdx);
    let ty = dy === 0 ? Infinity : ((sy > 0 ? y + 1 - oy : oy - y) * tdy);
    let tz = dz === 0 ? Infinity : ((sz > 0 ? z + 1 - oz : oz - z) * tdz);
    let nx = 0, ny = 0, nz = 0, t = 0;
    for (let i = 0; i < 512; i++) {
      const id = this.get(x, y, z);
      const hit = hitFn ? hitFn(id) : (id !== 0 && this.solid[id]);
      if (hit && this.inBounds(x, y, z)) return { x, y, z, nx, ny, nz, dist: t, id, shape: this.getShape(x, y, z) };
      if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (ty < tz) { y += sy; t = ty; ty += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tz; tz += tdz; nx = 0; ny = 0; nz = -sz; }
      if (t > maxDist) return null;
      if (y < 0 || y >= SY + 2) return null;
    }
    return null;
  }
}
const _box = new Float64Array(6);

// ---------- 청크 메시 관리 ----------
export class ChunkManager {
  /**
   * @param scene Babylon Scene
   * @param world VoxelWorld
   * @param mats {opaque, cutout, glass} PBR 재질
   * @param atlasTile 타일 픽셀 크기
   */
  constructor(scene, world, mats, atlasTile, workerUrl) {
    this.scene = scene; this.world = world; this.mats = mats;
    this.chunks = new Map(); // key → {cx,cz,meshes:{opaque,cutout,glass}, gen}
    this.pending = new Set(); this.dirty = new Set();
    this.gen = 0; this.ready = false; this.onChunkBuilt = null; this.built = 0; this.total = CX * CZ;
    this.viewDist = 10; this.shadowCasters = null; // (mesh)=>void 등록 콜백
    this.root = new TransformNode('chunks', scene);
    this.worker = new Worker(workerUrl);
    this.worker.onmessage = (ev) => this._onMessage(ev.data);
    this.worker.postMessage({ type: 'init', world: world.data.slice(), shape: world.shape.slice(), dims: { SX, SY, SZ, CHUNK }, table: packBlockTable(), atlas: { cols: ATLAS_COLS, rows: ATLAS_ROWS, tile: atlasTile, inset: 0.5 } }, []);
    this._readyPromise = new Promise((r) => { this._resolveReady = r; });
  }
  whenReady() { return this._readyPromise; }
  key(cx, cz) { return cx * 1000 + cz; }
  // 중심에서 가까운 순으로 모든 청크 요청
  requestAll(px, pz) {
    const list = [];
    for (let cx = 0; cx < CX; cx++) for (let cz = 0; cz < CZ; cz++) list.push([cx, cz]);
    list.sort((a, b) => Math.hypot((a[0] + 0.5) * CHUNK - px, (a[1] + 0.5) * CHUNK - pz) - Math.hypot((b[0] + 0.5) * CHUNK - px, (b[1] + 0.5) * CHUNK - pz));
    for (let i = 0; i < list.length; i += 8) this.worker.postMessage({ type: 'mesh', chunks: list.slice(i, i + 8), gen: this.gen });
    this.total = list.length; this.built = 0;
  }
  setBlock(x, y, z, id, shape = 0) {
    if (!this.world.inBounds(x, y, z)) return false;
    if (this.world.get(x, y, z) === id && this.world.getShape(x, y, z) === shape) return false;
    this.world.set(x, y, z, id, shape);
    this.worker.postMessage({ type: 'set', updates: new Int32Array([x, y, z, id, id === 0 ? 0 : shape]) });
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    this.dirty.add(this.key(cx, cz));
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    if (lx === 0 && cx > 0) this.dirty.add(this.key(cx - 1, cz)); if (lx === CHUNK - 1 && cx < CX - 1) this.dirty.add(this.key(cx + 1, cz));
    if (lz === 0 && cz > 0) this.dirty.add(this.key(cx, cz - 1)); if (lz === CHUNK - 1 && cz < CZ - 1) this.dirty.add(this.key(cx, cz + 1));
    return true;
  }
  flushDirty() {
    if (this.dirty.size === 0) return;
    const chunks = [...this.dirty].map((k) => [Math.floor(k / 1000), k % 1000]);
    this.dirty.clear();
    this.worker.postMessage({ type: 'mesh', chunks, gen: this.gen });
  }
  _onMessage(m) {
    if (m.type === 'ready') { this.ready = true; this._resolveReady(); return; }
    if (m.type === 'chunk') this._applyChunk(m.cx, m.cz, m.geo);
  }
  _applyChunk(cx, cz, geo) {
    const key = this.key(cx, cz);
    let c = this.chunks.get(key);
    if (!c) { c = { cx, cz, meshes: {} }; this.chunks.set(key, c); }
    for (const kind of ['opaque', 'cutout', 'glass']) {
      const old = c.meshes[kind];
      if (old) { old.dispose(false, false); c.meshes[kind] = null; }
      const g = geo[kind];
      if (!g) continue;
      const mesh = this._buildMesh(`c${cx}_${cz}_${kind}`, g, this.mats[kind], cx, cz, kind);
      c.meshes[kind] = mesh;
      if (this.shadowCasters) this.shadowCasters(mesh, kind);
    }
    this.built++; this.meshesChanged = true;
    if (this.onChunkBuilt) this.onChunkBuilt(this.built, this.total);
  }
  _buildMesh(name, g, material, cx, cz, kind) {
    const scene = this.scene, engine = scene.getEngine();
    const mesh = new Mesh(name, scene);
    mesh.setVerticesBuffer(new VertexBuffer(engine, g.pos, VertexBuffer.PositionKind, { size: 3 }));
    mesh.setVerticesBuffer(new VertexBuffer(engine, g.nrm, VertexBuffer.NormalKind, { size: 3, normalized: true }));
    mesh.setVerticesBuffer(new VertexBuffer(engine, g.uv, VertexBuffer.UVKind, { size: 2 }));
    mesh.setVerticesBuffer(new VertexBuffer(engine, g.col, VertexBuffer.ColorKind, { size: 4, normalized: true }));
    mesh.setIndices(g.idx, g.count);
    mesh.material = material;
    mesh.position.set(cx * CHUNK, 0, cz * CHUNK);
    mesh.parent = this.root;
    mesh.isPickable = false; mesh.receiveShadows = true;
    mesh.cullingStrategy = AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
    mesh.alphaIndex = kind === 'glass' ? 10 : 0;
    mesh.freezeWorldMatrix();
    mesh.metadata = { chunk: true, cx, cz, kind };
    return mesh;
  }
  // 시야 거리 밖 청크 끄기
  update(px, pz) {
    const vd = this.viewDist * CHUNK;
    for (const c of this.chunks.values()) {
      const d = Math.hypot((c.cx + 0.5) * CHUNK - px, (c.cz + 0.5) * CHUNK - pz);
      const on = d < vd;
      for (const k in c.meshes) { const m = c.meshes[k]; if (m && m.isEnabled() !== on) m.setEnabled(on); }
    }
  }
  forEachMesh(fn) { for (const c of this.chunks.values()) for (const k in c.meshes) if (c.meshes[k]) fn(c.meshes[k], k); }
}
