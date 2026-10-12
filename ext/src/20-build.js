/* ───────────── 짓기 모드: 블록 놓기 · 캐기 ─────────────
   X (보스전 밖) · 휴대폰 '짓기' 버튼으로 켜고 꺼요. 바깥 도시(와 광산·다른 차원)에서만.
   핫바 대신 블록 팔레트 10칸 · 1~0 고르기 · 좌클릭 꾹 캐기 · 우클릭 놓기 */

const BLD = (MP.build = {
  on: false, pal: Array(10).fill(null), sel: 0,
  put: new Map(),    // "cx,cz" → Map(칸 번호 → 블록 id)  내가 놓은 것 (저장)
  rput: new Map(),   // 친구가 놓은 것 (저장 안 해요)
  tgt: null, prog: 0, mineKey: "", mining: false, placing: false, lastPlace: 0, lastBreak: 0, hitSnd: 0,
  gift: 0, count: 0, MAX: 20000,
});
const MP_RAY = new v.Raycaster();
const mpKeyOf = (cx, cz) => cx + "," + cz;
const mpChunkAt = (x, z) => S.ch.get(Math.floor(x / 64) + "," + Math.floor(z / 64));
const mpMat = b => !b ? "stone" : b.g ? "glass" : b.t === H.WOOL ? "wool" : /planks|log|door|fence|bookshelf|hay|crafting|chest|bed/.test(b.mc) ? "wood" : /sand|dirt|grass|gravel|snow|farmland|soul/.test(b.mc) ? "sand" : /iron|gold|copper|cauldron/.test(b.mc) ? "metal" : "stone";
const mpStepSnd = b => { const m = mpMat(b); return "st_" + (m === "sand" ? (/grass|dirt|farmland/.test(b && b.mc) ? "grass" : "sand") : m); };
const mpBrkSnd = b => { const m = mpMat(b); return "brk_" + (m === "metal" ? "stone" : m); };
MP.blockMat = mpMat;

// 이 칸에 무엇이 있나 (도시 + 내 차원 공간)
const mpCell = (x, y, z) => {
  const ch = mpChunkAt(x, z);
  if (!ch || !ch.G || y < 0 || y >= ws) return null;
  return { ch, li: Es(Math.floor(x) - ch.cx * 64, y | 0, Math.floor(z) - ch.cz * 64), key: mpKeyOf(ch.cx, ch.cz) };
};
const mpMapOf = (m, key, mk) => { let r = m.get(key); if (!r && mk) m.set(key, (r = new Map())); return r; };
BLD.idAt = (x, y, z) => Hr(Math.floor(x), Math.floor(y), Math.floor(z));

// 청크 안 내가 놓은 블록 상자 만들기
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

// 놓기 · 지우기 (net: 친구가 보낸 것)
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

// 청크가 새로 만들어질 때: 놓은 블록 상자 붙이기 / 격자에 다시 넣기
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

// 폭발로 부서진 내 블록은 기록에서도 빼요
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

