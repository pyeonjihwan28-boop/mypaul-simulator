// 장소 상호작용 — 가까운 장소를 찾고(E), 장소마다 할 수 있는 일(먹기·수업·운동·심부름·사기·자기)을 대화창으로 보여줘요.
// 모든 요소가 계속 쓰이게: 배고픔은 식당·매점·가게, 에너지는 잠·카페, 스트레스는 운동·노래방·상담, 성적은 수업·자습·연구, 용돈은 심부름·텃밭·퀴즈.
import { WORLD, B } from '../world/blocks.js';
import { PLACE_GROUPS } from './stats.js';
import { pickQuestions } from './quiz.js';
import { ITEMS } from './items.js';

const FOOD_BY_NAME = Object.fromEntries(Object.values(ITEMS).filter((i) => i.kind === 'food').map((i) => [i.n, i.id]));

const won = (n) => n.toLocaleString() + '원';
const SKIP = new Set(['stairhall', 'gate', 'parking']);
const hm = (t) => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

export class Interact {
  constructor(app) {
    this.app = app; this.near = null; this.attendT = 0; this.lastNearKey = '';
    // 버스 정류장 전부를 장소로
    const have = new Set(app.props.places.filter((p) => p.key === 'bus').map((p) => `${Math.round(p.x)},${Math.round(p.z)}`));
    for (const s of app.props.busStops || []) if (!have.has(`${Math.round(s.x)},${Math.round(s.z)}`)) app.props.places.push({ key: 'bus', name: `버스 정류장 (${s.name})`, x: s.x, z: s.z, stop: s.name });
  }
  get stats() { return this.app.stats; }
  get quests() { return this.app.quests; }
  // 프레임마다: 가까운 장소 · 자동 출석
  update(dt) {
    const app = this.app, p = app.player.position; let best = null, bestD = 1e9;
    if (!app.player.inCar) for (const pl of app.props.places) {
      if (SKIP.has(pl.key)) continue;
      const py = pl.y ?? WORLD.GROUND; if (Math.abs(p.y - py) > 2.6) continue;
      let d;
      if (pl.x0 !== undefined) { if (p.x >= pl.x0 && p.x < pl.x1 + 1 && p.z >= pl.z0 && p.z < pl.z1 + 1) d = 0.5; else continue; }
      else { d = Math.hypot(p.x - pl.x, p.z - pl.z); if (d > 3.6) continue; }
      if (d < bestD) { bestD = d; best = pl; }
    }
    this.near = best;
    this.nearT = app.player.inCar ? null : app.teachers?.nearest(p, 2.8);
    // 일과 장소에 2초 있으면 출석
    const ev = this.stats.current(app.sky.time);
    if (best && ev && !this.stats.isAttended(ev) && (PLACE_GROUPS[ev.place] || []).includes(best.key)) {
      this.attendT += dt;
      if (this.attendT > 2) { this.attendT = 0; this.stats.attend(ev); const r = this.stats.apply({ coins: 300, ...(ev.fx || {}) }); app.hud.tip(`출석 ✓ ${ev.name} · ${best.name} — ${r}`, 5); app.hud.refreshStats(); }
    } else this.attendT = 0;
  }
  // 안내줄: "E · 장소 — 할 일"
  prompt() {
    if (this.nearT) return `${this.app.mobile ? 'E 버튼' : 'E'} · ${this.nearT.d.n} — 이야기하기`;
    const pl = this.near; if (!pl) return '';
    const st = this.quests.stepAt(pl.key);
    return `${this.app.mobile ? 'E 버튼' : 'E'} · ${pl.name}${st ? ` — 심부름: ${st.text}` : ''}`;
  }
  // ---- 공용 동작 ----
  // 효과 + 시간 보내기
  act(label, sub, fx, hours = 0, opt = {}) {
    return { label, sub, disabled: opt.disabled, accent: opt.accent, run: () => {
      if (opt.cost && !this.stats.canPay(opt.cost)) { this.app.hud.tip(`용돈이 모자라요 (${won(opt.cost)})`); return false; }
      if (opt.cost) this.stats.apply({ coins: -opt.cost });
      if (opt.once) this.stats.markToday(opt.once);
      if (opt.give) for (const [id, n] of opt.give) this.app.builder.add(id, n);
      const r = this.stats.apply(fx || {});
      if (hours > 0) this.app.advance(hours, opt.ctx || {});
      this.app.hud.tip(`${opt.msg || label} — ${r || '완료'}${hours ? ` · ${hm(this.app.sky.time)}` : ''}`, 5);
      this.app.hud.refreshStats();
      return !!opt.keep;
    } };
  }
  // 사기 — 음식은 가방에 들어가요(핫바에서 우클릭/놓기 버튼으로 먹기). extra.eat 이면 바로 먹기.
  buy(label, cost, fx, hours = 0, extra = {}) {
    const item = extra.item || FOOD_BY_NAME[label];
    if (item && !extra.eat) {
      const it = ITEMS[item], n = extra.n || 1;
      return { label: `${it.icon} ${label}`, sub: `${won(cost)} · 가방에 넣기${extra.sub ? ' · ' + extra.sub : ''}`, disabled: !this.stats.canPay(cost), run: () => {
        const inv = this.app.inv;
        if (inv.isFull && inv.count(item) % 64 === 0) { this.app.hud.tip('가방이 가득 찼어요 — 가방(I)에서 정리해요'); return false; }
        this.stats.apply({ coins: -cost }); inv.add(item, n);
        this.app.hud.tip(`${it.n} ${n}개 샀어요 — 가방에 넣었어요 · ${this.app.mobile ? '핫바에 두고 놓기 버튼' : '핫바에 두고 우클릭'}으로 먹어요`, 5); this.app.hud.refreshStats(); return false;
      } };
    }
    return this.act(label, `${won(cost)}${extra.sub ? ' · ' + extra.sub : ''}`, fx, hours, { cost, msg: `${label} 샀어요`, disabled: !this.stats.canPay(cost), ...extra });
  }
  eatOpt() { const n = this.app.inv.slots.filter((s) => s && ITEMS[s.id]?.kind === 'food').length; return { label: '🍴 가방 열기 (음식 먹기 · 제작)', sub: n ? `음식 ${n}칸 있어요` : '음식이 없어요', run: () => { this.app.dialog.close(); this.app.menu.toggle(true, 'bag'); return true; } }; }
  onceToday(key, label, sub, fx, hours, extra = {}) { const done = this.stats.didToday(key); return this.act(label, done ? '오늘은 이미 했어요' : sub, fx, hours, { once: key, disabled: done, ...extra }); }
  questOpt(pl) {
    const st = this.quests.stepAt(pl.key); if (!st) return null;
    return { label: `심부름: ${st.text}`, sub: st.cost ? `${won(st.cost)} 내기` : '한 단계 끝내기', accent: true, run: () => {
      if (st.cost && !this.stats.canPay(st.cost)) { this.app.hud.tip(`용돈이 모자라요 (${won(st.cost)})`); return false; }
      if (st.cost) this.stats.apply({ coins: -st.cost });
      const done = this.quests.complete(pl.key);
      if (done) { const r = this.stats.apply({ coins: done.reward, stress: -3, ...(done.fx || {}) }); this.stats.total.quests++; this.app.hud.tip(`심부름 완료! ${done.title} — ${r}`, 6); }
      else this.app.hud.tip(`좋아요! 다음: ${this.quests.activeStep.text}`, 5);
      this.app.hud.refreshStats(); return false;
    } };
  }
  questBoard() {
    const q = this.quests;
    if (q.active) { const aq = q.activeQuest; return [{ label: `진행 중: ${aq.title}`, sub: `다음 — ${q.activeStep.text}`, run: () => false }, { label: '심부름 포기하기', sub: '보상 없음', run: () => { q.giveUp(); this.app.hud.tip('심부름을 그만뒀어요'); this.app.hud.refreshStats(); return false; } }]; }
    const avail = q.available();
    if (!avail.length) return [{ label: '오늘 심부름은 다 했어요', sub: '내일 다시 와요', run: () => false }];
    return avail.map((qq) => ({ label: `받기: ${qq.title}`, sub: `보상 ${won(qq.reward)} · ${qq.steps.map((s) => s.text).join(' → ')}`, run: () => { q.accept(qq.id); this.app.hud.tip(`심부름 시작: ${qq.steps[0].text}`, 5); this.app.hud.refreshStats(); return false; } }));
  }
  scheduleLines() {
    const s = this.stats, t = this.app.sky.time;
    return [`D+${s.day} ${s.weekdayName}요일 · 지금 ${hm(t)}`, ...s.schedule().map((e) => `${s.isAttended(e) ? '✓' : (t >= e.t + e.len ? '✗' : '·')} ${hm(e.t)} ${e.name}`)];
  }
  isMeal() { const ev = this.stats.current(this.app.sky.time); return ev && ev.act === 'eat'; }
  // 수업 듣기(퀴즈 3문제) — 교시 끝까지 시간이 감
  classOption(pl) {
    const ev = this.stats.current(this.app.sky.time);
    const inClass = ev && ev.act === 'class' && (pl.key === 'class' || pl.key === 'lab');
    if (inClass) return { label: `${ev.name} 듣기 (퀴즈 3문제)`, sub: `${hm(ev.t + ev.len)}까지 · 맞히면 성적↑ 용돈↑`, accent: true, run: () => { this.startQuiz(`${pl.name} · ${ev.name}`, ev); return true; } };
    return this.act('자습하기 (1시간)', '성적 +2 · 에너지 −6', { grade: 2, energy: -6, stress: 1 }, 1, { ctx: { studying: true } });
  }
  startQuiz(title, ev) {
    const s = this.stats;
    this.app.dialog.quiz(title, pickQuestions(3, s.day * 97 + Math.floor(this.app.sky.time * 7)), (ok, n) => {
      s.total.quizOk += ok; s.total.quizAll += n;
      if (ev && !s.isAttended(ev)) { s.attend(ev); }
      const r = s.apply({ grade: 1 + ok * 2.5, coins: 300 * ok, stress: 2 + (n - ok) * 2, energy: -5 });
      if (ev) { const rest = ev.t + ev.len - this.app.sky.time; if (rest > 0) this.app.advance(rest, { studying: true }); }
      this.app.hud.tip(`${ok}/${n} 맞혔어요 — ${r}`, 6); this.app.hud.refreshStats();
    });
  }
  sleepOption(pl) {
    const t = this.app.sky.time, s = this.stats;
    const early = t > 6.9 && t < 20.5 && s.energy > 35;
    return { label: '잠자기 (아침 06:50까지)', sub: early ? '아직 일러요 — 20:30 넘거나 많이 피곤할 때' : '에너지 회복 · 다음 날로', accent: !early, disabled: early, run: () => { this.app.sleep(); return false; } };
  }
  // ---- 장소별 선택지 ----
  options(pl) {
    const s = this.stats, t = this.app.sky.time, o = [];
    const q = this.questOpt(pl); if (q) o.push(q);
    switch (pl.key) {
      case 'class': o.push(this.classOption(pl), { label: '칠판 보기 (오늘 일과)', sub: '', run: () => { this.app.dialog.show({ title: '오늘 일과', lines: this.scheduleLines(), options: [] }); return true; } }, this.act('친구와 수다 (20분)', '스트레스 −6', { stress: -6 }, 0.33)); break;
      case 'cafeteria': {
        const meal = this.isMeal();
        o.push(this.act(meal ? '급식 먹기 (무료)' : '급식 먹기', meal ? '배부름 +45 · 에너지 +8' : '식사 시간이 아니라 간식만 돼요', { hunger: 45, energy: 8, stress: -3 }, 0.5, { disabled: !meal, accent: meal, ctx: { eating: true }, msg: '급식 먹었어요' }));
        o.push(this.buy('카페 가이아 아메리카노', 1500, { energy: 12, stress: -6 }, 0, { eat: true }), this.buy('카페 가이아 생과일 주스', 2500, { energy: 8, hunger: 10, stress: -8 }, 0, { eat: true }), this.buy('간식 (빵·우유)', 1000, { hunger: 20 }, 0, { eat: true }), this.act('정수기 물 마시기', '무료 · 스트레스 −1', { stress: -1, hunger: 2 }, 0), this.eatOpt());
        break;
      }
      case 'store': o.push(this.buy('빵', 1000, { hunger: 20 }), this.buy('컵라면', 1500, { hunger: 35 }, 0.3), this.buy('음료수', 800, { energy: 8, stress: -2 }), this.buy('학용품 세트', 2000, { grade: 1 }), { label: '블록 묶음 (돌·판자·벽돌 10개씩)', sub: '1,500원 · 짓기 재료', disabled: !s.canPay(1500), run: () => { s.apply({ coins: -1500 }); this.app.builder.add(B.STONE, 10); this.app.builder.add(B.PLANKS, 10); this.app.builder.add(B.BRICK, 10); this.app.hud.tip('블록 30개를 샀어요 — X 로 짓기'); this.app.hud.refreshStats(); return false; } }); o.push(this.eatOpt()); break;
      case 'lobby': case 'board': o.push(...this.questBoard(), { label: '오늘 일과 보기', sub: '', run: () => { this.app.dialog.show({ title: '오늘 일과', lines: this.scheduleLines(), options: [] }); return true; } }); break;
      case 'office': o.push(...this.questBoard(), { label: '출석 확인', sub: `지금까지 ${s.attendCount}번 출석 · 결석 ${s.missed}번`, run: () => false }, this.act('선생님께 인사', '스트레스 −2', { stress: -2 }, 0)); break;
      case 'lab': case 'lab2': case 'workshop': {
        const ev = s.current(t), ir = ev && ev.act === 'research';
        if (pl.key === 'lab' && ev && ev.act === 'class') o.push(this.classOption(pl));
        o.push(this.act(ir ? 'IR 연구하기 (끝까지)' : '연구하기 (1시간)', ir ? `${hm(ev.t + ev.len)}까지 · 성적 +4` : '성적 +3 · 에너지 −8', { grade: ir ? 4 : 3, energy: -8, stress: 3 }, ir ? Math.max(0.5, ev.t + ev.len - t) : 1, { accent: ir, ctx: { studying: true }, msg: '연구했어요' }));
        if (pl.key === 'workshop') o.push(this.buy('3D 프린터로 작품 만들기', 2000, { stress: -8, grade: 1 }, 1, { sub: '철 블록 +20', give: [[B.IRON, 20]] }), this.act('공구 정리 (30분)', '체력 +1', { fitness: 1 }, 0.5));
        else o.push(this.act('선생님과 상담 (30분)', '스트레스 −6 · 성적 +1', { stress: -6, grade: 1 }, 0.5));
        if (pl.key === 'lab2') o.push(this.act('게임 한 판 (30분)', '스트레스 −8 · 선생님 몰래', { stress: -8, energy: -2 }, 0.5));
        break;
      }
      case 'principal': o.push(this.act('교장 선생님께 인사', '스트레스 −3', { stress: -3 }, 0), this.onceToday('praise', '칭찬 받기', s.grade >= 70 ? '성적 70 이상 — 장학금 5,000원' : `성적 70 이상이어야 해요 (지금 ${Math.round(s.grade)})`, { coins: 5000, stress: -5 }, 0, { disabled: s.grade < 70 })); break;
      case 'counsel': o.push(this.act('진학 상담 (30분)', '성적 +2 · 스트레스 −3', { grade: 2, stress: -3 }, 0.5), { label: '내 상태 보기', sub: '', run: () => { this.app.dialog.show({ title: '내 상태', lines: [`배부름 ${Math.round(s.hunger)} · 에너지 ${Math.round(s.energy)} · 스트레스 ${Math.round(s.stress)}`, `성적 ${Math.round(s.grade)} · 체력 ${Math.round(s.fitness)} · 용돈 ${won(s.coins)}`, `출석 ${s.attendCount} · 결석 ${s.missed} · 심부름 ${s.total.quests}번 · 퀴즈 ${s.total.quizOk}/${s.total.quizAll}`, ...s.warnings()], options: [] }); return true; } }); break;
      case 'counsel2': o.push(this.onceToday('counsel', '마음 상담 (30분)', '스트레스 −18 · 하루 한 번', { stress: -18, energy: 3 }, 0.5), this.act('차 한 잔 (10분)', '스트레스 −3', { stress: -3 }, 0.17)); break;
      case 'nurse': case 'nurse2': o.push(this.act('침대에서 쉬기 (30분)', '에너지 +20 · 스트레스 −5', { energy: 20, stress: -5 }, 0.5, { ctx: { sleeping: true } }), this.act('체온 재기', '무료', null, 0, { msg: '36.5도 · 건강해요' })); break;
      case 'chapel': {
        const ev = s.current(t), ch = ev && ev.act === 'chapel';
        if (ch) o.push(this.act('예배 드리기 (끝까지)', `${hm(ev.t + ev.len)}까지 · 스트레스 −12`, { stress: -12, grade: 1 }, Math.max(0.5, ev.t + ev.len - t), { accent: true }));
        o.push(this.act('두란노 도서관에서 책 읽기 (1시간)', '성적 +2 · 스트레스 −5', { grade: 2, stress: -5, energy: -3 }, 1, { ctx: { studying: true } }), this.act('피아노 치기 (20분)', '스트레스 −6', { stress: -6 }, 0.33), this.act('기도하기 (10분)', '스트레스 −4', { stress: -4 }, 0.17));
        break;
      }
      case 'reading': case 'dormstudy': o.push(this.act('자습하기 (1시간)', '성적 +2.5 · 에너지 −5', { grade: 2.5, energy: -5, stress: 1 }, 1, { accent: true, ctx: { studying: true } }), this.act('집중 자습 (2시간)', '성적 +5 · 에너지 −11 · 스트레스 +4', { grade: 5, energy: -11, stress: 4 }, 2, { ctx: { studying: true } })); break;
      case 'club': o.push(this.act('동아리 활동 (1시간)', '스트레스 −10 · 체력 +1', { stress: -10, energy: -4, fitness: 1 }, 1), this.act('밴드 연습 (30분)', '스트레스 −6', { stress: -6, energy: -3 }, 0.5)); break;
      case 'studio': o.push(this.act('점심 방송 듣기', '스트레스 −2', { stress: -2 }, 0.17), this.onceToday('djreq', '신청곡 보내기', '스트레스 −5 · 하루 한 번', { stress: -5 }, 0)); break;
      case 'storage': o.push(this.onceToday('storage', '창고 뒤지기', '판자·돌 6개씩 · 하루 한 번', null, 0, { msg: '창고에서 블록 12개를 찾았어요', give: [[B.PLANKS, 6], [B.STONE, 6]] })); break;
      case 'main': o.push(this.act('감사 편지 쓰기 (10분)', '스트레스 −5', { stress: -5 }, 0.17), this.act('시계 보기', '', null, 0, { msg: `지금 ${hm(t)} · D+${s.day} ${s.weekdayName}요일` })); break;
      case 'dorm': { const ev = s.current(t); o.push(this.act(ev && ev.act === 'rollcall' ? '점호하기' : '점호 (시간 아님)', ev && ev.act === 'rollcall' ? '출석 · 스트레스 −2' : '06:50 · 22:00', { stress: -2 }, 0, { disabled: !(ev && ev.act === 'rollcall'), accent: !!(ev && ev.act === 'rollcall'), msg: '점호 끝' }), { label: '생활관 안내', sub: '', run: () => { this.app.dialog.show({ title: '생활관 안내', lines: ['06:50 기상 점호 · 22:00 점호 후 취침', '내 방은 101호(북쪽 남학생 구역 첫 방) · 2층 휴게실·독서실', '지하: 세탁실 · 체력단련실', '세탁은 500원, 체력단련실은 무료'], options: [] }); return true; } }); break; }
      case 'dormoffice': o.push(this.act('사감 선생님께 인사', '스트레스 −2', { stress: -2 }, 0), this.onceToday('permit', '외출증 받기', '바깥 도시 심부름에 필요 없어요 — 그냥 기념', null, 0, { msg: '외출증을 받았어요' })); break;
      case 'myroom': o.push(this.sleepOption(pl), this.act('낮잠 (1시간)', '에너지 +18', { energy: 18, stress: -2 }, 1, { ctx: { sleeping: true } }), this.act('책상에서 공부 (1시간)', '성적 +2 · 에너지 −5', { grade: 2, energy: -5 }, 1, { ctx: { studying: true } }), { label: '저장하기', sub: '', run: () => { this.app.saveNow(); this.app.hud.tip('저장했어요'); return false; } }); break;
      case 'lounge': o.push(this.act('소파에서 쉬기 (30분)', '스트레스 −8 · 에너지 +5', { stress: -8, energy: 5 }, 0.5), this.act('TV 보기 (1시간)', '스트레스 −10 · 성적 −0.5', { stress: -10, grade: -0.5 }, 1), this.buy('자판기 음료', 800, { energy: 6, stress: -2 })); break;
      case 'laundry': o.push(this.onceToday('laundry', '세탁하기 (40분)', '500원 · 스트레스 −8 · 하루 한 번', { stress: -8 }, 0.67, { cost: 500 })); break;
      case 'fitness': case 'outgym': case 'parkgym': o.push(this.act('운동하기 (1시간)', '체력 +6 · 스트레스 −6 · 에너지 −12', { fitness: 6, stress: -6, energy: -12, hunger: -6 }, 1, { accent: true, ctx: { running: true } }), this.act('가볍게 스트레칭 (20분)', '체력 +2 · 스트레스 −3', { fitness: 2, stress: -3, energy: -3 }, 0.33)); break;
      case 'field': o.push(this.act('축구하기 (1시간)', '체력 +5 · 스트레스 −9 · 에너지 −14', { fitness: 5, stress: -9, energy: -14, hunger: -8 }, 1, { accent: true, ctx: { running: true } }), this.act('운동장 달리기 (30분)', '체력 +3 · 에너지 −7', { fitness: 3, energy: -7, hunger: -4, stress: -3 }, 0.5, { ctx: { running: true } })); break;
      case 'basketball': o.push(this.act('농구하기 (1시간)', '체력 +5 · 스트레스 −10 · 에너지 −12', { fitness: 5, stress: -10, energy: -12, hunger: -7 }, 1, { accent: true, ctx: { running: true } }), this.act('자유투 연습 (20분)', '스트레스 −4', { stress: -4, fitness: 1, energy: -3 }, 0.33)); break;
      case 'podium': o.push(this.act('조회대에 서 보기', '스트레스 +1 · 성적 +1', { stress: 1, grade: 1 }, 0, { msg: '교장 선생님 흉내를 내 봤어요' })); break;
      case 'garden': o.push(this.onceToday('garden', '텃밭 가꾸기 (1시간)', '수확 판매 1,500원 · 스트레스 −6 · 하루 한 번', { coins: 1500, stress: -6, energy: -8, fitness: 1 }, 1, { accent: true }), this.act('텃밭 구경 (10분)', '스트레스 −2', { stress: -2 }, 0.17)); break;
      case 'pavilion': case 'park': o.push(this.act('정자에서 쉬기 (30분)', '스트레스 −10 · 에너지 +5', { stress: -10, energy: 5 }, 0.5), this.act('친구와 수다 (30분)', '스트레스 −6', { stress: -6 }, 0.5)); break;
      case 'hill': o.push(this.act('경치 보기', '스트레스 −12', { stress: -12 }, 0.25), this.act('심호흡 (5분)', '에너지 +3', { energy: 3 }, 0.08)); break;
      case 'karaoke': o.push(this.buy('노래 부르기 (1시간)', 2000, { stress: -22, energy: -5 }, 1, { sub: '스트레스 −22' })); break;
      case 'bus': o.push(...this.busOptions(pl)); break;
      case 'bunsik': o.push(this.buy('떡볶이', 3000, { hunger: 35, stress: -4 }, 0.3), this.buy('김밥', 2500, { hunger: 30 }, 0.2), this.buy('라면', 3000, { hunger: 35, energy: 3 }, 0.3, { eat: true })); o.push(this.eatOpt()); break;
      case 'conv': o.push(this.buy('삼각김밥', 1200, { hunger: 18 }), this.buy('컵라면', 1500, { hunger: 25 }, 0.2), this.buy('에너지 음료', 2000, { energy: 15, stress: 2 }), this.buy('우유', 1000, { hunger: 8, energy: 3 })); o.push(this.eatOpt()); break;
      case 'stationery': o.push({ label: '블록 묶음 (돌·판자·벽돌·유리 10개씩)', sub: '2,000원 · 짓기 재료', disabled: !s.canPay(2000), run: () => { s.apply({ coins: -2000 }); for (const id of [B.STONE, B.PLANKS, B.BRICK, B.WINDOW]) this.app.builder.add(id, 10); this.app.hud.tip('블록 40개를 샀어요 — X 로 짓기'); this.app.hud.refreshStats(); return false; } }, this.buy('학용품 세트', 2000, { grade: 1 }), this.buy('편지지', 1000, { stress: -1 })); break;
      case 'academy': o.push(this.buy('보충 수업 (2시간)', 10000, { grade: 7, energy: -10, stress: 5 }, 2, { sub: '성적 +7', ctx: { studying: true } }), this.buy('1:1 질문 (30분)', 4000, { grade: 3, stress: 1 }, 0.5)); break;
      case 'pc': o.push(this.buy('게임 1시간', 1000, { stress: -15, energy: -3, grade: -0.5 }, 1, { sub: '스트레스 −15' }), this.buy('게임 3시간', 3000, { stress: -30, energy: -8, grade: -2 }, 3, { sub: '스트레스 −30 · 성적 −2' })); break;
      case 'cafe': o.push(this.buy('커피', 2500, { energy: 12, stress: -5 }), this.buy('조각 케이크', 4000, { hunger: 15, stress: -8 }), this.act('창가에서 쉬기 (30분)', '스트레스 −4', { stress: -4 }, 0.5)); o.push(this.eatOpt()); break;
      case 'chicken': o.push(this.buy('치킨 한 마리', 18000, { hunger: 60, stress: -15 }, 0.7, { item: 'chicken' }), this.buy('치킨 반 마리', 10000, { hunger: 35, stress: -8 }, 0.5)); break;
      case 'bakery': o.push(this.buy('소금빵', 2000, { hunger: 20 }), this.buy('식빵 한 봉지', 3500, { hunger: 40 }, 0, { item: 'bread', n: 4, sub: '빵 4개' })); o.push(this.eatOpt()); break;
      case 'pharmacy': o.push(this.buy('피로회복제', 3000, { energy: 20 }), this.buy('밴드', 2000, { fitness: 1 })); break;
      case 'minimart': case 'mart': o.push(this.buy('과자', 1500, { hunger: 15, stress: -2 }), this.buy('도시락', 4500, { hunger: 45 }, 0.3), this.buy('생수', 800, { hunger: 2, stress: -1 })); o.push(this.eatOpt()); break;
      case 'fuel': { const c = this.app.car; o.push({ label: '주유하기', sub: `5,000원 · 연료 ${Math.round(c.fuel)}% → 100%`, disabled: !s.canPay(5000) || c.fuel > 95, accent: c.fuel < 30, run: () => { s.apply({ coins: -5000 }); c.fuel = 100; this.app.hud.tip('기름을 가득 넣었어요'); this.app.hud.refreshStats(); return false; } }); break; }
      case 'aptplay': o.push(this.act('그네 타기 (20분)', '스트레스 −6', { stress: -6 }, 0.33)); break;
      default: if (pl.key.startsWith('apt')) o.push(this.act('친구네 집 놀러 가기 (1시간)', '스트레스 −8', { stress: -8 }, 1)); break;
    }
    return o;
  }
  busOptions(pl) {
    const stops = this.app.props.busStops || [];
    return stops.filter((st) => st.name !== pl.stop && Math.hypot(st.x - pl.x, st.z - pl.z) > 5).map((st) => ({ label: `${st.name}행 버스 타기`, sub: '500원 · 10분', disabled: !this.stats.canPay(500), run: () => {
      this.stats.apply({ coins: -500 }); this.app.advance(0.17, {}); const p = this.app.player; p.position.set(st.x + 1.5, WORLD.GROUND, st.z + 1.5); p.fixSpawn(); this.app.chunks.update(p.position.x, p.position.z);
      this.app.hud.tip(`${st.name} 정류장에 내렸어요`); this.app.hud.refreshStats(); return false;
    } }));
  }
  open() {
    if (this.nearT) { this.app.teachers.talk(this.nearT); return true; }
    const pl = this.near; if (!pl) return false;
    const opts = this.options(pl); if (!opts.length) return false;
    const ev = this.stats.current(this.app.sky.time);
    const sub = ev ? `지금 일과: ${ev.name} (${hm(ev.t)}~${hm(ev.t + ev.len)})${this.stats.isAttended(ev) ? ' ✓' : ''}` : `다음 일과: ${(this.stats.next(this.app.sky.time) || {}).name || '없음'}`;
    this.app.dialog.show({ title: pl.name, sub, options: opts });
    return true;
  }
}
