/* ───────────── 블록 바탕: 놓인 블록 · 캐기 작업 ─────────────
   V119: 짓기 모드(🧱 짓기 버튼 · X 키 · 블록 팔레트 · 마음대로 놓기 · 캐기)는 뺐어요.
   남은 일
   · 놓인 블록 기억하기 — 예전에 놓은 블록 · 친구가 보낸 블록 · 게임이 놓는 블록(밭 · 작물 · 침대 · 차원문 흑요석 · 한탕 TNT)
     청크에 붙여 그리고 저장해요 (저장 칸 mpb 그대로)
   · BLD.dig(칸, {t, label, done}) — 광석 · 금고 문처럼 정해진 곳에서 F(대화 버튼)로 캐는 작업
     (진행 막대 · 금 가는 표시 · 멀리 움직이면 그만)
   · 떠 있는 아이템 끌어당기기 · 무기로 부순 블록은 코인으로 */

const BLD = (MP.build = {
  pal: Array(10).fill(null), sel: 0,   // 예전 저장 칸 (지금은 안 써요 · 그대로 남겨요)
  put: new Map(),    // "cx,cz" → Map(칸 번호 → 블록 id)  내 쪽에서 놓은 것 (저장)
  rput: new Map(),   // 친구가 놓은 것 (저장 안 해요)
  gift: 0, tip: 0, count: 0, job: null,
});
const mpKeyOf = (cx, cz) => cx + "," + cz;
const mpChunkAt = (x, z) => S.ch.get(Math.floor(x / 64) + "," + Math.floor(z / 64));
const mpMat = b => !b ? "stone" : b.g ? "glass" : b.t === H.WOOL ? "wool" : /planks|log|door|fence|bookshelf|hay|crafting|chest|bed/.test(b.mc) ? "wood" : /sand|dirt|grass|gravel|snow|farmland|soul/.test(b.mc) ? "sand" : /iron|gold|copper|cauldron/.test(b.mc) ? "metal" : "stone";
const mpStepSnd = b => { const m = mpMat(b); return "st_" + (m === "sand" ? (/grass|dirt|farmland/.test(b && b.mc) ? "grass" : "sand") : m); };
const mpBrkSnd = b => { const m = mpMat(b); return "brk_" + (m === "metal" ? "stone" : m); };
MP.blockMat = mpMat;

// 이 칸에 무엇이 있나 (도시 + 폐광 · 용암 차원)
const mpCell = (x, y, z) => {
  const ch = mpChunkAt(x, z);
  if (!ch || !ch.G || y < 0 || y >= ws) return null;
  return { ch, li: Es(Math.floor(x) - ch.cx * 64, y | 0, Math.floor(z) - ch.cz * 64), key: mpKeyOf(ch.cx, ch.cz) };
};
const mpMapOf = (m, key, mk) => { let r = m.get(key); if (!r && mk) m.set(key, (r = new Map())); return r; };
BLD.idAt = (x, y, z) => Hr(Math.floor(x), Math.floor(y), Math.floor(z));

// 청크 안 놓인 블록 상자 만들기
// 장식 블록(침대 · 횃불 · 작물 …)은 네모 블록으로 그리지 않고 따로 모형을 그려요
MP.decoCells = new Map();   // "x,y,z" → 블록 id
const mpIsDeco = id => !!(Kt[id] && Kt[id].deco);
const mpDecoSet = (x, yy, z, id) => { const k = x + "," + yy + "," + z; if (id && mpIsDeco(id)) MP.decoCells.set(k, id); else MP.decoCells.delete(k); MP.decoDirty = 1; };
const mpBox = (ch, li, id) => {
  const Q = ch.Q || ch; Q.mpb = Q.mpb || new Map();
  const fl = mpIsDeco(id) ? 0 : 63;
  if (Q.mpb.has(li)) { const bx = Q.bb[Q.mpb.get(li)]; if (bx) { bx[6] = id; bx[7] = fl; } return Q.mpb.get(li); }
  const cx = ch.cx, cz = ch.cz, lx = li % 64, lz = (li >> 6) % 64, ly = (li / 4096) | 0;
  const x = cx * 64 + lx, z = cz * 64 + lz;
  const bx = [x, ly, z, x + 1, ly + 1, z + 1, id, fl, 0]; bx.mp = 1;
  const idx = Q.bb.push(bx) - 1; Q.mpb.set(li, idx);
  return idx;
};
const mpBoxOff = (ch, li) => {
  const Q = ch.Q; if (!Q || !Q.mpb || !Q.mpb.has(li)) return;
  const bx = Q.bb[Q.mpb.get(li)]; if (bx) bx[7] = 0;
  Q.mpb.delete(li);
};

