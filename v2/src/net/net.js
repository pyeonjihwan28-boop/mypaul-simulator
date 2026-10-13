// 같이 하기 — 로비(전체 채팅 · 접속 인원 · 서버별 인원) + 서버 방(위치 동기화 · 채팅 · 블록 편집 · 새로 온 사람에게 편집 내역 보내기).
import { ClaudeTransport, TrysteroTransport, LocalTransport } from './transports.js';
import { RemotePlayers } from '../game/remote.js';

const MAX_PER_SERVER = 10, SERVERS = 9;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clean = (s) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120);

export class Net {
  constructor(app) {
    this.app = app; this.transport = null; this.lobby = null; this.room = null; this.server = null;
    this.names = new Map(); this.srvOf = new Map(); this.remote = new RemotePlayers(app);
    this.editsLog = []; this.sendT = 0; this.helloT = 0; this.status = '연결 전'; this._chatOpen = false;
  }
  get name() { return this.app.save.name || '학생'; }
  get kindLabel() { return this.transport ? ({ claude: 'claude.ai 방', p2p: '브라우저끼리 직접 연결', local: '이 브라우저 탭끼리' })[this.transport.kind] : ''; }
  async connect() {
    const want = this.app.params.get('net');
    try {
      if (want === 'local') this.transport = new LocalTransport();
      else this.transport = (want !== 'p2p' && await ClaudeTransport.make()) || new TrysteroTransport();
    } catch (e) { console.warn('net', e); this.status = '연결 실패'; this.app.title?.setOnline(1); return; }
    const L = this.lobby = this.transport.join('lobby');
    L.on('hello', (d, from) => { if (!d) return; this.names.set(from, clean(d.n).slice(0, 12) || '친구'); this.srvOf.set(from, d.s || null); if (d.want) this._hello(from); this._online(); });
    L.on('chat', (d, from) => { if (!d) return; this._chatIn(this.names.get(from) || clean(d.n) || '친구', clean(d.x), false, '전체'); });
    L.onJoin((p) => { this._hello(p, true); this._online(); });
    L.onLeave((p) => { this.names.delete(p); this.srvOf.delete(p); this._online(); });
    await L.ready;
    this.status = `연결됨 · ${this.kindLabel}`;
    this._hello(null, true); this._online();
  }
  _hello(target, want = false) { this.lobby?.send('hello', { n: this.name, s: this.server, want }, target || undefined); }
  _online() { const n = this.lobby ? this.lobby.peers().length + 1 : 1; this.app.title?.setOnline(n); $('cOnline') && ($('cOnline').textContent = this.room ? `${this.server.replace('srv-', '서버 ')} · ${this.room.peers().length + 1}명 · 전체 ${n}명` : `전체 ${n}명 접속`); return n; }
  serverCounts() { const c = {}; for (const s of this.srvOf.values()) if (s) c[s] = (c[s] || 0) + 1; if (this.server) c[this.server] = (c[this.server] || 0) + 1; return c; }
  rename(name) { this._hello(null, false); }
  // ---- 서버(방) ----
  async play() {
    if (!this.transport) await this.connect();
    if (!this.transport) { this.app.hud.tip('연결이 안 돼요 — 혼자 하기로 열렸어요', 6); return; }
    if (this.room) return;
    const counts = this.serverCounts(); let pick = null;
    for (let i = 1; i <= SERVERS; i++) { const k = `srv-${i}`; const n = counts[k] || 0; if (n > 0 && n < MAX_PER_SERVER) { pick = k; break; } } // 사람 있는 서버 먼저
    if (!pick) for (let i = 1; i <= SERVERS; i++) { if ((counts[`srv-${i}`] || 0) < MAX_PER_SERVER) { pick = `srv-${i}`; break; } }
    await this.joinServer(pick || 'srv-1');
  }
  async joinServer(name, password) {
    if (this.room) this.leaveServer();
    const R = this.room = this.transport.join(name, { password }); this.server = name;
    R.on('state', (d, from) => this.remote.state(from, d, this.names.get(from) || (d && clean(d.n))));
    R.on('chat', (d, from) => { if (!d) return; this._chatIn(this.names.get(from) || clean(d.n) || '친구', clean(d.x), false, '방'); });
    R.on('edit', (d) => { if (!d || !Array.isArray(d)) return; this.app.chunks.setBlock(d[0], d[1], d[2], d[3], d[4] || 0); this.editsLog.push(d); });
    R.on('edits', (d) => { if (!Array.isArray(d)) return; for (const e of d) { this.app.chunks.setBlock(e[0], e[1], e[2], e[3], e[4] || 0); this.editsLog.push(e); } });
    R.on('boom', (d) => { if (Array.isArray(d) && d.length >= 4) this.app.combat.remoteBoom(d[0], d[1], d[2], d[3]); });
    R.on('needsync', (d, from) => { if (!this.editsLog.length) return; const ids = [this.transport.id, ...R.peers().filter((p) => p !== from)].sort(); if (ids[0] !== this.transport.id) return; for (let i = 0; i < this.editsLog.length; i += 120) R.send('edits', this.editsLog.slice(i, i + 120), from); });
    R.onJoin((p) => { this._online(); setTimeout(() => this.app.hud.tip(`${this.names.get(p) || this.remote.map.get(p)?.name || '친구'} 님이 들어왔어요`, 4), 700); });
    R.onLeave((p) => { this.remote.remove(p); this._online(); });
    await R.ready;
    if (R.error) { this.app.hud.tip(R.error === 'not_permitted' ? '이 링크에서는 방에 들어갈 수 없어요 (로그인한 구성원만)' : `방 연결 실패 (${R.error})`, 7); this.room = null; this.server = null; return false; }
    if (password) this.srvOf.set('__pw', null);
    this._hello(null, false);
    R.send('needsync', 1);
    this.sendT = 1;
    this.app.hud.tip(`${name.startsWith('srv-') ? name.replace('srv-', '서버 ') : '방 ' + name} 접속 · ${this.kindLabel} — Enter 로 채팅`, 6);
    this._online();
    return true;
  }
  leaveServer() { if (!this.room) return; this.room.leave(); this.room = null; this.server = null; this.remote.clear(); this._hello(null, false); this._online(); }
  boom(x, y, z, r) { this.room?.send('boom', [+x.toFixed(1), +y.toFixed(1), +z.toFixed(1), +r.toFixed(2)]); }
  fired() {}
  sendEdit(x, y, z, id, shape) { const e = [x, y, z, id, shape || 0]; this.editsLog.push(e); this.room?.send('edit', e); }
  // 보내기는 타이머로(탭이 뒤에 있어도 돌게) · 받은 사람 움직임은 프레임마다
  _tick() {
    if (!this.transport) return;
    this.helloT += 0.1; if (this.helloT > 6) { this.helloT = 0; this._hello(null, false); }
    if (this.room && this.app.state === 'play') {
      const a = this.app, p = a.player;
      const d = p.inCar ? { n: this.name, x: +a.car.position.x.toFixed(2), y: +a.car.position.y.toFixed(2), z: +a.car.position.z.toFixed(2), r: +p.yaw.toFixed(2), a: 0, c: 1, h: +a.car.heading.toFixed(2) }
        : { n: this.name, x: +p.position.x.toFixed(2), y: +p.position.y.toFixed(2), z: +p.position.z.toFixed(2), r: +p.yaw.toFixed(2), a: +(p.speed / 4.3).toFixed(2) };
      this.room.send('state', d);
    }
  }
  update(dt) { if (!this._timer && this.transport) this._timer = setInterval(() => this._tick(), 100); this.remote.update(dt); }
  // ---- 채팅 ----
  chat(text) {
    text = clean(text); if (!text) return;
    const ch = this.room || this.lobby; if (!ch) return;
    ch.send('chat', { n: this.name, x: text });
    this._chatIn(this.name, text, true, this.room ? '방' : '전체');
  }
  _chatIn(name, text, mine, scope) {
    this.app.title?.addChat(name, text, mine);
    const list = $('cList'); if (!list) return;
    const d = document.createElement('div'); d.className = 'line'; d.innerHTML = `<i>${scope}</i><b>${esc(name)}</b>${esc(text)}`; if (mine) d.classList.add('me');
    list.appendChild(d); while (list.children.length > 8) list.firstChild.remove();
    $('chat').hidden = false; this._chatSeen = performance.now();
    setTimeout(() => { if (d.parentNode) d.classList.add('old'); }, 14000);
  }
  showServers() {
    const counts = this.serverCounts(), opts = [];
    for (let i = 1; i <= SERVERS; i++) { const k = `srv-${i}`, n = counts[k] || 0; opts.push({ label: `서버 ${i}  (${n}/${MAX_PER_SERVER}명)`, sub: this.server === k ? '지금 여기' : (n >= MAX_PER_SERVER ? '꽉 찼어요' : n ? '사람 있음' : '비어 있음'), disabled: n >= MAX_PER_SERVER || this.server === k, accent: n > 0 && n < MAX_PER_SERVER, run: () => { this.joinServer(k).then(() => { if (this.app.state !== 'play') this.app.startGame({ multi: false }); }); return false; } }); }
    opts.push({ label: '비밀번호 방 만들기 / 들어가기', sub: '같은 비밀번호를 아는 친구끼리', run: () => { const pw = prompt('방 비밀번호(영문·숫자)를 정하거나 입력해요'); if (!pw) return false; const nm = 'pw-' + pw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24); this.joinServer(nm, pw).then(() => { if (this.app.state !== 'play') this.app.startGame({ multi: false }); }); return false; } });
    if (this.room) opts.push({ label: '혼자 하기로 돌아가기', sub: '방에서 나가요', run: () => { this.leaveServer(); return false; } });
    this.app.dialog.show({ title: '서버 고르기', sub: `${this.status} · 전체 ${this.lobby ? this.lobby.peers().length + 1 : 1}명`, lines: this.transport ? [] : ['아직 연결 전이에요 — 잠시 뒤 다시 눌러 보세요'], options: opts });
  }
}
