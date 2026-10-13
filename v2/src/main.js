// 마이폴학교 시뮬레이터 베타 — Babylon.js 판 진입점.
import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera.js';
import { Constants } from '@babylonjs/core/Engines/constants.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import '@babylonjs/core/Materials/Textures/Loaders/index.js';
import '@babylonjs/core/Engines/Extensions/engine.rawTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.cubeTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.renderTargetCube.js';
import '@babylonjs/core/Engines/Extensions/engine.renderTarget.js';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.readTexture.js';
import '@babylonjs/core/Misc/HighDynamicRange/index.js';

import { WORLD, B } from './world/blocks.js';
import { buildAtlas } from './world/textures.js';
import { VoxelWorld, ChunkManager } from './world/voxel.js';
import { generateWorld } from './world/gen.js';
import { createVoxelMaterials } from './render/materials.js';
import { PRESETS, detectTier, DynamicResolution, isMobile } from './render/quality.js';
import { Sky } from './render/sky.js';
import { Lighting } from './render/lighting.js';
import { PostFX } from './render/post.js';
import { Signs } from './game/signs.js';
import { Input } from './game/input.js';
import { Player } from './game/player.js';
import { FollowCamera } from './game/camera.js';
import { Car, Traffic } from './game/car.js';
import { Students } from './game/npc.js';
import { Builder } from './game/build.js';
import { Inventory } from './game/inventory.js';
import { Stats } from './game/stats.js';
import { Quests } from './game/quests.js';
import { Interact } from './game/interact.js';
import { HUD } from './ui/hud.js';
import { Dialog } from './ui/dialog.js';
import { Title } from './ui/title.js';
import { Net } from './net/net.js';
import { RPG } from './game/rpg.js';
import { Combat } from './game/combat.js';
import { Ride } from './game/ride.js';
import { Menu } from './ui/menu.js';
import { Teachers } from './game/teachers.js';
import { Boss } from './game/boss.js';

const $ = (id) => document.getElementById(id);
const BUILD = (document.currentScript?.src.match(/v=([^&]+)/) || [])[1] || 'dev';

class App {
  constructor() {
    this.canvas = $('game');
    this.params = new URLSearchParams(location.search);
    this.saveKey = 'mypaul.babylon.v1';
    this.save = this._loadSave();
  }
  _loadSave() { try { return JSON.parse(localStorage.getItem(this.saveKey) || '{}'); } catch { return {}; } }
  _store() { try { localStorage.setItem(this.saveKey, JSON.stringify(this.save)); } catch { /* 저장 불가 환경 */ } }

