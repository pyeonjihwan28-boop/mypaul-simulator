// 블록 느낌 학생 캐릭터 — 머리·몸통·팔·다리 + 교복(흰 셔츠 · 초록 넥타이/리본 · 남색 하의).
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector4 } from '@babylonjs/core/Maths/math.vector.js';

const matCache = new Map();
function solidMat(scene, hex, rough = 0.85, metal = 0) {
  const key = `${hex}|${rough}|${metal}`;
  if (matCache.has(key)) return matCache.get(key);
  const m = new PBRMaterial('cm' + key, scene);
  m.albedoColor = Color3.FromHexString(hex); m.roughness = rough; m.metallic = metal; m.environmentIntensity = 0.8;
  matCache.set(key, m); return m;
}
let faceTexCache = new Map();
function faceMat(scene, skinHex, hairHex, variant) {
  const key = skinHex + hairHex + variant;
  if (faceTexCache.has(key)) return faceTexCache.get(key);
  const t = new DynamicTexture('face' + key, { width: 64, height: 64 }, scene, false);
  const c = t.getContext(); c.imageSmoothingEnabled = false;
  c.fillStyle = skinHex; c.fillRect(0, 0, 64, 64);
  // 머리카락(앞머리)
  c.fillStyle = hairHex; c.fillRect(0, 0, 64, variant % 2 ? 14 : 20); if (variant % 3 === 0) { c.fillRect(0, 0, 10, 40); c.fillRect(54, 0, 10, 40); }
  // 눈
  c.fillStyle = '#fff'; c.fillRect(14, 28, 12, 10); c.fillRect(38, 28, 12, 10);
  c.fillStyle = '#2a1a10'; c.fillRect(variant % 2 ? 20 : 18, 30, 6, 8); c.fillRect(variant % 2 ? 42 : 40, 30, 6, 8);
  // 입 · 볼
  c.fillStyle = 'rgba(230,120,120,.55)'; c.fillRect(10, 42, 8, 5); c.fillRect(46, 42, 8, 5);
  c.fillStyle = '#9c4a3a'; c.fillRect(27, 48, 10, 3);
  t.update(true); t.hasAlpha = false;
  const m = new PBRMaterial('faceM' + key, scene); m.albedoTexture = t; m.roughness = 0.8; m.metallic = 0; m.environmentIntensity = 0.8;
  faceTexCache.set(key, m); return m;
}

export const PALETTES = [
  { skin: '#f1c9a5', hair: '#1f1a17', top: '#f4f4f0', bottom: '#1e2a4a', tie: '#1f7a46', skirt: false },
  { skin: '#e8b990', hair: '#3b2a1e', top: '#f4f4f0', bottom: '#1e2a4a', tie: '#1f7a46', skirt: true },
  { skin: '#f6d6b8', hair: '#5a3b22', top: '#f4f4f0', bottom: '#23314f', tie: '#1f7a46', skirt: false },
  { skin: '#d9a77c', hair: '#120f0d', top: '#eef2f5', bottom: '#1e2a4a', tie: '#1f7a46', skirt: true },
  { skin: '#f1c9a5', hair: '#7a4a2a', top: '#2f6a3f', bottom: '#1e2a4a', tie: '#f4f4f0', skirt: false }, // 체육복
  { skin: '#e8b990', hair: '#1f1a17', top: '#2f6a3f', bottom: '#1e2a4a', tie: '#f4f4f0', skirt: false },
];

/**
 * @returns {{root:TransformNode, meshes:Mesh[], parts:object, animate:(t:number, speed:number, dt:number)=>void, setVisible:(v:boolean)=>void}}
 */
