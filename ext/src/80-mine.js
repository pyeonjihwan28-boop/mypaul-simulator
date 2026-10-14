/* ───────────── 4단계 ②: 폐광 (광석 캐기) · 강아지 ─────────────
   폐광: 바깥 도시의 마크 '폐광 입구'(갱도 교차점)에서 F → 아주 먼 곳의 지하 갱도로 내려가요.
         굴 벽에 석탄 · 철 · 금 · 레드스톤 · 청금석 · 에메랄드 · 다이아몬드 광석 · 3시간마다 새 광석
         광석 가까이에서 F(대화 버튼) → 가진 곡괭이로 캐요 (짓기 모드 없이 · 좋은 광석은 좋은 곡괭이)
   강아지: 떠돌이 강아지에게 뼈를 주면 친해져요 (마음 100) → 이름 짓기 → 따라다녀요 (최대 3마리) */

// ── 폐광 ──
const MINE = (MP.mine = { cx: 400, cz: 400, R: 7, P: 1, S: 4, ent: new Map(), back: null, seed: 0, in: false });
MINE.x0 = (MINE.cx - MINE.P) * 64; MINE.x1 = (MINE.cx + MINE.P + 1) * 64; MINE.z0 = (MINE.cz - MINE.P) * 64; MINE.z1 = (MINE.cz + MINE.P + 1) * 64;
MINE.spawn = [(MINE.cx + .5) * 64, (MINE.cz + .5) * 64];
const inMineChunk = (cx, cz) => Math.abs(cx - MINE.cx) <= MINE.R && Math.abs(cz - MINE.cz) <= MINE.R;
MP.inMine = () => { const P = c.P; return !!(S.out && Math.abs(P.x - MINE.spawn[0]) < (MINE.R + .5) * 64 && Math.abs(P.z - MINE.spawn[1]) < (MINE.R + .5) * 64); };
MP.mineWall = (x, z) => inMineChunk(Math.floor(x / 64), Math.floor(z / 64)) && !(x > MINE.x0 && x < MINE.x1 && z > MINE.z0 && z < MINE.z1);
MINE.seedNow = () => Math.floor(Date.now() / (3 * 3600e3));
const mh = (a, b, s) => { let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(s | 0, 83492791) ^ Math.imul(MINE.seed | 0, 2654435761)) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// 칸(4m) 단위: 열린 굴인가
const C0 = MINE.x0 / 4, C1 = MINE.x1 / 4, D0 = MINE.z0 / 4, D1 = MINE.z1 / 4, MC = [MINE.spawn[0] / 4, MINE.spawn[1] / 4];
MINE.open = (gx, gz) => {
  if (gx <= C0 || gx >= C1 - 1 || gz <= D0 || gz >= D1 - 1) return false;
  if (Math.abs(gx - MC[0] + .5) < 2 && Math.abs(gz - MC[1] + .5) < 2) return true;            // 내려온 방
  const lx = gx - C0, lz = gz - D0;
  if (lx % 4 === 2 || lz % 4 === 2) return mh(gx, gz, 7) > .08;                            // 굴 (4칸마다)
  return mh(gx, gz, 3) < .22;                                                              // 작은 방
};
const ORES = [["coal_ore", 34], ["iron_ore", 24], ["redstone_ore", 11], ["lapis_ore", 10], ["gold_ore", 9], ["emerald_ore", 5], ["diamond_ore", 7]];
const oreAt = (gx, gz, k) => {
  const d = Math.hypot(gx - MC[0], gz - MC[1]) / 24;   // 멀수록 귀한 광석이 조금 더
  let r = mh(gx * 7 + k, gz * 13 - k, 11) * (100 + d * 20) - d * 6;
  for (const [mc, w] of ORES) { if ((r -= w) < 0) return MPI.newBlocks[mc]; }
  return MPI.newBlocks.diamond_ore;
};
const mineChunk = (cx, cz, lod) => {
  const Q = { cx, cz, lod, g: br(), sg: br(), bb: [], door: [], box: [], chest: [], tree: [], lamp: [], car: [], ride: [], veh: [], mini: [], it: [], mob: [], sp: [], bld: [], bed: [], st: "", d: "mine", mineQ: 1 };
  const X0 = cx * 64, Z0 = cz * 64, stone = rn.stone, deep = MPI.newBlocks.deepslate;
  const B = (x1, y1, z1, x2, y2, z2, id) => Q.bb.push([x1, y1, z1, x2, y2, z2, id, 63, 0]);
  const inside = X0 >= MINE.x0 && X0 < MINE.x1 && Z0 >= MINE.z0 && Z0 < MINE.z1;
  if (!inside) { B(X0, 0, Z0, X0 + 64, 8, Z0 + 64, stone); Q.mini.push(["#3a3a40", X0, Z0, X0 + 64, Z0 + 64]); return Q; }
  const far = Math.hypot(X0 + 32 - MINE.spawn[0], Z0 + 32 - MINE.spawn[1]) > 70;
  B(X0, 0, Z0, X0 + 64, 1, Z0 + 64, deep);                                     // 바닥
  Q.mini.push(["#3a3a40", X0, Z0, X0 + 64, Z0 + 64]);
  const g0 = X0 / 4, h0 = Z0 / 4;
  for (let k = 0; k < 16; k++) {
    const gz = h0 + k;
    // 벽 (같은 줄의 막힌 칸은 하나로 이어요) · 천장 (빛 구멍은 빼고)
    let run = -1, crun = -1;
    for (let i = 0; i <= 16; i++) {
      const gx = g0 + i, op = i < 16 && MINE.open(gx, gz), shaft = op && mh(gx, gz, 5) < .07;
      if (i < 16 && !op) { if (run < 0) run = i; } else if (run >= 0) { B(X0 + run * 4, 1, Z0 + k * 4, X0 + i * 4, 7, Z0 + k * 4 + 4, far ? deep : stone); run = -1; }
      if (i < 16 && !shaft) { if (crun < 0) crun = i; } else if (crun >= 0) { B(X0 + crun * 4, 7, Z0 + k * 4, X0 + i * 4, 8, Z0 + k * 4 + 4, stone); crun = -1; }
      if (i < 16 && op) Q.mini.push([shaft ? "#b9b2a4" : "#8a8378", X0 + i * 4, Z0 + k * 4, X0 + i * 4 + 4, Z0 + k * 4 + 4]);
    }
    // 광석 (굴에 닿은 벽 칸 표면) · 불빛 (천장 발광석)
    for (let i = 0; i < 16; i++) {
      const gx = g0 + i, x = X0 + i * 4, z = Z0 + k * 4;
      if (MINE.open(gx, gz)) { if (mh(gx, gz, 9) < .16) B(x + 1, 7, z + 1, x + 2, 8, z + 2, rn.glowstone); continue; }
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!MINE.open(gx + dx, gz + dz)) continue;
        const n = mh(gx, gz, 20 + dx * 3 + dz * 5) < .55 ? 1 + (mh(gx, gz, 30 + dx + dz * 2) < .35 ? 1 : 0) : 0;
        for (let t = 0; t < n; t++) {
          const a = Math.floor(mh(gx + t, gz, 40 + dx + dz * 7) * 4), yy = 1 + Math.floor(mh(gx, gz + t, 50 + dx * 2 + dz) * 5);
          const ox = dx === 1 ? 3 : dx === -1 ? 0 : a, oz = dz === 1 ? 3 : dz === -1 ? 0 : a;
          const id = oreAt(gx, gz, t + dx * 2 + dz * 4);
          for (let v = 0; v < (id === MPI.newBlocks.coal_ore || id === MPI.newBlocks.iron_ore ? 2 : 1); v++) B(x + ox, yy + v, z + oz, x + ox + 1, yy + v + 1, z + oz + 1, id);
        }
      }
    }
  }
  if (cx === MINE.cx && cz === MINE.cz) {                                       // 엘리베이터 (지상으로)
    const [sx, sz] = MINE.spawn;
    B(sx - 2, 1, sz - 2, sx - 1, 6, sz - 1, rn.oak_log); B(sx + 1, 1, sz - 2, sx + 2, 6, sz - 1, rn.oak_log);
    B(sx - 2, 6, sz - 2, sx + 2, 7, sz - 1, rn.oak_planks); B(sx - 1, 1, sz - 2, sx + 1, 2, sz - 1, rn.iron_block);
  }
  return Q;
};
{ const orig = bB; bB = function (cx, cz, lod) { if (inMineChunk(cx, cz)) return mineChunk(cx, cz, lod); return orig.apply(this, arguments); }; }
// 폐광 안 길에는 자동차 · 시민이 안 다녀요
{ const orig = RA; RA = function (e, t) { if (inMineChunk(e, t) || inMineChunk(e - 1, t) || inMineChunk(e, t - 1)) return 0; return orig.apply(this, arguments); }; }
// 마크 폐광 구조물: 갱도 교차점을 입구로
const mineGen = (Q, cx, cz) => {
  if (Q.st !== "mineshaft") return;
  const ch0 = (Q.chest || []).find(a => a.tb === "abandoned_mineshaft");
  if (ch0) MINE.ent.set(cx + "," + cz, [ch0.x - 10, ch0.z]);
};
MINE.known = () => {
  if (MINE.kn) return MINE.kn;
  const L = [];
  for (let cx = -8; cx <= 8; cx++) for (let cz = -12; cz <= -2; cz++) { try { if (wB(cx, cz) === "mineshaft") L.push([cx * 64 + 32, cz * 64 + 32, cx + "," + cz]); } catch (e) {} }
  return (MINE.kn = L);
};
MINE.nearestEnt = () => { const P = c.P; let best = null, bd = 1e9; for (const [x, z, k] of MINE.known()) { const e = MINE.ent.get(k) || [x, z], d = Math.hypot(e[0] - P.x, e[1] - P.z); if (d < bd) { bd = d; best = e; } } return best; };
// 들어가기 · 나오기 (까맣게 바뀌었다가)
mpCss("mp-mine-css", `#mpfade{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:43;transition:opacity .45s}#mpfade.on{opacity:1}`);
const fadeEl = mpEl("div", { id: "mpfade" }); document.body.append(fadeEl);
const fadeGo = fn => { fadeEl.classList.add("on"); setTimeout(() => { try { fn(); } finally { setTimeout(() => fadeEl.classList.remove("on"), 600); } }, 480); };
MINE.enter = at => {
  if (MINE.busy) return; MINE.busy = 1;
  if (MP.car && MP.car.on) MP.car.exit();
  if (MP.glide && MP.glide.on) MP.glide.stop();
  const s = MINE.seedNow();
  if (s !== MINE.seed) { MINE.seed = s; for (const k of [...S.dmg.keys()]) { const [a, b] = k.split(",").map(Number); if (inMineChunk(a, b)) S.dmg.delete(k); } for (const [k, ch] of [...S.ch]) if (inMineChunk(ch.cx, ch.cz)) { try { jB(ch); } catch (e) {} S.ch.delete(k); } }
  fadeGo(() => {
    const P = c.P; MINE.back = at ? [at[0], at[1]] : [P.x, P.z];
    try { if (ne.lv) { g0(); setTimeout(() => mpToast("🚓 경찰은 폐광까지 못 따라와요 · 수배가 풀렸어요", 2400), 900); } } catch (e) {}
    P.x = MINE.spawn[0] + .5; P.z = MINE.spawn[1] + 3.5; P.y = 1; P.vy = 0; P.fly = 0; MINE.hold = 1;
    try { Lt("chestClose", 0, .5); q("door"); } catch (e) {}
    MINE.busy = 0; MP.onTeleport && MP.onTeleport();
    setTimeout(() => mpToast("⛏️ 폐광 깊은 곳 · 벽에 박힌 광석 가까이에서 " + (c.isTouch ? "대화 버튼" : ze("use")) + "으로 캐요 · 엘리베이터로 지상에 올라가요", 4200), 900);
    if (!MINE.firstGift) { MINE.firstGift = 1; if (!MPI.bestTier("pickaxe")) { xM("stone_pickaxe", 1, 1); setTimeout(() => mpToast("🎁 광부 아저씨가 돌 곡괭이를 빌려줬어요", 2600), 2200); } }
    MP.stat("mineVisits"); mpSave();
  });
};
MINE.exit = () => {
  if (MINE.busy) return; MINE.busy = 1;
  fadeGo(() => {
    const P = c.P, b = MINE.back || MINE.nearestEnt() || [4, -120];
    P.x = b[0] + 1.5; P.z = b[1] + 1.5; P.y = ja(P.x, P.z, 4); P.vy = 0; MINE.hold = 2;
    try { q("door"); } catch (e) {}
    MINE.busy = 0; MP.onTeleport && MP.onTeleport(); mpSave();
  });
};
const mineTick = dt => {
  const inM = MP.inMine();
  if (inM !== MINE.in) { MINE.in = inM; if (!inM && Ye.fog) {} }
  // 청크가 만들어질 때까지 붙잡아 둬요
  if (MINE.hold) {
    const P = c.P, ch = mpChunkAt(P.x, P.z);
    if (ch && ch.G) { const fl = ja(P.x, P.z, MINE.hold === 1 ? 1.5 : 40); P.y = Math.max(P.y, fl); MINE.hold = 0; }
    else { P.vy = 0; if (MINE.hold === 1) P.y = 1; }
  }
};
MP.camHook = (prev => () => { prev && prev(); if (MINE.in && Ye.fog) Ye.fog.color.setHex(0x17161c); })(MP.camHook);
// 입구 표지판
const ENT_TAG = new Map();
const entTags = () => {
  if (!S.out || !S.root) return;
  const P = c.P;
  for (const [k, e] of MINE.ent) {
    const near = Math.hypot(e[0] - P.x, e[1] - P.z) < 90;
    let s = ENT_TAG.get(k);
    if (near && !s) { s = MP.tagSprite(["⛏️ 폐광 입구", "F · 깊은 곳으로 내려가기"]); s.position.set(e[0] + .5, 4.6, e[1] + .5); S.root.add(s); ENT_TAG.set(k, s); }
    else if (!near && s) { s.parent && s.parent.remove(s); ENT_TAG.delete(k); }
    else if (s && s.parent !== S.root) S.root.add(s);
  }
};
// 광석 캐기: 가까운 광석에서 F (대화 버튼) — 폐광 · 용암 차원 (90-world 가 네더 광석을 더해요)
MP.oreIds = new Set(ORES.map(([mc]) => MPI.newBlocks[mc]));
const TIER = ["", "나무", "돌", "철", "다이아몬드", "네더라이트"];
const oreFind = P => {   // 가로 2.6m · 발밑 ~ 머리 위 5칸 안 가장 가까운 광석
  let best = null, bd = 1e9;
  const x0 = Math.floor(P.x), z0 = Math.floor(P.z), y0 = Math.floor(P.y + .05);
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -1; dy <= 5; dy++) {
    const x = x0 + dx, yy = y0 + dy, z = z0 + dz, id = Hr(x, yy, z);
    if (!MP.oreIds.has(id)) continue;
    const h = Math.hypot(x + .5 - P.x, z + .5 - P.z); if (h > 2.6) continue;
    const d = h + Math.abs(yy + .5 - (P.y + 1.2)) * .35;
    if (d < bd) { bd = d; best = { x, y: yy, z, id }; }
  }
  return best;
};
MP.oreNear = (L, P) => {
  const o = oreFind(P); if (!o) return;
  const nm = (Kt[o.id] && Kt[o.id].n) || "광석", tm = BLD.mineTime(o.id);
  let l, fn;
  if (BLD.digging(o)) { l = "⛏️ " + nm + " 캐는 중…"; fn = () => {}; }
  else if (tm.t >= 1e8) { l = "⛏️ " + nm + " · " + TIER[tm.need] + " 곡괭이 이상 필요"; fn = () => mpToast("⛏️ " + nm + "은(는) " + TIER[tm.need] + " 곡괭이 이상으로 캐요 · 블록폰 🔨 제작 · 엔더 택배 도구", 2400); }
  else { l = "⛏️ " + nm + " 캐기" + (tm.tool ? " · " + mpNameOf(tm.tool.id) : ""); fn = () => BLD.dig(o, { t: tm.t, label: "⛏️ " + nm }); }
  L.push({ x: o.x + .5, z: o.z + .5, y: P.y, r: 3, l, fn });
};
const mineNear = (L, P) => {
  if (!S.out) return;
  if (MINE.in) { const [sx, sz] = MINE.spawn; MP.oreNear(L, P); if (Math.hypot(sx - P.x, sz - P.z) < 3.4) L.push({ x: sx, z: sz, y: P.y, r: 3.4, l: "🪜 엘리베이터 타고 지상으로", fn: MINE.exit }); return; }
  for (const e of MINE.ent.values()) if (Math.hypot(e[0] + .5 - P.x, e[1] + .5 - P.z) < 3) L.push({ x: e[0], z: e[1], y: P.y, r: 3, l: "⛏️ 폐광 깊은 곳으로 내려가기 (광석)", fn: () => MINE.enter(e) });
};
const mineMarks = (ctx, X, Z, big) => {
  ctx.save(); ctx.font = (big ? 22 : 30) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (MINE.in) ctx.fillText("🛗", X(MINE.spawn[0]), Z(MINE.spawn[1]));
  else for (const e of MINE.ent.values()) ctx.fillText("⛏️", X(e[0]), Z(e[1]));
  ctx.restore();
};
// 블록폰 미션 앱 맨 아래에 폐광 안내
{ const prev = ST.phoneHtml; ST.phoneHtml = () => prev() + `<div class="mpcard"><b>⛏️ 폐광 (광석 캐기)</b><span class="mpsub">${MINE.in ? "지금 폐광 안이에요 · 광석 가까이에서 캐요 · 엘리베이터로 올라가요" : "마크 폐광 입구 교차점에서 내려가요 · 곡괭이 필요 · 3시간마다 새 광석"}</span>${MINE.in ? "" : `<button class="mpbtn" data-mp="minego">길 안내</button>`}</div>`; }
MP.click.minego = () => { const e = MINE.nearestEnt(); if (!e) return mpToast("⛏️ 근처에 폐광이 없어요", 1600); try { Oi.on = 1; Oi.x = e[0]; Oi.z = e[1]; } catch (x) {} PH.close(); mpToast("📍 가까운 폐광 입구로 길 안내 · " + Ge(Math.round(Math.hypot(e[0] - c.P.x, e[1] - c.P.z))) + "m", 2400); };