// ── 조준한 블록 찾기 (화면 조준점에서 광선) ──
BLD.reach = 5.6;
BLD.ray = () => {
  if (!ot) return null;
  ot.updateMatrixWorld();
  MP_RAY.setFromCamera({ x: 0, y: 1 - 2 * (c.aimY || .38) }, ot);
  const o = MP_RAY.ray.origin, d = MP_RAY.ray.direction, P = c.P;
  const ex = P.x, ey = P.y + 1.55 - .45 * (c.crK || 0), ez = P.z;
  const camEye = Math.hypot(o.x - ex, o.y - ey, o.z - ez);
  let x = Math.floor(o.x), yy = Math.floor(o.y), z = Math.floor(o.z);
  const sx = d.x > 0 ? 1 : -1, sy = d.y > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1;
  const tdx = Math.abs(1 / (d.x || 1e-9)), tdy = Math.abs(1 / (d.y || 1e-9)), tdz = Math.abs(1 / (d.z || 1e-9));
  let tx = ((sx > 0 ? x + 1 - o.x : o.x - x)) * tdx, ty = ((sy > 0 ? yy + 1 - o.y : o.y - yy)) * tdy, tz = ((sz > 0 ? z + 1 - o.z : o.z - z)) * tdz;
  let nx = 0, ny = 0, nz = 0, t = 0;
  const tMax = camEye + BLD.reach + 1.5;
  for (let i = 0; i < 80 && t <= tMax; i++) {
    if (t >= Math.max(0, camEye - .6)) {
      const id = Hr(x, yy, z);
      if (id) {
        const cxp = x + .5, cyp = yy + .5, czp = z + .5;
        if (Math.hypot(cxp - ex, cyp - ey, czp - ez) > BLD.reach + .9) return null;
        return { x, y: yy, z, id, nx, ny, nz, px: x + nx, py: yy + ny, pz: z + nz };
      }
    }
    if (tx < ty && tx < tz) { x += sx; t = tx; tx += tdx; nx = -sx; ny = 0; nz = 0; }
    else if (ty < tz) { yy += sy; t = ty; ty += tdy; nx = 0; ny = -sy; nz = 0; }
    else { z += sz; t = tz; tz += tdz; nx = 0; ny = 0; nz = -sz; }
    if (yy < -1) break;
  }
  // 블록이 없으면 땅(바닥 y=0)에 놓을 수 있게
  const gy = MP.groundY ? MP.groundY() : 0;
  if (d.y < -1e-4) {
    const tg = (gy - o.y) / d.y;
    if (tg > Math.max(0, camEye - .6)) {
      const hx = o.x + d.x * tg, hz = o.z + d.z * tg;
      const gx = Math.floor(hx), gz = Math.floor(hz);
      if (Math.hypot(gx + .5 - ex, gy + .5 - ey, gz + .5 - ez) <= BLD.reach + .9 && !Hr(gx, gy, gz)) return { x: gx, y: gy - 1, z: gz, id: 0, ground: 1, nx: 0, ny: 1, nz: 0, px: gx, py: gy, pz: gz };
    }
  }
  return null;
};

