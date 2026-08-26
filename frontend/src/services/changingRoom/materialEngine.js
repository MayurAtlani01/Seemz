import * as THREE from "three";

/**
 * SEEMZ Changing Room — Material Physics & Shader Engine
 * Controls physical properties, procedural micro-textures, and surface shaders.
 */

export const MATERIALS = {
  cotton: {
    id: "cotton",
    name: "Pure Cotton",
    description: "Medium weight, breathable organic weave with a natural soft drape and matte finish.",
    weight: 0.5,
    stiffness: 0.35,
    stretch: 0.15,
    thickness: 0.3,
    drape: 0.7,
    wrinkleIntensity: 0.4,
    roughness: 0.85,
    metalness: 0.02,
    sheen: 0.1,
    sheenColor: "#ffffff",
    clearcoat: 0.0,
  },
  denim: {
    id: "denim",
    name: "Raw Selvedge Denim",
    description: "Heavyweight 14oz structured twill with rigid structural folds and authentic diagonal grain.",
    weight: 0.85,
    stiffness: 0.8,
    stretch: 0.05,
    thickness: 0.7,
    drape: 0.3,
    wrinkleIntensity: 0.65,
    roughness: 0.9,
    metalness: 0.05,
    sheen: 0.08,
    sheenColor: "#8899aa",
    clearcoat: 0.0,
  },
  linen: {
    id: "linen",
    name: "Atelier Flax Linen",
    description: "Lightweight, airy slub structure with crisp organic texture and relaxed natural creasing.",
    weight: 0.35,
    stiffness: 0.55,
    stretch: 0.05,
    thickness: 0.35,
    drape: 0.5,
    wrinkleIntensity: 0.85,
    roughness: 0.95,
    metalness: 0.0,
    sheen: 0.05,
    sheenColor: "#ffffff",
    clearcoat: 0.0,
  },
  silk: {
    id: "silk",
    name: "Heavy Mulberry Silk",
    description: "Ultra-luxurious fluid drape with high specular luster, satin reflectivity, and liquid motion.",
    weight: 0.2,
    stiffness: 0.1,
    stretch: 0.1,
    thickness: 0.15,
    drape: 0.95,
    wrinkleIntensity: 0.15,
    roughness: 0.22,
    metalness: 0.12,
    sheen: 0.85,
    sheenColor: "#ffffff",
    clearcoat: 0.3,
  },
  wool: {
    id: "wool",
    name: "Virgin Merino Wool",
    description: "Substantial thermal volume with a soft brushed texture, light diffusion, and gentle rounded edges.",
    weight: 0.75,
    stiffness: 0.5,
    stretch: 0.2,
    thickness: 0.8,
    drape: 0.6,
    wrinkleIntensity: 0.3,
    roughness: 0.95,
    metalness: 0.0,
    sheen: 0.25,
    sheenColor: "#cccccc",
    clearcoat: 0.0,
  },
  jersey: {
    id: "jersey",
    name: "Micro-Modal Jersey",
    description: "Elastic, body-contouring knit with high flexibility and soft fluid fall.",
    weight: 0.45,
    stiffness: 0.2,
    stretch: 0.5,
    thickness: 0.3,
    drape: 0.85,
    wrinkleIntensity: 0.25,
    roughness: 0.8,
    metalness: 0.04,
    sheen: 0.2,
    sheenColor: "#ffffff",
    clearcoat: 0.05,
  },
};

export const COLOR_PALETTE = [
  { id: "white", name: "Pure Chalk", hex: "#F5F5F5", darkText: true },
  { id: "black", name: "Obsidian Black", hex: "#121214", darkText: false },
  { id: "charcoal", name: "Washed Charcoal", hex: "#2A2A2E", darkText: false },
  { id: "indigo", name: "Raw Atelier Indigo", hex: "#1C2434", darkText: false },
  { id: "ecru", name: "Natural Ecru", hex: "#E3DFD5", darkText: true },
  { id: "sage", name: "Muted Sage", hex: "#5C665D", darkText: false },
  { id: "camel", name: "Warm Camel", hex: "#8A6D4B", darkText: false },
  { id: "silver", name: "Liquid Silver", hex: "#9E9EA6", darkText: true },
];

// Texture cache to prevent redundant canvas creations
const textureCache = new Map();

/**
 * Generate a procedural canvas texture tailored to the material type
 */
export function getProceduralTexture(materialId) {
  if (textureCache.has(materialId)) {
    return textureCache.get(materialId);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Base background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 512);

  if (materialId === "denim") {
    // 3x1 Twill Weave Pattern
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1.5;
    for (let i = -512; i < 1024; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 512, 512);
      ctx.stroke();
    }
    // Cross hatch subtle weft
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let j = 0; j < 512; j += 4) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(512, j);
      ctx.stroke();
    }
  } else if (materialId === "linen") {
    // Slub linen organic irregularities
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = 4 + Math.random() * 18;
      const h = 1.2 + Math.random() * 1.5;
      ctx.fillRect(x, y, w, h);
    }
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const w = 1.2 + Math.random() * 1.5;
      const h = 4 + Math.random() * 18;
      ctx.fillRect(x, y, w, h);
    }
  } else if (materialId === "silk") {
    // Ultra fine satin luster gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "rgba(255,255,255,0.06)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.04)");
    grad.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  } else if (materialId === "wool") {
    // Brushed fuzzy stipple
    ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 2.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (materialId === "jersey") {
    // Vertical fine knit ribs
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
    ctx.lineWidth = 1.2;
    for (let x = 0; x < 512; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
  } else {
    // Cotton fine plain weave
    ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);

  textureCache.set(materialId, texture);
  return texture;
}

/**
 * Creates a Three.js material configured for the selected garment material & color
 */
export function createGarmentMaterial(materialId = "cotton", colorHex = "#F5F5F5", isTensionMode = false) {
  const matConfig = MATERIALS[materialId] || MATERIALS.cotton;
  const texture = getProceduralTexture(materialId);

  if (isTensionMode) {
    // In Tension Heatmap mode, show a high-contrast analytical shader with vertex colors
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.4,
      metalness: 0.1,
      bumpMap: texture,
      bumpScale: 0.02,
      side: THREE.DoubleSide,
    });
  }

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: matConfig.roughness,
    metalness: matConfig.metalness,
    bumpMap: texture,
    bumpScale: matConfig.wrinkleIntensity * 0.03,
    side: THREE.DoubleSide,
  });

  return material;
}
