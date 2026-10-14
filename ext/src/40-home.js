/* ───────────── 2단계: 내 땅 · 내 집 · 농사 ─────────────
   땅 한 칸 = 16×16 (마크 청크 크기). 블록폰 🏠 부동산 앱에서 사요.
   땅을 사면 선 자리에 🛏️ 침대(= 집 · 쓰러지면 병원 대신 집에서 · 치료비 없음)와 바라보는 쪽에 🌱 밭 3×3 이 생겨요 (짓기 없이 게임이 놓아요).
   밭 가까이에서 F(대화 버튼): 씨앗 심기 · 다 자란 작물 거두기 · 뼛가루 뿌리기. 땅 안 부서진 칸은 따로 저장해서 오래 남아요. */

const LOT = (MP.lot = { mine: [], max: 8, base: 2000, peers: new Map(), spawn: null, dmgs: {} });
const LOT_MUL = { down: 3, apt: 2, town: 1.6, front: 1.4, park: 1.3, house: 1, ind: .8, farm: .6 };
const LOT_NAME = { down: "도심", apt: "아파트 단지", town: "상가 거리", front: "학교 앞 거리", park: "공원", house: "주택가", ind: "공장 지대", farm: "논밭" };
LOT.g = (x, z) => [Math.floor(x / 16), Math.floor(z / 16)];
LOT.mineAt = (x, z) => { const [gx, gz] = LOT.g(x, z); return LOT.mine.find(l => l.gx === gx && l.gz === gz) || null; };
LOT.peerAt = (x, z) => {
  const [gx, gz] = LOT.g(x, z);
  for (const p of LOT.peers.values()) if ((p.lots || []).some(l => l[0] === gx && l[1] === gz)) return p;
  return null;
};
LOT.zone = (gx, gz) => { try { return up(Math.floor(gx * 16 / 64), Math.floor(gz * 16 / 64)); } catch (e) { return "house"; } };
LOT.price = (gx, gz) => Math.round(LOT.base * (LOT_MUL[LOT.zone(gx, gz)] || 1) * (1 + .5 * LOT.mine.length) / 10) * 10;
LOT.okSpot = (gx, gz) => {
  const x0 = gx * 16, z0 = gz * 16;
  for (const [x, z] of [[x0, z0], [x0 + 16, z0], [x0, z0 + 16], [x0 + 16, z0 + 16], [x0 + 8, z0 + 8]]) if (!ia(x, z)) return "학교 안이라 살 수 없어요";
  if (LOT.mine.some(l => l.gx === gx && l.gz === gz)) return "이미 내 땅이에요";
  const p = LOT.peerAt(x0 + 8, z0 + 8); if (p) return (p.nm || "친구") + " 님의 땅이에요";
  if (LOT.mine.length >= LOT.max) return "땅은 " + LOT.max + "칸까지 살 수 있어요";
  if (!S.out) return "바깥 도시에서 살 수 있어요";
  return "";
};
LOT.buy = () => {
  const P = c.P, [gx, gz] = LOT.g(P.x, P.z), why = LOT.okSpot(gx, gz);
  if (why) return mpToast("🏠 " + why, 2000);
  const pr = LOT.price(gx, gz);
  if ((c.coins || 0) < pr) return mpToast("🏠 코인이 모자라요 (" + Ge(pr) + ")", 2000);
  Pt(-pr, 1);
  const first = !LOT.mine.length;
  LOT.mine.push({ gx, gz, t: Date.now(), z: LOT.zone(gx, gz) });
  try { on("내 땅이 생겼어요", LOT_NAME[LOT.zone(gx, gz)] + " · 16×16 · 코인 -" + Ge(pr), "pass"); } catch (e) {}
  q("win");
  const hs = LOT.homestead(gx, gz);
  if (first) { xM("wheat_seeds", 8, 1); xM("beetroot_seeds", 4, 1); }
  setTimeout(() => mpToast((hs.bed ? "🛏️ 선 자리에 침대가 생겼어요 · 여기가 이제 집이에요" : "🛏️ 침대 놓을 자리가 없었어요") + (hs.farm ? " · 🌱 밭 " + hs.farm + "칸 — 밭 가까이에서 " + useK() + "로 씨앗을 심어요" : "") + (first ? " · 🎁 첫 땅 선물: 밀 씨앗 8 · 비트 씨앗 4" : ""), 4600), 1800);
  MP.onLot && MP.onLot("buy", gx, gz);
  mpSave(); LOT.render();
};
LOT.sell = i => {
  const l = LOT.mine[+i]; if (!l) return;
  const back = Math.round(LOT.base * (LOT_MUL[l.z] || 1) / 2 / 10) * 10;
  LOT.mine.splice(+i, 1); Pt(back, 1);
  mpToast("🏠 땅을 팔았어요 · 코인 +" + Ge(back) + " (침대 · 밭은 그대로 남아요)", 3000);
  mpSave(); LOT.render();
};
const useK = () => (c.isTouch ? "대화 버튼" : ze("use"));
LOT.go = i => {
  const l = LOT.mine[+i]; if (!l) return;
  try { Oi.on = 1; Oi.x = l.gx * 16 + 8; Oi.z = l.gz * 16 + 8; NB?.(); } catch (e) {}
  Fi(); mpToast("📍 내 땅으로 길 안내 · 미니맵 보라색 선을 따라가요 (🚕 택시도 돼요)", 2600);
};
LOT.render = () => {
  const P = c.P, [gx, gz] = LOT.g(P.x, P.z), why = LOT.okSpot(gx, gz), zone = LOT.zone(gx, gz), pr = LOT.price(gx, gz);
  const here = LOT.mineAt(P.x, P.z);
  const top = !S.out ? `<div class="mpnote">교문 밖 바깥 도시에서 땅을 살 수 있어요. 땅 한 칸은 16×16 (마크 청크 크기)이에요.</div>`
    : `<div class="mprow"><span class="ic">🏠</span><span class="tx"><b>지금 서 있는 땅 · ${LOT_NAME[zone] || zone}</b><span class="mpsub">칸 (${gx}, ${gz}) · 16×16 · ${here ? "내 땅이에요" : why || "값 " + Ge(pr) + "코인"}</span></span><span class="bt">${!why ? `<button class="mpbtn pri" data-mp="lotbuy">사기 · ${Ge(pr)}</button>` : ""}</span></div>`;
  const list = LOT.mine.map((l, i) => { const d = Math.round(Math.hypot(l.gx * 16 + 8 - P.x, l.gz * 16 + 8 - P.z)); return `<div class="mprow"><span class="ic">🏡</span><span class="tx"><b>${LOT_NAME[l.z] || "땅"} (${l.gx}, ${l.gz})</b><span class="mpsub">${Ge(d)}m 떨어져 있어요</span></span><span class="bt"><button class="mpbtn" data-mp="lotgo:${i}">길 안내</button><button class="mpbtn" data-mp="lotsell:${i}">팔기</button></span></div>`; }).join("") || `<div class="mpnote">아직 땅이 없어요. 땅을 사면 선 자리에 🛏️ 침대(집)가, 바라보는 쪽에 🌱 밭 3×3 이 생겨요.</div>`;
  const home = LOT.spawn ? `🛏️ 집: (${LOT.spawn.x}, ${LOT.spawn.y}, ${LOT.spawn.z}) · 바깥 도시에서 쓰러지면 여기서 깨어나요 (치료비 없음)` : "🛏️ 집이 아직 없어요 — 땅을 사면 침대가 생기고 그곳이 집이 돼요";
  Br(`<i data-view="mplot" hidden></i><h2>🏠 내 땅 · 부동산</h2>${top}<div class="mpnote">${home}</div><div class="mpnote">🌱 밭 가까이에서 ${useK()}: 씨앗 심기 · 다 자란 작물 거두기 · 뼛가루 뿌리기 (씨앗은 엔더 택배 농사)</div><div class="mplist">${list}</div>`, "mplw");
};
MP.click.lotbuy = () => LOT.buy();
MP.click.lotsell = i => LOT.sell(i);
MP.click.lotgo = i => LOT.go(i);
MP.click.lot = () => LOT.render();

