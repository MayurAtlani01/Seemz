/**
 * SEEMZ ATELIER — Biometric Body Measurement & Calibration Engine
 * 
 * Provides:
 * - One Euro Filter adaptive temporal landmark smoothing (jitter-free when still, responsive when moving)
 * - Strict full-body visibility & pose validation with real-time feedback guidance
 * - Kinematic chain segmental length estimation (3D Euclidean distance invariant to perspective foreshortening)
 * - Ramanujan ellipse circumference approximation (Chest, Waist, Hip)
 * - Interquartile Range (IQR) multi-frame statistical filtering
 * - Height-calibrated metric scaling
 * - Multi-factor scan quality & confidence scoring
 */

// Human anatomical ratio norms (Mean ± standard tolerance for adult populations)
export const RATIO_NORMS = {
  // Ratio of shoulder width to stature (~0.22 - 0.28)
  shoulderToHeight: { min: 0.20, max: 0.31, ideal: 0.25 },
  // Ratio of waist circumference to stature (~0.40 - 0.58)
  waistToHeight: { min: 0.36, max: 0.62, ideal: 0.46 },
  // Ratio of chest circumference to stature (~0.48 - 0.68)
  chestToHeight: { min: 0.45, max: 0.72, ideal: 0.56 },
  // Ratio of hip circumference to stature (~0.48 - 0.65)
  hipToHeight: { min: 0.45, max: 0.70, ideal: 0.55 },
  // Ratio of inseam to stature (~0.42 - 0.52)
  inseamToHeight: { min: 0.38, max: 0.54, ideal: 0.46 },
  // Ratio of torso to stature (~0.30 - 0.38)
  torsoToHeight: { min: 0.28, max: 0.42, ideal: 0.34 },
  // Ratio of arm to stature (~0.36 - 0.46)
  armToHeight: { min: 0.32, max: 0.48, ideal: 0.40 },
};

/**
 * 1 Euro Filter for adaptive real-time signal smoothing.
 * Filters low-speed noise aggressively while allowing fast motions with minimal lag.
 */
export class OneEuroFilter {
  constructor(freq = 30, minCutoff = 0.8, beta = 0.006, dCutoff = 1.0) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  alpha(cutoff, dt) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(val, timestamp = performance.now()) {
    if (this.xPrev === null) {
      this.xPrev = val;
      this.dxPrev = 0;
      this.tPrev = timestamp;
      return val;
    }

    const dt = Math.max(1e-4, (timestamp - this.tPrev) / 1000.0);
    this.tPrev = timestamp;

    // Estimate derivative
    const dx = (val - this.xPrev) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    const edx = this.dxPrev + aD * (dx - this.dxPrev);
    this.dxPrev = edx;

    // Adapt cutoff frequency according to speed
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this.alpha(cutoff, dt);
    const xFiltered = this.xPrev + a * (val - this.xPrev);
    this.xPrev = xFiltered;

    return xFiltered;
  }

  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

/**
 * Multi-joint pose landmark smoother managing independent OneEuroFilters for 33 joints.
 */
export class PoseLandmarkSmoother {
  constructor() {
    this.filters = [];
    for (let i = 0; i < 33; i++) {
      this.filters.push({
        x: new OneEuroFilter(30, 0.7, 0.005, 1.0),
        y: new OneEuroFilter(30, 0.7, 0.005, 1.0),
        z: new OneEuroFilter(30, 0.7, 0.005, 1.0),
      });
    }
    this.prevLandmarks = null;
  }

