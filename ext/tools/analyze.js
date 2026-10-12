// node analyze.js in.js out.json anchorRegex
const fs = require('fs'), acorn = require('acorn'), escope = require('eslint-scope'), crypto = require('crypto');
const [,, inp, outp, anchorRe] = process.argv;
const code = fs.readFileSync(inp, 'utf8');
const t0 = Date.now();
const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', ranges: true });
const sm = escope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
console.error('parsed+scoped', Date.now() - t0, 'ms');
const am = new RegExp(anchorRe).exec(code); if (!am) throw new Error('anchor not found');
const anchor = am.index;
// innermost function scope containing the anchor
let best = null;
for (const s of sm.scopes) {
  const b = s.block; if (!b.range) continue;
  if (b.range[0] <= anchor && anchor < b.range[1] && (s.type === 'function' || s.type === 'global' || s.type === 'block' || s.type === 'module')) {
    if (!best || (b.range[1] - b.range[0]) < (best.block.range[1] - best.block.range[0])) best = s;
  }
}
// climb to function scope (blocks inside are fine but we want chain)
const chain = []; for (let s = best; s; s = s.upper) chain.push(s);
console.error('anchor scope', best.type, best.block.type, best.block.range, 'chain', chain.map(s => s.type + ':' + s.variables.length).join(' > '));
// variables
const vars = new Map(); let vid = 0; const varList = [];
function idOf(v) { if (!vars.has(v)) { vars.set(v, vid++); varList.push(v); } return vars.get(v); }
const visible = new Set(); for (const s of chain) for (const v of s.variables) visible.add(v);
const posVar = new Map(); // identifier start -> var id (or -2 for unresolved global)
const globName = new Map();
for (const s of sm.scopes) {
  for (const v of s.variables) { const id = idOf(v); for (const d of v.defs) if (d.name && d.name.range) posVar.set(d.name.range[0], id); for (const idn of v.identifiers) posVar.set(idn.range[0], id); }
  for (const r of s.references) { const st = r.identifier.range[0]; if (r.resolved) posVar.set(st, idOf(r.resolved)); else if (!posVar.has(st)) { posVar.set(st, -2); } }
}
// tokens
const norm = [], tv = [], tstart = [];
const h = s => s.length > 40 ? 'H' + crypto.createHash('md5').update(s).digest('hex').slice(0, 12) : s;
for (const tok of acorn.tokenizer(code, { ecmaVersion: 'latest', ranges: true })) {
  const st = tok.start; let n, v = -1;
  if (tok.type.label === 'name') {
    const pv = posVar.get(st);
    if (pv === undefined) n = '.' + tok.value; // property / key / label
    else if (pv === -2) n = 'G:' + tok.value;
    else { n = '#'; v = pv; }
  } else if (tok.type.label === 'string' || tok.type.label === 'template' || tok.type.label === 'regexp') n = h(code.slice(tok.start, tok.end));
  else if (tok.type.label === 'num') n = code.slice(tok.start, tok.end);
  else n = tok.type.label === 'name' ? tok.value : (tok.value !== undefined && typeof tok.value === 'string' && tok.type.keyword ? tok.value : tok.type.label);
  norm.push(n); tv.push(v); tstart.push(st);
}
console.error('tokens', norm.length, Date.now() - t0, 'ms');
// items: top-level statements of the anchor function body
let body = best.block.body; if (body && body.type === 'BlockStatement') body = body.body; if (!Array.isArray(body)) body = best.block.body.body;
const items = [];
function tokIdx(off) { // first token with start >= off (binary search)
  let lo = 0, hi = tstart.length; while (lo < hi) { const m = (lo + hi) >> 1; if (tstart[m] < off) lo = m + 1; else hi = m; } return lo; }
for (const st of body) {
  if (st.type === 'VariableDeclaration' && st.declarations.length > 1) {
    for (const d of st.declarations) items.push({ s: d.range[0], e: d.range[1], k: st.kind + 'D', n: d.id.type === 'Identifier' ? d.id.name : '?' });
  } else items.push({ s: st.range[0], e: st.range[1], k: st.type, n: st.id ? st.id.name : (st.type === 'VariableDeclaration' && st.declarations[0].id.type === 'Identifier' ? st.declarations[0].id.name : '') });
}
for (const it of items) { it.t0 = tokIdx(it.s); it.t1 = tokIdx(it.e); }
const V = varList.map((v, i) => ({ id: i, name: v.name, vis: visible.has(v) ? 1 : 0, sc: v.scope.type, def: v.defs[0] ? v.defs[0].type : '', k: v.defs[0] && v.defs[0].parent && v.defs[0].parent.kind || '', ds: v.defs[0] && v.defs[0].name ? v.defs[0].name.range[0] : -1, w: v.references.some(r => r.isWrite() && !r.init) ? 1 : 0 }));
fs.writeFileSync(outp, JSON.stringify({ anchor, anchorScope: best.block.range, norm, tv, tstart, items, vars: V }));
console.error('done', items.length, 'items', V.length, 'vars', Date.now() - t0, 'ms');
