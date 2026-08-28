import * as THREE from "three";
import { createGarmentMaterial } from "./materialEngine";

/**
 * SEEMZ Changing Room — Procedural 3D Garment Generator
 * Generates procedural garment geometries (T-Shirt, Jeans, Shirt, Hoodie, Trousers, Jacket)
 * that wrap smoothly around the continuous porcelain fashion mannequin.
 */

export const GARMENT_CATEGORIES = [
  { id: "none", name: "Bare Avatar", icon: "Eye", type: "none" },
  { id: "tshirt", name: "T-Shirt", icon: "Shirt", type: "top" },
  { id: "jeans", name: "Jeans", icon: "Layers", type: "bottom" },
  { id: "shirt", name: "Tailored Shirt", icon: "Shirt", type: "top" },
  { id: "hoodie", name: "Boxy Hoodie", icon: "Box", type: "top" },
  { id: "trousers", name: "Pleated Trousers", icon: "Layers", type: "bottom" },
  { id: "jacket", name: "Atelier Jacket", icon: "Feather", type: "outerwear" },
];

export const GARMENT_STYLES = {
  top: [
    { id: "slim", name: "Slim Tailored", desc: "Closer fit, narrow sleeves, structured shoulder" },
    { id: "regular", name: "Classic Regular", desc: "Standard baseline atelier drape" },
    { id: "relaxed", name: "Relaxed Fit", desc: "Comfort ease across chest and sleeves" },
    { id: "oversized", name: "Oversized Silhouette", desc: "Dropped shoulders, generous boxy body" },
    { id: "cropped", name: "Boxy Cropped", desc: "Shortened hemline with wide proportions" },
  ],
  bottom: [
    { id: "slim", name: "Slim Fit", desc: "Tapered leg, clean silhouette" },
    { id: "regular", name: "Classic Straight", desc: "Standard straight cut from hip to hem" },
    { id: "relaxed", name: "Relaxed Straight", desc: "Extra room in thigh and seat" },
    { id: "baggy", name: "Wide-Leg Baggy", desc: "Voluminous wide drape with ankle stacking" },
    { id: "oversized", name: "Oversized Drop", desc: "Ultra-relaxed loose leg and deep rise" },
  ],
  outerwear: [
    { id: "slim", name: "Fitted Structured", desc: "Sharp silhouette, defined waist" },
    { id: "regular", name: "Classic Tailored", desc: "Standard atelier fit" },
    { id: "oversized", name: "Oversized Cocoon", desc: "Architectural drop-shoulder volume" },
  ],
};

export const SIZES_ALPHA = ["XS", "S", "M", "L", "XL", "XXL"];
export const SIZES_NUMERIC = ["28", "30", "32", "34", "36", "38"];

const SIZE_SCALE_MAP = {
  XS: 0.92,
  S: 0.96,
  M: 1.0,
  L: 1.05,
  XL: 1.10,
  XXL: 1.16,
  28: 0.92,
  30: 0.96,
  32: 1.0,
  34: 1.05,
  36: 1.10,
  38: 1.16,
};

const STYLE_MODIFIER_MAP = {
  slim: { chestEase: 0.035, waistEase: 0.035, hipEase: 0.035, legWidth: 0.92, lengthMult: 0.96, dropShoulder: 0.0 },
  regular: { chestEase: 0.075, waistEase: 0.075, hipEase: 0.07, legWidth: 1.02, lengthMult: 1.0, dropShoulder: 0.02 },
  relaxed: { chestEase: 0.135, waistEase: 0.135, hipEase: 0.12, legWidth: 1.20, lengthMult: 1.04, dropShoulder: 0.045 },
  oversized: { chestEase: 0.22, waistEase: 0.22, hipEase: 0.20, legWidth: 1.38, lengthMult: 1.12, dropShoulder: 0.08 },
  baggy: { chestEase: 0.18, waistEase: 0.16, hipEase: 0.22, legWidth: 1.58, lengthMult: 1.12, dropShoulder: 0.06 },
  cropped: { chestEase: 0.10, waistEase: 0.09, hipEase: 0.08, legWidth: 1.0, lengthMult: 0.72, dropShoulder: 0.03 },
};

/**
 * Main function to generate a procedural 3D garment mesh group
 */
