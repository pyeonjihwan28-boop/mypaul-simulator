/* ───────────── 아이템 종류 · 새 블록 · 그림판 ─────────────
   새 아이템 종류: "blk" 놓을 수 있는 블록 · "t" 도구 · "r" 재료
   (본체는 "c" 종류를 코인으로 바꿔 버려서, 짓기·제작에 쓰는 건 종류를 바꿔요) */

const MPI = (MP.items = { blockOf: {}, itemOf: {}, tools: {}, cat: {} });
const mpNameOf = id => (ji[id] ? ji[id][0] : id);
const mpIconOf = id => (ji[id] ? ji[id][1] : "❔");
MP.nameOf = mpNameOf; MP.iconOf = mpIconOf;

// ── 그림판에 새 칸 그리기 (160~223번 칸을 써요) ──
const MPT = { CT_SIDE: 160, CT_TOP: 161, FURN_SIDE: 162, FURN_TOP: 163, CHEST_SIDE: 164, CHEST_TOP: 165,
  FARM_TOP: 166, ORE_COAL: 167, ORE_IRON: 168, ORE_GOLD: 169, ORE_DIA: 170, ORE_RED: 171, ORE_LAPIS: 172,
  ORE_EMER: 173, DEEP: 174, LAMP_OFF: 175, LAMP_ON: 176, LEVER: 177, RDUST: 178, PISTON: 179, PISTON_TOP: 180,
  NETHERRACK: 181, LAVA: 182, SOUL: 183, BED_SIDE: 184, BED_TOP: 185, TORCH: 186, BASALT: 187, PLATE: 188, OBS_VAULT: 189,
  RAMP: 190, CP: 191 };
MP.tiles = MPT;
const mpPainters = [];
const mpTile = (idx, fn) => mpPainters.push([idx, fn]);
const mpRect = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
const mpGrad = (g, a, b, x = 0, y = 0, w = 256, h = 256) => { const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(x, y, w, h); };
function mpPaintAll(r) {
  if (!r || !r.map || !r.map.image) return;
  const ia = r.map.image, ie = r.em && r.em.image, ir = r.rm && r.rm.image;
  const W = ia.width, t = W / 16, A = t / 256;
  const ca = ia.getContext("2d"), ce = ie && ie.getContext && ie.getContext("2d"), cr = ir && ir.getContext && ir.getContext("2d");
  const all = [ca, ce, cr].filter(Boolean);
  for (const [idx, paint] of mpPainters) {
    const x = (idx % 16) * t, yy = (idx >> 4) * t;
    for (const g of all) { g.save(); g.translate(x, yy); g.beginPath(); g.rect(0, 0, t, t); g.clip(); g.scale(A, A); }
    if (cr) mpRect(cr, "rgb(0,224,0)", 0, 0, 256, 256);
    if (ce) mpRect(ce, "#000", 0, 0, 256, 256);
    try { paint(ca, ce || ca, cr || ca); } catch (e) { console.warn("[마이폴 확장] 칸 그리기", idx, e); }
    for (const g of all) g.restore();
  }
  r.map.needsUpdate = true; if (r.em) r.em.needsUpdate = true; if (r.rm) r.rm.needsUpdate = true;
  MP.atlas = ia; MP.iconCache = {};
}
{ const orig = gp; gp = function () { const r = orig.apply(this, arguments); try { mpPaintAll(r); } catch (e) { console.warn("[마이폴 확장] 그림판", e); } return r; }; }

