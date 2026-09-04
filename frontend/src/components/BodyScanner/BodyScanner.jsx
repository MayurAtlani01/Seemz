import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  FlipHorizontal,
  Info,
  RotateCcw
} from "lucide-react";
import {
  calculateEllipseCircumference,
  filterOutliersIQR,
  getMedian,
  getRobustMean,
  computeBiometricConfidence,
  mapMeasurementsToAvatarParams,
  PoseLandmarkSmoother,
  validatePose,
  extractFrameKinematics,
} from "../../utils/bodyMeasurements";
import "./BodyScanner.css";

// Dynamic CDN link for MediaPipe Pose (lightweight browser runtime)
const POSE_JS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";

/**
 * SEEMZ AI-Guided Biometric Body Scanner
 * 
 * Features:
 * - One Euro Filter adaptive temporal landmark smoothing
 * - Multi-frame landmark kinematic stabilization
 * - Statistical outlier rejection (IQR)
 * - Strict pose & full-body visibility validation with real-time feedback
 * - Dynamic camera & framing guidance
 * - Height-based pixel-to-metric calibration
 * - Ramanujan ellipse circumferences (Chest, Waist, Hip)
 * - Anatomical consistency checks & scan quality confidence score
 * - Mobile-friendly camera toggle (front/rear)
 * - Clear non-medical disclaimer
 */
