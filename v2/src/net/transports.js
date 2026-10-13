// 통신 수단 세 가지를 같은 모양으로: claude.ai 방(room) · 트리스테로(브라우저끼리 직접, 서버 없음) · 같은 브라우저 탭끼리(시험용).
//  공통 모양: { id, join(name, opts) → Channel, close() }
//  Channel: { name, send(type, data, target?), on(type, fn), peers() → id[], onJoin(fn), onLeave(fn), leave(), ready: Promise }
import { joinRoom, selfId } from 'trystero';

const APP_ID = 'mypaul-school-sim-v2';
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');

// ---- 트리스테로 (Nostr 릴레이로 서로 찾고 WebRTC 로 직접 연결) ----
export class TrysteroTransport {
  constructor() { this.id = selfId; this.kind = 'p2p'; }
  join(name, { password } = {}) {
    const room = joinRoom({ appId: APP_ID, password: password || undefined, relayConfig: { warnOnRelayFailure: false } }, name);
    const ch = new Channel(name, this.id);
    const act = room.makeAction('m');
    act.onMessage = (m, { peerId }) => { if (m && m.t) ch._recv(m.t, m.d, peerId); };
    ch._send = (type, data, target) => act.send({ t: type, d: data }, target ? { target } : undefined).catch(() => {});
    room.onPeerJoin = (p) => ch._join(p); room.onPeerLeave = (p) => ch._leave(p);
    ch._peers = () => Object.keys(room.getPeers());
    ch._leave_ = () => room.leave();
    ch.ready = Promise.resolve();
    return ch;
  }
  close() {}
}

// ---- claude.ai 아티팩트 방 (같은 페이지를 지금 보고 있는 사람들) ----
export class ClaudeTransport {
  constructor(room) { this.room = room; this.id = 'me-' + rid(); this.kind = 'claude'; this._peerOf = new Map(); }
  static async make() {
    try { if (!window.claude || typeof window.claude.use !== 'function') return null; const r = await window.claude.use('room'); return r ? new ClaudeTransport(r) : null; } catch { return null; }
  }
  join(name) {
    const ch = new Channel(name, this.id); const self = this;
    let r = null; const unsubs = [];
    const wire = (rm) => {
      r = rm;
      unsubs.push(rm.on('m', (msg) => { if (msg.sameTab) return; const d = msg.data; if (!d || !d.t) return; if (d.to && d.to !== self.id) return; self._peerOf.set(msg.peer, d.from); ch._recv(d.t, d.d, d.from || msg.peer); }));
      unsubs.push(rm.onPeers((c) => { for (const p of c.joined) if (!p.isMe) ch._join(self._peerOf.get(p.peer) || p.peer); for (const p of c.left) if (!p.isMe) ch._leave(self._peerOf.get(p.peer) || p.peer); }));
      ch._peers = () => rm.peers().filter((p) => !p.isMe).map((p) => self._peerOf.get(p.peer) || p.peer);
      ch._send = (type, data, target) => rm.emit('m', { t: type, d: data, from: self.id, to: target || undefined }).catch(() => {});
      ch._leave_ = () => { for (const u of unsubs) u(); if (rm !== self.room) rm.leave().catch(() => {}); };
    };
    if (name === 'lobby') { wire(this.room); ch.ready = Promise.resolve(); }
    else ch.ready = this.room.join(name.replace(/[^a-z0-9_.-]/g, '-').slice(0, 48)).then(wire).catch((e) => { ch.error = e?.code || 'join_failed'; });
    return ch;
  }
  close() {}
}

// ---- 같은 브라우저의 다른 탭 (BroadcastChannel) — 시험 · 한 기기에서 둘이 ----
export class LocalTransport {
  constructor() { this.id = 'tab-' + rid(); this.kind = 'local'; }
  join(name) {
    const ch = new Channel(name, this.id); const bc = new BroadcastChannel('mypaul-net:' + name); const known = new Map(); const self = this;
    bc.onmessage = (e) => {
      const m = e.data; if (!m || m.from === self.id) return; if (m.to && m.to !== self.id) return;
      if (!known.has(m.from)) { known.set(m.from, Date.now()); ch._join(m.from); if (m.t === 'hi') bc.postMessage({ t: 'hi', from: self.id, to: m.from }); }
      known.set(m.from, Date.now());
      if (m.t === 'bye') { known.delete(m.from); ch._leave(m.from); return; }
      if (m.t !== 'hi') ch._recv(m.t, m.d, m.from);
    };
    bc.postMessage({ t: 'hi', from: this.id });
    const timer = setInterval(() => { const now = Date.now(); for (const [id, t] of known) if (now - t > 25000) { known.delete(id); ch._leave(id); } bc.postMessage({ t: 'hi', from: self.id }); }, 3000);
    ch._send = (type, data, target) => bc.postMessage({ t: type, d: data, from: self.id, to: target || undefined });
    ch._peers = () => [...known.keys()];
    ch._leave_ = () => { clearInterval(timer); try { bc.postMessage({ t: 'bye', from: self.id }); } catch { /* 닫힘 */ } bc.close(); };
    ch.ready = Promise.resolve();
    return ch;
  }
  close() {}
}

export class Channel {
  constructor(name, selfId) { this.name = name; this.self = selfId; this._handlers = new Map(); this._joinFns = []; this._leaveFns = []; this.error = null; this.left = false; }
  send(type, data, target) { if (!this.left) this._send(type, data, target); }
  on(type, fn) { if (!this._handlers.has(type)) this._handlers.set(type, []); this._handlers.get(type).push(fn); }
  onJoin(fn) { this._joinFns.push(fn); } onLeave(fn) { this._leaveFns.push(fn); }
  peers() { return this._peers ? this._peers() : []; }
  _recv(type, data, from) { const hs = this._handlers.get(type); if (hs) for (const h of hs) { try { h(data, from); } catch (e) { console.warn('net handler', type, e); } } }
  _join(p) { for (const f of this._joinFns) f(p); }
  _leave(p) { for (const f of this._leaveFns) f(p); }
  leave() { if (this.left) return; this.left = true; try { this._leave_?.(); } catch { /* 무시 */ } }
}
