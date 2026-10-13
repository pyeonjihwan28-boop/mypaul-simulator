/* 마이폴학교 시뮬레이터 — 와이파이 없이도 실행 (서비스 워커)
   · 게임 화면(index.html)은 인터넷이 되면 늘 새로 받아서 저장해 두고, 안 되면(또는 5초 넘게 느리면) 저장본으로 열어요
   · 게임 코드(app.js · worker.js)도 인터넷이 되면 새로 받아 저장해 두고, 안 되면 저장본
   · 아이콘 · manifest 는 저장본 먼저
   · 글꼴(Google Fonts)은 한 번 받으면 저장해 두고 써요
   · version.json(업데이트 확인) · sw.js 는 건드리지 않아요 — 늘 인터넷으로 */
const PAGE = "mypaul-page", STATIC = "mypaul-static-1", FONT = "mypaul-font-1";
const KEEP = [PAGE, STATIC, FONT];
const STATIC_FILES = ["manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png", "icon-maskable-512.png"];
const inScope = p => new URL(p, self.registration.scope).href;
const pageKey = href => { const u = new URL(href); u.search = ""; u.hash = ""; if (u.pathname.endsWith("/index.html")) u.pathname = u.pathname.slice(0, -"index.html".length); return u.href; };

const OFFLINE_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>마이폴학교 시뮬레이터</title>
<style>:root{color-scheme:dark}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e1522;color:#fff;font:15px/1.6 "IBM Plex Sans KR",system-ui,sans-serif;padding:24px;box-sizing:border-box}
.c{max-width:420px;background:rgba(22,30,46,.9);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:22px 20px;text-align:center}h1{font-size:18px;margin:0 0 8px}p{margin:0 0 16px;color:#c9d2e0}
button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:10px 18px;background:#f5c542;color:#1b1f27;cursor:pointer}</style></head>
<body><div class="c"><h1>📴 인터넷이 없어요</h1><p>마이폴학교 시뮬레이터는 인터넷이 될 때 한 번 들어오면, 그다음부터는 와이파이가 없어도 열려요.</p><button onclick="location.reload()">다시 시도</button></div></body></html>`;

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const st = await caches.open(STATIC);
    await Promise.all(STATIC_FILES.map(f => st.add(new Request(inScope(f))).catch(() => {})));
    try {   // 게임 화면도 미리 받아 둬요 (방금 받은 브라우저 캐시를 써서 한 번 더 내려받지 않게)
      const r = await fetch(new Request(inScope("./"), { cache: "force-cache" }));
      if (r.ok) await (await caches.open(PAGE)).put(pageKey(inScope("./")), r);
    } catch (x) {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!KEEP.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (!u.href.startsWith(self.registration.scope)) return;
    const p = u.pathname;
    if (p.endsWith("/version.json") || p.endsWith("/sw.js")) return;
    if (r.mode === "navigate" || p.endsWith("/") || p.endsWith(".html")) { e.respondWith(page(r)); return; }
    if (p.endsWith("/app.js") || p.endsWith("/worker.js")) { e.respondWith(netFirst(PAGE, r)); return; }
    if (STATIC_FILES.some(f => p.endsWith("/" + f))) { e.respondWith(cacheFirst(STATIC, r)); return; }
    return;
  }
  if (u.hostname === "fonts.gstatic.com") { e.respondWith(cacheFirst(FONT, r)); return; }
  if (u.hostname === "fonts.googleapis.com") { e.respondWith(staleWhileRevalidate(FONT, r)); return; }
});

async function page(r) {
  const key = pageKey(r.url), c = await caches.open(PAGE);
  const net = fetch(r).then(res => { if (res && res.ok && res.type === "basic") c.put(key, res.clone()).catch(() => {}); return res; });
  const cached = await c.match(key);
  if (!cached) return net.catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }));
  return Promise.race([
    net.then(res => (res && (res.ok || res.type === "opaqueredirect") ? res : cached)).catch(() => cached),
    new Promise(ok => setTimeout(() => ok(cached), 5000)),
  ]);
}
// 게임 코드(app.js · worker.js): 인터넷이 되면 늘 새로 받아 저장해 두고, 안 되면 저장본
async function netFirst(name, r) {
  const key = pageKey(r.url), c = await caches.open(name);
  try { const res = await fetch(r); if (res && res.ok) c.put(key, res.clone()).catch(() => {}); return res; }
  catch (x) { const hit = await c.match(key); return hit || Response.error(); }
}
async function cacheFirst(name, r) {
  const c = await caches.open(name), hit = await c.match(r);
  if (hit) return hit;
  try { const res = await fetch(r); if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()).catch(() => {}); return res; }
  catch (x) { return Response.error(); }
}
async function staleWhileRevalidate(name, r) {
  const c = await caches.open(name), hit = await c.match(r);
  const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()).catch(() => {}); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
