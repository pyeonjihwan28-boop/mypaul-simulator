// 입력 — 키보드·마우스(포인터 락)·터치(조이스틱 + 시점 드래그 + 버튼)를 하나로.
export class Input {
  constructor(canvas, mobile) {
    this.canvas = canvas; this.mobile = mobile;
    this.keys = new Set();
    this.move = { x: 0, y: 0 }; // -1..1 (x: 오른쪽, y: 앞)
    this.look = { dx: 0, dy: 0 }; // 이번 프레임 시점 이동(픽셀)
    this.wheel = 0;
    this.edges = new Set(); // 한 번만 처리할 동작
    this.locked = false; this.uiOpen = false;
    this.run = false; this.jump = false;
    this.stick = { active: false, id: -1, cx: 0, cy: 0, x: 0, y: 0 };
    this.lookTouch = { id: -1, x: 0, y: 0 };
    this.hotbarSel = 0;
    this.breakHeld = false; this.placeHeld = false;
  }
  start() {
    const c = this.canvas;
    const edgeKeys = { KeyE: 'action', KeyX: 'build', KeyT: 'timeFast', Escape: 'escape', KeyF: 'camera', KeyR: 'weapon', KeyC: 'photo', Tab: 'map', KeyQ: 'nextBlock', KeyV: 'shape', Enter: 'chat', KeyM: 'menu', KeyI: 'bag' };
    window.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (!e.repeat) { this.keys.add(e.code); if (edgeKeys[e.code]) this.edges.add(edgeKeys[e.code]); if (e.code === 'Space') this.jump = true; if (/^Digit[1-9]$/.test(e.code)) { this.hotbarSel = +e.code[5] - 1; this.edges.add('hotbar'); } }
      if (e.code === 'Space' || e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    // 마우스
    c.addEventListener('click', () => { if (!this.mobile && !this.locked && !this.uiOpen) this.requestLock(); });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === c; if (!this.locked) this.keys.clear(); });
    window.addEventListener('mousemove', (e) => { if (this.locked) { this.look.dx += e.movementX; this.look.dy += e.movementY; } });
    c.addEventListener('mousedown', (e) => { if (!this.locked) return; if (e.button === 0) { this.edges.add('break'); this.breakHeld = true; } if (e.button === 2) { this.edges.add('place'); this.placeHeld = true; } });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.breakHeld = false; if (e.button === 2) this.placeHeld = false; });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('wheel', (e) => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    // 터치
    if (this.mobile) this._touch();
  }
  requestLock() { try { this.canvas.requestPointerLock?.({ unadjustedMovement: true })?.catch?.(() => this.canvas.requestPointerLock()); } catch { try { this.canvas.requestPointerLock(); } catch { /* 지원 안 함 */ } } }
  releaseLock() { if (this.locked) document.exitPointerLock?.(); }
  _touch() {
    const touch = document.getElementById('touch'); touch.hidden = false;
    const stick = document.getElementById('stick'), knob = stick.querySelector('.knob'), look = document.getElementById('look');
    const R = 44;
    stick.addEventListener('pointerdown', (e) => { const r = stick.getBoundingClientRect(); this.stick.active = true; this.stick.id = e.pointerId; this.stick.cx = r.left + r.width / 2; this.stick.cy = r.top + r.height / 2; stick.setPointerCapture(e.pointerId); this._stickMove(e, knob, R); e.preventDefault(); });
    stick.addEventListener('pointermove', (e) => { if (e.pointerId === this.stick.id) this._stickMove(e, knob, R); });
    const endStick = (e) => { if (e.pointerId === this.stick.id) { this.stick.active = false; this.stick.id = -1; this.stick.x = this.stick.y = 0; knob.style.transform = ''; } };
    stick.addEventListener('pointerup', endStick); stick.addEventListener('pointercancel', endStick);
    look.addEventListener('pointerdown', (e) => { this.lookTouch.id = e.pointerId; this.lookTouch.x = e.clientX; this.lookTouch.y = e.clientY; look.setPointerCapture(e.pointerId); this._tapT = performance.now(); this._tapMoved = 0; });
    look.addEventListener('pointermove', (e) => { if (e.pointerId !== this.lookTouch.id) return; const dx = e.clientX - this.lookTouch.x, dy = e.clientY - this.lookTouch.y; this.lookTouch.x = e.clientX; this.lookTouch.y = e.clientY; this.look.dx += dx * 1.6; this.look.dy += dy * 1.6; this._tapMoved += Math.abs(dx) + Math.abs(dy); });
    const endLook = (e) => { if (e.pointerId === this.lookTouch.id) { this.lookTouch.id = -1; if (performance.now() - this._tapT < 250 && this._tapMoved < 12) this.edges.add('tap'); } };
    look.addEventListener('pointerup', endLook); look.addEventListener('pointercancel', endLook);
    const btn = (id, down, up) => { const b = document.getElementById(id); b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); down(); }); const u = () => { b.classList.remove('on'); up && up(); }; b.addEventListener('pointerup', u); b.addEventListener('pointercancel', u); b.addEventListener('pointerleave', u); };
    btn('tJump', () => { this.jump = true; });
    btn('tRun', () => { this.runTouch = !this.runTouch; document.getElementById('tRun').classList.toggle('on', this.runTouch); }, () => { document.getElementById('tRun').classList.toggle('on', this.runTouch); });
    btn('tAct', () => this.edges.add('action'));
    btn('tBreak', () => { this.edges.add('break'); this.breakHeld = true; }, () => { this.breakHeld = false; });
    btn('tPlace', () => { this.edges.add('place'); this.placeHeld = true; }, () => { this.placeHeld = false; });
    btn('tBuild', () => this.edges.add('build'));
    btn('tChat', () => this.edges.add('chat'));
    btn('tMenu', () => this.edges.add('menu'));
    btn('tWeapon', () => this.edges.add('weapon'));
    btn('tView', () => this.edges.add('camera'));
  }
  _stickMove(e, knob, R) {
    let dx = e.clientX - this.stick.cx, dy = e.clientY - this.stick.cy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
    this.stick.x = dx / R; this.stick.y = -dy / R; knob.style.transform = `translate(${dx}px,${dy}px)`;
  }
  // 프레임마다: 키 → move
  update() {
    const k = this.keys; let x = 0, y = 0;
    if (this.uiOpen) { this.move.x = this.move.y = 0; this.run = false; this.brake = false; this.jump = false; return; }
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1; if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1; if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (this.stick.active) { x = this.stick.x; y = this.stick.y; }
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    this.move.x = x; this.move.y = y;
    this.run = k.has('ShiftLeft') || k.has('ShiftRight') || !!this.runTouch;
    this.brake = k.has('Space');
  }
  consume(name) { if (this.edges.has(name)) { this.edges.delete(name); return true; } return false; }
  endFrame() { this.look.dx = 0; this.look.dy = 0; this.wheel = 0; this.jump = false; this.edges.clear(); }
}