// ── 화면 표시: 테두리 · 금 가는 표시 · 놓을 자리 미리보기 ──
const MPV = {};
const mpVisInit = () => {
  if (MPV.ok || !Ye) return;
  MPV.ok = 1;
  const eg = new v.EdgesGeometry(new v.BoxGeometry(1.006, 1.006, 1.006));
  MPV.line = new v.LineSegments(eg, new v.LineBasicMaterial({ color: 0x0b0f18, transparent: true, opacity: .8 }));
  MPV.ghost = new v.Mesh(new v.BoxGeometry(1, 1, 1), new v.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16, depthWrite: false }));
  MPV.crackT = [];
  for (let s = 0; s < 10; s++) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 32;
    const g = cv.getContext("2d"); g.strokeStyle = "rgba(0,0,0,.75)"; g.lineWidth = 1.4;
    let rnd = 1234 + s * 7; const R = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k <= s; k++) { g.beginPath(); let px = 16, py = 16; g.moveTo(px, py); for (let q2 = 0; q2 < 3 + s; q2++) { px += (R() - .5) * 12; py += (R() - .5) * 12; g.lineTo(px, py); } g.stroke(); }
    const tx = new v.CanvasTexture(cv); tx.magFilter = v.NearestFilter; tx.minFilter = v.NearestFilter; MPV.crackT.push(tx);
  }
  MPV.crack = new v.Mesh(new v.BoxGeometry(1.012, 1.012, 1.012), new v.MeshBasicMaterial({ map: MPV.crackT[0], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  for (const m of [MPV.line, MPV.ghost, MPV.crack]) { m.visible = false; m.renderOrder = 5; m.layers.set(1); Ye.add(m); }
};
const mpVisHide = () => { if (MPV.ok) MPV.line.visible = MPV.ghost.visible = MPV.crack.visible = false; };

// ── 팔레트 ──
const mpPalItem = i => BLD.pal[i];
BLD.selItem = () => mpPalItem(BLD.sel);
BLD.selBlock = () => { const it = BLD.selItem(); return it && MPI.blockOf[it] && mpHave(it) > 0 ? MPI.blockOf[it] : 0; };
MP.palOk = it => !!(it && (MPI.blockOf[it] || (MP.usable && MP.usable(it))));
BLD.hold = itemId => {
  if (!MP.palOk(itemId)) return;
  let i = BLD.pal.indexOf(itemId);
  if (i < 0) { i = BLD.pal[BLD.sel] && mpHave(BLD.pal[BLD.sel]) > 0 ? BLD.pal.findIndex(v => !v || mpHave(v) <= 0) : BLD.sel; if (i < 0) i = BLD.sel; BLD.pal[i] = itemId; }
  BLD.sel = i;
  if (mpInCity() || MP.inBuildZone?.()) BLD.toggle(true); else mpToast("🧱 " + mpNameOf(itemId) + " — 바깥 도시에서 " + (c.isTouch ? "짓기 버튼" : "X") + "로 놓아요", 2400);
  BLD.renderBar(); mpSave();
};
MP.onGain = (id, n) => {
  if (!MP.palOk(id) || BLD.pal.includes(id)) return;
  const i = BLD.pal.findIndex(v => !v || mpHave(v) <= 0);
  if (i >= 0) { BLD.pal[i] = id; BLD.renderBar(); }
};

mpCss("mp-build-css", `
#mpbar{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:12;display:none;gap:6px;align-items:center;pointer-events:auto}
body.mpbuild #mpbar{display:flex}
body.mpbuild #hotbar,body.mpbuild #wname{display:none!important}
#mpbar .ps{position:relative;width:52px;height:52px;border-radius:10px;border:2px solid rgba(255,255,255,.12);background:rgba(0,0,0,.34);display:grid;place-items:center;cursor:pointer;padding:0}
#mpbar .ps.on{border-color:#f0c46a;background:rgba(240,196,106,.12);box-shadow:0 0 0 2px #f0c46a,0 0 14px rgba(240,196,106,.35)}
#mpbar .ps img{width:38px;height:38px;image-rendering:auto;pointer-events:none}
#mpbar .ps i{font-style:normal;font-size:24px;pointer-events:none}
#mpbar .ps b{position:absolute;left:5px;top:2px;font:600 10px "IBM Plex Sans KR",sans-serif;color:#c9d2e4}
#mpbar .ps em{position:absolute;right:4px;bottom:1px;font:700 12px "IBM Plex Sans KR",sans-serif;font-style:normal;color:#fff;text-shadow:0 1px 2px #000}
#mpbar .ps.zero{opacity:.35}
#mpbar .px{width:44px;height:52px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(11,17,32,.82);color:#fff;font:600 11px "IBM Plex Sans KR",sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;padding:0}
#mpbar .px i{font-style:normal;font-size:18px}
#mpcross{position:fixed;left:50%;top:38%;width:30px;height:30px;margin:-15px 0 0 -15px;z-index:11;display:none;pointer-events:none}
body.mpbuild #mpcross{display:block}
body.mpbuild #cross{display:none!important}
#mpcross svg{width:30px;height:30px;filter:drop-shadow(0 0 2px rgba(0,0,0,.9))}
#mpmine{position:fixed;left:50%;top:calc(38% + 26px);transform:translateX(-50%);z-index:11;display:none;padding:3px 10px;border-radius:999px;background:rgba(22,30,46,.86);color:#fff;font:600 12px "IBM Plex Sans KR",sans-serif;pointer-events:none;white-space:nowrap}
#mpmine i{display:inline-block;width:60px;height:5px;border-radius:3px;background:rgba(255,255,255,.18);margin-left:6px;vertical-align:middle;overflow:hidden}
#mpmine i u{display:block;height:100%;background:#f5c542}
#mpbtnb{position:fixed;z-index:12;display:none;width:52px;height:52px;padding:0;border-radius:10px;border:2px solid rgba(240,196,106,.55);background:rgba(11,17,32,.82);color:#fff;font:700 11px "IBM Plex Sans KR",sans-serif;flex-direction:column;align-items:center;justify-content:center;gap:1px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.35)}
#mpbtnb i{font-style:normal;font-size:20px;line-height:1}
body.lout:not(.lbm):not(.mpbuild) #mpbtnb{display:flex}
@media (pointer:coarse){#mpbtnb{width:44px;height:44px}}
#mpbtnp{display:none}
body.mpbuild #mpbtnp{display:block}
body.mpbuild #tbtn button[data-k="fire"]{background:rgba(245,197,66,.85);color:#1b1f27}
@media (pointer:coarse){#mpbar .ps{width:44px;height:44px}#mpbar .ps img{width:32px;height:32px}#mpbar .ps:nth-child(n+8){display:none}#mpbar .px{width:40px;height:44px}}
`);
const mpBar = mpEl("div", { id: "mpbar", class: "hud" });
const mpCross = mpEl("div", { id: "mpcross" }, '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M15 6v7M15 17v7M6 15h7M17 15h7" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="15" cy="15" r="1.6" fill="#f5c542"/></svg>');
const mpMine = mpEl("div", { id: "mpmine" });
document.body.append(mpBar, mpCross, mpMine);
BLD.renderBar = () => {
  if (!BLD.on) return;
  let h = "";
  for (let i = 0; i < 10; i++) {
    const it = BLD.pal[i], n = it ? mpHave(it) : 0, bid = it && MPI.blockOf[it];
    const ico = bid ? MP.blockIcon(bid, 38) : "";
    h += `<button class="ps${i === BLD.sel ? " on" : ""}${it && !n ? " zero" : ""}" data-mp="pal:${i}" aria-label="${it ? ae(mpNameOf(it)) + " " + n + "개" : "빈 칸"}"><b>${(i + 1) % 10}</b>${it ? (ico ? `<img src="${ico}" alt="">` : `<i>${mpIconOf(it)}</i>`) : ""}${it && n ? `<em>${n}</em>` : ""}</button>`;
  }
  h += `<button class="px" data-mp="pick" aria-label="블록 고르기"><i>🧱</i>고르기</button><button class="px" data-mp="craft" aria-label="제작"><i>🔨</i>제작</button><button class="px" data-mp="build" aria-label="짓기 끄기"><i>✕</i>${c.isTouch ? "끄기" : "끄기 X"}</button>`;
  mpBar.innerHTML = h;
};
MP.click.pal = v => { BLD.sel = +v || 0; BLD.renderBar(); };
MP.click.pick = () => BLD.pickOpen();
MP.click.craft = () => MP.craft && MP.craft.open();

// 블록 고르기 창
BLD.pickOpen = () => {
  const L = Object.keys(c.MI || {}).filter(k => MP.palOk(k) && mpHave(k) > 0).sort((a, b) => (MPI.blockOf[b] ? 0 : 1) - (MPI.blockOf[a] ? 0 : 1) || mpHave(b) - mpHave(a));
  const rows = L.length ? L.map(k => `<button class="mprow" style="cursor:pointer;width:100%;text-align:left;color:#fff" data-mp="pickset:${k}"><span class="ic">${MPI.blockOf[k] ? `<img src="${MP.blockIcon(MPI.blockOf[k], 30)}" alt="" style="width:30px;height:30px">` : mpIconOf(k)}</span><span class="tx"><b>${ae(mpNameOf(k))}</b><span class="mpsub">${mpHave(k)}개 · ${BLD.pal.includes(k) ? (BLD.pal.indexOf(k) + 1) % 10 + "번 칸에 있어요" : "누르면 " + ((BLD.sel + 1) % 10) + "번 칸에 넣어요"}</span></span></button>`).join("")
    : `<div class="mpnote">가방에 블록이 없어요. 바깥 도시에서 블록을 캐거나(${c.isTouch ? "캐기 버튼 꾹" : "좌클릭 꾹"}) 무기로 건물을 부수면 블록이 떨어져요. 작업대에서 판자 · 돌 같은 블록을 만들 수도 있어요.</div>`;
  Br(`<h2>🧱 블록 고르기</h2><div class="mpnote">지금 고른 칸: <b>${(BLD.sel + 1) % 10}번</b> · 블록을 누르면 그 칸에 넣어요</div><div class="mplist">${rows}</div>`);
};
MP.click.pickset = k => { BLD.pal[BLD.sel] = k; Fi(); try { c.lockPointer?.(); } catch (e) {} BLD.renderBar(); mpSave(); };

// ── 켜고 끄기 ──
BLD.can = () => mpInCity() || !!(MP.inBuildZone && MP.inBuildZone());
BLD.toggle = on => {
  on = on == null ? !BLD.on : !!on;
  if (on && !BLD.can()) { mpToast("🧱 짓기는 교문 밖 바깥 도시에서 할 수 있어요", 2200); return; }
  if (on && c.bm) return;
  BLD.on = on; BLD.mining = BLD.placing = false; BLD.prog = 0;
  document.body.classList.toggle("mpbuild", on);
  const fire = document.querySelector('#tbtn button[data-k="fire"]');
  if (fire) { if (on) { fire.dataset.mpOld = fire.dataset.mpOld || fire.textContent; fire.textContent = "캐기"; } else if (fire.dataset.mpOld) fire.textContent = fire.dataset.mpOld; }
  if (on) {
    mpVisInit();
    if (!BLD.gift) {
      BLD.gift = 1;
      xM("wooden_pickaxe", 1, 1); xM("wooden_axe", 1, 1); xM("oak_planks", 16, 1); xM("crafting_table", 1, 1);
      for (const k of ["oak_planks", "crafting_table"]) if (!BLD.pal.includes(k)) { const i = BLD.pal.findIndex(v => !v); if (i >= 0) BLD.pal[i] = k; }
      setTimeout(() => mpToast("🎁 짓기 첫 선물! 나무 곡괭이 · 나무 도끼 · 판자 16개 · 작업대", 3600), 400);
    }
    if (!BLD.tip) { BLD.tip = 1; setTimeout(() => mpToast(c.isTouch ? "🧱 짓기 모드 · 캐기 버튼 꾹: 캐기 · 놓기 버튼: 놓기 · 아래 칸으로 블록 고르기" : "🧱 짓기 모드 · 좌클릭 꾹: 캐기 · 우클릭: 놓기 · 1~0: 블록 고르기 · X: 끄기", 4200), 1600); }
    q("click");
  } else { mpVisHide(); if (MPH.m) MPH.m.visible = false; }
  mpMine.style.display = "none";
  BLD.renderBar();
  try { La(); } catch (e) {}
};
MP.click.build = () => BLD.toggle();

// 휴대폰 버튼: 짓기 · 놓기
{
  const tb = document.getElementById("tbtn");
  if (tb) {
    const bP = mpEl("button", { id: "mpbtnp", "data-k": "mpp", type: "button", class: "fire" }, "놓기");
    tb.append(bP);
    bP.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); BLD.placing = true; BLD.lastPlace = 0; });
    const up = () => { BLD.placing = false; };
    bP.addEventListener("pointerup", up); bP.addEventListener("pointercancel", up); bP.addEventListener("pointerleave", up);
    const fire = tb.querySelector('button[data-k="fire"]');
    if (fire) {
      fire.addEventListener("pointerdown", () => { if (BLD.on) BLD.mining = true; });
      const st = () => { BLD.mining = false; };
      fire.addEventListener("pointerup", st); fire.addEventListener("pointercancel", st); fire.addEventListener("pointerleave", st);
    }
  }
}
// 짓기 켜기 버튼 (핫바 오른쪽)
const mpBtnB = mpEl("button", { id: "mpbtnb", type: "button", "aria-label": "짓기 모드 켜기" }, '<i>🧱</i><span>짓기</span>');
document.body.append(mpBtnB);
mpBtnB.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); BLD.toggle(true); });
BLD.placeBtn = () => {
  const hb = document.getElementById("hotbar"); if (!hb) return;
  const r = hb.getBoundingClientRect();
  if (r.width) { mpBtnB.style.left = Math.min(innerWidth - 60, r.right + 8) + "px"; mpBtnB.style.top = (r.top + (r.height - 52) / 2) + "px"; }
};
// 마우스
Io.addEventListener("pointerdown", e => {
  if (!BLD.on || e.pointerType === "touch" || mpBusy()) return;
  if (e.button === 0) BLD.mining = true;
  else if (e.button === 2) { BLD.placing = true; BLD.lastPlace = 0; }
});
addEventListener("pointerup", e => { if (e.pointerType === "touch") return; if (e.button === 0) BLD.mining = false; if (e.button === 2) BLD.placing = false; });
// 키보드 (본체보다 먼저 받아요)
addEventListener("keydown", e => {
  const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
  if (!c.run || c.menuOn || c.invOn || c.dg) return;
  if (e.code === "KeyX" && !e.repeat && !c.bm && !e.ctrlKey && !e.metaKey) {
    if (BLD.on || BLD.can()) { e.stopPropagation(); e.preventDefault(); BLD.toggle(); }
    return;
  }
  if (!BLD.on) return;
  const d = /^Digit(\d)$/.exec(e.code);
  if (d) { e.stopPropagation(); BLD.sel = (+d[1] + 9) % 10; BLD.renderBar(); return; }
  if (e.code === "KeyQ" && !e.repeat) { e.stopPropagation(); BLD.sel = (BLD.sel + 1) % 10; BLD.renderBar(); }
}, true);
// 짓기 모드에서는 무기를 쏘지 않아요
{ const orig = wg; wg = function () { if (BLD.on) return; return orig.apply(this, arguments); }; }

