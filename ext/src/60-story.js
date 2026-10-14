/* ───────────── 3단계: 이야기 미션 · 다이아 은행 한탕 · 바리케이드 ─────────────
   등장인물은 모두 바깥 도시의 가상 인물이에요 (학교 선생님 · 학생은 나오지 않아요).
   미나 누나(블록 택배) → 렌치 형(정비소) → 도윤(설계도) → 까치(한탕) 순서로 5장.
   다이아 은행은 학교 앞 거리(청크 1,-4) 남쪽 줄 가게 세 채 자리에 지어요. */

const ST = (MP.story = { done: {}, cur: null, cut: null, heistT: 0, list: [] });
const GV = (MP.cast = {
  mina: { n: "미나 누나", role: "블록 택배 사장", ic: "📦", base: [24, -122], look: { hair: 0x3b2314, shirt: 0xf5c542, ex: "b", pants: 0x2b3446, shoe: 0xf0f0f0, fem: 1 } },
  rench: { n: "렌치 형", role: "괴산 커스텀 정비사", ic: "🔧", base: [-29, -184], look: { hair: 0x1b1b1b, shirt: 0x2f6fed, ex: "j", jacket: 0x1f3a6e, pants: 0x2a2a2a, shoe: 0x1b1b1b } },
  doyun: { n: "도윤", role: "설계도 전문가", ic: "💻", base: [86, -184], look: { hair: 0x0e0e0e, shirt: 0x6b21a8, ex: "g", pants: 0x1f2937, shoe: 0xffffff } },
  kkachi: { n: "까치", role: "한탕 설계자", ic: "🐦", base: [93, -199], look: { hair: 0xd9d9d9, hairStyle: "side", shirt: 0xf2f2f2, ex: "jtg", jacket: 0x111111, tie: 0xe5484d, pants: 0x111111, shoe: 0x111111 } },
});
const snap = (x, z) => { let p = null; try { p = rC(x, z); } catch (e) {} return p ? [p[0], p[1]] : [x, z]; };
const gvPos = k => GV[k].pos || (GV[k].pos = snap(GV[k].base[0], GV[k].base[1]));

// ── 다이아 은행 ──
const BANK = (MP.bank = { cx: 1, cz: -4, x0: 88, x1: 116, z0: -216, z1: -202 });
BANK.R = [BANK.x0, BANK.z0, BANK.x1, BANK.z1];
BANK.vault = { x0: 94, x1: 110, z0: -216, z1: -210, y1: 6 };
BANK.vdoor = { x0: 101, x1: 103, z: -211, y1: 3 };
BANK.chests = [[97, 0, -214], [102, 0, -214], [107, 0, -214]];
BANK.front = [102, -199.5];
BANK.photo = [102, 1.5, -210.4];
const VDOOR = mpBlk("vault_door", H.IRONB, H.IRONB, { n: "금고 문", ic: "🚪", h: 50, r: 4, d: "", key: "vault_door" });
const VOBS = MPI.newBlocks.vault_obsidian;
BANK.ids = { door: VDOOR, obs: VOBS };
{ const prev = MPI.needTier; MPI.needTier = mc => (mc === "vault_door" ? 4 : prev(mc)); }
const ovR = (x1, z1, x2, z2, R, m = 0) => x2 > R[0] - m && x1 < R[2] + m && z2 > R[1] - m && z1 < R[3] + m;
const inBank = (x, z) => x >= BANK.x0 && x < BANK.x1 && z >= BANK.z0 && z < BANK.z1;
MP.inBank = inBank;
// 은행 자리 가게 간판은 안 그려요
{ const orig = A0; BANK.sign = orig; A0 = function (e, t, i, r, a, s) { if (e && e.cx === BANK.cx && e.cz === BANK.cz && ovR(i, r, a, s, BANK.R, -.5)) return; return orig.apply(this, arguments); }; }
const bankGen = (Q, cx, cz) => {
  if (cx !== BANK.cx || cz !== BANK.cz) return;
  // 겹치는 가게는 통째로 치워요
  let Z = BANK.R.slice();
  const gone = (Q.bld || []).filter(b => ovR(b[0], b[1], b[2], b[3], BANK.R, -.5));
  for (const b of gone) Z = [Math.min(Z[0], b[0]), Math.min(Z[1], b[1]), Math.max(Z[2], b[2]), Math.max(Z[3], b[3])];
  Q.bld = (Q.bld || []).filter(b => !gone.includes(b));
  const inZ = (x, z, m = 0) => x >= Z[0] - m && x < Z[2] + m && z >= Z[1] - m && z < Z[3] + m;
  const ovZ = (x1, z1, x2, z2) => ovR(x1, z1, x2, z2, Z, -.01);
  Q.bb = Q.bb.filter(b => b.mp || !ovZ(b[0], b[2], b[3], b[5]));
  if (Q.mpb) { Q.mpb = new Map(); Q.bb.forEach((b, i) => { if (b.mp) Q.mpb.set(Es(b[0] - cx * 64, b[1], b[2] - cz * 64), i); }); }
  Q.box = (Q.box || []).filter(b => (b.x2 - b.x1) * (b.z2 - b.z1) > 400 || !ovZ(b.x1, b.z1, b.x2, b.z2));
  Q.door = (Q.door || []).filter(a => !inZ(a[0] + .5, a[2] + .5, .5));
  Q.chest = (Q.chest || []).filter(a => !inZ(a.x, a.z));
  Q.bed = (Q.bed || []).filter(a => !inZ(a[0], a[1]));
  Q.it = (Q.it || []).filter(a => !inZ(a.x, a.z));
  Q.mob = (Q.mob || []).filter(a => !inZ(a[0], a[1], 3.2));
  Q.tree = (Q.tree || []).filter(a => !inZ(a[0], a[1]));
  Q.lamp = (Q.lamp || []).filter(a => !inZ(a[0], a[1]));
  Q.sp = (Q.sp || []).filter(a => !inZ(a[1], a[2]));
  for (const k of ["ride", "veh"]) Q[k] = (Q[k] || []).filter(a => !inZ(a.x, a.z));
  Q.mini = (Q.mini || []).filter(a => (a[3] - a[1]) * (a[4] - a[2]) > 400 || !ovZ(a[1], a[2], a[3], a[4]));
  // 은행 건물
  const B = (x1, y1, z1, x2, y2, z2, mc, vault) => { const id = typeof mc === "number" ? mc : rn[mc]; if (!id) return; const b = [x1, y1, z1, x2, y2, z2, id, 63, 0]; b.bank = 1; if (vault) b.vault = 1; Q.bb.push(b); };
  const Qz = "quartz_block", GL = "glass", { x0, x1, z0, z1 } = BANK;
  // 뒤쪽 벽 (가운데는 금고 흑요석)
  B(x0, 0, z0, 94, 7, z0 + 1, Qz); B(110, 0, z0, x1, 7, z0 + 1, Qz); B(94, 6, z0, 110, 7, z0 + 1, Qz);
  // 옆벽 (창문)
  for (const wx of [x0, x1 - 1]) { B(wx, 0, z0 + 1, wx + 1, 2, z1 - 1, Qz); B(wx, 2, z0 + 1, wx + 1, 5, -213, Qz); B(wx, 2, -213, wx + 1, 5, -205, GL); B(wx, 2, -205, wx + 1, 5, z1 - 1, Qz); B(wx, 5, z0 + 1, wx + 1, 6, z1 - 1, Qz); B(wx, 6, z0 + 1, wx + 1, 7, z1 - 1, "light_blue_concrete"); }
  // 앞벽 (금 기둥 · 유리창 · 입구 100~104)
  const fz = z1 - 1;
  B(x0, 0, fz, x0 + 1, 7, z1, "gold_block"); B(x1 - 1, 0, fz, x1, 7, z1, "gold_block");
  B(x0 + 1, 0, fz, 100, 1, z1, Qz); B(104, 0, fz, x1 - 1, 1, z1, Qz);
  B(x0 + 1, 1, fz, 90, 5, z1, Qz); B(90, 1, fz, 98, 5, z1, GL); B(98, 1, fz, 100, 5, z1, Qz);
  B(104, 1, fz, 106, 5, z1, Qz); B(106, 1, fz, 114, 5, z1, GL); B(114, 1, fz, x1 - 1, 5, z1, Qz);
  B(x0 + 1, 5, fz, x1 - 1, 6, z1, Qz); B(x0 + 1, 6, fz, x1 - 1, 7, z1, "light_blue_concrete");
  // 지붕 (가운데는 유리 천창 · 햇빛이 들어와요) · 조명 · 창구
  B(x0, 7, z0, x1, 8, z0 + 2, "smooth_stone"); B(x0, 7, z1 - 2, x1, 8, z1, "smooth_stone");
  B(x0, 7, z0 + 2, x0 + 2, 8, z1 - 2, "smooth_stone"); B(x1 - 2, 7, z0 + 2, x1, 8, z1 - 2, "smooth_stone");
  B(x0 + 2, 7, z0 + 2, x1 - 2, 8, z1 - 2, GL);
  for (const lx of [92, 102, 112]) B(lx, 6, -207, lx + 1, 7, -206, "sea_lantern");
  B(90, 0, -208, 99, 1, -207, "polished_andesite"); B(105, 0, -208, 114, 1, -207, "polished_andesite");
  // 금고 (흑요석은 TNT도 못 뚫어요 · 문은 TNT나 다이아 곡괭이)
  const v = BANK.vault, dz = BANK.vdoor.z;
  B(v.x0, 0, z0, v.x1, v.y1, z0 + 1, VOBS, 1);
  B(v.x0, 0, z0 + 1, v.x0 + 1, v.y1, dz, VOBS, 1); B(v.x1 - 1, 0, z0 + 1, v.x1, v.y1, dz, VOBS, 1);
  B(v.x0, 0, dz, 101, v.y1, dz + 1, VOBS, 1); B(103, 0, dz, v.x1, v.y1, dz + 1, VOBS, 1); B(101, 3, dz, 103, v.y1, dz + 1, VOBS, 1);
  B(v.x0 + 1, v.y1 - 1, z0 + 1, v.x1 - 1, v.y1, dz, VOBS, 1);
  B(101, 0, dz, 103, 3, dz + 1, VDOOR, 1);
  for (const [cx2, cy2, cz2] of BANK.chests) B(cx2, cy2, cz2, cx2 + 1, cy2 + 1, cz2 + 1, MPI.newBlocks.chest, 1);
  B(95, 0, z0 + 1, 96, 2, z0 + 2, "gold_block", 1); B(108, 0, z0 + 1, 109, 2, z0 + 2, "gold_block", 1);
  // 간판 · 지도
  try { BANK.sign(Q, "n", x0, z0, x1, z1, 5.05, "다이아 은행", 11); } catch (e) {}
  Q.mini.push(["#cfe8f4", x0, z0, x1, z1], ["#3a2a52", v.x0, v.z0, v.x1, v.z1]);
  Q.bank = 1;
};
// 한탕 중이 아니면 은행 벽은 저절로 고쳐져요 (청크 격자를 다시 만들 때)
const bankGrid = ch => {
  if (ch.cx !== BANK.cx || ch.cz !== BANK.cz || HEIST.on || !ch.Q || !ch.Q.bank) return;
  const dm = S.dmg.get(mpKeyOf(ch.cx, ch.cz)); if (!dm || !dm.size) return;
  const X0 = ch.cx * 64, Z0 = ch.cz * 64;
  for (const b of ch.Q.bb) {
    if (!b.bank) continue;
    for (let yy = b[1]; yy < b[4]; yy++) for (let z = b[2]; z < b[5]; z++) for (let x = b[0]; x < b[3]; x++) { const li = Es(x - X0, yy, z - Z0); if (dm.delete(li)) ch.G[li] = b[6]; }
  }
};

