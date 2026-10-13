// 하늘 · 태양 · 밤 별 · 환경광(IBL) — 시간(0~24h)에 따라 바뀐다.
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe.js';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture.js';
import '@babylonjs/core/Materials/Textures/baseTexture.polynomial.js';
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial.js';
import { smooth, mix } from '../world/noise.js';

export class Sky {
  constructor(scene, preset) {
    this.scene = scene;
    this.time = 9.5; // 시
    this.sunDir = new Vector3(0, 1, 0);
    this.moonDir = new Vector3(0, -1, 0);
    this.night = 0; // 0 낮 … 1 밤
    this.sunColor = new Color3(1, 1, 1); this.sunIntensity = 0;
    this.horizon = new Color3(0.6, 0.7, 0.85);

    // 하늘 돔
    const sky = MeshBuilder.CreateSphere('sky', { diameter: 1600, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene); // 상자는 모서리에 쐐기 줄무늬가 생겨 구로
    const mat = new SkyMaterial('skyMat', scene);
    mat.backFaceCulling = false; mat.useSunPosition = true; mat.rawHdrOutput = true;
    mat.turbidity = 3.2; mat.rayleigh = 1.6; mat.mieCoefficient = 0.004; mat.mieDirectionalG = 0.85; mat.luminance = 1.0; mat.dithering = true;
    sky.material = mat; sky.infiniteDistance = true; sky.applyFog = false; sky.isPickable = false; sky.renderingGroupId = 0;
    this.skybox = sky; this.skyMat = mat;
    // 프로브 전용 하늘(게인을 낮춰 IBL 이 물리적으로 말이 되게) — 메인 카메라엔 안 보임
    const psky = MeshBuilder.CreateSphere('skyProbe', { diameter: 1600, segments: 16, sideOrientation: Mesh.BACKSIDE }, scene);
    const pmat = new SkyMaterial('skyMatProbe', scene);
    pmat.backFaceCulling = false; pmat.useSunPosition = true; pmat.rawHdrOutput = true; pmat.dithering = false;
    psky.material = pmat; psky.infiniteDistance = true; psky.applyFog = false; psky.isPickable = false; psky.layerMask = 0x20000000;
    this.probeSky = psky; this.probeMat = pmat;

    // 밤하늘 별 (안쪽 돔, 알파로 섞음)
    const stars = MeshBuilder.CreateSphere('stars', { diameter: 1500, segments: 12, sideOrientation: Mesh.BACKSIDE }, scene);
    const smat = new StandardMaterial('starsMat', scene);
    smat.disableLighting = true; smat.backFaceCulling = false;
    smat.emissiveTexture = this._makeStarTexture(scene); smat.opacityTexture = smat.emissiveTexture; smat.opacityTexture.getAlphaFromRGB = true;
    smat.emissiveColor = Color3.Black(); smat.diffuseColor = Color3.Black(); smat.specularColor = Color3.Black(); smat.ambientColor = Color3.Black();
    smat.alpha = 0; smat.alphaMode = 1 /* ALPHA_ADD */;
    stars.material = smat; stars.infiniteDistance = true; stars.applyFog = false; stars.isPickable = false;
    stars.rotation.z = 0.6; this.stars = stars; this.starsMat = smat;

    // 태양 구 (빛 번짐·갓레이용)
    const sun = MeshBuilder.CreateSphere('sunDisc', { diameter: 28, segments: 8 }, scene);
    const sunMat = new StandardMaterial('sunMat', scene);
    sunMat.disableLighting = true; sunMat.emissiveColor = new Color3(1, 0.95, 0.8); sunMat.diffuseColor = Color3.Black();
    sun.material = sunMat; sun.isPickable = false; sun.applyFog = false; sun.infiniteDistance = false;
    this.sunMesh = sun; this.sunMat = sunMat;

    // 환경광 프로브: 하늘만 찍어서 IBL 로 쓴다
    const probe = new ReflectionProbe('envProbe', preset.probe, scene, true, false, true); // 8비트: 태양 원반이 1로 잘려 IBL 이 폭주하지 않음
    probe.renderList.push(psky, stars);
    probe.cubeTexture.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    scene.environmentTexture = probe.cubeTexture;
    scene.environmentIntensity = 1.0;
    this.probe = probe; this._probeTimer = 0; this._lastProbeTime = -99;
    this._tmp = new Vector3(); this._tmp2 = new Vector3();
    this.update(this.time, 0, true);
  }

  _makeStarTexture(scene) {
    const n = 2048, t = new DynamicTexture('starTex', { width: n, height: n / 2 }, scene, true);
    const c = t.getContext(); c.fillStyle = '#000'; c.fillRect(0, 0, n, n / 2);
    let s = 12345; const r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < 3200; i++) { const x = r() * n, y = r() * n / 2, m = r(); const sz = m > 0.985 ? 1.6 : m > 0.9 ? 1.1 : 0.7; const a = 0.25 + r() * 0.6; c.fillStyle = `rgba(${220 + r() * 35},${220 + r() * 35},${235 + r() * 20},${a})`; c.beginPath(); c.arc(x, y, sz, 0, Math.PI * 2); c.fill(); }
    // 은하수 띠
    for (let i = 0; i < 14000; i++) { const x = r() * n; const y = n / 4 + Math.sin(x / n * Math.PI * 2) * 120 + (r() - 0.5) * 160 * (0.5 + r()); c.fillStyle = `rgba(200,210,255,${0.03 + r() * 0.08})`; c.fillRect(x, y, 1, 1); }
    t.update(true); t.coordinatesMode = Texture.SPHERICAL_MODE; t.hasAlpha = true;
    return t;
  }