// 땅 안에서 캔 자리(부서진 칸)는 따로 기억해요 (도시 저장은 최근 300청크만)
const lotCellsOf = (l) => { const out = []; const x0 = l.gx * 16, z0 = l.gz * 16; const key = mpKeyOf(Math.floor(x0 / 64), Math.floor(z0 / 64)); const dm = S.dmg.get(key); if (!dm) return [key, out]; for (const li of dm) { const x = Math.floor(x0 / 64) * 64 + (li % 64), z = Math.floor(z0 / 64) * 64 + ((li >> 6) % 64); if (x >= x0 && x < x0 + 16 && z >= z0 && z < z0 + 16) out.push(li); } return [key, out]; };

// 땅 테두리 (가까이 있을 때 · 부동산 창을 열면 지금 선 칸도 흰색으로)
const LOTV = { lines: [] };
const lotBorders = () => {
  if (!Ye) return;
  const P = c.P, show = [];
  if (S.out) {
    for (const l of LOT.mine) if (Math.hypot(l.gx * 16 + 8 - P.x, l.gz * 16 + 8 - P.z) < 70) show.push([l.gx, l.gz, 0xf5c542]);
    for (const p of LOT.peers.values()) for (const l of p.lots || []) if (Math.hypot(l[0] * 16 + 8 - P.x, l[1] * 16 + 8 - P.z) < 70) show.push([l[0], l[1], 0x7fb6ff]);
    const lotOpen = c.menuOn && J("mcard") && J("mcard").querySelector('[data-view="mplot"]');
    if (lotOpen && !LOT.mineAt(P.x, P.z) && !LOT.peerAt(P.x, P.z)) { const [gx, gz] = LOT.g(P.x, P.z); show.push([gx, gz, 0xffffff, 1]); }
  }
  while (LOTV.lines.length < show.length) {
    const g = new v.BufferGeometry().setFromPoints([new v.Vector3(0, 0, 0), new v.Vector3(16, 0, 0), new v.Vector3(16, 0, 16), new v.Vector3(0, 0, 16), new v.Vector3(0, 0, 0)]);
    const m = new v.Line(g, new v.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 }));
    m.layers.set(1); m.renderOrder = 4; Ye.add(m); LOTV.lines.push(m);
  }
  LOTV.lines.forEach((m, i) => {
    const s = show[i]; m.visible = !!s; if (!s) return;
    m.position.set(s[0] * 16, .08, s[1] * 16); m.material.color.setHex(s[2]); m.material.opacity = s[3] ? .45 : .9;
  });
};