// 떠 있는 이름표
const mpTagSprite = (lines, w = 512, h = 128, bg = "rgba(11,17,32,.86)") => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d"); g.fillStyle = bg; g.beginPath(); g.roundRect ? g.roundRect(4, 4, w - 8, h - 8, 26) : g.rect(4, 4, w - 8, h - 8); g.fill();
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff";
  if (lines.length === 1) { g.font = `700 ${Math.round(h * .5)}px "IBM Plex Sans KR",sans-serif`; g.fillText(lines[0], w / 2, h / 2 + 3); }
  else { g.font = `700 ${Math.round(h * .34)}px "IBM Plex Sans KR",sans-serif`; g.fillText(lines[0], w / 2, h * .36); g.fillStyle = "#f5c542"; g.font = `600 ${Math.round(h * .24)}px "IBM Plex Sans KR",sans-serif`; g.fillText(lines[1], w / 2, h * .72); }
  const tx = new v.CanvasTexture(cv); tx.colorSpace = v.SRGBColorSpace;
  const s = new v.Sprite(new v.SpriteMaterial({ map: tx, depthWrite: false, transparent: true }));
  s.scale.set(w / h * .5, .5, 1); s.renderOrder = 6; return s;
};
MP.tagSprite = mpTagSprite;

// ── 의뢰인 (가상 인물 NPC) ──
const NPCS = (MP.npcs = {});
const npcSync = () => {
  const P = c.P;
  for (const k of Object.keys(GV)) {
    const [x, z] = gvPos(k);
    const want = !!(S.out && S.ok && c.run && !c.bm && Math.hypot(P.x - x, P.z - z) < 130);
    let n = NPCS[k];
    if (want && !n) {
      const ch = mpChunkAt(x, z); if (!ch || !ch.G) continue;
      let m; try { m = ul(GV[k].look); } catch (e) { if (!GV[k].err) { GV[k].err = 1; console.warn("[마이폴 확장] NPC 모형", k, e); } continue; }
      m.g.scale.setScalar(.95);
      const yy = Qs(x, z, 3);
      m.g.position.set(x, yy, z); S.root.add(m.g);
      const tag = mpTagSprite([GV[k].n, GV[k].role]); tag.position.set(0, 2.3, 0); m.g.add(tag);
      const mark = mpTagSprite(["🎯"], 128, 128, "rgba(229,72,77,.92)"); mark.scale.set(.48, .48, 1); mark.position.set(0, 2.9, 0); m.g.add(mark);
      NPCS[k] = n = { k, m, x, z, y: yy, mark, tag, t: O() * 6 };
    } else if (!want && n) { n.m.g.parent && n.m.g.parent.remove(n.m.g); delete NPCS[k]; }
    else if (n && n.m.g.parent !== S.root) S.root.add(n.m.g);
  }
};
const npcTick = dt => {
  const P = c.P, s = ST.stepOf();
  for (const n of Object.values(NPCS)) {
    n.t += dt; const d = Math.hypot(P.x - n.x, P.z - n.z);
    const face = d < 9 ? Math.atan2(P.x - n.x, P.z - n.z) : Math.sin(n.t * .3) * .6;
    let dr = face - n.m.g.rotation.y; while (dr > Math.PI) dr -= Math.PI * 2; while (dr < -Math.PI) dr += Math.PI * 2;
    n.m.g.rotation.y += dr * Math.min(1, dt * 4);
    if (n.m.la) { n.m.la.rotation.x = Math.sin(n.t * 1.4) * .05; n.m.ra.rotation.x = -Math.sin(n.t * 1.4) * .05; }
    n.mark.visible = !!ST.avail(n.k) || !!(s && s.k === "talk" && ST.whoOf(s) === n.k);
    n.mark.position.y = 2.9 + Math.sin(n.t * 2.4) * .08;
  }
};

