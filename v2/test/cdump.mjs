// 전 판(classic) 세계 구조 덤프: node test/cdump.mjs "<js expr>" [out.json]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const [expr = 'Object.keys(window.__dbg)', out = ''] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: 800, height: 450 } });
const logs = []; page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message.slice(0, 200)));
await page.goto('http://127.0.0.1:8124/?test=1', { waitUntil: 'load', timeout: 120000 });
try { await page.waitForFunction(() => window.__ready === true, null, { timeout: 170000 }); } catch { logs.push('[timeout ready]'); }
const r = await page.evaluate(expr);
if (out) { writeFileSync(out, JSON.stringify(r)); console.log('wrote', out, JSON.stringify(r).length, 'bytes'); } else console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1).slice(0, 6000));
console.log(logs.join('\n') || 'ok');
await b.close();
