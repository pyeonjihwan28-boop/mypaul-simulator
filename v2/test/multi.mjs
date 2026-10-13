// 같이 하기 시험: 한 브라우저에서 탭 둘 (BroadcastChannel 통신) — 서로 보이는지 · 채팅 · 블록 편집 동기화
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
const b = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
const open = async (name) => { const p = await ctx.newPage(); p.on('pageerror', (e) => console.log(`[${name} pageerror]`, e.message.slice(0, 200))); await p.goto(`http://localhost:8123/?auto=multi&net=local&q=low&dyn=0&time=10&name=${name}`, { waitUntil: 'load', timeout: 120000 }); await p.waitForFunction(() => document.getElementById('load').hidden, null, { timeout: 180000 }); return p; };
const A = await open('AA'); const B = await open('BB'); await B.bringToFront();
await A.waitForTimeout(6000);
const q = (p, expr) => p.evaluate(expr);
console.log('A sees', await q(A, "(() => { const n = window.__mypaul.net; return { server: n.server, kind: n.transport && n.transport.kind, lobbyPeers: n.lobby.peers().length, roomPeers: n.room ? n.room.peers().length : -1, remote: n.remote.count, names: [...n.names.values()] }; })()"));
console.log('B sees', await q(B, "(() => { const n = window.__mypaul.net; return { server: n.server, lobbyPeers: n.lobby.peers().length, roomPeers: n.room ? n.room.peers().length : -1, remote: n.remote.count, names: [...n.names.values()] }; })()"));
// B 가 움직임 → A 에서 B 위치
await q(B, "window.__mypaul.player.position.set(140, 8, 80)");
await A.waitForTimeout(1500);
console.log('A remote pos', await q(A, "(() => { const m = window.__mypaul.net.remote.map; const r = [...m.values()][0]; return { size: m.size, keys: [...m.keys()], r: r && { name: r.name, x: +r.pos.x.toFixed(1), z: +r.pos.z.toFixed(1), tx: r.target.x, tz: r.target.z, got: r.got } }; })()"));
// 채팅
await q(B, "window.__mypaul.net.chat('안녕 친구들!')");
await A.waitForTimeout(800);
console.log('A chat', await q(A, "document.getElementById('cList').textContent"));
// 블록 편집: A 가 놓음 → B 세계에 반영
await q(A, "window.__mypaul.chunks.setBlock(140, 8, 84, 3, 0); window.__mypaul.net.sendEdit(140, 8, 84, 3, 0)");
await B.waitForTimeout(800);
console.log('B block at 140,8,84 =', await q(B, "window.__mypaul.world.get(140, 8, 84)"), '(3 expected)');
// 늦게 온 C 가 편집 내역을 받는지
const C = await open('CC'); await C.waitForTimeout(5000);
console.log('C block at 140,8,84 =', await q(C, "window.__mypaul.world.get(140, 8, 84)"), '(3 expected) · C remote', await q(C, "window.__mypaul.net.remote.count"));
await A.screenshot({ path: 'shots/multi_A.png' });
await b.close();