// ── 미션 표 ──
const M = (id, ch, t, giver, need, intro, steps, reward, outro) => ST.list.push({ id, ch, t, giver, need, intro, steps, reward, outro });
const key = a => ze(a);
M("m1", "1장", "외출증", "mina", null,
  ["어? 마이폴 학생이네! 교문 밖으로 나온 거야? ㅋㅋ", "나는 블록 택배 사장 미나야. 이 도시는 전부 블록으로 되어 있어.", () => "곡괭이만 있으면 폐광에서 광석을 캘 수 있지. 블록폰(" + (c.isTouch ? "📱 폰 버튼" : ". 키") + ")의 🔨 제작 앱으로 하나 만들어 볼래?"],
  [{ k: "craft", item: "stick", n: 4, give: [["oak_planks", 8]], t: "블록폰 🔨 제작에서 막대기 만들기 (판자 8개 줬어요)" }, { k: "craft", item: "wooden_pickaxe", n: 1, t: "나무 곡괭이 만들기 (판자 3 · 막대기 2)" }, { k: "talk", t: "미나 누나에게 돌아가기" }],
  { co: 300, xp: 60, items: [["oak_planks", 32]] }, ["오, 손이 빠른데? 다음엔 택배 일 좀 도와줘!"]);
M("m2", "2장", "블록 택배", "mina", "m1",
  ["급한 택배가 두 개 있어! 엔더 택배는 빠른 게 생명이지.", () => "노란 기둥까지 시간 안에 가져다줘. 길가 공공 자전거나 내 탈것(" + (c.isTouch ? "탈것 버튼" : key("veh") + " 키") + ")을 타면 훨씬 빨라!"],
  [{ k: "goto", at: () => snap(38, -122), t: "택배 상자 받기", r: 2.6 }, { k: "goto", at: () => snap(-50, -186), t: "첫 번째 택배 배달", time: 80, r: 3 }, { k: "goto", at: () => snap(80, -250), t: "두 번째 택배 배달", time: 80, r: 3 }, { k: "talk", t: "미나 누나에게 돌아가기" }],
  { co: 700, xp: 120, unlock: "shop" }, ["최고! 이제 블록폰에 '엔더 택배' 앱 깔아 줄게. 필요한 건 거기서 주문해!"]);
M("m3", "3장", "정비소 친구", "rench", "m2",
  ["네가 미나가 말한 그 학생? 운전은 좀 해 봤어?", "탈것 타고 저기 노란 기둥까지 갔다 와 봐. 그리고… 경찰한테 한 번 쫓겨 보는 것도 경험이지 ㅋㅋ"],
  [{ k: "ride", t: () => "탈것 타기 (" + (c.isTouch ? "탈것 버튼" : key("veh") + " 키") + " · 길가 공공 자전거나 내 탈것)" }, { k: "goto", at: () => snap(40, -186), t: "탈것 타고 노란 기둥까지", time: 120, r: 3.5, ride: 1 }, { k: "wanted", lv: 1, t: "수배 ★1 받기 (무기로 건물을 부숴요)" }, { k: "escape", t: "경찰 따돌리기 (★ 없애기)" }, { k: "talk", t: "렌치 형에게 돌아가기" }],
  { co: 900, xp: 160, unlock: "mech", car: 1 }, ["역시! 선물로 내가 만든 블록카 줄게. 블록폰 연락처에서 나한테 전화하면 바로 가져다줄게.", "튜닝하고 싶으면 정비소로 와. 엔진 · 타이어 · 니트로 다 돼!"]);
M("m4", "4장", "금고 설계도", "doyun", "m3",
  ["쉿. 다이아 은행 금고 얘기 들었어? 벽이 전부 흑요석이래.", "흑요석 벽은 못 뚫어. 대신 금고 문은 TNT로 날리거나 다이아몬드 곡괭이로 뜯을 수 있지.", "먼저 은행에 가서 금고 문 사진부터 찍어 와. 블록폰(📱) 카메라 알지?"],
  [{ k: "goto", at: () => BANK.front, t: "다이아 은행 찾아가기", r: 4 }, { k: "photo", at: BANK.photo, t: "블록폰 카메라로 금고 문 사진 찍기 (은행 안에서)" }, { k: "have", any: [["diamond_pickaxe", 1], ["tnt_b", 1]], give: [["diamond", 3]], t: "다이아 곡괭이 만들기 (다이아 3개 줬어요 · 막대기 2 · 블록폰 🔨 제작) 또는 TNT 준비" }, { k: "talk", t: "도윤에게 돌아가기" }],
  { co: 1000, xp: 200, items: [["flint_and_steel", 1], ["tnt_b", 2]] }, ["완벽해. 까치 아저씨가 은행 앞에서 기다리고 있어. TNT 두 개랑 부싯돌도 챙겨 가."]);
M("m5", "5장", "다이아 은행 한탕", "kkachi", "m4",
  ["준비됐어? 금고 문을 TNT로 날리면 바로 ★4, 다이아 곡괭이로 조용히 뜯으면 조금 늦게 들켜.", "돈다발 4개 이상 챙기고 경찰을 완전히 따돌리면 성공이야. 같은 방 친구들도 같이 털 수 있어!"],
  [{ k: "vault", t: () => "금고 문 앞에서 " + (c.isTouch ? "대화 버튼" : key("use")) + " · TNT 또는 다이아 곡괭이로 열기" }, { k: "grab", n: 4, time: 120, t: "금고 상자에서 돈다발 챙기기" }, { k: "escape", bags: 1, t: "돈다발 들고 경찰 따돌리기 (★ 없애기)" }],
  { co: 2000, xp: 400, heist: 1 }, ["대박… 진짜 해냈네. 금고는 20분 뒤에 다시 차. 블록폰 미션 앱 확인해!"]);
const M5H = { id: "m5h", ch: "한탕", t: "다이아 은행 또 털기", giver: "kkachi", need: "m5", intro: ["금고가 다시 찼어. 이번에도 조용히… 아니면 화끈하게?"], steps: ST.list[4].steps, reward: { co: 1000, xp: 250, heist: 1 }, outro: ["또 해냈네 ㅋㅋ 20분 뒤에 또 봐."] };
const tx = v => (typeof v === "function" ? v() : v);
ST.def = id => { id = id || (ST.cur && ST.cur.id); return id === "m5h" ? M5H : ST.list.find(m => m.id === id); };
ST.stepOf = () => { const m = ST.cur && ST.def(); return m ? m.steps[ST.cur.step] : null; };
ST.whoOf = s => s.who || ST.def().giver;
ST.avail = k => {
  if (ST.cur) return null;
  const m = ST.list.find(m => m.giver === k && !ST.done[m.id] && (!m.need || ST.done[m.need]));
  if (m) return m;
  if (k === "kkachi" && ST.done.m5 && Date.now() >= ST.heistT) return M5H;
  return null;
};
ST.badge = () => (ST.cur ? 0 : Object.keys(GV).filter(k => ST.avail(k)).length);

