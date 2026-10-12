/* ───────────── 4단계 ①: 블록카 · 튜닝 · 레이스 · 점프대 · 겉날개 ─────────────
   블록카: 3장(렌치 형) 보상 · 블록폰 연락처로 불러요 · W/S 가속·브레이크 · A/D 조향 · Space 손브레이크(드리프트) · Shift 니트로
   튜닝: 렌치 형 정비소에서 엔진 · 타이어 · 니트로 · 색
   레이스: 블록폰 🏁 앱 · 길 따라 체크포인트 · 최고 기록 · 기준 기록 안이면 보상
   점프대: 밟거나 차로 지나가면 높이 뛰어요 · 겉날개: 떨어지는 중에 점프 → 활공 · 달리기(Shift) = 폭죽 가속 */

// ── 아이템 ──
mpAdd("mp_elytra", "겉날개", "🪽", "t", 1200);
mpAdd("firework_rocket", "폭죽 로켓", "🎆", "r", 15);
const RAMP = MPI.newBlocks.stunt_ramp;
mpAdd("stunt_ramp", "점프대", "🟨", "blk", 40); MPI.blockOf.stunt_ramp = RAMP; MPI.itemOf[RAMP] = "stunt_ramp";
Object.assign(Kt[RAMP], { n: "점프대", deco: 1, g: 1, door: 1, d: "stunt_ramp", d0: 1, d1: 1, h: 1.2 });
MP.recipes.push({ o: ["stunt_ramp", 2], i: [["yellow_concrete", 3], ["iron_ingot", 1]], at: "table", cat: "블록" });
MP.recipes.push({ o: ["firework_rocket", 3], i: [["paper", 1], ["gunpowder", 1]], at: "hand", cat: "재료" });
SHOP.push(["탈것", [["stunt_ramp", 4, 300], ["firework_rocket", 8, 240], ["mp_elytra", 1, 6000]]]);
{ // 점프대 모양 (노랑·검정 줄무늬 발판)
  const prev = DECO.build;
  DECO.build = (id, x, yy, z) => {
    if (id !== RAMP) return prev(id, x, yy, z);
    const g = new v.Group(); g.position.set(x + .5, yy, z + .5);
    const tex = mpTileTex(MPT.RAMP);
    const top = new v.Mesh(new v.BoxGeometry(.96, .16, .96), [0, 1, 2, 3, 4, 5].map(i => new v.MeshStandardMaterial({ color: i === 2 ? 0xffffff : 0x2a2a2a, map: i === 2 ? tex : null, roughness: .7 })));
    top.position.y = .08; top.receiveShadow = true; g.add(top);
    const ring = new v.Mesh(new v.TorusGeometry(.42, .035, 6, 24), new v.MeshStandardMaterial({ color: 0xf5c542, emissive: 0xf5c542, emissiveIntensity: .9 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = .17; g.add(ring);
    return g;
  };
}

// ── 블록카 ──
const CAR = (MP.car = { own: 0, col: 0, eng: 0, tire: 0, nos: 0, on: false, m: null, x: 0, z: 0, y: 0, h: 0, vx: 0, vz: 0, vy: 0, air: 0, nosT: 0, nosE: 1, parked: null, wheels: [], snd: null });
const CAR_COLS = [0xe5484d, 0xf5c542, 0x2f6fed, 0x16a34a, 0xf2f2f2, 0x23262e, 0x8a5cf6, 0xf97316];
const CAR_COLN = ["빨강", "노랑", "파랑", "초록", "하양", "검정", "보라", "주황"];
const carModel = (col, eng, nos) => {
  const g = new v.Group(), wheels = [], flames = [];
  const M = (cl, em, rough = .45) => new v.MeshStandardMaterial({ color: cl, roughness: rough, metalness: .15, emissive: em ? cl : 0x000000, emissiveIntensity: em ? 1.3 : 0 });
  const box = (w, h, d, m, x, yy, z, rx) => { const b = new v.Mesh(new v.BoxGeometry(w, h, d), m); b.position.set(x, yy, z); if (rx) b.rotation.x = rx; b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const paint = M(CAR_COLS[col] || CAR_COLS[0]), dark = M(0x1d2028, 0, .8), glass = new v.MeshStandardMaterial({ color: 0x9fd3ff, transparent: true, opacity: .45, roughness: .1 });
  box(1.9, .45, 3.4, paint, 0, .55, 0);                 // 몸통
  box(1.8, .18, 1.2, paint, 0, .86, -1.1);              // 앞 덮개
  box(1.8, .2, .9, paint, 0, .87, 1.25);                // 뒤 덮개
  box(1.7, .5, .06, glass, 0, 1.05, -.42, -.35);        // 앞 유리
  box(.82, .35, .62, dark, 0, .9, .3); box(.82, .62, .14, dark, 0, 1.15, .62);   // 의자
  const wh = new v.Mesh(new v.TorusGeometry(.17, .035, 6, 16), dark); wh.position.set(0, 1.08, -.12); wh.rotation.x = -.9; g.add(wh);
  box(1.96, .2, .16, dark, 0, .42, -1.72); box(1.96, .2, .16, dark, 0, .42, 1.72);   // 범퍼
  for (const s of [-1, 1]) { box(.36, .14, .06, M(0xfff2c0, 1), s * .6, .66, -1.73); box(.34, .12, .06, M(0xff2a2a, 1), s * .6, .66, 1.73); }
  if (eng >= 2) { box(1.7, .06, .36, dark, 0, 1.28, 1.58); box(.06, .3, .1, dark, -.7, 1.1, 1.58); box(.06, .3, .1, dark, .7, 1.1, 1.58); }
  const tyre = M(0x15171c, 0, .9), rim = M(0xc9ced6, 0, .3);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const w = new v.Group(); w.position.set(sx * .98, .36, sz * 1.15);
    const t = new v.Mesh(new v.CylinderGeometry(.36, .36, .3, 14), tyre); t.rotation.z = Math.PI / 2; t.castShadow = true; w.add(t);
    const r = new v.Mesh(new v.BoxGeometry(.32, .16, .16), rim); w.add(r);
    g.add(w); wheels.push(w);
  }
  if (nos) for (const s of [-1, 1]) { const f = new v.Mesh(new v.ConeGeometry(.12, .6, 8), M(0xff8a1f, 1)); f.rotation.x = Math.PI / 2; f.position.set(s * .45, .5, 2.05); f.visible = false; g.add(f); flames.push(f); }
  // 번호판
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 40; const cx2 = cv.getContext("2d"); cx2.fillStyle = "#f4f4f4"; cx2.fillRect(0, 0, 128, 40); cx2.fillStyle = "#1b1f27"; cx2.font = '700 22px "IBM Plex Sans KR",sans-serif'; cx2.textAlign = "center"; cx2.textBaseline = "middle"; cx2.fillText("블록카", 64, 21);
  const pt = new v.CanvasTexture(cv); pt.colorSpace = v.SRGBColorSpace;
  const plate = new v.Mesh(new v.PlaneGeometry(.5, .16), new v.MeshBasicMaterial({ map: pt })); plate.position.set(0, .45, 1.81); g.add(plate);
  g.userData = { wheels, flames };
  return g;
};
CAR.build = () => {
  if (CAR.m) { CAR.m.parent && CAR.m.parent.remove(CAR.m); }
  CAR.m = carModel(CAR.col, CAR.eng, CAR.nos); S.root && S.root.add(CAR.m);
  CAR.place();
};
CAR.place = () => { if (!CAR.m) return; CAR.m.position.set(CAR.x, CAR.y, CAR.z); CAR.m.rotation.y = CAR.h; };
CAR.give = () => { if (CAR.own) return; CAR.own = 1; mpSave(); setTimeout(() => mpToast("🚗 렌치 형이 블록카를 선물했어요! 블록폰 연락처 → 렌치 형으로 불러요", 4200), 4200); };
// 길가로 불러오기
CAR.call = () => {
  if (!CAR.own) return mpToast("🚗 아직 블록카가 없어요 · 3장 '정비소 친구'를 끝내면 받아요", 2200);
  if (!S.out) return mpToast("🚗 블록카는 바깥 도시에서 불러요", 1800);
  if (CAR.on) return;
  const P = c.P; let p = null; try { p = rC(P.x - Math.sin(c.yaw) * 4, P.z - Math.cos(c.yaw) * 4, 1); } catch (e) {}
  if (!p || Math.hypot(p[0] - P.x, p[1] - P.z) > 40 || MP.inMine && MP.inMine()) p = [P.x - Math.sin(c.yaw) * 3, P.z - Math.cos(c.yaw) * 3];
  CAR.x = p[0]; CAR.z = p[1]; CAR.h = c.yaw; CAR.y = ja(CAR.x, CAR.z, P.y + .5); CAR.vx = CAR.vz = CAR.vy = 0;
  CAR.parked = { x: CAR.x, z: CAR.z, h: CAR.h }; CAR.build();
  try { Lt("horn"); } catch (e) {}
  mpToast("🔧 렌치 형: 블록카 대령이요! 가까이 가서 " + (c.isTouch ? "대화 버튼" : ze("use")) + "으로 타요", 2600);
  MP.stat("delivers");
};
CAR.enter = () => {
  if (!CAR.m || CAR.on) return;
  try { if (et.on) sn(1); } catch (e) {}
  if (BLD.on) BLD.toggle(false);
  if (GL.on) GL.stop();
  CAR.on = true; c.mpCar = CAR; CAR.parked = null; CAR.air = 0; CAR.vy = 0;
  c.yaw = CAR.h;
  try { Lt("chestOpen", 0, .7); } catch (e) {}
  if (!CAR.tip) { CAR.tip = 1; mpToast(c.isTouch ? "🚗 조이스틱: 가속 · 조향 · 점프 버튼: 손브레이크(드리프트) · 달리기: 니트로 · 대화: 내리기" : "🚗 W/S 가속·브레이크 · A/D 조향 · Space 손브레이크(드리프트) · Shift 니트로 · " + ze("use") + " 내리기", 4200); }
  carSnd(true); spdEl.classList.add("on"); CAR.pl = 0; spdPlace();
};
CAR.exit = () => {
  if (!CAR.on) return;
  CAR.on = false; c.mpCar = 0; carSnd(false); spdEl.classList.remove("on"); spdPlace();
  const P = c.P, fx = -Math.sin(CAR.h), fz = -Math.cos(CAR.h);
  let px = CAR.x - fz * 1.9, pz = CAR.z + fx * 1.9;   // 왼쪽 문
  if (pa(px, pz, CAR.y, .3)) { px = CAR.x + fz * 1.9; pz = CAR.z - fx * 1.9; }
  if (pa(px, pz, CAR.y, .3)) { px = CAR.x - fx * 2.6; pz = CAR.z - fz * 2.6; }
  P.x = px; P.z = pz; P.y = ja(px, pz, CAR.y + .6); P.vy = 0; P.fly = 0;
  CAR.vx = CAR.vz = CAR.vy = 0; CAR.parked = { x: CAR.x, z: CAR.z, h: CAR.h };
  mpSave();
};
// 엔진 소리 (바퀴 굴러가는 웅웅 소리)
const carSnd = on => {
  try {
    if (on && !CAR.snd && wi && uA.on) {
      const o = wi.createOscillator(), o2 = wi.createOscillator(), f = wi.createBiquadFilter(), g = wi.createGain();
      o.type = "sawtooth"; o2.type = "square"; f.type = "lowpass"; f.frequency.value = 520; g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(En); o.start(); o2.start();
      CAR.snd = { o, o2, f, g };
    } else if (!on && CAR.snd) { const s = CAR.snd; CAR.snd = null; s.g.gain.setTargetAtTime(0, wi.currentTime, .05); setTimeout(() => { try { s.o.stop(); s.o2.stop(); } catch (e) {} }, 300); }
  } catch (e) {}
};
mpCss("mp-ride-css", `
#mpspd{position:fixed;right:16px;bottom:calc(98px + env(safe-area-inset-bottom,0px));z-index:12;display:none;flex-direction:column;align-items:flex-end;gap:4px;padding:8px 12px;border-radius:12px;background:rgba(22,30,46,.9);color:#fff;font:600 12px "IBM Plex Sans KR",sans-serif;pointer-events:none;box-shadow:0 6px 18px rgba(0,0,0,.25)}
#mpspd.on{display:flex}
#mpspd b{font:700 26px "IBM Plex Sans KR",sans-serif;font-variant-numeric:tabular-nums;line-height:1}
#mpspd b small{font-size:12px;font-weight:600;margin-left:3px;color:#b8c4d6}
#mpspd .nos{display:flex;align-items:center;gap:6px;color:#b8c4d6}
#mpspd .nos i{display:block;width:70px;height:6px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden}
#mpspd .nos i u{display:block;height:100%;background:#f5c542}
@media (pointer:coarse){#mpspd{right:auto;left:50%;transform:translateX(-50%);bottom:auto;top:calc(84px + env(safe-area-inset-top,0px));flex-direction:row;align-items:center;gap:10px;padding:6px 12px}#mpspd b{font-size:20px}}
body.mpcar #qbar{display:none!important}
body.mpcar #mpspd{top:var(--mpspdt,150px);bottom:auto}
@media (pointer:coarse){body.mpcar #mpspd{left:calc(12px + env(safe-area-inset-left,0px));right:auto;transform:none;flex-direction:column;align-items:flex-start;gap:4px}}
body.mpcar #mpbtnb{display:none!important}
#mprace{position:fixed;left:50%;top:calc(42px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:13;display:none;align-items:center;gap:10px;padding:7px 16px;border-radius:999px;background:rgba(22,30,46,.92);color:#fff;font:600 13.5px "IBM Plex Sans KR",sans-serif;pointer-events:none;white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.25)}
#mprace.on{display:flex}
#mprace b{color:#f5c542}
#mprace i{font-style:normal;font:700 16px "IBM Plex Sans KR",sans-serif;font-variant-numeric:tabular-nums}
body.mpracing #mpobj{display:none!important}
#mpcount{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:20;font:800 96px "IBM Plex Sans KR",sans-serif;color:#f5c542;text-shadow:0 6px 24px rgba(0,0,0,.6),0 0 2px #000;pointer-events:none;display:none}
#mpcount.on{display:block;animation:mpPop .9s ease-out}
@keyframes mpPop{0%{transform:translate(-50%,-50%) scale(1.6);opacity:0}25%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(.9);opacity:.15}}
#mptune .tg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#mptune .sw{height:34px;border-radius:9px;border:2px solid rgba(255,255,255,.2);cursor:pointer}
#mptune .sw.on{border-color:#f5c542;box-shadow:0 0 0 2px #f5c542}
`);
const spdEl = mpEl("div", { id: "mpspd", "aria-hidden": "true" }, '<b>0<small>km/h</small></b><span class="nos">니트로 <i><u></u></i></span>');
const raceEl = mpEl("div", { id: "mprace", "aria-live": "polite" });
const countEl = mpEl("div", { id: "mpcount", "aria-hidden": "true" });
document.body.append(spdEl, raceEl, countEl);
// 운전 화면: 바로가기 줄을 접고 그 자리에 계기판 (컴퓨터는 오른쪽 · 휴대폰은 미니맵 아래 왼쪽)
const spdPlace = () => {
  try {
    const b = document.body;
    if (b.classList.contains("mpcar") !== !!CAR.on) b.classList.toggle("mpcar", !!CAR.on);
    if (!CAR.on) return;
    const q = J("qbar"); const qt = q ? Math.round(parseFloat(getComputedStyle(q).top)) || 150 : 150;
    if (qt !== CAR.qt) { CAR.qt = qt; spdEl.style.setProperty("--mpspdt", qt + "px"); }
  } catch (e) {}
};

const angd = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const carBlocked = (x, z, yy) => !ia(x, z) || pa(x, z, yy, .95) || !!(MP.mineWall && MP.mineWall(x, z));
const carTick = dt => {
  if (!CAR.on) return;
  dt = Math.min(dt, .05);
  const P = c.P;
  if (!S.out || c.bm || c.pvLock) { CAR.exit(); return; }
  if (et.on) { CAR.exit(); return; }
  // 입력 (키보드 · 휴대폰 조이스틱 · 버튼)
  const fwd = mpClamp((rr.KeyW ? 1 : 0) - (rr.KeyS ? 1 : 0) - (Do.y || 0), -1, 1);
  const str = mpClamp((rr.KeyD ? 1 : 0) - (rr.KeyA ? 1 : 0) + (Do.x || 0), -1, 1);
  const hb = !!(rr.Space || Go.jump) && !mpBusy(), nosK = !!(rr.ShiftLeft || rr.ShiftRight || Go.run);
  const engMul = (1 + .12 * CAR.eng) * (MP.heroMul ? MP.heroMul("car") : 1);
  // 니트로
  if (CAR.nos && nosK && CAR.nosE > .05 && fwd > .1) { CAR.nosT = .1; CAR.nosE = Math.max(0, CAR.nosE - dt / (CAR.nos >= 2 ? 3.5 : 2)); }
  else { CAR.nosT = 0; CAR.nosE = Math.min(1, CAR.nosE + dt / 9 * (MP.heroMul ? MP.heroMul("nos") : 1)); }
  const boost = CAR.nosT > 0;
  // 조향 → 새 방향 기준으로 앞 · 옆 속도 나누기
  let vf0 = CAR.vx * -Math.sin(CAR.h) + CAR.vz * -Math.cos(CAR.h);
  if (!CAR.air) { const sp = Math.abs(vf0), k = Math.min(1, sp / 4.5) * (1 - .45 * Math.min(1, sp / 32)); CAR.h -= str * 2.35 * k * (vf0 < -.3 ? -1 : 1) * (hb ? 1.4 : 1) * dt; }
  const fx = -Math.sin(CAR.h), fz = -Math.cos(CAR.h), rx = -fz, rz = fx;
  let vf = CAR.vx * fx + CAR.vz * fz, vs = CAR.vx * rx + CAR.vz * rz;
  if (!CAR.air) {
    const top = 24 * engMul * (boost ? 1.35 : 1), acc = 12 * engMul * (boost ? 1.75 : 1);
    if (fwd > .1) vf += (vf < -.5 ? 32 : acc * (vf > top ? 0 : 1)) * fwd * dt;
    else if (fwd < -.1) vf -= (vf > .5 ? 32 : 9) * -fwd * dt;
    else vf -= Math.sign(vf) * Math.min(Math.abs(vf), (2.2 + .015 * vf * vf) * dt);
    if (hb) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 6 * dt);
    if (vf > top) vf -= Math.min(vf - top, 14 * dt);
    vf = Math.max(vf, -9);
    vs *= Math.exp(-(6.5 + 1.6 * CAR.tire) * (hb ? .14 : 1) * dt);
    if (hb && Math.abs(vs) > 3 && (CAR.skid = (CAR.skid || 0) - dt) <= 0) { CAR.skid = .05; MP.fx(CAR.x - fx * 1.5, CAR.y + .1, CAR.z - fz * 1.5, [.8, .8, .82], 2, .6, .3); }
  }
  CAR.vx = fx * vf + rx * vs; CAR.vz = fz * vf + rz * vs;
  // 움직이기 · 부딪힘
  const nx = CAR.x + CAR.vx * dt, nz = CAR.z + CAR.vz * dt, yb = CAR.y;
  const bump = s => { if (s > 4 && mpNow() - (CAR.bt || 0) > 300) { CAR.bt = mpNow(); try { q("hit"); Lt("brk_stone", 0, .6); } catch (e) {} Ne.shake = Math.max(Ne.shake || 0, Math.min(.5, s / 40)); } };
  if (!carBlocked(nx, nz, yb)) { CAR.x = nx; CAR.z = nz; }
  else if (!carBlocked(nx, CAR.z, yb)) { CAR.x = nx; bump(Math.abs(CAR.vz)); CAR.vz *= -.25; CAR.vx *= .85; }
  else if (!carBlocked(CAR.x, nz, yb)) { CAR.z = nz; bump(Math.abs(CAR.vx)); CAR.vx *= -.25; CAR.vz *= .85; }
  else { bump(Math.hypot(CAR.vx, CAR.vz)); CAR.vx *= -.3; CAR.vz *= -.3; }
  // 높이 · 점프대 · 공중
  const fl = ja(CAR.x, CAR.z, CAR.y + .1);
  if (CAR.air || CAR.y > fl + .05) {
    CAR.vy -= 22 * dt; CAR.y += CAR.vy * dt; CAR.air = 1; CAR.airT = (CAR.airT || 0) + dt;
    if (CAR.y <= fl) { const land = CAR.vy; CAR.y = fl; CAR.vy = 0; CAR.air = 0; if (land < -8) { try { q("hit"); } catch (e) {} Ne.shake = Math.max(Ne.shake || 0, .35); } stuntEnd(); }
  } else {
    CAR.y = fl;
    const cell = Hr(Math.floor(CAR.x), Math.floor(CAR.y + .05), Math.floor(CAR.z));
    if (cell === RAMP && Math.abs(vf) > 5) { CAR.vy = 6.5 + Math.abs(vf) * .32; CAR.y += .05; CAR.air = 1; CAR.airT = 0; try { Lt("level", 0, 1.4); } catch (e) {} }
  }
  // 바퀴 · 불꽃 · 모형
  if (CAR.m) {
    CAR.place();
    CAR.m.rotation.z = mpClamp(-str * Math.min(1, Math.abs(vf) / 20) * .06 + vs * .006, -.12, .12);
    CAR.m.rotation.x = CAR.air ? mpClamp(-CAR.vy * .02, -.3, .3) : 0;
    const ud = CAR.m.userData; for (const w of ud.wheels) w.children[1].rotation.x += vf * dt / .36;
    ud.wheels[0].rotation.y = ud.wheels[1].rotation.y = str * .45;
    for (const f of ud.flames) { f.visible = boost; f.scale.setScalar(.8 + O() * .5); }
  }
  // 나 (운전석) · 카메라
  P.x = CAR.x; P.z = CAR.z; P.y = CAR.y + .25; P.vy = 0; P.fly = 0;
  c.pry = CAR.h + Math.PI;
  const sp = Math.hypot(CAR.vx, CAR.vz);
  if (sp > 2 && !CAR.air) c.yaw += angd(CAR.h, c.yaw) * Math.min(1, dt * 2.2);
  // 길 위 시민 놀라게
  if (sp > 8 && (CAR.pt = (CAR.pt || 0) - dt) <= 0) { CAR.pt = .5; try { Uj(CAR.x, CAR.z, 6); } catch (e) {} }
  // 소리 · 속도계
  if (CAR.snd) { const f = 48 + sp * 5.5 + (boost ? 40 : 0); CAR.snd.o.frequency.setTargetAtTime(f, wi.currentTime, .05); CAR.snd.o2.frequency.setTargetAtTime(f * .5, wi.currentTime, .05); CAR.snd.g.gain.setTargetAtTime(.035 + Math.min(.05, sp * .002), wi.currentTime, .1); CAR.snd.f.frequency.setTargetAtTime(380 + sp * 30, wi.currentTime, .1); }
  if ((CAR.ht = (CAR.ht || 0) - dt) <= 0) {
    CAR.ht = .1;
    spdEl.querySelector("b").innerHTML = Math.round(sp * 3.6) + "<small>km/h</small>";
    const n = spdEl.querySelector(".nos"); n.style.display = CAR.nos ? "" : "none"; n.querySelector("u").style.width = Math.round(CAR.nosE * 100) + "%";
    if ((CAR.pl = (CAR.pl || 0) - 1) <= 0) { CAR.pl = 5; spdPlace(); }
    mpNet("mcar", [Math.round(CAR.x * 10), Math.round(CAR.z * 10), Math.round(CAR.h * 100), CAR.col, Math.round(CAR.y * 10), CAR.eng]);
  }
};
// 스턴트 (점프대로 날면 코인)
const stuntEnd = () => {
  const t = CAR.airT || 0; CAR.airT = 0;
  if (t > .8) { const co = Math.round(t * 20); Pt(co, 1); mpToast("🤸 스턴트! 공중 " + t.toFixed(1) + "초 · 코인 +" + co, 1800); MP.stat("stunts"); }
};
// 걸어서 점프대 밟기
const rampFoot = () => {
  const P = c.P; if (CAR.on || P.fly || GL.on) return;
  if (Hr(Math.floor(P.x), Math.floor(P.y + .05), Math.floor(P.z)) !== RAMP) return;
  if (Math.abs(P.y - ja(P.x, P.z, P.y)) > .08 || P.vy > 0) return;
  P.vy = 16; P.y += .06; try { q("jump"); Lt("level", 0, 1.5); } catch (e) {}
  MP.fx(P.x, P.y, P.z, [1, .85, .3], 10, 2);
};
// 다른 사람 블록카 (같은 방 친구)
const PEERCAR = new Map();
const carNet = (k, e, peer) => {
  if (k !== "mcar") return false;
  const id = (peer && (peer.id || peer.nm)) || "?";
  const [x, z, h, col, yy, eng] = e.slice(2).map(Number);
  if (![x, z, h].every(isFinite)) return true;
  let pc = PEERCAR.get(id);
  if (!pc || pc.col !== col || pc.eng !== eng) { if (pc) pc.m.parent && pc.m.parent.remove(pc.m); pc = { m: carModel(col | 0, eng | 0, 0), col, eng }; S.root && S.root.add(pc.m); PEERCAR.set(id, pc); pc.m.position.set(x / 10, yy / 10, z / 10); }
  pc.tx = x / 10; pc.tz = z / 10; pc.ty = (yy || 0) / 10; pc.th = h / 100; pc.t = mpNow();
  return true;
};
const peerCarTick = dt => {
  for (const [id, pc] of PEERCAR) {
    if (mpNow() - pc.t > 2500 || !S.out) { pc.m.parent && pc.m.parent.remove(pc.m); PEERCAR.delete(id); continue; }
    const m = pc.m, k = Math.min(1, dt * 10);
    m.position.x += (pc.tx - m.position.x) * k; m.position.z += (pc.tz - m.position.z) * k; m.position.y += (pc.ty - m.position.y) * k;
    m.rotation.y += angd(pc.th, m.rotation.y) * k;
  }
};

// ── 튜닝 (렌치 형 정비소) ──
const TUNE = {
  eng: { n: "엔진", ic: "⚙️", max: 3, pr: [800, 1600, 3200], d: "최고 속도 · 가속 +12%" },
  tire: { n: "타이어", ic: "🛞", max: 3, pr: [600, 1200, 2400], d: "덜 미끄러져요" },
  nos: { n: "니트로", ic: "🔥", max: 2, pr: [1500, 3000], get d() { return c.isTouch ? "달리기 버튼으로 확 빨라져요" : "Shift(달리기)로 확 빨라져요"; } },
};
const tuneOpen = () => {
  if (!CAR.own) return mpToast("🚗 블록카가 없어요", 1400);
  const rows = Object.entries(TUNE).map(([k, t]) => {
    const lv = CAR[k] | 0, next = lv < t.max ? t.pr[lv] : 0;
    return `<div class="mprow"><span class="ic">${t.ic}</span><span class="tx"><b>${t.n} Lv.${lv}/${t.max}</b><span class="mpsub">${t.d}</span></span><span class="bt">${next ? `<button class="mpbtn pri" data-mp="tune:${k}"${(c.coins || 0) < next ? " disabled" : ""}>올리기 · ${Ge(next)}</button>` : `<span class="mpchip ok">최고</span>`}</span></div>`;
  }).join("");
  const sw = CAR_COLS.map((cl, i) => `<button class="sw${CAR.col === i ? " on" : ""}" style="background:#${cl.toString(16).padStart(6, "0")}" data-mp="tunecol:${i}" aria-label="${CAR_COLN[i]}"></button>`).join("");
  Br(`<i data-view="mptune" hidden></i><div id="mptune"><h2>🔧 괴산 커스텀 · 블록카 튜닝</h2><div class="mpnote">지갑 ${Ge(c.coins || 0)} 코인 · 튜닝은 바로 적용돼요</div><div class="mplist">${rows}<div class="mprow" style="flex-direction:column;align-items:stretch"><b>🎨 색칠 · 200 코인</b><div class="tg">${sw}</div></div></div></div>`, "mptw");
};
MP.click.tune = k => {
  const t = TUNE[k], lv = CAR[k] | 0; if (!t || lv >= t.max) return;
  const pr = t.pr[lv]; if ((c.coins || 0) < pr) return mpToast("코인이 모자라요", 1200);
  Pt(-pr, 1); CAR[k] = lv + 1; try { Lt("anvil", 0, 1.2); } catch (e) {}
  mpToast("🔧 " + t.n + " Lv." + CAR[k] + "!", 1600); if (CAR.m) CAR.build(); mpSave(); tuneOpen();
};
MP.click.tunecol = i => {
  i = +i; if (CAR.col === i) return; if ((c.coins || 0) < 200) return mpToast("코인이 모자라요", 1200);
  Pt(-200, 1); CAR.col = i; try { Lt("splash", 0); } catch (e) {} if (CAR.m) CAR.build(); mpSave(); tuneOpen();
};

// ── 레이스 ──
const RACE = (MP.race = { best: {}, done: {}, cur: null, sel: null });
const RACES = {
  front: { n: "학교 앞 한 바퀴", par: 26, pts: [[1, -2], [1, -3], [0, -3], [0, -2], [1, -2]] },
  down: { n: "도심 질주", par: 52, pts: [[0, -2], [1, -2], [2, -2], [3, -2], [3, -3], [3, -4], [2, -4], [1, -4], [0, -4], [0, -3], [0, -2]] },
  alley: { n: "골목 스프린트", par: 36, pts: [[-1, -2], [-2, -2], [-2, -3], [-2, -4], [-1, -4], [-1, -5], [0, -5]] },
};
RACE.name = k => (RACES[k] ? RACES[k].n : k);
RACE.ok = k => {
  const r = RACES[k]; if (!r) return false;
  for (let i = 1; i < r.pts.length; i++) {
    const [ax, az] = r.pts[i - 1], [bx, bz] = r.pts[i];
    const w = az === bz ? Un(Math.min(ax, bx), az) : Tn(ax, Math.min(az, bz));
    if (!(w > 0) || !ia((ax + bx) * 32, (az + bz) * 32)) return false;
  }
  return true;
};
RACE.cps = k => RACES[k].pts.map(([gx, gz]) => [gx * 64, gz * 64]);
RACE.road = (gx, gz) => ({ v: Tn(gx, gz), h: Un(gx, gz) });   // 교차로 (gx,gz)에서 남쪽(v) · 동쪽(h)으로 가는 길 폭
const RINGS = [];
const ringMesh = () => {
  const m = new v.Mesh(new v.TorusGeometry(6, .4, 8, 40), new v.MeshBasicMaterial({ color: 0xffd400, transparent: true, opacity: .9, blending: v.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.renderOrder = 3; m.layers.set(1); return m;
};
const raceRings = () => {
  const R = RACE.cur;
  while (RINGS.length < 2) RINGS.push(ringMesh());
  if (!R && RACE.sel && S.out) {   // 고른 레이스 출발점 (초록 고리)
    const [x, z] = RACE.cps(RACE.sel)[0], nx2 = RACE.cps(RACE.sel)[1], m = RINGS[0];
    if (Math.hypot(c.P.x - x, c.P.z - z) < 160) { if (m.parent !== S.root) S.root.add(m); m.position.set(x, 5, z); m.rotation.y = Math.atan2(nx2[0] - x, nx2[1] - z); m.material.color.setHex(0x4ade80); m.material.opacity = .8; m.scale.setScalar(1); m.visible = true; RINGS[1].visible = false; return; }
  }
  RINGS.forEach((m, i) => {
    const idx = R ? R.i + i : -1, cps = R && R.cps;
    if (!R || !cps[idx] || R.cd > 0 && i > 0) { m.visible = false; return; }
    if (m.parent !== S.root) S.root.add(m);
    const [x, z] = cps[idx], nx2 = cps[idx + 1] || cps[idx - 1];
    m.position.set(x, 5, z); m.rotation.y = Math.atan2(nx2[0] - x, nx2[1] - z);
    m.material.color.setHex(i ? 0xffffff : idx === cps.length - 1 ? 0x4ade80 : 0xffd400); m.material.opacity = i ? .35 : .9;
    m.scale.setScalar(i ? .8 : 1 + Math.sin(mpNow() / 200) * .03); m.visible = true;
  });
};
RACE.go = k => {
  if (!RACE.ok(k)) return mpToast("🏁 지금은 길이 막혀서 이 레이스를 못 해요", 1800);
  RACE.sel = k; const [x, z] = RACE.cps(k)[0];
  try { Oi.on = 1; Oi.x = x; Oi.z = z; } catch (e) {}
  PH.close(); mpToast("🏁 " + RACES[k].n + " 출발점으로 길 안내 · 노란 기둥에서 " + (c.isTouch ? "대화 버튼" : ze("use")), 2600);
};
RACE.start = k => {
  if (RACE.cur || !RACE.ok(k)) return;
  PH.close();
  RACE.cur = { k, cps: RACE.cps(k), i: 1, cd: 3.2, t0: 0, last: 4 };
  document.body.classList.add("mpracing");
  try { Oi.on = 0; } catch (e) {}
};
RACE.stop = why => {
  if (!RACE.cur) return;
  RACE.cur = null; document.body.classList.remove("mpracing"); raceEl.classList.remove("on"); raceRings();
  if (why) mpToast("🏁 레이스 그만 · " + why, 1800);
};
const fmtT = ms => { const s = ms / 1000, m = Math.floor(s / 60); return (m ? m + ":" : "") + (s % 60).toFixed(2).padStart(m ? 5 : 4, "0"); };
const showCount = t => { countEl.textContent = t; countEl.classList.remove("on"); void countEl.offsetWidth; countEl.classList.add("on"); clearTimeout(showCount.t); showCount.t = setTimeout(() => countEl.classList.remove("on"), 950); };
const raceTick = dt => {
  const R = RACE.cur; raceRings(); if (!R) return;
  const P = c.P, r = RACES[R.k];
  if (!S.out || c.bm) return RACE.stop("바깥 도시를 벗어났어요");
  if (R.cd > 0) {
    R.cd -= dt; const n = Math.ceil(R.cd - .2);
    if (n !== R.last) { R.last = n; if (n > 0) { showCount(n); try { q("blip"); } catch (e) {} } else { showCount("출발!"); try { Lt("level"); } catch (e) {} R.t0 = performance.now(); } }
    raceEl.innerHTML = `<b>🏁 ${ae(r.n)}</b><span>준비…</span>`; raceEl.classList.add("on");
    return;
  }
  const t = performance.now() - R.t0, [cx, cz] = R.cps[R.i];
  if (Math.hypot(P.x - cx, P.z - cz) < 8 && Math.abs(P.y - 2) < 14) {
    R.i++; try { Lt("xp", 0, 1.2); } catch (e) {}
    if (R.i >= R.cps.length) return raceFinish(t);
  }
  if (Math.hypot(P.x - cx, P.z - cz) > 360) return RACE.stop("너무 멀리 갔어요");
  raceEl.innerHTML = `<b>🏁 ${ae(r.n)}</b><span>체크포인트 ${R.i}/${R.cps.length - 1}</span><i>${fmtT(t)}</i>${RACE.best[R.k] ? `<span class="mpsub">최고 ${fmtT(RACE.best[R.k])}</span>` : ""}`;
  raceEl.classList.add("on");
};
const raceFinish = t => {
  const k = RACE.cur.k, r = RACES[k], best = RACE.best[k], par = r.par * 1000;
  RACE.stop();
  let co = 150, msg = [];
  const nb = !best || t < best; if (nb) { RACE.best[k] = Math.round(t); if (best) { co += 50; msg.push("최고 기록!"); } }
  if (t <= par) { co += 400; msg.push("기준 기록 " + r.par + "초 안!"); if (!RACE.done[k]) { RACE.done[k] = 1; co += 1000; msg.push("첫 통과 보너스"); if (k === "down") { xM("mp_elytra", 1, 1); xM("firework_rocket", 8, 1); setTimeout(() => mpToast("🪽 겉날개를 받았어요! 높은 곳에서 떨어지다가 점프 → 활공 · " + (c.isTouch ? "달리기 버튼" : "Shift") + "로 폭죽 가속", 5200), 3800); } } }
  else msg.push("기준 기록 " + r.par + "초");
  Pt(co, 1); MP.stat("races");
  try { on("RACE FINISHED", fmtT(t) + " · " + msg.join(" · ") + " · 코인 +" + Ge(co), "pass"); } catch (e) {}
  mpSave();
};
RACE.phoneHtml = () => {
  const rows = Object.entries(RACES).map(([k, r]) => {
    const ok = RACE.ok(k), b = RACE.best[k], [x, z] = RACE.cps(k)[0], d = Math.round(Math.hypot(c.P.x - x, c.P.z - z));
    return `<div class="mpcard"><div class="row2"><span style="font-size:24px">🏁</span><span class="tx"><b>${ae(r.n)}</b><span>${ok ? `기준 ${r.par}초 · 최고 ${b ? fmtT(b) : "없음"}${RACE.done[k] ? " · ✅" : ""}` : "지금은 길이 막혀 있어요"}</span></span>${ok ? (d < 14 && S.out ? `<button class="mpbtn pri" data-mp="racego:${k}">시작</button>` : `<button class="mpbtn" data-mp="racenav:${k}">길 안내</button>`) : ""}</div></div>`;
  }).join("");
  return (RACE.cur ? `<div class="mpcard"><b>🏁 지금 달리는 중 · ${ae(RACE.name(RACE.cur.k))}</b><button class="mpbtn" data-mp="racestop">그만두기</button></div>` : "") + rows +
    `<p class="mpsub">블록카 · 탈것 · 달리기 다 돼요 · '도심 질주'를 기준 기록 안에 처음 통과하면 🪽 겉날개!</p>`;
};
MP.click.racenav = k => RACE.go(k);
MP.click.racego = k => RACE.start(k);
MP.click.racestop = () => { RACE.stop("그만뒀어요"); PH.render(); };
// 블록폰에 🏁 레이스 앱
APPS.splice(APPS.length - 1, 0, ["race", "🏁", "레이스", "#ea580c"]);
{ const prev = PH.render; PH.render = () => { if (PH.app === "race" && J("mpphb")) { J("mpphst").textContent = phTime(); J("mpphb").innerHTML = `<div class="phh"><button data-mp="phhome">‹ 홈</button><b>🏁 레이스</b></div>` + RACE.phoneHtml(); return; } prev(); }; }

// ── 겉날개 활공 ──
const GL = (MP.glide = { on: false, s: 0, boostT: 0, wing: null, jp: 0 });
const wingModel = () => {
  const g = new v.Group(), m = new v.MeshStandardMaterial({ color: 0x8f86b8, roughness: .6, side: v.DoubleSide });
  for (const s of [-1, 1]) { const w = new v.Mesh(new v.BoxGeometry(.9, .04, .55), m); w.position.set(s * .5, 1.42, .2); w.rotation.z = s * .25; w.rotation.y = -s * .25; w.castShadow = true; g.add(w); }
  return g;
};
GL.start = () => {
  GL.on = true; const P = c.P;
  GL.s = Math.max(9, Math.hypot(P.vx || 0, P.vz || 0)); GL.vy = P.vy;
  if (!GL.wing && c.pl && c.pl.g) { GL.wing = wingModel(); c.pl.g.add(GL.wing); }
  if (GL.wing) GL.wing.visible = true;
  try { Lt("chestOpen", 0, 1.6); } catch (e) {}
  if (!GL.tip) { GL.tip = 1; mpToast("🪽 활공! 아래를 보면 빨라지고 위를 보면 올라가요 · " + (c.isTouch ? "달리기" : "Shift") + " 폭죽 가속 · 점프 다시 = 접기", 3600); }
};
GL.stop = () => { GL.on = false; if (GL.wing) GL.wing.visible = false; if (c.pl && c.pl.g) c.pl.g.rotation.x = 0; };
const glideTick = dt => {
  const P = c.P;
  const jp = !!(rr.Space || Go.jump), edge = jp && !GL.jp; GL.jp = jp;
  const rk = !!(rr.ShiftLeft || rr.ShiftRight || Go.run), redge = rk && !GL.rk; GL.rk = rk;
  if (!GL.on) {
    if (!edge || CAR.on || P.fly || et.on || !mpHave("mp_elytra") || mpBusy() || c.bm) return;
    const fl = ja(P.x, P.z, P.y);
    if (P.y - fl > 2.2 && P.vy < 1) GL.start();
    return;
  }
  dt = Math.min(dt, .05);
  if (edge || CAR.on || et.on || c.bm || !c.run) return GL.stop();
  const pit = mpClamp(c.pitch || 0, -1.1, 1.3), yw = c.yaw;
  GL.s += (9.8 * Math.sin(pit) - .0057 * GL.s * GL.s) * dt;
  if (GL.boostT > 0) { GL.boostT -= dt; GL.s += 16 * dt; MP.fx(P.x, P.y + 1, P.z, [1, .6, .2], 2, .5, .25); }
  if (redge && mpHave("firework_rocket")) { mpTake("firework_rocket", 1); GL.boostT = 1.3; try { Lt("fuse", 0, 1.8); } catch (e) {} }
  GL.s = mpClamp(GL.s, 5, 46);
  const cp = Math.cos(pit), sink = Math.max(.6, 3 - GL.s * .07);
  const vx = -Math.sin(yw) * cp * GL.s, vz = -Math.cos(yw) * cp * GL.s, vy = -Math.sin(pit) * GL.s - sink;
  const nx = P.x + vx * dt, nz = P.z + vz * dt, ny = P.y + vy * dt;
  if (!ia(nx, nz) || pa(nx, nz, ny, .3) || (MP.mineWall && MP.mineWall(nx, nz))) { if (GL.s > 20) { try { q("hit"); } catch (e) {} Ne.shake = Math.max(Ne.shake || 0, .4); mpToast("💥 쿵! 벽에 부딪혔어요", 1200); } P.vy = 0; return GL.stop(); }
  const fl = ja(nx, nz, ny);
  P.x = nx; P.z = nz;
  if (ny <= fl + .05) { P.y = fl; P.vy = 0; return GL.stop(); }
  P.y = Math.min(ny, 58); P.vy = 0;
  if ((GL.wt = (GL.wt || 0) - dt) <= 0) { GL.wt = .25; try { yt(wi.currentTime, .25, 600 + GL.s * 20, 400, 1, .015 + GL.s * .0008, "bandpass"); } catch (e) {} }
};

// 컷신 카메라 뒤: 운전 중엔 내 모형을 운전석에 · 활공 중엔 몸을 눕혀요
MP.camHook = (prev => () => { prev && prev(); try { if (c.pl && c.pl.g) { if (GL.on) c.pl.g.rotation.x = 1.15; else if (c.pl.g.rotation.x) c.pl.g.rotation.x = 0; } } catch (e) {} })(MP.camHook);
{ const prev = BLD.can; BLD.can = () => !CAR.on && !GL.on && prev(); }
{ const orig = wg; wg = function () { if (CAR.on) return; return orig.apply(this, arguments); }; }
{ const orig = d0; d0 = function () { if (CAR.on) CAR.exit(); return orig.apply(this, arguments); }; }
MP.hideFP = (prev => () => prev() || CAR.on)(MP.hideFP);

// 블록폰 연락처: 렌치 형 → 블록카
{
  const prevC = PH.contacts;
  PH.contacts = () => prevC().replace(/<div class="mpcard"><div class="row2"><span style="font-size:24px">🔧<\/span><span class="tx"><b>렌치 형 \(정비사\)<\/b><span>[^<]*<\/span>/, `<div class="mpcard"><div class="row2"><span style="font-size:24px">🔧</span><span class="tx"><b>렌치 형 (정비사)</b><span>${CAR.own ? "블록카 가져다주기" + (CAR.parked ? " · 지금 세워 둔 곳에서 옮겨 와요" : "") : et && et.cur ? "내 탈것 " + (Yt[et.cur] ? Yt[et.cur][0] : "") + " 바로 배달" : "탈것이 없어요"}</span>`);
  const prevCall = MP.click.call;
  MP.click.call = k => { if (k === "mech" && CAR.own) { PH.close(); CAR.call(); return; } prevCall(k); };
}

// 가까이 가면: 블록카 타기 · 내리기 · 튜닝 · 레이스 시작
const rideNear = (L, P) => {
  if (!S.out) return;
  if (CAR.on) { L.push({ x: P.x, z: P.z, y: P.y, r: 3, l: "🚗 블록카에서 내리기", fn: () => CAR.exit() }); return; }
  if (CAR.m && CAR.parked && Math.hypot(CAR.x - P.x, CAR.z - P.z) < 3.2) L.push({ x: CAR.x, z: CAR.z, y: CAR.y, r: 3.2, l: "🚗 블록카 타기", fn: () => CAR.enter() });
  const rn2 = MP.npcs && MP.npcs.rench;
  if (rn2 && Math.hypot(rn2.x - P.x, rn2.z - P.z) < 3 && CAR.own && !(MP.story.stepOf() && MP.story.stepOf().k === "talk")) L.push({ x: rn2.x, z: rn2.z, y: rn2.y, r: 3, l: "🔧 블록카 튜닝 (괴산 커스텀)", fn: tuneOpen });
  if (!RACE.cur) for (const [k, r] of Object.entries(RACES)) { const [x, z] = RACE.cps(k)[0]; if ((RACE.sel === k || Math.hypot(x - P.x, z - P.z) < 6) && Math.hypot(x - P.x, z - P.z) < 9 && RACE.ok(k)) L.push({ x, z, y: P.y, r: 9, l: "🏁 " + r.n + " 시작 (기준 " + r.par + "초)", fn: () => RACE.start(k) }); }
};
// 세워 둔 블록카가 너무 멀면 치워요 (다시 부르면 와요)
const carKeep = () => {
  if (!CAR.m || CAR.on) return;
  const P = c.P;
  if (!S.out || Math.hypot(CAR.x - P.x, CAR.z - P.z) > 160) { CAR.m.parent && CAR.m.parent.remove(CAR.m); CAR.m = null; CAR.parked = null; }
  else if (CAR.m.parent !== S.root) S.root.add(CAR.m);
};
// 지도: 레이스 출발점 · 세워 둔 블록카
const rideMarks = (ctx, X, Z, big) => {
  ctx.save(); ctx.font = (big ? 22 : 30) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (!RACE.cur) for (const k of Object.keys(RACES)) if (RACE.ok(k)) { const [x, z] = RACE.cps(k)[0]; ctx.fillText("🏁", X(x + 6), Z(z + 6)); }
  if (CAR.m && !CAR.on) ctx.fillText("🚗", X(CAR.x), Z(CAR.z));
  if (RACE.cur && RACE.cur.cd <= 0) { const [x, z] = RACE.cur.cps[RACE.cur.i]; ctx.fillStyle = "#ffd400"; ctx.strokeStyle = "#3a2a00"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(x), Z(z), big ? 8 : 11, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};

de.add({
  id: "mp_ride", name: "블록카 · 레이스 · 점프대 · 겉날개", need: ["mp_story", "veh", "collide"],
  gives: "MP.car 블록카 (call · enter · exit · 튜닝) · MP.race 레이스 (best · name) · MP.glide 겉날개 활공 · 점프대",
  near: rideNear, net: carNet,
  tick: dt => { carTick(dt); peerCarTick(dt); raceTick(dt); glideTick(dt); rampFoot(); if ((CAR.kt = (CAR.kt || 0) - dt) <= 0) { CAR.kt = 1; carKeep(); } },
  step: () => !!(CAR.on || GL.on),
  miniMarks: (ctx, X, Z) => rideMarks(ctx, X, Z, 0),
  bigMarks: (ctx, X, Z) => rideMarks(ctx, X, Z, 1),
  miniEdge: f => { if (RACE.cur && RACE.cur.cd <= 0) { const [x, z] = RACE.cur.cps[RACE.cur.i]; f(x, z, "#ffd400"); } },
  save: e => { e.mpr = { v: 1, car: { own: CAR.own, col: CAR.col, eng: CAR.eng, tire: CAR.tire, nos: CAR.nos }, best: RACE.best, done: RACE.done }; },
  load: e => {
    const d = e && e.mpr; if (CAR.on) CAR.exit(); if (CAR.m) { CAR.m.parent && CAR.m.parent.remove(CAR.m); CAR.m = null; } CAR.parked = null;
    CAR.own = 0; CAR.col = 0; CAR.eng = CAR.tire = CAR.nos = 0; RACE.best = {}; RACE.done = {};
    if (!d || typeof d !== "object") return;
    const cr = d.car || {};
    CAR.own = cr.own ? 1 : 0; CAR.col = mpClamp(cr.col | 0, 0, CAR_COLS.length - 1); CAR.eng = mpClamp(cr.eng | 0, 0, 3); CAR.tire = mpClamp(cr.tire | 0, 0, 3); CAR.nos = mpClamp(cr.nos | 0, 0, 2);
    for (const k of Object.keys(RACES)) { if (+(d.best || {})[k] > 0) RACE.best[k] = +d.best[k]; if ((d.done || {})[k]) RACE.done[k] = 1; }
  },
  newGame: () => { CAR.own = 0; CAR.eng = CAR.tire = CAR.nos = 0; RACE.best = {}; RACE.done = {}; },
  dbg: { MPCAR: CAR, MPRACE: RACE, MPGL: GL },
});
