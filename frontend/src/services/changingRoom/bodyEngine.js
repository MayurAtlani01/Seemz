import * as THREE from "three";

/**
 * SEEMZ Changing Room — Procedural 3D Body / Mannequin Engine
 * Generates an elegant, continuous high-fashion mannequin with smooth organic curves,
 * seamless anatomical transitions, and a luxury porcelain/alabaster finish.
 */

// Default standard baseline proportions (in cm) - realistic atelier fashion mannequins
export const DEFAULT_BODY_MEN = {
  category: "men",
  height: 180,
  chest: 98,
  waist: 80,
  hip: 96,
  shoulderWidth: 45,
  inseam: 82,
};

export const DEFAULT_BODY_WOMEN = {
  category: "women",
  height: 170,
  chest: 86,
  waist: 66,
  hip: 92,
  shoulderWidth: 38,
  inseam: 78,
};

// Preset Profiles for quick selection
export const BODY_PRESETS = [
  {
    id: "standard",
    name: "Classic Atelier",
    men: { height: 180, chest: 98, waist: 80, hip: 96, shoulderWidth: 45, inseam: 82 },
    women: { height: 170, chest: 86, waist: 66, hip: 92, shoulderWidth: 38, inseam: 78 },
  },
  {
    id: "slim",
    name: "Slim Minimalist",
    men: { height: 180, chest: 92, waist: 74, hip: 90, shoulderWidth: 43, inseam: 82 },
    women: { height: 170, chest: 82, waist: 62, hip: 88, shoulderWidth: 37, inseam: 78 },
  },
  {
    id: "athletic",
    name: "Athletic / Broad",
    men: { height: 184, chest: 104, waist: 82, hip: 98, shoulderWidth: 48, inseam: 84 },
    women: { height: 174, chest: 90, waist: 68, hip: 96, shoulderWidth: 40, inseam: 80 },
  },
  {
    id: "curated",
    name: "Curated Relaxed",
    men: { height: 178, chest: 100, waist: 86, hip: 100, shoulderWidth: 46, inseam: 80 },
    women: { height: 168, chest: 92, waist: 74, hip: 100, shoulderWidth: 39, inseam: 76 },
  },
];

/**
 * Creates the high-contrast luxury porcelain mannequin material
 */
function createMannequinMaterials() {
  // Light porcelain / alabaster ivory finish with soft satin sheen
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#E8E5DC"), // Warm porcelain alabaster
    roughness: 0.36,
    metalness: 0.04,
    flatShading: false,
  });

  // Dark matte studio pedestal
  const pedestalMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#121418"),
    roughness: 0.5,
    metalness: 0.6,
  });

  // Brushed champagne / metallic hardware ring
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#C8C5BD"),
    roughness: 0.2,
    metalness: 0.8,
  });

  return { bodyMaterial, pedestalMaterial, accentMaterial };
}

/**
 * Helper to create an organic lofted cross-section geometry
 * Takes an array of ring definitions: { y, rx, rz }
 */
