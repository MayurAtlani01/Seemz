/**
 * SEEMZ Changing Room — Avatar Parameter Engine
 * Clean parameter-based control layer with complete separation of MAN and WOMAN morphologies.
 */

export const DEFAULT_AVATAR_PARAMS = {
  category: "men",  // 'men' or 'women'
  height: 50,       // 0 to 100
  weight: 50,       // 0 to 100
  muscle: 50,       // 0 to 100
  proportions: 50,  // 0 to 100
};

export const AVATAR_PRESETS = {
  men: [
    {
      id: "classic_men",
      name: "Classic Tailored",
      params: { category: "men", height: 50, weight: 50, muscle: 50, proportions: 50 },
    },
    {
      id: "athletic_men",
      name: "Athletic Broad",
      params: { category: "men", height: 75, weight: 45, muscle: 85, proportions: 60 },
    },
    {
      id: "slim_men",
      name: "Slim Minimalist",
      params: { category: "men", height: 60, weight: 25, muscle: 30, proportions: 40 },
    },
    {
      id: "curated_men",
      name: "Curated Relaxed",
      params: { category: "men", height: 50, weight: 70, muscle: 55, proportions: 50 },
    },
  ],
  women: [
    {
      id: "classic_women",
      name: "Classic Atelier",
      params: { category: "women", height: 50, weight: 50, muscle: 50, proportions: 50 },
    },
    {
      id: "athletic_women",
      name: "Athletic Form",
      params: { category: "women", height: 70, weight: 45, muscle: 75, proportions: 55 },
    },
    {
      id: "slender_women",
      name: "Slender Linear",
      params: { category: "women", height: 65, weight: 20, muscle: 20, proportions: 40 },
    },
    {
      id: "volumetric_women",
      name: "Curated Volume",
      params: { category: "women", height: 50, weight: 75, muscle: 40, proportions: 65 },
    },
  ],
};

/**
 * Computes separated morphTargetInfluences mapping for MAN and WOMAN.
 * Zeroes out cross-gender shape keys completely to prevent distortion.
 * @param {Object} params - { category: 'men'|'women', height, weight, muscle, proportions }
 * @returns {Object} Key-value map of morph target technical names to influence values
 */
export function computeMorphInfluences(params = DEFAULT_AVATAR_PARAMS) {
  const isMan = (params.category || params.gender || "men") === "men";

  const heightNorm = Math.max(0, Math.min(100, params.height ?? 50)) / 100;
  const weightNorm = Math.max(0, Math.min(100, params.weight ?? 50)) / 100;
  const muscleNorm = Math.max(0, Math.min(100, params.muscle ?? 50)) / 100;
  const propNorm = Math.max(0, Math.min(100, params.proportions ?? 50)) / 100;

  const influences = {};

  if (isMan) {
    // === PURE MAN / MALE MORPHOLOGY ===
    // 1. Male Demographics (1/3 equal blend = pure balanced neutral male)
    influences["$md-$as-$ma-$yn"] = 0.333;
    influences["$md-$ca-$ma-$yn"] = 0.333;
    influences["$md-$af-$ma-$yn"] = 0.333;

    // 2. Zero out all female morph targets completely
    influences["$md-$as-$fe-$yn"] = 0.0;
    influences["$md-$ca-$fe-$yn"] = 0.0;
    influences["$md-$af-$fe-$yn"] = 0.0;
    influences["$md-$fe-$yn-$av$mu-max$wg-maxcup-$av$fi"] = 0.0;
    influences["$md-$fe-$yn-$av$mu-max$wg-$avcup-max$fi"] = 0.0;
    influences["$md-$fe-$yn-$av$mu-max$wg-max$hg"] = 0.0;
    influences["$md-universal-$fe-$yn-$av$mu-max$wg"] = 0.0;

    // 3. Male specific scaling
    influences["$md-$ma-$yn-$av$mu-max$wg-max$hg"] = heightNorm * 0.50;
    influences["$md-universal-$ma-$yn-$av$mu-max$wg"] = (weightNorm * 0.45) + (muscleNorm * 0.50);
  } else {
    // === PURE WOMAN / FEMALE MORPHOLOGY ===
    // 1. Female Demographics (1/3 equal blend = pure balanced neutral female)
    influences["$md-$as-$fe-$yn"] = 0.333;
    influences["$md-$ca-$fe-$yn"] = 0.333;
    influences["$md-$af-$fe-$yn"] = 0.333;

    // 2. Zero out all male morph targets completely
    influences["$md-$as-$ma-$yn"] = 0.0;
    influences["$md-$ca-$ma-$yn"] = 0.0;
    influences["$md-$af-$ma-$yn"] = 0.0;
    influences["$md-$ma-$yn-$av$mu-max$wg-max$hg"] = 0.0;
    influences["$md-universal-$ma-$yn-$av$mu-max$wg"] = 0.0;

    // 3. Female specific scaling & contours
    influences["$md-$fe-$yn-$av$mu-max$wg-max$hg"] = heightNorm * 0.50;
    influences["$md-universal-$fe-$yn-$av$mu-max$wg"] = (weightNorm * 0.75) + (muscleNorm * 0.20);
    influences["$md-$fe-$yn-$av$mu-max$wg-maxcup-$av$fi"] = propNorm * 0.60;
    influences["$md-$fe-$yn-$av$mu-max$wg-$avcup-max$fi"] = propNorm * 0.40;
  }

  return influences;
}

/**
 * Directly applies high-level body parameters to a Three.js Mesh with morph targets
 * @param {THREE.Mesh} mesh - The avatar mesh
 * @param {Object} params - High-level body parameters
 */
export function applyAvatarParamsToMesh(mesh, params) {
  if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

  const influences = computeMorphInfluences(params);
  Object.entries(influences).forEach(([name, val]) => {
    const idx = mesh.morphTargetDictionary[name];
    if (idx !== undefined) {
      mesh.morphTargetInfluences[idx] = val;
    }
  });
}
