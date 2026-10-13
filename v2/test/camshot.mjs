// 내 카메라로 새 판 찍기: node test/camshot.mjs <out.png> <px,py,pz> <tx,ty,tz> [w h] [query]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [out = 'shots/cam.png', pos = '130,30,40', tgt = '130,10,100', w = '1280', h = '720', query = 'auto=1&nonet&gfx=low&dev=cam'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: +w, height: +h } });
const logs = []; page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message.slice(0, 300)));
await page.goto(`http://localhost:8123/?${query}`, { waitUntil: 'load' });
try { await page.waitForFunction(() => document.getElementById('load').hidden, null, { timeout: 180000 }); } catch { logs.push('[timeout]'); }
await page.evaluate(([p, t]) => { const a = window.__mypaul; a.devCam = true; a.devPos = p; a.devTgt = t; document.getElementById('hud').style.display = 'none'; }, [pos.split(',').map(Number), tgt.split(',').map(Number)]);
await page.waitForTimeout(3500);
await page.screenshot({ path: out });
console.log(logs.join('\n') || 'ok');
await b.close();