function createLoftedGeometry(rings, radialSegments = 32) {
  const geom = new THREE.BufferGeometry();
  const numRings = rings.length;
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let r = 0; r < numRings; r++) {
    const ring = rings[r];
    const v = r / (numRings - 1);

    for (let s = 0; s <= radialSegments; s++) {
      const u = s / radialSegments;
      const angle = u * Math.PI * 2;

      // Elliptical cross section with subtle anatomical shaping
      const x = Math.cos(angle) * ring.rx;
      const z = Math.sin(angle) * ring.rz + (ring.zOffset || 0);
      const y = ring.y;

      vertices.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const ringStride = radialSegments + 1;
  for (let r = 0; r < numRings - 1; r++) {
    for (let s = 0; s < radialSegments; s++) {
      const a = r * ringStride + s;
      const b = (r + 1) * ringStride + s;
      const c = (r + 1) * ringStride + (s + 1);
      const d = r * ringStride + (s + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Builds the complete continuous 3D Humanoid Mannequin
 */
export function createBodyModel(bodyParams = DEFAULT_BODY_MEN) {
  const root = new THREE.Group();
  root.name = "BodyRoot";

  const materials = createMannequinMaterials();

  // Root container for parts that scale with proportions
  const skeleton = new THREE.Group();
  skeleton.name = "Skeleton";
  root.add(skeleton);

  // 1. Sleek Atelier Floor Pedestal
  const pedestalGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.025, 48);
  const pedestal = new THREE.Mesh(pedestalGeo, materials.pedestalMaterial);
  pedestal.position.y = 0.012;
  pedestal.receiveShadow = true;
  root.add(pedestal);

  const ringGeo = new THREE.RingGeometry(0.315, 0.322, 48);
  const ring = new THREE.Mesh(ringGeo, materials.accentMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.026;
  root.add(ring);

  // 2. Sculpted Head & Neck Group
  const headGroup = createSculptedHeadAndNeck(materials);
  headGroup.name = "HeadGroup";
  skeleton.add(headGroup);

  // 3. Continuous Sculpted Torso Group (Clavicles -> Chest -> Waist -> Hips -> Pelvis)
  const torsoGroup = createSculptedTorso(materials, bodyParams);
  torsoGroup.name = "TorsoGroup";
  skeleton.add(torsoGroup);

  // 4. Smooth Arms (Left & Right)
  const leftArm = createSmoothArm(materials, true);
  leftArm.name = "LeftArmGroup";
  skeleton.add(leftArm);

  const rightArm = createSmoothArm(materials, false);
  rightArm.name = "RightArmGroup";
  skeleton.add(rightArm);

  // 5. Smooth Continuous Legs (Left & Right)
  const leftLeg = createSmoothLeg(materials, true);
  leftLeg.name = "LeftLegGroup";
  skeleton.add(leftLeg);

  const rightLeg = createSmoothLeg(materials, false);
  rightLeg.name = "RightLegGroup";
  skeleton.add(rightLeg);

  // Apply initial scaling
  updateBodyModel(root, bodyParams);

  return root;
}

/**
 * 1. Head & Neck (Smooth Editorial Sculpt)
 */
function createSculptedHeadAndNeck(materials) {
  const group = new THREE.Group();

  // Head: Stylized oval with smooth jawline
  const headGeo = new THREE.SphereGeometry(0.105, 32, 28);
  headGeo.scale(0.82, 1.15, 0.94);
  const headMesh = new THREE.Mesh(headGeo, materials.bodyMaterial);
  headMesh.position.set(0, 0.15, 0.01);
  headMesh.castShadow = true;
  group.add(headMesh);

  // Neck: Smooth organic column connecting into clavicle
  const neckRings = [
    { y: -0.06, rx: 0.062, rz: 0.068, zOffset: 0.0 },
    { y: 0.0, rx: 0.052, rz: 0.056, zOffset: 0.0 },
    { y: 0.07, rx: 0.048, rz: 0.052, zOffset: 0.005 },
    { y: 0.12, rx: 0.055, rz: 0.06, zOffset: 0.01 },
  ];
  const neckGeo = createLoftedGeometry(neckRings, 32);
  const neckMesh = new THREE.Mesh(neckGeo, materials.bodyMaterial);
  neckMesh.castShadow = true;
  group.add(neckMesh);

  return group;
}

/**
 * 2. Continuous Sculpted Torso (Unified seamless mesh from clavicles to pelvis)
 */
function createSculptedTorso(materials, params) {
  const group = new THREE.Group();

  const isWomen = params?.category === "women";

  // Define continuous vertical profile rings from top (clavicles) to bottom (pelvis)
  const torsoRings = [
    // Clavicles / Neck base
    { y: 0.32, rx: 0.18, rz: 0.12, zOffset: 0.0 },
    // Upper Chest / Pectorals / Bust
    { y: 0.24, rx: 0.19, rz: isWomen ? 0.145 : 0.13, zOffset: isWomen ? 0.02 : 0.01 },
    // Mid Torso / Ribs
    { y: 0.14, rx: 0.165, rz: 0.115, zOffset: 0.0 },
    // Natural Waist (slender inward curve)
    { y: 0.04, rx: isWomen ? 0.13 : 0.145, rz: 0.098, zOffset: 0.0 },
    // High Hip / Waist transition
    { y: -0.06, rx: isWomen ? 0.155 : 0.152, rz: 0.11, zOffset: 0.0 },
    // Mid Hip / Pelvis widest span
    { y: -0.16, rx: isWomen ? 0.18 : 0.165, rz: 0.128, zOffset: -0.01 },
    // Lower Pelvis / Crotch base
    { y: -0.25, rx: isWomen ? 0.155 : 0.148, rz: 0.11, zOffset: -0.01 },
  ];

  const torsoGeo = createLoftedGeometry(torsoRings, 36);
  const torsoMesh = new THREE.Mesh(torsoGeo, materials.bodyMaterial);
  torsoMesh.name = "ContinuousTorsoMesh";
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  return group;
}

/**
 * 3. Smooth Continuous Arm (Shoulder cap -> Upper Arm -> Forearm -> Stylized Hand)
 */
function createSmoothArm(materials, isLeft) {
  const arm = new THREE.Group();
  const side = isLeft ? 1 : -1;

  // Single continuous lofted arm from shoulder socket to wrist
  const armRings = [
    // Smooth Shoulder Cap / Deltoid (overlaps seamless with torso)
    { y: 0.03, rx: 0.052, rz: 0.052, zOffset: 0.0 },
    { y: -0.04, rx: 0.046, rz: 0.046, zOffset: 0.0 },
    // Upper Arm
    { y: -0.14, rx: 0.038, rz: 0.038, zOffset: 0.0 },
    // Elbow (smooth transition)
    { y: -0.26, rx: 0.032, rz: 0.032, zOffset: 0.005 },
    // Forearm
    { y: -0.38, rx: 0.03, rz: 0.028, zOffset: 0.01 },
    // Wrist
    { y: -0.48, rx: 0.024, rz: 0.02, zOffset: 0.015 },
  ];

  const armGeo = createLoftedGeometry(armRings, 24);
  const armMesh = new THREE.Mesh(armGeo, materials.bodyMaterial);
  armMesh.name = "ContinuousArmMesh";
  armMesh.position.set(side * 0.01, 0, 0);
  armMesh.castShadow = true;
  arm.add(armMesh);

  // Stylized Elegant Fashion Mannequin Hand
  const handRings = [
    { y: -0.48, rx: 0.024, rz: 0.02, zOffset: 0.015 },
    { y: -0.54, rx: 0.026, rz: 0.016, zOffset: 0.02 },
    { y: -0.60, rx: 0.018, rz: 0.010, zOffset: 0.025 },
    { y: -0.64, rx: 0.008, rz: 0.005, zOffset: 0.03 },
  ];
  const handGeo = createLoftedGeometry(handRings, 16);
  const handMesh = new THREE.Mesh(handGeo, materials.bodyMaterial);
  handMesh.castShadow = true;
  arm.add(handMesh);

  return arm;
}

/**
 * 4. Smooth Continuous Leg (Thigh -> Knee -> Calf -> Ankle -> Sleek Fashion Boot)
 */
function createSmoothLeg(materials, isLeft) {
  const leg = new THREE.Group();
  const side = isLeft ? 1 : -1;

  // Single continuous lofted leg column with anatomical curve
  const legRings = [
    // Upper Thigh Root (nests smoothly inside pelvis)
    { y: 0.04, rx: 0.086, rz: 0.088, zOffset: 0.0 },
    { y: -0.12, rx: 0.076, rz: 0.076, zOffset: 0.0 },
    { y: -0.26, rx: 0.064, rz: 0.062, zOffset: 0.005 },
    // Knee (smooth anatomical taper)
    { y: -0.40, rx: 0.052, rz: 0.054, zOffset: 0.01 },
    // Calf (gentle organic curve)
    { y: -0.52, rx: 0.056, rz: 0.054, zOffset: 0.005 },
    { y: -0.66, rx: 0.044, rz: 0.042, zOffset: 0.0 },
    // Ankle
    { y: -0.78, rx: 0.034, rz: 0.036, zOffset: 0.0 },
  ];

  const legGeo = createLoftedGeometry(legRings, 28);
  const legMesh = new THREE.Mesh(legGeo, materials.bodyMaterial);
  legMesh.name = "ContinuousLegMesh";
  legMesh.castShadow = true;
  leg.add(legMesh);

  // Sleek Sculpted Fashion Boot / Foot
  const bootGeo = new THREE.CylinderGeometry(0.034, 0.042, 0.14, 24);
  bootGeo.scale(0.85, 1.0, 1.6);
  const bootMesh = new THREE.Mesh(bootGeo, materials.bodyMaterial);
  bootMesh.position.set(0, -0.85, 0.025);
  bootMesh.castShadow = true;
  leg.add(bootMesh);

  return leg;
}

/**
 * Dynamically updates mannequin proportions smoothly in real time
 */
export function updateBodyModel(root, params) {
  if (!root) return;

  const skeleton = root.getObjectByName("Skeleton");
  if (!skeleton) return;

  const isWomen = params.category === "women";

  // Base normalization ratios (relative to neutral 180cm / 170cm height baseline)
  const baseHeight = isWomen ? 170 : 180;
  const baseChest = isWomen ? 86 : 98;
  const baseWaist = isWomen ? 66 : 80;
  const baseHip = isWomen ? 92 : 96;
  const baseShoulder = isWomen ? 38 : 45;
  const baseInseam = isWomen ? 78 : 82;

  const heightRatio = (params.height || baseHeight) / 180;
  const chestRatio = (params.chest || baseChest) / baseChest;
  const waistRatio = (params.waist || baseWaist) / baseWaist;
  const hipRatio = (params.hip || baseHip) / baseHip;
  const shoulderRatio = (params.shoulderWidth || baseShoulder) / baseShoulder;
  const inseamRatio = (params.inseam || baseInseam) / baseInseam;

  // Vertical position landmarks
  const legLength = 0.96 * heightRatio * inseamRatio;
  const pelvisY = legLength;
  const torsoY = pelvisY + 0.22 * heightRatio;
  const chestY = torsoY + 0.18 * heightRatio;
  const headY = chestY + 0.26 * heightRatio;

  // 1. Head & Neck
  const headGroup = skeleton.getObjectByName("HeadGroup");
  if (headGroup) {
    headGroup.position.set(0, headY, 0);
    headGroup.scale.set(heightRatio * 0.96, heightRatio * 0.96, heightRatio * 0.96);
  }

  // 2. Continuous Torso
  const torsoGroup = skeleton.getObjectByName("TorsoGroup");
  if (torsoGroup) {
    torsoGroup.position.set(0, torsoY, 0);
    const torsoScaleX = chestRatio * (isWomen ? 0.94 : 1.04) * (shoulderRatio * 0.4 + 0.6);
    const torsoScaleZ = chestRatio * (isWomen ? 1.12 : 1.0);
    torsoGroup.scale.set(torsoScaleX, heightRatio, torsoScaleZ);
  }

  // 3. Arms (Seamless shoulder placement)
  const shoulderSpacing = 0.205 * shoulderRatio * (isWomen ? 0.92 : 1.05);
  const armY = chestY + 0.05 * heightRatio;

  const leftArm = skeleton.getObjectByName("LeftArmGroup");
  if (leftArm) {
    leftArm.position.set(shoulderSpacing, armY, 0);
    leftArm.rotation.z = -0.06; // Elegant subtle fashion pose
    leftArm.scale.set(chestRatio * 0.96, heightRatio, chestRatio * 0.96);
  }

  const rightArm = skeleton.getObjectByName("RightArmGroup");
  if (rightArm) {
    rightArm.position.set(-shoulderSpacing, armY, 0);
    rightArm.rotation.z = 0.06;
    rightArm.scale.set(chestRatio * 0.96, heightRatio, chestRatio * 0.96);
  }

  // 4. Legs (Seamless pelvic connection)
  const hipSpacing = 0.092 * hipRatio * (isWomen ? 1.08 : 0.98);

  const leftLeg = skeleton.getObjectByName("LeftLegGroup");
  if (leftLeg) {
    leftLeg.position.set(hipSpacing, pelvisY, 0);
    leftLeg.scale.set(hipRatio * 0.96, legLength / 0.96, hipRatio * 0.96);
  }

  const rightLeg = skeleton.getObjectByName("RightLegGroup");
  if (rightLeg) {
    rightLeg.position.set(-hipSpacing, pelvisY, 0);
    rightLeg.scale.set(hipRatio * 0.96, legLength / 0.96, hipRatio * 0.96);
  }
}
