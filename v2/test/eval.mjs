// 페이지에서 식 평가: node test/eval.mjs "<query>" "<js expression>"
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [query, expr, waitMs = '3000'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await page.goto(`http://localhost:8123/?${query}`, { waitUntil: 'load' });
try { await page.waitForFunction(() => document.getElementById('load').hidden, null, { timeout: 180000 }); } catch { console.log('timeout'); }
await page.waitForTimeout(+waitMs);
const r = await page.evaluate(expr);
console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
if (logs.length) console.log(logs.join('\n'));
await b.close();