// 놓기 · 지우기 (게임이 써요 · net: 친구가 보낸 것 · force: 차 있는 칸도 바꾸기)
BLD.setBlock = (x, y, z, id, net, force) => {
  x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
  if (y < 0 || y >= ws) return false;
  const cell = mpCell(x, y, z);
  const key = mpKeyOf(Math.floor(x / 64), Math.floor(z / 64));
  const li = Es(x - Math.floor(x / 64) * 64, y, z - Math.floor(z / 64) * 64);
  const store = net ? BLD.rput : BLD.put;
  mpDecoSet(x, y, z, id);
  if (id) {
    if (cell && cell.ch.G[li] && !net && !force) return false;
    const mm = mpMapOf(store, key, 1);
    if (!net && !mm.has(li)) BLD.count++;
    mm.set(li, id);
    if (cell) {
      const ch = cell.ch; ch.G[li] = id;
      const bi = mpBox(ch, li, id); (ch.vx || (ch.vx = new Set())).add(bi);
      ch.rb = 1; S.dirty = 1;
    }
  } else {
    for (const m of [BLD.put, BLD.rput]) { const mm = m.get(key); if (mm && mm.delete(li) && m === BLD.put) BLD.count--; }
    if (cell) {
      const ch = cell.ch; ch.G[li] = 0;
      mpBoxOff(ch, li);
      let dm = S.dmg.get(key); if (!dm) S.dmg.set(key, (dm = new Set())); dm.add(li);
      ch.hit = ch.hit || new Set();
      ch.Q.bb.forEach((b, i) => { if (!b.mp && x >= b[0] && x < b[3] && y >= b[1] && y < b[4] && z >= b[2] && z < b[5]) ch.hit.add(i); });
      ch.rb = 1; S.dirty = 1;
    } else {
      let dm = S.dmg.get(key); if (!dm) S.dmg.set(key, (dm = new Set())); dm.add(li);
    }
  }
  return true;
};
MP.setBlock = BLD.setBlock;

// 청크가 새로 만들어질 때: 놓인 블록 상자 붙이기 / 격자에 다시 넣기
const mpChunkGen = (Q, cx, cz) => {
  const key = mpKeyOf(cx, cz);
  Q.mpb = new Map();
  for (const m of [BLD.put, BLD.rput]) {
    const mm = m.get(key); if (!mm) continue;
    for (const [li, id] of mm) mpBox({ Q, cx, cz }, li, id);
  }
};
const mpGrid = ch => {
  const key = mpKeyOf(ch.cx, ch.cz);
  for (const m of [BLD.put, BLD.rput]) { const mm = m.get(key); if (mm) for (const [li, id] of mm) { ch.G[li] = id; if (mpIsDeco(id)) mpDecoSet(ch.cx * 64 + (li % 64), (li / 4096) | 0, ch.cz * 64 + ((li >> 6) % 64), id); } }
  try { MP.gridExtra && MP.gridExtra(ch); } catch (e) { console.warn("[마이폴 확장] 격자", e); }
  const Q = ch.Q; if (Q && Q.mpb) { ch.vx = ch.vx || new Set(); for (const bi of Q.mpb.values()) ch.vx.add(bi); }
};
BLD.applyLoaded = () => {
  for (const ch of S.ch.values()) {
    if (!ch.G || ch.lod) continue;
    const key = mpKeyOf(ch.cx, ch.cz);
    let any = 0;
    for (const m of [BLD.put, BLD.rput]) { const mm = m.get(key); if (!mm) continue; for (const [li, id] of mm) { ch.G[li] = id; (ch.vx || (ch.vx = new Set())).add(mpBox(ch, li, id)); any = 1; } }
    if (any) ch.rb = 1;
  }
};