// ── 집 (침대) ──
const BED = MPI.newBlocks.red_bed;
const homeSet = (s, quiet) => { LOT.spawn = { x: s.x, y: s.y, z: s.z }; mpSave(); if (quiet) return; mpToast("🛏️ 여기가 이제 집이에요 · 바깥 도시에서 쓰러지면 여기서 깨어나요", 2600); try { Lt("level", 0, 1.2); } catch (e) {} };
const homeOk = () => LOT.spawn && Hr(LOT.spawn.x, LOT.spawn.y, LOT.spawn.z) === BED;
{ // 쓰러졌을 때 병원 대신 집에서
  const orig = XB;
  XB = function (kind, at) {
    if (kind === "doctor" && S.out && LOT.spawn) {
      const s = LOT.spawn;
      const ch = mpChunkAt(s.x, s.z);
      if (ch && ch.G && Hr(s.x, s.y, s.z) !== BED) { LOT.spawn = null; setTimeout(() => mpToast("🛏️ 집 침대가 없어져서 병원으로 갔어요", 2600), 600); return orig.apply(this, arguments); }
      const P = c.P;
      let px = s.x + .5, pz = s.z + .5, py = s.y + 1;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!Hr(s.x + dx, s.y, s.z + dz) && !Hr(s.x + dx, s.y + 1, s.z + dz)) { px = s.x + dx + .5; pz = s.z + dz + .5; py = s.y; break; }
      P.x = px; P.z = pz; P.y = py + .02; P.vy = 0; S.pk = "";
      setTimeout(() => mpToast("🛏️ 집에서 깨어났어요 · 치료비 없음 · 떨어뜨린 아이템은 지도에 💀", 3400), 400);
      return true;
    }
    return orig.apply(this, arguments);
  };
}

