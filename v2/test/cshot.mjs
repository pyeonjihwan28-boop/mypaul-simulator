// 전 판(classic) 휴대폰 흉내 스크린샷: node test/cshot.mjs <out.png> [w] [h] [script] [waitMs]
import { chromium, devices } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [out = 'shots/c.png', w = '844', h = '390', script = '', waitMs = '4000'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const logs = []; page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message.slice(0, 200)));
await page.goto('http://127.0.0.1:8124/?test=1', { waitUntil: 'load', timeout: 120000 });
try { await page.waitForFunction(() => { const l = document.getElementById('loading'); return !l || l.hidden || getComputedStyle(l).display === 'none'; }, null, { timeout: 170000 }); } catch { logs.push('[timeout loading]'); }
await page.waitForTimeout(1500);
if (script) { try { await page.evaluate(script); } catch (e) { logs.push('[script] ' + e.message.slice(0, 300)); } }
await page.waitForTimeout(+waitMs);
await page.screenshot({ path: out, timeout: 120000 });
console.log(await page.evaluate(() => ({ title: !document.getElementById('title')?.hidden, hud: !document.getElementById('hud')?.hidden, touch: !document.getElementById('touch')?.hidden, loading: !document.getElementById('loading')?.hidden })));
console.log(logs.join('\n') || 'ok');
await b.close();
