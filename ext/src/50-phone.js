/* ───────────── 3단계: 블록폰 (게임 속 휴대폰) ─────────────
   바로가기의 📱 · 키보드 . (마침표) · 휴대폰 화면은 위쪽 바로가기 줄의 '폰'
   앱: 지도 · 미션 · 연락처 · 카메라 · 사진첩 · 은행 · 엔더 택배 · 부동산 · 제작 · 기록 */

const PH = (MP.phone = { on: false, app: "home", bank: 0, photos: [], unlock: {}, stats: {}, filter: "", selfie: false });
const PH_KEY = "mypaul_mpphotos";
try { const a = JSON.parse(localStorage.getItem(PH_KEY) || "[]"); if (Array.isArray(a)) PH.photos = a.slice(-8); } catch (e) {}
const phSavePhotos = () => { try { localStorage.setItem(PH_KEY, JSON.stringify(PH.photos.slice(-8))); } catch (e) {} };
MP.stat = (k, n = 1) => { PH.stats[k] = (PH.stats[k] || 0) + n; };

mpCss("mp-phone-css", `
#mpphone{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:flex-end;padding:0 max(18px,env(safe-area-inset-right,0px)) 0 18px;background:rgba(5,8,16,.25);pointer-events:auto}
#mpphone[hidden]{display:none!important}
#mpphone .ph{width:min(340px,92vw);height:min(640px,calc(100dvh - 36px));border-radius:34px;background:#0e1424;border:3px solid #2a3550;box-shadow:0 24px 70px rgba(0,0,0,.6),inset 0 0 0 2px #000;display:flex;flex-direction:column;overflow:hidden;color:#fff;font-family:"IBM Plex Sans KR",sans-serif}
#mpphone .phs{display:flex;justify-content:space-between;align-items:center;padding:12px 22px 6px;font:700 13px "IBM Plex Sans KR",sans-serif;color:#dfe6f1}
#mpphone .phb{flex:1;min-height:0;overflow:auto;padding:6px 16px 12px}
#mpphone .phn{display:flex;justify-content:center;gap:16px;padding:8px 0 14px}
#mpphone .phn button{width:120px;height:6px;border-radius:3px;border:0;background:rgba(255,255,255,.55);cursor:pointer;padding:0}
#mpphone .phh{display:flex;align-items:center;gap:8px;margin:2px 0 12px}
#mpphone .phh button{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;padding:6px 10px;font:600 13px "IBM Plex Sans KR",sans-serif;cursor:pointer;min-height:34px}
#mpphone .phh b{font-size:17px}
#mpphone .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px 10px;margin-top:10px}
#mpphone .app{display:flex;flex-direction:column;align-items:center;gap:6px;border:0;background:none;color:#fff;cursor:pointer;font:600 12px "IBM Plex Sans KR",sans-serif;padding:0;position:relative}
#mpphone .app i{width:58px;height:58px;border-radius:16px;display:grid;place-items:center;font-style:normal;font-size:28px;background:var(--a,#26324d);box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
#mpphone .app em{position:absolute;top:-4px;right:12px;min-width:18px;height:18px;border-radius:9px;background:#e5484d;font:700 11px/18px "IBM Plex Sans KR",sans-serif;font-style:normal}
#mpphone .clock{text-align:center;margin:14px 0 4px;font:700 46px "IBM Plex Sans KR",sans-serif;letter-spacing:-.02em}
#mpphone .date{text-align:center;color:#b8c4d6;font-size:13px;margin-bottom:8px}
#mpphone .mpcard{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;margin-bottom:10px}
#mpphone .row2{display:flex;align-items:center;gap:10px}
#mpphone .row2 .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
#mpphone .row2 .tx b{font-size:14px}
#mpphone .row2 .tx span{font-size:12px;color:#b8c4d6}
#mpphone .big{font:700 28px "IBM Plex Sans KR",sans-serif;font-variant-numeric:tabular-nums}
#mpphone .pg{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#mpphone .pg img{width:100%;border-radius:10px;display:block;cursor:pointer}
#mpphone input[type=number]{width:100%;box-sizing:border-box;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.3);color:#fff;font:600 15px "IBM Plex Sans KR",sans-serif}
#qbar button#mpqph i{font-size:18px}
@media (max-height:560px){#mpphone .clock{font-size:34px;margin:6px 0 2px}#mpphone .date{margin-bottom:4px}#mpphone .grid{gap:10px 8px;margin-top:4px}#mpphone .app i{width:46px;height:46px;font-size:22px;border-radius:13px}#mpphone .phs{padding:8px 20px 4px}#mpphone .phn{padding:4px 0 8px}}
body.mpphoto #hud,body.mpphoto #qbar,body.mpphoto #mcbar,body.mpphoto #xpb,body.mpphoto #skb,body.mpphoto #touch,body.mpphoto #mpobj,body.mpphoto #mpdig,body.mpphoto #gtabig{visibility:hidden!important}
#mpcam{position:fixed;inset:0;z-index:41;pointer-events:none;display:none}
body.mpphoto #mpcam{display:block}
#mpcam .fr{position:absolute;inset:6%;border:2px solid rgba(255,255,255,.7);border-radius:6px}
#mpcam .bar{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:8px;align-items:center;pointer-events:auto;background:rgba(11,17,32,.82);padding:8px;border-radius:999px}
#mpcam .bar button{min-width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:600 12.5px "IBM Plex Sans KR",sans-serif;cursor:pointer;padding:0 12px}
#mpcam .bar button.shut{width:62px;height:62px;border-radius:50%;background:#fff;border:4px solid #f5c542;padding:0}
#mpcam .bar button.on{background:#f5c542;color:#1b1f27}
#mpcam .bar kbd{margin-left:5px;font:700 10px "IBM Plex Sans KR",sans-serif;opacity:.7;background:rgba(0,0,0,.35);border-radius:4px;padding:1px 4px}
@media (pointer:coarse){#mpcam .bar kbd{display:none}#mpcam .bar{gap:5px;padding:6px}#mpcam .bar button{padding:0 9px;min-width:40px;height:40px}}
#mpflash{position:fixed;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:42;transition:opacity .35s}
`);
const phWrap = mpEl("div", { id: "mpphone", hidden: "" }, '<div class="ph" role="dialog" aria-label="블록폰"><div class="phs"><span id="mpphst">08:30</span><span>📶 블록텔 · 🔋</span></div><div class="phb" id="mpphb"></div><div class="phn"><button data-mp="phhome" aria-label="홈"></button></div></div>');
const camUI = mpEl("div", { id: "mpcam" }, '<div class="fr"></div><div class="bar"><button data-mp="camf:">원본<kbd>1</kbd></button><button data-mp="camf:bw">흑백<kbd>2</kbd></button><button data-mp="camf:warm">따뜻<kbd>3</kbd></button><button data-mp="camf:pop">선명<kbd>4</kbd></button><button class="shut" data-mp="camshot" aria-label="찍기 (Space)"></button><button data-mp="camself">셀카<kbd>Q</kbd></button><button data-mp="camx">닫기<kbd>Esc</kbd></button></div>');
const flash = mpEl("div", { id: "mpflash" });
document.body.append(phWrap, camUI, flash);
phWrap.addEventListener("click", e => { if (e.target === phWrap) PH.close(); });