// ── 농사 ──
const FARM = (MP.farm = { cells: {}, grow: { wheat: 300, beetroot: 300, pumpkin: 420, melon: 420 } });
const CROPS = {
  wheat: { seed: "wheat_seeds", n: "밀", col: [0x6fbf3a, 0x8fc93a, 0xbcc23a, 0xe0c24a], drop: [["wheat", 1, 1], ["wheat_seeds", 1, 3]] },
  beetroot: { seed: "beetroot_seeds", n: "비트", col: [0x5aa83a, 0x4f9a35, 0x4a8f34, 0x3f8a30], top: 0xb2263f, drop: [["beetroot", 1, 1], ["beetroot_seeds", 1, 3]] },
  pumpkin: { seed: "pumpkin_seeds", n: "호박", col: [0x5aa83a, 0x6aa83a, 0x7aa83a, 0x8aa83a], fruit: 0xe08a1e, drop: [["pumpkin", 1, 1], ["pumpkin_seeds", 0, 2]] },
  melon: { seed: "melon_seeds", n: "수박", col: [0x5aa83a, 0x6aa83a, 0x7aa83a, 0x8aa83a], fruit: 0x3f9a3a, drop: [["melon_slice", 3, 7], ["melon_seeds", 0, 2]] },
};
FARM.ids = {};
for (const k of Object.keys(CROPS)) FARM.ids[k] = [0, 1, 2, 3].map(st => { const id = mpBlk(k + "_crop_" + st, H.LEAVES, null, { n: CROPS[k].n + " 작물", ic: "🌱", h: 0, r: 0, d: "", key: k + "_crop_" + st }); Kt[id].deco = 1; Kt[id].door = 1; Kt[id].g = 1; Kt[id].crop = k; Kt[id].st = st; return id; });
for (const k of ["wall_torch", "lever", "redstone_wire", "stone_pressure_plate", "red_bed"]) { const id = MPI.newBlocks[k]; Kt[id].deco = 1; Kt[id].g = 1; Kt[id].door = 1; }
ji.melon_slice = ["수박 조각", "🍉", "f", "apple", 2];
const FARMLAND = MPI.newBlocks.farmland;
const fKey = (x, yy, z) => x + "," + yy + "," + z;
FARM.stage = f => { const d = FARM.grow[f.k] || 300; const rain = (xt && xt.k > .3) ? 1.6 : 1; return Math.min(3, Math.floor((Date.now() - f.t0) / 1000 * rain / (d / 3))); };
// 밭 가까이에서 F (대화 버튼): 심기 · 거두기 · 뼛가루 — 가까운 밭 칸을 한꺼번에
const farmNear = P => {
  const out = [], x0 = Math.floor(P.x), z0 = Math.floor(P.z), y0 = Math.round(P.y);
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -2; dy <= 1; dy++) {
    const x = x0 + dx, yy = y0 + dy, z = z0 + dz;
    if (Hr(x, yy, z) !== FARMLAND) continue;
    const d = Math.hypot(x + .5 - P.x, z + .5 - P.z); if (d > 3.2) continue;
    const up = Hr(x, yy + 1, z), b = up && Kt[up];
    out.push({ x, y: yy, z, d, up, crop: b && b.crop ? b : null });
  }
  return out.sort((a, b) => a.d - b.d);
};
const farmSeed = () => { let best = null; for (const k of Object.keys(CROPS)) { const s = CROPS[k].seed; if (mpHave(s) > 0 && (!best || mpHave(s) > mpHave(best))) best = s; } return best; };
FARM.plant = (cells, seed) => {
  const crop = Object.keys(CROPS).find(k => CROPS[k].seed === seed); if (!crop) return 0;
  let n = 0;
  for (const f of cells) {
    if (f.up || !mpHave(seed)) continue;
    const yy = f.y + 1; mpTake(seed, 1); n++;
    FARM.cells[fKey(f.x, yy, f.z)] = { k: crop, t0: Date.now() };
    BLD.setBlock(f.x, yy, f.z, FARM.ids[crop][0]); mpNet("mp", [f.x, yy, f.z, FARM.ids[crop][0]]);
  }
  if (n) { try { Lt("st_grass", 0, 1.3); } catch (e) {} mpToast("🌱 " + CROPS[crop].n + " " + n + "칸 심었어요 · 다 자라면 " + useK() + "로 거둬요 (비 오면 더 빨리)", 2400); mpSave(); }
  return n;
};
FARM.harvest = cells => {
  let n = 0;
  for (const f of cells) { if (!f.crop || f.crop.st < 3) continue; BLD.breakAt({ x: f.x, y: f.y + 1, z: f.z, id: f.up }); n++; }
  if (n) { mpToast("🌾 " + n + "칸 거뒀어요 · 씨앗을 다시 심어요", 1600); mpSave(); }
  return n;
};
FARM.bone = cells => {
  let n = 0;
  for (const f of cells) {
    if (!f.crop || f.crop.st >= 3 || !mpHave("white_dye")) continue;
    const cell = FARM.cells[fKey(f.x, f.y + 1, f.z)]; if (!cell) continue;
    mpTake("white_dye", 1); n++;
    cell.t0 -= (FARM.grow[cell.k] || 300) / 3 * 1000 * (1 + O());
    MP.fx(f.x + .5, f.y + 1.3, f.z + .5, [.55, 1, .45], 8);
  }
  if (n) { FARM.tick(true); mpToast("🦴 뼛가루를 " + n + "칸에 뿌렸어요 · 작물이 쑥!", 1600); mpSave(); }
  return n;
};
const nearFarm = (L, P) => {
  const cells = farmNear(P); if (!cells.length) return;
  const ripe = cells.filter(f => f.crop && f.crop.st >= 3), empty = cells.filter(f => !f.up), grow = cells.filter(f => f.crop && f.crop.st < 3);
  const seed = farmSeed(), a = cells[0];
  let l, fn;
  if (ripe.length) { l = "🌾 다 자란 작물 거두기 (" + ripe.length + "칸)"; fn = () => FARM.harvest(ripe); }
  else if (empty.length && seed) { l = "🌱 " + mpNameOf(seed) + " 심기 (" + Math.min(empty.length, mpHave(seed)) + "칸)"; fn = () => FARM.plant(empty, seed); }
  else if (grow.length && mpHave("white_dye")) { l = "🦴 뼛가루 뿌리기 (" + Math.min(grow.length, mpHave("white_dye")) + "칸)"; fn = () => FARM.bone(grow); }
  else if (empty.length) { l = "🌱 빈 밭 · 씨앗이 필요해요"; fn = () => mpToast("🌱 씨앗은 블록폰 엔더 택배(농사)에서 사요 · 거둔 작물에서도 나와요", 2400); }
  else { l = "🌱 작물이 자라는 중 (" + grow.length + "칸)"; fn = () => mpToast("🌱 다 자라면 " + useK() + "로 거둬요 · 비 오면 더 빨리 · 뼛가루(하얀색 염료)를 뿌리면 쑥", 2400); }
  L.push({ x: a.x + .5, z: a.z + .5, y: P.y, r: 3.4, l, fn });
};
// 땅을 사면: 선 자리에 침대(집) · 바라보는 쪽(막히면 옆 · 뒤)에 밭 3×3 — 땅 안 · 빈 칸에만
LOT.homestead = (gx, gz) => {
  const P = c.P, bx = Math.floor(P.x), bz = Math.floor(P.z), by = Math.max(0, Math.round(P.y));
  const inLot = (x, z) => x >= gx * 16 && x < gx * 16 + 16 && z >= gz * 16 && z < gz * 16 + 16;
  const free = (x, z) => inLot(x, z) && ia(x + .5, z + .5) && !Hr(x, by, z) && !Hr(x, by + 1, z) && (by === 0 || !!Hr(x, by - 1, z));
  let bed = null;
  if (free(bx, bz)) { BLD.setBlock(bx, by, bz, BED, 0, 1); mpNet("mp", [bx, by, bz, BED]); bed = { x: bx, y: by, z: bz }; }
  const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw);
  const f0 = Math.abs(fx) > Math.abs(fz) ? [Math.sign(fx), 0] : [0, Math.sign(fz) || 1];
  let best = [];
  for (const [ux, uz] of [f0, [-f0[1], f0[0]], [f0[1], -f0[0]], [-f0[0], -f0[1]]]) {
    const cells = [];
    for (let a = 2; a <= 4; a++) for (let b = -1; b <= 1; b++) { const x = bx + ux * a - uz * b, z = bz + uz * a + ux * b; if (free(x, z)) cells.push([x, z]); }
    if (cells.length > best.length) best = cells;
    if (best.length === 9) break;
  }
  for (const [x, z] of best) { BLD.setBlock(x, by, z, FARMLAND, 0, 1); mpNet("mp", [x, by, z, FARMLAND]); }
  if (bed) homeSet(bed, 1);
  try { Lt("st_grass", 0, 1); } catch (e) {}
  return { bed: !!bed, farm: best.length };
};
FARM.tick = force => {
  for (const [k, f] of Object.entries(FARM.cells)) {
    const [x, yy, z] = k.split(",").map(Number);
    const id = Hr(x, yy, z);
    const ch = mpChunkAt(x, z); if (!ch || !ch.G) continue;
    if (!id || !Kt[id].crop) { if (!id) delete FARM.cells[k]; continue; }
    const st = FARM.stage(f), want = FARM.ids[f.k][st];
    if (id !== want) { BLD.setBlock(x, yy, z, want, 0, 1); mpNet("mp", [x, yy, z, want]); }
  }
};
setInterval(() => { if (c.run && S.out) FARM.tick(); }, 2000);
// 작물 캐면 (거두기)
{
  const prevDrop = BLD.dropOf;
  BLD.dropOf = (bid, tool) => {
    const b = Kt[bid];
    if (b && b.crop) {
      const cr = CROPS[b.crop];
      if (b.st < 3) return [cr.seed, 1];
      MP._harvest = cr.drop;
      return null;
    }
    return prevDrop(bid, tool);
  };
  const prevBreak = MP.onBreak;
  MP.onBreak = (tg, b) => {
    prevBreak && prevBreak(tg, b);
    if (b && b.crop) {
      delete FARM.cells[fKey(tg.x, tg.y, tg.z)];
      if (MP._harvest) { for (const [it, a, bb] of MP._harvest) { const n = a + Math.floor(O() * (bb - a + 1)); if (n > 0) BLD.giveDrop(it, n, tg.x + .5, tg.y + .5, tg.z + .5); } MP._harvest = null; MP.fx(tg.x + .5, tg.y + .3, tg.z + .5, [1, .9, .4], 6); MP.onHarvest && MP.onHarvest(b.crop); }
    }
    if (b && bid0(b) === FARMLAND) { const up = Hr(tg.x, tg.y + 1, tg.z); if (up && Kt[up].crop) BLD.breakAt({ x: tg.x, y: tg.y + 1, z: tg.z, id: up }); }
  };
}
const bid0 = b => b && b.id;
// 밀 → 빵 같은 음식 레시피 (음식 가방으로)
MP.recipes.push({ o: ["bread", 1], i: [["wheat", 3]], at: "table", cat: "재료" });
MP.recipes.push({ o: ["pumpkin_pie", 1], i: [["pumpkin", 1], ["egg", 1], ["wheat", 1]], at: "table", cat: "재료" });
MP.recipes.push({ o: ["beetroot_soup", 1], i: [["beetroot", 3]], at: "hand", cat: "재료" });
MP.recipes.push({ o: ["cake", 1], i: [["wheat", 3], ["egg", 1], ["sugar_cane", 2]], at: "table", cat: "재료" });
{ // 음식 결과는 음식 가방(F)으로
  const orig = xM;
  xM = function (id, n, quiet) {
    const r = ji[id];
    if (r && r[2] === "f" && MP._crafting) { c.FI = c.FI || {}; const k = r[3]; c.FI[k] = Math.min(999, (c.FI[k] | 0) + n); return r[1] + " " + r[0] + " ×" + n; }
    return orig.apply(this, arguments);
  };
  const prevCraft = MP.click.cr;
  MP.click.cr = v => { MP._crafting = 1; try { prevCraft(v); } finally { MP._crafting = 0; } };
}