// ── 화면: 위쪽 목표 알약 · 대화 창 · 영화 띠 ──
mpCss("mp-story-css", `
#mpobj{position:fixed;left:50%;top:calc(42px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:12;display:none;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:rgba(22,30,46,.9);color:#fff;font:600 13.5px "IBM Plex Sans KR",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);max-width:min(640px,calc(100vw - 32px));white-space:nowrap;pointer-events:none;box-sizing:border-box}
#mpobj.on{display:flex}
#mpobj b{color:#f5c542;flex:none}
#mpobj span{overflow:hidden;text-overflow:ellipsis;min-width:0}
#mpobj i{font-style:normal;font-variant-numeric:tabular-nums;color:#ffb4b6;flex:none}
#mpdlg{position:fixed;left:50%;bottom:calc(11vh + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:46;width:min(720px,calc(100vw - 32px));display:none;gap:14px;align-items:flex-start;padding:16px 18px;border-radius:16px;background:rgba(11,17,32,.95);border:1px solid rgba(240,196,106,.3);color:#fff;font-family:"IBM Plex Sans KR",sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.5);box-sizing:border-box}
#mpdlg.on{display:flex}
#mpdlg .av{font-size:40px;line-height:1;flex:none}
#mpdlg .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
#mpdlg .tx b{color:#f5c542;font-size:14px}
#mpdlg .tx p{margin:0;font-size:16px;line-height:1.55}
#mpdlg .bt{display:flex;gap:8px;justify-content:flex-end}
.mpcutb{position:fixed;left:0;right:0;height:9vh;background:#000;z-index:44;pointer-events:none;display:none}
#mpcutt{top:0}#mpcutd{bottom:0}
body.mpcut .mpcutb{display:block}
body.mpcut #hud,body.mpcut #mpphbtn,body.mpcut #qbar,body.mpcut #mcbar,body.mpcut #touch,body.mpcut #mpobj,body.mpcut #objm,body.mpcut #mpdig,body.mpcut #cross,body.mpcut #hotbar{visibility:hidden!important}
@media (max-height:480px){#mpobj{font-size:12px;padding:5px 12px}#mpdlg{padding:10px 14px;bottom:calc(10vh + env(safe-area-inset-bottom,0px))}#mpdlg .tx p{font-size:14px}#mpdlg .av{font-size:30px}}
`);
const objEl = mpEl("div", { id: "mpobj", "aria-live": "polite" });
const dlgEl = mpEl("div", { id: "mpdlg", role: "dialog", "aria-label": "대화" }, '<span class="av"></span><div class="tx"><b></b><p></p><div class="bt"><button class="mpbtn" data-mp="dlgskip">건너뛰기</button><button class="mpbtn pri" data-mp="dlgnext">다음 ▸</button></div></div>');
document.body.append(objEl, dlgEl, mpEl("div", { id: "mpcutt", class: "mpcutb" }), mpEl("div", { id: "mpcutd", class: "mpcutb" }));
// 노란 기둥 (본체 배달 미션과 같은 모양)
const MK = { pil: null };
const markerAt = (x, z) => {
  if (!S.root) return;
  if (!MK.pil) {
    const A = o => new v.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: o, blending: v.AdditiveBlending, depthWrite: false, side: v.DoubleSide, toneMapped: false });
    const g = new v.Group(), cg = new v.CylinderGeometry(1.1, 1.1, 90, 24, 1, true); cg.translate(0, 45, 0);
    const ring = new v.Mesh(new v.RingGeometry(1.15, 1.6, 32), A(.85)); ring.rotation.x = -Math.PI / 2; ring.position.y = .2;
    g.add(new v.Mesh(cg, A(.24)), ring);
    g.traverse(o => { o.renderOrder = 3; o.userData.noAO = true; o.layers.set(1); });
    MK.pil = g;
  }
  if (x == null || !S.out) { MK.pil.visible = false; return; }
  if (MK.pil.parent !== S.root) S.root.add(MK.pil);
  MK.pil.visible = true; MK.pil.position.set(x, 0, z);
};

// ── 대화 (컷신) ──
MP.hideFP = () => !!ST.cut || !!CAM.on;
ST.canTalk = () => !!(c.run && !c.bm && !c.invOn && !c.dg && !PH.on && !CAM.on && !ST.cut && !(J("menu") && !J("menu").hidden));
ST.say = (k, lines, done) => {
  const g = GV[k] || { n: "", ic: "💬" };
  ST.cut = { k, lines: lines.map(tx), i: 0, done, a: 0 };
  document.body.classList.add("mpcut");
  c.menuOn = true; for (const kk in rr) rr[kk] = 0; try { document.exitPointerLock?.(); } catch (e) {}
  dlgEl.querySelector(".av").textContent = g.ic; dlgEl.querySelector("b").textContent = g.n + (g.role ? " · " + g.role : "");
  dlgEl.classList.add("on"); ST.sayNext(0);
};
ST.sayNext = (d = 1) => {
  const cu = ST.cut; if (!cu) return;
  cu.i += d;
  if (cu.i >= cu.lines.length) return ST.sayEnd();
  dlgEl.querySelector("p").textContent = cu.lines[cu.i];
  dlgEl.querySelector('[data-mp="dlgnext"]').textContent = cu.i === cu.lines.length - 1 ? "좋아 ▸" : "다음 ▸";
  try { Lt("paper", 0, 1.3 + O() * .3); } catch (e) {}
};
ST.sayEnd = () => {
  const cu = ST.cut; ST.cut = null;
  dlgEl.classList.remove("on"); document.body.classList.remove("mpcut");
  c.menuOn = false; try { c.lockPointer?.(); } catch (e) {}
  if (cu && cu.done) try { cu.done(); } catch (e) { console.warn("[마이폴 확장] 미션", e); }
};
MP.click.dlgnext = () => ST.sayNext(1);
MP.click.dlgskip = () => { if (ST.cut) { ST.cut.i = ST.cut.lines.length - 1; ST.sayNext(1); } };
addEventListener("keydown", e => { if (!ST.cut) return; if (["Space", "Enter", "KeyF", "Escape"].includes(e.code)) { e.stopPropagation(); e.preventDefault(); if (e.repeat) return; if (e.code === "Escape") MP.click.dlgskip(); else ST.sayNext(1); } }, true);
MP.camHook = (() => { const prev = MP.camHook; return () => { prev && prev(); const cu = ST.cut; if (!cu) return; const n = NPCS[cu.k]; if (!n) return; cu.a += .0035; const r = 3.4, base = n.m.g.rotation.y; ot.position.set(n.x + Math.sin(base + .55 + cu.a) * r, n.y + 2, n.z + Math.cos(base + .55 + cu.a) * r); ot.lookAt(n.x, n.y + 1.4, n.z); ot.updateMatrixWorld(); }; })();

