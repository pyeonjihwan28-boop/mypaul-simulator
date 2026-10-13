import { Engine } from '@babylonjs/core/Engines/engine.js';
import { Scene } from '@babylonjs/core/scene.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera.js';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
import { CascadedShadowGenerator } from '@babylonjs/core/Lights/Shadows/cascadedShadowGenerator.js';
const q = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
const cam = new TargetCamera('c', new Vector3(0, 6, -12), scene); cam.setTarget(new Vector3(0, 0, 0)); cam.minZ = 0.1; cam.maxZ = 200;
const sun = new DirectionalLight('sun', new Vector3(-0.3, -0.9, 0.3), scene); sun.intensity = 2; sun.position = new Vector3(10, 30, -10);
const m = new PBRMaterial('m', scene); m.albedoColor = new Color3(0.8, 0.8, 0.8); m.roughness = 0.9; m.metallic = 0;
const ground = MeshBuilder.CreateGround('g', { width: 30, height: 30 }, scene); ground.material = m; ground.receiveShadows = true;
const box = MeshBuilder.CreateBox('b', { size: 2 }, scene); box.position.y = 1; box.material = m;
let sg;
if (q.get('csm')) { sg = new CascadedShadowGenerator(1024, sun); sg.numCascades = 3; sg.lambda = 0.8; sg.shadowMaxZ = 60; sg.autoCalcDepthBounds = false; sg.stabilizeCascades = true; sg.depthClamp = true; }
else { sg = new ShadowGenerator(1024, sun); }
if (q.get('pcf')) { sg.filter = ShadowGenerator.FILTER_PCF; }
sg.addShadowCaster(box);
scene.environmentIntensity = 0; scene.ambientColor = new Color3(0,0,0);
window.__ready = true;
engine.runRenderLoop(() => scene.render());

// ----- 게임과 같은 조건을 하나씩 추가 -----
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js';
import { SSAO2RenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline.js';
import { VolumetricLightScatteringPostProcess } from '@babylonjs/core/PostProcesses/volumetricLightScatteringPostProcess.js';
import { ClusteredLightContainer } from '@babylonjs/core/Lights/Clustered/clusteredLightContainer.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe.js';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent.js';
import '@babylonjs/core/Rendering/geometryBufferRendererSceneComponent.js';
import '@babylonjs/core/Engines/Extensions/engine.renderTargetCube.js';
import '@babylonjs/core/Materials/Textures/baseTexture.polynomial.js';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
if (q.get('vls')) { const s = MeshBuilder.CreateSphere('sun', { diameter: 4 }, scene); s.position.set(20, 30, 20); new VolumetricLightScatteringPostProcess('vls', 0.5, cam, s, 60, Texture.BILINEAR_SAMPLINGMODE, engine, false, scene); }
if (q.get('ssao')) { new SSAO2RenderingPipeline('ssao', scene, { ssaoRatio: 0.5, blurRatio: 0.5 }, [cam], true); }
if (q.get('pipe')) { const p = new DefaultRenderingPipeline('d', true, scene, [cam]); p.samples = 2; p.fxaaEnabled = true; p.bloomEnabled = true; p.imageProcessingEnabled = true; p.imageProcessing.toneMappingEnabled = true; }
if (q.get('cluster')) { const c = new ClusteredLightContainer('cl', [], scene); const pl = new PointLight('pl', new Vector3(3, 2, 0), scene); pl.range = 6; c.addLight(pl); }
if (q.get('probe')) { const pr = new ReflectionProbe('p', 64, scene, true, false, true); const sky = MeshBuilder.CreateBox('sky', { size: 100 }, scene); sky.infiniteDistance = true; const sm = new PBRMaterial('skym', scene); sm.backFaceCulling = false; sm.unlit = true; sm.albedoColor = new Color3(0.4, 0.6, 0.9); sky.material = sm; pr.renderList.push(sky); scene.environmentTexture = pr.cubeTexture; scene.environmentIntensity = 0.6; }
if (q.get('dir')) { scene.onBeforeRenderObservable.add(() => { sun.direction.set(-0.26, -0.95, 0.19); }); }
if (q.get('maxz')) { cam.maxZ = 900; }
if (q.get('minmax')) { sun.shadowMinZ = 1; sun.shadowMaxZ = 300; sun.autoCalcShadowZBounds = false; }
if (q.get('hq')) { sg.filteringQuality = ShadowGenerator.QUALITY_HIGH; }
if (q.get('bias')) { sg.bias = 0.0025; sg.normalBias = 0.03; }
if (q.get('blend')) { sg.cascadeBlendPercentage = 0.06; sg.penumbraDarkness = 0.9; }
if (q.get('transp')) { sg.transparencyShadow = true; sg.enableSoftTransparentShadow = false; }
if (q.get('fog')) { scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.0032; }
if (q.get('ip')) { scene.imageProcessingConfiguration.applyByPostProcess = true; }
