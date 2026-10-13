// 전 판(classic) 장면을 복셀로: 삼각형마다 점을 찍어 새 판 좌표의 칸(1m)에 색·방향·칸 안 범위를 모아요 → JSON
// node test/cvox.mjs <out.json> [scale=0.7]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { writeFileSync, readFileSync } from 'node:fs';
const MATS = JSON.parse(readFileSync('/tmp/claude-0/-home-claude-mypaul-simulator/b1595000-bb9f-5cb7-a0c0-a65bcc6c9735/scratchpad/classic-mats.json'));
const out = process.argv[2] || '/tmp/classic-vox.json';
const SCALE = +(process.argv[3] || 0.7);
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
const logs = []; page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message.slice(0, 200)));
await page.goto('http://127.0.0.1:8124/?test=1', { waitUntil: 'load', timeout: 120000 });
try { await page.waitForFunction(() => { const l = document.getElementById('loading'); return !l || l.hidden || getComputedStyle(l).display === 'none'; }, null, { timeout: 170000 }); } catch { logs.push('[timeout loading]'); }
await page.waitForTimeout(500);
const data = await page.evaluate(([SCALE, MATS]) => {
  const G = window.__mpx.G, T = window.__mpx.T, sc = G.scene;
  sc.updateMatrixWorld(true);
  // 새 판 좌표: x' = 128 + S*(x+3), z' = 62.1 + S*(z+70), y' = 7.9 + y (땅 윗면 블록 y=7, 첫 공기 y=8)
  const OX = 128, OZ = 62.1, CX = 3, CZ = 70;
  const LEAF = new Set(['9ab06a', 'd9a24a', '7a9a6a', 'd07a3a']);
  // 재질 실제 색: 색 × 텍스처 평균
  const texAvg = new Map();
  const avgOf = (m) => {
    if (!m.map || !m.map.image) return [1, 1, 1];
    const key = m.map.uuid; if (texAvg.has(key)) return texAvg.get(key);
    let r = 1, g = 1, bb = 1;
    try { const im = m.map.image; const cv = document.createElement('canvas'); cv.width = 8; cv.height = 8; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, 8, 8); const d = cx.getImageData(0, 0, 8, 8).data; let sr = 0, sg = 0, sb = 0; for (let i = 0; i < 64; i++) { sr += d[i * 4]; sg += d[i * 4 + 1]; sb += d[i * 4 + 2]; } r = sr / 64 / 255; g = sg / 64 / 255; bb = sb / 64 / 255; } catch (e) { /* 못 읽는 텍스처 */ }
    const v = [r, g, bb]; texAvg.set(key, v); return v;
  };
  // 재질 → 이름(전 판 Q 표): 색 + 텍스처 유무로 찾고, 흰색+텍스처는 텍스처 평균색으로 구분
  const byHex = {}; for (const [name, m] of Object.entries(MATS)) { const k = m.c.slice(1) + '|' + (m.map ? 1 : 0); (byHex[k] = byHex[k] || []).push(name); }
  const classOf = (m, hex) => {
    if (!m) return 'other';
    if (m.transparent && m.opacity < 0.9) return hex === 'ffffff' ? 'acrylic' : 'glass';
    if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.5 && (m.emissiveIntensity ?? 1) > 0.5) return hex === '141a20' ? 'dormglass' : 'led';
    const list = byHex[hex + '|' + (m.map ? 1 : 0)];
    if (!list) return 'other';
    if (list.length === 1) return list[0];
    // 흰색 + 텍스처: tile terrazzo stone laminate wcTile grass dirt asphalt concrete panel bark
    const [r, g, b] = avgOf(m); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx > 0 ? (mx - mn) / mx : 0;
    if (g > r * 1.15 && g > b * 1.15) return 'grass';
    if (r > g * 1.12 && g > b * 1.08 && sat > 0.18) return (r + g + b) / 3 < 0.55 ? 'dirt' : 'laminate';
    if ((r + g + b) / 3 < 0.35) return 'asphalt';
    if ((r + g + b) / 3 > 0.82) return 'panel';
    return 'floor';
  };
  const CLS = []; const clsId = (c) => { let i = CLS.indexOf(c); if (i < 0) { i = CLS.length; CLS.push(c); } return i; };
  const acc = new Map(); // key → { a: Float64Array[ r,g,b, n, horiz, lx0,lx1,ly0,ly1,lz0,lz1, glass, emis, top ], c: Map(cls→n) }
  const va = new T.Vector3(), vb = new T.Vector3(), vc = new T.Vector3(), nrm = new T.Vector3(), e1 = new T.Vector3(), e2 = new T.Vector3(), p = new T.Vector3();
  let tris = 0, meshes = 0, skipped = 0;
  const STEP = 0.25 / SCALE;
  const matInfo = {};
  sc.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || o.isSprite || o.isInstancedMesh || !o.visible) return;
    const g = o.geometry; if (!g || !g.attributes.position) return;
    if (g.type === 'PlaneGeometry' && g.parameters && (g.parameters.width > 100 || g.parameters.height > 100)) { skipped++; return; }
    if (g.type === 'InstancedBufferGeometry') { skipped++; return; }
    const m0 = Array.isArray(o.material) ? o.material[0] : o.material; const hex0 = m0 && m0.color ? m0.color.getHexString() : '';
    if (LEAF.has(hex0)) { skipped++; return; }
    if (m0 && m0.vertexColors) { skipped++; return; } // 가구(꼭짓점 색)는 따로 놓음
    if (m0 && m0.map && hex0 === 'd8c8b8') { skipped++; return; } // 나무 줄기
    const wp = new T.Vector3(); o.getWorldPosition(wp); if (Math.abs(wp.z) > 1500) { skipped++; return; }
    let vis = true; for (let q = o; q; q = q.parent) if (!q.visible) vis = false; if (!vis) { skipped++; return; }
    // 소나무 줄기(bark 텍스처): 높이 9 넘는 흰 재질 + 텍스처
    const bbx = new T.Box3().setFromObject(o); const hgt = bbx.max.y - bbx.min.y;
    if (m0 && m0.map && hex0 === 'ffffff' && hgt > 9 && !Array.isArray(o.material)) { skipped++; return; }
    meshes++;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const pos = g.attributes.position, idx = g.index;
    const groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
    for (const grp of groups) {
      const m = mats[grp.materialIndex] || mats[0]; if (!m) continue;
      const mc = m.color ? m.color : new T.Color(1, 1, 1); const ta = avgOf(m);
      const r = mc.r * ta[0], gg = mc.g * ta[1], bb = mc.b * ta[2];
      const glass = (m.transparent && m.opacity < 0.9) ? 1 : 0;
      const emis = m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.5 && (m.emissiveIntensity ?? 1) > 0.5 ? 1 : 0;
      const hexm = m.color ? m.color.getHexString() : ''; const cls = classOf(m, hexm); const ci = clsId(cls); matInfo[cls] = (matInfo[cls] || 0) + 1;
      const end = Math.min(grp.start + grp.count, idx ? idx.count : pos.count);
      for (let i = grp.start; i + 2 < end; i += 3) {
        const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
        va.fromBufferAttribute(pos, ia).applyMatrix4(o.matrixWorld); vb.fromBufferAttribute(pos, ib).applyMatrix4(o.matrixWorld); vc.fromBufferAttribute(pos, ic).applyMatrix4(o.matrixWorld);
        const minx = Math.min(va.x, vb.x, vc.x), maxx = Math.max(va.x, vb.x, vc.x), minz = Math.min(va.z, vb.z, vc.z), maxz = Math.max(va.z, vb.z, vc.z);
        if (maxx < -105 || minx > 100 || maxz < -78 || minz > 60 || Math.min(va.y, vb.y, vc.y) > 40) continue;
        e1.subVectors(vb, va); e2.subVectors(vc, va); nrm.crossVectors(e1, e2); const area2 = nrm.length(); if (area2 < 1e-9) continue; nrm.divideScalar(area2);
        const horiz = Math.abs(nrm.y) > 0.6 ? 1 : 0;
        const L = Math.max(e1.length(), e2.length(), vb.distanceTo(vc));
        const n = Math.max(1, Math.ceil(L / STEP));
        tris++;
        for (let i1 = 0; i1 <= n; i1++) for (let j1 = 0; j1 <= n - i1; j1++) {
          const u = i1 / n, v = j1 / n, w = 1 - u - v;
          p.set(va.x * w + vb.x * u + vc.x * v, va.y * w + vb.y * u + vc.y * v, va.z * w + vb.z * u + vc.z * v);
          const nx = OX + SCALE * (p.x + CX), nz = OZ + SCALE * (p.z + CZ), ny = 7.9 + p.y;
          const ix = Math.floor(nx), iy = Math.floor(ny), iz = Math.floor(nz);
          if (ix < 0 || ix > 255 || iz < 0 || iz > 255 || iy < 0 || iy > 63) continue;
          const key = (ix * 256 + iz) * 64 + iy;
          let rec = acc.get(key); if (!rec) { const a0 = new Float64Array(14); a0[5] = 1; a0[6] = 0; a0[7] = 1; a0[8] = 0; a0[9] = 1; a0[10] = 0; rec = { a: a0, c: new Map() }; acc.set(key, rec); }
          const a = rec.a; rec.c.set(ci, (rec.c.get(ci) || 0) + 1);
          const lx = nx - ix, ly = ny - iy, lz = nz - iz;
          a[0] += r; a[1] += gg; a[2] += bb; a[3] += 1; a[4] += horiz;
          if (lx < a[5]) a[5] = lx; if (lx > a[6]) a[6] = lx; if (ly < a[7]) a[7] = ly; if (ly > a[8]) a[8] = ly; if (lz < a[9]) a[9] = lz; if (lz > a[10]) a[10] = lz;
          a[11] += glass; a[12] += emis; if (horiz && ly > a[13]) a[13] = ly;
        }
      }
    }
  });
  const keys = [...acc.keys()]; const outArr = new Array(keys.length);
  let k = 0;
  for (const key of keys) {
    const rec = acc.get(key), a = rec.a; const n = a[3];
    const iy = key % 64, rest = (key - iy) / 64, iz = rest % 256, ix = (rest - iz) / 256;
    const f2 = (v) => +v.toFixed(2);
    let best = -1, bn = 0; const cl = {}; for (const [ci, cn] of rec.c) { cl[CLS[ci]] = f2(cn / n); if (cn > bn) { bn = cn; best = ci; } }
    outArr[k++] = [ix, iy, iz, CLS[best], cl, Math.round(a[0] / n * 255), Math.round(a[1] / n * 255), Math.round(a[2] / n * 255), Math.round(n), f2(a[4] / n), f2(a[5]), f2(a[6]), f2(a[7]), f2(a[8]), f2(a[9]), f2(a[10]), f2(a[13])];
  }
  return { tris, meshes, skipped, n: outArr.length, scale: SCALE, matInfo, vox: outArr };
}, [SCALE, MATS]);
writeFileSync(out, JSON.stringify(data));
console.log('meshes', data.meshes, 'skipped', data.skipped, 'tris', data.tris, 'voxels', data.n);
console.log('mats', Object.keys(data.matInfo).length);
console.log(logs.join('\n') || 'ok');
await b.close();
