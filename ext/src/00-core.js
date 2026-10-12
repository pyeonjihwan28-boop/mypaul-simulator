/* ───────────── 마이폴 확장 · 공통 ─────────────
   게임 본체(압축된 번들) 안에서 돌아가요. 짧은 이름은 본체 안 이름이에요.
   연결표 (본체 이름 → 뜻)
     c 게임 상태 · j 바깥 도시(CITY) · Kt 블록 표 · $o 마크 이름→블록 id · Si 마크 아이템 표
     kr(x,y,z) 블록 보기 · fs(x,y,z) 청크 안 칸 번호 · ps 높이(96) · Dt(…) 블록 넣기
     Aj 청크 격자 · Gj 청크 다시 그리기 · dj 도시 폭발 · w_ 떠 있는 아이템 · en 떠 있는 아이템 목록
     dM 가방에 넣기 · gM 가방 칸 목록 · Wj 가방 칸 버튼 · uM 상자에서 꺼내기 · fp 가방 다시 그리기 · gs 가방 열기
     le 알림 · q 효과음 · Lt 마크 효과음 · Pt 코인 · Gs 경험치 · J 요소 찾기 · ae 글자 안전하게 · Ge 숫자
     yr 메뉴 창 열기 · Fi 창 닫기 · ze 키 이름 · ta 학교 밖인가 · ht 카메라 · He 장면 · y THREE · Bo 화면
     Ne 발사 상태 · S1 발사 · Ra 바닥 높이 · O 난수 · Ta 핫바 · np 블록 그림판 · Wi 눌린 키 · pe 블록 등록
*/
const MP = (window.__mpx = window.__mpx || {});
MP.ver = 1;
MP.T = v;                       // THREE
MP.G = c;                       // 게임 상태
MP.CITY = S;

const mpCss = (id, css) => {
  let s = document.getElementById(id);
  if (!s) { s = document.createElement("style"); s.id = id; document.head.appendChild(s); }
  s.textContent = css;
};
const mpEl = (tag, attrs, html) => {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) k === "class" ? (e.className = attrs[k]) : e.setAttribute(k, attrs[k]);
  if (html != null) e.innerHTML = html;
  return e;
};
const mpToast = (m, ms) => { try { Ae(m, ms || 2000); } catch (e) {} };
const mpSave = () => { try { c.saveSoon?.(); } catch (e) {} };
const mpNow = () => performance.now();
const mpClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mpInCity = () => !!(S.ok && S.out && !c.bm && !c.arenaOn && !c.pvArena && !c.pvLock && c.run);
const mpBusy = () => !!(c.menuOn || c.invOn || c.dg || c.busy || c.chatting || c.bdown);
const mpNet = (k, a) => { try { c.net?.ev(k, a); } catch (e) {} };
MP.inCity = mpInCity;

// 가방 개수 (마크 아이템)
const mpHave = id => (c.MI && c.MI[id]) | 0;
const mpTake = (id, n) => {
  if (mpHave(id) < n) return false;
  c.MI[id] -= n;
  if (c.MI[id] <= 0) delete c.MI[id];
  return true;
};
MP.have = mpHave;

// 공통 창 스타일 (시초 디자인: 진한 남색 판 · 모서리 12px · 노랑 강조 하나)
mpCss("mp-core-css", `
.mpbtn{padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:#fff;font:600 13px "IBM Plex Sans KR",sans-serif;cursor:pointer;min-height:36px}
.mpbtn.pri{background:#f5c542;color:#1b1f27;border-color:#f5c542}
.mpbtn:disabled{opacity:.4;cursor:default}
.mpchip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.08);font:600 12px "IBM Plex Sans KR",sans-serif;color:#dfe6f1}
.mpchip.no{background:rgba(229,72,77,.18);color:#ffb4b6}
.mpchip.ok{background:rgba(74,222,128,.14);color:#b9f5cc}
.mpsub{font-size:12.5px;color:#b8c4d6}
.mprow{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.mprow .ic{font-size:24px;width:34px;text-align:center;flex:none}
.mprow .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.mprow .tx b{font-size:14px}
.mprow .bt{display:flex;gap:6px;flex:none}
.mplist{display:flex;flex-direction:column;gap:6px;max-height:min(58vh,520px);overflow:auto;padding-right:2px}
.mptabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}
.mptabs button{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#dfe6f1;font:600 12.5px "IBM Plex Sans KR",sans-serif;cursor:pointer;min-height:32px}
.mptabs button.on{background:#f5c542;color:#1b1f27;border-color:#f5c542}
.mpnote{font-size:12.5px;color:#b8c4d6;margin:4px 0 8px;line-height:1.5}
`);

// 메뉴 창 안 버튼: data-mp="이름:값" 을 눌렀을 때 부를 함수
MP.click = MP.click || {};
document.addEventListener("click", e => {
  const b = e.target && e.target.closest && e.target.closest("[data-mp]");
  if (!b) return;
  const [k, ...rest] = b.dataset.mp.split(":");
  const fn = MP.click[k];
  if (!fn) return;
  e.preventDefault(); e.stopPropagation();
  try { q("click"); } catch (x) {}
  try { fn(rest.join(":"), b, e); } catch (err) { console.warn("[마이폴 확장] 버튼", k, err); }
}, true);

// 게임 본체 함수 감싸기 (본체 이름을 새 함수로 바꿔요)
MP.wrapLog = [];

// 반짝이 (경험치 구슬 대신 · 그냥 보이는 효과)  col: [r,g,b] 0~1
MP.fx = (x, yy, z, col = [.55, 1, .45], n = 8, sp = 1.4, sz = .18) => {
  try { for (let i = 0; i < n; i++) tr.emit(x + (O() - .5) * .7, yy + O() * .5, z + (O() - .5) * .7, (O() - .5) * sp, .6 + O() * sp, (O() - .5) * sp, col[0], col[1], col[2], 1, sz * (.7 + O() * .6), .55 + O() * .45, { grav: 1.5, drag: 1.2 }); } catch (e) {}
};
// 지금 있는 동네 이름
MP.placeName = (x, z) => { try { const P = c.P; return EB[up(Math.floor((x ?? P.x) / 64), Math.floor((z ?? P.z) / 64))] || "바깥 도시"; } catch (e) { return "바깥 도시"; } };
