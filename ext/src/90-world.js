/* ───────────── 5단계: 레드스톤 · 무너진 차원문 → 용암 차원 · 주인공 3명 ─────────────
   레드스톤: 레버 · 압력판 · 레드스톤 횃불(전원) → 레드스톤 선 → 램프 · 피스톤 (같은 방 친구와 레버 맞춰요)
   차원문: 마크 '무너진 차원문'의 빠진 흑요석을 채우고 부싯돌과 부시로 불 → 용암 차원 (보물 창고 · 금 · 석영)
   주인공: 5장 한탕 뒤 '번개'(배달 라이더) · '망치'(블록 건축가)와 바꿔 가며 놀아요 (GTA5처럼) · 둘 다 가상 인물 */

const NB$m = MPI.newBlocks;
// ══ 레드스톤 ══
const RSB = { lever: NB$m.lever, wire: NB$m.redstone_wire, plate: NB$m.stone_pressure_plate, lamp: NB$m.redstone_lamp, lampOn: NB$m.redstone_lamp_on, piston: NB$m.piston };
RSB.head = mpBlk("piston_head", MPT.PISTON_TOP, MPT.PISTON_TOP, { n: "피스톤 머리", ic: "🗜️", h: 1.5, r: 1.5, d: "", key: "piston_head" });
RSB.torch = mpBlk("redstone_torch", MPT.TORCH, MPT.TORCH, { n: "레드스톤 횃불", ic: "🕯️", h: .01, r: .01, d: "redstone_torch", d0: 1, d1: 1, e: 1, key: "redstone_torch_b" });
ji.redstone_torch = ["레드스톤 횃불", "🕯️", "blk", 8]; MPI.blockOf.redstone_torch = RSB.torch; MPI.itemOf[RSB.torch] = "redstone_torch";
Object.assign(Kt[RSB.torch], { deco: 1, g: 1, door: 1 });
Kt[RSB.piston].deco = 1; Kt[RSB.head].deco = 1;
const RS = (MP.rs = { on: new Set(), pow: new Map(), press: new Set(), src: new Set(), dir: {}, cells: new Map(), dirty: 1, t: 0 });
const rk = (x, yy, z) => x + "," + yy + "," + z, rp = k => k.split(",").map(Number);
const isRS = id => !!id && (id === RSB.lever || id === RSB.wire || id === RSB.plate || id === RSB.lamp || id === RSB.lampOn || id === RSB.piston || id === RSB.torch || id === RSB.head);
const DV = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
{ // 놓기 · 부수기를 지켜봐요
  const prev = BLD.setBlock;
  BLD.setBlock = (x, yy, z, id, net, force) => {
    x = Math.floor(x); yy = Math.floor(yy); z = Math.floor(z);
    const old = Hr(x, yy, z), r = prev(x, yy, z, id, net, force);
    if (r && (isRS(id) || isRS(old))) {
      const k = rk(x, yy, z);
      if (isRS(id)) RS.cells.set(k, id);
      else { RS.cells.delete(k); RS.on.delete(k); if (old === RSB.piston) { const d = RS.dir[k] ?? 2, [dx, dy, dz] = DV[d]; if (Hr(x + dx, yy + dy, z + dz) === RSB.head) setTimeout(() => BLD.setBlock(x + dx, yy + dy, z + dz, 0), 0); } delete RS.dir[k]; }
      RS.dirty = 1;
    } else if (r && RS.cells.size) RS.dirty = 1;
    return r;
  };
  MP.setBlock = BLD.setBlock;
}
RS.scan = () => {
  RS.cells.clear();
  for (const m of [BLD.put, BLD.rput]) for (const [key, mm] of m) { const [cx, cz] = key.split(",").map(Number); for (const [li, id] of mm) if (isRS(id)) RS.cells.set(rk(cx * 64 + (li % 64), (li / 4096) | 0, cz * 64 + ((li >> 6) % 64)), id); }
  RS.dirty = 1;
};
const movable = id => { const b = Kt[id]; if (!b || b.deco || isRS(id)) return false; return !/obsidian|lava_rock|vault|chest|furnace|crafting_table|bed/.test(b.mc || "") && !(b.r >= 1000); };
const pistonSet = (k, want) => {
  const d = RS.dir[k] ?? 2, [x, yy, z] = rp(k), [dx, dy, dz] = DV[d];
  const fx = x + dx, fy = yy + dy, fz = z + dz, fk = rk(fx, fy, fz);
  const ext = Hr(fx, fy, fz) === RSB.head;
  if (want && !ext) {
    const fid = Hr(fx, fy, fz);
    if (fid) {
      if (!movable(fid)) return;
      const gx = fx + dx, gy = fy + dy, gz = fz + dz;
      if (Hr(gx, gy, gz) || gy < 0 || gy >= ws - 1) return;
      BLD.setBlock(gx, gy, gz, fid, 0, 1);
    }
    RS.dir[fk] = d; BLD.setBlock(fx, fy, fz, RSB.head, 0, 1); MP.decoVer = (MP.decoVer || 0) + 1;
    try { Lt("chestOpen", Math.hypot(x - c.P.x, z - c.P.z), 1.6); } catch (e) {}
  } else if (!want && ext) { BLD.setBlock(fx, fy, fz, 0); delete RS.dir[fk]; MP.decoVer = (MP.decoVer || 0) + 1; try { Lt("chestClose", Math.hypot(x - c.P.x, z - c.P.z), 1.5); } catch (e) {} }
};
RS.update = () => {
  RS.dirty = 0;
  const cells = RS.cells, src = new Set(), pow = new Map(), qq = [];
  for (const [k, id] of cells) if (id === RSB.torch || (id === RSB.lever && RS.on.has(k)) || (id === RSB.plate && RS.press.has(k))) src.add(k);
  for (const k of src) { const [x, yy, z] = rp(k); for (const [dx, dy, dz] of DV) { const nk = rk(x + dx, yy + dy, z + dz); if (cells.get(nk) === RSB.wire && (pow.get(nk) | 0) < 15) { pow.set(nk, 15); qq.push(nk); } } }
  while (qq.length) {
    const k = qq.shift(), p = pow.get(k); if (p <= 1) continue;
    const [x, yy, z] = rp(k);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const dy of [0, 1, -1]) { const nk = rk(x + dx, yy + dy, z + dz); if (cells.get(nk) === RSB.wire && (pow.get(nk) | 0) < p - 1) { pow.set(nk, p - 1); qq.push(nk); } }
  }
  const powered = k => { const [x, yy, z] = rp(k); for (const [dx, dy, dz] of DV) { const nk = rk(x + dx, yy + dy, z + dz); if (src.has(nk) || pow.get(nk) > 0) return true; } return false; };
  let ch = pow.size !== RS.pow.size; if (!ch) for (const [k, v] of pow) if (!(RS.pow.get(k) > 0) !== !(v > 0)) { ch = true; break; }
  RS.pow = pow; RS.src = src;
  for (const [k, id] of [...cells]) {
    if (id === RSB.lamp || id === RSB.lampOn) {
      const want = powered(k);
      if (want !== (id === RSB.lampOn)) { const [x, yy, z] = rp(k); BLD.setBlock(x, yy, z, want ? RSB.lampOn : RSB.lamp, 0, 1); if (want && !RS.lit1) { RS.lit1 = 1; mpToast("💡 레드스톤 램프가 켜졌어요! 레드스톤 회로 성공", 2200); } }
    } else if (id === RSB.piston) pistonSet(k, powered(k));
  }
  if (ch) MP.decoVer = (MP.decoVer || 0) + 1;
};
RS.toggle = (k, net) => {
  const on = !RS.on.has(k); if (on) RS.on.add(k); else RS.on.delete(k);
  RS.dirty = 1; MP.decoVer = (MP.decoVer || 0) + 1;
  try { q("click"); Lt("brk_stone", 0, 2.2); } catch (e) {}
  if (!net) { const [x, yy, z] = rp(k); mpNet("mrs", [x, yy, z, on ? 1 : 0]); mpSave(); }
};
MP.useOn2 = (prev => tg => { if (tg.id === RSB.lever) { RS.toggle(rk(tg.x, tg.y, tg.z)); return true; } return prev ? prev(tg) : false; })(MP.useOn2);
// 피스톤은 내가 보는 쪽으로 밀어요
MP.onPlace = (prev => (x, yy, z, bid) => {
  prev && prev(x, yy, z, bid);
  if (bid !== RSB.piston) return;
  const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), pit = c.pitch || 0;
  RS.dir[rk(x, yy, z)] = pit > .85 ? 5 : pit < -.85 ? 4 : Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 0 : 1) : (fz > 0 ? 2 : 3);
  MP.decoVer = (MP.decoVer || 0) + 1;
})(MP.onPlace);
// 모양: 피스톤 · 피스톤 머리 · 레드스톤 횃불 · 눌린 압력판
{
  const prev = DECO.build;
  const mat = (cl, em) => new v.MeshStandardMaterial({ color: cl, roughness: .8, emissive: em ? cl : 0, emissiveIntensity: em ? 1.4 : 0 });
  const box = (g, w, h, d, m, x, yy, z) => { const b = new v.Mesh(new v.BoxGeometry(w, h, d), m); b.position.set(x, yy, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const orient = (inner, d) => { if (d === 0) inner.rotation.y = Math.PI / 2; else if (d === 1) inner.rotation.y = -Math.PI / 2; else if (d === 3) inner.rotation.y = Math.PI; else if (d === 4) inner.rotation.x = -Math.PI / 2; else if (d === 5) inner.rotation.x = Math.PI / 2; };
  DECO.build = (id, x, yy, z) => {
    const k = rk(x, yy, z);
    if (id === RSB.piston || id === RSB.head) {
      const g = new v.Group(); g.position.set(x + .5, yy, z + .5);
      const inner = new v.Group(); inner.position.y = .5; g.add(inner);
      const d = RS.dir[k] ?? 2, wood = mat(0xb98349), stone = mat(0x8a8d92), iron = mat(0x5c5f64);
      if (id === RSB.piston) {
        const ext = (() => { const [dx, dy, dz] = DV[d]; return Hr(x + dx, yy + dy, z + dz) === RSB.head; })();
        box(inner, 1, 1, .75, stone, 0, 0, -.125); box(inner, .3, .3, .3, iron, 0, 0, .3);
        if (!ext) box(inner, 1, 1, .25, wood, 0, 0, .375);
      } else { box(inner, 1, 1, .25, wood, 0, 0, .375); box(inner, .25, .25, .8, iron, 0, 0, -.15); }
      orient(inner, d); return g;
    }
    if (id === RSB.torch) {
      const g = new v.Group(); g.position.set(x + .5, yy, z + .5);
      box(g, .1, .55, .1, mat(0x6b4423), 0, .28, 0); box(g, .17, .17, .17, mat(0xff2a2a, 1), 0, .63, 0);
      return g;
    }
    if (id === RSB.plate && RS.press.has(k)) { const g = new v.Group(); g.position.set(x + .5, yy, z + .5); box(g, .86, .03, .86, mat(0x9a9da2), 0, .015, 0); return g; }
    return prev(id, x, yy, z);
  };
}
const rsTick = dt => {
  if (!RS.cells.size) return;
  // 압력판 (내가 밟고 있나)
  const P = c.P, pk = rk(Math.floor(P.x), Math.floor(P.y + .05), Math.floor(P.z));
  const press = RS.cells.get(pk) === RSB.plate ? pk : "";
  if (press !== (RS.pk || "")) { RS.press = new Set(press ? [press] : []); RS.pk = press; RS.dirty = 1; MP.decoVer = (MP.decoVer || 0) + 1; if (press) try { Lt("brk_stone", 0, 2); } catch (e) {} }
  if (RS.dirty || (RS.t -= dt) <= 0) { RS.t = 1; RS.update(); }
};
const rsNear = (L, P) => {
  if (!RS.cells.size) return;
  for (const [k, id] of RS.cells) {
    if (id !== RSB.lever) continue;
    const [x, yy, z] = rp(k); if (Math.hypot(x + .5 - P.x, z + .5 - P.z) > 2.2 || Math.abs(yy - P.y) > 2.5) continue;
    L.push({ x: x + .5, z: z + .5, y: yy, r: 2.2, l: "🕹️ 레버 " + (RS.on.has(k) ? "끄기" : "켜기"), fn: () => RS.toggle(k) });
    break;
  }
};

// ══ 용암 차원 ══
mpTile(200, (g, e) => { mpGrad(g, "#7a2b2b", "#5e1f22"); for (const [px, py] of [[40, 50], [150, 60], [190, 150], [70, 170], [120, 110]]) { mpRect(g, "#f7d043", px, py, 26, 18); mpRect(e, "#5a4500", px, py, 26, 18); } });
mpTile(201, g => { mpGrad(g, "#7a2b2b", "#5e1f22"); for (const [px, py] of [[36, 40], [140, 50], [196, 140], [60, 180], [118, 112], [180, 210]]) mpRect(g, "#f2ece2", px, py, 28, 16); });
const NGOLD = mpBlk("nether_gold_ore", 200, null, { n: "네더 금 광석", ic: "🟡", h: 3, r: 3, d: "gold_nugget", d0: 2, d1: 6 });
const NQUARTZ = mpBlk("nether_quartz_ore", 201, null, { n: "네더 석영 광석", ic: "⚪", h: 3, r: 3, d: "quartz", d0: 1, d1: 2, e: 1 });
mpAdd("quartz", "네더 석영", "⚪", "r", 12);
MP.recipes.push({ o: ["quartz_block", 1], i: [["quartz", 4]], at: "hand", cat: "블록" });
MP.recipes.push({ o: ["gold_ingot", 1], i: [["gold_nugget", 9]], at: "hand", cat: "재료" });
SHOP.find(s => s[0] === "블록")[1].push(["obsidian", 4, 400]);
const DIM = (MP.dim = { cx: -400, cz: 400, R: 9, P: 2, portals: new Map(), lit: new Set(), back: null, in: false, cyc: {}, pick: 0, planes: new Map() });
DIM.x0 = (DIM.cx - DIM.P) * 64; DIM.x1 = (DIM.cx + DIM.P + 1) * 64; DIM.z0 = (DIM.cz - DIM.P) * 64; DIM.z1 = (DIM.cz + DIM.P + 1) * 64;
DIM.spawn = [(DIM.cx + .5) * 64, (DIM.cz + .5) * 64];
DIM.home = { r: DIM.spawn[0], a: DIM.spawn[1] - 7 };          // 돌아가는 차원문 (모양은 같아요)
DIM.vault = [DIM.x0 + 52, DIM.z0 + 52];
DIM.chests = [[DIM.vault[0] - 3, 2, DIM.vault[1]], [DIM.vault[0] + 3, 2, DIM.vault[1]]];
const inDimChunk = (cx, cz) => Math.abs(cx - DIM.cx) <= DIM.R && Math.abs(cz - DIM.cz) <= DIM.R;
MP.inDim = () => { const P = c.P; return !!(S.out && Math.abs(P.x - DIM.spawn[0]) < (DIM.R + .5) * 64 && Math.abs(P.z - DIM.spawn[1]) < (DIM.R + .5) * 64); };
const dh = (a, b, s) => { let h = (Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 1274126177)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vn = (x, z, sc, s) => { const gx = Math.floor(x / sc), gz = Math.floor(z / sc), fx = x / sc - gx, fz = z / sc - gz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), a = dh(gx, gz, s), b = dh(gx + 1, gz, s), c2 = dh(gx, gz + 1, s), d = dh(gx + 1, gz + 1, s); return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d) * u * v; };
const colAt = (x, z) => {
  if (Math.hypot(x - DIM.spawn[0], z - DIM.spawn[1]) < 15 || Math.hypot(x - DIM.vault[0], z - DIM.vault[1]) < 13) return [2, 1, "flat"];
  if (vn(x, z, 34, 3) < .24) return [1, 2];
  const h = 1 + Math.floor((vn(x, z, 26, 1) * .72 + vn(x, z, 9, 2) * .28) * 7.5);
  return [h, vn(x, z, 40, 4) > .7 ? 3 : h >= 6 ? 4 : 0];
};
const dimChunk = (cx, cz, lod) => {
  const Q = { cx, cz, lod, g: br(), sg: br(), bb: [], door: [], box: [], chest: [], tree: [], lamp: [], car: [], ride: [], veh: [], mini: [], it: [], mob: [], sp: [], bld: [], bed: [], st: "", d: "dim", dimQ: 1 };
  const X0 = cx * 64, Z0 = cz * 64, NR = NB$m.netherrack;
  const MAT = [NR, NR, NB$m.lava_rock, NB$m.soul_soil, NB$m.basalt];
  const B = (x1, y1, z1, x2, y2, z2, id) => Q.bb.push([x1, y1, z1, x2, y2, z2, id, 63, 0]);
  const inside = X0 >= DIM.x0 && X0 < DIM.x1 && Z0 >= DIM.z0 && Z0 < DIM.z1;
  if (!inside) { B(X0, 0, Z0, X0 + 64, 26, Z0 + 64, NR); Q.mini.push(["#3a1214", X0, Z0, X0 + 64, Z0 + 64]); return Q; }
  Q.mini.push(["#5e1f22", X0, Z0, X0 + 64, Z0 + 64]);
  for (let k = 0; k < 32; k++) {
    let run = -1, rh = -1, rm = -1;
    for (let i = 0; i <= 32; i++) {
      let h = -2, m = -2;
      if (i < 32) { const r = colAt(X0 + i * 2 + 1, Z0 + k * 2 + 1); h = r[0]; m = r.length > 2 ? 1 : r[1]; }
      if (i < 32 && h === rh && m === rm) continue;
      if (run >= 0) { B(X0 + run * 2, 0, Z0 + k * 2, X0 + i * 2, rh, Z0 + k * 2 + 2, rm === 1 ? NB$m.basalt : MAT[rm]); if (rm === 2) Q.mini.push(["#ff7a14", X0 + run * 2, Z0 + k * 2, X0 + i * 2, Z0 + k * 2 + 2]); }
      run = i; rh = h; rm = m;
    }
  }
  // 현무암 기둥 · 발광석 · 광석
  for (let i = 0; i < 16; i++) for (let k = 0; k < 16; k++) {
    const x = X0 + i * 4, z = Z0 + k * 4, r = colAt(x + 1, z + 1); if (r.length > 2) continue;
    const v = dh(x, z, 61);
    if (v < .03 && r[1] !== 2) B(x, r[0], z, x + 2, r[0] + 5 + Math.floor(dh(x, z, 62) * 8), z + 2, NB$m.basalt);
    else if (v < .055) B(x + 1, 15 + Math.floor(dh(x, z, 63) * 5), z + 1, x + 3, 16 + Math.floor(dh(x, z, 63) * 5), z + 3, rn.glowstone);
    else if (v < .16 && r[1] !== 2) { const ox = Math.floor(dh(x, z, 64) * 4), oz = Math.floor(dh(x, z, 65) * 4), h2 = colAt(x + ox, z + oz)[0]; B(x + ox, h2 - 1, z + oz, x + ox + 1, h2, z + oz + 1, dh(x, z, 66) < .45 ? NGOLD : NQUARTZ); }
  }
  // 돌아가는 차원문 · 보물 창고
  const obs = rn.obsidian;
  const frameAt = (r, a) => { for (let x = r - 2; x <= r + 2; x++) { B(x, 2, a, x + 1, 3, a + 1, obs); B(x, 6, a, x + 1, 7, a + 1, obs); } for (let yy = 3; yy <= 5; yy++) { B(r - 2, yy, a, r - 1, yy + 1, a + 1, obs); B(r + 2, yy, a, r + 3, yy + 1, a + 1, obs); } };
  if (Math.floor(DIM.home.r / 64) === cx && Math.floor(DIM.home.a / 64) === cz) frameAt(DIM.home.r, DIM.home.a);
  const [vx, vz] = DIM.vault;
  if (Math.floor(vx / 64) === cx && Math.floor(vz / 64) === cz) {
    const bs = rn.blackstone || rn.polished_andesite, gb = rn.gold_block;
    B(vx - 7, 2, vz - 6, vx + 8, 3, vz + 7, bs);
    B(vx - 7, 3, vz - 6, vx + 8, 7, vz - 5, bs); B(vx - 7, 3, vz - 6, vx - 6, 7, vz + 7, bs); B(vx + 7, 3, vz - 6, vx + 8, 7, vz + 7, bs);
    B(vx - 7, 3, vz + 6, vx - 1, 7, vz + 7, bs); B(vx + 2, 3, vz + 6, vx + 8, 7, vz + 7, bs);
    for (const gx of [vx - 6, vx + 6]) B(gx, 3, vz - 5, gx + 1, 5, vz - 4, gb);
    for (const [ex, ey, ez] of DIM.chests) B(ex, ey + 1, ez, ex + 1, ey + 2, ez + 1, NB$m.chest);
    Q.mini.push(["#1b1b22", vx - 7, vz - 6, vx + 8, vz + 7]);
  }
  return Q;
};
{ const orig = bB; bB = function (cx, cz, lod) { if (inDimChunk(cx, cz)) return dimChunk(cx, cz, lod); return orig.apply(this, arguments); }; }
{ const orig = RA; RA = function (e, t) { if (inDimChunk(e, t) || inDimChunk(e - 1, t) || inDimChunk(e, t - 1)) return 0; return orig.apply(this, arguments); }; }
// 도시의 무너진 차원문 찾기
const dimGen = (Q, cx, cz) => {
  if (Q.st !== "ruined_portal") return;
  const ch0 = (Q.chest || []).find(a => a.tb === "ruined_portal");
  if (ch0) DIM.portals.set(cx + "," + cz, { r: Math.round(ch0.x - 3.5), a: Math.round(ch0.z - 2.5), k: cx + "," + cz });
};
DIM.known = () => { if (DIM.kn) return DIM.kn; const L = []; for (let cx = -9; cx <= 9; cx++) for (let cz = -14; cz <= -2; cz++) { try { if (wB(cx, cz) === "ruined_portal") L.push([cx * 64 + 32, cz * 64 + 32, cx + "," + cz]); } catch (e) {} } return (DIM.kn = L); };
DIM.frame = p => { const out = []; for (let x = p.r - 2; x <= p.r + 2; x++) out.push([x, 0, p.a], [x, 4, p.a]); for (let yy = 1; yy <= 3; yy++) out.push([p.r - 2, yy, p.a], [p.r + 2, yy, p.a]); return out; };
DIM.missing = p => DIM.frame(p).filter(([x, yy, z]) => { const id = Hr(x, yy, z); return id !== rn.obsidian && id !== rn.crying_obsidian; }).length;
DIM.innerFree = p => { for (let x = p.r - 1; x <= p.r + 1; x++) for (let yy = 1; yy <= 3; yy++) if (Hr(x, yy, p.a)) return false; return true; };
DIM.portalOf = (x, z) => { for (const p of DIM.portals.values()) if (x >= p.r - 2 && x <= p.r + 2 && Math.abs(z - p.a) < 1) return p; return null; };
// 부싯돌과 부시: 흑요석 틀이 다 차 있으면 차원문에 불이 붙어요
MP.useItem2 = (prev => (tg, it) => {
  if (it === "flint_and_steel") {
    const p = DIM.portalOf(tg.x, tg.z) || DIM.portalOf(tg.px, tg.pz);
    if (p && (tg.id === rn.obsidian || tg.id === rn.crying_obsidian || !tg.id)) {
      if (DIM.lit.has(p.k)) { mpToast("🟪 이미 열린 차원문이에요 · 걸어 들어가요", 1600); return false; }
      const miss = DIM.missing(p);
      if (miss) { mpToast("🟪 흑요석이 " + miss + "개 더 필요해요 · 빠진 틀 자리에 흑요석을 놓아요", 2200); return false; }
      if (!DIM.innerFree(p)) { mpToast("🟪 차원문 안쪽을 비워요", 1600); return false; }
      DIM.lit.add(p.k); try { Lt("level", 0, .8); Lt("fuse", 0, .6); } catch (e) {}
      mpToast("🟪 차원문이 열렸어요! 보라색 문으로 걸어 들어가요", 2600); MP.stat("portals"); mpSave();
      return false;
    }
  }
  return prev ? prev(tg, it) : false;
})(MP.useItem2);
// 보라색 문 (보이기 · 들어가기)
const portalMat = new v.MeshBasicMaterial({ color: 0x9b5cff, transparent: true, opacity: .62, side: v.DoubleSide, blending: v.AdditiveBlending, depthWrite: false, toneMapped: false });
const portalPlane = (r, a, y0) => { const m = new v.Mesh(new v.PlaneGeometry(3, 3), portalMat); m.position.set(r + .5, y0 + 1.5, a + .5); m.renderOrder = 3; m.layers.set(1); return m; };
const planeSync = () => {
  if (!S.root) return;
  const P = c.P, want = new Map();
  if (DIM.in) want.set("home", [DIM.home.r, DIM.home.a, 3]);
  else for (const p of DIM.portals.values()) if (DIM.lit.has(p.k) && Math.hypot(p.r - P.x, p.a - P.z) < 140) want.set(p.k, [p.r, p.a, 1]);
  for (const [k, m] of DIM.planes) if (!want.has(k)) { m.parent && m.parent.remove(m); DIM.planes.delete(k); }
  for (const [k, [r, a, y0]] of want) { let m = DIM.planes.get(k); if (!m) { m = portalPlane(r, a, y0); DIM.planes.set(k, m); } if (m.parent !== S.root) S.root.add(m); }
  portalMat.opacity = .5 + Math.sin(mpNow() / 300) * .12;
};
const inPortal = (r, a, y0) => { const P = c.P; return P.x > r - 1 && P.x < r + 2 && Math.abs(P.z - (a + .5)) < .8 && P.y > y0 - .5 && P.y < y0 + 3; };
mpCss("mp-dim-css", `#mpfade.dim{background:#6b21a8}`);
const dimGo = fn => { fadeEl.classList.add("dim", "on"); setTimeout(() => { try { fn(); } finally { setTimeout(() => fadeEl.classList.remove("on"), 650); setTimeout(() => fadeEl.classList.remove("dim"), 1200); } }, 520); };
DIM.enter = p => {
  if (DIM.busy) return; DIM.busy = 1;
  if (CAR.on) CAR.exit(); if (GL.on) GL.stop(); if (BLD.on) BLD.toggle(false);
  try { Lt("level", 0, .5); } catch (e) {}
  dimGo(() => {
    const P = c.P; DIM.back = [p.r + .5, p.a + 2.6];
    try { if (ne.lv) g0(); } catch (e) {}
    P.x = DIM.spawn[0] + .5; P.z = DIM.spawn[1] + .5; P.y = 3; P.vy = 0; P.fly = 0; DIM.hold = 1;
    DIM.busy = 0; MP.onTeleport && MP.onTeleport(); MP.stat("dimVisits"); mpSave();
    setTimeout(() => mpToast("🔥 용암 차원! 용암(주황 바위)은 뜨거워요 · 금 · 석영 광석 · 구석의 보물 창고 · 보라색 문으로 돌아가요", 4600), 900);
  });
};
DIM.exit = () => {
  if (DIM.busy) return; DIM.busy = 1;
  dimGo(() => {
    const P = c.P, b = DIM.back || [4, -120];
    P.x = b[0]; P.z = b[1]; P.y = ja(P.x, P.z, 4); P.vy = 0; DIM.hold = 2;
    DIM.busy = 0; MP.onTeleport && MP.onTeleport(); mpSave();
  });
};
const dimTick = dt => {
  const inD = MP.inDim();
  if (inD !== DIM.in) {
    DIM.in = inD;
    try { if (!c.arenaOn) { Wa.visible = !inD; Ye.background = inD ? new v.Color(0x2a0707) : null; } } catch (e) {}
  }
  if (DIM.hold) { const P = c.P, ch = mpChunkAt(P.x, P.z); if (ch && ch.G) { P.y = Math.max(P.y, ja(P.x, P.z, DIM.hold === 1 ? 3.5 : 40)); DIM.hold = 0; } else { P.vy = 0; if (DIM.hold === 1) P.y = 3; } }
  if ((DIM.pt = (DIM.pt || 0) - dt) <= 0) { DIM.pt = .5; planeSync(); }
  if (DIM.busy || DIM.hold) return;
  // 문 안에 1초 서 있으면 이동
  let gate = null;
  if (DIM.in) { if (inPortal(DIM.home.r, DIM.home.a, 3)) gate = "home"; }
  else for (const p of DIM.portals.values()) if (DIM.lit.has(p.k) && inPortal(p.r, p.a, 1)) { gate = p; break; }
  if (gate) { DIM.gt = (DIM.gt || 0) + dt; if (DIM.gt > 1) { DIM.gt = 0; gate === "home" ? DIM.exit() : DIM.enter(gate); } else MP.fx(c.P.x, c.P.y + 1, c.P.z, [.7, .4, 1], 2, 1, .2); } else DIM.gt = 0;
  if (!DIM.in) return;
  // 용암: 앗 뜨거
  const P = c.P, under = Hr(Math.floor(P.x), Math.floor(P.y - .05), Math.floor(P.z));
  if (under === NB$m.lava_rock && Math.abs(P.y - ja(P.x, P.z, P.y)) < .1 && (DIM.lt = (DIM.lt || 0) - dt) <= 0) { DIM.lt = .5; try { p0(.06, null, "용암"); } catch (e) {} if (mpNow() - (DIM.lw || 0) > 3000) { DIM.lw = mpNow(); mpToast("🔥 앗 뜨거! 용암 바위에서 나와요", 1400); } }
  if ((DIM.et = (DIM.et || 0) - dt) <= 0) { DIM.et = .25; MP.fx(P.x + (O() - .5) * 14, P.y + O() * 3, P.z + (O() - .5) * 14, [1, .45, .15], 1, .4, .14); }
};
MP.camHook = (prev => () => { prev && prev(); if (DIM.in && Ye.fog) Ye.fog.color.setHex(0x3a0d0d); })(MP.camHook);
// 보물 창고 상자: 3시간마다 새 보물
{
  const prev = CHS.open;
  CHS.open = (x, yy, z, st) => {
    const i = DIM.chests.findIndex(a => a[0] === x && a[1] + 1 === yy && a[2] === z);
    if (i < 0) return prev(x, yy, z, st);
    const id = CHS.id(x, yy, z), cy = Math.floor(Date.now() / (3 * 3600e3));
    if (DIM.cyc[id] !== cy) {
      DIM.cyc[id] = cy; const a = Array(27).fill(null), put = (s, it, n) => { a[s] = { id: it, n, en: 0, to: "" }; };
      put(2, "gold_ingot", 4 + (O() * 5 | 0)); put(6, "diamond", 1 + (O() * 2 | 0)); put(11, "obsidian", 2 + (O() * 3 | 0)); put(15, "firework_rocket", 4 + (O() * 5 | 0)); put(20, "quartz", 3 + (O() * 6 | 0));
      if (!DIM.pick && i === 0) { put(13, "netherite_pickaxe", 1); DIM.pick = 1; }
      S.op[id] = a; mpSave();
    }
    return prev(x, yy, z, "mptreasure");
  };
}
MP.chestTitles.mptreasure = ["💰 보물 창고 (용암 차원)", "3시간마다 새 보물이 채워져요 · 칸을 누르면 하나씩 가방으로"];
const dimNear = (L, P) => {
  if (!S.out) return;
  if (DIM.in) { if (Math.hypot(DIM.home.r + .5 - P.x, DIM.home.a + .5 - P.z) < 3.5) L.push({ x: DIM.home.r + .5, z: DIM.home.a, y: P.y, r: 3.5, l: "🟪 보라색 문으로 돌아가기", fn: DIM.exit }); return; }
  for (const p of DIM.portals.values()) {
    if (Math.hypot(p.r + .5 - P.x, p.a + .5 - P.z) > 4.5) continue;
    if (DIM.lit.has(p.k)) L.push({ x: p.r + .5, z: p.a + .5, y: P.y, r: 4.5, l: "🟪 차원문으로 들어가기 (용암 차원)", fn: () => DIM.enter(p) });
    else { const miss = DIM.missing(p); L.push({ x: p.r + .5, z: p.a + .5, y: P.y, r: 4.5, l: miss ? "🟪 무너진 차원문 · 흑요석 " + miss + "개 더 놓기" : "🟪 차원문 틀 완성! 부싯돌과 부시로 불 붙이기", fn: () => mpToast(miss ? "🟪 짓기 모드(" + (c.isTouch ? "짓기 버튼" : "X") + ")로 빠진 틀 자리에 흑요석을 놓아요 · 엔더 택배에서 흑요석을 살 수 있어요" : "🔥 짓기 칸에 부싯돌과 부시를 들고 흑요석 틀을 " + (c.isTouch ? "놓기 버튼" : "우클릭") + "해요", 3200) }); }
  }
};
const dimMarks = (ctx, X, Z, big) => {
  ctx.save(); ctx.font = (big ? 22 : 30) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (DIM.in) { ctx.fillText("🟪", X(DIM.home.r), Z(DIM.home.a)); ctx.fillText("💰", X(DIM.vault[0]), Z(DIM.vault[1])); }
  else for (const p of DIM.portals.values()) ctx.fillText(DIM.lit.has(p.k) ? "🟪" : "⬛", X(p.r), Z(p.a));
  ctx.restore();
};
{ const prev = ST.phoneHtml; ST.phoneHtml = () => prev() + `<div class="mpcard"><b>🟪 무너진 차원문 → 용암 차원</b><span class="mpsub">${DIM.in ? "지금 용암 차원이에요 · 보라색 문으로 돌아가요" : DIM.lit.size ? "열린 차원문 " + DIM.lit.size + "개 · 걸어 들어가요" : "빠진 흑요석을 채우고 부싯돌과 부시로 불을 붙여요"}</span>${DIM.in ? "" : `<button class="mpbtn" data-mp="dimgo">길 안내</button>`}</div>`; }
MP.click.dimgo = () => { const P = c.P; let best = null, bd = 1e9; for (const [x, z, k] of DIM.known()) { const p = DIM.portals.get(k), e = p ? [p.r, p.a] : [x, z], d = Math.hypot(e[0] - P.x, e[1] - P.z); if (d < bd) { bd = d; best = e; } } if (!best) return mpToast("🟪 근처에 무너진 차원문이 없어요", 1600); try { Oi.on = 1; Oi.x = best[0]; Oi.z = best[1]; } catch (x) {} PH.close(); mpToast("📍 가까운 무너진 차원문으로 길 안내 · " + Ge(Math.round(bd)) + "m", 2400); };

// ══ 주인공 3명 ══
const HERO = (MP.hero = { cur: "me", on: 0, pos: {}, body: {}, pup: null, meClone: null });
const HEROES = {
  me: { n: () => { try { return Tr(); } catch (e) { return "나"; } }, role: "마이폴 학생", ic: "🎒", ab: "학교 · 보스전 · 퀘스트는 나만 할 수 있어요" },
  bolt: { n: () => "번개", role: "배달 라이더", ic: "⚡", ab: "달리기 +25% · 블록카 최고 속도 +20% · 니트로 회복 2배", look: { hair: 0x1b1b1b, shirt: 0xf5c542, ex: "j", jacket: 0x111111, pants: 0x1f2937, shoe: 0xf5c542 }, hat: 0xf5c542, spawn: [30, -118] },
  ham: { n: () => "망치", role: "블록 건축가", ic: "🔨", ab: "블록 캐기 2배 · 놓기 2배 빠르게 · 놓는 블록 수 +50%", look: { hair: 0x5a3a1c, shirt: 0xf97316, ex: "", pants: 0x2b3446, shoe: 0x5a3a1c }, hat: 0xf97316, spawn: [-40, -126] },
};
MP.heroMul = k => { const h = HERO.cur; if (h === "bolt") return k === "car" ? 1.2 : k === "nos" ? 2 : 1; if (h === "ham") return k === "mine" ? 2 : k === "blocks" ? 1.5 : 1; return 1; };
{ const orig = Ci; Ci = function () { const r = orig.apply(this, arguments); return HERO.cur === "bolt" && r && r.run ? Object.assign({}, r, { run: r.run * 1.25 }) : r; }; }
{ const prev = BLD.mineTime; BLD.mineTime = (bid, qq) => { const r = prev(bid, qq), m = MP.heroMul("mine"); return m !== 1 && r && r.t < 1e8 ? Object.assign({}, r, { t: r.t / m }) : r; }; }
const heroModel = h => {
  const H2 = HEROES[h], m = ul(H2.look); m.g.scale.setScalar(.97);
  const hat = new v.Mesh(new v.SphereGeometry(.19, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new v.MeshStandardMaterial({ color: H2.hat, roughness: .4 }));
  hat.position.set(0, .07, 0); hat.scale.set(1.05, 1, 1.12); m.head.add(hat);
  if (h === "ham") { const brim = new v.Mesh(new v.CylinderGeometry(.25, .25, .03, 16), new v.MeshStandardMaterial({ color: H2.hat, roughness: .4 })); brim.position.set(0, .08, .02); m.head.add(brim); }
  else { const bolt = new v.Mesh(new v.BoxGeometry(.05, .12, .02), new v.MeshStandardMaterial({ color: 0x111111 })); bolt.position.set(.08, .14, .15); bolt.rotation.z = .5; m.head.add(bolt); }
  return m;
};
HERO.unlock = () => {
  if (HERO.on) return; HERO.on = 1; mpSave();
  setTimeout(() => { if (ST.canTalk() && MP.npcs.kkachi) ST.say("kkachi", ["이번 한탕, 사실 둘이 더 도와줬어. 배달 라이더 '번개'랑 블록 건축가 '망치'.", "이제부터 셋이 한 팀이야. 블록폰 👥 앱" + (c.isTouch ? "에서" : "이나 쉼표(,) 키로") + " 바꿔 가며 놀아 봐!"]); else mpToast("👥 새 주인공 '번개' · '망치'가 생겼어요! 블록폰 👥 앱" + (c.isTouch ? "에서" : "이나 , 키로") + " 바꿔요", 4200); }, 7800);
};
HERO.can = h => {
  if (!HERO.on) return "5장 한탕을 끝내면 열려요";
  if (!c.run || c.bm || c.pvLock || c.arenaOn) return "지금은 바꿀 수 없어요";
  if (!S.out) return "주인공은 바깥 도시에서 바꿔요";
  if (MP.inMine() || MP.inDim()) return "폐광 · 용암 차원에서는 못 바꿔요 · 나와서 바꿔요";
  if (ne.lv) return "수배 중에는 못 바꿔요 (GTA처럼)";
  if (RACE.cur) return "레이스 중에는 못 바꿔요";
  return "";
};
HERO.switch = (h, here) => {
  if (h === HERO.cur || !HEROES[h]) return;
  const why = HERO.can(h); if (why) return mpToast("👥 " + why, 2000);
  if (CAR.on) CAR.exit(); if (GL.on) GL.stop(); if (BLD.on) BLD.toggle(false);
  PH.close();
  const P = c.P, from = HERO.cur;
  HERO.pos[from] = [P.x, P.y, P.z, c.yaw];
  if (from === "me" && c.pl && c.pl.g) { try { HERO.meClone = c.pl.g.clone(true); HERO.meClone.traverse(o => { if (o.isSprite) o.visible = false; }); HERO.meClone.rotation.x = 0; } catch (e) { HERO.meClone = null; } }
  const to = HERO.pos[h] || (() => { const s = HEROES[h].spawn ? snap(HEROES[h].spawn[0], HEROES[h].spawn[1]) : [P.x, P.z]; return [s[0], 0, s[1], 0]; })();
  const go = () => {
    HERO.cur = h; BLD.placeGap = h === "ham" ? 110 : 220;
    P.x = to[0]; P.z = to[2]; P.y = to[1] || 0; P.vy = 0; P.fly = 0; c.yaw = to[3] || 0; HERO.hold = to[1] || 0;
    if (h === "me" && c.pl && c.pl.g) c.pl.g.visible = !c.fp;
    delete HERO.pos[h];
    HERO.bodySync(true);
    try { on(HEROES[h].ic + " " + HEROES[h].n(), HEROES[h].role + " · " + HEROES[h].ab, "pass"); } catch (e) {}
    MP.onTeleport && MP.onTeleport(); mpSave();
  };
  if (here) go(); else fadeGo(go);
};
// 지금 주인공 모형 (번개 · 망치는 내 모형 대신 보여요 · 움직임은 똑같이)
MP.camHook = (prev => () => {
  prev && prev();
  try {
    const pl = c.pl; if (!pl || !pl.g) return;
    if (HERO.cur === "me") { if (HERO.pup && HERO.pup.g.visible) { HERO.pup.g.visible = false; pl.g.visible = !c.fp; } return; }
    if (!HERO.pup || HERO.pup.k !== HERO.cur) { if (HERO.pup) HERO.pup.g.parent && HERO.pup.g.parent.remove(HERO.pup.g); HERO.pup = heroModel(HERO.cur); HERO.pup.k = HERO.cur; }
    const pu = HERO.pup; if (pu.g.parent !== pl.g.parent && pl.g.parent) pl.g.parent.add(pu.g);
    pu.g.visible = !c.fp; pl.g.visible = false;
    pu.g.position.copy(pl.g.position); pu.g.rotation.copy(pl.g.rotation);
    for (const k of ["la", "ra", "ll", "rl"]) if (pl[k] && pu[k]) pu[k].rotation.copy(pl[k].rotation);
    if (GL.wing && GL.wing.parent !== pu.g && GL.on) pu.g.add(GL.wing);
  } catch (e) {}
})(MP.camHook);
// 쉬고 있는 주인공 (세워 둔 자리에 서 있어요)
HERO.bodySync = force => {
  if (!S.root) return;
  const P = c.P;
  for (const h of Object.keys(HEROES)) {
    const pos = HERO.pos[h], want = HERO.on && h !== HERO.cur && pos && S.out && !MP.inMine() && !MP.inDim() && Math.hypot(pos[0] - P.x, pos[2] - P.z) < 120;
    let b = HERO.body[h];
    if (b && (!want || force)) { b.g.parent && b.g.parent.remove(b.g); delete HERO.body[h]; b = null; }
    if (want && !b) {
      let g = null;
      if (h === "me") { if (!HERO.meClone) continue; g = HERO.meClone; }
      else g = heroModel(h).g;
      g.position.set(pos[0], ja(pos[0], pos[2], pos[1] + .5), pos[2]); g.rotation.set(0, (pos[3] || 0) + Math.PI, 0); g.visible = true;
      const tag = MP.tagSprite([HEROES[h].ic + " " + HEROES[h].n(), HEROES[h].role]); tag.position.set(0, 2.3, 0); tag.userData.mpTag = 1; g.add(tag);
      S.root.add(g); HERO.body[h] = b = { g, tag };
    }
  }
};
const heroNear = (L, P) => {
  if (!HERO.on || !S.out) return;
  for (const [h, b] of Object.entries(HERO.body)) { const pos = HERO.pos[h]; if (pos && Math.hypot(pos[0] - P.x, pos[2] - P.z) < 2.6) { L.push({ x: pos[0], z: pos[2], y: P.y, r: 2.6, l: "👥 " + HEROES[h].ic + " " + HEROES[h].n() + "(으)로 바꾸기", fn: () => HERO.switch(h, 1) }); break; } }
};
// 학교로 들어가면 나로 돌아와요
const heroTick = dt => {
  if (HERO.hold != null && HERO.hold !== false) { const P = c.P, ch = mpChunkAt(P.x, P.z); if (ch && ch.G) { P.y = ja(P.x, P.z, HERO.hold + .6); HERO.hold = null; } else { P.vy = 0; P.y = HERO.hold; } }
  if (HERO.cur !== "me" && c.run && (!S.out || c.bm)) { HERO.cur = "me"; BLD.placeGap = 220; if (HERO.pup) HERO.pup.g.visible = false; if (c.pl && c.pl.g) c.pl.g.visible = !c.fp; mpToast("🏫 학교에서는 나로 돌아와요", 2000); }
  if ((HERO.bt = (HERO.bt || 0) - dt) <= 0) { HERO.bt = 1; HERO.bodySync(false); }
};
addEventListener("keydown", e => {
  const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
  if (e.code === "Comma" && !e.repeat && c.run && !c.menuOn && !c.invOn && !c.dg && HERO.on) { e.stopPropagation(); PH.open("hero"); }
}, true);
APPS.splice(APPS.length - 1, 0, ["hero", "👥", "주인공", "#0f766e"]);
{ const prev = PH.render; PH.render = () => { if (PH.app === "hero" && J("mpphb")) { J("mpphst").textContent = phTime(); J("mpphb").innerHTML = `<div class="phh"><button data-mp="phhome">‹ 홈</button><b>👥 주인공</b></div>` + HERO.phoneHtml(); return; } prev(); }; }
HERO.phoneHtml = () => {
  if (!HERO.on) return `<div class="mpcard">🔒 5장 '다이아 은행 한탕'을 끝내면 한탕 동료 '번개'와 '망치'를 주인공으로 바꿔 가며 놀 수 있어요 (GTA5처럼)</div>`;
  const why = HERO.can("x");
  return Object.entries(HEROES).map(([h, H2]) => {
    const pos = HERO.pos[h], where = h === HERO.cur ? "지금 이 주인공" : pos ? MP.placeName(pos[0], pos[2]) + " · " + Ge(Math.round(Math.hypot(pos[0] - c.P.x, pos[2] - c.P.z))) + "m" : "처음 만나러 가요";
    return `<div class="mpcard"><div class="row2"><span style="font-size:26px">${H2.ic}</span><span class="tx"><b>${ae(H2.n())} · ${H2.role}</b><span>${H2.ab}</span><span>${ae(where)}</span></span>${h === HERO.cur ? `<span class="mpchip ok">지금</span>` : `<button class="mpbtn pri" data-mp="heroset:${h}"${why ? " disabled" : ""}>바꾸기</button>`}</div></div>`;
  }).join("") + (why ? `<p class="mpsub">${ae(why)}</p>` : `<p class="mpsub">${c.isTouch ? "" : "쉼표(,) 키로 이 화면을 바로 열어요 · "}쉬는 주인공은 세워 둔 자리에 서 있어요</p>`);
};
MP.click.heroset = h => HERO.switch(h);
{ const prev = ST.pass; ST.pass = () => { const id = ST.cur && ST.cur.id; prev(); if (id === "m5") HERO.unlock(); }; ST.pass.wrapped = 1; }

// ── V109 휴대폰 자동 공격과 맞추기 ──
// 사진 모드에서는 총을 안 쏴요 (짓기 · 블록카는 20-build · 70-ride 에서 이미 막아요).
// 짓기 · 블록카 · 사진 모드에서는 자동 공격 과녁(#autot)도 숨겨요. 자동 공격 tick 다음에 돌아요.
{ const orig = wg; wg = function () { if (CAM.on) return; return orig.apply(this, arguments); }; }
const autoTick = () => {
  try {
    if (typeof as !== "object" || !as) return;
    if (BLD.on || CAR.on || CAM.on) { as.tg = null; const t = J("autot"); if (t && !t.hidden) t.hidden = true; }
  } catch (e) {}
};

de.add({
  id: "mp_world", name: "레드스톤 · 용암 차원 · 주인공 3명", need: ["mp_mine", "mp_ride", "mp_story"],
  gives: "MP.rs 레드스톤 (레버 · 압력판 · 횃불 → 선 → 램프 · 피스톤) · MP.dim 무너진 차원문 → 용암 차원 · MP.hero 주인공 3명 (나 · 번개 · 망치)",
  chunkGen: dimGen,
  near: (L, P) => { rsNear(L, P); dimNear(L, P); heroNear(L, P); },
  net: (k, e) => { if (k === "mrs") { const [x, yy, z, on] = e.slice(2).map(Number); const kk = rk(x, yy, z); if (!!on !== RS.on.has(kk)) RS.toggle(kk, 1); return true; } return false; },
  tick: dt => { rsTick(dt); dimTick(dt); heroTick(dt); autoTick(); },
  where: () => (DIM.in ? "🔥 용암 차원" : null),
  cityFog: f => (DIM.in ? [24, 170] : f),
  miniMarks: (ctx, X, Z) => dimMarks(ctx, X, Z, 0),
  bigMarks: (ctx, X, Z) => dimMarks(ctx, X, Z, 1),
  save: e => { e.mpw = { v: 1, rs: { on: [...RS.on], dir: RS.dir, lit1: RS.lit1 ? 1 : 0 }, dim: { lit: [...DIM.lit], back: DIM.back, cyc: DIM.cyc, pick: DIM.pick }, hero: { on: HERO.on, cur: HERO.cur, pos: HERO.pos } }; },
  load: e => {
    const d = e && e.mpw;
    RS.on = new Set(); RS.dir = {}; DIM.lit = new Set(); DIM.back = null; DIM.cyc = {}; DIM.pick = 0; HERO.on = 0; HERO.cur = "me"; HERO.pos = {};
    if (d && typeof d === "object") {
      const r = d.rs || {}; if (Array.isArray(r.on)) for (const k of r.on) if (/^-?\d+,-?\d+,-?\d+$/.test(k)) RS.on.add(k);
      if (r.dir && typeof r.dir === "object") for (const [k, v] of Object.entries(r.dir)) if (/^-?\d+,-?\d+,-?\d+$/.test(k) && v >= 0 && v <= 5) RS.dir[k] = v | 0;
      RS.lit1 = r.lit1 ? 1 : 0;
      const dm = d.dim || {}; if (Array.isArray(dm.lit)) for (const k of dm.lit) if (/^-?\d+,-?\d+$/.test(k)) DIM.lit.add(k);
      if (Array.isArray(dm.back) && dm.back.every(isFinite)) DIM.back = dm.back.slice(0, 2);
      if (dm.cyc && typeof dm.cyc === "object") DIM.cyc = dm.cyc; DIM.pick = dm.pick ? 1 : 0;
      const hr2 = d.hero || {}; HERO.on = hr2.on ? 1 : 0;
      if (hr2.pos && typeof hr2.pos === "object") for (const [k, v] of Object.entries(hr2.pos)) if (HEROES[k] && Array.isArray(v) && v.slice(0, 3).every(isFinite)) HERO.pos[k] = v.slice(0, 4).map(Number);
      if (HEROES[hr2.cur] && HERO.on) HERO.cur = hr2.cur;
    }
    BLD.placeGap = HERO.cur === "ham" ? 110 : 220;
    setTimeout(RS.scan, 0); RS.scan();
  },
  newGame: () => { RS.on = new Set(); RS.dir = {}; DIM.lit = new Set(); HERO.on = 0; HERO.cur = "me"; HERO.pos = {}; },
  dbg: { MPRS: RS, MPDIM: DIM, MPHERO: HERO },
});
