/* 와이파이 없이도 실행 (mp_offline)
   · GitHub 사이트에서는 서비스 워커(sw.js)를 켜서 게임 화면을 휴대폰 · 컴퓨터에 저장해 둬요
     → 인터넷이 없을 때도 저장본으로 열리고 '혼자 하기'가 돼요 (같이 하기는 인터넷이 필요해요)
   · 첫 화면 아래 줄에 '앱으로 설치'(안드로이드 · 컴퓨터 크롬/엣지) · '홈 화면에 추가'(아이폰) 버튼
   · claude.ai 아티팩트 같은 다른 곳에서는 아무것도 안 해요 */
const OFF = (MP.offline = { reg: null, ready: 0, prompt: null, installed: 0 });
const offSite = () => (location.protocol === "https:" && /\.github\.io$/.test(location.hostname)) || location.hostname === "localhost" || location.hostname === "127.0.0.1";
const offStandalone = () => { try { return matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } };
const offIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

if (offSite() && "serviceWorker" in navigator) {
  const go = () => {
    try {
      const beta = /\/beta\//.test(location.pathname);
      navigator.serviceWorker.register(beta ? "../sw.js" : "sw.js", { scope: beta ? "../" : "./" }).then(reg => {
        OFF.reg = reg;
        navigator.serviceWorker.ready.then(() => { OFF.ready = 1; offBtn(); }).catch(() => {});
      }).catch(() => {});
    } catch (e) {}
  };
  if (document.readyState === "complete") setTimeout(go, 1500); else addEventListener("load", () => setTimeout(go, 1500));
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); OFF.prompt = e; offBtn(); });
  addEventListener("appinstalled", () => { OFF.prompt = null; OFF.installed = 1; offBtn(); mpToast("📲 설치했어요! 이제 와이파이가 없어도 앱 아이콘으로 열려요", 3600); });
}
addEventListener("online", () => offBtn());
addEventListener("offline", () => offBtn());

// 첫 화면 아래 줄 버튼
const offState = () => {
  if (!offSite()) return "";
  if (!navigator.onLine) return "off";
  if (OFF.prompt) return "install";
  if (offIOS() && !offStandalone()) return "ios";
  if (OFF.ready) return "ready";
  return "";
};
const OFF_LABEL = { off: "📴 오프라인 · 혼자 하기", install: "📲 앱으로 설치", ios: "📲 홈 화면에 추가", ready: "✅ 와이파이 없이도 돼요" };
const offBtn = () => {
  try {
    const sub = document.querySelector("#tbtns .tsub"); if (!sub) return;
    const st = offState(); let b = sub.querySelector("[data-mpoff]");
    if (!st) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("button"); b.type = "button"; b.dataset.mpoff = ""; b.addEventListener("click", e => { e.stopPropagation(); offClick(b.dataset.mpoff); }); sub.appendChild(b); }
    if (b.dataset.mpoff !== st) { b.dataset.mpoff = st; b.textContent = OFF_LABEL[st]; }
  } catch (e) {}
};
const offClick = st => {
  try { hs(); q("click"); } catch (e) {}
  if (st === "install" && OFF.prompt) {
    const p = OFF.prompt; OFF.prompt = null;
    p.prompt(); p.userChoice?.then(r => { if (r && r.outcome === "accepted") mpToast("📲 설치했어요! 이제 와이파이가 없어도 앱 아이콘으로 열려요", 3600); offBtn(); }).catch(() => {});
    return;
  }
  if (st === "ios") return mpToast("📲 Safari 아래쪽 공유 버튼(⬆️) → '홈 화면에 추가' · 그다음부터 와이파이 없이도 열려요", 5200);
  if (st === "off") return mpToast("📴 지금은 인터넷이 없어요 · '혼자 하기'는 그대로 돼요 · 같이 하기는 인터넷이 돌아오면", 4200);
  if (st === "ready") return mpToast("✅ 게임 파일을 이 기기에 저장해 뒀어요 · 와이파이가 없어도 이 주소(또는 앱 아이콘)로 열면 '혼자 하기'가 돼요", 5200);
};
{ const orig = vR; vR = function () { const r = orig.apply(this, arguments); offBtn(); return r; }; }
setTimeout(offBtn, 0);

de.add({
  id: "mp_offline", name: "와이파이 없이도 실행",
  gives: "MP.offline · 서비스 워커(sw.js)로 게임 화면 저장 · 첫 화면 '앱으로 설치' / '홈 화면에 추가' 버튼",
});
