// 간판 — 글자를 캔버스에 그려 판에 붙인다. 밤에는 스스로 빛난다.
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';

export class Signs {
  constructor(scene, list, lighting) {
    this.scene = scene; this.mats = []; this.clocks = []; this._lastMin = -1;
    for (const s of list) {
      if (s.clock) { this._makeClock(s); continue; }
      const w = s.w, h = s.h ?? 0.9;
      const pw = 512, ph = Math.max(64, Math.round(pw * h / w));
      const tex = new DynamicTexture('sign_' + s.text, { width: pw, height: ph }, scene, true);
      const c = tex.getContext();
      c.fillStyle = s.bg; c.fillRect(0, 0, pw, ph);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 6; c.strokeRect(6, 6, pw - 12, ph - 12);
      const font = (p, bold = true) => `${bold ? 700 : 500} ${p}px "${bold ? 'Black Han Sans' : 'IBM Plex Sans KR'}", "IBM Plex Sans KR", "Noto Sans KR", "Noto Sans CJK KR", sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (s.text2) { // 두 줄: 큰 제목 + 작은 부제
        let px = Math.floor(ph * 0.42); c.font = font(px); while (c.measureText(s.text).width > pw * 0.9 && px > 10) { px -= 2; c.font = font(px); }
        c.fillStyle = s.color; c.fillText(s.text, pw / 2, ph * 0.36);
        let p2 = Math.floor(ph * 0.22); c.font = font(p2, false); while (c.measureText(s.text2).width > pw * 0.92 && p2 > 8) { p2 -= 1; c.font = font(p2, false); }
        c.fillStyle = s.color2 || s.color; c.fillText(s.text2, pw / 2, ph * 0.74);
      } else {
        let px = Math.floor(ph * 0.62); c.font = font(px); while (c.measureText(s.text).width > pw * 0.88 && px > 10) { px -= 2; c.font = font(px); }
        c.fillStyle = s.color; c.fillText(s.text, pw / 2, ph / 2 + px * 0.05);
      }
      tex.update(true);
      const m = new StandardMaterial('signMat', scene);
      m.diffuseTexture = tex; m.emissiveTexture = tex; m.emissiveColor = new Color3(0.25, 0.25, 0.25); m.specularColor = new Color3(0.1, 0.1, 0.1); m.backFaceCulling = true;
      const plane = MeshBuilder.CreatePlane('sign', { width: w, height: h }, scene);
      plane.material = m; plane.position.set(s.x, s.y, s.z); plane.isPickable = false;
      plane.rotation.y = s.facing === 'north' ? Math.PI : s.facing === 'east' ? -Math.PI / 2 : s.facing === 'west' ? Math.PI / 2 : 0;
      plane.freezeWorldMatrix();
      this.mats.push(m);
    }
  }
  _makeClock(s) {
    const n = 256, tex = new DynamicTexture('clock', { width: n, height: n }, this.scene, true);
    const m = new StandardMaterial('clockMat', this.scene);
    m.diffuseTexture = tex; m.emissiveTexture = tex; m.emissiveColor = new Color3(0.3, 0.3, 0.3); m.specularColor = new Color3(0.1, 0.1, 0.1);
    const plane = MeshBuilder.CreatePlane('clock', { width: s.w, height: s.h }, this.scene);
    plane.material = m; plane.position.set(s.x, s.y, s.z); plane.isPickable = false; plane.rotation.y = s.facing === 'north' ? Math.PI : 0; plane.freezeWorldMatrix();
    this.clocks.push({ tex, n }); this.mats.push(m);
  }
  _drawClock(c, time) {
    const { tex, n } = c, ctx = tex.getContext(), r = n / 2 - 6;
    ctx.clearRect(0, 0, n, n); ctx.fillStyle = '#163d2b'; ctx.fillRect(0, 0, n, n);
    ctx.beginPath(); ctx.arc(n / 2, n / 2, r, 0, Math.PI * 2); ctx.fillStyle = '#f7f5ef'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#1a1a1a'; ctx.stroke();
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const big = i % 3 === 0; ctx.beginPath(); ctx.arc(n / 2 + Math.sin(a) * (r - 14), n / 2 - Math.cos(a) * (r - 14), big ? 6 : 3, 0, Math.PI * 2); ctx.fill(); }
    const h = (time % 12) / 12 * Math.PI * 2, mi = (time % 1) * Math.PI * 2;
    const hand = (a, len, w, col) => { ctx.beginPath(); ctx.moveTo(n / 2, n / 2); ctx.lineTo(n / 2 + Math.sin(a) * len, n / 2 - Math.cos(a) * len); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.stroke(); };
    hand(h, r * 0.52, 10, '#1a1a1a'); hand(mi, r * 0.78, 6, '#1a1a1a');
    ctx.beginPath(); ctx.arc(n / 2, n / 2, 7, 0, Math.PI * 2); ctx.fillStyle = '#b3261e'; ctx.fill();
    tex.update(true);
  }
  update(night, time = 9.5) {
    const e = 0.25 + night * 0.95; for (const m of this.mats) m.emissiveColor.set(e, e, e);
    const min = Math.floor(time * 60); if (min !== this._lastMin) { this._lastMin = min; for (const c of this.clocks) this._drawClock(c, time); }
  }
}
