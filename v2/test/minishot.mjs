import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const [query = '', out = 'shots/mini.png'] = process.argv.slice(2);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: 640, height: 360 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 300)); });
await page.goto(`http://localhost:8123/mini.html?${query}`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await b.close();