// ── 진행 ──
ST.start = id => {
  const m = ST.def(id);
  if (!m || ST.cur || !ST.canTalk()) return;
  ST.say(m.giver, m.intro, () => {
    ST.cur = { id: m.id, step: 0, prog: 0, gave: -1 };
    try { on(m.ch + " · " + m.t, "미션 시작", "pass"); } catch (e) {}
    ST.enter();
    mpSave();
  });
};
ST.enter = keep => {
  const s = ST.stepOf(); if (!s) return;
  const cu = ST.cur;
  if (!keep) cu.prog = 0;
  cu.tEnd = s.time ? Date.now() + s.time * 1000 : 0;
  if (s.give && cu.gave !== cu.step) { cu.gave = cu.step; for (const [it, n] of s.give) xM(it, n, 0); }
  cu.at = s.k === "goto" ? tx(s.at) : s.k === "talk" ? gvPos(ST.whoOf(s)) : s.k === "photo" || s.k === "vault" || s.k === "grab" ? BANK.front : null;
  if (cu.at) try { Oi.on = 1; Oi.x = cu.at[0]; Oi.z = cu.at[1]; } catch (e) {}
  if (s.k === "vault") HEIST.arm();
  if (s.k === "grab") HEIST.fill();
  if ((s.k === "wanted" || (s.k === "escape" && !s.bags)) && ua.s === "calm") setTimeout(() => { if (ST.stepOf() === s) { mpToast("🕊️ 평화 모드라 경찰 단계는 건너뛰어요", 2000); ST.next(); } }, 600);
  ST.hud();
};
ST.next = () => {
  const m = ST.def(); if (!m || !ST.cur) return;
  ST.cur.step++;
  try { Lt("xp", 0); } catch (e) {}
  if (ST.cur.step >= m.steps.length) return ST.pass();
  ST.enter(); mpSave();
};
ST.pass = () => {
  const m = ST.def(), r = m.reward || {};
  let co = r.co || 0, bags = 0;
  if (r.heist) { bags = mpHave("cash_bag"); co += bags * 600; mpTake("cash_bag", bags); ST.heistT = Date.now() + 20 * 60000; HEIST.reset(); MP.stat("heists"); }
  if (co) Pt(co, 1); if (r.xp) Ss(r.xp, 1);
  for (const [it, n] of r.items || []) xM(it, n, 1);
  if (r.unlock) PH.unlock[r.unlock] = 1;
  if (r.car && MP.car) MP.car.give();
  ST.done[m.id === "m5h" ? "m5" : m.id] = 1; ST.cur = null; markerAt(null); try { Oi.on = 0; } catch (e) {}
  setTimeout(() => { try { on("MISSION PASSED", m.ch + " " + m.t + (bags ? " · 돈다발 " + bags + "개" : "") + " · 코인 +" + Ge(co) + (r.xp ? " · 경험치 +" + r.xp : ""), "pass"); } catch (e) {} }, 300);
  if (r.unlock === "shop") setTimeout(() => mpToast("📱 블록폰에 📦 엔더 택배 앱이 열렸어요", 3000), 3700);
  if (r.unlock === "mech") setTimeout(() => mpToast("📱 블록폰 연락처에 🔧 렌치 형이 생겼어요", 3000), 3700);
  ST.hud(); mpSave();
  if (m.outro) setTimeout(() => {
    const n = NPCS[m.giver], P = c.P;
    if (n && Math.hypot(n.x - P.x, n.z - P.z) < 12 && ST.canTalk() && !ST.cur) ST.say(m.giver, m.outro);
    else mpToast("💬 " + GV[m.giver].n + ": " + tx(m.outro[0]), 4200);
  }, 3600);
};
ST.fail = why => {
  if (!ST.cur) return;
  const m = ST.def(); ST.cur = null; markerAt(null); try { Oi.on = 0; } catch (e) {}
  if (m && m.steps === M5H.steps) HEIST.reset();
  setTimeout(() => { try { on("MISSION FAILED", (m ? m.ch + " " + m.t + " · " : "") + why + " · " + (m ? GV[m.giver].n : "의뢰인") + "에게 가면 다시 해요", "dead"); } catch (e) {} }, 3900);
  ST.hud(); mpSave();
};
ST.quit = () => {
  if (!ST.cur) return;
  const m = ST.def(); ST.cur = null; markerAt(null); try { Oi.on = 0; } catch (e) {}
  if (m && m.steps === M5H.steps) { HEIST.reset(); if (mpHave("cash_bag")) { mpTake("cash_bag", mpHave("cash_bag")); mpToast("💰 미션을 그만둬서 돈다발은 까치에게 돌려줬어요", 2400); } }
  mpToast("🎯 미션을 그만뒀어요", 1600); ST.hud(); mpSave();
};
MP.click.misgo = k => { const [x, z] = gvPos(k); try { Oi.on = 1; Oi.x = x; Oi.z = z; } catch (e) {} PH.close(); mpToast("📍 " + GV[k].n + "에게 길 안내 · 미니맵 보라색 선을 따라가요", 2200); };
MP.click.misquit = () => { ST.quit(); PH.render(); };

ST.objText = () => {
  const s = ST.stepOf(), cu = ST.cur; if (!s) return "";
  let t = tx(s.t);
  if (s.k === "craft") t += ` (${Math.min(cu.prog, s.n)}/${s.n})`;
  if (s.k === "grab") t += ` (${mpHave("cash_bag")}/${s.n})`;
  if (s.k === "talk") t = GV[ST.whoOf(s)].n + "에게 가서 " + (c.isTouch ? "대화 버튼" : key("use")) + " · " + t;
  if ((s.k === "grab" || s.k === "escape") && HEIST.quietAt) t = "🤫 경보까지 " + Math.max(0, Math.ceil((HEIST.quietAt - mpNow()) / 1000)) + "초 · " + t;
  return t;
};
ST.hud = () => {
  const m = ST.def();
  if (!ST.cur || !m || !c.run || c.bm) { objEl.classList.remove("on"); return; }
  const left = ST.cur.tEnd ? Math.max(0, Math.ceil((ST.cur.tEnd - Date.now()) / 1000)) : null;
  objEl.innerHTML = `<b>🎯 ${m.ch} ${ae(m.t)}</b><span>${ae(ST.objText())}</span>${left != null ? `<i>⏱ ${left}초</i>` : ""}`;
  objEl.classList.add("on");
};
const stTick = dt => {
  if ((ST.ht = (ST.ht || 0) - dt) <= 0) { ST.ht = .5; ST.hud(); }
  if (ST.cut || !ST.cur) { if (!ST.cur) markerAt(null); return; }
  const s = ST.stepOf(), cu = ST.cur, P = c.P; if (!s) return;
  if (cu.tEnd && Date.now() > cu.tEnd) return ST.fail("시간이 다 됐어요");
  markerAt(cu.at && (s.k === "goto" || s.k === "talk") ? cu.at[0] : null, cu.at && cu.at[1]);
  if (s.k === "goto") {
    if (S.out && Math.hypot(P.x - cu.at[0], P.z - cu.at[1]) < (s.r || 3)) {
      if (s.ride && !et.on && !c.mpCar) { if (mpNow() - (cu.warn || 0) > 2500) { cu.warn = mpNow(); mpToast("🛴 탈것을 타고 와야 해요!", 1600); } }
      else { if (s.time) try { q("coin"); } catch (e) {} ST.next(); }
    }
  }
  else if (s.k === "ride") { if (et.on || c.mpCar) ST.next(); }
  else if (s.k === "wanted") { if (ne.lv >= (s.lv || 1)) ST.next(); }
  else if (s.k === "escape") { if (s.bags && !mpHave("cash_bag")) return ST.fail("돈다발을 다 잃어버렸어요"); if (!ne.lv && S.out && (!s.bags || !HEIST.quietAt)) ST.next(); }
  else if (s.k === "have") { if (s.any.some(([it, n]) => mpHave(it) >= n)) ST.next(); }
  else if (s.k === "craft") { if (cu.prog >= s.n) ST.next(); }
  else if (s.k === "vault") { if ((HEIST.ct = (HEIST.ct || 0) - dt) <= 0) { HEIST.ct = .25; if (HEIST.opened()) { HEIST.alarm(); ST.next(); } } }
  else if (s.k === "grab") { if (mpHave("cash_bag") >= s.n) ST.next(); }
};
{ // 만들기 · 사진 세기
  const pC = MP.onCraft; MP.onCraft = (o, n) => { pC && pC(o, n); const s = ST.stepOf(); if (s && s.k === "craft" && o === s.item) { ST.cur.prog += n; ST.hud(); } };
  const pPh = MP.onPhoto; MP.onPhoto = info => {
    pPh && pPh(info); const s = ST.stepOf(); if (!s || s.k !== "photo") return;
    const [tX, tY, tZ] = s.at, dx = tX - info.pos.x, dy = tY - info.pos.y, dz = tZ - info.pos.z, d = Math.hypot(dx, dy, dz);
    const cos = (dx * info.dir.x + dy * info.dir.y + dz * info.dir.z) / (d || 1);
    const inside = info.pos.x > BANK.x0 - 2 && info.pos.x < BANK.x1 + 2 && info.pos.z > BANK.z0 && info.pos.z < BANK.z1 + 9;
    if (d < 24 && cos > .88 && inside) { xM("map_photo", 1, 1); setTimeout(() => { CAM.close(); ST.next(); }, 700); mpToast("📸 금고 문 사진 완벽해!", 1800); }
    else mpToast(!inside || d >= 24 ? "📸 금고 문이 안 보여요 · 은행 안으로 들어가서 찍어요" : "📸 금고 문이 화면 가운데 오게 찍어요", 2000);
  };
}
{ // 쓰러지거나 붙잡히면 실패
  const oY = aee; aee = function () { const r = oY.apply(this, arguments); if (ST.cur) ST.fail("쓰러졌어요"); return r; };
  const oM = yd; yd = function () { const heist = !!(ST.cur && ST.def().steps === M5H.steps); const r = oM.apply(this, arguments); if (heist && mpHave("cash_bag")) { mpTake("cash_bag", mpHave("cash_bag")); setTimeout(() => mpToast("🚓 경찰이 돈다발을 전부 가져갔어요", 2400), 1200); } if (ST.cur) ST.fail("붙잡혔어요 (BUSTED)"); return r; };
}

