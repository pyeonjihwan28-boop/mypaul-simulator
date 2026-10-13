// 화질 단계와 자동 감지, 동적 해상도.
export const PRESETS = {
  low: { label: '낮음', shadows: false, shadowSize: 0, cascades: 0, ssao: false, bloom: true, fxaa: true, godRays: false, ssr: false, lights: false, viewDist: 6, tile: 64, bumps: true, maxLights: 4, probe: 64, msaa: 1, npc: 8, cars: 4, minScale: 1.0, maxScale: 2.2 },
  mid: { label: '중간', shadows: true, shadowSize: 1024, cascades: 2, ssao: false, bloom: true, fxaa: true, godRays: false, ssr: false, lights: true, viewDist: 8, tile: 64, bumps: true, maxLights: 6, probe: 64, msaa: 1, npc: 12, cars: 6, minScale: 1.0, maxScale: 1.8 },
  high: { label: '높음', shadows: true, shadowSize: 2048, cascades: 3, ssao: false, bloom: true, fxaa: true, godRays: false, ssr: false, lights: true, viewDist: 12, tile: 128, bumps: true, maxLights: 8, probe: 128, msaa: 2, npc: 18, cars: 8, minScale: 1.0, maxScale: 1.5 },
  ultra: { label: '최고', shadows: true, shadowSize: 4096, cascades: 4, ssao: true, bloom: true, fxaa: true, godRays: false, ssr: true, lights: true, viewDist: 16, tile: 128, bumps: true, maxLights: 8, probe: 128, msaa: 4, npc: 24, cars: 10, minScale: 1.0, maxScale: 1.3 },
};

export function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && Math.min(window.innerWidth, window.innerHeight) < 900);
}

export function detectTier(engine) {
  let renderer = '';
  try {
    const gl = engine._gl; const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch { /* 무시 */ }
  const mem = navigator.deviceMemory || 4;
  const mobile = isMobile();
  if (/SwiftShader|llvmpipe|Software|Mesa OffScreen/i.test(renderer)) return { tier: 'low', renderer, mobile };
  if (mobile) {
    const strong = /Apple GPU|Apple A1[5-9]|Apple M|Adreno \(TM\) 7|Adreno \(TM\) 8|Mali-G7[0-9]|Mali-G9|Immortalis|Xclipse/i.test(renderer);
    return { tier: strong && mem >= 4 ? 'mid' : 'low', renderer, mobile };
  }
  if (/Intel/i.test(renderer) && !/Arc/i.test(renderer)) return { tier: 'mid', renderer, mobile };
  if (/Apple M[1-4]|RTX|Radeon RX|GTX 1[6-9]|Arc/i.test(renderer)) return { tier: 'high', renderer, mobile };
  return { tier: 'high', renderer, mobile };
}

// 프레임 시간을 보고 해상도를 자동으로 조절한다
export class DynamicResolution {
  constructor(engine, preset) { this.engine = engine; this.preset = preset; this.enabled = true; this.ema = 16; this.acc = 0; this.scale = 1; this.base = Math.max(1, 1 / Math.min(2, window.devicePixelRatio || 1)); }
  setPreset(p) { this.preset = p; this.scale = 1; this.apply(); }
  apply() { this.engine.setHardwareScalingLevel(this.base * this.scale); }
  update(dtMs) {
    if (!this.enabled) return;
    this.ema = this.ema * 0.92 + dtMs * 0.08;
    this.acc += dtMs;
    if (this.acc < 700) return;
    this.acc = 0;
    const target = 1000 / 58;
    if (this.ema > target * 1.35 && this.scale < this.preset.maxScale) { this.scale = Math.min(this.preset.maxScale, this.scale + 0.15); this.apply(); }
    else if (this.ema < target * 0.85 && this.scale > this.preset.minScale) { this.scale = Math.max(this.preset.minScale, this.scale - 0.1); this.apply(); }
  }
}
