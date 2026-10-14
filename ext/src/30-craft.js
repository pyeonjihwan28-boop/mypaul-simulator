/* ───────────── 제작 · 화로 · 상자 ─────────────
   제작은 어디서나 모든 레시피 (블록폰 🔨 제작 앱 · 가방 '제작 열기') · 굽기는 제작 창의 🔥 굽기 (휴대용 화로)
   짓기가 없어져서(V119) 놓는 데만 쓰던 레시피(작업대 · 가구 · 장식 블록 · 레드스톤 · 도끼 · 삽 · 괭이 …)는 목록에서 숨겨요
   예전에 놓아 둔 작업대 · 화로 · 상자는 가까이서 F로 그대로 써요 */

const MP_PLANKS = ["oak_planks", "spruce_planks", "birch_planks", "dark_oak_planks"];
const MP_LOGS = ["oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log"];
const MP_STONES = ["cobblestone", "cobbled_deepslate", "blackstone"];
const MP_COLORS = { yellow_dye: "yellow", red_dye: "red", green_dye: "green", blue_dye: "blue", black_dye: "black", white_dye: "white" };
for (const [id, nm, ic] of [["red_dye", "빨간색 염료", "🔴"], ["blue_dye", "파란색 염료", "🔵"], ["black_dye", "검은색 염료", "⚫"], ["white_dye", "하얀색 염료", "⚪"]]) ji[id] = [nm, ic, "r", 2];
const MPG = { "#판자": MP_PLANKS, "#원목": MP_LOGS, "#돌": MP_STONES, "#석탄": ["coal", "charcoal"], "#양털": Object.keys(ji).filter(k => /_wool$/.test(k)) };
const MPG_NAME = { "#판자": "판자 (아무거나)", "#원목": "원목 (아무거나)", "#돌": "조약돌 (아무거나)", "#석탄": "석탄 · 숯", "#양털": "양털 (아무 색)" };