// ── 한탕 ──
const HEIST = (MP.heist = { on: 0, open: 0, filled: 0, tntT: -1e9, quietAt: 0, until: 0 });
HEIST.opened = () => {
  const ch = mpChunkAt(102, -211); if (!ch || !ch.G || !ch.Q.bank) return false;
  for (const b of ch.Q.bb) {
    if (!b.vault || b[6] === MPI.newBlocks.chest || b[6] === rn.gold_block) continue;
    for (let yy = b[1]; yy < b[4]; yy++) for (let z = b[2]; z < b[5]; z++) for (let x = b[0]; x < b[3]; x++) if (!Hr(x, yy, z)) return true;
  }
  return false;
};
HEIST.arm = () => { HEIST.on = 1; HEIST.open = 0; HEIST.filled = 0; HEIST.quietAt = 0; HEIST.until = 0; };
HEIST.alarm = () => {
  if (HEIST.open) return; HEIST.open = 1;
  const loud = mpNow() - HEIST.tntT < 5000;
  if (loud) HEIST.siren(900);
  else { HEIST.quietAt = mpNow() + 9000; mpToast("🤫 조용히 열었어요… 9초 뒤에 경보가 울려요! 빨리 챙겨요", 2800); }
  HEIST.fill();
  mpNet("mhv", [loud ? 1 : 0]);
};
HEIST.siren = heat => {
  try { u0(heat, "경찰"); Lt("alarm", 0); } catch (e) {}
  mpToast(heat >= 650 ? "💥 금고 문이 날아갔어요! 🚨 수배 ★★★★" : "🚨 다이아 은행 경보가 울려요!", 2600);
  setTimeout(() => { try { Ae('📻 경찰 무전: "다이아 은행 금고털이 발생! 전 차량 출동!"', 2600); } catch (e) {} }, 1400);
};
HEIST.fill = () => {
  if (HEIST.filled) return; HEIST.filled = 1;
  for (const [x, yy, z] of BANK.chests) {
    const a = Array(27).fill(null);
    a[2] = { id: "cash_bag", n: 1 + (O() < .5 ? 1 : 0), en: 0, to: "" };
    a[6] = { id: "cash_bag", n: 1 + (O() < .4 ? 1 : 0), en: 0, to: "" };
    a[13] = { id: "gold_ingot", n: 2 + (O() * 4 | 0), en: 0, to: "" };
    if (O() < .5) a[20] = { id: "diamond", n: 1, en: 0, to: "" };
    S.op[CHS.id(x, yy, z)] = a;
  }
};
HEIST.reset = () => {
  HEIST.on = 0; HEIST.open = 0; HEIST.filled = 0; HEIST.quietAt = 0; HEIST.until = 0;
  for (const [x, yy, z] of BANK.chests) S.op[CHS.id(x, yy, z)] = Array(27).fill(null);
  const fix = () => {
    if (HEIST.on) return;
    const P = c.P, v = BANK.vault;
    if (P.x > v.x0 - 1 && P.x < v.x1 + 1 && P.z > v.z0 - 1 && P.z < v.z1 + 1.5) { setTimeout(fix, 6000); return; }
    const ch = S.ch.get(mpKeyOf(BANK.cx, BANK.cz));
    if (ch && ch.G && !ch.lod) { xS(ch); ch.rb = 1; S.dirty = 1; }
  };
  setTimeout(fix, 2500);
};
// TNT 불 붙이기 (4초 뒤 펑) — 금고 문 앞 TNT · 친구가 붙인 TNT
const TNTS = [];
MP.light = (x, yy, z, mine, heist) => {
  if (Hr(x, yy, z) !== rn.tnt) return;
  BLD.setBlock(x, yy, z, 0, mine ? 0 : 1);
  if (mine) mpNet("mt", [x, yy, z]);
  const m = new v.Mesh(new v.BoxGeometry(.98, .98, .98), new v.MeshBasicMaterial({ color: 0xffffff }));
  m.position.set(x + .5, yy + .5, z + .5); S.root.add(m);
  TNTS.push({ m, x: x + .5, y: yy + .5, z: z + .5, t: 4, mine, heist });
  try { Lt("fuse", Math.hypot(x - c.P.x, z - c.P.z)); } catch (e) {}
  if (mine) mpToast("🧨 쉬이익… 4초 뒤에 터져요! 멀리 떨어져요", 1800);
};
// 금고 문: 한탕 중에 문 앞에서 F (대화 버튼) → 🧨 TNT로 날리기 (시끄럽게 · ★4) 또는 ⛏️ 다이아 곡괭이로 조용히 뜯기
const VD = BANK.vdoor;
const vdoorCells = () => { const L = []; for (let x = VD.x0; x < VD.x1; x++) for (let yy = 0; yy < VD.y1; yy++) if (Hr(x, yy, VD.z) === VDOOR) L.push([x, yy, VD.z]); return L; };
const vdoorOff = () => { for (const [x, yy, z] of vdoorCells()) { BLD.setBlock(x, yy, z, 0); mpNet("mb", [x, yy, z]); } };
const mpChip = (ok, t) => `<span class="mpchip ${ok ? "ok" : "no"}">${ok ? "✓" : "✕"} ${t}</span>`;
HEIST.doorMenu = () => {
  if (!ST.canTalk()) return;
  const tnt = mpHave("tnt_b"), fl = mpHave("flint_and_steel") > 0, tm = BLD.mineTime(VDOOR), dia = tm.t < 1e8;
  Br(`<i data-view="mpvault" hidden></i><h2>💰 금고 문 열기</h2><div class="mpnote">문이 열리면 금고 상자에서 돈다발 4개를 챙기고 경찰을 따돌려요</div><div class="mplist">`
    + `<div class="mprow"><span class="ic">🧨</span><span class="tx"><b>TNT로 날리기</b><span class="mpsub">문 앞에 TNT를 놓고 불을 붙여요 · 4초 뒤 펑 · 바로 수배 ★4</span><span>${mpChip(tnt > 0, "TNT " + tnt + "개")} ${mpChip(fl, "부싯돌과 부시")}</span></span><span class="bt"><button class="mpbtn pri" data-mp="vtnt"${tnt && fl ? "" : " disabled"}>설치</button></span></div>`
    + `<div class="mprow"><span class="ic">⛏️</span><span class="tx"><b>다이아 곡괭이로 조용히 뜯기</b><span class="mpsub">${dia ? "약 " + Math.ceil(tm.t) + "초 · " : ""}문이 열리고 9초 뒤에 경보가 울려요</span><span>${mpChip(dia, "다이아 곡괭이")}</span></span><span class="bt"><button class="mpbtn pri" data-mp="vdig"${dia ? "" : " disabled"}>뜯기</button></span></div>`
    + `</div>`);
};
HEIST.plantTnt = () => {
  if (!mpHave("tnt_b") || !mpHave("flint_and_steel")) return mpToast("🧨 TNT와 부싯돌과 부시가 있어야 해요 (블록폰 🔨 제작)", 2000);
  const fz = VD.z + 1, spot = [VD.x0, VD.x1 - 1].find(x => !Hr(x, 0, fz));
  if (spot == null) return mpToast("🧨 문 앞이 막혀 있어요", 1600);
  mpTake("tnt_b", 1);
  BLD.setBlock(spot, 0, fz, rn.tnt, 0, 1); mpNet("mp", [spot, 0, fz, rn.tnt]);
  MP.light(spot, 0, fz, 1, 1); mpSave();
};
HEIST.digDoor = () => {
  const tm = BLD.mineTime(VDOOR), cells = vdoorCells();
  if (tm.t >= 1e8) return mpToast("⛏️ 다이아 곡괭이가 있어야 금고 문을 뜯어요 (다이아 3 · 막대기 2 · 블록폰 🔨 제작)", 2400);
  if (!cells.length) return;
  const [x, yy, z] = cells[0];
  BLD.dig({ x, y: yy, z, id: VDOOR }, { t: tm.t, r: 3, label: "⛏️ 금고 문 뜯는 중", tag: "vault", snd: "st_metal", done: () => {
    vdoorOff();
    try { Lt("brk_stone", 0, .8); } catch (e) {}
    MP.fx((VD.x0 + VD.x1) / 2, 1.5, VD.z + .5, [.85, .85, .9], 16, 2.2, .25);
  } });
};
MP.click.vtnt = () => { Fi(); try { c.lockPointer?.(); } catch (e) {} HEIST.plantTnt(); };
MP.click.vdig = () => { Fi(); try { c.lockPointer?.(); } catch (e) {} HEIST.digDoor(); };
const vaultNear = (L, P) => {
  const s = ST.stepOf();
  if (!s || s.k !== "vault" || !HEIST.on || HEIST.open) return;
  const fx = (VD.x0 + VD.x1) / 2, fz = VD.z + 1.3;
  if (Math.hypot(P.x - fx, P.z - fz) > 3.2 || !vdoorCells().length) return;
  const lit = TNTS.some(t => t.heist), busy = BLD.job && BLD.job.tag === "vault";
  L.push({ x: fx, z: fz, y: P.y, r: 3.2, l: lit ? "🧨 곧 터져요! 멀리 떨어져요" : busy ? "⛏️ 금고 문 뜯는 중…" : "💰 금고 문 열기 (TNT · 다이아 곡괭이)", fn: () => { if (!lit && !busy) HEIST.doorMenu(); } });
};
const tntTick = dt => {
  for (const t of TNTS.slice()) {
    t.t -= dt; t.m.material.color.setHex(Math.floor(t.t * 6) % 2 ? 0xffffff : 0xe5484d); t.m.scale.setScalar(1 + (t.t < 1 ? (1 - t.t) * .15 : 0));
    if (t.t <= 0) {
      t.m.parent && t.m.parent.remove(t.m); TNTS.splice(TNTS.indexOf(t), 1);
      if (Math.hypot(t.x - 102, t.z + 210.5) < 12) HEIST.tntT = mpNow();
      if (t.mine) try { fp(t.x, t.y, t.z, 4); Ne.shake = Math.max(Ne.shake || 0, .5); } catch (e) { console.warn("[마이폴 확장] TNT", e); }
      if (t.heist) try { vdoorOff(); } catch (e) {}   // 금고 문 앞 TNT는 문을 꼭 날려요
    }
  }
};
// 금고 상자: 한탕 중에만
{
  const prev = CHS.open;
  CHS.open = (x, yy, z, st) => {
    const isV = inBank(x, z) && BANK.chests.some(a => a[0] === x && a[1] === yy && a[2] === z);
    if (!isV) return prev(x, yy, z, st);
    if (!(HEIST.on && HEIST.open)) return mpToast(HEIST.on ? "🔒 금고 문부터 열어요" : "🔒 텅 빈 금고예요 · 까치의 한탕 미션 중에만 돈다발이 들어 있어요", 2200);
    return prev(x, yy, z, "mpvault");
  };
}
// 친구 따라 같이 털기 · 친구가 붙인 TNT
const stNet = (k, e) => {
  if (k === "mhv") {
    const P = c.P;
    if (Math.hypot(P.x - BANK.front[0], P.z - BANK.front[1]) < 90 && !HEIST.on) { HEIST.on = 1; HEIST.open = 1; HEIST.filled = 0; HEIST.fill(); HEIST.until = Date.now() + 5 * 60000; mpToast("💰 친구가 다이아 은행 금고를 열었어요! 금고 상자에서 돈다발을 챙겨요", 3000); }
    return true;
  }
  if (k === "mt") { const [x, yy, z] = e.slice(2).map(Number); if (isFinite(x) && isFinite(yy) && isFinite(z)) MP.light(x, yy, z, 0); return true; }
  return false;
};
const heistTick = () => {
  if (HEIST.quietAt && mpNow() > HEIST.quietAt) { HEIST.quietAt = 0; HEIST.siren(260); }
  if (HEIST.on && !ST.cur && HEIST.until && Date.now() > HEIST.until) HEIST.reset();
};

