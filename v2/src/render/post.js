// 후처리 — 갓레이 → SSAO → (SSR) → 기본 파이프라인(블룸·톤매핑·FXAA·선명도·비네트)
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js';
import { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline.js';
import { SSRRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline.js';
import { VolumetricLightScatteringPostProcess } from '@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess.js';
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration.js';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.js';
import '@babylonjs/core/Rendering/geometryBufferRendererSceneComponent.js';
import '@babylonjs/core/Rendering/prePassRendererSceneComponent.js';
import '@babylonjs/core/Rendering/depthRendererSceneComponent.js';

export class PostFX {
  constructor(scene, camera, preset, sky) {
    this.scene = scene; this.camera = camera; this.preset = preset; this.sky = sky;
    this.vls = null; this.ssao = null; this.ssr = null;
    if (preset.godRays) {
      const vls = new VolumetricLightScatteringPostProcess('godrays', 0.5, camera, sky.sunMesh, 60, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, scene);
      vls.exposure = 0.22; vls.decay = 0.965; vls.weight = 0.5; vls.density = 0.9;
      vls.useCustomMeshPosition = false;
      this.vls = vls;
    }
    if (preset.ssao) {
      const ssao = new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [camera], true);
      ssao.radius = 1.0; ssao.totalStrength = 0.8; ssao.base = 0.15; ssao.samples = preset.ssr ? 16 : 12; ssao.maxZ = 80; ssao.minZAspect = 0.5;
      ssao.expensiveBlur = true; ssao.bypassBlur = false; ssao.epsilon = 0.02;
      this.ssao = ssao;
    }
    if (preset.ssr) {
      const ssr = new SSRRenderingPipeline('ssr', scene, [camera], true);
      ssr.strength = 0.8; ssr.reflectionSpecularFalloffExponent = 2; ssr.thickness = 0.6; ssr.step = 2; ssr.maxSteps = 600; ssr.maxDistance = 120;
      ssr.roughnessFactor = 0.08; ssr.enableSmoothReflections = true; ssr.useFresnel = true; ssr.reflectivityThreshold = 0.035; ssr.blurDispersionStrength = 0.03;
      ssr.enableAutomaticThicknessComputation = false; ssr.attenuateScreenBorders = true; ssr.attenuateFacingCamera = true; ssr.attenuateBackfaceReflection = true;
      ssr.selfCollisionNumSkip = 2; ssr.clipToFrustum = true;
      this.ssr = ssr;
    }
    const pipe = new DefaultRenderingPipeline('default', true, scene, [camera]);
    pipe.samples = preset.msaa;
    pipe.fxaaEnabled = preset.fxaa;
    pipe.bloomEnabled = preset.bloom; pipe.bloomThreshold = 0.85; pipe.bloomWeight = 0.28; pipe.bloomKernel = 64; pipe.bloomScale = 0.5;
    pipe.imageProcessingEnabled = true;
    const ip = pipe.imageProcessing;
    ip.toneMappingEnabled = true; ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.0; ip.contrast = 1.08;
    ip.vignetteEnabled = true; ip.vignetteWeight = 1.4; ip.vignetteStretch = 0.3; ip.vignetteColor.set(0, 0, 0, 0);
    pipe.sharpenEnabled = preset.shadows; pipe.sharpen.edgeAmount = 0.25; pipe.sharpen.colorAmount = 1.0;
    pipe.chromaticAberrationEnabled = false; pipe.grainEnabled = false;
    this.pipe = pipe;
  }
  // SSAO 지오메트리 버퍼에서 컷아웃(나뭇잎·기둥) 청크와 하늘은 뺀다 — 얇은 기둥 둘레가 시커멓게 되는 걸 막음
  refreshGBufferList() {
    const g = this.scene.geometryBufferRenderer; if (!g) return;
    const skip = /_cutout$|^sky|^stars$|^sunDisc$|^aim$|^sign|^clock/;
    g.renderList = this.scene.meshes.filter((m) => !skip.test(m.name));
  }
  // 밤에는 노출을 살짝 올리고 블룸을 키운다
  update(night) {
    const ip = this.pipe.imageProcessing;
    ip.exposure = 1.0 + night * 0.3;
    this.pipe.bloomWeight = 0.28 + night * 0.25; this.pipe.bloomThreshold = 0.85 - night * 0.25;
    if (this.vls) { this.vls.exposure = 0.22 * (1 - night); }
  }
  dispose() { this.pipe.dispose(); this.ssao?.dispose(); this.ssr?.dispose(); this.vls?.dispose(this.camera); }
}