// ── 강아지 ──
const DOGK = { dog_gold: [0xd9a24a, "황금빛"], dog_white: [0xf2efe8, "하얀"], dog_black: [0x2b2a2e, "까만"], dog_brown: [0x8a5a35, "갈색"] };
for (const [k, [col]] of Object.entries(DOGK)) {
  const dk = new v.Color(col).multiplyScalar(.75).getHex();
  bM[k] = { n: "강아지", s: "bark", sp: 1.4, f: 0, b: [[.46, .42, .82, col, 0, .55, 0], [.38, .36, .36, col, 0, .82, .5], [.2, .15, .2, dk, 0, .74, .74], [.08, .06, .06, 0x111111, 0, .8, .85], [.1, .16, .06, dk, -.13, 1.04, .46], [.1, .16, .06, dk, .13, 1.04, .46], [.08, .08, .34, col, 0, .78, -.52]], leg: [.12, .36, .12, dk, .14, .27] };
}
{ const oLt = Lt; Lt = function (e, t) { if (e === "bark") return dogBark(t || 0); return oLt.apply(this, arguments); }; }
const dogBark = (dist = 0) => { try { if (!wi || !uA.on || dist > 26) return; const r = wi.currentTime, a = Math.max(.05, 1 / (1 + dist * .08)); jl(r, .11, 640, 430, .085 * a, 1500); jl(r + .17, .1, 600, 420, .07 * a, 1400); } catch (e) {} };
{ const orig = xee; xee = function (a) { if (a && /^dog_/.test(a.k)) { a.scared = mpNow(); return; } return orig.apply(this, arguments); }; }   // 강아지는 폭발에 안 다쳐요
const DOG = (MP.dogs = { pets: [], max: 3, wt: 0 });
const NAMES = ["폴", "몽이", "초코", "보리"];
const isWild = a => a && /^dog_/.test(a.k) && !a.pet;
DOG.spawnWild = () => {
  if (!S.out || MINE.in || c.bm) return;
  const P = c.P; if (Jt.A.filter(isWild).length >= 2) return;
  const d = up(Math.floor(P.x / 64), Math.floor(P.z / 64)); if (!/park|house|apt|town|front/.test(d)) return;
  for (let t = 0; t < 6; t++) {
    const ang = O() * 6.28, r = 25 + O() * 30, p = snap(P.x + Math.sin(ang) * r, P.z + Math.cos(ang) * r);
    if (!ia(p[0], p[1]) || pa(p[0], p[1], .15, .5)) continue;
    const ks = Object.keys(DOGK), a = _j(ks[O() * ks.length | 0], p[0], p[1]); a.love = 0; a.wild = 1; return a;
  }
};
const dogMake = (pet, x, z) => {
  const a = _j(pet.k, x, z); a.pet = pet; pet.a = a; a.tx = a.x; a.tz = a.z; a.wt = 99;
  const tag = MP.tagSprite(["🐶 " + pet.n], 256, 64); tag.scale.set(1.1, .28, 1); tag.position.set(0, 1.45, 0); a.g.add(tag); a.tag = tag;
  return a;
};
DOG.tame = a => {
  if (DOG.pets.length >= DOG.max) return mpToast("🐶 강아지는 " + DOG.max + "마리까지 키울 수 있어요", 2000);
  const pet = { n: "", k: a.k, sit: 0, id: Date.now() % 1e9 };
  a.wild = 0; a.pet = pet; pet.a = a; a.wt = 99;
  DOG.pets.push(pet); DOG.naming = pet;
  try { Lt("level", 0, 1.3); } catch (e) {} MP.fx(a.x, a.y + .9, a.z, [1, .45, .6], 14);
  DOG.nameOpen(pet);
};
DOG.nameOpen = pet => {
  const btns = NAMES.map(n => `<button class="mpbtn" data-mp="dogname:${n}">${n}</button>`).join(" ");
  Br(`<i data-view="mpdog" hidden></i><h2>🐶 강아지 이름 짓기</h2><div class="mpnote">${DOGK[pet.k][1]} 강아지가 꼬리를 흔들어요! 이름을 골라 주세요</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0">${btns}</div><div style="display:flex;gap:6px"><input id="mpdogn" maxlength="8" placeholder="직접 짓기 (8자까지)" style="flex:1;min-width:0;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.3);color:#fff;font:600 14px 'IBM Plex Sans KR',sans-serif"><button class="mpbtn pri" data-mp="dogname:">확인</button></div>`, "mpdw");
};
MP.click.dogname = v => {
  const pet = DOG.naming || DOG.pets[DOG.pets.length - 1]; if (!pet) return;
  const raw = v || (J("mpdogn") && J("mpdogn").value) || "";
  const n = String(raw).replace(/[<>"'&]/g, "").trim().slice(0, 8) || NAMES[DOG.pets.length % 4];
  pet.n = n; DOG.naming = null; Fi(); try { c.lockPointer?.(); } catch (e) {}
  if (pet.a) { pet.a.tag && pet.a.g.remove(pet.a.tag); const tag = MP.tagSprite(["🐶 " + n], 256, 64); tag.scale.set(1.1, .28, 1); tag.position.set(0, 1.45, 0); pet.a.g.add(tag); pet.a.tag = tag; }
  mpToast("🐶 " + n + "(이)가 이제 내 강아지예요! 따라다녀요 · 가까이서 " + (c.isTouch ? "대화 버튼" : ze("use")) + " = 앉아/따라와", 3600);
  dogBark(); MP.stat("dogs"); mpSave();
};
const feedDog = a => {
  if (!mpTake("bone", 1)) return mpToast("🦴 뼈가 없어요 · 엔더 택배(농사)에서 사요", 1800);
  a.love = (a.love || 0) + 25 + (O() * 15 | 0);
  MP.fx(a.x, a.y + .9, a.z, [1, .45, .6], 8); dogBark();
  if (a.love >= 100) DOG.tame(a); else mpToast("🐶 꼬리를 흔들어요 · 마음 " + Math.min(99, a.love) + "/100", 1600);
  mpSave();
};
DOG.call = pet => {
  const P = c.P; let a = pet.a;
  if (!a || !Jt.A.includes(a)) a = dogMake(pet, P.x + 1.5, P.z + 1.5);
  a.x = P.x + 1.2; a.z = P.z + 1.2; a.y = P.y; pet.sit = 0;
};
MP.onTeleport = (prev => () => { prev && prev(); setTimeout(() => { for (const p of DOG.pets) if (!p.sit) DOG.call(p); }, 700); })(MP.onTeleport);
const dogTick = dt => {
  if (!S.out || typeof Jt === "undefined" || !Jt.A) return;
  if ((DOG.wt -= dt) <= 0) { DOG.wt = 15; if (O() < .6) DOG.spawnWild(); }
  const P = c.P;
  for (const pet of DOG.pets) {
    let a = pet.a;
    if (!a || !Jt.A.includes(a)) { if (pet.sit && pet.sx != null && Math.hypot(pet.sx - P.x, pet.sz - P.z) < 90) a = dogMake(pet, pet.sx, pet.sz); else if (!pet.sit) a = dogMake(pet, P.x + 2, P.z + 2); else continue; }
    a.wt = 99; a.tx = a.x; a.tz = a.z;
    if (pet.sit) { a.g.rotation.x = -.32; pet.sx = a.x; pet.sz = a.z; continue; }
    a.g.rotation.x = 0;
    const dx = P.x - a.x, dz = P.z - a.z, d = Math.hypot(dx, dz);
    if (d > 32 || Math.abs(P.y - a.y) > 6 && d > 4) { a.x = P.x - Math.sin(c.yaw) * -2; a.z = P.z - Math.cos(c.yaw) * -2; continue; }
    if (d > 2.6) {
      const sp = Math.min(11.5, 2 + d * 1.6) * Math.min(dt, .05), nx = a.x + dx / d * sp, nz = a.z + dz / d * sp;
      if (!pa(nx, nz, a.y, .3)) { a.x = nx; a.z = nz; } else if (!pa(nx, a.z, a.y, .3)) a.x = nx; else if (!pa(a.x, nz, a.y, .3)) a.z = nz; else if ((pet.stuck = (pet.stuck || 0) + dt) > 2) { pet.stuck = 0; a.x = P.x + 1; a.z = P.z + 1; }
      a.ph += dt * 12; a.h = Math.atan2(dx, dz);
    }
    // 폐광에서: 귀한 광석 냄새
    if (MINE.in && (pet.sn = (pet.sn || 0) - dt) <= 0) {
      pet.sn = 3;
      const fx0 = Math.floor(a.x), fz0 = Math.floor(a.z);
      outer: for (let ox = -5; ox <= 5; ox++) for (let oz = -5; oz <= 5; oz++) for (let yy = 1; yy < 7; yy++) {
        const id = Hr(fx0 + ox, yy, fz0 + oz);
        if (id === MPI.newBlocks.diamond_ore || id === MPI.newBlocks.emerald_ore) { const kk = (fx0 + ox) + "," + yy + "," + (fz0 + oz); if (!DOG.sniffed) DOG.sniffed = new Set(); if (DOG.sniffed.has(kk)) continue; DOG.sniffed.add(kk); dogBark(); mpToast("🐶 " + pet.n + "(이)가 뭔가 반짝이는 걸 찾았어요! 왈왈 (" + (id === MPI.newBlocks.diamond_ore ? "💎" : "💚") + " 근처)", 2400); break outer; }
      }
    }
  }
};
const dogNear = (L, P) => {
  if (!S.out || typeof Jt === "undefined" || !Jt.A) return;
  for (const a of Jt.A) {
    if (!/^dog_/.test(a.k) || Math.hypot(a.x - P.x, a.z - P.z) > 2.6) continue;
    if (a.pet) L.push({ x: a.x, z: a.z, y: a.y, r: 2.6, l: "🐶 " + a.pet.n + (a.pet.sit ? " · 따라와!" : " · 앉아! (쓰다듬기)"), fn: () => { a.pet.sit = a.pet.sit ? 0 : 1; MP.fx(a.x, a.y + .9, a.z, [1, .45, .6], 6); dogBark(); mpSave(); } });
    else L.push({ x: a.x, z: a.z, y: a.y, r: 2.6, l: mpHave("bone") ? "🦴 떠돌이 강아지에게 뼈 주기 (마음 " + (a.love | 0) + "/100)" : "🐶 떠돌이 강아지 · 뼈를 주면 친해져요", fn: () => feedDog(a) });
    break;
  }
};
// 블록폰 🐾 펫 앱
APPS.splice(APPS.length - 1, 0, ["pet", "🐾", "펫", "#a16207"]);
{ const prev = PH.render; PH.render = () => { if (PH.app === "pet" && J("mpphb")) { J("mpphst").textContent = phTime(); J("mpphb").innerHTML = `<div class="phh"><button data-mp="phhome">‹ 홈</button><b>🐾 펫</b></div>` + DOG.phoneHtml(); return; } prev(); }; }
DOG.phoneHtml = () => (DOG.pets.length ? DOG.pets.map((p, i) => `<div class="mpcard"><div class="row2"><span style="font-size:24px">🐶</span><span class="tx"><b>${ae(p.n || "이름 없음")}</b><span>${DOGK[p.k] ? DOGK[p.k][1] : ""} 강아지 · ${p.sit ? "앉아서 기다려요" : "나를 따라다녀요"}</span></span><button class="mpbtn pri" data-mp="dogcall:${i}">부르기</button><button class="mpbtn" data-mp="dogsit:${i}">${p.sit ? "따라와" : "앉아"}</button></div></div>`).join("")
  : `<div class="mpcard">아직 강아지가 없어요 · 바깥 도시 공원 · 주택가의 떠돌이 강아지에게 🦴 뼈를 주면 친해져요 (마음 100)</div>`) + `<p class="mpsub">강아지는 ${DOG.max}마리까지 · 폐광에서는 귀한 광석 냄새를 맡아요</p>`;
MP.click.dogcall = i => { const p = DOG.pets[+i]; if (!p || !S.out) return; DOG.call(p); PH.close(); dogBark(); mpToast("🐶 " + p.n + "(이)가 달려왔어요!", 1600); };
MP.click.dogsit = i => { const p = DOG.pets[+i]; if (!p) return; p.sit = p.sit ? 0 : 1; if (p.sit && p.a) { p.sx = p.a.x; p.sz = p.a.z; } mpSave(); PH.render(); };
SHOP.find(s => s[0] === "농사")[1].push(["bone", 6, 60]);
ST.chat = (prev => k => k === "mina" && O() < .35 ? "북쪽 마크 폐광 입구 알아? 교차점에서 내려가면 광석이 잔뜩 있대!" : k === "rench" && O() < .3 ? "떠돌이 강아지한테 뼈를 줘 봐. 금방 친해질걸?" : prev(k))(ST.chat);

de.add({
  id: "mp_mine", name: "폐광 · 강아지", need: ["mp_ride", "animal", "mobs"],
  gives: "MP.mine 폐광 차원 (enter · exit · 광석 F로 캐기 · 3시간마다 새로) · MP.oreNear(L, P) 광석 F · MP.oreIds · MP.dogs 강아지 (뼈 → 마음 100 → 이름 · 따라다니기 · 앉아)",
  chunkGen: mineGen, near: (L, P) => { mineNear(L, P); dogNear(L, P); },
  tick: dt => { mineTick(dt); dogTick(dt); if ((MINE.tt = (MINE.tt || 0) - dt) <= 0) { MINE.tt = 1; entTags(); } },
  where: () => (MINE.in ? "⛏️ 폐광 깊은 곳" : null),
  cityFog: (f) => (MINE.in ? [10, 95] : f),
  miniMarks: (ctx, X, Z) => mineMarks(ctx, X, Z, 0),
  bigMarks: (ctx, X, Z) => mineMarks(ctx, X, Z, 1),
  save: e => { e.mpm = { v: 1, back: MINE.back, seed: MINE.seed, gift: MINE.firstGift ? 1 : 0, dogs: DOG.pets.map(p => ({ n: p.n, k: p.k, sit: p.sit, sx: p.sx, sz: p.sz })) }; },
  load: e => {
    const d = e && e.mpm; for (const p of DOG.pets) if (p.a) { p.a.g.parent && p.a.g.parent.remove(p.a.g); Jt.A = Jt.A.filter(a => a !== p.a); }
    DOG.pets = []; MINE.back = null; MINE.firstGift = 0;
    if (!d || typeof d !== "object") return;
    if (Array.isArray(d.back) && d.back.every(isFinite)) MINE.back = d.back.slice(0, 2);
    MINE.seed = +d.seed || 0; MINE.firstGift = d.gift ? 1 : 0;
    if (Array.isArray(d.dogs)) DOG.pets = d.dogs.filter(p => p && DOGK[p.k]).slice(0, DOG.max).map(p => ({ n: String(p.n || "").replace(/[<>"'&]/g, "").slice(0, 8) || "폴", k: p.k, sit: p.sit ? 1 : 0, sx: isFinite(p.sx) ? +p.sx : null, sz: isFinite(p.sz) ? +p.sz : null }));
  },
  newGame: () => { DOG.pets = []; MINE.back = null; },
  dbg: { MPMINE: MINE, MPDOG: DOG },
});