// 작업대
mpTile(MPT.CT_SIDE, g => {
  mpGrad(g, "#b98349", "#9a6a37");
  for (let i = 0; i < 4; i++) mpRect(g, "rgba(60,35,15,.28)", 0, i * 64 + 60, 256, 4);
  mpRect(g, "#7a4f27", 0, 0, 256, 34);
  // 톱 · 망치 그림
  g.fillStyle = "#e8e2d6"; g.beginPath(); g.moveTo(40, 120); g.lineTo(118, 96); g.lineTo(118, 132); g.lineTo(40, 150); g.closePath(); g.fill();
  mpRect(g, "#5a3a1c", 118, 100, 30, 28);
  mpRect(g, "#cfd5dc", 156, 92, 60, 26); mpRect(g, "#6b4423", 178, 118, 14, 92);
});
mpTile(MPT.CT_TOP, g => {
  mpGrad(g, "#c8935a", "#b07c45");
  g.strokeStyle = "rgba(70,40,15,.45)"; g.lineWidth = 6;
  for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(i * 85, 14); g.lineTo(i * 85, 242); g.stroke(); g.beginPath(); g.moveTo(14, i * 85); g.lineTo(242, i * 85); g.stroke(); }
  g.strokeStyle = "rgba(70,40,15,.6)"; g.lineWidth = 10; g.strokeRect(8, 8, 240, 240);
});
// 화로
mpTile(MPT.FURN_SIDE, (g, e) => {
  mpGrad(g, "#9a9da2", "#7d8086");
  mpRect(g, "rgba(0,0,0,.12)", 0, 0, 256, 24);
  mpRect(g, "#2b2d31", 64, 120, 128, 96);
  mpGrad(g, "#ffb347", "#e2581b", 76, 160, 104, 46);
  mpGrad(e, "#ff9a3c", "#c43d0c", 76, 160, 104, 46);
  mpRect(g, "#55585e", 56, 104, 144, 14);
});
mpTile(MPT.FURN_TOP, g => { mpGrad(g, "#8f9297", "#7a7d82"); g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 10; g.strokeRect(10, 10, 236, 236); });
// 상자
mpTile(MPT.CHEST_SIDE, g => {
  mpGrad(g, "#b67b3b", "#93602c");
  mpRect(g, "#6d4520", 0, 98, 256, 16);
  mpRect(g, "#f0c46a", 112, 86, 32, 40); mpRect(g, "#7a5a16", 122, 100, 12, 14);
  g.strokeStyle = "#6d4520"; g.lineWidth = 10; g.strokeRect(6, 6, 244, 244);
});
mpTile(MPT.CHEST_TOP, g => { mpGrad(g, "#c08544", "#a36c33"); g.strokeStyle = "#6d4520"; g.lineWidth = 12; g.strokeRect(8, 8, 240, 240); });
// 밭 (윗면)
mpTile(MPT.FARM_TOP, (g, e, r) => {
  mpGrad(g, "#5d3f22", "#4a311a");
  for (let i = 0; i < 4; i++) mpRect(g, "rgba(0,0,0,.25)", 0, i * 64 + 26, 256, 12);
  mpRect(r, "rgb(0,170,0)", 0, 0, 256, 256);
});
// 광석 (돌 바탕 + 점)
const mpOre = (col, glow) => (g, e) => {
  mpGrad(g, "#8b8e93", "#76797e");
  const pts = [[44, 52], [150, 40], [196, 120], [90, 150], [40, 200], [170, 206], [120, 96]];
  for (const [x, yy] of pts) {
    mpRect(g, "rgba(0,0,0,.25)", x - 4, yy - 4, 38, 30);
    mpRect(g, col, x, yy, 30, 22);
    if (glow) mpRect(e, glow, x, yy, 30, 22);
  }
};
mpTile(MPT.ORE_COAL, mpOre("#2a2b2e"));
mpTile(MPT.ORE_IRON, mpOre("#d8b08c"));
mpTile(MPT.ORE_GOLD, mpOre("#f7d043"));
mpTile(MPT.ORE_DIA, mpOre("#5fe3dc", "#1d6f6b"));
mpTile(MPT.ORE_RED, mpOre("#e0312b", "#7a120e"));
mpTile(MPT.ORE_LAPIS, mpOre("#2f5ed6"));
mpTile(MPT.ORE_EMER, mpOre("#2fd36b", "#0d5a2a"));
mpTile(MPT.DEEP, g => { mpGrad(g, "#4c4e54", "#3c3e44"); for (let i = 0; i < 5; i++) mpRect(g, "rgba(0,0,0,.18)", 0, i * 52 + 20, 256, 6); });
// 레드스톤 램프 · 레버 · 가루 · 피스톤 · 압력판
mpTile(MPT.LAMP_OFF, g => { mpGrad(g, "#6b3f24", "#4e2d18"); g.strokeStyle = "#3a2010"; g.lineWidth = 14; g.strokeRect(20, 20, 216, 216); mpRect(g, "#7c4a2a", 70, 70, 116, 116); });
mpTile(MPT.LAMP_ON, (g, e) => { mpGrad(g, "#ffd38a", "#f2a64a"); g.strokeStyle = "#9b5a24"; g.lineWidth = 14; g.strokeRect(20, 20, 216, 216); mpGrad(e, "#ffcf7a", "#e8913a"); });
mpTile(MPT.LEVER, g => { mpGrad(g, "#7d8086", "#6a6d72"); mpRect(g, "#4b3220", 104, 60, 48, 140); mpRect(g, "#d9d9d9", 92, 40, 72, 30); });
mpTile(MPT.RDUST, (g, e) => { mpGrad(g, "#8b8e93", "#76797e"); mpRect(g, "#c81d1d", 0, 112, 256, 32); mpRect(g, "#c81d1d", 112, 0, 32, 256); mpRect(e, "#5a0505", 0, 112, 256, 32); });
mpTile(MPT.PISTON, g => { mpGrad(g, "#8a8d92", "#73767b"); mpRect(g, "#a8743c", 0, 0, 256, 64); mpRect(g, "#5c5f64", 108, 64, 40, 192); });
mpTile(MPT.PISTON_TOP, g => { mpGrad(g, "#b98349", "#a06d3a"); mpRect(g, "#6c6f74", 100, 100, 56, 56); });
mpTile(MPT.PLATE, g => { mpGrad(g, "#a3a6ab", "#8f9297"); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 12; g.strokeRect(16, 16, 224, 224); });
// 차원문 너머 (네더 비슷한 곳)
mpTile(MPT.NETHERRACK, g => { mpGrad(g, "#7a2b2b", "#5e1f22"); for (let i = 0; i < 6; i++) mpRect(g, "rgba(0,0,0,.18)", (i * 47) % 220, i * 40, 40, 18); });
mpTile(MPT.LAVA, (g, e) => { mpGrad(g, "#ff8a1f", "#d4400c"); mpGrad(e, "#ff7a14", "#b8360a"); });
mpTile(MPT.SOUL, g => { mpGrad(g, "#5a4636", "#46362a"); });
mpTile(MPT.BASALT, g => { mpGrad(g, "#4a4b50", "#36373b"); for (let i = 0; i < 4; i++) mpRect(g, "rgba(255,255,255,.06)", i * 64 + 10, 0, 8, 256); });
// 침대
mpTile(MPT.BED_SIDE, g => { mpRect(g, "#d33c3c", 0, 0, 256, 150); mpRect(g, "#f2f2f2", 0, 0, 256, 40); mpRect(g, "#9a6a37", 0, 150, 256, 106); });
mpTile(MPT.BED_TOP, g => { mpRect(g, "#d33c3c", 0, 0, 256, 256); mpRect(g, "#f4f4f4", 0, 0, 256, 80); g.strokeStyle = "rgba(0,0,0,.15)"; g.lineWidth = 8; g.strokeRect(6, 6, 244, 244); });
mpTile(MPT.TORCH, (g, e) => { mpRect(g, "#8a5a2b", 112, 70, 32, 186); mpRect(g, "#ffd25a", 100, 30, 56, 50); mpRect(e, "#ffb02e", 100, 30, 56, 50); });
mpTile(MPT.OBS_VAULT, (g, e) => { mpGrad(g, "#2b1f3d", "#160f22"); mpRect(g, "rgba(170,120,255,.25)", 30, 40, 40, 20); mpRect(g, "rgba(170,120,255,.25)", 150, 170, 50, 24); mpRect(e, "#140a24", 0, 0, 256, 256); });
mpTile(MPT.RAMP, g => { mpGrad(g, "#f2c230", "#d9a91c"); for (let i = 0; i < 4; i++) { g.fillStyle = "#1f2430"; g.beginPath(); g.moveTo(i * 64, 256); g.lineTo(i * 64 + 32, 256); g.lineTo(i * 64 + 64, 0); g.lineTo(i * 64 + 32, 0); g.fill(); } });
mpTile(MPT.CP, (g, e) => { mpGrad(g, "#4fd1ff", "#1c8fd6"); mpGrad(e, "#2b9fe0", "#0c5d93"); });