// 폭발로 부서진 놓인 블록은 기록에서도 빼요
{
  const orig = ES;
  ES = function (x, yy, z, r) {
    const n = orig.apply(this, arguments);
    try {
      if (n > 0 && (BLD.put.size || BLD.rput.size)) {
        const R = Math.ceil(Math.min(12, r || 1) * 1.9) + 1;
        for (let cx = Math.floor((x - R) / 64); cx <= Math.floor((x + R) / 64); cx++) for (let cz = Math.floor((z - R) / 64); cz <= Math.floor((z + R) / 64); cz++) {
          const ch = S.ch.get(cx + "," + cz); if (!ch || !ch.G) continue;
          const key = mpKeyOf(cx, cz);
          for (const m of [BLD.put, BLD.rput]) {
            const mm = m.get(key); if (!mm) continue;
            for (const [li, id] of [...mm]) if (!ch.G[li]) { mm.delete(li); if (m === BLD.put) BLD.count--; mpBoxOff(ch, li); }
          }
        }
        MP.onBlast && MP.onBlast(x, yy, z, r);
      }
    } catch (e) { console.warn("[마이폴 확장] 폭발 정리", e); }
    return n;
  };
}

// ── 화면 표시: 캐는 블록 테두리 · 금 가는 표시 ──
const MPV = {};
const mpVisInit = () => {
  if (MPV.ok || !Ye) return;
  MPV.ok = 1;
  const eg = new v.EdgesGeometry(new v.BoxGeometry(1.006, 1.006, 1.006));
  MPV.line = new v.LineSegments(eg, new v.LineBasicMaterial({ color: 0x0b0f18, transparent: true, opacity: .8 }));
  MPV.crackT = [];
  for (let s = 0; s < 10; s++) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 32;
    const g = cv.getContext("2d"); g.strokeStyle = "rgba(0,0,0,.75)"; g.lineWidth = 1.4;
    let rnd = 1234 + s * 7; const R = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k <= s; k++) { g.beginPath(); let px = 16, py = 16; g.moveTo(px, py); for (let q2 = 0; q2 < 3 + s; q2++) { px += (R() - .5) * 12; py += (R() - .5) * 12; g.lineTo(px, py); } g.stroke(); }
    const tx = new v.CanvasTexture(cv); tx.magFilter = v.NearestFilter; tx.minFilter = v.NearestFilter; MPV.crackT.push(tx);
  }
  MPV.crack = new v.Mesh(new v.BoxGeometry(1.012, 1.012, 1.012), new v.MeshBasicMaterial({ map: MPV.crackT[0], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  for (const m of [MPV.line, MPV.crack]) { m.visible = false; m.renderOrder = 5; m.layers.set(1); Ye.add(m); }
};
const mpVisHide = () => { if (MPV.ok) MPV.line.visible = MPV.crack.visible = false; };

// ── 캐기: 걸리는 시간 · 떨어지는 것 ──
BLD.mineTime = (bid, quiet) => {
  const b = Kt[bid]; if (!b) return { t: 1e9, tool: null, need: 0 };
  const cat = MPI.toolFor(b.mc), need = MPI.needTier(b.mc);
  let tool = null, mult = 1;
  if (cat === "any") mult = 1;
  else {
    tool = MPI.bestTool(cat);
    if (need && (!tool || tool.tier < need) && cat === "pickaxe") return { t: 1e9, tool, need };
    if (tool) mult = 1 / tool.speed; else mult = cat === "pickaxe" ? 3.3 : 1;
  }
  const h = b.h == null ? 1 : b.h;
  return { t: Math.max(h <= 0 ? .05 : .15, h * 1.5 * .7 * mult), tool, need };
};
BLD.dropOf = (bid, tool) => {
  const b = Kt[bid]; if (!b) return null;
  if (bid === rn.tnt) return ["tnt_b", 1];
  const own = MPI.itemOf[bid];
  if (b.mc === "oak_leaves") return O() < .25 ? ["stick", 1] : O() < .12 ? ["oak_sapling", 1] : null;
  if (b.mc === "glass" || b.mc === "packed_ice") return null;
  if (own && !b.key && b.d === b.mc) return [own, 1];
  const d = b.d; if (!d) return null;
  const n = (b.d0 | 0) + Math.floor(O() * ((b.d1 | 0) - (b.d0 | 0) + 1));
  return n > 0 ? [d, n] : null;
};
BLD.giveDrop = (it, n, x, yy, z) => {
  const r = ji[it]; if (!r || !(n > 0)) return;
  if (r[2] === "c") { Pt((r[3] || 2) * n, 1); return; }
  if (["blk", "r", "t", "b", "x", "m", "k"].includes(r[2])) { MP._myDrop = 1; try { L_(it, n, x, yy, z); } finally { MP._myDrop = 0; } }
  else if (r[2] === "f") { c.FI = c.FI || {}; const k = r[3]; c.FI[k] = Math.min(999, (c.FI[k] | 0) + n); mpToast(r[1] + " " + r[0] + " +" + n + " (음식 가방)", 1400); }
};
BLD.breakAt = (tg, silent) => {
  const b = Kt[tg.id];
  const tm = BLD.mineTime(tg.id);
  BLD.setBlock(tg.x, tg.y, tg.z, 0);
  mpNet("mb", [tg.x, tg.y, tg.z]);
  if (!silent) {
    const dr = BLD.dropOf(tg.id, tm.tool);
    if (dr) BLD.giveDrop(dr[0], dr[1], tg.x + .5, tg.y + .5, tg.z + .5);
    try { Lt(mpBrkSnd(b), 0); } catch (e) {}
    MP.onBreak && MP.onBreak(tg, b);
  }
};

// 무기로 부순 블록은 예전처럼 코인으로 (캐기 작업 · 수확으로 떨어진 것만 아이템)
MP.boomCoins = 0;
{
  const orig = L_;
  L_ = function (id, n) {
    const k = ji[id] && ji[id][2];
    if (!MP._myDrop && (k === "blk" || k === "r" || k === "t")) { MP.boomCoins += (+ji[id][3] || 1) * (n | 0 || 1); return; }
    return orig.apply(this, arguments);
  };
}
// 컷신 · 사진 · 운전 중에는 1인칭 손(무기)을 숨겨요 (MP.hideFP 는 이야기 · 탈것 블록이 채워요)
{ const orig = _9; _9 = function () { const r = orig.apply(this, arguments); try { if (Wi.root && MP.hideFP && MP.hideFP()) Wi.root.visible = false; } catch (e) {} return r; }; }

// ── 캐기 작업: 정해진 블록을 F(대화 버튼)로 캐요 (광석 · 금고 문) ──
mpCss("mp-dig-css", `
#mpdig{position:fixed;left:50%;top:calc(50% + 44px);transform:translateX(-50%);z-index:13;display:none;align-items:center;gap:10px;padding:7px 14px;border-radius:12px;background:rgba(22,30,46,.9);color:#fff;font:600 13px "IBM Plex Sans KR",sans-serif;pointer-events:none;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.25)}
#mpdig.on{display:flex}
#mpdig i{display:block;width:90px;height:6px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden}
#mpdig u{display:block;height:100%;width:0;background:#f5c542}
@media (max-height:480px){#mpdig{top:calc(50% + 30px);font-size:12px;padding:5px 12px}}
`);
const digEl = mpEl("div", { id: "mpdig", "aria-live": "polite" }, "<span></span><i><u></u></i>");
document.body.append(digEl);
const digKey = tg => tg.x + "," + tg.y + "," + tg.z;
BLD.digging = tg => !!(BLD.job && (!tg || BLD.job.key === digKey(tg)));
// o: { t 걸리는 시간(초) · label 진행 글자 · done(칸) 다 캤을 때 (없으면 BLD.breakAt) · r 움직여도 되는 거리 · snd 소리 · tag 이름표 }
BLD.dig = (tg, o = {}) => {
  if (BLD.digging(tg)) return false;
  const P = c.P;
  BLD.job = { tg, key: digKey(tg), t: Math.max(.45, o.t || 1), p: 0, x0: P.x, z0: P.z, r: o.r || 2.4, label: o.label || "⛏️ 캐는 중", done: o.done, snd: 0, sndName: o.snd || "", tag: o.tag || "" };
  mpVisInit(); digTick(0);
  return true;
};
BLD.digStop = why => {
  if (!BLD.job) return;
  BLD.job = null; digEl.classList.remove("on"); mpVisHide();
  if (why) mpToast(why, 1400);
};
const digTick = dt => {
  const j = BLD.job; if (!j) return;
  const P = c.P, tg = j.tg;
  if (!c.run || c.bm || mpBusy()) return BLD.digStop();
  if (Math.hypot(P.x - j.x0, P.z - j.z0) > j.r) return BLD.digStop("⛏️ 움직여서 그만 캤어요");
  if (Hr(tg.x, tg.y, tg.z) !== tg.id) return BLD.digStop();   // 누가 먼저 부쉈어요
  j.p += dt / j.t;
  if (dt && (j.snd -= dt) <= 0) { j.snd = .24; try { Lt(j.sndName || mpStepSnd(Kt[tg.id]), 0, .9); } catch (e) {} }
  if (MPV.ok) {
    MPV.line.position.set(tg.x + .5, tg.y + .5, tg.z + .5); MPV.line.visible = true;
    MPV.crack.material.map = MPV.crackT[Math.min(9, Math.floor(j.p * 10))]; MPV.crack.position.copy(MPV.line.position); MPV.crack.visible = true;
  }
  digEl.firstChild.textContent = j.label;
  digEl.querySelector("u").style.width = Math.round(Math.min(1, j.p) * 100) + "%";
  digEl.classList.add("on");
  if (j.p >= 1) {
    BLD.digStop();
    try { if (j.done) j.done(tg); else BLD.breakAt(tg); } catch (e) { console.warn("[마이폴 확장] 캐기", e); }
  }
};

// 매 프레임
const mpBuildTick = dt => {
  if (MP.boomCoins > 0) { const n = Math.round(MP.boomCoins); MP.boomCoins = 0; if (n > 0) Pt(n, 1); }
  // 떠 있는 아이템을 끌어당겨요 (가까우면)
  if (S.out && typeof an !== "undefined" && an.length) {
    const P = c.P;
    for (const it of an) { const dx = P.x - it.x, dz = P.z - it.z, d = Math.hypot(dx, dz); if (d < 3.2 && d > .2 && Math.abs(P.y + .5 - it.y) < 2.6) { const k = Math.min(1, dt * 7); it.x += dx * k; it.z += dz * k; it.y += (P.y + .6 - it.y) * k * .6; } }
  }
  digTick(dt);
};

// ── 같은 방 친구와 맞추기 (놓인 블록) ──
const mpPack = (list) => list.map(([x, yy, z, id]) => [x, yy, z, id].map(v => (v | 0).toString(36)).join(".")).join(";");
const mpUnpack = s => String(s || "").split(";").filter(Boolean).map(p => p.split(".").map(v => parseInt(v, 36)));
BLD.syncQ = [];
BLD.syncAll = () => {
  const all = [];
  for (const [key, mm] of BLD.put) { const [cx, cz] = key.split(",").map(Number); for (const [li, id] of mm) all.push([cx * 64 + (li % 64), (li / 4096) | 0, cz * 64 + ((li >> 6) % 64), id]); }
  for (let i = 0; i < all.length && i < 6000; i += 110) BLD.syncQ.push(mpPack(all.slice(i, i + 110)));
};
setInterval(() => { if (BLD.syncQ.length && c.net) mpNet("mz", [BLD.syncQ.shift()]); }, 160);
const mpNetRx = (k, e, peer) => {
  if (k === "mp") { const [x, yy, z, id] = e.slice(2).map(Number); if (Kt[id]) BLD.setBlock(x, yy, z, id, 1); return true; }
  if (k === "mb") { const [x, yy, z] = e.slice(2).map(Number); BLD.setBlock(x, yy, z, 0, 1); return true; }
  if (k === "mz") { for (const [x, yy, z, id] of mpUnpack(e[2])) if (Kt[id] && !Hr(x, yy, z)) BLD.setBlock(x, yy, z, id, 1); return true; }
  return false;
};
const mpSeen = new Set();
const mpPeerIn = (s) => { const id = s && (s.id || s.nm); if (!id || mpSeen.has(id)) return; mpSeen.add(id); if (BLD.put.size) setTimeout(BLD.syncAll, 1500); };

// ── 저장 (예전 판과 같은 모양) ──
const mpSaveB = e => {
  const put = {};
  for (const [key, mm] of BLD.put) { if (!mm.size) continue; const a = []; for (const [li, id] of mm) a.push(li, id); put[key] = a; }
  e.mpb = { v: 1, pal: BLD.pal, sel: BLD.sel, put, gift: BLD.gift, tip: BLD.tip ? 1 : 0 };
};
const mpLoadB = e => {
  const d = e && e.mpb;
  BLD.put = new Map(); BLD.count = 0; BLD.digStop();
  if (d && typeof d === "object") {
    if (Array.isArray(d.pal)) BLD.pal = Array.from({ length: 10 }, (_, i) => (typeof d.pal[i] === "string" && ji[d.pal[i]] ? d.pal[i] : null));
    BLD.sel = mpClamp(d.sel | 0, 0, 9); BLD.gift = d.gift ? 1 : 0; BLD.tip = d.tip ? 1 : 0;
    for (const [key, a] of Object.entries(d.put || {})) {
      if (!/^-?\d+,-?\d+$/.test(key) || !Array.isArray(a)) continue;
      const mm = new Map();
      for (let i = 0; i + 1 < a.length; i += 2) { const li = a[i] | 0, id = a[i + 1] | 0; if (li >= 0 && li < 4096 * ws && Kt[id]) mm.set(li, id); }
      if (mm.size) { BLD.put.set(key, mm); BLD.count += mm.size; }
    }
  } else { BLD.pal = Array(10).fill(null); BLD.sel = 0; BLD.gift = 0; }
  MP.decoCells = new Map();
  for (const [key, mm] of BLD.put) { const [cx, cz] = key.split(",").map(Number); for (const [li, id] of mm) if (mpIsDeco(id)) mpDecoSet(cx * 64 + (li % 64), (li / 4096) | 0, cz * 64 + ((li >> 6) % 64), id); }
  BLD.applyLoaded();
};

de.add({
  id: "mp_build", name: "블록 바탕 (놓인 블록 · 캐기 작업)", need: ["voxel", "boom", "itemdrop", "inv", "collide"],
  gives: "MP.build — setBlock(x,y,z,id) 게임이 블록 놓기 · 지우기 · put 놓인 블록 (저장) · dig(칸, {t, label, done}) F로 캐는 작업 · breakAt · mineTime (짓기 모드는 V119에서 뺐어요)",
  chunkGen: mpChunkGen, grid: mpGrid, tick: mpBuildTick, net: mpNetRx, peerIn: mpPeerIn,
  save: mpSaveB, load: mpLoadB,
  newGame: () => { BLD.put = new Map(); BLD.rput = new Map(); BLD.count = 0; BLD.pal = Array(10).fill(null); BLD.gift = 0; BLD.digStop(); },
  dbg: { MPB: BLD },
});
