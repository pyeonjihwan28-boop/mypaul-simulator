/* 휴대폰 바로가기 접기 (mp_qfold)
   · 휴대폰에서 바로가기 줄은 처음엔 '메뉴' 하나만 보여요 → '메뉴'를 누르면 나머지(가방 · 지도 · 채팅 · 시점 · 상점 · … · 폰)가 펼쳐지고, 다시 누르면 접혀요 (마지막 상태를 기억해요)
   · 접혀 있을 때 숨은 버튼에 알림(숫자 · 반짝)이 있으면 '메뉴'에 노란 점
   · 접혀 있을 때 빈자리는 화면 돌리기를 막지 않아요
   · 휴대폰에서 오른쪽 위 ☰ 는 전체 메뉴(설정 · 저장 · 끼임 탈출 …)를 열어요 — 예전 '메뉴' 버튼이 하던 일
   · 컴퓨터는 그대로 (☰ = 바로가기 줄 숨기기 · 보이기) */
const QF = (MP.qfold = { open: 0, by: 0 });
try { QF.open = localStorage.getItem("mypaul_qfold") === "1" ? 1 : 0; } catch (e) {}
const qfOn = () => !!c.isTouch;
const qfMenuBtn = () => document.querySelector('#qbar button[data-qb="menu"]');
const qfApply = () => {
  const t = qfOn(), B = document.body;
  B.classList.toggle("mpqf", t && !QF.open);
  if (t && B.classList.contains("qhide")) B.classList.remove("qhide");   // 휴대폰은 접기로 대신해요 (예전 ☰ 숨김 상태는 풀어요)
  const m = qfMenuBtn();
  if (m) {
    m.classList.toggle("mpqf-open", t && !!QF.open);
    let dot = false;
    if (t && !QF.open) for (const b of document.querySelectorAll('#qbar button:not([data-qb="menu"])')) {
      const em = b.querySelector("em");
      if (b.classList.contains("rdy") || (em && !em.hidden && em.textContent)) { dot = true; break; }
    }
    m.classList.toggle("mpqf-dot", dot);
    m.setAttribute("aria-expanded", t && QF.open ? "true" : "false");
  }
  const mb = document.getElementById("mbtn");
  if (mb && t && mb.dataset.mpqf !== "1") { mb.dataset.mpqf = "1"; mb.title = "전체 메뉴"; mb.setAttribute("aria-label", "전체 메뉴"); }
};
document.addEventListener("click", e => {
  if (!qfOn() || QF.by) return;
  const t = e.target && e.target.closest && e.target.closest('#qbar button[data-qb="menu"], #mbtn');
  if (!t) return;
  e.preventDefault(); e.stopImmediatePropagation();   // 게임 본체 처리(메뉴 창 열기 · 줄 숨기기)보다 먼저
  try { hs(); q("click"); } catch (x) {}
  if (t.id === "mbtn") {   // ☰ → 전체 메뉴 (본체의 '메뉴' 버튼 동작을 그대로 불러요)
    const m = qfMenuBtn();
    if (m) { QF.by = 1; try { m.click(); } finally { QF.by = 0; } }
    return;
  }
  QF.open = QF.open ? 0 : 1;
  try { localStorage.setItem("mypaul_qfold", QF.open ? "1" : "0"); } catch (x) {}
  qfApply();
}, true);
mpCss("mp-qfold-css", `
body.mpqf #qbar{pointer-events:none!important}
body.mpqf #qbar button{pointer-events:auto}
body.mpqf #qbar button:not([data-qb="menu"]){display:none!important}
#qbar button[data-qb="menu"]{position:relative}
#qbar button.mpqf-open{border-color:#f5c542!important;box-shadow:inset 0 0 0 1px #f5c542!important}
#qbar button.mpqf-dot::after{content:"";position:absolute;top:4px;right:4px;width:9px;height:9px;border-radius:50%;background:#f5c542;box-shadow:0 0 0 2px rgba(22,30,46,.9)}
`);
setInterval(() => { try { qfApply(); } catch (e) {} }, 400);
setTimeout(() => { try { qfApply(); } catch (e) {} }, 0);

de.add({
  id: "mp_qfold", name: "휴대폰 바로가기 접기",
  gives: "MP.qfold.open · 휴대폰: 바로가기 줄 '메뉴'로 접기 · 펴기 (처음은 접힘 · 기억) · ☰ = 전체 메뉴",
});