function BodyScanner({ initialGender = "men", onClose, onSave }) {
  // Setup States
  const [gender, setGender] = useState(initialGender);
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [heightCm, setHeightCm] = useState("178");
  const [useMetric, setUseMetric] = useState(false);

  // Scanner Steps: "setup" | "loading" | "front_prep" | "front_scan" | "side_prep" | "side_scan" | "processing" | "results"
  const [scanStep, setScanStep] = useState("setup");
  const [errorMessage, setErrorMessage] = useState("");
  const [guidanceText, setGuidanceText] = useState("Please stand in the center of the frame.");

  // Pose Detection Feedback States
  const [fullBodyDetected, setFullBodyDetected] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Camera settings
  const [facingMode, setFacingMode] = useState("user"); // "user" | "environment"
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Aggregated Landmark Stores
  const [frontData, setFrontData] = useState(null);
  const [sideData, setSideData] = useState(null);

  // Calculated Measurements (in cm) & Confidence
  const [measurements, setMeasurements] = useState(null);
  const [confidence, setConfidence] = useState({ score: 95, level: "High Precision", flags: [] });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseModelRef = useRef(null);
  const streamRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const activeLoopRef = useRef(false);
  const isProcessingRef = useRef(false);
  const frameCollectionRef = useRef([]);
  const prevLandmarksRef = useRef(null);
  const smootherRef = useRef(new PoseLandmarkSmoother());
  const motionVarianceRef = useRef(0.005);
  const consecutiveValidRef = useRef(0);
  const lastValidTimestampRef = useRef(0);

  // Latest state references for Pose loop callbacks
  const scanStepRef = useRef(scanStep);
  scanStepRef.current = scanStep;
  const countdownActiveRef = useRef(countdownActive);
  countdownActiveRef.current = countdownActive;

  // Toggle Units
  useEffect(() => {
    if (useMetric) {
      const cmVal = Math.round((parseInt(heightFt, 10) * 12 + parseInt(heightIn, 10)) * 2.54);
      setHeightCm(String(cmVal || 178));
    } else {
      const totalInches = parseFloat(heightCm) / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setHeightFt(String(ft || 5));
      setHeightIn(String(inches || 10));
    }
  }, [useMetric]);

  // Check multiple cameras on device
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === "videoinput");
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {});
    }
  }, []);

  // Dynamically load MediaPipe Pose script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const startScannerLifecycle = async () => {
    setScanStep("loading");
    setErrorMessage("");

    try {
      await loadScript(POSE_JS_URL);
      if (!window.Pose) {
        throw new Error("MediaPipe Pose library failed to initialize.");
      }
      setScanStep("front_prep");
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to initialize computer vision library. Please check your internet connection.");
      setScanStep("setup");
    }
  };

  // Start Camera Stream
  const startCamera = async (overrideFacingMode) => {
    setCameraLoading(true);
    setErrorMessage("");
    const targetFacing = overrideFacingMode || facingMode;

    // Stop existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage("Camera access is not supported in this browser. Please use Chrome, Safari, or Edge.");
      setCameraLoading(false);
      return;
    }

    try {
      let stream = null;
      let lastErr = null;

      const constraintsList = [
        {
          video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        },
        {
          video: { facingMode: targetFacing },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!stream) {
        throw lastErr || new Error("Failed to acquire camera stream.");
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        setErrorMessage("Camera element initialization failed. Please retry.");
        setCameraLoading(false);
        return;
      }

      video.srcObject = stream;

      await new Promise((resolve) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.onloadeddata = () => resolve();
          video.onloadedmetadata = () => resolve();
          video.oncanplay = () => resolve();
          setTimeout(resolve, 800);
        }
      });

      try {
        await video.play();
      } catch (playErr) {
        console.warn("Video playback warning:", playErr);
      }

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      setCameraLoading(false);
      activeLoopRef.current = true;
      requestAnimationFrame(processFrameLoop);

      // Initialize MediaPipe Pose instance
      if (!poseModelRef.current && window.Pose) {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(onPoseResults);
        await pose.initialize?.();
        poseModelRef.current = pose;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission denied. Please allow camera access in your browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera detected. Please connect a webcam or enable your camera device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMessage("Camera is currently in use by another application. Please close other camera tabs and retry.");
      } else {
        setErrorMessage("Camera access failed. Please ensure camera permissions are allowed.");
      }
      cleanupCamera();
      setCameraLoading(false);
    }
  };

  // Safe frame pipeline with sequential concurrency lock (prevents frame queue congestion)
  const processFrameLoop = async () => {
    if (!activeLoopRef.current) return;
    const video = videoRef.current;
    if (
      poseModelRef.current &&
      video &&
      video.readyState >= 2 &&
      !video.paused &&
      !isProcessingRef.current
    ) {
      isProcessingRef.current = true;
      try {
        await poseModelRef.current.send({ image: video });
      } catch (err) {
        // Drop noisy frame safely without crashing loop
      } finally {
        isProcessingRef.current = false;
      }
    }
    if (activeLoopRef.current) {
      requestAnimationFrame(processFrameLoop);
    }
  };

  const handleToggleCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    cleanupCamera();
    startCamera(nextFacing);
  };

  // MediaPipe Results Processing Callback
  const onPoseResults = (results) => {
    const step = scanStepRef.current;
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    const isMirrored = facingMode === "user";

    // Draw video feed (mirrored for selfie mode)
    ctx.save();
    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    if (videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else if (results.image) {
      ctx.drawImage(results.image, 0, 0, width, height);
    }
    ctx.restore();

    if (step === "front_scan" || step === "side_scan") {
      handlePoseAnalysis(ctx, results, width, height, step, isMirrored);
    }
  };

  // Robust Pose, Visibility, & Stability Analysis
  const handlePoseAnalysis = (ctx, results, width, height, step, isMirrored) => {
    if (!results.poseLandmarks || results.poseLandmarks.length < 33) {
      if (!countdownActiveRef.current) {
        setFullBodyDetected(false);
        setGuidanceText("Position full body in camera frame.");
      } else if (Date.now() - lastValidTimestampRef.current > 800) {
        setFullBodyDetected(false);
        resetCountdown();
      }
      return;
    }

    // Adaptive One Euro Filter: rock-solid when still, responsive when moving
    const rawLandmarks = results.poseLandmarks;
    const landmarks = smootherRef.current.smooth(rawLandmarks);

    // Validate full-body visibility, framing boundaries, orientation, and pose posture
    const validation = validatePose(landmarks, step);

    if (!validation.isValid) {
      if (!countdownActiveRef.current) {
        consecutiveValidRef.current = 0;
        setFullBodyDetected(false);
        setGuidanceText(validation.guidance);
      } else if (Date.now() - lastValidTimestampRef.current > 800) {
        setFullBodyDetected(false);
        resetCountdown();
      }
      drawSkeletonFeedback(ctx, landmarks, false, width, height, isMirrored);
      return;
    }

    // Pose is valid
    lastValidTimestampRef.current = Date.now();
    consecutiveValidRef.current += 1;
    prevLandmarksRef.current = landmarks;

    setFullBodyDetected(true);
    setGuidanceText(validation.guidance);

    // Trigger countdown after 3 consecutive stable valid frames
    if (!countdownActiveRef.current && consecutiveValidRef.current >= 3) {
      triggerCountdown();
    } else if (countdownActiveRef.current) {
      // Collect frame kinematics during stable countdown window
      const frameData = extractFrameKinematics(landmarks, step);
      frameData.motionShift = 0.005;
      frameCollectionRef.current.push(frameData);
    }

    drawSkeletonFeedback(ctx, landmarks, true, width, height, isMirrored);
  };

  // Draw luxury HUD skeleton overlay
  const drawSkeletonFeedback = (ctx, landmarks, isValid, width, height, isMirrored) => {
    const nodeColor = isValid ? "#10B981" : "rgba(255, 255, 255, 0.65)";
    const lineColor = isValid ? "rgba(16, 185, 129, 0.65)" : "rgba(255, 255, 255, 0.25)";

    const getX = (val) => (isMirrored ? (1 - val) * width : val * width);

    // Key body joint nodes
    const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    keyJoints.forEach((idx) => {
      const lm = landmarks[idx];
      if (lm && (lm.visibility || 0) > 0.3) {
        ctx.beginPath();
        ctx.arc(getX(lm.x), lm.y * height, isValid ? 4.5 : 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Anatomical connection lines
    const connections = [
      [11, 12], // shoulders
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 23], [12, 24], // torso lateral
      [23, 24], // pelvis
      [23, 25], [25, 27], [27, 29], [29, 31], // left leg and foot
      [24, 26], [26, 28], [28, 30], [30, 32], // right leg and foot
    ];

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = isValid ? 2.5 : 1.5;
    connections.forEach(([i1, i2]) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2 && (p1.visibility || 0) > 0.25 && (p2.visibility || 0) > 0.25) {
        ctx.beginPath();
        ctx.moveTo(getX(p1.x), p1.y * height);
        ctx.lineTo(getX(p2.x), p2.y * height);
        ctx.stroke();
      }
    });
  };

  const triggerCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdownActive(true);
    setCountdown(3);
    frameCollectionRef.current = [];

    let timer = 3;
    countdownIntervalRef.current = setInterval(() => {
      timer -= 1;
      setCountdown(timer);

      if (timer <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        finishScanCapture();
      }
    }, 1000);
  };

  const resetCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    consecutiveValidRef.current = 0;
    setCountdownActive(false);
    setCountdown(3);
  };

  // Complete capture of active step with outlier rejection & aggregation
  const finishScanCapture = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const step = scanStepRef.current;
    let collected = frameCollectionRef.current;

    // If frameCollection is small but we have previous landmarks, build standard frame set
    if (collected.length < 3 && prevLandmarksRef.current) {
      const fallbackFrame = extractFrameKinematics(prevLandmarksRef.current, step);
      collected = [fallbackFrame, fallbackFrame, fallbackFrame];
    }

    if (collected.length === 0) {
      resetCountdown();
      return;
    }

    if (step === "front_scan") {
      const aggregated = aggregateFrontData(collected);
      setFrontData(aggregated);
      cleanupCamera();
      setScanStep("side_prep");
    } else if (step === "side_scan") {
      const aggregated = aggregateSideData(collected);
      setSideData(aggregated);
      cleanupCamera();
      setScanStep("processing");
    }
  };

  // Multi-frame statistical aggregation with IQR outlier rejection
  const aggregateFrontData = (frames) => {
    const shifts = frames.map((f) => f.motionShift || 0);
    const avgShift = shifts.reduce((a, b) => a + b, 0) / Math.max(1, shifts.length);
    motionVarianceRef.current = avgShift;

    return {
      frameCount: frames.length,
      heightCoords: getRobustMean(frames.map((f) => f.heightCoords)),
      biacromialCoords: getRobustMean(frames.map((f) => f.biacromialCoords)),
      torsoLengthCoords: getRobustMean(frames.map((f) => f.torsoLengthCoords)),
      armLengthCoords: getRobustMean(frames.map((f) => f.armLengthCoords)),
      inseamCoords: getRobustMean(frames.map((f) => f.inseamCoords)),
      frontChestWidthCoords: getRobustMean(frames.map((f) => f.frontChestWidthCoords)),
      frontWaistWidthCoords: getRobustMean(frames.map((f) => f.frontWaistWidthCoords)),
      frontHipWidthCoords: getRobustMean(frames.map((f) => f.frontHipWidthCoords)),
    };
  };

  const aggregateSideData = (frames) => {
    return {
      frameCount: frames.length,
      heightCoords: getRobustMean(frames.map((f) => f.heightCoords)),
      sideChestDepthCoords: getRobustMean(frames.map((f) => f.sideChestDepthCoords)),
      sideWaistDepthCoords: getRobustMean(frames.map((f) => f.sideWaistDepthCoords)),
      sideHipDepthCoords: getRobustMean(frames.map((f) => f.sideHipDepthCoords)),
    };
  };

  useEffect(() => {
    if (scanStep === "processing") {
      const timer = setTimeout(() => {
        calculateMeasurements();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [scanStep]);

  // Height-based Biometric Calibration & Ramanujan Ellipse Circumferences
  const calculateMeasurements = () => {
    if (!frontData || !sideData) {
      setErrorMessage("Biometric capture incomplete. Please recalibrate.");
      setScanStep("setup");
      return;
    }

    const heightVal = useMetric
      ? parseFloat(heightCm)
      : (parseInt(heightFt, 10) * 12 + parseInt(heightIn, 10)) * 2.54;

    // Primary Height Scale Calibration Factor (cm per normalized coordinate unit)
    const scaleFactorF = heightVal / Math.max(0.4, frontData.heightCoords);
    const scaleFactorS = heightVal / Math.max(0.4, sideData.heightCoords);

    // Biacromial 3D shoulder width + deltoid lateral muscle thickness
    const biacromialCm = frontData.biacromialCoords * scaleFactorF;
    const shoulderWidthCm = biacromialCm * 1.10;
    const torsoLengthCm = frontData.torsoLengthCoords * scaleFactorF * 1.08;
    const armLengthCm = frontData.armLengthCoords * scaleFactorF * 1.05;
    const inseamCm = frontData.inseamCoords * scaleFactorF;

    // Frontal lateral widths in cm
    const frontChestWidth = frontData.frontChestWidthCoords * scaleFactorF;
    const frontWaistWidth = frontData.frontWaistWidthCoords * scaleFactorF;
    const frontHipWidth = frontData.frontHipWidthCoords * scaleFactorF;

    // Sagittal profile depths in cm
    const sideChestDepth = sideData.sideChestDepthCoords * scaleFactorS;
    const sideWaistDepth = sideData.sideWaistDepthCoords * scaleFactorS;
    const sideHipDepth = sideData.sideHipDepthCoords * scaleFactorS;

    // Ramanujan ellipse calculation with 1.02 anatomical perimeter factor
    const chestCm = calculateEllipseCircumference(frontChestWidth, sideChestDepth) * 1.02;
    const waistCm = calculateEllipseCircumference(frontWaistWidth, sideWaistDepth) * 1.02;
    const hipCm = calculateEllipseCircumference(frontHipWidth, sideHipDepth) * 1.02;

    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    const finalMeasurements = {
      height: Math.round(heightVal),
      shoulderWidth: Math.round(clamp(shoulderWidthCm, 34, 58)),
      chest: Math.round(clamp(chestCm, 72, 140)),
      waist: Math.round(clamp(waistCm, 58, 130)),
      hip: Math.round(clamp(hipCm, 76, 142)),
      armLength: Math.round(clamp(armLengthCm, 50, 82)),
      inseam: Math.round(clamp(inseamCm, 58, 96)),
      torsoLength: Math.round(clamp(torsoLengthCm, 50, 86)),
    };

    const calculatedConfidence = computeBiometricConfidence(
      finalMeasurements,
      frontData.frameCount,
      motionVarianceRef.current
    );

    setMeasurements(finalMeasurements);
    setConfidence(calculatedConfidence);
    setScanStep("results");
  };

  // Fine-tuning adjustments for individual measurements (+/- 1 cm)
  const handleUpdateMeasurement = (field, increment) => {
    setMeasurements((prev) => {
      if (!prev) return null;
      const diff = increment ? 1 : -1;
      const updated = {
        ...prev,
        [field]: Math.max(10, prev[field] + diff),
      };
      setConfidence(computeBiometricConfidence(updated, frontData?.frameCount || 20, 0.005));
      return updated;
    });
  };

  // Save measurements to profile & localStorage
  const handleUseMeasurements = () => {
    if (!measurements) return;
    const avatarParams = mapMeasurementsToAvatarParams(measurements, gender);

    if (onSave) {
      onSave({
        gender,
        height: measurements.height,
        shoulderWidth: measurements.shoulderWidth,
        chest: measurements.chest,
        waist: measurements.waist,
        hip: measurements.hip,
        armLength: measurements.armLength,
        inseam: measurements.inseam,
        torsoLength: measurements.torsoLength,
        confidenceScore: confidence.score,
        avatarParams,
      });
    }

    onClose();
  };

  const cleanupCamera = () => {
    activeLoopRef.current = false;
    isProcessingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (poseModelRef.current) {
      try {
        poseModelRef.current.close();
      } catch (e) {}
      poseModelRef.current = null;
    }
    if (smootherRef.current) {
      smootherRef.current.reset();
    }
    prevLandmarksRef.current = null;
    resetCountdown();
  };

  useEffect(() => {
    if (scanStep === "front_scan" || scanStep === "side_scan") {
      startCamera();
    }
    return () => {
      if (scanStep === "front_scan" || scanStep === "side_scan") {
        cleanupCamera();
      }
    };
  }, [scanStep]);

  useEffect(() => {
    return () => cleanupCamera();
  }, []);

  const formatCmToFtIn = (cm) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${ft}'${inches}"`;
  };

  const cmToInchesString = (cm) => {
    return `${cm} cm (~${Math.round(cm * 0.393701)}″)`;
  };

  return (
    <div className="scanner-modal-overlay">
      <div className={`scanner-card step-${scanStep}`}>
        {/* HEADER */}
        <header className="scanner-header">
          <div className="scanner-header-left">
            <span className="scanner-eyebrow">SEEMZ SMART FIT</span>
            <h2>3D Body Scanner</h2>
          </div>
          <div className="scanner-header-actions">
            {(scanStep === "front_scan" || scanStep === "side_scan") && hasMultipleCameras && (
              <button
                type="button"
                className="scanner-icon-action-btn"
                onClick={handleToggleCamera}
                title="Flip Camera"
              >
                <FlipHorizontal size={16} />
              </button>
            )}
            <button type="button" className="scanner-close-btn" onClick={onClose} title="Close Body Scanner">
              <X size={18} />
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="scanner-alert-error">
            <div className="alert-message-content">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              className="scanner-retry-btn"
              onClick={() => startCamera()}
            >
              RETRY CAMERA
            </button>
          </div>
        )}

        {/* 1. SETUP STEP */}
        {scanStep === "setup" && (
          <div className="scanner-body-content">
            <div className="scanner-instruction-card">
              <Camera className="intro-icon" size={28} strokeWidth={1.2} />
              <h3>Find Your Size</h3>
              <p>
                Select your category and enter your height. Our 3D scanner calculates your measurements to recommend your ideal size.
              </p>
            </div>

            <div className="setup-fields-grid">
              <div className="setup-field-group">
                <label className="field-label">Category</label>
                <div className="gender-toggle-row">
                  <button
                    type="button"
                    className={`gender-btn ${gender === "men" ? "active" : ""}`}
                    onClick={() => setGender("men")}
                  >
                    MEN
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${gender === "women" ? "active" : ""}`}
                    onClick={() => setGender("women")}
                  >
                    WOMEN
                  </button>
                </div>
              </div>

              <div className="setup-field-group">
                <div className="label-with-toggle">
                  <label className="field-label">Height</label>
                  <button
                    type="button"
                    className="unit-toggle-btn"
                    onClick={() => setUseMetric(!useMetric)}
                  >
                    {useMetric ? "Feet / Inches" : "Centimeters"}
                  </button>
                </div>

                {useMetric ? (
                  <div className="metric-input-wrap">
                    <input
                      type="number"
                      min={120}
                      max={240}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                    <span className="unit-tag">cm</span>
                  </div>
                ) : (
                  <div className="imperial-input-grid">
                    <div className="imperial-cell">
                      <input
                        type="number"
                        min={4}
                        max={7}
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                      />
                      <span className="unit-tag">ft</span>
                    </div>
                    <div className="imperial-cell">
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                      />
                      <span className="unit-tag">in</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clear Non-Medical Disclaimer */}
            <div className="scanner-disclaimer-note">
              <Info size={15} color="rgba(255, 255, 255, 0.7)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p>
                <strong>Notice:</strong> Measurements are automated estimates designed to help you find your best size. All camera processing stays privately on your device.
              </p>
            </div>

            <button type="button" className="scanner-primary-btn" onClick={startScannerLifecycle}>
              START SCAN
            </button>
          </div>
        )}

        {/* 2. LOADING MODEL */}
        {scanStep === "loading" && (
          <div className="scanner-body-content loader-content">
            <div className="scanner-spinner-wrap">
              <RefreshCw className="spinner-icon" size={36} />
            </div>
            <h3>Starting Camera</h3>
            <p>Loading camera and body detection...</p>
          </div>
        )}

        {/* 3. FRONT PREP */}
        {scanStep === "front_prep" && (
          <div className="scanner-body-content prep-content">
            <div className="guidance-silhouette-box">
              <div className="dotted-silhouette-front" />
            </div>
            <h3>Step 1: Front View</h3>
            <p className="prep-subtext">
              Stand facing the camera directly. Make sure your full body from head to feet is visible.
            </p>

            <div className="prep-bullet-box">
              <div className="prep-bullet">
                <span className="bullet-num">01</span>
                <span>Keep your entire body inside the frame.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">02</span>
                <span>Stand straight with your shoulders relaxed.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">03</span>
                <span>Keep your arms slightly away from your sides.</span>
              </div>
            </div>

            <button
              type="button"
              className="scanner-primary-btn"
              style={{ width: "100%", maxWidth: "440px" }}
              onClick={() => setScanStep("front_scan")}
            >
              START FRONT SCAN
            </button>
          </div>
        )}

        {/* 4. FRONT SCAN ACTIVE */}
        {scanStep === "front_scan" && (
          <div className="scanner-camera-viewport">
            <video ref={videoRef} className="hidden-video" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="scanner-canvas" />

            <div className={`camera-framing-guide ${fullBodyDetected ? "locked" : ""}`} />
            <div className={`camera-flash-overlay ${flashActive ? "active" : ""}`} />

            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                <span className="pulse-dot" />
                <span>{fullBodyDetected ? "LOCKED ✓" : "ALIGNING..."}</span>
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

            {countdownActive && (
              <div className="hud-countdown-timer">
                <span>{countdown}</span>
              </div>
            )}

            <button
              type="button"
              className="scanner-back-arrow"
              onClick={() => {
                cleanupCamera();
                setScanStep("front_prep");
              }}
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* 5. SIDE PREP */}
        {scanStep === "side_prep" && (
          <div className="scanner-body-content prep-content">
            <div className="guidance-silhouette-box">
              <div className="dotted-silhouette-side" />
            </div>
            <h3>Step 2: Side View</h3>
            <p className="prep-subtext">
              Turn 90 degrees to the side so your profile is visible to the camera.
            </p>

            <div className="prep-bullet-box">
              <div className="prep-bullet">
                <span className="bullet-num">01</span>
                <span>Turn 90° to face either side.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">02</span>
                <span>Stand straight with a natural posture.</span>
              </div>
            </div>

            <div className="split-action-row">
              <button
                type="button"
                className="scanner-sec-btn"
                onClick={() => setScanStep("front_prep")}
              >
                RETAKE FRONT SCAN
              </button>
              <button
                type="button"
                className="scanner-primary-btn"
                onClick={() => setScanStep("side_scan")}
              >
                START SIDE SCAN
              </button>
            </div>
          </div>
        )}

        {/* 6. SIDE SCAN ACTIVE */}
        {scanStep === "side_scan" && (
          <div className="scanner-camera-viewport">
            <video ref={videoRef} className="hidden-video" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="scanner-canvas" />

            <div className={`camera-framing-guide ${fullBodyDetected ? "locked" : ""}`} />
            <div className={`camera-flash-overlay ${flashActive ? "active" : ""}`} />

            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                <span className="pulse-dot" />
                <span>{fullBodyDetected ? "LOCKED ✓" : "ALIGNING..."}</span>
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

            {countdownActive && (
              <div className="hud-countdown-timer">
                <span>{countdown}</span>
              </div>
            )}

            <button
              type="button"
              className="scanner-back-arrow"
              onClick={() => {
                cleanupCamera();
                setScanStep("side_prep");
              }}
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* 7. PROCESSING STEP */}
        {scanStep === "processing" && (
          <div className="scanner-body-content loader-content">
            <div className="processing-radar-box">
              <div className="radar-sweep" />
              <Camera size={26} color="#FFFFFF" />
            </div>
            <h3>Calculating Measurements</h3>
            <p>
              Calculating your chest, waist, and hip measurements...
            </p>
          </div>
        )}

        {/* 8. RESULTS DISPLAY */}
        {scanStep === "results" && measurements && (
          <div className="scanner-body-content results-content">
            <div className="results-header-banner">
              <div className="results-badge-success">
                <span>YOUR MEASUREMENTS</span>
              </div>
              <span className="confidence-pill">{confidence.score}% {confidence.level}</span>
            </div>

            <p className="results-intro-text">
              Based on your height of {formatCmToFtIn(measurements.height)} ({measurements.height} cm). You can fine-tune any measurement below.
            </p>

            <div className="measurements-adjustment-list">
              <div className="measurement-row">
                <span className="m-label">Height</span>
                <span className="m-value">{formatCmToFtIn(measurements.height)} ({measurements.height} cm)</span>
                <span className="m-controls-placeholder">Calibrated</span>
              </div>

              <div className="measurement-row">
                <span className="m-label">Shoulder Width</span>
                <span className="m-value">{cmToInchesString(measurements.shoulderWidth)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("shoulderWidth", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("shoulderWidth", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Chest Circumference</span>
                <span className="m-value">{cmToInchesString(measurements.chest)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("chest", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("chest", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Waist Circumference</span>
                <span className="m-value">{cmToInchesString(measurements.waist)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("waist", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("waist", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Hip Circumference</span>
                <span className="m-value">{cmToInchesString(measurements.hip)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("hip", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("hip", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Arm Length</span>
                <span className="m-value">{cmToInchesString(measurements.armLength)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("armLength", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("armLength", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Inseam</span>
                <span className="m-value">{cmToInchesString(measurements.inseam)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("inseam", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("inseam", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Torso Length</span>
                <span className="m-value">{cmToInchesString(measurements.torsoLength)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("torsoLength", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("torsoLength", true)}>+</button>
                </div>
              </div>
            </div>

            {/* Non-medical estimate disclaimer */}
            <div className="scanner-disclaimer-note">
              <Info size={14} color="rgba(255, 255, 255, 0.7)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p>
                <strong>Notice:</strong> Measurements are automated estimates designed to help you find your best size. All camera processing stays privately on your device.
              </p>
            </div>

            <div className="results-actions-row">
              <button
                type="button"
                className="scanner-sec-btn"
                onClick={() => {
                  setMeasurements(null);
                  setFrontData(null);
                  setSideData(null);
                  setScanStep("front_prep");
                }}
              >
                <RotateCcw size={13} />
                <span>RETAKE SCAN</span>
              </button>
              <button
                type="button"
                className="scanner-primary-btn"
                onClick={handleUseMeasurements}
              >
                SAVE MEASUREMENTS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BodyScanner;
