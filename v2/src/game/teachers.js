// 선생님·학교 동물 NPC — 전 판 보스 표(22명) 그대로: 별명 · 필살기 · 색. 각자 자기 방/자리 근처를 걷고, E 로 대화(인사 · 선물 · 대결).
//  호감도 0~100: 선생님마다 올려 주는 능력치가 있고 60·70·80·90·100 마다 보너스. 친한 선생님은 보스전에서 살살 해 줘요.
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { WORLD } from '../world/blocks.js';
import { makeCharacter } from './character.js';

const G = WORLD.GROUND;
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
// [이름, 별명, 필살기 키, 필살기 이름, 색, 속도, 투사체 종류, 체력, 공격 순서, 자리(x, z, y, 반경), 올려 주는 능력치, 겉모습]
export const TEACHERS = [
  { n: '박남규 선생님', t: '영어 단어의 제왕', sig: 'spell', sn: '스펠링 포위', col: 4881919, spd: 1, pk: 'word', hp: 600, at: ['proj', 'proj', 'shield', 'slam', 'rain'], home: [104.5, 135.5, G, 3], stat: 'study', look: { top: '#2b3f6b', bottom: '#1b2235', hair: '#1a1410' }, lines: ['Vocabulary is power! 오늘 단어 30개 외웠니?', '영어는 매일 조금씩. 단어장 꺼내 봐.', '스펠링 시험 볼까? 농담이야… 반은.'] },
  { n: '육민정 선생님', t: '대청소 대장', sig: 'sweep', sn: '대걸레 휘두르기', col: 3852448, spd: 1.1, pk: 'clean', hp: 600, at: ['proj', 'proj', 'slam', 'dash'], home: [151.5, 135.5, G + 4, 3], stat: 'rep', look: { top: '#3a7d5c', bottom: '#20303d', hair: '#2a1a12', skirt: true }, lines: ['English Immersion! 오늘은 영어로만 말하기.', '교실 바닥 봤니? 대걸레 가져와.', 'translate → summarize → present. 알지?'] },
  { n: '현지우 선생님', t: '논문 폭풍', sig: 'whirl', sn: '논문 회오리', col: 15260848, spd: 1, pk: 'a4', hp: 600, at: ['proj', 'rain', 'slam'], home: [182.5, 69, G, 3], stat: 'project', look: { top: '#5a4a7a', bottom: '#1b1b24', hair: '#111' }, lines: ['논문 초안 어디까지 썼어?', '컴퓨터는 거짓말을 안 해. 코드가 틀린 거지.', '별관에 오면 과자 있어. 연구하고 먹자.'] },
  { n: '김광호 선생님', t: '학생 소환술사', sig: 'minion', sn: '학생 돌격대', col: 16751164, spd: 1, pk: 'student', hp: 600, at: ['proj', 'proj', 'dash', 'slam'], home: [114.5, 122.5, G + 4, 3], stat: 'focus', look: { top: '#8a5a2a', bottom: '#22262e', hair: '#1a1410' }, lines: ['융합연구 세미나 발표 준비됐지?', '학생들! 다 같이 모여 봐!', '질문이 좋아야 연구가 좋아져.'] },
  { n: '박재현 선생님', t: '코딩 에러', sig: 'grid', sn: '레이저 그리드', col: 4251903, spd: 1, pk: 'laptop', hp: 600, at: ['proj', 'proj', 'slam', 'dash'], home: [103.5, 122.5, G + 4, 3], stat: 'study', look: { top: '#2a4a8a', bottom: '#1b2235', hair: '#222' }, lines: ['LST 문제 30개, 오늘 안에 풀 수 있지?', '수리통합논술은 생각을 글로 쓰는 거야.', 'Syntax error… 세미콜론 하나 빠졌네.'] },
  { n: '강승환 선생님', t: '필사의 신', sig: 'rows', sn: '필사 줄 공격', col: 13148415, spd: 1, pk: 'pil', hp: 600, at: ['proj', 'rain', 'slam'], home: [115.5, 135.5, G, 3], stat: 'project', look: { top: '#2f6a3f', bottom: '#1e2a4a', hair: '#2a1a12' }, lines: ['프로젝트는 손으로 써 봐야 머리에 남아.', '창의융합탐구 주제 정했어?', '한 줄 한 줄, 필사가 기본이야.'] },
  { n: '교장선생님', t: '전교 조회', sig: 'storm', sn: '번개 조회', col: 16769120, spd: 0.8, pk: 'bolt', hp: 900, at: ['laser', 'laser', 'proj', 'slam'], home: [128.5, 122.5, G + 4, 3], stat: 'rep', look: { top: '#3a3a44', bottom: '#1b1b22', hair: '#777' }, lines: ['20대에 독립하는 능력 있는 전문가! 우리 학교 목표지.', '조회 시간에 졸면… 번개가 친다.', '사유의 힘, 감사의 마음. 잊지 마.'] },
  { n: '이상문 선생님', t: '수학 시험 출제위원', sig: 'quiz', sn: '수학 시험', col: 16734810, spd: 1, pk: 'math', hp: 600, at: ['proj', 'rain', 'slam'], home: [162.5, 135.5, G + 4, 3], stat: 'study', look: { top: '#4a3a7a', bottom: '#1b1b24', hair: '#1a1410' }, lines: ['학술제 논문 마감 D-7. 알고 있지?', '수학 시험 문제 내는 게 제일 재밌어.', '정답 원 안에 서 있으면 돼. 쉽지?'] },
  { n: '신동호 선생님', t: '그래프 마스터', sig: 'sine', sn: '사인 곡선 탄막', col: 8369919, spd: 1, pk: 'math', hp: 600, at: ['proj', 'proj', 'dash', 'rain'], home: [93.5, 135.5, G, 3], stat: 'focus', look: { top: '#1f6f8a', bottom: '#1b2235', hair: '#111' }, lines: ['DLM — 수학과 코딩을 같이 하는 거야.', '사인 곡선이 왜 예쁜지 알아?', '그래프 그려 보면 답이 보여.'] },
  { n: '교감선생님', t: '결재의 달인', sig: 'stamp', sn: '초대형 결재 도장', col: 13647936, spd: 0.9, pk: 'stamp', hp: 600, at: ['proj', 'dash', 'slam', 'rain'], home: [140.5, 135.5, G, 3], stat: 'rep', look: { top: '#5a2a2a', bottom: '#1b1b22', hair: '#333' }, lines: ['이 서류 결재 받으려면 도장 세 개.', '교무실 들어올 땐 노크부터.', '빨간 원을 피하면 돼. 도장은 크니까.'] },
  { n: '유 목사님', t: '축복과 심판', sig: 'pillar', sn: '빛의 소용돌이', col: 16773296, spd: 1, pk: 'bible', hp: 600, at: ['proj', 'rain', 'laser', 'slam'], home: [143.5, 122.5, G + 4, 3], stat: 'rep', look: { top: '#2a2a2a', bottom: '#1b1b1b', hair: '#222' }, lines: ['수요일 채플, 잊지 말고 와요.', '감사 편지 한 장이 하루를 바꿔요.', '두란노 도서관 책은 제자리에!'] },
  { n: '체육쌤', t: '피구왕', sig: 'bounce', sn: '튕기는 피구공', col: 5030526, spd: 1.35, pk: 'ball', hp: 800, at: ['proj', 'dash', 'dash', 'slam'], home: [128, 88, G, 8], stat: 'body', look: { top: '#2f6a3f', bottom: '#1e2a4a', hair: '#1a1410', tie: '#f4f4f0' }, lines: ['운동장 세 바퀴! 출발!', '피구공은 튕긴다. 알지?', '체력이 곧 실력이다.'] },
  { n: '홍 선생님', t: '서류 더미', sig: 'closein', sn: '서류 포위망', col: 14200880, spd: 1, pk: 'doc', hp: 600, at: ['proj', 'rain', 'dash'], home: [139.5, 122.5, G, 3], stat: 'rep', look: { top: '#7a4a6a', bottom: '#1b1b24', hair: '#2a1a12', skirt: true }, lines: ['행정실은 서류의 바다야.', '민원은 창구에서 받아요.', '서류 포위망에 갇히면 빈틈으로!'] },
  { n: '행정 선생님', t: '대기번호 호출', sig: 'queue', sn: '번호표 연사', col: 10135487, spd: 1, pk: 'stamp', hp: 600, at: ['proj', 'proj', 'slam', 'rain'], home: [142.5, 124.5, G, 2], stat: 'rep', look: { top: '#4a6a8a', bottom: '#1b2235', hair: '#111' }, lines: ['번호표 뽑고 기다려요.', '다음 손님! 12번!', '행정은 빠르고 정확하게.'] },
  { n: '상담선생님', t: '마음 상담', sig: 'charm', sn: '혼란의 하트', col: 16738984, spd: 1, pk: 'heart', hp: 600, at: ['proj', 'aegyo', 'slam', 'dash'], home: [151.5, 135.5, G, 3], stat: 'focus', look: { top: '#c86a8a', bottom: '#2a2a3a', hair: '#3b2a1e', skirt: true }, lines: ['오늘 기분은 어때요?', '언제든 노크하세요.', '하트에 맞으면 방향이 반대로 돼요. 조심!'] },
  { n: '사감쌤', t: '점호 대장', sig: 'closein', sn: '점호 포위망', col: 4885224, spd: 1, pk: 'doc', hp: 620, at: ['proj', 'slam', 'dash', 'rain', 'proj'], home: [69.5, 140.5, G, 2], stat: 'body', look: { top: '#2a3a2a', bottom: '#1b1b1b', hair: '#222' }, lines: ['22시 점호! 늦으면 벌점.', '세탁실은 지하, 건조는 60분.', '방 정리 안 하면 포위망이다.'] },
  { n: '여사감쌤', t: '소등 지킴이', sig: 'wall', sn: '소등 커튼', col: 16747184, spd: 1.05, pk: 'stamp', hp: 600, at: ['proj', 'proj', 'shield', 'rain', 'slam'], home: [84.5, 126.5, G, 3], stat: 'focus', look: { top: '#7a3a5a', bottom: '#1b1b24', hair: '#2a1a12', skirt: true }, lines: ['소등 시간 지나면 불 꺼요.', '여학생 생활관은 조용히!', '커튼 사이 빈틈으로 지나가 봐요.'] },
  { n: '수탉', t: '꼬꼬댁 대장', sig: 'eggs', sn: '알 폭탄 부화', col: 16756800, spd: 1.2, pk: 'egg', hp: 420, at: ['peck', 'proj', 'slam', 'dash', 'peck'], home: [110.5, 156.5, G, 5], stat: 'body', animal: 'rooster', lines: ['꼬끼오!!', '꼬꼬댁 꼬꼬… (알을 노려본다)', '꼭! 꼭! 꼭!'] },
  { n: '폴', t: '멍멍 특공대', sig: 'zoom', sn: '우다다 질주', col: 13144160, spd: 1.3, pk: 'bone', hp: 350, at: ['bite', 'aegyo', 'bite', 'dash', 'slam'], home: [160.5, 164.5, G, 6], stat: 'body', animal: 'dog', lines: ['멍! 멍!', '(꼬리를 흔든다)', '헥헥… 뼈다귀?'] },
  { n: '몽이', t: '멍멍 특공대', sig: 'zoom', sn: '우다다 질주', col: 13144160, spd: 1.3, pk: 'bone', hp: 350, at: ['bite', 'aegyo', 'bite', 'dash', 'slam'], home: [86.5, 150.5, G, 6], stat: 'body', animal: 'dog', lines: ['왕! 왕!', '(발라당 눕는다)', '산책 가자!'] },
  { n: '초코', t: '멍멍 특공대', sig: 'zoom', sn: '우다다 질주', col: 9067068, spd: 1.3, pk: 'bone', hp: 350, at: ['bite', 'aegyo', 'bite', 'dash', 'slam'], home: [92.5, 108.5, G, 6], stat: 'body', animal: 'dog', lines: ['컹!', '(운동장을 한 바퀴 돈다)', '공 던져 줘!'] },
  { n: '보리', t: '멍멍 특공대', sig: 'zoom', sn: '우다다 질주', col: 14203000, spd: 1.3, pk: 'bone', hp: 350, at: ['bite', 'aegyo', 'bite', 'dash', 'slam'], home: [71.5, 176.5, G, 5], stat: 'body', animal: 'dog', lines: ['멍멍!', '(사택 앞에서 낮잠)', '…으르렁 (장난)'] },
];
export const TEACHER_BY = Object.fromEntries(TEACHERS.map((t) => [t.n, t]));
export const STAT_NAME = { study: '학업', focus: '집중력', body: '체력', stress: '스트레스', project: '프로젝트', rep: '평판' };