const MPR = []; // {o:[id,n], i:[[id,n]...], at, cat, t}
const R = (o, n, i, at, cat, t) => MPR.push({ o: [o, n], i, at, cat, t });
// 손 (2×2)
R("oak_planks", 4, [["oak_log", 1]], "hand", "블록");
R("spruce_planks", 4, [["spruce_log", 1]], "hand", "블록");
R("birch_planks", 4, [["birch_log", 1]], "hand", "블록");
R("dark_oak_planks", 4, [["dark_oak_log", 1]], "hand", "블록");
for (const l of ["jungle_log", "acacia_log", "mangrove_log"]) R("oak_planks", 4, [[l, 1]], "hand", "블록");
R("stick", 4, [["#판자", 2]], "hand", "재료");
R("crafting_table", 1, [["#판자", 4]], "hand", "블록");
R("sandstone", 1, [["sand", 4]], "hand", "블록");
R("cut_sandstone", 4, [["sandstone", 4]], "hand", "블록");
R("stone_bricks", 4, [["stone", 4]], "hand", "블록");
R("white_wool", 1, [["string", 4]], "hand", "블록");
R("glowstone", 1, [["glowstone_dust", 4]], "hand", "블록");
R("snow_block", 1, [["snowball", 4]], "hand", "블록");
R("bricks", 1, [["brick", 4]], "hand", "블록");
R("iron_ingot", 9, [["iron_block", 1]], "hand", "재료");
R("gold_ingot", 9, [["gold_block", 1]], "hand", "재료");
R("iron_ingot", 1, [["iron_nugget", 9]], "hand", "재료");
R("gold_ingot", 1, [["gold_nugget", 9]], "hand", "재료");
R("torch_b", 4, [["#석탄", 1], ["stick", 1]], "hand", "블록");
R("flint_and_steel", 1, [["iron_ingot", 1], ["flint", 1]], "hand", "도구");
R("book", 1, [["paper", 3], ["leather", 1]], "hand", "재료");
R("flint", 1, [["gravel", 3]], "hand", "재료");
R("wheat", 9, [["hay_block", 1]], "hand", "재료");
R("yellow_dye", 1, [["dandelion", 1]], "hand", "재료");
R("red_dye", 1, [["poppy", 1]], "hand", "재료");
R("blue_dye", 1, [["lapis_lazuli", 1]], "hand", "재료");
R("black_dye", 1, [["coal", 1]], "hand", "재료");
R("white_dye", 2, [["bone", 1]], "hand", "재료");
R("redstone_torch", 1, [["redstone", 1], ["stick", 1]], "hand", "재료");
// 작업대 (3×3)
R("furnace", 1, [["#돌", 8]], "table", "블록");
R("chest", 1, [["#판자", 8]], "table", "블록");
for (const [tn, mat] of [["wooden", "#판자"], ["stone", "#돌"], ["iron", "iron_ingot"], ["golden", "gold_ingot"], ["diamond", "diamond"]]) {
  R(tn + "_pickaxe", 1, [[mat, 3], ["stick", 2]], "table", "도구");
  R(tn + "_axe", 1, [[mat, 3], ["stick", 2]], "table", "도구");
  R(tn + "_shovel", 1, [[mat, 1], ["stick", 2]], "table", "도구");
  R(tn + "_hoe", 1, [[mat, 2], ["stick", 2]], "table", "도구");
}
R("shears", 1, [["iron_ingot", 2]], "table", "도구");
R("bucket", 1, [["iron_ingot", 3]], "table", "도구");
R("iron_block", 1, [["iron_ingot", 9]], "table", "블록");
R("gold_block", 1, [["gold_ingot", 9]], "table", "블록");
R("tnt_b", 1, [["gunpowder", 5], ["sand", 4]], "table", "블록");
R("bookshelf", 1, [["#판자", 6], ["book", 3]], "table", "블록");
R("iron_bars", 16, [["iron_ingot", 6]], "table", "블록");
R("oak_fence", 3, [["#판자", 4], ["stick", 2]], "table", "블록");
R("oak_door", 3, [["#판자", 6]], "table", "블록");
R("iron_door", 3, [["iron_ingot", 6]], "table", "블록");
R("white_concrete", 8, [["sand", 4], ["gravel", 4]], "table", "블록");
R("paper", 3, [["bamboo", 3]], "table", "재료");
R("red_bed", 1, [["#양털", 3], ["#판자", 3]], "table", "블록");
R("redstone_lamp", 1, [["redstone", 4], ["glowstone", 1]], "table", "블록");
R("lever", 1, [["stick", 1], ["#돌", 1]], "table", "블록");
R("redstone_wire", 4, [["redstone", 1]], "table", "블록");
R("piston", 1, [["#판자", 3], ["#돌", 4], ["iron_ingot", 1], ["redstone", 1]], "table", "블록");
R("stone_pressure_plate", 1, [["stone", 2]], "table", "블록");
R("ender_eye", 1, [["prismarine_crystals", 2], ["glowstone_dust", 2]], "table", "재료");
R("rail", 16, [["iron_ingot", 6], ["stick", 1]], "table", "재료");
for (const [dye, col] of Object.entries(MP_COLORS)) {
  if (col === "white") continue;
  if (ji[col + "_wool"]) R(col + "_wool", 8, [["white_wool", 8], [dye, 1]], "table", "블록");
  if (ji[col + "_concrete"]) R(col + "_concrete", 8, [["white_concrete", 8], [dye, 1]], "table", "블록");
}
// 화로 (초)
const F = (o, i, t, n) => R(o, n || 1, [[i, 1]], "furnace", "굽기", t || 4);
F("glass", "sand"); F("stone", "cobblestone"); F("smooth_stone", "stone"); F("brick", "clay_ball");
F("iron_ingot", "raw_iron", 5); F("gold_ingot", "raw_gold", 5); F("copper_ingot", "raw_copper", 5);
for (const l of MP_LOGS) F("charcoal", l, 4);
F("green_dye", "cactus"); F("deepslate", "cobbled_deepslate"); F("nether_bricks", "netherrack"); F("terracotta", "clay_ball", 5);
MP.recipes = MPR;
// 짓기가 없어서 쓸 데 없는 결과물은 목록에서 숨겨요 (TNT는 한탕 도구라 남겨요)
const CR_HIDE = new Set(["crafting_table", "furnace", "chest", "bookshelf", "red_bed", "redstone_lamp", "lever", "redstone_wire", "piston", "stone_pressure_plate", "redstone_torch", "torch_b", "shears",
  "glass", "stone", "smooth_stone", "brick", "deepslate", "nether_bricks", "terracotta", "red_dye", "blue_dye", "black_dye", "yellow_dye", "green_dye"]);