// ── 바리케이드: 경찰이 막히면 내가 놓은 블록을 부숴요 ──
const BAR = { t: 0, last: new WeakMap(), warn: 0 };
const barTick = dt => {
  if ((BAR.t -= dt) > 0) return; BAR.t = 1.2;
  if (!ne.lv || !S.out || !(BLD.put.size || BLD.rput.size)) return;
  const P = c.P;
  for (const s of ne.cops) {
    if (!s || s.dead) continue;
    const d = Math.hypot(s.x - P.x, s.z - P.z); if (d > 14 || d < 1.5) continue;
    const prev = BAR.last.get(s), moved = prev ? Math.hypot(prev[0] - s.x, prev[1] - s.z) : 9;
    BAR.last.set(s, [s.x, s.z]);
    if (moved > .5) continue;
    const ux = (P.x - s.x) / d, uz = (P.z - s.z) / d;
    let best = null, bd = 9;
    for (let t = .5; t < 3; t += .5) for (let yy = 0; yy < 3; yy++) {
      const x = Math.floor(s.x + ux * t), z = Math.floor(s.z + uz * t), cx = Math.floor(x / 64), cz = Math.floor(z / 64), kk = mpKeyOf(cx, cz), li = Es(x - cx * 64, yy, z - cz * 64);
      const mine = (BLD.put.get(kk) && BLD.put.get(kk).has(li)) || (BLD.rput.get(kk) && BLD.rput.get(kk).has(li));
      if (mine && Hr(x, yy, z) && t < bd) { bd = t; best = [x, yy, z]; }
    }
    if (best) {
      const id = Hr(best[0], best[1], best[2]);
      BLD.setBlock(best[0], best[1], best[2], 0); mpNet("mb", best);
      try { Lt(mpBrkSnd(Kt[id]), Math.hypot(best[0] - P.x, best[2] - P.z)); } catch (e) {}
      MP.fx(best[0] + .5, best[1] + .5, best[2] + .5, [.75, .75, .78], 8, 2.2, .22);
      if (mpNow() - BAR.warn > 6000) { BAR.warn = mpNow(); mpToast("🚓 경찰이 바리케이드를 부숴요!", 1600); }
    }
  }
};