  smooth(landmarks, timestamp = performance.now()) {
    if (!landmarks || landmarks.length === 0) return landmarks;

    const smoothed = landmarks.map((lm, idx) => {
      const f = this.filters[idx] || this.filters[0];

      // Jitter & Outlier suppression on single-frame teleportation
      let x = lm.x;
      let y = lm.y;
      let z = lm.z || 0;

      if (this.prevLandmarks && this.prevLandmarks[idx]) {
        const prev = this.prevLandmarks[idx];
        const dist = Math.hypot(x - prev.x, y - prev.y);
        // If joint jumped more than 14% of the screen in 1 frame, blend heavily with prev
        if (dist > 0.14) {
          x = prev.x * 0.7 + x * 0.3;
          y = prev.y * 0.7 + y * 0.3;
        }
      }

      return {
        ...lm,
        x: f.x.filter(x, timestamp),
        y: f.y.filter(y, timestamp),
        z: f.z.filter(z, timestamp),
        visibility: lm.visibility !== undefined ? lm.visibility : 1.0,
      };
    });

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  reset() {
    this.filters.forEach((f) => {
      f.x.reset();
      f.y.reset();
      f.z.reset();
    });
    this.prevLandmarks = null;
  }
}

/**
 * 3D Euclidean distance between two landmarks.
 */
export function dist3D(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = (p1.x || 0) - (p2.x || 0);
  const dy = (p1.y || 0) - (p2.y || 0);
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 2D Euclidean distance between two landmarks in normalized coords.
 */
export function dist2D(p1, p2) {
  if (!p1 || !p2) return 0;
  return Math.hypot((p1.x || 0) - (p2.x || 0), (p1.y || 0) - (p2.y || 0));
}

/**
 * Ramanujan's Second Approximation for the perimeter of an ellipse.
 * @param {number} width - Lateral width in cm (major axis)
 * @param {number} depth - Sagittal depth in cm (minor axis)
 * @returns {number} Ellipse perimeter in cm
 */
export function calculateEllipseCircumference(width, depth) {
  if (width <= 0 || depth <= 0) return 0;
  const a = width / 2;
  const b = depth / 2;
  const term1 = 3 * (a + b);
  const term2 = Math.sqrt((3 * a + b) * (a + 3 * b));
  return Math.PI * (term1 - term2);
}

/**
 * Filter out statistical outliers using Interquartile Range (IQR).
 */
export function filterOutliersIQR(values) {
  if (!values || values.length < 4) return values || [];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const filtered = sorted.filter((v) => v >= lowerBound && v <= upperBound);
  return filtered.length >= 2 ? filtered : sorted;
}

/**
 * Compute median of a numerical array.
 */
export function getMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute trimmed average of an array after removing outliers.
 */
export function getRobustMean(arr) {
  if (!arr || arr.length === 0) return 0;
  const cleaned = filterOutliersIQR(arr);
  const sum = cleaned.reduce((acc, v) => acc + v, 0);
  return sum / cleaned.length;
}

/**
 * Validate full body visibility, framing boundaries, orientation, and pose posture.
 * Returns { isValid: boolean, guidance: string, fullBodyVisible: boolean, metrics: Object }
 */
export function validatePose(landmarks, step = "front_scan") {
  if (!landmarks || landmarks.length < 33) {
    return {
      isValid: false,
      guidance: "No pose detected. Please step into the camera frame.",
      fullBodyVisible: false,
    };
  }

  const nose = landmarks[0];
  const leftEye = landmarks[2];
  const rightEye = landmarks[5];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHeel = landmarks[29];
  const rightHeel = landmarks[30];
  const leftFoot = landmarks[31];
  const rightFoot = landmarks[32];

  const minVisibility = 0.35;
  const minFootVisibility = 0.25;

  // Key landmark visibility verification
  const headVisible = (nose?.visibility || 0) > minVisibility || (leftEye?.visibility || 0) > minVisibility || (rightEye?.visibility || 0) > minVisibility;
  const shouldersVisible = (leftShoulder?.visibility || 0) > minVisibility && (rightShoulder?.visibility || 0) > minVisibility;
  const hipsVisible = (leftHip?.visibility || 0) > minVisibility || (rightHip?.visibility || 0) > minVisibility;
  const kneesVisible = (leftKnee?.visibility || 0) > minFootVisibility || (rightKnee?.visibility || 0) > minFootVisibility;
  const feetVisible =
    (leftAnkle?.visibility || 0) > minFootVisibility ||
    (rightAnkle?.visibility || 0) > minFootVisibility ||
    (leftHeel?.visibility || 0) > minFootVisibility ||
    (rightHeel?.visibility || 0) > minFootVisibility ||
    (leftFoot?.visibility || 0) > minFootVisibility ||
    (rightFoot?.visibility || 0) > minFootVisibility;

  const fullBodyVisible = headVisible && shouldersVisible && hipsVisible && (kneesVisible || feetVisible);

  // Approximate top of skull / crown of head
  const eyeLevel = Math.min(leftEye?.y || nose.y, rightEye?.y || nose.y);
  const headHeight = Math.max(0.06, (nose.y - eyeLevel) * 2.6);
  const crownY = nose.y - headHeight;

  // Ground level at bottom of footwear
  const feetY = Math.max(
    leftFoot?.y || leftAnkle?.y || 0.9,
    rightFoot?.y || rightAnkle?.y || 0.9,
    leftHeel?.y || leftAnkle?.y || 0.9,
    rightHeel?.y || rightAnkle?.y || 0.9
  );

  const totalBodyHeightNorm = Math.max(0.2, feetY - crownY);
  const centerX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;

  // Framing checks
  if (!fullBodyVisible) {
    if (!headVisible) return { isValid: false, guidance: "Move down so your head is in view.", fullBodyVisible };
    if (!shouldersVisible) return { isValid: false, guidance: "Make sure your shoulders are in view.", fullBodyVisible };
    if (!feetVisible && !kneesVisible) return { isValid: false, guidance: "Step back until your legs and feet are in view.", fullBodyVisible };
    return { isValid: false, guidance: "Please stand so your full body is in the camera frame.", fullBodyVisible };
  }

  // Distance / Stature scaling within frame (relaxed for realistic camera setups)
  if (totalBodyHeightNorm < 0.28) {
    return { isValid: false, guidance: "Move slightly closer to the camera.", fullBodyVisible };
  }
  if (totalBodyHeightNorm > 0.99) {
    return { isValid: false, guidance: "Move slightly farther away.", fullBodyVisible };
  }

  // Horizontal centering
  if (centerX < 0.18) {
    return { isValid: false, guidance: "Move slightly to your right.", fullBodyVisible };
  }
  if (centerX > 0.82) {
    return { isValid: false, guidance: "Move slightly to your left.", fullBodyVisible };
  }

  // Pose checks by step
  if (step === "front_scan") {
    // Shoulder and hip tilt
    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
    const hipTilt = Math.abs(leftHip.y - rightHip.y);
    if (shoulderTilt > 0.12) {
      return { isValid: false, guidance: "Keep your shoulders level and stand straight.", fullBodyVisible };
    }
    if (hipTilt > 0.12) {
      return { isValid: false, guidance: "Stand balanced on both feet.", fullBodyVisible };
    }

    // Facing direction: check shoulder-width projection
    const shoulderBreadth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    if (shoulderBreadth < 0.08) {
      return { isValid: false, guidance: "Face the camera directly.", fullBodyVisible };
    }

    return {
      isValid: true,
      guidance: "Hold steady for scanning...",
      fullBodyVisible: true,
      metrics: {
        crownY,
        feetY,
        totalBodyHeightNorm,
        centerX,
      },
    };
  }

  if (step === "side_scan") {
    return {
      isValid: true,
      guidance: "Hold steady for scanning...",
      fullBodyVisible: true,
      metrics: {
        crownY,
        feetY,
        totalBodyHeightNorm,
        centerX,
      },
    };
  }

  return { isValid: true, guidance: "Position verified.", fullBodyVisible: true };
}

/**
 * Extract kinematic segment metrics from a single valid frame.
 */
export function extractFrameKinematics(landmarks, step = "front_scan") {
  const nose = landmarks[0];
  const leftEye = landmarks[2];
  const rightEye = landmarks[5];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftHeel = landmarks[29];
  const rightHeel = landmarks[30];
  const leftFoot = landmarks[31];
  const rightFoot = landmarks[32];

  // Head apex (crown)
  const eyeLevel = Math.min(leftEye?.y || nose.y, rightEye?.y || nose.y);
  const headHeight = Math.max(0.07, (nose.y - eyeLevel) * 2.8);
  const crownY = nose.y - headHeight;

  // Ground level (feet)
  const feetY = Math.max(
    leftFoot?.y || leftAnkle.y,
    rightFoot?.y || rightAnkle.y,
    leftHeel?.y || leftAnkle.y,
    rightHeel?.y || rightAnkle.y
  );

  const heightCoords = Math.max(0.4, feetY - crownY);

  if (step === "front_scan") {
    // Biacromial 3D shoulder width
    const biacromialCoords = dist3D(leftShoulder, rightShoulder);

    // Torso length (suprasternal notch to hip midpoint)
    const midShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
      z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2,
    };
    const midHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: ((leftHip.z || 0) + (rightHip.z || 0)) / 2,
    };
    const torsoLengthCoords = dist3D(midShoulder, midHip);

    // Kinematic arm length (shoulder -> elbow -> wrist)
    const leftArm = dist3D(leftShoulder, leftElbow) + dist3D(leftElbow, leftWrist);
    const rightArm = dist3D(rightShoulder, rightElbow) + dist3D(rightElbow, rightWrist);
    const armLengthCoords = (leftArm + rightArm) / 2;

    // Kinematic leg / inseam (crotch to ankle)
    const leftLeg = dist3D(leftHip, leftKnee) + dist3D(leftKnee, leftAnkle);
    const rightLeg = dist3D(rightHip, rightKnee) + dist3D(rightKnee, rightAnkle);
    const inseamCoords = (leftLeg + rightLeg) / 2 * 0.88;

    // Frontal body widths
    const frontChestWidthCoords = biacromialCoords * 0.88;
    const biIliacCoords = dist3D(leftHip, rightHip);
    const frontWaistWidthCoords = biIliacCoords * 0.88;
    const frontHipWidthCoords = biIliacCoords * 1.18;

    return {
      heightCoords,
      biacromialCoords,
      torsoLengthCoords,
      armLengthCoords,
      inseamCoords,
      frontChestWidthCoords,
      frontWaistWidthCoords,
      frontHipWidthCoords,
    };
  }