  async boot() {
    const bar = $('loadBar'), stepEl = $('loadStep');
    const progress = (p, s) => { bar.style.width = `${Math.round(p * 100)}%`; if (s) stepEl.textContent = s; };
    progress(0.02, '엔진 켜는 중');
    const engine = new Engine(this.canvas, true, { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance', adaptToDeviceRatio: false, antialias: false, doNotHandleContextLost: true, premultipliedAlpha: false }, false);
    engine.enableOfflineSupport = false;
    this.engine = engine;
    const det = detectTier(engine);
    this.mobile = det.mobile; this.detected = det; if (this.mobile) document.body.classList.add('mobile'); this.build = BUILD; this.edition = document.title.includes('베타') ? 'beta' : 'main'; this.state = 'loading';
    const tierName = this.params.get('q') || this.save.quality || det.tier;
    this.tierName = PRESETS[tierName] ? tierName : det.tier;
    this.preset = { ...PRESETS[this.tierName], noAO: this.params.has('noao'), simpleShadow: this.params.has('simpleshadow') };
    $('loadNote').textContent = `그래픽: ${det.renderer || '알 수 없음'} · 추천 화질: ${PRESETS[det.tier].label} · 빌드 ${BUILD}`;
    try { await Promise.race([document.fonts.load('400 20px "Bagel Fat One"'), new Promise((r) => setTimeout(r, 1500))]); await Promise.race([document.fonts.load('700 20px "Black Han Sans"'), new Promise((r) => setTimeout(r, 1500))]); } catch { /* 글꼴 없이 진행 */ }

    const scene = new Scene(engine);
    scene.useRightHandedSystem = false;
    scene.skipPointerMovePicking = true; scene.autoClear = true; scene.autoClearDepthAndStencil = true;
    scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.0032; scene.fogColor = new Color3(0.7, 0.8, 0.92);
    scene.ambientColor = new Color3(0, 0, 0);
    scene.imageProcessingConfiguration.applyByPostProcess = true;
    this.scene = scene;

    // 카메라 (게임 카메라가 이어받음)
    const cams = { cam: [[150, 13, 55], [128, 10, 125]], cam2: [[128, 12, 90], [128, 12, 118]], cam3: [[60, 45, 30], [128, 10, 128]], cam4: [[128, 10.5, 60], [96, 10, 44]], cam5: [[200, 12, 92], [232, 24, 118]], cam6: [[150, 10, 100], [118, 9, 104]], cam7: [[60, 40, 20], [128, 12, 128]], cam8: [[128, 10, 100], [128, 11.5, 116]], cam9: [[108.5, 9.6, 125.5], [101, 9.2, 121]], cam10: [[93, 9.6, 129.5], [160, 9.4, 129.5]], cam11: [[137.5, 13.6, 125.5], [150, 13, 122]], cam12: [[128, 9.6, 125.5], [128, 9.6, 118]], cam13: [[100, 14, 139.5], [82, 11, 139.5]], cam14: [[100, 20, 60], [128, 12, 125]], cam15: [[70.5, 9.6, 149.5], [68, 9, 147]], cam16: [[175, 12, 70], [175, 9, 89]], cam17: [[128, 9.6, 138.5], [126, 10, 134]], cam18: [[128, 13.6, 138.5], [128, 13, 128]], cam19: [[79.5, 9.6, 141], [74, 9.5, 143.5]], cam20: [[74.5, 5.6, 140], [74.5, 5.2, 125]], cam21: [[160, 9.6, 129.5], [173, 9.4, 129.5]], cam22: [[150, 9.6, 125.5], [160, 9.3, 122]] };
    const dc = cams[this.params.get('dev')] || cams.cam;
    const camera = new TargetCamera('cam', new Vector3(...dc[0]), scene);
    camera.minZ = 0.15; camera.maxZ = 900; camera.fov = (this.save.fov || 72) * Math.PI / 180;
    camera.setTarget(new Vector3(...dc[1]));
    scene.activeCamera = camera; this.camera = camera;

    // 텍스처
    progress(0.06, '재질과 텍스처 만드는 중');
    const atlas = await buildAtlas(this.preset.tile, (p) => progress(0.06 + p * 0.2));
    const mats = createVoxelMaterials(scene, atlas, this.preset);
    this.mats = mats;

    // 세계
    progress(0.28, '땅 고르기');
    const world = new VoxelWorld();
    const props = generateWorld(world, (name) => progress(0.3, name));
    this.world = world; this.props = props;
    await new Promise((r) => setTimeout(r, 0));

    // 하늘 · 조명 · 후처리
    progress(0.46, '빛과 그림자 켜는 중');
    const sky = new Sky(scene, this.preset);
    const lighting = new Lighting(scene, this.preset, sky);
    this.sky = sky; this.lighting = lighting;
    sky.time = this.params.has('time') ? +this.params.get('time') : (this.save.time ?? 9.5);
    const post = new PostFX(scene, camera, this.preset, sky);
    this.post = post;
    // 밤 조명
    for (const l of props.lamps) lighting.addPointLight(l.x, l.y, l.z, l.warm ? new Color3(1, 0.8, 0.5) : new Color3(1, 0.86, 0.62), 15, 22);
    for (const t of props.trafficLights) lighting.addPointLight(t.x + 0.5, WORLD.GROUND + 3.5, t.z + 0.5, new Color3(0.4, 1, 0.5), 5, 6);

    // 청크 메시
    progress(0.5, '조각 합치는 중');
    const chunks = new ChunkManager(scene, world, mats, this.preset.tile, `worker.js?v=${BUILD}`);
    chunks.viewDist = this.preset.viewDist;
    chunks.shadowCasters = (mesh, kind) => { if (kind !== 'glass') lighting.addCaster(mesh); };
    this.chunks = chunks;
    await chunks.whenReady();
    const spawn = this.save.pos || props.spawn;
    chunks.requestAll(spawn.x, spawn.z);
    await new Promise((resolve) => { chunks.onChunkBuilt = (n, total) => { progress(0.5 + 0.4 * n / total, `조각 합치는 중 ${n}/${total}`); if (n >= total) resolve(); }; });
    chunks.onChunkBuilt = null;

    // 간판 · 사람 · 차
    progress(0.92, '간판 달고 사람 배치 중');
    this.signs = new Signs(scene, props.signs, lighting);
    this.input = new Input(this.canvas, this.mobile);
    this.player = new Player(scene, world, spawn, this.input);
    this.followCam = new FollowCamera(camera, world, this.player, this.input, this.canvas);
    this.car = new Car(scene, world, props.carSpawn, lighting);
    this.traffic = new Traffic(scene, world, props.lanes, this.preset.cars, lighting);
    this.students = new Students(scene, world, props.npcAreas, this.preset.npc);
    this.inv = new Inventory(this.save);
    this.builder = new Builder(scene, world, chunks, this.player, this.followCam, this.input, this.inv);
    this.car.fuel = this.save.fuel ?? 70;
    for (const m of [...this.player.meshes, ...this.car.meshes, ...this.traffic.meshes, ...this.students.meshes]) lighting.addCaster(m);
    this.dyn = new DynamicResolution(engine, this.preset);
    this.dyn.enabled = this.params.has('dyn') ? this.params.get('dyn') !== '0' : (this.save.dyn ?? true);
    this.dyn.apply();
    // 게임 요소: 상태 · 일과 · 심부름 · 장소 상호작용 · 대화창
    this.stats = new Stats(this.save);
    this.quests = new Quests(this.save, this.stats);
    this.dialog = new Dialog(this);
    this.interact = new Interact(this);
    this.rpg = new RPG(this.save, this.stats);
    this.combat = new Combat(this);
    this.teachers = new Teachers(this);
    this.boss = new Boss(this);
    this.combat.hitTargets = () => this.boss.targets();
    this.rpg.extra = this.teachers.bonusStats();
    this.ride = new Ride(this);
    this.hud = new HUD(this);
    this.menu = new Menu(this);
    if (this.rpg.vehicle) this.ride.set(this.rpg.vehicle);
    this.player.speedMult = this.rpg.runMult();
    post.refreshGBufferList();

    progress(1, '준비 끝');
    // 시험용 카메라(?dev=cam): 교문 위에서 본관을 바라봄
    this.devCam = (this.params.get('dev') || '').startsWith('cam');
    this.net = new Net(this);
    this.builder.onEdit = (x, y, z, id, sh) => this.net.sendEdit(x, y, z, id, sh);
    this.builder.onEat = (it) => { const r = this.stats.apply(it.fx || {}); this.hud.tip(`${it.icon} ${it.n} 먹었어요 — ${r || '맛있다'}`, 4); this.hud.refreshStats(); };
    this.title = new Title(this);
    $('load').hidden = true;
    this.state = 'title'; this.titleT = 0;
    this.player.setVisible(false);
    this.run();
    if (this.params.has('auto')) { if (!this.save.name) this.save.name = this.params.get('name') || '시험'; if (this.params.get('auto') === 'multi' || this.params.has('net')) this.net.connect().catch(() => {}); this.startGame({ multi: this.params.get('auto') === 'multi' }); }
    else { this.title.show(); if (!this.params.has('nonet')) this.net.connect().catch((e) => console.warn('net', e)); }
  }

  // 첫 화면에서 게임으로
  startGame({ multi = false } = {}) {
    this.title.hide(); $('hud').hidden = false; $('sNameDlg').hidden = true;
    if (!this._inputStarted) { this.input.start(); this._inputStarted = true; }
    this.state = 'play'; this.player.setVisible(true); this.canvas.focus();
    this.followCam.update(0);
    if (multi) this.net.play().catch((e) => { console.warn(e); this.hud.tip('같이 하기 연결에 실패했어요 — 혼자 하기로 열렸어요', 6); });
    this.hud.refreshStats();
  }
  // 저장 지우고 처음부터 (이름 · 화질 · 플레이 방식은 유지)
  resetSave() {
    const keep = {}; for (const k of ['name', 'quality', 'fov', 'dyn', 'mode', 'flow']) if (this.save[k] !== undefined) keep[k] = this.save[k];
    this.save = keep; this._store(); this._noAutosave = true;
    const u = new URL(location.href); u.searchParams.delete('auto'); location.href = u.toString();
  }
  changeQuality(name, reload = false) {
    this.save.quality = name; if (this.sky) this.save.time = this.sky.time; this._store();
    if (reload) { const u = new URL(location.href); u.searchParams.set('q', name); if (this.state !== 'play') u.searchParams.delete('auto'); location.href = u.toString(); }
    else { this.tierName = name; }
  }

  // ---- 시간 · 상태 · 출석 ----
  // 게임 시간을 h 시간만큼 보내기(상태 변화 · 결석 판정 · 날짜 넘김)
  _timeStep(h, ctx = {}) {
    const s = this.stats; if (h <= 0) return;
    const before = this.sky.time, prevEv = s.current(before);
    let t = before + h;
    if (t >= 24) { t -= 24; s.newDay(); this.hud.tip(`새 날이에요 — D+${s.day} ${s.weekdayName}요일`, 5); }
    this.sky.time = t;
    s.tick(h, { running: ctx.running ?? (this.player.speed > 5 && !this.player.inCar), sleeping: ctx.sleeping });
    const ev = s.current(t);
    if (prevEv && (!ev || ev.name !== prevEv.name) && !s.isAttended(prevEv) && !ctx.sleeping) { s.missed++; const r = s.apply({ stress: 6, grade: prevEv.act === 'class' ? -1.5 : 0 }); this.hud.tip(`결석: ${prevEv.name} — ${r}`, 5); }
  }
  // 한 번에 여러 시간 보내기(먹기·수업·운동 등) — 15분씩 나눠서
  advance(hours, ctx = {}) {
    let left = hours;
    while (left > 1e-6) { const st = Math.min(0.25, left); this._timeStep(st, ctx); left -= st; }
    this.sky.update(this.sky.time, 0, true); this.lighting.update();
    this.hud.refreshStats();
  }
  // 잠자기 → 다음 날 06:50
  sleep() {
    const s = this.stats, t = this.sky.time, fade = $('fade');
    const ev = s.current(t); if (ev && ev.act === 'sleep') s.attend(ev);
    let hours = (6.83 - t + 24) % 24; if (hours < 0.5) hours += 24;
    const beforeDay = s.day, att = [...s.attended].filter((k) => k.startsWith(`${s.day}:`)).length, total = s.schedule().length;
    fade.classList.add('on');
    setTimeout(() => {
      this.advance(hours, { sleeping: true });
      s.energy = Math.max(s.energy, 90); s.stress = Math.max(0, s.stress - 10);
      const p = this.player.position; this.save.pos = { x: p.x, y: p.y, z: p.z }; this.saveNow();
      fade.classList.remove('on');
      this.dialog.show({ title: `좋은 아침! D+${s.day} ${s.weekdayName}요일`, sub: '06:50 기상 점호 — 생활관 로비로', lines: [`어제(D+${beforeDay}) 출석 ${att}/${total} · 심부름 ${s.total.quests}번 · 용돈 ${Math.round(s.coins).toLocaleString()}원`, `오늘: ${s.schedule().map((e) => e.name).join(' · ')}`, ...s.warnings()], options: [{ label: '일어나기', accent: true, run: () => false }] });
    }, 400);
  }
  saveNow() {
    if (this._noAutosave) return;
    const p = this.player.position; this.save.pos = { x: p.x, y: p.y, z: p.z }; this.save.time = this.sky.time; this.save.savedAt = Date.now();
    this.save.stats = this.stats.toJSON(); this.save.quests = this.quests.toJSON(); this.save.inv = this.inv.toJSON(); this.save.fuel = this.car.fuel; this.save.rpg = this.rpg.toJSON(); this.save.teachers = this.teachers.toJSON(); this.rpg.extra = this.teachers.bonusStats();
    this._store();
  }

  run() {
    const { engine, scene } = this;
    let acc = 0, frames = 0, saveT = 0;
    this.timeFlow = this.save.flow ?? 1; // 분당 시간(시)
    scene.onBeforeRenderObservable.add(() => {
      const dtMs = engine.getDeltaTime(), dt = Math.min(0.05, dtMs / 1000);
      const playing = this.state === 'play';
      // 첫 화면: 교문 앞에서 본관을 천천히 둘러보는 카메라
      if (!playing) { this.titleT += dt; const a = this.titleT * 0.06; const c = this.camera; c.position.set(146 + Math.sin(a) * 14, 13.5 + Math.sin(a * 0.7) * 0.8, 57.5 + Math.cos(a * 0.5) * 1.5); c.setTarget(new Vector3(130, 12.5, 122)); }
      // 시간
      if (playing && this.timeFlow > 0 && !this.hud.draggingTime && !this.dialog.open) this._timeStep(dt * this.timeFlow / 60);
      this.sky.update(this.sky.time, dt);
      const night = this.sky.night;
      this.lighting.update();
      this.mats.setNight(night);
      this.post.update(night);
      this.signs.update(night, this.sky.time);
      // 게임
      this.input.update();
      if (playing && !this.devCam) {
        if (this.player.inCar) this.car.update(dt, this.input, this.player); else this.player.update(dt);
        this.followCam.update(dt);
        this.builder.update(dt);
      }
      if (playing) { this.interact.update(dt); this.combat.update(dt); this.ride.update(dt); this.boss.update(dt); if (!this.boss.active && this.rpg.hp < this.rpg.maxHp) this.rpg.hp = Math.min(this.rpg.maxHp, this.rpg.hp + dt * 2); }
      this.teachers.update(dt, this.player.position);
      this.net?.update(dt);
      this.traffic.update(dt, night, this.player.position);
      this.students.update(dt, this.player.position);
      this.chunks.update(this.player.position.x, this.player.position.z);
      this.chunks.flushDirty();
      if (this.chunks.meshesChanged) { this.chunks.meshesChanged = false; this.post.refreshGBufferList(); }
      this.dyn.update(dtMs);
      // HUD
      acc += dtMs; frames++;
      if (acc > 500) { this.hud.setStats(frames * 1000 / acc, this.dyn.scale, scene.getActiveMeshes().length); acc = 0; frames = 0; }
      if (playing) this.hud.update(dt); else this.input.endFrame();
      saveT += dt; if (playing && saveT > 5) { saveT = 0; this.saveNow(); }
    });
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
  }
}

const app = new App();
window.__mypaul = app; window.__B = { MeshBuilder, PBRMaterial, Color3, Vector3 };
app.boot().catch((e) => { console.error(e); const s = $('loadStep'); if (s) { s.hidden = false; s.textContent = '문제가 생겼어요: ' + (e?.message || e); } });