// ── 새 블록 (블록 표에 넣기) ──
const mpW = [255, 255, 255];
const mpBlk = (mc, side, top, opt) => Dt(mc, side, top, mpW, opt);
MPI.newBlocks = {
  crafting_table: mpBlk("crafting_table", MPT.CT_SIDE, MPT.CT_TOP, { n: "작업대", ic: "🛠️", h: 2.5, r: 2.5, d: "crafting_table" }),
  furnace: mpBlk("furnace", MPT.FURN_SIDE, MPT.FURN_TOP, { n: "화로", ic: "🔥", h: 3.5, r: 3.5, d: "furnace" }),
  chest: mpBlk("chest", MPT.CHEST_SIDE, MPT.CHEST_TOP, { n: "상자", ic: "📦", h: 2.5, r: 2.5, d: "chest" }),
  farmland: mpBlk("farmland", H.DIRT, MPT.FARM_TOP, { n: "밭", ic: "🟫", h: .6, r: .6, d: "dirt" }),
  coal_ore: mpBlk("coal_ore", MPT.ORE_COAL, null, { n: "석탄 광석", ic: "⚫", h: 3, r: 3, d: "coal", d0: 1, d1: 2 }),
  iron_ore: mpBlk("iron_ore", MPT.ORE_IRON, null, { n: "철 광석", ic: "🟤", h: 3, r: 3, d: "raw_iron" }),
  gold_ore: mpBlk("gold_ore", MPT.ORE_GOLD, null, { n: "금 광석", ic: "🟡", h: 3, r: 3, d: "raw_gold" }),
  diamond_ore: mpBlk("diamond_ore", MPT.ORE_DIA, null, { n: "다이아몬드 광석", ic: "💎", h: 3, r: 3, d: "diamond", e: 1 }),
  redstone_ore: mpBlk("redstone_ore", MPT.ORE_RED, null, { n: "레드스톤 광석", ic: "🔴", h: 3, r: 3, d: "redstone", d0: 4, d1: 5, e: 1 }),
  lapis_ore: mpBlk("lapis_ore", MPT.ORE_LAPIS, null, { n: "청금석 광석", ic: "🔷", h: 3, r: 3, d: "lapis_lazuli", d0: 4, d1: 8 }),
  emerald_ore: mpBlk("emerald_ore", MPT.ORE_EMER, null, { n: "에메랄드 광석", ic: "💚", h: 3, r: 3, d: "emerald", e: 1 }),
  deepslate: mpBlk("deepslate", MPT.DEEP, null, { n: "심층암", ic: "⬛", h: 3, r: 6, d: "cobbled_deepslate" }),
  redstone_lamp: mpBlk("redstone_lamp", MPT.LAMP_OFF, null, { n: "레드스톤 램프", ic: "💡", h: .3, r: .3, d: "redstone_lamp" }),
  redstone_lamp_on: mpBlk("redstone_lamp_on", MPT.LAMP_ON, null, { n: "켜진 레드스톤 램프", ic: "💡", h: .3, r: .3, d: "redstone_lamp", e: 1, key: "redstone_lamp_on" }),
  lever: mpBlk("lever", MPT.LEVER, MPT.LEVER, { n: "레버", ic: "🕹️", h: .5, r: .5, d: "lever" }),
  redstone_wire: mpBlk("redstone_wire", MPT.RDUST, MPT.RDUST, { n: "레드스톤 선", ic: "🔴", h: .1, r: .1, d: "redstone" }),
  piston: mpBlk("piston", MPT.PISTON, MPT.PISTON_TOP, { n: "피스톤", ic: "🗜️", h: 1.5, r: 1.5, d: "piston" }),
  stone_pressure_plate: mpBlk("stone_pressure_plate", MPT.PLATE, MPT.PLATE, { n: "돌 압력판", ic: "⬜", h: .5, r: .5, d: "stone_pressure_plate" }),
  netherrack: mpBlk("netherrack", MPT.NETHERRACK, null, { n: "네더랙", ic: "🟥", h: .4, r: .4, d: "netherrack" }),
  lava_rock: mpBlk("lava_rock", MPT.LAVA, null, { n: "용암 바위", ic: "🌋", h: 50, r: 1200, d: "", e: 1 }),
  soul_soil: mpBlk("soul_soil", MPT.SOUL, null, { n: "영혼 흙", ic: "🟫", h: .5, r: .5, d: "soul_soil" }),
  basalt: mpBlk("basalt", MPT.BASALT, null, { n: "현무암", ic: "⬛", h: 1.25, r: 4.2, d: "basalt" }),
  red_bed: mpBlk("red_bed", MPT.BED_SIDE, MPT.BED_TOP, { n: "침대", ic: "🛏️", h: .2, r: .2, d: "red_bed" }),
  wall_torch: mpBlk("wall_torch", MPT.TORCH, MPT.TORCH, { n: "횃불", ic: "🔥", h: .01, r: .01, d: "torch_b", e: 1 }),
  vault_obsidian: mpBlk("vault_obsidian", MPT.OBS_VAULT, null, { n: "금고 흑요석", ic: "⬛", h: 50, r: 1200, d: "obsidian", key: "vault_obsidian" }),
  stunt_ramp: mpBlk("stunt_ramp", MPT.RAMP, MPT.RAMP, { n: "스턴트 경사로", ic: "🟨", h: 5, r: 6, d: "", key: "stunt_ramp" }),
};
// 횃불 · 레버 · 선 · 압력판은 몸이 지나갈 수 있게 (문처럼)
for (const k of ["wall_torch", "lever", "redstone_wire", "stone_pressure_plate"]) Kt[MPI.newBlocks[k]].door = 1;
for (const k of ["red_bed"]) Kt[MPI.newBlocks[k]].fence = 1;

