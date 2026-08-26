/**
 * SEEMZ Changing Room — Live Fit & Silhouette Analysis Engine
 * Calculates precision ease deltas, silhouette classification, and fit tension feedback.
 */

const SIZE_BASE_CHEST = { XS: 88, S: 94, M: 100, L: 106, XL: 114, XXL: 122 };
const SIZE_BASE_WAIST = { XS: 72, S: 78, M: 84, L: 90, XL: 98, XXL: 106 };
const SIZE_BASE_HIP = { XS: 88, S: 94, M: 100, L: 106, XL: 114, XXL: 122 };

const NUMERIC_WAIST = {
  28: 71,
  30: 76,
  32: 81,
  34: 86,
  36: 91,
  38: 96,
};

const STYLE_EASE_OFFSET = {
  slim: { chest: 4, waist: 4, hip: 3, shoulder: 0.5 },
  regular: { chest: 8, waist: 8, hip: 6, shoulder: 2.0 },
  relaxed: { chest: 14, waist: 14, hip: 12, shoulder: 4.5 },
  oversized: { chest: 22, waist: 22, hip: 18, shoulder: 8.0 },
  baggy: { chest: 18, waist: 16, hip: 24, shoulder: 6.0 },
  cropped: { chest: 10, waist: 10, hip: 6, shoulder: 3.0 },
};

/**
 * Calculates complete fit metrics based on body measurements and garment configuration
 */
export function analyzeFit(bodyParams, garmentConfig) {
  const isWomen = bodyParams.category === "women";
  const userChest = bodyParams.chest || (isWomen ? 88 : 100);
  const userWaist = bodyParams.waist || (isWomen ? 68 : 82);
  const userHip = bodyParams.hip || (isWomen ? 94 : 98);
  const userShoulder = bodyParams.shoulderWidth || (isWomen ? 39 : 46);

  const styleEase = STYLE_EASE_OFFSET[garmentConfig.style] || STYLE_EASE_OFFSET.regular;

  // Base garment dimensions before style modification
  const isNumeric = NUMERIC_WAIST[garmentConfig.size] !== undefined;
  const baseWaist = isNumeric
    ? NUMERIC_WAIST[garmentConfig.size]
    : SIZE_BASE_WAIST[garmentConfig.size] || 84;
  const baseChest = SIZE_BASE_CHEST[garmentConfig.size] || 100;
  const baseHip = SIZE_BASE_HIP[garmentConfig.size] || 100;

  // Actual garment ease relative to body
  const garmentChest = baseChest + styleEase.chest;
  const garmentWaist = baseWaist + styleEase.waist;
  const garmentHip = baseHip + styleEase.hip;

  const chestEaseDelta = garmentChest - userChest;
  const waistEaseDelta = garmentWaist - userWaist;
  const hipEaseDelta = garmentHip - userHip;
  const shoulderDropDelta = styleEase.shoulder;

  // Categorize ease qualitative descriptors
  const getDescriptor = (delta) => {
    if (delta < -2) return { status: "Tight / Compression", color: "#e05252" };
    if (delta <= 3) return { status: "Fitted / Tailored", color: "#d1a85b" };
    if (delta <= 9) return { status: "Standard / Clean Ease", color: "#ffffff" };
    if (delta <= 16) return { status: "Relaxed Atelier Ease", color: "#7fc99f" };
    return { status: "Oversized / Dropped Volume", color: "#66aaff" };
  };

  const chestDesc = getDescriptor(chestEaseDelta);
  const waistDesc = getDescriptor(waistEaseDelta);
  const hipDesc = getDescriptor(hipEaseDelta);

  // Overall Silhouette Classification
  let overallSilhouette = "Classic Atelier";
  if (garmentConfig.style === "oversized") {
    overallSilhouette = "Voluminous Oversized Silhouette";
  } else if (garmentConfig.style === "baggy") {
    overallSilhouette = "Relaxed Baggy Profile";
  } else if (garmentConfig.style === "relaxed") {
    overallSilhouette = "Casual Relaxed Drape";
  } else if (garmentConfig.style === "slim") {
    overallSilhouette = "Sharp Structured Contour";
  } else if (garmentConfig.style === "cropped") {
    overallSilhouette = "Modern Boxy Cropped";
  }

  // Length estimation
  let lengthDesc = "Standard Hip Length";
  if (garmentConfig.category === "jeans" || garmentConfig.category === "trousers") {
    lengthDesc = garmentConfig.style === "baggy"
      ? "Full Break (Stacked at Ankle)"
      : "Clean Ankle Break";
  } else if (garmentConfig.style === "cropped") {
    lengthDesc = "High-Waist Cropped";
  } else if (garmentConfig.style === "oversized") {
    lengthDesc = "Extended Low-Hip Drape";
  }

  return {
    silhouette: overallSilhouette,
    metrics: {
      chest: {
        label: isWomen ? "Bust Ease" : "Chest Ease",
        deltaCm: Math.round(chestEaseDelta),
        status: chestDesc.status,
        color: chestDesc.color,
      },
      shoulder: {
        label: "Shoulder Seam",
        deltaCm: Math.round(shoulderDropDelta),
        status: shoulderDropDelta > 5 ? "Dropped Seam" : "Natural Shoulder",
        color: "#ffffff",
      },
      waist: {
        label: "Waist Ease",
        deltaCm: Math.round(waistEaseDelta),
        status: waistDesc.status,
        color: waistDesc.color,
      },
      hip: {
        label: "Hip / Thigh Ease",
        deltaCm: Math.round(hipEaseDelta),
        status: hipDesc.status,
        color: hipDesc.color,
      },
      length: {
        label: "Drape Length",
        status: lengthDesc,
        color: "#d0d4db",
      },
    },
    fitScore: Math.min(100, Math.max(70, Math.round(100 - Math.abs(chestEaseDelta - 10) * 1.5))),
  };
}
