import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
page.on('framenavigated', (f) => console.log('NAV', f.url()));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 200)); });
page.on('crash', () => console.log('CRASH'));
await page.goto('http://localhost:8123/?auto=1&q=high&dev=cam8&dyn=0', { waitUntil: 'load' });
for (let i = 0; i < 12; i++) { await page.waitForTimeout(1500); try { const s = await page.evaluate(() => ({ hidden: document.getElementById('load')?.hidden, step: document.getElementById('loadStep')?.textContent, url: location.href, t: window.__mypaul?.sky?.time })); console.log(i, JSON.stringify(s)); } catch (e) { console.log(i, 'ERR', e.message.slice(0, 80)); } }
await b.close();