const phTime = () => { const m = Math.floor((c.gm || 0) % 1440); return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
PH.badge = () => (MP.story && MP.story.badge ? MP.story.badge() : 0);
PH.open = (app) => {
  if (!c.run || c.bm || c.pvLock || PH.on && !app) { if (PH.on) PH.close(); return; }
  PH.on = true; PH.app = app || "home";
  c.menuOn = true; try { c.stopRot?.(); document.exitPointerLock?.(); } catch (e) {}
  for (const k in rr) rr[k] = 0;
  phWrap.hidden = false; PH.render(); q("click");
};
PH.close = () => {
  if (!PH.on) return;
  PH.on = false; phWrap.hidden = true;
  c.menuOn = false; try { c.lockPointer?.(); } catch (e) {}
};
MP.click.phhome = () => { PH.app = "home"; PH.render(); };
MP.click.phapp = a => { PH.app = a; PH.render(); };
MP.click.phone = () => PH.open();
MP.click.phx = () => PH.close();
addEventListener("keydown", e => {
  const t = e.target; if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
  if (PH.on && (e.code === "Escape" || e.code === "Period" || e.code === "Backspace")) { e.stopPropagation(); e.preventDefault(); PH.app !== "home" && e.code === "Backspace" ? (PH.app = "home", PH.render()) : PH.close(); return; }
  if (document.body.classList.contains("mpphoto")) {
    if (e.code === "Escape") { e.stopPropagation(); e.preventDefault(); CAM.close(); return; }
    if (e.code === "Space" || e.code === "Enter") { e.stopPropagation(); e.preventDefault(); if (!e.repeat) CAM.shot(); return; }
    const f = { Digit1: "", Digit2: "bw", Digit3: "warm", Digit4: "pop" }[e.code];
    if (f != null) { e.stopPropagation(); e.preventDefault(); MP.click.camf(f); return; }
    if (e.code === "KeyQ") { e.stopPropagation(); e.preventDefault(); if (!e.repeat) MP.click.camself(); return; }
  }
  if (e.code === "Period" && !e.repeat && c.run && !c.menuOn && !c.invOn && !c.dg) { e.stopPropagation(); PH.open(); }
}, true);

const APPS = [
  ["map", "🗺️", "지도", "#2f6fed"], ["mis", "🎯", "미션", "#e5484d"], ["con", "📞", "연락처", "#2fae5f"],
  ["cam", "📸", "카메라", "#8a5cf6"], ["gal", "🖼️", "사진첩", "#c2410c"], ["bank", "🏦", "은행", "#0e7490"],
  ["shop", "📦", "엔더 택배", "#16a34a"], ["lot", "🏠", "부동산", "#b45309"], ["craft", "🔨", "제작", "#7c5a2b"], ["rec", "🏆", "기록", "#475569"],
];
PH.render = () => {
  const b = J("mpphb"); if (!b) return;
  J("mpphst").textContent = phTime();
  const head = t => `<div class="phh"><button data-mp="phhome">‹ 홈</button><b>${t}</b></div>`;
  const a = PH.app;
  if (a === "home") {
    const bd = PH.badge();
    b.innerHTML = `<div class="clock">${phTime()}</div><div class="date">${S.out ? "🏙️ 바깥 도시 · " + ae(MP.placeName()) : "🏫 마이폴학교"}</div><div class="grid">${APPS.map(([k, ic, n, col]) => `<button class="app" data-mp="phapp:${k}" style="--a:${col}"><i>${ic}</i>${n}${k === "mis" && bd ? `<em>${bd}</em>` : ""}</button>`).join("")}</div>`;
  } else if (a === "map") { PH.close(); try { Kx(); } catch (e) {} return; }
  else if (a === "lot") { PH.close(); LOT.render(); return; }
  else if (a === "craft") { PH.close(); MP.craft.open(); return; }
  else if (a === "cam") { PH.close(); CAM.open(); return; }
  else if (a === "mis") b.innerHTML = head("🎯 미션") + (MP.story ? MP.story.phoneHtml() : "");
  else if (a === "con") b.innerHTML = head("📞 연락처") + PH.contacts();
  else if (a === "gal") b.innerHTML = head("🖼️ 사진첩") + (PH.photos.length ? `<div class="pg">${PH.photos.slice().reverse().map((p, i) => `<img src="${p.d}" alt="사진 ${i + 1}" data-mp="phview:${PH.photos.length - 1 - i}">`).join("")}</div><p class="mpnote">사진은 이 기기 브라우저에만 8장까지 남아요</p>` : `<div class="mpcard">아직 사진이 없어요 · 카메라 앱으로 찍어요</div>`);
  else if (a === "bank") b.innerHTML = head("🏦 다이아 은행") + PH.bankHtml();
  else if (a === "shop") b.innerHTML = head("📦 엔더 택배") + PH.shopHtml();
  else if (a === "rec") b.innerHTML = head("🏆 기록") + PH.recHtml();
  else if (a.startsWith("view:")) { const p = PH.photos[+a.slice(5)]; b.innerHTML = head("🖼️ 사진") + (p ? `<img src="${p.d}" alt="" style="width:100%;border-radius:12px"><p class="mpsub">${ae(p.at || "")}</p><button class="mpbtn" data-mp="phdel:${a.slice(5)}">지우기</button>` : ""); }
};
MP.click.phview = i => { PH.app = "view:" + i; PH.render(); };
MP.click.phdel = i => { PH.photos.splice(+i, 1); phSavePhotos(); PH.app = "gal"; PH.render(); };
setInterval(() => { if (PH.on && PH.app === "home") { const s = J("mpphst"); if (s) s.textContent = phTime(); } }, 1000);

// ── 은행: 맡긴 코인은 쓰러지거나 붙잡혀도 안 잃어요 ──
PH.bankHtml = () => `<div class="mpcard"><span class="mpsub">통장</span><span class="big">${Ge(PH.bank)} 코인</span><span class="mpsub">지갑 ${Ge(c.coins || 0)} 코인 · 맡긴 코인은 WASTED · BUSTED 때도 그대로예요</span></div>
<div class="mpcard"><label class="mpsub" for="mpbankn">얼마나</label><input id="mpbankn" type="number" min="1" step="100" value="${Math.max(100, Math.min(1000, c.coins || 0))}"><div class="pg"><button class="mpbtn pri" data-mp="bank:in">맡기기</button><button class="mpbtn" data-mp="bank:out">찾기</button><button class="mpbtn" data-mp="bank:inall">지갑 전부 맡기기</button><button class="mpbtn" data-mp="bank:outall">전부 찾기</button></div></div>`;
MP.click.bank = k => {
  const v = Math.max(0, Math.floor(+(J("mpbankn") || {}).value || 0));
  if (k === "in" || k === "inall") { const n = k === "inall" ? c.coins | 0 : Math.min(v, c.coins | 0); if (n > 0) { c.coins -= n; PH.bank += n; c.ui?.renderCoins?.(-n); q("coin"); mpToast("🏦 " + Ge(n) + " 코인 맡겼어요", 1400); } }
  else { const n = k === "outall" ? PH.bank : Math.min(v, PH.bank); if (n > 0) { PH.bank -= n; c.coins = (c.coins || 0) + n; c.ui?.renderCoins?.(n); q("coin"); mpToast("🏦 " + Ge(n) + " 코인 찾았어요", 1400); } }
  mpSave(); PH.render();
};

// ── 엔더 택배 (온라인 상점 · 바로 가방으로) ──
// 짓기가 없어져서(V119) 블록 · 가구는 팔지 않아요 — 폐광 · 한탕 · 차원문 · 농사에 쓰는 것만
const SHOP = [
  ["도구", [["stone_pickaxe", 1, 120], ["iron_pickaxe", 1, 600], ["flint_and_steel", 1, 260]]],
  ["재료", [["oak_planks", 16, 40], ["iron_ingot", 4, 200], ["coal", 8, 80], ["gunpowder", 4, 240], ["sand", 16, 40]]],
  ["농사", [["wheat_seeds", 8, 40], ["beetroot_seeds", 8, 50], ["pumpkin_seeds", 4, 80], ["melon_seeds", 4, 80], ["white_dye", 8, 60]]],
];
PH.shopTab = SHOP[0][0];
PH.shopHtml = () => {
  if (!PH.unlock.shop) return `<div class="mpcard">📦 미나 누나의 '블록 택배' 일을 도와주면 (미션 2장) 엔더 택배 앱이 열려요.</div>`;
  const tabs = SHOP.map(([n]) => `<button class="${PH.shopTab === n ? "on" : ""}" data-mp="shoptab:${n}">${n}</button>`).join("");
  if (!SHOP.some(s => s[0] === PH.shopTab)) PH.shopTab = SHOP[0][0];
  const L = (SHOP.find(s => s[0] === PH.shopTab) || SHOP[0])[1];
  return `<div class="mptabs">${tabs}</div><p class="mpsub" style="margin:0 0 8px">엔더 진주 순간이동 배송 · 누르면 바로 가방으로 · 지갑 ${Ge(c.coins || 0)}</p>` + L.map(([id, n, pr], i) => `<div class="mpcard"><div class="row2"><span style="font-size:24px">${MPI.blockOf[id] ? `<img src="${MP.blockIcon(MPI.blockOf[id], 30)}" alt="" style="width:30px;height:30px">` : mpIconOf(id)}</span><span class="tx"><b>${ae(mpNameOf(id))} ×${n}</b><span>${Ge(pr)} 코인</span></span><button class="mpbtn pri" data-mp="shopbuy:${PH.shopTab}:${i}"${(c.coins || 0) < pr ? " disabled" : ""}>주문</button></div></div>`).join("");
};
MP.click.shoptab = t => { PH.shopTab = t; PH.render(); };
MP.click.shopbuy = v => {
  const [tab, i] = v.split(":"), it = ((SHOP.find(s => s[0] === tab) || [])[1] || [])[+i]; if (!it) return;
  const [id, n, pr] = it;
  if ((c.coins || 0) < pr) return mpToast("코인이 모자라요", 1200);
  const before = mpHave(id);
  const r = xM(id, n, 1);
  if (!r && mpHave(id) === before) return;
  Pt(-pr, 1); try { Lt("pop"); q("buy"); } catch (e) {}
  mpToast("📦 엔더 택배 도착! " + mpIconOf(id) + " " + mpNameOf(id) + " ×" + n, 1600);
  MP.stat("orders"); mpSave(); PH.render();
};

// ── 연락처 ──
PH.contacts = () => {
  const L = [];
  L.push(["🚕", "택시", Oi && Oi.on ? "지도에 찍은 목적지까지 · 코인 " + Ge(RS()) : "지도(M)에서 목적지를 먼저 찍어요", "taxi"]);
  if (PH.unlock.mech) L.push(["🔧", "렌치 형 (정비사)", et && et.cur ? "내 탈것 " + (Yt[et.cur] ? Yt[et.cur][0] : "") + " 바로 배달" : "탈것이 없어요 · 상점에서 사요", "mech"]);
  L.push(["📦", "미나 누나 (블록 택배)", PH.unlock.shop ? "엔더 택배 열기" : "미션으로 만나요", "mina"]);
  if (MP.story && MP.story.done.m4) L.push(["💻", "도윤 (한탕 설계)", "한탕 계획 듣기", "doyun"]);
  L.push(["👫", "같이 부수기 친구들", "서버 · 방 · 친구에게 PVP · 거래 신청", "friends"]);
  if (ne && ne.lv) L.push(["🚓", "경찰서 (자수하기)", "수배 ★" + ne.lv + " · 자수하면 그 자리에서 끝나요", "cops"]);
  return L.map(([ic, n, s, k]) => `<div class="mpcard"><div class="row2"><span style="font-size:24px">${ic}</span><span class="tx"><b>${ae(n)}</b><span>${ae(s)}</span></span><button class="mpbtn pri" data-mp="call:${k}">전화</button></div></div>`).join("");
};
MP.click.call = k => {
  if (k === "taxi") { if (!(Oi && Oi.on)) { PH.close(); try { Kx(); } catch (e) {} mpToast("📍 지도를 눌러 목적지를 찍은 다음 다시 전화해요", 2200); return; } PH.close(); try { kj(); } catch (e) {} return; }
  if (k === "mech") {
    if (!S.out) return mpToast("🔧 탈것은 바깥 도시에서 배달돼요", 1600);
    if (!et.cur) return mpToast("🔧 내 탈것이 없어요 · 상점 → 탈것에서 사요", 1800);
    PH.close(); try { if (!et.on) d0(et.cur); } catch (e) {} mpToast("🔧 렌치 형: 여기 있다! 조심히 타 ㅋㅋ", 1800); MP.stat("delivers"); return;
  }
  if (k === "mina") { if (PH.unlock.shop) { PH.app = "shop"; PH.render(); } else mpToast("📦 미나 누나는 학교 앞 거리에 있어요 (지도에 🎯)", 2000); return; }
  if (k === "doyun") { PH.app = "mis"; PH.render(); return; }
  if (k === "friends") { PH.close(); try { dR(); } catch (e) {} return; }
  if (k === "cops") { PH.close(); try { yd(); } catch (e) {} return; }
};

// ── 기록 ──
PH.recHtml = () => {
  const s = PH.stats, S = MP.story;
  const rows = [["🎯 끝낸 미션", S ? Object.keys(S.done).length + " / " + S.list.length : 0], ["💰 한탕 성공", s.heists | 0], ["⛏️ 캔 광석", s.mined | 0], ["🔨 만든 것", s.crafted | 0], ["🌾 거둔 작물", s.harvest | 0], ["🐣 태어난 동물", s.bred | 0], ["📦 택배 주문", s.orders | 0], ["📸 찍은 사진", s.photos | 0]];
  const rec = MP.race && MP.race.best ? Object.entries(MP.race.best).map(([k, v]) => [`🏁 ${MP.race.name(k)} 최고 기록`, (v / 1000).toFixed(2) + "초"]) : [];
  return `<div class="mpcard">${rows.concat(rec).map(([a, b]) => `<div class="row2"><span class="tx"><b>${a}</b></span><b>${b}</b></div>`).join("")}</div>`;
};
{ // 기록 모으기
  const pB = MP.onBreak; MP.onBreak = (...a) => { pB && pB(...a); MP.stat("mined"); };
  const pC = MP.onCraft; MP.onCraft = (o, n) => { pC && pC(o, n); MP.stat("crafted", n); };
  const pH = MP.onHarvest; MP.onHarvest = k => { pH && pH(k); MP.stat("harvest"); };
  const pBr = MP.onBreed; MP.onBreed = k => { pBr && pBr(k); MP.stat("bred"); };
}

// ── 카메라 (사진 모드) ──
const CAM = (MP.cam = { on: false, filter: "", selfie: false });
CAM.open = () => {
  if (!c.run || c.bm) return;
  try { if (!J("menu").hidden) Fi(); } catch (e) {}
  CAM.on = true; CAM.selfie = false; document.body.classList.add("mpphoto");
  mpToast(c.isTouch ? "📸 사진 모드 · ⚪ 눌러 찍기 · 닫기로 나가요" : "📸 사진 모드 · Space 찍기 · 1~4 필터 · Q 셀카 · ESC 닫기", 2600);
};
CAM.close = () => { CAM.on = false; CAM.selfie = false; const sb = document.querySelector('#mpcam [data-mp="camself"]'); if (sb) sb.classList.remove("on"); document.body.classList.remove("mpphoto"); const cv = J("c"); if (cv) cv.style.filter = ""; CAM.filter = ""; document.querySelectorAll("#mpcam [data-mp^=camf]").forEach(b => b.classList.toggle("on", b.dataset.mp === "camf:")); };
const CAM_F = { bw: "grayscale(1) contrast(1.1)", warm: "sepia(.35) saturate(1.25) brightness(1.04)", pop: "saturate(1.45) contrast(1.12)" };
MP.click.camf = f => { CAM.filter = f || ""; const cv = J("c"); if (cv) cv.style.filter = CAM_F[f] || ""; document.querySelectorAll("#mpcam [data-mp^=camf]").forEach(b => b.classList.toggle("on", b.dataset.mp === "camf:" + (f || ""))); };
MP.click.camself = () => { CAM.selfie = !CAM.selfie; const b = document.querySelector('#mpcam [data-mp="camself"]'); if (b) b.classList.toggle("on", CAM.selfie); };
// 사진 모드에서 마우스 잠금이 풀리면(ESC) 사진 모드도 닫아요
document.addEventListener("pointerlockchange", () => { if (CAM.on && !document.pointerLockElement && !c.isTouch && CAM.locked) CAM.close(); CAM.locked = !!document.pointerLockElement; });
MP.click.camx = () => CAM.close();
MP.click.camshot = () => CAM.shot();
CAM.shot = () => {
  try {
    bv(.016);
    const src = Rr.domElement, w = 480, h = Math.round(480 * src.height / src.width);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d"); g.filter = CAM_F[CAM.filter] || "none"; g.drawImage(src, 0, 0, w, h);
    const d = cv.toDataURL("image/jpeg", .72);
    PH.photos.push({ d, at: (S.out ? "바깥 도시 · " + MP.placeName() : "마이폴학교") + " · " + phTime() }); PH.photos = PH.photos.slice(-8); phSavePhotos();
    flash.style.transition = "none"; flash.style.opacity = ".9"; requestAnimationFrame(() => { flash.style.transition = "opacity .35s"; flash.style.opacity = "0"; });
    try { q("click"); Lt("paper", 0, 1.6); } catch (e) {}
    MP.stat("photos");
    const info = { pos: ot.position.clone(), dir: new v.Vector3(0, 0, -1).applyQuaternion(ot.quaternion) };
    MP.onPhoto && MP.onPhoto(info);
    mpToast("📸 찰칵! 사진첩에 넣었어요", 1200);
  } catch (e) { console.warn("[마이폴 확장] 사진", e); mpToast("📸 사진을 못 찍었어요", 1400); }
};
// 셀카 · 컷신 때 카메라 바꾸기 (본체 카메라 계산 뒤에)
{
  const orig = dB;
  dB = function () {
    const r = orig.apply(this, arguments);
    try {
      if (CAM.on && CAM.selfie) { const P = c.P, fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw); ot.position.set(P.x + fx * 2.3, P.y + 1.7, P.z + fz * 2.3); ot.lookAt(P.x, P.y + 1.45, P.z); if (c.pl) c.pl.g.visible = true; }
      MP.camHook && MP.camHook();
    } catch (e) {}
    return r;
  };
}