function animalMesh(scene, kind, col) {
  const root = new TransformNode('animal', scene); const meshes = [];
  const mat = (c) => { const m = new StandardMaterial('am' + c, scene); m.diffuseColor = Color3.FromHexString(c); m.specularColor = Color3.Black(); return m; };
  const box = (w, h, d, c, x, y, z) => { const m = MeshBuilder.CreateBox('ab', { width: w, height: h, depth: d }, scene); m.material = mat(c); m.parent = root; m.position.set(x, y, z); m.isPickable = false; meshes.push(m); return m; };
  if (kind === 'dog') { box(0.42, 0.4, 0.8, col, 0, 0.45, 0); box(0.36, 0.36, 0.36, col, 0, 0.75, 0.5); box(0.12, 0.2, 0.1, '#222', 0.12, 0.9, 0.5); box(0.12, 0.2, 0.1, '#222', -0.12, 0.9, 0.5); box(0.2, 0.14, 0.2, '#222', 0, 0.68, 0.72); for (const [x, z] of [[-0.15, 0.28], [0.15, 0.28], [-0.15, -0.28], [0.15, -0.28]]) box(0.14, 0.26, 0.14, col, x, 0.13, z); box(0.1, 0.1, 0.4, col, 0, 0.6, -0.55).rotation.x = -0.6; }
  else { box(0.44, 0.44, 0.6, '#c9772a', 0, 0.42, 0); box(0.3, 0.3, 0.3, '#d8853a', 0, 0.78, 0.35); box(0.1, 0.14, 0.22, '#d8282a', 0, 1.0, 0.35); box(0.08, 0.08, 0.2, '#f2c230', 0, 0.76, 0.56); box(0.2, 0.42, 0.3, '#2a6a3a', 0, 0.55, -0.4).rotation.x = 0.7; for (const x of [-0.12, 0.12]) box(0.06, 0.2, 0.06, '#f2c230', x, 0.1, 0); }
  return { root, meshes, animate: (t, speed) => { root.position.y += 0; for (const m of meshes) { /* 간단: 걷기 흔들림 */ } root.rotation.z = Math.sin(t * 10) * 0.05 * Math.min(1, speed); }, setVisible: (v) => { for (const m of meshes) m.isVisible = v; } };
}
function nameTag(scene, name, sub, col) {
  const w = 320, h = 96, tex = new DynamicTexture('ttag' + name, { width: w, height: h }, scene, true); const c = tex.getContext(); c.clearRect(0, 0, w, h);
  c.fillStyle = 'rgba(11,17,32,.8)'; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 14); c.fill();
  c.font = '600 30px "IBM Plex Sans KR", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(name, w / 2, 34);
  c.font = '400 20px "IBM Plex Sans KR", sans-serif'; c.fillStyle = '#d7dce6'; c.fillText(sub, w / 2, 68);
  tex.update(true); tex.hasAlpha = true;
  const m = new StandardMaterial('ttm' + name, scene); m.diffuseTexture = tex; m.opacityTexture = tex; m.emissiveColor = Color3.White(); m.disableLighting = true; m.backFaceCulling = false;
  const p = MeshBuilder.CreatePlane('ttp' + name, { width: 1.8, height: 0.54 }, scene); p.material = m; p.billboardMode = Mesh.BILLBOARDMODE_ALL; p.isPickable = false; p.renderingGroupId = 1;
  return p;
}