  // time: 시(0~24) · dt: 초 · force: 프로브 즉시 갱신
  update(time, dt, force = false) {
    this.time = ((time % 24) + 24) % 24;
    const t = this.time;
    // 실제 태양 궤도: 위도 36.6°N(충북 보은) · 적위 +12°(4월 말) · 정오에 남중(고도 65°) · 일출 5:24 · 일몰 18:36
    const LAT = 36.6 * Math.PI / 180, DEC = 12 * Math.PI / 180, H = (t - 12) * 15 * Math.PI / 180;
    const sEl = Math.sin(LAT) * Math.sin(DEC) + Math.cos(LAT) * Math.cos(DEC) * Math.cos(H);
    const elv = Math.asin(Math.max(-1, Math.min(1, sEl))), cEl = Math.cos(elv);
    let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(DEC) - sEl * Math.sin(LAT)) / Math.max(1e-4, cEl * Math.cos(LAT))))); // 북쪽 기준 시계 방향
    if (H > 0) az = Math.PI * 2 - az;
    this.sunDir.set(Math.sin(az) * cEl, Math.max(-0.999, Math.min(0.999, sEl)), Math.cos(az) * cEl).normalize(); // 동=+x · 북=+z
    this.moonDir.set(-this.sunDir.x, -this.sunDir.y, this.sunDir.z).normalize();
    const sinEl = this.sunDir.y;
    // 밤 비율 · 태양 세기 · 색
    this.night = 1 - smooth(-0.22, 0.02, sinEl);
    const dayK = smooth(-0.04, 0.22, sinEl);
    this.sunIntensity = 2.4 * dayK;
    const warm = smooth(0.0, 0.42, sinEl);
    this.sunColor.set(1.0, mix(0.55, 0.97, warm), mix(0.28, 0.9, warm));
    // 하늘 재질
    // 하늘 모델은 해가 지평선 아래로 가면 깨지므로, 해를 지평선에 붙잡고 밝기만 줄인다
    const skySun = this._tmp2.copyFrom(this.sunDir); if (skySun.y < 0.015) { skySun.y = 0.015; skySun.normalize(); }
    this.skyMat.sunPosition.copyFrom(skySun).scaleInPlace(300);
    const dusk = smooth(-0.25, 0.08, sinEl);
    this.skyMat.luminance = mix(0.006, 0.36, dusk);
    this.skyMat.turbidity = mix(6, 3, smooth(0.05, 0.5, sinEl));
    this.skyMat.mieCoefficient = mix(0.012, 0.004, smooth(0, 0.4, sinEl));
    const pm = this.probeMat; pm.sunPosition.copyFrom(this.skyMat.sunPosition); pm.turbidity = this.skyMat.turbidity; pm.mieCoefficient = 0.002; pm.rayleigh = this.skyMat.rayleigh;
    pm.luminance = mix(0.035, 0.11, dusk);
    // 별
    this.starsMat.alpha = smooth(0.0, 0.5, this.night) * 0.9;
    this.stars.rotation.y = t * 0.02;
    // 태양 구
    const cam = this.scene.activeCamera;
    if (cam) { this.sunMesh.position.copyFrom(cam.globalPosition ?? cam.position).addInPlace(this._tmp.copyFrom(this.sunDir).scaleInPlace(700)); this.probe.position.copyFrom(cam.globalPosition ?? cam.position); }
    this.sunMesh.setEnabled(sinEl > -0.05);
    this.sunMat.emissiveColor.copyFrom(this.sunColor).scaleInPlace(1.6);
    // 지평선 색(안개·클리어)
    const dayH = new Color3(0.70, 0.80, 0.92), duskH = new Color3(0.95, 0.55, 0.35), nightH = new Color3(0.03, 0.04, 0.08);
    const h = Color3.Lerp(duskH, dayH, smooth(0.02, 0.35, sinEl));
    this.horizon = Color3.Lerp(h, nightH, smooth(-0.02, -0.25, sinEl));
    this.scene.fogColor = this.horizon; this.scene.clearColor = new Color4(this.horizon.r, this.horizon.g, this.horizon.b, 1);
    this.scene.environmentIntensity = mix(0.3, 0.7, smooth(-0.25, 0.1, sinEl));
    // 프로브: 시간이 어느 정도 움직였으면 다시 찍기 (1.5초마다 최대 한 번)
    this._probeTimer += dt;
    if (force || (Math.abs(t - this._lastProbeTime) > 0.08 && this._probeTimer > 1.5)) {
      this._probeTimer = 0; this._lastProbeTime = t;
      this.probe.cubeTexture.resetRefreshCounter();
      this._needSH = 2; // 두 프레임 뒤 구면조화 재계산
    }
    if (this._needSH !== undefined && this._needSH >= 0) { if (this._needSH === 0) this.probe.cubeTexture.forceSphericalPolynomialsRecompute(); this._needSH--; }
  }
}
