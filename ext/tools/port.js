// node port.js srcDir outDir map.json oldAnalysis.json newAnalysis.json [report.json]
// 확장(src/*.js)이 쓰는 번들 이름을 옛 판 → 새 판 이름으로 바꿔요 (지역 변수와 겹치면 지역 변수 이름을 바꿔요).
const fs = require('fs'), path = require('path'), acorn = require('acorn'), escope = require('eslint-scope'), walk = require('acorn-walk');
const [,, srcDir, outDir, mapF, visAF, visBF, repF] = process.argv;
const MAP = JSON.parse(fs.readFileSync(mapF));
const visOf = f => { const A = JSON.parse(fs.readFileSync(f)); const o = {}; for (const v of A.vars) if (v.vis) o[v.name] = { def: v.def, k: v.k, w: v.w }; return o; };
const VA = visOf(visAF), VB = visOf(visBF);
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
const parts = files.map(f => ({ f, code: fs.readFileSync(path.join(srcDir, f), 'utf8') }));
let ext = "\n/* ==== 마이폴 확장: GTA5 × 마인크래프트 ==== */\n(()=>{\n";
parts.forEach((p, i) => { if (i > 0) ext += "\n"; ext += `\n/* ── ${p.f} ── */\n`; p.off = ext.length; ext += p.code; });
ext += "\n})();\n";
const ast = acorn.parse(ext, { ecmaVersion: 'latest', sourceType: 'script', ranges: true });
const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
const gs = sm.globalScope;
// shorthand properties: identifier start -> key name
const shorthand = new Map();
walk.full(ast, n => { if (n.type === 'Property' && n.shorthand) shorthand.set(n.key.start, n.key.name); });
// all identifier names in ext (for fresh-name safety)
const allNames = new Set(); for (const t of acorn.tokenizer(ext, { ecmaVersion: 'latest' })) if (t.type.label === 'name') allNames.add(t.value);
const edits = []; const renamed = new Map(); const globals = new Map(); const conflicts = new Map(); const writes = new Map(); const problems = [];
function scopeHas(s, name) { for (; s && s !== gs; s = s.upper) if (s.set.has(name)) return s.set.get(name); return null; }
for (const r of gs.through) {
  const id = r.identifier, n = id.name;
  if (VA[n]) {
    const m = MAP[n]; if (!m) { problems.push('no mapping for ' + n); continue; }
    const T = m.to; renamed.set(n, T);
    if (!m.vis || m.votes / m.tot < .8) problems.push(`이름 대응이 불확실해요: ${n} -> ${T} (${m.votes}/${m.tot})`);
    if (r.isWrite()) writes.set(n, T);
    const cv = scopeHas(r.from, T); if (cv) conflicts.set(cv, T);
    if (T !== n) edits.push({ s: id.start, e: id.end, t: shorthand.has(id.start) ? `${n}: ${T}` : T, ref: n });
  } else {
    globals.set(n, (globals.get(n) || 0) + 1);
    if (VB[n]) problems.push(`global ${n} would be captured by V109 bundle name`);
  }
}
// rename conflicting extension locals to fresh names
const fresh = new Map();
for (const [v, T] of conflicts) {
  let nm = v.name + '$m', k = 2; while (VB[nm] || allNames.has(nm)) nm = v.name + '$m' + (k++);
  allNames.add(nm); fresh.set(v.name + '@' + (v.defs[0] && v.defs[0].name.start), nm);
  const ids = new Set(); for (const idn of v.identifiers) ids.add(idn); for (const rr of v.references) ids.add(rr.identifier);
  for (const idn of ids) edits.push({ s: idn.start, e: idn.end, t: shorthand.has(idn.start) ? `${v.name}: ${nm}` : nm, ref: v.name });
}
// apply edits per file
edits.sort((a, b) => b.s - a.s);
const seen = new Set(); for (const e of edits) { const k = e.s + ':' + e.e; if (seen.has(k)) problems.push('duplicate edit at ' + k + ' ' + e.ref); seen.add(k); }
fs.mkdirSync(outDir, { recursive: true });
for (const p of parts) {
  let code = p.code; const a = p.off, b = p.off + p.code.length;
  for (const e of edits) if (e.s >= a && e.e <= b) code = code.slice(0, e.s - a) + e.t + code.slice(e.e - a);
  fs.writeFileSync(path.join(outDir, p.f), code);
}
for (const e of edits) if (!parts.some(p => e.s >= p.off && e.e <= p.off + p.code.length)) problems.push('edit outside files ' + e.ref);
// reassignment safety in V109
for (const [n, T] of writes) { const b = VB[T]; if (!b || (b.k === 'const')) problems.push(`write to ${n}->${T} but V109 decl is ${b && b.def}/${b && b.k}`); }
const rep = { renamedNames: renamed.size, edits: edits.length, conflicts: [...fresh.entries()], writes: [...writes.entries()], globals: [...globals.keys()].sort(), problems };
if (repF) fs.writeFileSync(repF, JSON.stringify({ ...rep, map: [...renamed.entries()] }, null, 1));
console.log(JSON.stringify(rep, null, 1).slice(0, 6000));