// ── 아이템 표 손보기 ──
const MP_MAT = ["diamond", "emerald", "gold_ingot", "iron_ingot", "gold_nugget", "iron_nugget", "lapis_lazuli", "redstone", "coal", "copper_ingot",
  "string", "bone", "gunpowder", "leather", "flint", "paper", "clay_ball", "stick", "wheat", "egg", "wheat_seeds", "beetroot_seeds", "melon_seeds",
  "pumpkin_seeds", "oak_sapling", "spruce_sapling", "acacia_sapling", "glass_bottle", "glowstone_dust", "snowball", "prismarine_crystals", "resin_clump",
  "green_dye", "yellow_dye", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log", "pumpkin", "cactus", "bamboo",
  "dandelion", "poppy", "bucket", "water_bucket", "flint_and_steel", "rail"];
for (const id of MP_MAT) if (ji[id]) ji[id] = [ji[id][0], ji[id][1], "r", +ji[id][3] || 2];
const mpAdd = (id, n, ic, k, v) => { ji[id] = [n, ic, k, v]; };
mpAdd("charcoal", "숯", "⚫", "r", 4);
mpAdd("brick", "벽돌 조각", "🧱", "r", 2);
mpAdd("raw_iron", "철 원석", "🟤", "r", 12);
mpAdd("raw_gold", "금 원석", "🟡", "r", 25);
mpAdd("raw_copper", "구리 원석", "🟠", "r", 8);
mpAdd("sugar_cane", "사탕수수", "🎋", "r", 1);
mpAdd("beetroot", "비트", "🫒", "r", 2);
mpAdd("melon_slice", "수박 조각", "🍉", "r", 2);
mpAdd("ender_eye", "엔더의 눈", "🟢", "r", 120);
mpAdd("redstone_torch", "레드스톤 횃불", "🕯️", "r", 8);
mpAdd("map_photo", "금고 사진", "📸", "r", 0);
mpAdd("cash_bag", "돈다발", "💰", "r", 500);

