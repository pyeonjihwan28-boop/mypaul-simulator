// 첫 화면 — 전 판 구성 그대로: 제목 · 기기 추천 그래픽 · 플레이 방식 · 서버/설정/조작법 · 전체 채팅 · 혼자/같이/이어 하기 · 이름 정하기.
import { PRESETS } from '../render/quality.js';
import { VERSION, NOTES } from '../version.js';
import { WEEKDAYS } from '../game/stats.js';

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const MODE_HINT = { battle: '대화를 끝까지 하거나 공격하면 보스전 · 교문 밖은 폴탈', chill: '보스전 없이 느긋하게 — 학교생활 · 짓기 · 심부름 · 친구' };

export class Title {
  constructor(app) {
    this.app = app; this.el = $('start'); this.installEvt = null;
    const save = app.save;
    // 그래픽 추천
    $('sGfxTier').textContent = PRESETS[app.detected.tier].label;
    $('sGfxNote').textContent = `${(app.detected.renderer || '그래픽 정보 없음').replace(/ANGLE \((.*?)\)$/, '$1').slice(0, 56)} · CPU ${navigator.hardwareConcurrency || '?'}코어 · 메모리 ${navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '?'} — ${app.tierName === app.detected.tier ? '부드럽게 돌아가도록 골랐어요' : `지금은 ${PRESETS[app.tierName].label}으로 보고 있어요`}`;
    $('sGfxRec').onclick = () => app.changeQuality(app.detected.tier, app.tierName !== app.detected.tier);
    $('sGfxHi').onclick = () => { const order = ['low', 'mid', 'high', 'ultra']; const next = order[Math.min(3, order.indexOf(app.tierName) + 1)]; app.changeQuality(next, next !== app.tierName); };
    // 플레이 방식
    this.mode = save.mode || 'battle';
    for (const b of this.el.querySelectorAll('.mode button')) b.onclick = () => { this.mode = b.dataset.mode; save.mode = this.mode; app._store(); this._modeUI(); };
    this._modeUI();
    // 버튼들
    $('sSolo').onclick = () => { if (save.pos) this._confirmFresh(); else app.startGame({ multi: false }); };
    $('sContinue').onclick = () => app.startGame({ multi: false });
    $('sMulti').onclick = () => app.startGame({ multi: true });
    $('sServers').onclick = () => app.net ? app.net.showServers() : app.dialog.show({ title: '서버 고르기', lines: ['같이 하기 서버는 접속되면 여기에 보여요.'], options: [] });
    $('sSettings').onclick = () => app.hud.toggleSettings(true);
    $('sHelp').onclick = () => this.help();
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.installEvt = e; $('sInstall').hidden = false; });
    $('sInstall').onclick = async () => { if (!this.installEvt) return; this.installEvt.prompt(); try { await this.installEvt.userChoice; } catch { /* 취소 */ } this.installEvt = null; $('sInstall').hidden = true; };
    $('sVer').textContent = `${VERSION} ${app.edition === 'beta' ? '베타' : '정식'} · 빌드 ${app.build} · Babylon.js 새 엔진`; $('sVer').style.cursor = 'pointer'; $('sVer').onclick = () => app.dialog.show({ title: `${VERSION} 새 소식`, lines: NOTES, options: [] });
    // 채팅 (접속되면 net 이 채움)
    $('sChatSend').onclick = () => this.sendChat();
    $('sChatIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.sendChat(); } e.stopPropagation(); });
    $('sName').onclick = () => this.askName(true);
    // 이름
    const nin = $('sNameIn'), nok = $('sNameOk');
    nin.addEventListener('input', () => { nok.disabled = !nin.value.trim(); });
    nin.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && nin.value.trim()) nok.click(); });
    nok.onclick = () => { const v = nin.value.trim().slice(0, 12); if (!v) return; save.name = v; app._store(); $('sNameDlg').hidden = true; this.el.classList.remove('dim'); $('sName').textContent = v; app.net?.rename?.(v); };
  }
  _modeUI() { for (const b of this.el.querySelectorAll('.mode button')) b.classList.toggle('on', b.dataset.mode === this.mode); $('sModeHint').textContent = MODE_HINT[this.mode]; }
  show() {
    const app = this.app, save = app.save, s = save.stats;
    this.el.hidden = false;
    $('sName').textContent = save.name || '이름';
    if (save.pos && s) {
      const t = save.time ?? 9.5, when = save.savedAt ? new Date(save.savedAt) : null;
      $('sContinue').hidden = false; $('sContinueSub').textContent = `D+${s.day} ${WEEKDAYS[(s.day - 1) % 7]}요일 ${pad(Math.floor(t))}:${pad(Math.floor((t % 1) * 60))} · 용돈 ${Math.round(s.coins).toLocaleString()}원${when ? ` · ${when.getMonth() + 1}/${when.getDate()} ${pad(when.getHours())}:${pad(when.getMinutes())} 저장` : ''}`;
      $('sContinue').classList.add('acc'); $('sSolo').classList.remove('acc'); $('sSolo').querySelector('b').textContent = '새로 시작'; $('sSolo').querySelector('small').textContent = '처음부터 · 저장은 지워져요';
      $('sContinue').parentNode.insertBefore($('sContinue'), $('sSolo'));
    } else { $('sContinue').hidden = true; $('sSolo').classList.add('acc'); }
    if (!save.name) this.askName(false);
    this.setOnline(null);
  }
  hide() { this.el.hidden = true; }
  askName(cancelable) { const d = $('sNameDlg'); d.hidden = false; this.el.classList.add('dim'); const nin = $('sNameIn'); nin.value = this.app.save.name || ''; $('sNameOk').disabled = !nin.value.trim(); setTimeout(() => nin.focus(), 50); if (cancelable) { const onKey = (e) => { if (e.key === 'Escape') { d.hidden = true; this.el.classList.remove('dim'); window.removeEventListener('keydown', onKey); } }; window.addEventListener('keydown', onKey); } }
  _confirmFresh() {
    this.app.dialog.show({ title: '새로 시작할까요?', lines: ['지금 저장(날짜 · 용돈 · 성적 · 심부름 · 지은 것)이 지워지고 처음부터 시작해요.', '이름 · 화질 · 플레이 방식은 그대로예요.'], options: [{ label: '네, 새로 시작', accent: true, run: () => { this.app.resetSave(); return false; } }, { label: '아니요, 이어 하기', run: () => { this.app.startGame({ multi: false }); return false; } }] });
  }
  help() {
    const m = this.app.mobile;
    this.app.dialog.show({ title: '조작법', lines: m
      ? ['왼쪽 조이스틱: 걷기 · 오른쪽 화면 밀기: 둘러보기', 'E: 장소에서 할 일(먹기 · 수업 · 운동 · 심부름 · 자기) · 차 타기/내리기', '짓기: 캐기 버튼 꾹 · 놓기 버튼 · 핫바에서 고르기 · 가방 버튼(옮기기 · 먹기 · 제작)', '점프 · 달리기 버튼 · 일과 시간에 그 장소에 가면 자동 출석']
      : ['W A S D 걷기 · Shift 달리기 · Space 점프 · 마우스 둘러보기 · 휠 줌(가까이 당기면 1인칭)', 'E 장소에서 할 일(먹기 · 수업 · 운동 · 심부름 · 자기) · 차 타기/내리기', 'X 짓기 모드 · 좌클릭 꾹 캐기 · 우클릭 놓기(음식이면 먹기) · 1~9 · 휠 · Q 칸 고르기 · V 반블록 모양 · I 가방(옮기기 · 제작)', 'T 시간 빨리 · Esc 마우스 풀기 · Enter 채팅(같이 하기)', '일과 시간에 그 장소에 2초 있으면 자동 출석 · 22시 넘어 내 방(101호)에서 자면 다음 날'], options: [] });
  }
  // 채팅
  setOnline(n) { $('sOnline').textContent = n == null ? '● 접속 확인 중' : `● 지금 ${n}명 접속 중`; $('sChatN').textContent = n == null ? '연결 중…' : `지금 접속 ${n}명`; }
  addChat(name, text, mine = false) {
    const l = $('sChatList'); const first = l.querySelector('.muted'); if (first) first.remove();
    const d = document.createElement('div'); d.innerHTML = `<b>${esc(name)}</b>${esc(text)}`; if (mine) d.style.color = '#ffe08a'; l.appendChild(d); l.scrollTop = l.scrollHeight;
    while (l.children.length > 80) l.firstChild.remove();
  }
  sendChat() {
    const inp = $('sChatIn'), text = inp.value.trim(); if (!text) return; inp.value = '';
    if (!this.app.save.name) { this.askName(true); return; }
    if (this.app.net) this.app.net.chat(text); else this.addChat(this.app.save.name, text + ' (아직 연결 전)', true);
  }
}
