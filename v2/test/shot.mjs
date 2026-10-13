// 헤드리스 크롬 스크린샷: node test/shot.mjs "<query>" <out.png> [w] [h] [waitMs] [script]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [query = 'auto=1&q=low', out = 'shots/shot.png', w = '1280', h = '720', waitMs = '4000', script = ''] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-vsync'] });
const page = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning' || /error|fail|warn/i.test(t)) logs.push(`[${m.type()}] ${t.slice(0, 400)}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
const t0 = Date.now();
await page.goto(`http://localhost:8123/?${query}`, { waitUntil: 'load' });
try { await page.waitForFunction(() => document.getElementById('load').hidden, null, { timeout: 180000 }); } catch { logs.push('[timeout] loading did not finish: ' + await page.evaluate(() => document.getElementById('loadStep')?.textContent)); }
console.log('loaded in', ((Date.now() - t0) / 1000).toFixed(1), 's');
if (script) { await page.evaluate(script); }
await page.waitForTimeout(+waitMs);
const info = await page.evaluate(() => { const a = window.__mypaul; if (!a?.scene) return null; return { fps: a.engine.getFps().toFixed(1), active: a.scene.getActiveMeshes().length, total: a.scene.meshes.length, draws: a.engine.drawCalls, verts: a.scene.getTotalVertices(), lights: a.scene.lights.length, tier: a.tierName, time: a.sky?.time?.toFixed(2), pos: a.player && [a.player.position.x.toFixed(1), a.player.position.y.toFixed(1), a.player.position.z.toFixed(1)].join(',') }; });
console.log(JSON.stringify(info));
await page.screenshot({ path: out, timeout: 120000 });
console.log(logs.slice(0, 25).join('\n') || '(no console errors)');
await b.close();
