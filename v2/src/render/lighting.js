// 조명 — 태양(캐스케이드 그림자) · 달 · 밤 가로등/간판 조명(클러스터드 라이팅).
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { SpotLight } from '@babylonjs/core/Lights/spotLight.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator.js';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
import { ClusteredLightContainer } from '@babylonjs/core/Lights/Clustered/clusteredLightContainer.js';
import { smooth, mix } from '../world/noise.js';

export class Lighting {
  constructor(scene, preset, sky) {
    this.scene = scene; this.preset = preset; this.sky = sky;
    const sun = new DirectionalLight('sun', new Vector3(-0.3, -1, -0.4), scene);
    sun.intensity = 3; sun.diffuse = new Color3(1, 0.97, 0.9); sun.specular = new Color3(1, 0.97, 0.9);
    sun.shadowMinZ = 1; sun.shadowMaxZ = 300; sun.autoCalcShadowZBounds = false;
    this.sun = sun;
    this.shadow = null;
    if (preset.shadows) this._makeShadows(preset);
    // 밤 조명 묶음
    this.cluster = null; this.nightLights = []; this.lightsOn = false;
    if (preset.lights) {
      try {
        const c = new ClusteredLightContainer('nightLights', [], scene);
        if (c.isSupported) { c.intensity = 1; this.cluster = c; } else c.dispose();
      } catch (e) { console.warn('클러스터드 라이팅 사용 불가:', e); }
    }
    this._tmp = new Vector3();
  }
  _makeShadows(preset) {
    if (preset.simpleShadow) { const sg = new ShadowGenerator(preset.shadowSize, this.sun); sg.usePercentageCloserFiltering = true; sg.bias = 0.002; this.sun.position.set(100, 80, 100); this.sun.autoCalcShadowZBounds = true; this.shadow = sg; return; }
    const sg = new CascadedShadowGenerator(preset.shadowSize, this.sun);
    sg.numCascades = preset.cascades; sg.lambda = 0.78; sg.cascadeBlendPercentage = 0.06; sg.stabilizeCascades = true; sg.depthClamp = true;
    sg.autoCalcDepthBounds = false; sg.shadowMaxZ = preset.cascades >= 3 ? 220 : 140;
    sg.filter = ShadowGenerator.FILTER_PCF; sg.filteringQuality = preset.cascades >= 3 ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
    sg.bias = 0.0025; sg.normalBias = 0.03; sg.transparencyShadow = true; sg.enableSoftTransparentShadow = false;
    sg.penumbraDarkness = 0.9;
    this.shadow = sg;
  }
  addCaster(mesh) { if (this.shadow) this.shadow.addShadowCaster(mesh, false); }
  removeCaster(mesh) { if (this.shadow) this.shadow.removeShadowCaster(mesh); }

  // 가로등: 점광원. 차 헤드라이트: 스포트라이트
  addPointLight(x, y, z, color = new Color3(1, 0.85, 0.6), range = 16, intensity = 24) {
    if (!this.cluster) return null;
    const l = new PointLight(`pl${this.nightLights.length}`, new Vector3(x, y, z), this.scene);
    l.diffuse = color; l.specular = color; l.range = range; l.intensity = intensity; l.shadowEnabled = false;
    l.metadata = { base: intensity };
    this.cluster.addLight(l); this.nightLights.push(l); return l;
  }
  addSpotLight(pos, dir, angle = 1.0, range = 26, color = new Color3(1, 0.97, 0.9), intensity = 60) {
    if (!this.cluster) return null;
    const l = new SpotLight(`sl${this.nightLights.length}`, pos.clone(), dir.clone(), angle, 8, this.scene);
    l.diffuse = color; l.specular = color; l.range = range; l.intensity = intensity; l.shadowEnabled = false;
    l.metadata = { base: intensity, dynamic: true };
    this.cluster.addLight(l); return l;
  }

  update() {
    const sky = this.sky;
    const sinEl = sky.sunDir.y;
    // 해가 지면 달빛으로 바뀜(같은 라이트를 재사용 → 그림자는 한 세트)
    const moonK = smooth(0.0, -0.12, sinEl);
    const dir = this._tmp.copyFrom(moonK > 0.5 ? sky.moonDir : sky.sunDir).scaleInPlace(-1);
    if (moonK > 0.5) { this.sun.direction.copyFrom(dir); this.sun.intensity = 0.28 * smooth(0.45, 1, moonK); this.sun.diffuse.set(0.55, 0.65, 0.95); }
    else { this.sun.direction.copyFrom(dir); this.sun.intensity = sky.sunIntensity * (1 - moonK * 2); this.sun.diffuse.copyFrom(sky.sunColor); }
    this.sun.specular.copyFrom(this.sun.diffuse);
    // 밤 조명 켜기/끄기 (해가 지평선 근처면 켜짐)
    const on = sinEl < 0.08;
    const k = 1 - smooth(-0.02, 0.1, sinEl);
    if (k !== this._lastK) { this._lastK = k; for (const l of this.nightLights) l.intensity = l.metadata.base * k; }
    this.nightK = k;
    this.lightsOn = on;
    return on;
  }
}
export { mix };