// ── 가까이 가면: 의뢰인과 말하기 ──
const stNear = (L, P) => {
  if (!S.out || ST.cut) return;
  vaultNear(L, P);
  for (const n of Object.values(NPCS)) {
    if (Math.hypot(n.x - P.x, n.z - P.z) > 2.6) continue;
    const g = GV[n.k], s = ST.stepOf();
    if (s && s.k === "talk" && ST.whoOf(s) === n.k) { L.push({ x: n.x, z: n.z, y: n.y, r: 2.6, l: "💬 " + g.n + "에게 말하기", fn: () => ST.next() }); continue; }
    const m = ST.avail(n.k);
    if (m) L.push({ x: n.x, z: n.z, y: n.y, r: 2.6, l: `🎯 [${m.ch}] ${m.t} — 미션 시작`, fn: () => ST.start(m.id) });
    else L.push({ x: n.x, z: n.z, y: n.y, r: 2.6, l: "💬 " + g.n + "와 이야기하기", fn: () => ST.canTalk() && ST.say(n.k, [ST.chat(n.k)]) });
  }
};
ST.chat = k => {
  const L = {
    mina: ["엔더 택배는 순간이동 배송이야. 진짜야!", "폐광에서 곡괭이로 광석을 캐면 좋은 재료가 나와. 무기로 건물을 부수면 코인만 나오고!", "땅을 사면 침대랑 작은 밭이 생겨. 블록폰 부동산 앱 봐 봐!"],
    rench: ["정비소 '괴산 커스텀'은 24시간 영업이지 ㅋㅋ", "수배 ★이 있으면 택시가 안 태워 줘. 정비사한테 도색부터 해!", "경찰이 너무 많으면 폐광으로 내려가 봐. 거기까진 못 따라와!"],
    doyun: ["흑요석 벽은 TNT로도 안 뚫려. 금고 문을 노려.", "금고 문은 TNT로 날리면 바로 ★4, 다이아 곡괭이로 뜯으면 조용하지.", "찍은 사진은 블록폰 사진첩에 남아."],
    kkachi: ["한탕은 같이 하면 더 쉬워. 같은 방 친구를 불러!", "돈다발은 경찰을 다 따돌려야 진짜 코인이 돼.", "다이아 은행 금고는 20분마다 다시 찬다더라."],
  }[k] || ["…"];
  return L[O() * L.length | 0];
};

// 블록폰 미션 앱
ST.phoneHtml = () => {
  const cur = ST.cur && ST.def();
  let h = "";
  if (cur) h += `<div class="mpcard"><b>▶ 하는 중 · ${cur.ch} ${ae(cur.t)}</b><span class="mpsub">${ae(ST.objText())}</span><button class="mpbtn" data-mp="misquit">그만두기</button></div>`;
  h += ST.list.map(m => {
    const open = !m.need || ST.done[m.need], st = ST.done[m.id] ? "✅ 끝" : ST.cur && ST.cur.id === m.id ? "▶ 하는 중" : open ? "🎯 할 수 있어요" : "🔒 앞 장을 먼저";
    const g = GV[m.giver];
    return `<div class="mpcard"><div class="row2"><span style="font-size:24px">${g.ic}</span><span class="tx"><b>${m.ch} ${ae(m.t)}</b><span>${ae(g.n)} · ${st}</span></span>${!ST.done[m.id] && open && !ST.cur ? `<button class="mpbtn pri" data-mp="misgo:${m.giver}">길 안내</button>` : ""}</div></div>`;
  }).join("");
  if (ST.done.m5) { const left = Math.max(0, Math.ceil((ST.heistT - Date.now()) / 60000)); h += `<div class="mpcard"><b>💰 다이아 은행 또 털기</b><span class="mpsub">${left ? left + "분 뒤에 금고가 다시 차요" : "금고가 찼어요! 까치에게 가요"}</span>${!left && !ST.cur ? `<button class="mpbtn pri" data-mp="misgo:kkachi">길 안내</button>` : ""}</div>`; }
  return h + `<p class="mpsub">미션은 바깥 도시에서 해요 · 쓰러지거나 붙잡히면 실패예요</p>`;
};

// 지도 표시
const stMarks = (ctx, X, Z, big) => {
  ctx.save(); ctx.font = (big ? 24 : 34) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (!ST.cur) for (const k of Object.keys(GV)) if (ST.avail(k)) { const [x, z] = gvPos(k); ctx.fillText("🎯", X(x), Z(z)); }
  ctx.fillText("🏦", X(102), Z(-209));
  if (ST.cur && ST.cur.at) { ctx.fillStyle = "#ffd400"; ctx.strokeStyle = "#3a2a00"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(ST.cur.at[0]), Z(ST.cur.at[1]), big ? 8 : 11, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};

de.add({
  id: "mp_story", name: "이야기 미션 · 한탕 · 바리케이드", need: ["mp_phone", "mp_craft", "want", "boom", "map"],
  gives: "MP.story 5장 미션 (가상 인물 미나 · 렌치 · 도윤 · 까치) · MP.heist 다이아 은행 금고 (문 앞에서 F: TNT · 다이아 곡괭이) · MP.bank 은행 · 경찰이 놓인 블록(바리케이드) 부수기",
  chunkGen: bankGen, grid: bankGrid, net: stNet, near: stNear,
  tick: dt => {
    if ((ST.nt = (ST.nt || 0) - dt) <= 0) { ST.nt = 1; npcSync(); }
    npcTick(dt); stTick(dt); tntTick(dt); barTick(dt); heistTick();
    if (ST.cut || CAM.on) for (const k in c.WM || {}) c.WM[k].visible = false;   // 컷신 · 사진 모드에서는 무기를 숨겨요
  },
  miniMarks: (ctx, X, Z) => stMarks(ctx, X, Z, 0),
  bigMarks: (ctx, X, Z) => stMarks(ctx, X, Z, 1),
  miniEdge: f => { if (ST.cur && ST.cur.at) f(ST.cur.at[0], ST.cur.at[1], "#ffd400"); },
  save: e => { e.mps = { v: 1, done: ST.done, cur: ST.cur && { id: ST.cur.id, step: ST.cur.step, prog: ST.cur.prog, gave: ST.cur.gave }, heistT: ST.heistT }; },
  load: e => {
    const d = e && e.mps; ST.done = {}; ST.cur = null; ST.heistT = 0; HEIST.on = 0;
    if (!d || typeof d !== "object") return;
    if (d.done && typeof d.done === "object") for (const k in d.done) if (/^m[1-5]$/.test(k)) ST.done[k] = 1;
    ST.heistT = Math.min(+d.heistT || 0, Date.now() + 20 * 60000);
    const cu = d.cur;
    if (cu && typeof cu === "object" && ST.def(cu.id) && ST.def(cu.id).steps !== M5H.steps && !ST.done[cu.id]) {
      const m = ST.def(cu.id);
      ST.cur = { id: cu.id, step: mpClamp(cu.step | 0, 0, m.steps.length - 1), prog: Math.max(0, cu.prog | 0), gave: cu.gave | 0 };
      if (m.steps[ST.cur.step].time) ST.cur.step = Math.max(0, ST.cur.step - 1);   // 시간 재는 배달은 앞 단계부터
      setTimeout(() => ST.cur && ST.enter(1), 1500);
    }
  },
  newGame: () => { ST.done = {}; ST.cur = null; ST.heistT = 0; HEIST.on = 0; },
  dbg: { MPS: ST, MPHEIST: HEIST, MPBANK: BANK },
});
