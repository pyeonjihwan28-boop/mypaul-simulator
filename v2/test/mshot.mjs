// 휴대폰 흉내(UA·터치) 스크린샷: node test/mshot.mjs "<query>" <out.png> [w] [h] [waitMs] [script]
import { chromium, devices } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [query = 'auto=1&gfx=low', out = 'shots/m.png', w = '844', h = '390', waitMs = '3000', script = ''] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await page.goto(`http://localhost:8123/?${query}`, { waitUntil: 'load' });
try { await page.waitForFunction(() => document.getElementById('load').hidden, null, { timeout: 180000 }); } catch { logs.push('[timeout]'); }
if (script) await page.evaluate(script);
await page.waitForTimeout(+waitMs);
await page.screenshot({ path: out, timeout: 120000 });
console.log(logs.join('\n') || 'ok');
await b.close();