export class Teachers {
  constructor(app) {
    this.app = app; this.scene = app.scene; this.list = []; this.t = 0;
    const save = app.save.teachers || {};
    this.aff = save.aff || {}; // 이름 → 호감도
    this.talked = save.talked || {}; // 이름 → 오늘 대화 day
    for (const d of TEACHERS) {
      const col = hex(d.col);
      let ch; if (d.animal) ch = animalMesh(this.scene, d.animal, col); else ch = makeCharacter(this.scene, { skin: '#f1c9a5', hair: '#1a1410', top: '#f4f4f0', bottom: '#1e2a4a', tie: '#1f7a46', skirt: false, ...d.look }, 3, 'tch_' + d.n);
      const tag = nameTag(this.scene, d.n, d.t, col); tag.parent = ch.root; tag.position.y = d.animal ? 1.6 : 2.25;
      for (const m of ch.meshes) app.lighting.addCaster(m);
      const [hx, hz, hy, r] = d.home;
      const o = { d, ch, tag, pos: new Vector3(hx, hy, hz), home: new Vector3(hx, hy, hz), r, yaw: Math.PI, target: new Vector3(hx, hy, hz), wait: 1 + Math.random() * 3, speed: 0, away: false, hidden: false };
      ch.root.position.copyFrom(o.pos); this.list.push(o);
    }
  }
  toJSON() { return { aff: this.aff, talked: this.talked }; }
  affinity(n) { return this.aff[n] || 0; }
  addAff(n, v) { this.aff[n] = Math.max(0, Math.min(100, (this.aff[n] || 0) + v)); return this.aff[n]; }
  // 호감도 보너스: 60·70·80·90·100 마다 그 능력치 +2 (RPG 능력치 계산에 더함)
  bonusStats() { const b = {}; for (const d of TEACHERS) { const a = this.aff[d.n] || 0; const steps = [60, 70, 80, 90, 100].filter((x) => a >= x).length; if (steps) b[d.stat] = (b[d.stat] || 0) + steps * 2; } return b; }
  nearest(pos, maxD = 3.2) { let best = null, bd = maxD; for (const o of this.list) { if (o.hidden) continue; const d = Vector3.Distance(o.pos, pos); if (d < bd) { bd = d; best = o; } } return best; }
  setHidden(o, v) { o.hidden = v; o.ch.setVisible(!v); o.tag.isVisible = !v; }
  update(dt, playerPos) {
    this.t += dt; const w = this.app.world;
    for (const o of this.list) {
      if (o.hidden) continue;
      const far = Vector3.DistanceSquared(o.pos, playerPos) > 90 * 90; if (far) continue; // 멀면 안 움직임
      o.wait -= dt;
      const toT = o.target.subtract(o.pos); toT.y = 0; const dist = toT.length();
      if (o.wait > 0 || dist < 0.3) { o.speed = 0; if (o.wait <= 0) { o.wait = 2 + Math.random() * 5; const a = Math.random() * Math.PI * 2, rr = Math.random() * o.r; o.target.set(o.home.x + Math.cos(a) * rr, o.home.y, o.home.z + Math.sin(a) * rr); } }
      else {
        const sp = 1.4 * (o.d.spd || 1) * (o.d.animal ? 1.4 : 1); const step = Math.min(dist, sp * dt); const dir = toT.scale(1 / dist);
        const nx = o.pos.x + dir.x * step, nz = o.pos.z + dir.z * step;
        if (!w.solidAt(nx, o.pos.y + 0.5, nz) && !w.solidAt(nx, o.pos.y + 1.4, nz)) { o.pos.x = nx; o.pos.z = nz; o.speed = 1; o.yaw = Math.atan2(dir.x, dir.z); } else { o.wait = 1; o.target.copyFrom(o.home); }
      }
      // 플레이어가 가까우면 바라봄
      const dp = playerPos.subtract(o.pos); if (dp.length() < 4 && o.speed === 0) o.yaw = Math.atan2(dp.x, dp.z);
      o.ch.root.position.copyFrom(o.pos); o.ch.root.rotation.y = o.yaw; o.ch.animate(this.t, o.speed, dt);
    }
  }
  // ---- 대화 ----
  talk(o) {
    const app = this.app, d = o.d, a = this.affinity(d.n), day = app.stats.day;
    const line = d.lines[(day + Math.floor(this.t)) % d.lines.length];
    const battle = app.save.mode !== 'chill';
    const lv = app.rpg.bossLv[d.n] || 0;
    const opts = [
      { label: '인사하기', sub: this.talked[d.n] === day ? '오늘은 이미 인사했어요' : '호감도 +3', disabled: this.talked[d.n] === day, run: () => { this.talked[d.n] = day; this.addAff(d.n, 3); app.hud.tip(`${d.n}: "${d.lines[(day + 1) % d.lines.length]}" — 호감도 ${this.affinity(d.n)}`, 5); return false; } },
      { label: '선물하기 (1,000원)', sub: '호감도 +6', disabled: !app.stats.canPay(1000), run: () => { app.stats.apply({ coins: -1000 }); this.addAff(d.n, 6); app.hud.tip(`${d.n}이(가) 좋아해요! 호감도 ${this.affinity(d.n)}`, 4); app.hud.refreshStats(); return false; } },
      { label: '같이 이야기하기 (20분)', sub: `${STAT_NAME[d.stat]} +1 · 스트레스 −3`, run: () => { app.rpg.st[d.stat] = Math.min(100, app.rpg.st[d.stat] + 1); app.stats.apply({ stress: -3 }); app.advance(0.33); this.addAff(d.n, 1); app.hud.tip(`${d.n}과(와) 이야기했어요 — ${STAT_NAME[d.stat]} +1`, 4); return false; } },
    ];
    if (battle) opts.push({ label: `⚔️ 대결 신청 — ${d.t} (보스 Lv.${lv + 1})`, sub: `필살기 ${d.sn} · 체력 ${Math.round(d.hp * 2.25 * (1 + lv * 0.15))} · 이기면 경험치 · 코인 · 장비`, accent: true, run: () => { app.boss.start(o); return false; } });
    else opts.push({ label: '대결은 전투 중심 모드에서', sub: '첫 화면 → 플레이 방식', disabled: true, run: () => false });
    app.dialog.show({ title: `${d.n} · ${d.t}`, sub: `호감도 ${a}/100 · 올려 주는 능력치: ${STAT_NAME[d.stat]} · 이긴 횟수 ${lv}`, lines: [`"${line}"`], options: opts });
  }
}