// ── 동물 번식: 두 마리에게 먹이를 주면 아기 ──
const ANIM_FOOD = { cow: ["wheat", "밀"], sheep: ["wheat", "밀"], chicken: ["wheat_seeds", "밀 씨앗"], pig: ["beetroot", "비트 · 당근"] };
const ANIM_NAME = { cow: "소", sheep: "양", chicken: "닭", pig: "돼지" };
const nearAnimals = (L, P) => {
  if (!S.out || typeof Jt === "undefined" || !Jt.A) return;
  for (const a of Jt.A) {
    const d = Math.hypot(a.x - P.x, a.z - P.z); if (d > 2.4) continue;
    const f = ANIM_FOOD[a.k]; if (!f) continue;
    const have = f[0] === "beetroot" ? mpHave("beetroot") + ((c.FI && c.FI.carrot) | 0) : mpHave(f[0]);
    if (!have || a.baby) continue;
    L.push({ x: a.x, z: a.z, y: a.y, r: 2.4, l: `${a.k === "pig" ? "🥕" : "🌾"} ${ANIM_NAME[a.k]}에게 먹이 주기 (두 마리면 아기)`, fn: () => feedAnimal(a) });
    break;
  }
};
const feedAnimal = a => {
  const f = ANIM_FOOD[a.k];
  if (f[0] === "beetroot" && !mpHave("beetroot")) { if ((c.FI && c.FI.carrot) > 0) c.FI.carrot--; else return; } else if (!mpTake(f[0], 1)) return;
  a.love = Date.now();
  try { MP.fx(a.x, a.y + 1, a.z, [1, .45, .6], 7); Lt(({ cow: "moo", sheep: "baa", chicken: "cluck", pig: "oink" })[a.k] || "pop", 0); } catch (e) {}
  const mate = Jt.A.find(b => b !== a && b.k === a.k && !b.baby && b.love && Date.now() - b.love < 30000 && Math.hypot(b.x - a.x, b.z - a.z) < 9);
  if (mate) {
    a.love = mate.love = 0;
    try {
      const baby = _j(a.k, (a.x + mate.x) / 2, (a.z + mate.z) / 2);
      baby.baby = Date.now(); baby.g.scale.setScalar(.5);
      Ss(7, 1); MP.fx(baby.x, baby.y + .8, baby.z, [1, .45, .6], 12);
      mpToast("💕 아기 " + ANIM_NAME[a.k] + "가 태어났어요!", 2400);
      MP.onBreed && MP.onBreed(a.k);
    } catch (e) { console.warn("[마이폴 확장] 번식", e); }
  } else mpToast(ANIM_NAME[a.k] + "에게 " + f[1] + "를 줬어요 · 30초 안에 한 마리 더 주면 아기가 태어나요", 2200);
  mpSave();
};
setInterval(() => { if (typeof Jt === "undefined" || !Jt.A) return; for (const a of Jt.A) if (a.baby) { const k = Math.min(1, .5 + (Date.now() - a.baby) / 180000 * .5); a.g.scale.setScalar(k); if (k >= 1) a.baby = 0; } }, 1000);