const crShown = r => {
  const o = r.o[0], k = ji[o] && ji[o][2];
  if (o === "tnt_b") return true;
  if (CR_HIDE.has(o) || /_(wool|concrete|axe|shovel|hoe)$/.test(o)) return false;
  return k !== "blk";
};
for (const r of MPR) if (r.o[0] === "tnt_b") r.cat = "도구";

const MP_FUEL = { coal: 8, charcoal: 8, stick: .5, crafting_table: 1.5, bookshelf: 1.5 };
for (const p of MP_PLANKS) MP_FUEL[p] = 1.5;
for (const l of MP_LOGS) MP_FUEL[l] = 1.5;

// 재료 갖고 있는 수 (묶음은 다 더해요)
const mpHaveG = id => (MPG[id] ? MPG[id].reduce((s, k) => s + mpHave(k), 0) : mpHave(id));
const mpTakeG = (id, n) => {
  if (!MPG[id]) return mpTake(id, n);
  const list = MPG[id].slice().sort((a, b) => mpHave(b) - mpHave(a));
  for (const k of list) { const t = Math.min(n, mpHave(k)); if (t > 0) { mpTake(k, t); n -= t; } if (!n) break; }
  return n === 0;
};
const mpCanTimes = r => Math.min(...r.i.map(([id, n]) => Math.floor(mpHaveG(id) / n)));

// 작업대 · 화로 · 상자가 가까이 있나
const MPS = { table: MPI.newBlocks.crafting_table, furnace: MPI.newBlocks.furnace, chest: MPI.newBlocks.chest };
const mpFind = (bid, rad) => {
  const P = c.P, x0 = Math.floor(P.x), y0 = Math.floor(P.y), z0 = Math.floor(P.z);
  let best = null, bd = 1e9;
  for (let dx = -rad; dx <= rad; dx++) for (let dy = -2; dy <= 3; dy++) for (let dz = -rad; dz <= rad; dz++) {
    if (Hr(x0 + dx, y0 + dy, z0 + dz) !== bid) continue;
    const d = Math.hypot(dx, dy * .8, dz);
    if (d < bd) { bd = d; best = { x: x0 + dx, y: y0 + dy, z: z0 + dz, d }; }
  }
  return best;
};