export function createGarmentModel(garmentConfig, bodyParams, isTensionMode = false) {
  const root = new THREE.Group();
  root.name = "GarmentRoot";

  if (!garmentConfig || garmentConfig.category === "none" || !garmentConfig.category) {
    return root; // Clean bare avatar - no clothing
  }

  const { category = "tshirt", material = "cotton", color = "#F5F5F5", style = "oversized", size = "L" } = garmentConfig;
  const mat = createGarmentMaterial(material, color, isTensionMode);

  switch (category) {
    case "tshirt":
      buildTShirt(root, mat, garmentConfig, bodyParams);
      break;
    case "jeans":
      buildJeans(root, mat, garmentConfig, bodyParams, true);
      break;
    case "shirt":
      buildShirt(root, mat, garmentConfig, bodyParams);
      break;
    case "hoodie":
      buildHoodie(root, mat, garmentConfig, bodyParams);
      break;
    case "trousers":
      buildJeans(root, mat, garmentConfig, bodyParams, false);
      break;
    case "jacket":
      buildJacket(root, mat, garmentConfig, bodyParams);
      break;
    default:
      break;
  }

  return root;
}

/**
 * 1. T-SHIRT GENERATOR
 */
function buildTShirt(group, material, config, body) {
  const isWomen = body.category === "women";
  const heightRatio = (body.height || (isWomen ? 170 : 180)) / 180;
  const chestRatio = (body.chest || (isWomen ? 86 : 98)) / (isWomen ? 86 : 98);
  const waistRatio = (body.waist || (isWomen ? 66 : 80)) / (isWomen ? 66 : 80);
  const shoulderRatio = (body.shoulderWidth || (isWomen ? 38 : 45)) / (isWomen ? 38 : 45);
  const inseamRatio = (body.inseam || (isWomen ? 78 : 82)) / (isWomen ? 78 : 82);

  const sizeScale = SIZE_SCALE_MAP[config.size] || 1.0;
  const styleMod = STYLE_MODIFIER_MAP[config.style] || STYLE_MODIFIER_MAP.regular;

  const legLength = 0.96 * heightRatio * inseamRatio;
  const pelvisY = legLength;
  const torsoY = pelvisY + 0.22 * heightRatio;
  const chestY = torsoY + 0.18 * heightRatio;

  // Compute calculated dimensions
  const torsoWidth = (0.245 * chestRatio * shoulderRatio + styleMod.chestEase) * sizeScale;
  const torsoDepth = (0.165 * chestRatio + styleMod.chestEase * 0.7) * sizeScale;
  const torsoHeight = 0.56 * heightRatio * styleMod.lengthMult * (sizeScale * 0.92 + 0.08);

  const tShirtY = chestY - torsoHeight * 0.36;

  // Torso Mesh
  const torsoGeo = new THREE.CylinderGeometry(
    torsoWidth * 0.98,
    torsoWidth * (waistRatio > 1.05 ? 1.03 : 1.0),
    torsoHeight,
    32,
    8
  );
  torsoGeo.scale(1.0, 1.0, torsoDepth / torsoWidth);

  // Subtle fabric ripple displacements
  const pos = torsoGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const ripple = Math.sin(y * 14.0) * 0.003 + Math.cos(pos.getX(i) * 10.0) * 0.002;
    pos.setZ(i, pos.getZ(i) + ripple);
  }
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, material);
  torsoMesh.position.set(0, tShirtY, 0.005);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // Ribbed Crewneck Collar
  const collarRadius = 0.088 * (sizeScale * 0.3 + 0.7);
  const collarGeo = new THREE.TorusGeometry(collarRadius, 0.012, 16, 32);
  collarGeo.scale(1.1, 0.9, 1.0);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, material);
  collarMesh.position.set(0, tShirtY + torsoHeight * 0.5, 0.01);
  group.add(collarMesh);

  // Left & Right Sleeves
  const sleeveLength = 0.22 * heightRatio * styleMod.lengthMult * (sizeScale * 0.8 + 0.2);
  const sleeveRadius = (0.076 + styleMod.chestEase * 0.4) * sizeScale;
  const shoulderDrop = (0.22 * shoulderRatio + styleMod.dropShoulder) * sizeScale;
  const armY = tShirtY + torsoHeight * 0.38;

  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(sleeveRadius * 0.98, sleeveRadius * 0.92, sleeveLength, 24);
    const sleeveMesh = new THREE.Mesh(sleeveGeo, material);
    sleeveMesh.position.set(side * (shoulderDrop + sleeveLength * 0.35), armY - sleeveLength * 0.3, 0);
    sleeveMesh.rotation.z = side * -0.55;
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });
}

