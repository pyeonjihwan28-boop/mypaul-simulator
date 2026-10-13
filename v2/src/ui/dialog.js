// 대화창 — 장소 상호작용 선택지 · 퀴즈 · 안내. 휴대폰은 버튼, 키보드는 숫자키/Esc.
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class Dialog {
  constructor(app) {
    this.app = app; this.open = false; this.opts = []; this.onClose = null;
    this.el = $('dlg');
    $('dlgClose').onclick = () => this.close();
    window.addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Escape') { e.preventDefault(); this.close(); return; }
      const m = /^Digit([1-9])$/.exec(e.code); if (m) { const o = this.opts[+m[1] - 1]; if (o && !o.disabled) { e.preventDefault(); e.stopPropagation(); this._pick(o); } }
    }, true);
  }
  // { title, sub?, lines?: string[], options: [{ label, sub?, disabled?, run }], closeLabel? }
  show(spec) {
    this.spec = spec; this.open = true; this.el.hidden = false;
    this.app.input.uiOpen = true; this.app.input.releaseLock(); this.app.input.keys.clear();
    $('dlgTitle').textContent = spec.title || '';
    $('dlgSub').textContent = spec.sub || ''; $('dlgSub').hidden = !spec.sub;
    $('dlgBody').innerHTML = (spec.lines || []).map((l) => `<p>${esc(l)}</p>`).join('');
    this.opts = spec.options || [];
    const box = $('dlgOpts');
    box.innerHTML = this.opts.map((o, i) => `<button class="opt${o.disabled ? ' off' : ''}${o.accent ? ' acc' : ''}" data-i="${i}" ${o.disabled ? 'disabled' : ''}><i>${i + 1}</i><span>${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span></button>`).join('');
    for (const b of box.querySelectorAll('button.opt')) b.onclick = () => { const o = this.opts[+b.dataset.i]; if (o && !o.disabled) this._pick(o); };
    $('dlgClose').textContent = spec.closeLabel || '닫기';
  }
  _pick(o) { const keep = o.run && o.run(); if (!keep) this.close(); }
  close() { if (!this.open) return; this.open = false; this.el.hidden = true; this.app.input.uiOpen = false; const cb = this.onClose; this.onClose = null; cb && cb(); }
  // 퀴즈: questions [{q, a[], c, s}] → onDone(correct, total)
  quiz(title, questions, onDone) {
    let i = 0, ok = 0;
    const ask = () => {
      const q = questions[i];
      this.show({
        title, sub: `${q.s} · ${i + 1}/${questions.length} 문제`, lines: [q.q],
        options: q.a.map((t, k) => ({ label: t, run: () => { const right = k === q.c; if (right) ok++; this.app.hud.tip(right ? '정답! 👍' : `아쉬워요 — 정답은 "${q.a[q.c]}"`, 3); i++; if (i < questions.length) { ask(); return true; } onDone(ok, questions.length); return false; } })),
        closeLabel: '그만하기',
      });
      this.onClose = () => { if (i < questions.length) onDone(ok, questions.length); };
    };
    ask();
  }
}
