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

  const heightVal = Math.max(0, Math.min(100, params.height ?? 50));
  const weightVal = Math.max(0, Math.min(100, params.weight ?? 50));
  const muscleVal = Math.max(0, Math.min(100, params.muscle ?? 50));
  const propVal = Math.max(0, Math.min(100, params.proportions ?? 50));

  // Map 0-100 to -1.0 to 1.0 (with 50 mapping to 0.0 baseline)
  const weightNorm = (weightVal - 50) / 50;
  const muscleNorm = (muscleVal - 50) / 50;
  const propNorm = (propVal - 50) / 50;

  const influences = {};

  // === 1. UNISEX STRUCTURAL MORPHS (TORSO, SHOULDERS, WAIST, HIPS) ===
  if (propNorm > 0) {
    // Broaden and expand the torso & skeletal structure
    influences["torso_width_incr"] = propNorm * 0.70;
    influences["torso_width_decr"] = 0.0;
    influences["torso_length_incr"] = propNorm * 0.40;
    influences["torso_length_decr"] = 0.0;
    influences["shoulder_width_incr"] = propNorm * 0.60;
    influences["shoulder_width_decr"] = 0.0;
    influences["waist_width_incr"] = propNorm * 0.50;
    influences["waist_width_decr"] = 0.0;
    influences["hips_width_incr"] = propNorm * 0.50;
    influences["hips_width_decr"] = 0.0;
    influences["hip_scale_horiz_incr"] = propNorm * 0.50;
    influences["hip_scale_horiz_decr"] = 0.0;
  } else {
    // Narrow and slim down the torso & skeletal structure
    influences["torso_width_incr"] = 0.0;
    influences["torso_width_decr"] = -propNorm * 0.70;
    influences["torso_length_incr"] = 0.0;
    influences["torso_length_decr"] = -propNorm * 0.40;
    influences["shoulder_width_incr"] = 0.0;
    influences["shoulder_width_decr"] = -propNorm * 0.60;
    influences["waist_width_incr"] = 0.0;
    influences["waist_width_decr"] = -propNorm * 0.50;
    influences["hips_width_incr"] = 0.0;
    influences["hips_width_decr"] = -propNorm * 0.50;
    influences["hip_scale_horiz_incr"] = 0.0;
    influences["hip_scale_horiz_decr"] = -propNorm * 0.50;
  }

  // === 2. GENDER SPECIFIC MORPHOLOGY & TARGETS ===
  if (isMan) {
    // === MALE BASICS & DEMOGRAPHICS ===
    influences["$md-$as-$ma-$yn"] = 0.333;
    influences["$md-$ca-$ma-$yn"] = 0.333;
    influences["$md-$af-$ma-$yn"] = 0.333;
    influences["$md-$ma-$yn-$av$mu-max$wg-max$hg"] = (heightVal / 100) * 0.65;

    // Male Weight
    if (weightNorm > 0) {
      influences["male_weight_max"] = weightNorm * 0.90;
      influences["male_weight_min"] = 0.0;
    } else {
      influences["male_weight_max"] = 0.0;
      influences["male_weight_min"] = -weightNorm * 0.90;
    }

    // Male Muscle
    if (muscleNorm > 0) {
      influences["male_muscle_max"] = muscleNorm * 0.90;
      influences["male_muscle_min"] = 0.0;
    } else {
      influences["male_muscle_max"] = 0.0;
      influences["male_muscle_min"] = -muscleNorm * 0.90;
    }

    // Zero out all female targets
    influences["$md-$as-$fe-$yn"] = 0.0;
    influences["$md-$ca-$fe-$yn"] = 0.0;
    influences["$md-$af-$fe-$yn"] = 0.0;
    influences["$md-$fe-$yn-$av$mu-max$wg-maxcup-$av$fi"] = 0.0;
    influences["$md-$fe-$yn-$av$mu-max$wg-$avcup-max$fi"] = 0.0;
    influences["$md-$fe-$yn-$av$mu-max$wg-max$hg"] = 0.0;
    influences["female_weight_max"] = 0.0;
    influences["female_weight_min"] = 0.0;
    influences["female_muscle_max"] = 0.0;
    influences["female_muscle_min"] = 0.0;

    // Backward compatibility for old keys (set to safe defaults)
    influences["$md-universal-$ma-$yn-$av$mu-max$wg"] = 0.0;
    influences["$md-universal-$fe-$yn-$av$mu-max$wg"] = 0.0;
  } else {
    // === FEMALE BASICS & DEMOGRAPHICS ===
    influences["$md-$as-$fe-$yn"] = 0.333;
    influences["$md-$ca-$fe-$yn"] = 0.333;
    influences["$md-$af-$fe-$yn"] = 0.333;
    influences["$md-$fe-$yn-$av$mu-max$wg-max$hg"] = (heightVal / 100) * 0.65;

    // Female Breast/Contour (linear mapping using original proportion key)
    const rawProp = propVal / 100;
    influences["$md-$fe-$yn-$av$mu-max$wg-maxcup-$av$fi"] = rawProp * 0.60;
    influences["$md-$fe-$yn-$av$mu-max$wg-$avcup-max$fi"] = rawProp * 0.40;

    // Female Weight
    if (weightNorm > 0) {
      influences["female_weight_max"] = weightNorm * 0.90;
      influences["female_weight_min"] = 0.0;
    } else {
      influences["female_weight_max"] = 0.0;
      influences["female_weight_min"] = -weightNorm * 0.90;
    }

    // Female Muscle
    if (muscleNorm > 0) {
      influences["female_muscle_max"] = muscleNorm * 0.90;
      influences["female_muscle_min"] = 0.0;
    } else {
      influences["female_muscle_max"] = 0.0;
      influences["female_muscle_min"] = -muscleNorm * 0.90;
    }

    // Zero out all male targets
    influences["$md-$as-$ma-$yn"] = 0.0;
    influences["$md-$ca-$ma-$yn"] = 0.0;
    influences["$md-$af-$ma-$yn"] = 0.0;
    influences["$md-$ma-$yn-$av$mu-max$wg-max$hg"] = 0.0;
    influences["male_weight_max"] = 0.0;
    influences["male_weight_min"] = 0.0;
    influences["male_muscle_max"] = 0.0;
    influences["male_muscle_min"] = 0.0;

    // Backward compatibility for old keys (set to safe defaults)
    influences["$md-universal-$ma-$yn-$av$mu-max$wg"] = 0.0;
    influences["$md-universal-$fe-$yn-$av$mu-max$wg"] = 0.0;
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