/**
 * 2. JEANS & TROUSERS GENERATOR
 */
function buildJeans(group, material, config, body, isDenimStyle = true) {
  const isWomen = body.category === "women";
  const heightRatio = (body.height || (isWomen ? 170 : 180)) / 180;
  const waistRatio = (body.waist || (isWomen ? 66 : 80)) / (isWomen ? 66 : 80);
  const hipRatio = (body.hip || (isWomen ? 92 : 96)) / (isWomen ? 92 : 96);
  const inseamRatio = (body.inseam || (isWomen ? 78 : 82)) / (isWomen ? 78 : 82);

  const sizeScale = SIZE_SCALE_MAP[config.size] || 1.0;
  const styleMod = STYLE_MODIFIER_MAP[config.style] || STYLE_MODIFIER_MAP.regular;

  const legLength = 0.96 * heightRatio * inseamRatio;
  const waistY = legLength + 0.18 * heightRatio;
  const crotchY = legLength - 0.06 * heightRatio;

  // Waistband
  const wbWidth = (0.19 * waistRatio + styleMod.waistEase) * sizeScale * (isWomen ? 0.95 : 1.0);
  const wbDepth = (0.135 * waistRatio + styleMod.waistEase * 0.7) * sizeScale;
  const wbGeo = new THREE.CylinderGeometry(wbWidth, wbWidth * 1.04, 0.055, 32);
  wbGeo.scale(1.0, 1.0, wbDepth / wbWidth);
  const wbMesh = new THREE.Mesh(wbGeo, material);
  wbMesh.position.set(0, waistY, 0);
  wbMesh.castShadow = true;
  group.add(wbMesh);

  // Pelvis / Seat Block
  const seatWidth = (0.21 * hipRatio + styleMod.hipEase) * sizeScale * (isWomen ? 1.12 : 1.0);
  const seatDepth = (0.155 * hipRatio + styleMod.hipEase * 0.8) * sizeScale;
  const seatHeight = waistY - crotchY;
  const seatGeo = new THREE.CylinderGeometry(wbWidth * 1.04, seatWidth, seatHeight, 32);
  seatGeo.scale(1.0, 1.0, seatDepth / seatWidth);
  const seatMesh = new THREE.Mesh(seatGeo, material);
  seatMesh.position.set(0, crotchY + seatHeight * 0.5, 0);
  seatMesh.castShadow = true;
  group.add(seatMesh);

  // Left & Right Pant Legs
  const legSpacing = (0.098 * hipRatio + styleMod.hipEase * 0.3) * sizeScale;
  const thighRadius = (0.092 + styleMod.hipEase * 0.6) * styleMod.legWidth * sizeScale;
  const hemRadius = isDenimStyle
    ? (0.082 * styleMod.legWidth + (config.style === "baggy" ? 0.06 : 0.01)) * sizeScale
    : (0.074 * styleMod.legWidth + (config.style === "baggy" ? 0.05 : 0.0)) * sizeScale;

  const legMeshHeight = crotchY + 0.04;

  [-1, 1].forEach((side) => {
    const legGeo = new THREE.CylinderGeometry(thighRadius, hemRadius, legMeshHeight, 32, 12);

    // Add knee crease folds and ankle hem breaks
    const pos = legGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > -0.15 && y < 0.1) {
        const fold = Math.sin(y * 30.0) * 0.005 * (config.style === "baggy" ? 1.8 : 1.0);
        pos.setZ(i, pos.getZ(i) + fold);
      }
      if (y < -legMeshHeight * 0.38) {
        const breakFactor = Math.sin(y * 40.0) * 0.007 * (config.style === "baggy" ? 2.2 : 1.0);
        pos.setX(i, pos.getX(i) + breakFactor * 0.5);
        pos.setZ(i, pos.getZ(i) + breakFactor);
      }
    }
    legGeo.computeVertexNormals();

    const legMesh = new THREE.Mesh(legGeo, material);
    legMesh.position.set(side * legSpacing, legMeshHeight * 0.5 - 0.02, 0.01);
    legMesh.castShadow = true;
    group.add(legMesh);
  });
}