export function makeCharacter(scene, palette, variant = 0, name = 'stu') {
  const root = new TransformNode(name, scene);
  const meshes = [];
  const box = (n, w, h, d, mat, parent, px, py, pz, faceUV) => {
    const m = MeshBuilder.CreateBox(n, { width: w, height: h, depth: d, faceUV }, scene);
    m.material = mat; m.parent = parent; m.position.set(px, py, pz); m.isPickable = false; m.receiveShadows = true;
    meshes.push(m); return m;
  };
  const skin = solidMat(scene, palette.skin), hair = solidMat(scene, palette.hair, 0.6), top = solidMat(scene, palette.top), bottom = solidMat(scene, palette.bottom), tie = solidMat(scene, palette.tie), shoe = solidMat(scene, '#2a2622', 0.5);
  // 몸 치수(m): 키 1.8
  const legH = 0.78, torsoH = 0.62, headS = 0.46;
  const hips = new TransformNode(name + '_hips', scene); hips.parent = root; hips.position.y = legH;
  const torso = box('torso', 0.52, torsoH, 0.28, top, hips, 0, torsoH / 2, 0);
  if (palette.skirt) { const sk = box('skirt', 0.56, 0.3, 0.34, bottom, hips, 0, -0.14, 0); }
  // 넥타이/리본
  box('tie', 0.08, 0.26, 0.03, tie, torso, 0, torsoH / 2 - 0.2, 0.155);
  // 머리: 앞면(+z, 캐릭터 정면)만 얼굴 텍스처 (Babylon 상자 faceUV: 0:+z 1:-z 2:+x 3:-x 4:+y 5:-y)
  const headNode = new TransformNode(name + '_head', scene); headNode.parent = hips; headNode.position.y = torsoH + 0.02;
  const fuv = [new Vector4(0, 0, 1, 1), new Vector4(0, 0, 0.01, 0.01), new Vector4(0, 0, 0.01, 0.01), new Vector4(0, 0, 0.01, 0.01), new Vector4(0, 0, 0.01, 0.01), new Vector4(0, 0, 0.01, 0.01)];
  const head = box('head', headS, headS, headS, faceMat(scene, palette.skin, palette.hair, variant), headNode, 0, headS / 2, 0, fuv);
  // 머리카락 덮개(뒤·위)
  box('hairTop', headS + 0.04, 0.12, headS + 0.04, hair, headNode, 0, headS - 0.04, 0.0);
  box('hairBack', headS + 0.04, headS * 0.75, 0.08, hair, headNode, 0, headS / 2 - 0.02, -(headS / 2 + 0.02));
  if (variant % 2 === 1) box('hairLong', headS + 0.04, 0.4, 0.1, hair, headNode, 0, 0.0, -(headS / 2 + 0.02));
  // 팔(어깨 피벗) · 다리(엉덩이 피벗)
  const armL = new TransformNode('armL', scene), armR = new TransformNode('armR', scene);
  armL.parent = hips; armR.parent = hips; armL.position.set(-0.34, torsoH - 0.06, 0); armR.position.set(0.34, torsoH - 0.06, 0);
  box('armLm', 0.16, 0.6, 0.16, top, armL, 0, -0.26, 0); box('handL', 0.14, 0.14, 0.14, skin, armL, 0, -0.6, 0);
  box('armRm', 0.16, 0.6, 0.16, top, armR, 0, -0.26, 0); box('handR', 0.14, 0.14, 0.14, skin, armR, 0, -0.6, 0);
  const legL = new TransformNode('legL', scene), legR = new TransformNode('legR', scene);
  legL.parent = hips; legR.parent = hips; legL.position.set(-0.13, 0, 0); legR.position.set(0.13, 0, 0);
  box('legLm', 0.2, legH - 0.1, 0.22, bottom, legL, 0, -(legH - 0.1) / 2 + 0.0, 0); box('shoeL', 0.22, 0.12, 0.3, shoe, legL, 0, -legH + 0.06, 0.03);
  box('legRm', 0.2, legH - 0.1, 0.22, bottom, legR, 0, -(legH - 0.1) / 2 + 0.0, 0); box('shoeR', 0.22, 0.12, 0.3, shoe, legR, 0, -legH + 0.06, 0.03);
  // 가방
  box('bag', 0.36, 0.42, 0.14, solidMat(scene, ['#8a2f2f', '#2b4a8a', '#2f6a3f', '#333333'][variant % 4], 0.7), torso, 0, 0.02, -0.21);

  let phase = 0;
  const animate = (t, speed, dt) => {
    phase += dt * (3.5 + speed * 3.2) * Math.min(1, speed * 2);
    const amp = Math.min(0.9, speed * 0.5);
    const s = Math.sin(phase);
    legL.rotation.x = s * amp; legR.rotation.x = -s * amp;
    armL.rotation.x = -s * amp * 0.8; armR.rotation.x = s * amp * 0.8;
    armL.rotation.z = 0.08; armR.rotation.z = -0.08;
    hips.position.y = legH + Math.abs(Math.cos(phase)) * amp * 0.05 + Math.sin(t * 2) * 0.006;
    headNode.rotation.x = Math.sin(t * 1.3) * 0.03;
  };
  const setVisible = (v) => { for (const m of meshes) m.isVisible = v; };
  return { root, meshes, parts: { hips, headNode, armL, armR, legL, legR }, animate, setVisible };
}
