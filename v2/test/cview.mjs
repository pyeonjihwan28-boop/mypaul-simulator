// 전 판(classic) 장면을 내 카메라로 찍기: 위에서(평면도) · 앞 · 뒤 · 안
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const prefix = process.argv[2] || 'shots/cv';
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const logs = []; page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message.slice(0, 200)));
await page.goto('http://127.0.0.1:8124/?test=1', { waitUntil: 'load', timeout: 120000 });
try { await page.waitForFunction(() => { const l = document.getElementById('loading'); return !l || l.hidden || getComputedStyle(l).display === 'none'; }, null, { timeout: 170000 }); } catch { logs.push('[timeout loading]'); }
await page.waitForTimeout(1000);
const views = JSON.parse(process.argv[3] || '[]');
const defaults = [
  { n: 'top', ortho: [-135, 135, 55, -125], pos: [0, 300, -35], look: [0, 0, -35.01] },
  { n: 'front', pos: [0, 28, -120], look: [0, 4, -20] },
  { n: 'back', pos: [0, 28, 70], look: [0, 4, -10] },
  { n: 'front-right', pos: [110, 24, -95], look: [0, 4, -20] },
  { n: 'gate', pos: [0, 3, -85], look: [0, 4, -40] },
  { n: 'field', pos: [60, 6, -75], look: [0, 3, -40] },
];
for (const v of views.length ? views : defaults) {
  const data = await page.evaluate((v) => {
    const G = window.__mpx.G, T = window.__mpx.T, r = G.renderer, sc = G.scene;
    const w = r.domElement.width, h = r.domElement.height;
    let cam;
    if (v.ortho) { const [l, rr, t, bt] = v.ortho; cam = new T.OrthographicCamera(l, rr, t, bt, 1, 2000); } else cam = new T.PerspectiveCamera(60, w / h, 0.1, 3000);
    cam.position.set(...v.pos); cam.up.set(0, 1, 0); if (v.ortho) cam.up.set(0, 0, 1); cam.lookAt(...v.look); cam.updateProjectionMatrix(); cam.layers.enableAll();
    r.render(sc, cam);
    return r.domElement.toDataURL('image/png');
  }, v);
  writeFileSync(`${prefix}-${v.n}.png`, Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote', `${prefix}-${v.n}.png`);
}
console.log(logs.join('\n') || 'ok');
await b.close();