/**
 * 3. TAILORED SHIRT GENERATOR
 */
function buildShirt(group, material, config, body) {
  buildTShirt(group, material, config, body);

  const isWomen = body.category === "women";
  const heightRatio = (body.height || (isWomen ? 170 : 180)) / 180;
  const inseamRatio = (body.inseam || (isWomen ? 78 : 82)) / (isWomen ? 78 : 82);
  const legLength = 0.96 * heightRatio * inseamRatio;
  const torsoY = legLength + 0.22 * heightRatio;
  const chestY = torsoY + 0.18 * heightRatio;
  const sizeScale = SIZE_SCALE_MAP[config.size] || 1.0;

  // Tailored Collar
  const collarGeo = new THREE.CylinderGeometry(0.088 * sizeScale, 0.102 * sizeScale, 0.05, 24, 1, true, 0, Math.PI * 1.8);
  collarGeo.rotateY(Math.PI * 0.6);
  const collarMesh = new THREE.Mesh(collarGeo, material);
  collarMesh.position.set(0, chestY + 0.18 * heightRatio, 0.01);
  group.add(collarMesh);

  // Front Placket Bar
  const placketGeo = new THREE.BoxGeometry(0.024, 0.50 * heightRatio, 0.008);
  const placketMesh = new THREE.Mesh(placketGeo, material);
  placketMesh.position.set(0, chestY - 0.04 * heightRatio, 0.16 * sizeScale);
  group.add(placketMesh);
}

/**
 * 4. BOXY HOODIE GENERATOR
 */
function buildHoodie(group, material, config, body) {
  const hoodieConfig = { ...config, style: config.style === "slim" ? "regular" : "oversized" };
  buildTShirt(group, material, hoodieConfig, body);

  const isWomen = body.category === "women";
  const heightRatio = (body.height || (isWomen ? 170 : 180)) / 180;
  const inseamRatio = (body.inseam || (isWomen ? 78 : 82)) / (isWomen ? 78 : 82);
  const legLength = 0.96 * heightRatio * inseamRatio;
  const torsoY = legLength + 0.22 * heightRatio;
  const chestY = torsoY + 0.18 * heightRatio;
  const sizeScale = SIZE_SCALE_MAP[config.size] || 1.0;

  // 3D Hood draped around the neck
  const hoodGeo = new THREE.SphereGeometry(0.135 * sizeScale, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.65);
  hoodGeo.scale(0.9, 1.1, 0.95);
  const hoodMesh = new THREE.Mesh(hoodGeo, material);
  hoodMesh.position.set(0, chestY + 0.15 * heightRatio, -0.06);
  hoodMesh.rotation.x = 0.4;
  hoodMesh.castShadow = true;
  group.add(hoodMesh);

  // Kangaroo Front Pocket
  const pocketGeo = new THREE.BoxGeometry(0.23 * sizeScale, 0.15 * sizeScale, 0.02);
  const pocketMesh = new THREE.Mesh(pocketGeo, material);
  pocketMesh.position.set(0, chestY - 0.14 * heightRatio, 0.16 * sizeScale);
  pocketMesh.castShadow = true;
  group.add(pocketMesh);
}

/**
 * 5. ATELIER JACKET GENERATOR
 */
function buildJacket(group, material, config, body) {
  buildTShirt(group, material, config, body);

  const isWomen = body.category === "women";
  const heightRatio = (body.height || (isWomen ? 170 : 180)) / 180;
  const inseamRatio = (body.inseam || (isWomen ? 78 : 82)) / (isWomen ? 78 : 82);
  const legLength = 0.96 * heightRatio * inseamRatio;
  const torsoY = legLength + 0.22 * heightRatio;
  const chestY = torsoY + 0.18 * heightRatio;
  const sizeScale = SIZE_SCALE_MAP[config.size] || 1.0;

  // Structured Lapel Wings
  [-1, 1].forEach((side) => {
    const lapelGeo = new THREE.BoxGeometry(0.075 * sizeScale, 0.30 * heightRatio, 0.015);
    lapelGeo.rotateZ(side * 0.15);
    const lapelMesh = new THREE.Mesh(lapelGeo, material);
    lapelMesh.position.set(side * 0.09 * sizeScale, chestY + 0.04 * heightRatio, 0.165 * sizeScale);
    group.add(lapelMesh);
  });
}
