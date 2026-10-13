// 복셀 재질 — 아틀라스 4장을 PBR 재질 3개(불투명·컷아웃·유리)에 연결.
// VoxelAO 플러그인: 꼭짓점 색 알파에 든 AO 를 '환경광'에만 적용(직사광은 그대로 → 사실적인 모서리 그늘).
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture.js';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Constants } from '@babylonjs/core/Engines/constants.js';

export class VoxelAOPlugin extends MaterialPluginBase {
  constructor(material) { super(material, 'VoxelAO', 200, { VOXELAO: false }); this._enable(true); }
  prepareDefines(defines) { defines.VOXELAO = true; }
  getClassName() { return 'VoxelAOPlugin'; }
  getCustomCode(shaderType) {
    if (shaderType !== 'fragment') return null;
    return {
      // aoOut 계산 직후(라이트맵 초기화 전)에 꼭짓점 AO 를 섞는다
      '!#ifdef UNLIT\\nvec3 diffuseBase': '#if defined(VERTEXCOLOR)\naoOut.ambientOcclusionColor*=vColor.a;\n#endif\n#ifdef UNLIT\nvec3 diffuseBase',
    };
  }
}

function makeTex(name, data, w, h, scene, gamma) {
  const t = new RawTexture(data, w, h, Constants.TEXTUREFORMAT_RGBA, scene, true, false, Texture.TRILINEAR_SAMPLINGMODE, Constants.TEXTURETYPE_UNSIGNED_BYTE);
  t.name = name; t.wrapU = Texture.CLAMP_ADDRESSMODE; t.wrapV = Texture.CLAMP_ADDRESSMODE;
  t.anisotropicFilteringLevel = 8; t.gammaSpace = gamma;
  return t;
}

/** @returns {{opaque:PBRMaterial, cutout:PBRMaterial, glass:PBRMaterial, textures:object, setNight(k:number):void}} */
export function createVoxelMaterials(scene, atlas, quality) {
  const { width: w, height: h } = atlas;
  const albedo = makeTex('atlasAlbedo', atlas.albedo, w, h, scene, true); albedo.hasAlpha = true;
  const normal = makeTex('atlasNormal', atlas.normal, w, h, scene, false);
  const orm = makeTex('atlasORM', atlas.orm, w, h, scene, false);
  const emissive = makeTex('atlasEmissive', atlas.emissive, w, h, scene, true);

  const make = (name) => {
    const m = new PBRMaterial(name, scene);
    m.albedoTexture = albedo;
    m.bumpTexture = normal; m.bumpTexture.level = quality.bumps ? 1 : 0;
    if (!quality.bumps) m.bumpTexture = null;
    m.metallicTexture = orm; m.useRoughnessFromMetallicTextureAlpha = false; m.useRoughnessFromMetallicTextureGreen = true;
    m.useMetallnessFromMetallicTextureBlue = true; m.useAmbientOcclusionFromMetallicTextureRed = false;
    m.metallic = 1; m.roughness = 1;
    m.emissiveTexture = emissive; m.emissiveColor = new Color3(1, 1, 1); m.emissiveIntensity = 0.35;
    m.ambientColor = new Color3(0, 0, 0);
    m.specularIntensity = 1; m.environmentIntensity = 1;
    m.enableSpecularAntiAliasing = true;
    m.forceIrradianceInFragment = true;
    m.maxSimultaneousLights = quality.maxLights;
    m.invertNormalMapX = false; m.invertNormalMapY = false;
    if (!quality.noAO) new VoxelAOPlugin(m);
    return m;
  };
  const opaque = make('voxOpaque');
  opaque.backFaceCulling = true; opaque.transparencyMode = PBRMaterial.PBRMATERIAL_OPAQUE;

  const cutout = make('voxCutout');
  cutout.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHATEST;
  cutout.useAlphaFromAlbedoTexture = true; cutout.alphaCutOff = 0.5;
  cutout.backFaceCulling = false; cutout.twoSidedLighting = true;

  const glass = make('voxGlass');
  glass.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
  glass.useAlphaFromAlbedoTexture = true; glass.backFaceCulling = true;
  glass.needDepthPrePass = false; glass.separateCullingPass = false;
  glass.environmentIntensity = 1.2; glass.specularIntensity = 1.4;

  const mats = { opaque, cutout, glass, textures: { albedo, normal, orm, emissive } };
  // 밤이면 간판·창문·가로등이 밝게
  mats.setNight = (k) => { const v = 0.3 + k * 2.2; opaque.emissiveIntensity = v; cutout.emissiveIntensity = v; glass.emissiveIntensity = v; };
  return mats;
}