const CR = (MP.craft = { tab: "can" });
CR.icon = id => { const bid = MPI.blockOf[id]; const ic = bid && MP.blockIcon(bid, 30); return ic ? `<img src="${ic}" alt="" style="width:30px;height:30px">` : mpIconOf(id); };
CR.open = () => {
  if (c.bm || c.pvLock) return;
  if (CR.tab === "fur") CR.tab = "can";
  CR.render();
};
CR.render = () => {
  const L = MPR.filter(r => r.at !== "furnace" && crShown(r)).filter(r => CR.tab === "can" ? mpCanTimes(r) > 0 : CR.tab === "all" ? true : r.cat === CR.tab);
  const rows = L.map(r => {
    const idx = MPR.indexOf(r), can = mpCanTimes(r);
    const chips = r.i.map(([id, n]) => { const h = mpHaveG(id); return `<span class="mpchip ${h >= n ? "ok" : "no"}">${MPG[id] ? "" : mpIconOf(id) + " "}${ae(MPG_NAME[id] || mpNameOf(id))} ${h}/${n}</span>`; }).join(" ");
    return `<div class="mprow"><span class="ic">${CR.icon(r.o[0])}</span><span class="tx"><b>${ae(mpNameOf(r.o[0]))}${r.o[1] > 1 ? " ×" + r.o[1] : ""}</b><span>${chips}</span></span><span class="bt"><button class="mpbtn pri" data-mp="cr:${idx}:1"${can ? "" : " disabled"}>만들기</button>${can > 1 ? `<button class="mpbtn" data-mp="cr:${idx}:${Math.min(can, 64)}">×${Math.min(can, 64)}</button>` : ""}</span></div>`;
  }).join("") || `<div class="mpnote">${CR.tab === "can" ? "지금 가진 재료로 만들 수 있는 게 없어요. '전부'에서 무엇이 필요한지 봐요." : "없어요"}</div>`;
  const tabs = [["can", "만들 수 있는 것"], ["도구", "도구"], ["재료", "재료"], ["fur", "🔥 굽기"], ["all", "전부"]].map(([k, n]) => `<button class="${CR.tab === k ? "on" : ""}" data-mp="crtab:${k}">${n}</button>`).join("");
  Br(`<i data-view="mpcraft" hidden></i><h2>🔨 제작</h2><div class="mpnote">어디서나 모든 레시피를 만들 수 있어요 · 원석 · 모래는 🔥 굽기에서 구워요</div><div class="mptabs">${tabs}</div><div class="mplist">${rows}</div>`, "mpcw");
};
MP.click.crtab = k => { if (k === "fur") { FUR.open("bag"); return; } CR.tab = k; CR.render(); };
MP.click.craft = () => CR.open();
MP.click.cr = v => {
  const [idx, times] = v.split(":").map(Number), r = MPR[idx]; if (!r) return;
  let made = 0;
  for (let t = 0; t < (times || 1); t++) {
    if (mpCanTimes(r) < 1) break;
    for (const [id, n] of r.i) mpTakeG(id, n);
    made++;
  }
  if (made) {
    const [o, n] = r.o;
    xM(o, n * made, 1);
    try { Lt("anvil", 0, 1.4); } catch (e) {}
    mpToast("🔨 " + mpIconOf(o) + " " + mpNameOf(o) + " ×" + n * made + " 만들었어요", 1600);
    MP.onCraft && MP.onCraft(o, n * made);
    mpSave();
  }
  CR.render();
};