// 블록 아이템 (놓을 수 있는 것)
const MP_NOPLACE = new Set(["tnt", "redstone_lamp_on", "lava_rock", "vault_obsidian", "stunt_ramp", "farmland"]);
for (let id = 1; id < Kt.length; id++) {
  const b = Kt[id]; if (!b || !b.mc) continue;
  const key = b.key || b.mc;
  if (key !== b.mc || MP_NOPLACE.has(b.mc)) continue;   // 특별한 것(차고 문·헬기장…)은 바탕 블록으로
  if (rn[b.mc] !== id) continue;
  const nm = String(b.n || b.mc).replace(/\s*\(.*\)\s*$/, "");
  const old = ji[b.mc];
  const val = old && old[2] === "c" ? +old[3] || 2 : old && old[2] === "r" ? +old[3] || 2 : Math.max(1, Math.round((b.h || 1) * 1.5));
  if (old && old[2] !== "c" && old[2] !== "blk" && old[2] !== "r") continue;     // 음식·왼손 템과 겹치면 그대로
  ji[b.mc] = [nm, b.ic || "🧱", "blk", val];
  MPI.blockOf[b.mc] = id;
}
// TNT는 왼손 템(호버보드)과 겹쳐서 따로
mpAdd("tnt_b", "TNT", "🧨", "blk", 40); MPI.blockOf.tnt_b = rn.tnt;
mpAdd("torch_b", "횃불", "🔥", "blk", 2); MPI.blockOf.torch_b = MPI.newBlocks.wall_torch;
mpAdd("redstone_lamp", "레드스톤 램프", "💡", "blk", 20); MPI.blockOf.redstone_lamp = MPI.newBlocks.redstone_lamp;
for (const [mc, id] of Object.entries(MPI.blockOf)) MPI.itemOf[id] = mc;
MPI.itemOf[rn.tnt] = "tnt_b";
MPI.itemOf[MPI.newBlocks.redstone_lamp_on] = "redstone_lamp";