// ── 장식 블록 모형 (침대 · 횃불 · 작물 · 레버 · 선 · 압력판) ──
const DECO = (MP.deco = { m: new Map(), mats: {} });
const dMat = (col, em) => { const k = col + ":" + (em || 0); return DECO.mats[k] || (DECO.mats[k] = new v.MeshStandardMaterial({ color: col, roughness: .85, emissive: em ? col : 0x000000, emissiveIntensity: em || 0 })); };
const dBox = (g, w, h, d, col, x, yy, z, em) => { const m = new v.Mesh(new v.BoxGeometry(w, h, d), dMat(col, em)); m.position.set(x, yy, z); m.castShadow = true; g.add(m); return m; };
DECO.build = (id, x, yy, z) => {
  const b = Kt[id], g = new v.Group(); g.position.set(x + .5, yy, z + .5);
  if (b.crop) {
    const cr = CROPS[b.crop], st = b.st, h = .25 + st * .22, col = cr.col[st];
    for (const r of [Math.PI / 4, -Math.PI / 4]) { const m = new v.Mesh(new v.PlaneGeometry(.85, h), new v.MeshStandardMaterial({ color: col, side: v.DoubleSide, roughness: .9 })); m.position.y = h / 2; m.rotation.y = r; g.add(m); }
    if (st === 3 && cr.top) dBox(g, .22, .18, .22, cr.top, 0, h * .5, 0);
    if (st === 3 && cr.fruit) dBox(g, .62, .55, .62, cr.fruit, .18, .28, .18);
    if (st === 3 && b.crop === "wheat") for (const r of [Math.PI / 4, -Math.PI / 4]) { const m = new v.Mesh(new v.PlaneGeometry(.8, .3), new v.MeshStandardMaterial({ color: 0xd9b443, side: v.DoubleSide, roughness: .9 })); m.position.y = h - .12; m.rotation.y = r; g.add(m); }
  } else if (b.mc === "red_bed") {
    dBox(g, .96, .3, .96, 0x8a5a2b, 0, .15, 0); dBox(g, .94, .22, .94, 0xd33c3c, 0, .4, .05); dBox(g, .7, .14, .26, 0xf4f4f4, 0, .55, -.3);
  } else if (b.mc === "wall_torch") {
    dBox(g, .1, .55, .1, 0x8a5a2b, 0, .28, 0); dBox(g, .16, .16, .16, 0xffc23a, 0, .62, 0, 1.6);
  } else if (b.mc === "lever") {
    dBox(g, .4, .1, .55, 0x8b8e93, 0, .05, 0); const s = dBox(g, .08, .5, .08, 0x6b4423, 0, .3, 0); s.rotation.x = (MP.rs && MP.rs.on && MP.rs.on.has(x + "," + yy + "," + z)) ? -.6 : .6; g.userData.stick = s;
  } else if (b.mc === "redstone_wire") {
    const on = MP.rs && MP.rs.pow && MP.rs.pow.get(x + "," + yy + "," + z) > 0;
    dBox(g, .9, .04, .18, on ? 0xff2a2a : 0x6a0d0d, 0, .02, 0, on ? 1 : 0); dBox(g, .18, .04, .9, on ? 0xff2a2a : 0x6a0d0d, 0, .02, 0, on ? 1 : 0);
  } else if (b.mc === "stone_pressure_plate") {
    dBox(g, .86, .06, .86, 0x9a9da2, 0, .03, 0);
  } else dBox(g, .5, .5, .5, 0xffffff, 0, .25, 0);
  g.traverse(o => { if (o.isMesh) o.receiveShadow = true; });
  return g;
};
DECO.sync = () => {
  if (!S.root) return;
  const P = c.P, keep = new Set();
  for (const [k, id] of MP.decoCells) {
    const [x, yy, z] = k.split(",").map(Number);
    if (Math.abs(x - P.x) > 72 || Math.abs(z - P.z) > 72) continue;
    const ch = mpChunkAt(x, z); if (!ch || !ch.G) continue;
    const real = Hr(x, yy, z); if (real !== id) continue;
    const vk = k + ":" + id + ":" + (MP.decoVer || 0);
    keep.add(k);
    const cur = DECO.m.get(k);
    if (cur && cur.vk === vk) continue;
    if (cur) { S.root.remove(cur.g); }
    const g = DECO.build(id, x, yy, z); S.root.add(g); DECO.m.set(k, { g, vk });
  }
  for (const [k, v] of DECO.m) if (!keep.has(k)) { S.root.remove(v.g); DECO.m.delete(k); }
  MP.decoDirty = 0;
};