// ── 화로 ──
const FUR = (MP.furnace = { st: {}, cur: "" });
const mpFKey = (x, yy, z) => x + "," + yy + "," + z;
FUR.prog = s => { if (!s) return 0; return Math.min(s.n, Math.floor((Date.now() - s.t0) / 1000 / s.per)); };
FUR.fuelUnits = () => Object.entries(MP_FUEL).reduce((a, [k, v]) => a + mpHave(k) * v, 0);
FUR.useFuel = need => {
  const order = Object.entries(MP_FUEL).sort((a, b) => b[1] - a[1]);
  let units = 0;
  for (const [k, v] of order) while (units < need && mpHave(k) > 0) { mpTake(k, 1); units += v; }
  return units >= need;
};
FUR.open = (x, yy, z) => { FUR.cur = x === "bag" ? "bag" : mpFKey(x, yy, z); FUR.render(); };   // "bag" = 휴대용 화로 (제작 창의 🔥 굽기)
FUR.render = () => {
  const s = FUR.st[FUR.cur], p = FUR.prog(s);
  const smelt = MPR.filter(r => r.at === "furnace" && crShown(r));
  let job = `<div class="mpnote">비어 있어요 · 아래에서 구울 것을 넣어요 (연료는 가방에서 알아서 써요)</div>`;
  if (s) {
    const left = Math.max(0, Math.ceil((s.n - p) * s.per - ((Date.now() - s.t0) / 1000 - p * s.per)));
    const can = p - (s.got | 0);
    job = `<div class="mprow"><span class="ic">${CR.icon(s.out)}</span><span class="tx"><b>${ae(mpNameOf(s.inp))} → ${ae(mpNameOf(s.out))}</b><span class="mpsub">${p} / ${s.n} 완료${p < s.n ? " · 남은 시간 " + left + "초" : " · 다 구웠어요!"}</span></span><span class="bt"><button class="mpbtn pri" data-mp="fget:1"${can > 0 ? "" : " disabled"}>꺼내기${can > 0 ? " ×" + can : ""}</button></span></div>`;
  }
  const rows = smelt.map(r => {
    const id = r.i[0][0], h = mpHave(id); if (!h) return "";
    const idx = MPR.indexOf(r);
    return `<div class="mprow"><span class="ic">${CR.icon(id)}</span><span class="tx"><b>${ae(mpNameOf(id))} → ${ae(mpNameOf(r.o[0]))}</b><span class="mpsub">가진 것 ${h}개 · 하나에 ${r.t}초</span></span><span class="bt"><button class="mpbtn" data-mp="fput:${idx}:1">×1</button>${h > 1 ? `<button class="mpbtn" data-mp="fput:${idx}:${Math.min(h, 8)}">×${Math.min(h, 8)}</button>` : ""}${h > 8 ? `<button class="mpbtn pri" data-mp="fput:${idx}:${Math.min(h, 64)}">×${Math.min(h, 64)}</button>` : ""}</span></div>`;
  }).join("") || `<div class="mpnote">구울 수 있는 게 가방에 없어요 — 폐광에서 캔 원석(철 · 금 · 구리)이나 원목을 넣어요</div>`;
  const back = FUR.cur === "bag" ? `<div class="mptabs"><button data-mp="crtab:can">🔨 제작으로</button><button class="on" data-mp="crtab:fur">🔥 굽기</button></div>` : "";
  Br(`<i data-view="mpfur" hidden></i><h2>🔥 ${FUR.cur === "bag" ? "굽기 (휴대용 화로)" : "화로"}</h2>${back}${job}<div class="mpnote">연료: 석탄 · 숯 (8개씩) · 판자 · 원목 (1.5개씩) · 막대기 · 지금 가진 연료로 <b>${Math.floor(FUR.fuelUnits())}개</b> 구울 수 있어요</div><div class="mplist">${rows}</div>`, "mpfw");
};
MP.click.fput = v => {
  const [idx, n0] = v.split(":").map(Number), r = MPR[idx]; if (!r) return;
  let s = FUR.st[FUR.cur];
  if (s && FUR.prog(s) - (s.got | 0) > 0) { mpToast("다 구운 걸 먼저 꺼내요", 1400); return; }
  if (s && FUR.prog(s) < s.n) { mpToast("지금 굽는 중이에요 · 다 구우면 넣어요", 1400); return; }
  const id = r.i[0][0];
  let n = Math.min(n0, mpHave(id));
  n = Math.min(n, Math.floor(FUR.fuelUnits()));
  if (n <= 0) { mpToast("🔥 연료가 없어요 · 석탄 · 숯 · 판자 · 원목이 필요해요", 1800); return; }
  FUR.useFuel(n); mpTake(id, n);
  FUR.st[FUR.cur] = { inp: id, out: r.o[0], on: r.o[1], n, per: r.t, t0: Date.now(), got: 0 };
  try { Lt("fuse", 0, .6); } catch (e) {}
  mpSave(); FUR.render();
};
MP.click.fget = () => {
  const s = FUR.st[FUR.cur]; if (!s) return;
  const p = FUR.prog(s), can = p - (s.got | 0);
  if (can > 0) { xM(s.out, can * (s.on || 1), 1); s.got = p; mpToast("🔥 " + mpIconOf(s.out) + " " + mpNameOf(s.out) + " ×" + can * (s.on || 1) + " 꺼냈어요", 1500); try { Lt("pop"); } catch (e) {} }
  if (s.got >= s.n) delete FUR.st[FUR.cur];
  mpSave(); FUR.render();
};
setInterval(() => { if (!J("menu").hidden && J("mcard").querySelector('[data-view="mpfur"]')) FUR.render(); }, 1000);