// 바로가기 아이콘 줄(#qbar) 맨 끝에 📱 폰 (본체가 줄을 다시 그리면 다시 붙여요)
const phBtn = mpEl("button", { id: "mpqph", type: "button", title: "블록폰 (키보드 .)" }, '<i aria-hidden="true">📱</i><span>폰</span><u>.</u>');
phBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); try { document.pointerLockElement && document.exitPointerLock?.(); } catch (x) {} PH.open(); });
const phPlace = () => {
  const qb = document.getElementById("qbar");
  if (qb && phBtn.parentElement !== qb) qb.appendChild(phBtn);
  // 줄 흐름에 끼지 않게 첫 줄 바깥쪽에 붙여요 (화면 오른쪽 줄이면 왼쪽에, 왼쪽 줄이면 오른쪽에)
  if (qb && !qb.hidden) {
    const f = qb.querySelector("button[data-qb]"), r = qb.getBoundingClientRect(), w = f ? f.offsetWidth : 44, g = 6;
    phBtn.style.position = "absolute"; phBtn.style.top = "0px";
    if (r.left > w + 30) { phBtn.style.left = -(w + g) + "px"; phBtn.style.right = "auto"; } else { phBtn.style.left = "auto"; phBtn.style.right = -(w + g) + "px"; }
  }
  const bd = PH.badge(); let em = phBtn.querySelector("em");
  if (bd && !em) { em = mpEl("em"); phBtn.append(em); }
  if (em) { em.hidden = !bd; em.textContent = bd; }
};
setInterval(() => { try { phPlace(); } catch (e) {} }, 700);

// 은행: 쓰러질 때 지갑만 떨어뜨려요 (통장은 그대로) — 본체가 지갑(c.coins)만 다뤄서 따로 할 일 없음
de.add({
  id: "mp_phone", name: "블록폰 (휴대폰)", need: ["mp_build", "mp_home", "taxi", "want", "veh"],
  gives: "MP.phone.open(앱) · 은행(통장) · 엔더 택배 · 연락처 · 카메라(사진 모드) · 사진첩 · 🔨 제작 · 기록",
  save: e => { e.mpp = { v: 1, bank: PH.bank, unlock: PH.unlock, stats: PH.stats }; },
  load: e => { const d = e && e.mpp; PH.bank = d && +d.bank > 0 ? Math.floor(+d.bank) : 0; PH.unlock = d && d.unlock && typeof d.unlock === "object" ? d.unlock : {}; PH.stats = d && d.stats && typeof d.stats === "object" ? d.stats : {}; },
  newGame: () => { PH.bank = 0; PH.unlock = {}; PH.stats = {}; },
  dbg: { MPPH: PH, MPCAM: CAM },
});
