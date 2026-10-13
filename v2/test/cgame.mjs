// 전 판(classic) 휴대폰 흉내: 이름 → 혼자 하기 → 게임 화면 스크린샷 여러 장. node test/cgame.mjs <w> <h> <prefix>
import { chromium, devices } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [w = '844', h = '390', prefix = 'shots/classic'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const logs = []; page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message.slice(0, 200)));
await page.goto('http://127.0.0.1:8124/?test=1', { waitUntil: 'load', timeout: 120000 });
try { await page.waitForFunction(() => { const l = document.getElementById('loading'); return !l || l.hidden || getComputedStyle(l).display === 'none'; }, null, { timeout: 170000 }); } catch { logs.push('[timeout loading]'); }
await page.waitForTimeout(1000);
await page.evaluate(() => { const i = document.getElementById('nmin'); if (i) { i.value = '시험'; i.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('nmok').click(); } });
await page.waitForTimeout(800);
await page.evaluate(() => document.querySelector('#title [data-t="solo"]').click());
await page.waitForTimeout(6000);
const st = await page.evaluate(() => ({ title: !document.getElementById('title')?.hidden, hud: !document.getElementById('hud')?.hidden, touch: !document.getElementById('touch')?.hidden, touchDisp: getComputedStyle(document.getElementById('touch')).display }));
console.log(st);
await page.screenshot({ path: `${prefix}-hud.png` });
// 터치 버튼 · 핫바 · HUD 구조 덤프
const dump = await page.evaluate(() => {
  const t = document.getElementById('touch'); const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(','); };
  const btns = [...t.querySelectorAll('button, [id]')].filter((e) => e.offsetParent !== null).map((e) => `${e.tagName}#${e.id}.${e.className} "${e.textContent.trim().slice(0, 12)}" @${r(e)}`);
  const hud = [...document.querySelectorAll('#hud > *')].filter((e) => e.offsetParent !== null).map((e) => `${e.tagName}#${e.id}.${e.className} @${r(e)}`);
  return { touchHtml: t.outerHTML.slice(0, 4000), btns, hud };
});
console.log(JSON.stringify(dump, null, 1));
// 인벤토리 열기
await page.evaluate(() => { const b = [...document.querySelectorAll('#touch button')].find((x) => /인벤|가방/.test(x.textContent)); b && b.click(); });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${prefix}-inv.png` });
console.log(logs.join('\n') || 'ok');
await b.close();