// ── 내 상자 (27칸 · 본체 상자 창 그대로) ──
// 상자 창 제목 (본체 제목 표에 더해요) · tb에 bonus가 들어가면 친구와 나누지 않는 내 것
try { Ap.mpchest = "내 상자"; Ap.mpvault = "다이아 은행 금고"; } catch (e) {}
MP.chestTitles = {
  mpchest: ["📦 내 상자", "칸을 누르면 하나씩 가방으로 · 이 상자는 나만 써요 (친구와 나누지 않아요) · 부수면 안에 든 게 떨어져요"],
  mpvault: ["💰 다이아 은행 금고", "칸을 누르면 하나씩 가방으로 · 돈다발 💰은 경찰을 따돌려야 코인이 돼요"],
};
{ // 상자 창: 내 상자 · 금고는 제목과 아래 설명을 바꿔요
  const orig = pM;
  pM = function () {
    const r = orig.apply(this, arguments);
    try {
      const t = S.cur;
      if (t && /^mpc:/.test(t.id)) {
        const card = J("mcard"), tt = MP.chestTitles[t.st] || MP.chestTitles.mpchest, h = card && card.querySelector("h2");
        if (h) h.textContent = tt[0];
        const sm = card && [...card.querySelectorAll("small")].find(e => /마크 상자 \(/.test(e.textContent));
        if (sm) sm.textContent = tt[1];
      }
    } catch (e) {}
    return r;
  };
}
const CHS = (MP.chest = {});
CHS.id = (x, yy, z) => "mpc:" + x + "," + yy + "," + z;
CHS.open = (x, yy, z, st) => {
  const id = CHS.id(x, yy, z);
  if (!Array.isArray(S.op[id])) S.op[id] = Array(27).fill(null);
  YS({ id, x: x + .5, y: yy, z: z + .5, tb: "mpbonus", st: st || "mpchest" });
};

// 예전에 놓아 둔 작업대 · 화로 · 상자: 가까이 가면 F로 열기
const mpNearStations = (L, P) => {
  if (!S.out) return;
  for (const [bid, l, fn] of [[MPS.table, "🛠️ 작업대 쓰기", () => CR.open()], [MPS.furnace, "🔥 화로 열기", s => FUR.open(s.x, s.y, s.z)], [MPS.chest, "📦 내 상자 열기", s => CHS.open(s.x, s.y, s.z)]]) {
    const s = mpFind(bid, 2); if (!s) continue;
    L.push({ x: s.x + .5, z: s.z + .5, y: P.y, r: 2.6, l, fn: () => fn(s) });
  }
};

de.add({
  id: "mp_craft", name: "제작 · 화로 · 내 상자", need: ["mp_build", "chest"],
  gives: "MP.craft.open() 제작 창 (어디서나 · 🔥 굽기 = 휴대용 화로) · MP.furnace 화로 · MP.chest 내 상자 · MP.recipes 레시피",
  near: mpNearStations,
  save: e => { e.mpf = FUR.st; },
  load: e => { FUR.st = e && e.mpf && typeof e.mpf === "object" ? e.mpf : {}; },
  newGame: () => { FUR.st = {}; },
  dbg: { MPC: CR, MPF: FUR },
});