// 가까이 가면: 침대 · 동물
const nearHome = (L, P) => {
  if (!S.out) return;
  const s = mpFind(BED, 2);
  if (s) {
    const night = c.tod && c.tod.night > .5;
    L.push({ x: s.x + .5, z: s.z + .5, y: P.y, r: 2.6, l: night ? "🛏️ 자고 여기를 집으로 (밤 → 아침)" : "🛏️ 여기를 집으로 (밤엔 잘 수 있어요)", fn: () => { homeSet(s); if (night) try { kS(); } catch (e) {} } });
  }
  nearFarm(L, P);
  nearAnimals(L, P);
};

// 지도 표시
const lotMarks = (ctx, X, Z, big) => {
  ctx.save(); ctx.font = (big ? 22 : 30) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const l of LOT.mine) ctx.fillText("🏡", X(l.gx * 16 + 8), Z(l.gz * 16 + 8));
  if (LOT.spawn) ctx.fillText("🛏️", X(LOT.spawn.x), Z(LOT.spawn.z));
  ctx.restore();
};

de.add({
  id: "mp_home", name: "내 땅 · 집 · 농사", need: ["mp_build", "mp_craft", "whp", "animal", "map"],
  gives: "MP.lot 내 땅 (16×16 · 사면 침대(집) · 밭 3×3 이 생겨요) · 침대 = 집 · MP.farm 작물 (밭에서 F: 심기 · 거두기 · 뼛가루) · 동물 번식 · 장식 블록 모형",
  near: nearHome,
  tick: dt => {
    if ((LOT.bt = (LOT.bt || 0) - dt) <= 0) { LOT.bt = .5; lotBorders(); }
    if ((DECO.t = (DECO.t || 0) - dt) <= 0 || MP.decoDirty) { DECO.t = .6; DECO.sync(); }
  },
  peerOut: e => { if (LOT.mine.length) e.mpl = LOT.mine.slice(0, 8).map(l => [l.gx, l.gz]); },
  peerIn: (s, r) => {
    const id = r && (r.id || r.nm) || s && s.nm; if (!id) return;
    if (r && Array.isArray(r.mpl)) LOT.peers.set(id, { nm: s.nm || r.nm, lots: r.mpl.filter(a => Array.isArray(a) && isFinite(a[0]) && isFinite(a[1])).slice(0, 8), t: Date.now() });
    else if (LOT.peers.has(id) && r && !r.mpl) LOT.peers.delete(id);
  },
  miniMarks: (ctx, X, Z) => lotMarks(ctx, X, Z, 0),
  bigMarks: (ctx, X, Z) => lotMarks(ctx, X, Z, 1),
  save: e => {
    const dmg = {};
    for (const l of LOT.mine) { const [key, cells] = lotCellsOf(l); if (cells.length) dmg[key] = (dmg[key] || []).concat(cells); }
    e.mph = { v: 1, mine: LOT.mine, spawn: LOT.spawn, dmg, farm: FARM.cells };
  },
  load: e => {
    const d = e && e.mph;
    LOT.mine = []; LOT.spawn = null; FARM.cells = {};
    if (!d || typeof d !== "object") return;
    if (Array.isArray(d.mine)) LOT.mine = d.mine.filter(l => l && isFinite(l.gx) && isFinite(l.gz)).slice(0, LOT.max).map(l => ({ gx: l.gx | 0, gz: l.gz | 0, t: +l.t || 0, z: String(l.z || "house") }));
    if (d.spawn && isFinite(d.spawn.x)) LOT.spawn = { x: d.spawn.x | 0, y: d.spawn.y | 0, z: d.spawn.z | 0 };
    if (d.farm && typeof d.farm === "object") for (const [k, f] of Object.entries(d.farm)) if (/^-?\d+,-?\d+,-?\d+$/.test(k) && f && CROPS[f.k]) FARM.cells[k] = { k: f.k, t0: +f.t0 || Date.now() };
    for (const [key, cells] of Object.entries(d.dmg || {})) { if (!/^-?\d+,-?\d+$/.test(key) || !Array.isArray(cells)) continue; let dm = S.dmg.get(key); if (!dm) S.dmg.set(key, (dm = new Set())); for (const li of cells) if (li >= 0) dm.add(li | 0); }
  },
  newGame: () => { LOT.mine = []; LOT.spawn = null; FARM.cells = {}; },
  dbg: { MPL: LOT, MPFARM: FARM },
});