// ── 도구 ──
const MP_TIER = { wooden: [1, 2, "나무"], stone: [2, 4, "돌"], iron: [3, 6, "철"], golden: [1, 12, "금"], diamond: [4, 8, "다이아몬드"], netherite: [5, 9, "네더라이트"] };
const MP_TKIND = { pickaxe: ["곡괭이", "⛏️"], axe: ["도끼", "🪓"], shovel: ["삽", "🪏"], hoe: ["괭이", "🔨"] };
for (const [tn, [tier, speed, tk]] of Object.entries(MP_TIER)) for (const [kn, [kk, ki]] of Object.entries(MP_TKIND)) {
  const id = tn + "_" + kn;
  const v = ji[id] && +ji[id][3] || [0, 8, 15, 45, 250, 600][tier] || 10;
  ji[id] = [tk + " " + kk, ki, "t", v];
  MPI.tools[id] = { kind: kn, tier, speed, id };
}
ji.shears = ["가위", "✂️", "t", 30]; MPI.tools.shears = { kind: "shears", tier: 2, speed: 5, id: "shears" };

// 블록마다 알맞은 도구
MPI.toolFor = mc => {
  if (!mc) return "pickaxe";
  if (/planks|_log$|bookshelf|oak_door|fence|crafting_table|chest|daylight|lever|piston/.test(mc)) return "axe";
  if (/^(dirt|grass_block|sand|gravel|snow_block|clay|farmland|soul_soil)$/.test(mc)) return "shovel";
  if (/hay_block|leaves/.test(mc)) return "hoe";
  if (/wool/.test(mc)) return "shears";
  if (/^(glass|glowstone|sea_lantern|redstone_lamp|redstone_lamp_on|wall_torch|redstone_wire|red_bed)$/.test(mc)) return "any";
  return "pickaxe";
};
MPI.needTier = mc => (/obsidian/.test(mc) ? 4 : /diamond_ore|emerald_ore|gold_ore|redstone_ore/.test(mc) ? 3 : /iron_ore|lapis_ore/.test(mc) ? 2 : /_ore$|deepslate$/.test(mc) ? 1 : 0);
MPI.bestTool = kind => {
  let best = null;
  for (const t of Object.values(MPI.tools)) if (t.kind === kind && mpHave(t.id) > 0 && (!best || t.speed > best.speed || (t.speed === best.speed && t.tier > best.tier))) best = t;
  return best;
};
MPI.bestTier = kind => { let b = 0; for (const t of Object.values(MPI.tools)) if (t.kind === kind && mpHave(t.id) > 0) b = Math.max(b, t.tier); return b; };