  if (step === "side_scan") {
    const shoulderS = (leftShoulder.visibility || 0) > (rightShoulder.visibility || 0) ? leftShoulder : rightShoulder;
    const hipS = (leftHip.visibility || 0) > (rightHip.visibility || 0) ? leftHip : rightHip;

    // Anterior-posterior depth projections
    const sideChestDepthCoords = Math.max(0.12, Math.abs(nose.x - shoulderS.x) * 1.6);
    const sideWaistDepthCoords = Math.max(0.10, Math.abs(hipS.x - shoulderS.x) * 0.85);
    const sideHipDepthCoords = Math.max(0.13, Math.abs(hipS.x - shoulderS.x) * 1.10);

    return {
      heightCoords,
      sideChestDepthCoords,
      sideWaistDepthCoords,
      sideHipDepthCoords,
    };
  }

  return { heightCoords };
}

/**
 * Compute multi-factor biometric confidence and scan quality score.
 */
export function computeBiometricConfidence(measurements, validFramesCount = 20, motionVariance = 0.005) {
  const { height, shoulderWidth, chest, waist, hip, inseam, torsoLength } = measurements;
  if (!height || height <= 0) return { score: 70, level: "Moderate", flags: [] };

  let penalty = 0;
  const flags = [];

  // Frame stability evaluation
  if (motionVariance > 0.015) {
    penalty += 8;
    flags.push("Slight motion variance detected during scan");
  }

  // Frame collection adequacy
  if (validFramesCount < 12) {
    penalty += 6;
    flags.push("Limited frame collection sample");
  }

  // 1. Shoulder to Stature
  const shoulderRatio = shoulderWidth / height;
  if (shoulderRatio < RATIO_NORMS.shoulderToHeight.min || shoulderRatio > RATIO_NORMS.shoulderToHeight.max) {
    penalty += 7;
    flags.push("Shoulder width unusual relative to height");
  }

  // 2. Inseam to Stature
  const inseamRatio = inseam / height;
  if (inseamRatio < RATIO_NORMS.inseamToHeight.min || inseamRatio > RATIO_NORMS.inseamToHeight.max) {
    penalty += 6;
    flags.push("Leg length proportion outside standard range");
  }

  // 3. Torso to Stature
  const torsoRatio = torsoLength / height;
  if (torsoRatio < RATIO_NORMS.torsoToHeight.min || torsoRatio > RATIO_NORMS.torsoToHeight.max) {
    penalty += 6;
    flags.push("Torso proportion outside standard range");
  }

  // 4. Waist to Hip variance
  if (waist > hip * 1.25) {
    penalty += 6;
    flags.push("High waist-to-hip variance");
  }

  const score = Math.max(65, Math.min(98, 98 - penalty));
  let level = "High Precision";
  if (score < 78) {
    level = "Fair Precision";
  } else if (score < 88) {
    level = "Good Precision";
  }

  return { score, level, flags };
}

/**
 * Maps physical measurements in cm to 0-100 normalized avatar/sizing parameters.
 */
export function mapMeasurementsToAvatarParams(measurements, category = "men") {
  const isMan = category === "men";

  const hMin = isMan ? 160 : 150;
  const hMax = isMan ? 200 : 190;
  const rawHeight = measurements.height || (isMan ? 178 : 165);
  const heightVal = Math.max(0, Math.min(100, ((rawHeight - hMin) / (hMax - hMin)) * 100));

  const rawWaist = measurements.waist || (isMan ? 80 : 68);
  const wMin = isMan ? 70 : 58;
  const wMax = isMan ? 115 : 98;
  const weightVal = Math.max(0, Math.min(100, ((rawWaist - wMin) / (wMax - wMin)) * 100));

  const rawShoulders = measurements.shoulderWidth || (isMan ? 45 : 38);
  const ratio = rawShoulders / Math.max(40, rawWaist);
  const rMin = isMan ? 0.48 : 0.52;
  const rMax = isMan ? 0.65 : 0.68;
  const muscleVal = Math.max(0, Math.min(100, ((ratio - rMin) / (rMax - rMin)) * 100));

  const rawChest = measurements.chest || (isMan ? 98 : 88);
  const rawHip = measurements.hip || (isMan ? 96 : 94);
  const propRatio = rawChest / Math.max(40, rawHip);
  const pMin = isMan ? 0.94 : 0.88;
  const pMax = isMan ? 1.12 : 1.05;
  const proportionsVal = Math.max(0, Math.min(100, ((propRatio - pMin) / (pMax - pMin)) * 100));

  return {
    category,
    height: Math.round(heightVal),
    weight: Math.round(weightVal),
    muscle: Math.round(muscleVal),
    proportions: Math.round(proportionsVal),
  };
}