// ── 캐기 ──
BLD.mineTime = (bid, quiet) => {
  const b = Kt[bid]; if (!b) return 1e9;
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
  if (b.mc === "oak_leaves") return tool && tool.kind === "shears" ? ["oak_leaves", 1] : O() < .25 ? ["stick", 1] : O() < .12 ? ["oak_sapling", 1] : null;
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
BLD.placeAt = (tg, bid) => {
  const x = tg.px, yy = tg.py, z = tg.pz, P = c.P;
  if (yy < 0 || yy >= ws - 1) return mpToast("너무 높거나 낮아요", 1200), false;
  if (!ia(x + .5, z + .5) && !MP.inBuildZone?.()) return mpToast("🏫 학교 안에는 놓을 수 없어요", 1400), false;
  if (Hr(x, yy, z)) return false;
  const ph = c.ph || 1.9;
  const body = !Kt[bid].door && x < P.x + .3 && x + 1 > P.x - .3 && z < P.z + .3 && z + 1 > P.z - .3 && yy < P.y + ph - .05 && yy + 1 > P.y + .02;
  if (body) return mpToast("몸이 있는 자리에는 못 놓아요", 1000), false;
  if (MP.canPlaceHere && !MP.canPlaceHere(x, yy, z, bid)) return false;
  const mx = Math.round((BLD.MAX + (MP.lot ? MP.lot.mine.length * 30000 : 0)) * (MP.heroMul ? MP.heroMul("blocks") : 1));
  if (BLD.count >= mx) return mpToast("놓은 블록이 너무 많아요 (" + mx.toLocaleString() + "개) — 내 땅을 사면 더 놓을 수 있어요", 2400), false;
  BLD.setBlock(x, yy, z, bid);
  mpNet("mp", [x, yy, z, bid]);
  try { Lt(mpStepSnd(Kt[bid]), 0, .8); } catch (e) {}
  MP.onPlace && MP.onPlace(x, yy, z, bid);
  return true;
};

// 무기로 부순 블록은 예전처럼 코인으로 (짓기 모드에서 터진 TNT만 블록으로 떨어져요)
MP.boomCoins = 0;
{
  const orig = L_;
  L_ = function (id, n) {
    const k = ji[id] && ji[id][2];
    if (!MP._myDrop && !BLD.on && (k === "blk" || k === "r" || k === "t")) { MP.boomCoins += (+ji[id][3] || 1) * (n | 0 || 1); return; }
    return orig.apply(this, arguments);
  };
}
// 1인칭 손에 든 블록
const MPH = {};
const mpTileTex = tile => {
  MPH.tex = MPH.tex || {};
  if (MPH.tex[tile]) return MPH.tex[tile];
  const at = MP.atlas; if (!at) return null;
  const t = at.width / 16, cv = document.createElement("canvas"); cv.width = cv.height = 32;
  cv.getContext("2d").drawImage(at, (tile % 16) * t, (tile >> 4) * t, t, t, 0, 0, 32, 32);
  const tx = new v.CanvasTexture(cv); tx.colorSpace = v.SRGBColorSpace; return (MPH.tex[tile] = tx);
};
const mpHeld = () => {
  const show = BLD.on && c.fp && Wi.root && Wi.root.visible;
  const bid = show ? BLD.selBlock() : 0;
  if (!MPH.m && bid && Wi.root) {
    MPH.m = new v.Mesh(new v.BoxGeometry(.17, .17, .17), Array.from({ length: 6 }, () => new v.MeshBasicMaterial({ transparent: true, depthWrite: true })));
    MPH.m.position.set(.27, -.25, -.46); MPH.m.rotation.set(.35, .65, 0); MPH.m.renderOrder = 999; MPH.m.frustumCulled = false;
    Wi.root.add(MPH.m);
  }
  if (!MPH.m) return;
  MPH.m.visible = !!bid;
  if (bid && MPH.bid !== bid) {
    MPH.bid = bid; const b = Kt[bid];
    const shade = [.82, .82, 1, .6, .7, .7];
    MPH.m.material.forEach((m, i) => { const tile = i === 2 || i === 3 ? (b.tt ?? b.t) : b.t; m.map = mpTileTex(tile); const k = b.k || [255, 255, 255]; m.color.setRGB(k[0] / 255 * shade[i], k[1] / 255 * shade[i], k[2] / 255 * shade[i]); m.needsUpdate = true; });
  }
  if (MPH.m.visible) { const sw = BLD.mining ? Math.sin(mpNow() / 70) * .06 : 0; MPH.m.position.y = -.25 + sw; MPH.m.rotation.x = .35 + sw * 2; }
};
{ const orig = _9; _9 = function () { const r = orig.apply(this, arguments); try { if (BLD.on && Wi.wm) for (const k in Wi.wm) Wi.wm[k].visible = false; mpHeld(); if (Wi.root && MP.hideFP && MP.hideFP()) Wi.root.visible = false; } catch (e) {} return r; }; }

// 매 프레임
const mpBuildTick = dt => {
  if ((BLD.btnT = (BLD.btnT || 0) - dt) <= 0) { BLD.btnT = .5; BLD.placeBtn(); }
  if (MP.boomCoins > 0) { const n = Math.round(MP.boomCoins); MP.boomCoins = 0; if (n > 0) Pt(n, 1); }
  if (BLD.on) { for (const k in c.WM || {}) c.WM[k].visible = false; const top = ((c.aimY || .38) * 100) + "%"; if (mpCross.style.top !== top) { mpCross.style.top = top; mpMine.style.top = "calc(" + top + " + 26px)"; } }
  if (BLD.on && (!BLD.can() || c.bm)) BLD.toggle(false);
  // 떠 있는 아이템을 끌어당겨요 (가까우면)
  if (S.out && typeof an !== "undefined" && an.length) {
    const P = c.P;
    for (const it of an) { const dx = P.x - it.x, dz = P.z - it.z, d = Math.hypot(dx, dz); if (d < 3.2 && d > .2 && Math.abs(P.y + .5 - it.y) < 2.6) { const k = Math.min(1, dt * 7); it.x += dx * k; it.z += dz * k; it.y += (P.y + .6 - it.y) * k * .6; } }
  }
  if (!BLD.on) return;
  Ne.hold = 0;
  if (mpBusy()) { mpVisHide(); mpMine.style.display = "none"; return; }
  const tg = BLD.ray();
  BLD.tgt = tg;
  const sel = BLD.selBlock();
  if (!tg) { mpVisHide(); BLD.prog = 0; BLD.mineKey = ""; mpMine.style.display = "none"; }
  else {
    if (tg.ground) MPV.line.position.set(tg.px + .5, tg.py + .5, tg.pz + .5); else MPV.line.position.set(tg.x + .5, tg.y + .5, tg.z + .5);
    MPV.line.visible = !tg.ground || !!sel;
    const free = !Hr(tg.px, tg.py, tg.pz);
    MPV.ghost.visible = !!sel && free && !BLD.mining;
    if (MPV.ghost.visible) MPV.ghost.position.set(tg.px + .5, tg.py + .5, tg.pz + .5);
  }
  // 캐기
  if (BLD.mining && tg && !tg.ground && MP.canMineHere && !MP.canMineHere(tg)) { BLD.mining = false; }
  if (BLD.mining && tg && !tg.ground) {
    const key = tg.x + "," + tg.y + "," + tg.z;
    if (key !== BLD.mineKey) { BLD.mineKey = key; BLD.prog = 0; }
    const tm = BLD.mineTime(tg.id);
    if (tm.t >= 1e8) {
      MPV.crack.visible = false;
      mpMine.style.display = "block"; mpMine.innerHTML = tm.need >= 4 ? "⛏️ 다이아몬드 곡괭이가 있어야 캘 수 있어요" : "⛏️ 더 좋은 곡괭이가 필요해요 (" + ["", "나무", "돌", "철", "다이아몬드"][tm.need] + " 이상)";
    } else if (mpNow() - BLD.lastBreak > 180) {
      BLD.prog += dt / tm.t;
      if ((BLD.hitSnd -= dt) <= 0) { BLD.hitSnd = .24; try { Lt(mpStepSnd(Kt[tg.id]), 0, .9); } catch (e) {} }
      const st = Math.min(9, Math.floor(BLD.prog * 10));
      MPV.crack.material.map = MPV.crackT[st]; MPV.crack.position.copy(MPV.line.position); MPV.crack.visible = true;
      mpMine.style.display = "block";
      mpMine.innerHTML = (tm.tool ? mpIconOf(tm.tool.id) + " " + ae(mpNameOf(tm.tool.id)) : "✋ 맨손") + `<i><u style="width:${Math.round(Math.min(1, BLD.prog) * 100)}%"></u></i>`;
      if (BLD.prog >= 1) { BLD.breakAt(tg); BLD.prog = 0; BLD.mineKey = ""; BLD.lastBreak = mpNow(); MPV.crack.visible = false; }
    }
  } else { BLD.prog = 0; BLD.mineKey = ""; MPV.crack && (MPV.crack.visible = false); if (!BLD.mining) mpMine.style.display = "none"; }
  // 놓기 (꾹 누르면 0.22초마다)
  if (BLD.placing && tg && mpNow() - BLD.lastPlace > (BLD.placeGap || 220)) {
    const first = !BLD.lastPlace;
    BLD.lastPlace = mpNow();
    const it = BLD.selItem();
    if (first && MP.useOn && MP.useOn(tg, it)) { BLD.placing = false; /* 작업대 · 화로 · 상자 열기 */ }
    else if (it && !MPI.blockOf[it] && mpHave(it) > 0 && MP.useItem) { if (!MP.useItem(tg, it)) BLD.placing = false; BLD.renderBar(); mpSave(); }
    else if (!it || !sel) { mpToast(it ? mpNameOf(it) + "이(가) 다 떨어졌어요" : "놓을 블록을 아래 칸에서 골라요", 1400); BLD.placing = false; }
    else if (BLD.placeAt(tg, sel)) { mpTake(it, 1); BLD.renderBar(); mpSave(); }
  }
  // 팔레트 숫자 갱신
  if ((BLD.barT = (BLD.barT || 0) - dt) <= 0) { BLD.barT = .5; BLD.renderBar(); }
};

// ── 같은 방 친구와 맞추기 ──
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

// ── 저장 ──
const mpSaveB = e => {
  const put = {};
  for (const [key, mm] of BLD.put) { if (!mm.size) continue; const a = []; for (const [li, id] of mm) a.push(li, id); put[key] = a; }
  e.mpb = { v: 1, pal: BLD.pal, sel: BLD.sel, put, gift: BLD.gift, tip: BLD.tip ? 1 : 0 };
};
const mpLoadB = e => {
  const d = e && e.mpb;
  BLD.put = new Map(); BLD.count = 0;
  if (d && typeof d === "object") {
    if (Array.isArray(d.pal)) BLD.pal = Array.from({ length: 10 }, (_, i) => (typeof d.pal[i] === "string" && MP.palOk(d.pal[i]) ? d.pal[i] : null));
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
  id: "mp_build", name: "짓기 (블록 놓기 · 캐기)", need: ["voxel", "boom", "itemdrop", "inv", "collide"],
  gives: "MP.build — toggle(켜기) · setBlock(x,y,z,id) · ray() 조준 블록 · put 내가 놓은 블록 · 팔레트 10칸",
  chunkGen: mpChunkGen, grid: mpGrid, tick: mpBuildTick, net: mpNetRx, peerIn: mpPeerIn,
  save: mpSaveB, load: mpLoadB,
  newGame: () => { BLD.put = new Map(); BLD.rput = new Map(); BLD.count = 0; BLD.pal = Array(10).fill(null); BLD.gift = 0; },
  dbg: { MPB: BLD },
});