// 블록 아이템 그림 (작은 정육면체) — 그림판에서 잘라 그려요
MP.iconCache = {};
MP.blockIcon = (bid, px = 44) => {
  const key = bid + ":" + px;
  if (MP.iconCache[key]) return MP.iconCache[key];
  const atlas = MP.atlas || (S.mat && S.mat.map && S.mat.map.image);
  const b = Kt[bid];
  if (!atlas || !b || !atlas.getContext) return "";
  const t = atlas.width / 16, cv = document.createElement("canvas");
  cv.width = cv.height = px * 2;
  const g = cv.getContext("2d"), s = px * 2;
  const tint = b.k || mpW;
  const face = (tile, m, shade) => {
    g.save(); g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    g.drawImage(atlas, (tile % 16) * t, (tile >> 4) * t, t, t, 0, 0, 1, 1);
    g.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},.0)`; g.fillRect(0, 0, 1, 1);
    if (tint[0] < 250 || tint[1] < 250 || tint[2] < 250) { g.globalCompositeOperation = "multiply"; g.fillStyle = `rgb(${tint[0]},${tint[1]},${tint[2]})`; g.fillRect(0, 0, 1, 1); g.globalCompositeOperation = "source-over"; }
    g.fillStyle = `rgba(0,0,0,${shade})`; g.fillRect(0, 0, 1, 1);
    g.restore();
  };
  const w = s * .46, h = s * .27, cx = s / 2, top = s * .12;
  face(b.tt ?? b.t, [w, h, -w, h, cx, top], 0);                 // 윗면
  face(b.t, [w, h, 0, w * 1.05, cx - w, top + h], .18);          // 왼쪽 앞면
  face(b.t, [w, -h, 0, w * 1.05, cx, top + 2 * h], .34);         // 오른쪽 앞면
  return (MP.iconCache[key] = cv.toDataURL());
};

// ── 본체 가방 함수 감싸기 ──
const MP_MYKIND = k => k === "blk" || k === "t" || k === "r";
MPI.cap = { blk: 999, r: 999, t: 9 };
{ // 가방에 넣기: 내 종류는 한 칸에 999개까지
  const orig = xM;
  xM = function (id, n, quiet) {
    const k = ji[id] && ji[id][2];
    if (!MP_MYKIND(k)) return orig.apply(this, arguments);
    if (!id || !(n > 0)) return "";
    c.MI = c.MI || {};
    if (!(c.MI[id] > 0) && N$()) { mpToast("🎒 가방이 가득 찼어요 (27칸) — 팔거나 써서 칸을 비워요", 2200); return ""; }
    c.MI[id] = Math.min(MPI.cap[k] || 999, (c.MI[id] | 0) + n);
    const r = ji[id];
    if (!quiet) mpToast(r[1] + " " + r[0] + " +" + n + " (가방 " + c.MI[id] + ")", 1400);
    try { MP.onGain && MP.onGain(id, n); } catch (e) {}
    if (c.invOn) yp();
    mpSave();
    return r[1] + " " + r[0] + " ×" + n;
  };
}
{ // 상자에서 꺼낼 때: 내 종류는 가방으로
  const orig = MM;
  MM = function (e) { const k = ji[e.id] && ji[e.id][2]; return MP_MYKIND(k) ? xM(e.id, e.n, 1) : orig.apply(this, arguments); };
}
{ // 가방 칸 설명
  const orig = wM;
  wM = function () {
    const L = orig.apply(this, arguments);
    for (const s of L) {
      if (s.kind !== "mi") continue;
      const r = ji[s.key]; if (!r) continue;
      if (r[2] === "blk") s.sub = "블록 · 짓기 모드(" + (c.isTouch ? "짓기 버튼" : "X") + ")에서 놓아요 · 팔면 개당 " + Ge(r[3] || 1) + "코인";
      else if (r[2] === "t") { const t = MPI.tools[s.key]; s.sub = "도구 · 캘 때 알아서 써요" + (t ? " · 속도 ×" + t.speed : "") + " · 팔면 " + Ge(r[3] || 1) + "코인"; }
      else if (r[2] === "r") s.sub = "재료 · 제작(작업대 · 화로)에 써요 · 팔면 개당 " + Ge(r[3] || 1) + "코인";
    }
    return L;
  };
}
{ // 가방 칸 버튼: 쓰기 → 짓기에 들기 / 제작 열기, 팔기 값 바로잡기
  const orig = rj;
  rj = function (act, ik) {
    const [kind, key] = String(ik).split(/:(.*)/);
    const r = kind === "mi" && ji[key];
    if (!r || !MP_MYKIND(r[2])) return orig.apply(this, arguments);
    if (act === "use") {
      if (r[2] === "blk") { Ms(!1); MP.build && MP.build.hold(key); }
      else { Ms(!1); MP.craft && MP.craft.open(); }
    } else if (act === "sell" || act === "sellall") {
      const nn = act === "sell" ? 1 : mpHave(key);
      if (nn > 0) { mpTake(key, nn); Pt((r[3] || 1) * nn, 1); q("coin"); mpToast(r[1] + " " + r[0] + " ×" + nn + " 팔았어요 · 코인 +" + Ge((r[3] || 1) * nn), 1800); }
    }
    mpSave(); if (c.invOn) yp(); try { ir?.(); } catch (e) {}
  };
}
{ // 가방 정보 칸 버튼 이름 바꾸기
  const orig = yp;
  yp = function () {
    const r0 = orig.apply(this, arguments);
    try {
      const b = document.querySelector('#iinfo button[data-iact="use"]');
      if (b) {
        const key = String(b.dataset.ik || "").split(/:(.*)/)[1];
        const r = ji[key];
        if (r && r[2] === "blk") b.textContent = "짓기에 들기";
        else if (r && (r[2] === "r" || r[2] === "t")) b.textContent = "제작 열기";
      }
    } catch (e) {}
    return r0;
  };
}
