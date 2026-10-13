// 한 번 로드하고 여러 카메라 위치에서 스크린샷: node test/multishot.mjs "<query>" <prefix> "<name>=px,py,pz,tx,ty,tz;..." [w] [h] [waitMs]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [query = 'auto=1&q=high&dev=cam3&dyn=0', prefix = 'shots/m', spec = '', w = '1280', h = '720', waitMs = '2500'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-vsync'] });
const page = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|TUNNEL/.test(t)) logs.push(`[${m.type()}] ${t.slice(0, 300)}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await page.goto(`http://localhost:8123/?${query}`, { waitUntil: 'load' });
try { await page.waitForFunction(() => document.getElementById('load').hidden, null, { timeout: 180000 }); } catch { logs.push('[timeout] ' + await page.evaluate(() => document.getElementById('loadStep')?.textContent)); }
await page.waitForTimeout(3000);
for (const item of spec.split(';').filter(Boolean)) {
  const [name, nums] = item.split('='); const v = nums.split(',').map(Number);
  await page.evaluate(([px, py, pz, tx, ty, tz]) => { const a = window.__mypaul; const c = a.scene.activeCamera; c.position.set(px, py, pz); c.setTarget(new window.__B.Vector3(tx, ty, tz)); if (a.chunks) a.chunks.update(px, pz); }, v);
  await page.waitForTimeout(+waitMs);
  await page.screenshot({ path: `${prefix}_${name}.png`, timeout: 120000 });
  console.log('shot', name);
}
console.log(logs.slice(0, 20).join('\n') || '(no console errors)');
await b.close();
