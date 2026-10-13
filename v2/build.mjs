// esbuild 번들: src/main.js → dist/app.js · src/world/worker.js → dist/worker.js · index.html 복사
import { build } from 'esbuild';
import { mkdirSync, copyFileSync, statSync, readFileSync, writeFileSync } from 'node:fs';

const minify = !process.argv.includes('--dev');
mkdirSync('dist', { recursive: true });
const common = { bundle: true, minify, format: 'iife', target: ['es2020'], legalComments: 'none', logLevel: 'warning', treeShaking: true,
  define: { 'process.env.NODE_ENV': '"production"' } };
await build({ ...common, entryPoints: ['src/main.js'], outfile: 'dist/app.js' });
await build({ ...common, entryPoints: ['src/world/worker.js'], outfile: 'dist/worker.js' });
// 캐시 무효화를 위해 index.html 의 ?v= 을 빌드 시각으로
const stamp = Date.now().toString(36);
let html = readFileSync('src/index.html', 'utf8').replaceAll('__BUILD__', stamp);
writeFileSync('dist/index.html', html);
// 본판(베타 표시 없음) · 깃허브 판(설치형 웹앱: manifest + 서비스 워커)
const mainHtml = html.replace('<title>마이폴학교 시뮬레이터 베타</title>', '<title>마이폴학교 시뮬레이터</title>').replace('<p>시뮬레이터 베타 · Babylon.js 새 엔진</p>', '<p>시뮬레이터 · Babylon.js 새 엔진</p>').replace('<span class="beta">시뮬레이터 β · Babylon</span>', '<span class="beta">시뮬레이터 · Babylon</span>');
mkdirSync('dist/main', { recursive: true }); writeFileSync('dist/main/index.html', mainHtml);
const ghHtml = mainHtml.replace('<link rel="preconnect" href="https://fonts.googleapis.com">', '<meta name="theme-color" content="#0b1120"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><link rel="preconnect" href="https://fonts.googleapis.com">')
  .replace('<script src="app.js?v=__BUILD__"></script>'.replace('__BUILD__', stamp), `<script src="app.js?v=${stamp}"></script>\n<script>if ('serviceWorker' in navigator && location.protocol === 'https:') { navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}); }</script>`);
mkdirSync('dist/gh', { recursive: true }); writeFileSync('dist/gh/index.html', ghHtml);
const kb = (f) => (statSync(f).size / 1024).toFixed(0) + 'KB';
console.log(`app.js ${kb('dist/app.js')} · worker.js ${kb('dist/worker.js')} · index.html ${kb('dist/index.html')} · build ${stamp}`);
