import React, { useState, useEffect, useRef } from "react";
import { X, Camera, RefreshCw, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { mapMeasurementsToAvatarParams } from "../../services/changingRoom/avatarEngine";
import "./BodyScanner.css";

// Dynamic CDN links for MediaPipe scripts
const CAMERA_JS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
const POSE_JS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";

function BodyScanner({ initialGender = "men", onClose, onSave }) {
  // Setup States
  const [gender, setGender] = useState(initialGender);
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [heightCm, setHeightCm] = useState("178");
  const [useMetric, setUseMetric] = useState(false);

  // Scanner Steps: "setup" | "loading" | "front_prep" | "front_scan" | "side_prep" | "side_scan" | "processing" | "results"
  const [scanStep, setScanStep] = useState("setup");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [guidanceText, setGuidanceText] = useState("Please stand in the center of the frame.");

  // Pose Detection Feedback States
  const [fullBodyDetected, setFullBodyDetected] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Landmark Stores
  const [frontLandmarks, setFrontLandmarks] = useState(null);
  const [sideLandmarks, setSideLandmarks] = useState(null);

  // Calculated Measurements (in cm)
  const [measurements, setMeasurements] = useState(null);

  // Refs for video, canvas, camera, and active pose model
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseModelRef = useRef(null);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Keep track of latest state in refs for Pose callbacks
  const scanStepRef = useRef(scanStep);
  scanStepRef.current = scanStep;
  const countdownActiveRef = useRef(countdownActive);
  countdownActiveRef.current = countdownActive;

  // Toggle Units
  useEffect(() => {
    if (useMetric) {
      const cmVal = Math.round((parseInt(heightFt) * 12 + parseInt(heightIn)) * 2.54);
      setHeightCm(String(cmVal || 178));
    } else {
      const totalInches = parseFloat(heightCm) / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setHeightFt(String(ft || 5));
      setHeightIn(String(inches || 10));
    }
  }, [useMetric]);

  // Load scripts dynamically
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
      // 1. Load MediaPipe dependencies dynamically from CDN
      await loadScript(CAMERA_JS_URL);
      await loadScript(POSE_JS_URL);

      if (!window.Pose || !window.Camera) {
        throw new Error("MediaPipe libraries failed to initialize from CDN.");
      }

      setModelLoaded(true);
      setScanStep("front_prep");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load computer-vision assets. Please check your connection.");
      setScanStep("setup");
    }
  };

  // Start Camera and bind Pose instance
  const startCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // Setup MediaPipe Pose instance
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onPoseResults);
      poseModelRef.current = pose;

      // Start Camera Loop
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (poseModelRef.current && videoRef.current) {
            await poseModelRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      camera.start();
      cameraRef.current = camera;
    } catch (err) {
      console.error("Camera acquisition failure:", err);
      setErrorMessage("Could not access camera. Please verify permissions.");
      cleanupCamera();
      setScanStep("setup");
    }
  };

  // Callback from MediaPipe Pose model
  const onPoseResults = (results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // Clear and draw active video frame
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(results.image, 0, 0, width, height);

    const step = scanStepRef.current;
    if (step !== "front_scan" && step !== "side_scan") return;

    // If landmarks are found, analyze alignment
    if (results.poseLandmarks) {
      // Check full body keypoint visibility
      // Nose (0), Shoulders (11, 12), Hips (23, 24), Knees (25, 26), Ankles (27, 28)
      const landmarks = results.poseLandmarks;
      
      const nose = landmarks[0];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const leftKnee = landmarks[25];
      const rightKnee = landmarks[26];
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];

      const minVisibility = 0.55;

      const frontDetected = 
        nose.visibility > minVisibility &&
        leftShoulder.visibility > minVisibility &&
        rightShoulder.visibility > minVisibility &&
        leftHip.visibility > minVisibility &&
        rightHip.visibility > minVisibility &&
        leftKnee.visibility > minVisibility &&
        rightKnee.visibility > minVisibility &&
        leftAnkle.visibility > minVisibility &&
        rightAnkle.visibility > minVisibility;

      const sideDetected = 
        nose.visibility > minVisibility &&
        (leftShoulder.visibility > minVisibility || rightShoulder.visibility > minVisibility) &&
        (leftHip.visibility > minVisibility || rightHip.visibility > minVisibility) &&
        (leftKnee.visibility > minVisibility || rightKnee.visibility > minVisibility) &&
        (leftAnkle.visibility > minVisibility || rightAnkle.visibility > minVisibility);

      const isAligned = step === "front_scan" ? frontDetected : sideDetected;

      setFullBodyDetected(isAligned);

      if (isAligned) {
        setGuidanceText("Position Lock! Hold still...");
        if (!countdownActiveRef.current) {
          triggerCountdown(landmarks);
        }
      } else {
        setGuidanceText(
          step === "front_scan"
            ? "Ankles or head not fully visible. Please step back."
            : "Turn to the side. Ensure full profile fits inside frame."
        );
        resetCountdown();
      }

      // Draw skeleton points for immediate interactive feedback
      drawSkeletonFeedback(ctx, landmarks, isAligned);
    } else {
      setFullBodyDetected(false);
      setGuidanceText("No body detected in camera frame.");
      resetCountdown();
    }
  };

  const drawSkeletonFeedback = (ctx, landmarks, isAligned) => {
    // Draw joints
    const color = isAligned ? "#4ade80" : "#ff4a4a"; // Green if ready to capture, Red if out of frame
    
    // Draw dots on key joints
    const jointsToDraw = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    jointsToDraw.forEach((idx) => {
      const lm = landmarks[idx];
      if (lm && lm.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(lm.x * canvasRef.current.width, lm.y * canvasRef.current.height, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });

    // Draw connection lines
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Upper body
      [11, 23], [12, 24], [23, 24], // Torso
      [23, 25], [25, 27], [24, 26], [26, 28] // Lower body
    ];

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    connections.forEach(([i1, i2]) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(p1.x * canvasRef.current.width, p1.y * canvasRef.current.height);
        ctx.lineTo(p2.x * canvasRef.current.width, p2.y * canvasRef.current.height);
        ctx.stroke();
      }
    });
  };

  const triggerCountdown = (landmarks) => {
    setCountdownActive(true);
    setCountdown(3);
    
    let timer = 3;
    countdownIntervalRef.current = setInterval(() => {
      timer -= 1;
      setCountdown(timer);

      if (timer <= 0) {
        clearInterval(countdownIntervalRef.current);
        triggerCaptureFlash(landmarks);
      }
    }, 1000);
  };

  const resetCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdownActive(false);
    setCountdown(3);
  };

  const triggerCaptureFlash = (landmarks) => {
    // Play flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 250);

    const step = scanStepRef.current;
    if (step === "front_scan") {
      setFrontLandmarks(landmarks);
      cleanupCamera();
      setScanStep("side_prep");
    } else if (step === "side_scan") {
      setSideLandmarks(landmarks);
      cleanupCamera();
      setScanStep("processing");
    }
  };

  // Run measurement calculations in processing step
  useEffect(() => {
    if (scanStep === "processing") {
      setTimeout(() => {
        calculateMeasurements();
      }, 2500); // Visual scanning buffer
    }
  }, [scanStep]);

  const calculateMeasurements = () => {
    if (!frontLandmarks || !sideLandmarks) {
      setErrorMessage("Scan data incomplete. Please reset scanner.");
      setScanStep("setup");
      return;
    }

    // Calibration input
    const heightVal = useMetric 
      ? parseFloat(heightCm) 
      : (parseInt(heightFt) * 12 + parseInt(heightIn)) * 2.54;

    const noseF = frontLandmarks[0];
    const leftShoulderF = frontLandmarks[11];
    const rightShoulderF = frontLandmarks[12];
    const leftHipF = frontLandmarks[23];
    const rightHipF = frontLandmarks[24];
    const leftAnkleF = frontLandmarks[27];
    const rightAnkleF = frontLandmarks[28];
    const leftHeelF = frontLandmarks[29];
    const rightHeelF = frontLandmarks[30];

    // FRONT scale factor
    const shoulderDistF = Math.hypot(leftShoulderF.x - rightShoulderF.x, leftShoulderF.y - rightShoulderF.y);
    const headYF = noseF.y - shoulderDistF * 0.72;
    const feetYF = Math.max(leftAnkleF.y, rightAnkleF.y, leftHeelF.y, rightHeelF.y);
    const heightCoordsF = feetYF - headYF;
    const scaleFactorF = heightVal / heightCoordsF;

    // SIDE scale factor
    const noseS = sideLandmarks[0];
    const shoulderS = sideLandmarks[11] || sideLandmarks[12];
    const hipS = sideLandmarks[23] || sideLandmarks[24];
    const kneeS = sideLandmarks[25] || sideLandmarks[26];
    const ankleS = sideLandmarks[27] || sideLandmarks[28];
    const heelS = sideLandmarks[29] || sideLandmarks[30];

    const headYS = noseS.y - shoulderDistF * 0.72;
    const feetYS = Math.max(ankleS.y, heelS.y);
    const heightCoordsS = feetYS - headYS;
    const scaleFactorS = heightVal / heightCoordsS;

    const distF = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    // 1. Shoulder Width: joint line * 1.15 for flesh boundary
    const shoulderWidthCm = distF(leftShoulderF, rightShoulderF) * scaleFactorF * 1.14;

    // 2. Torso Length: shoulder midpoint to hip midpoint
    const shoulderMidF = { x: (leftShoulderF.x + rightShoulderF.x)/2, y: (leftShoulderF.y + rightShoulderF.y)/2 };
    const hipMidF = { x: (leftHipF.x + rightHipF.x)/2, y: (leftHipF.y + rightHipF.y)/2 };
    const torsoLengthCm = distF(shoulderMidF, hipMidF) * scaleFactorF;

    // 3. Arm Length: Shoulder to wrist
    const leftArmCm = distF(leftShoulderF, frontLandmarks[13]) + distF(frontLandmarks[13], frontLandmarks[15]);
    const rightArmCm = distF(rightShoulderF, frontLandmarks[14]) + distF(frontLandmarks[14], frontLandmarks[16]);
    const armLengthCm = Math.max(leftArmCm, rightArmCm) * scaleFactorF * 1.05;

    // 4. Inseam: Crotch to ankle
    const ankleMidF = { x: (leftAnkleF.x + rightAnkleF.x)/2, y: (leftAnkleF.y + rightAnkleF.y)/2 };
    const inseamCm = distF(hipMidF, ankleMidF) * scaleFactorF * 0.88;

    // 5. Circumference Widths (Front)
    const frontChestWidth = shoulderWidthCm * 0.90;
    const frontWaistWidth = distF(leftHipF, rightHipF) * 0.94 * scaleFactorF;
    const frontHipWidth = distF(leftHipF, rightHipF) * 1.28 * scaleFactorF;

    // 6. Circumference Depths (Side Profiles)
    const sideChestDepth = Math.max(0.1, Math.abs(noseS.x - shoulderS.x)) * 1.8 * scaleFactorS;
    const sideWaistDepth = Math.max(0.1, Math.abs(hipS.x - kneeS.x)) * 0.65 * scaleFactorS;
    const sideHipDepth = Math.max(0.12, Math.abs(hipS.x - kneeS.x)) * 0.85 * scaleFactorS;

    // 7. Calculate Circumferences (Ellipse Formula: PI * sqrt(2 * (w^2 + d^2)) / 2)
    const calculateEllipsePerimeter = (w, d) => {
      return Math.PI * Math.sqrt(2 * (w**2 + d**2)) / 2;
    };

    const chestCm = calculateEllipsePerimeter(frontChestWidth, sideChestDepth);
    const waistCm = calculateEllipsePerimeter(frontWaistWidth, sideWaistDepth);
    const hipCm = calculateEllipsePerimeter(frontHipWidth, sideHipDepth);

    // 8. Bounded limits to protect against outliers
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

    setMeasurements({
      height: Math.round(heightVal),
      shoulderWidth: Math.round(clamp(shoulderWidthCm, 32, 58)),
      chest: Math.round(clamp(chestCm, 70, 140)),
      waist: Math.round(clamp(waistCm, 60, 130)),
      hip: Math.round(clamp(hipCm, 75, 140)),
      armLength: Math.round(clamp(armLengthCm, 48, 80)),
      inseam: Math.round(clamp(inseamCm, 60, 95)),
      torsoLength: Math.round(clamp(torsoLengthCm, 50, 85))
    });

    setScanStep("results");
  };

  const handleUpdateMeasurement = (field, increment) => {
    setMeasurements((prev) => {
      if (!prev) return null;
      // Change by 1 cm (approx 0.4 in)
      const diff = increment ? 1 : -1;
      return {
        ...prev,
        [field]: Math.max(10, prev[field] + diff)
      };
    });
  };

  const handleUseMeasurements = () => {
    if (!measurements) return;

    // Map physical measurements into 3D avatar engine percentages (0-100)
    const avatarParams = mapMeasurementsToAvatarParams(measurements, gender);

    // Trigger save callback in ChangingRoom
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
      avatarParams
    });

    onClose();
  };

  const cleanupCamera = () => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {}
      cameraRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (poseModelRef.current) {
      try {
        poseModelRef.current.close();
      } catch (e) {}
      poseModelRef.current = null;
    }
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

  // Format Helper: cm to ft/in
  const formatCmToFtIn = (cm) => {
    const totalInches = cm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${ft}'${inches}"`;
  };

  const cmToInchesString = (cm) => {
    return `~${Math.round(cm * 0.393701)}″`;
  };

  return (
    <div className="scanner-modal-overlay">
      <div className={`scanner-card step-${scanStep}`}>
        
        {/* HEADER */}
        <header className="scanner-header">
          <div className="scanner-header-left">
            <span className="scanner-eyebrow">SEEMZ AI ATELIER</span>
            <h2>Body Scanner</h2>
          </div>
          <button type="button" className="scanner-close-btn" onClick={onClose} title="Cancel Scan">
            <X size={20} />
          </button>
        </header>

        {errorMessage && (
          <div className="scanner-alert-error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP CONTENT SWITCH */}

        {/* 1. SETUP DETAILS */}
        {scanStep === "setup" && (
          <div className="scanner-body-content">
            <div className="scanner-instruction-card">
              <Camera className="intro-icon" size={32} strokeWidth={1.5} />
              <h3>Calibrate Scanner</h3>
              <p>Please select your gender morphology and input your true height to calibrate the pixel scale factor.</p>
            </div>

            <div className="setup-fields-grid">
              {/* Gender selection */}
              <div className="setup-field-group">
                <label className="field-label">Morphology</label>
                <div className="gender-toggle-row">
                  <button
                    type="button"
                    className={`gender-btn ${gender === "men" ? "active" : ""}`}
                    onClick={() => setGender("men")}
                  >
                    MAN
                  </button>
                  <button
                    type="button"
                    className={`gender-btn ${gender === "women" ? "active" : ""}`}
                    onClick={() => setGender("women")}
                  >
                    WOMAN
                  </button>
                </div>
              </div>

              {/* Height Input */}
              <div className="setup-field-group">
                <div className="label-with-toggle">
                  <label className="field-label">Height</label>
                  <button 
                    type="button" 
                    className="unit-toggle-btn"
                    onClick={() => setUseMetric(!useMetric)}
                  >
                    Switch to {useMetric ? "Imperial (ft/in)" : "Metric (cm)"}
                  </button>
                </div>

                {useMetric ? (
                  <div className="metric-input-wrap">
                    <input
                      type="number"
                      min={100}
                      max={250}
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
                        min={3}
                        max={8}
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

            <button type="button" className="scanner-primary-btn" onClick={startScannerLifecycle}>
              START CAMERA SCANNER
            </button>
          </div>
        )}

        {/* 2. LOADING MODEL */}
        {scanStep === "loading" && (
          <div className="scanner-body-content loader-content">
            <div className="scanner-spinner-wrap">
              <RefreshCw className="spinner-icon" size={42} />
            </div>
            <h3>Loading AI Vision Models</h3>
            <p>Initializing posture landmark analysis entirely on-device...</p>
          </div>
        )}

        {/* 3. FRONT PREP */}
        {scanStep === "front_prep" && (
          <div className="scanner-body-content prep-content">
            <div className="guidance-silhouette-box front-guide">
              <div className="dotted-silhouette-front" />
            </div>
            <h3>Step 1: Front Pose Scan</h3>
            <p className="prep-subtext">You will stand facing the camera directly. Secure full body visibility from head to ankles.</p>
            
            <div className="prep-bullet-box">
              <div className="prep-bullet">
                <span className="bullet-num">1</span>
                <span>Stand roughly 7–9 feet back in well-lit surroundings.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">2</span>
                <span>Keep arms slightly angled away from your torso.</span>
              </div>
            </div>

            <button type="button" className="scanner-primary-btn" onClick={() => setScanStep("front_scan")}>
              OPEN FRONT CAMERA
            </button>
          </div>
        )}

        {/* 4. FRONT CAMERA SCAN ACTIVE */}
        {scanStep === "front_scan" && (
          <div className="scanner-camera-viewport">
            <video ref={videoRef} className="hidden-video" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="scanner-canvas" />

            {/* Silhouette Outline overlay */}
            <div className="overlay-silhouette-front" />

            {/* Flash Overlay */}
            <div className={`camera-flash-overlay ${flashActive ? "active" : ""}`} />

            {/* Floating guidance HUD */}
            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                {fullBodyDetected ? "POSTURE DETECTED ✓" : "ALIGNING POSTURE..."}
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

            {/* Countdown overlay */}
            {countdownActive && (
              <div className="hud-countdown-timer">
                <span>{countdown}</span>
              </div>
            )}

            <button type="button" className="scanner-back-arrow" onClick={() => { cleanupCamera(); setScanStep("front_prep"); }}>
              <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* 5. SIDE PREP */}
        {scanStep === "side_prep" && (
          <div className="scanner-body-content prep-content">
            <div className="guidance-silhouette-box side-guide">
              <div className="dotted-silhouette-side" />
            </div>
            <h3>Step 2: Profile Side Scan</h3>
            <p className="prep-subtext">Turn 90 degrees right so your profile faces the camera. Position full body within constraints.</p>

            <div className="prep-bullet-box">
              <div className="prep-bullet">
                <span className="bullet-num">1</span>
                <span>Ensure your shoulders, hips, and ankles are clear in side-view.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">2</span>
                <span>Keep natural standing posture without leaning forwards.</span>
              </div>
            </div>

            <div className="split-action-row">
              <button type="button" className="scanner-sec-btn" onClick={() => setScanStep("front_prep")}>
                RETAKE FRONT
              </button>
              <button type="button" className="scanner-primary-btn" onClick={() => setScanStep("side_scan")}>
                OPEN SIDE CAMERA
              </button>
            </div>
          </div>
        )}

        {/* 6. SIDE CAMERA SCAN ACTIVE */}
        {scanStep === "side_scan" && (
          <div className="scanner-camera-viewport">
            <video ref={videoRef} className="hidden-video" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="scanner-canvas" />

            {/* Silhouette Outline overlay */}
            <div className="overlay-silhouette-side" />

            {/* Flash Overlay */}
            <div className={`camera-flash-overlay ${flashActive ? "active" : ""}`} />

            {/* Floating guidance HUD */}
            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                {fullBodyDetected ? "POSTURE DETECTED ✓" : "ALIGNING POSTURE..."}
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

            {/* Countdown overlay */}
            {countdownActive && (
              <div className="hud-countdown-timer">
                <span>{countdown}</span>
              </div>
            )}

            <button type="button" className="scanner-back-arrow" onClick={() => { cleanupCamera(); setScanStep("side_prep"); }}>
              <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* 7. PROCESSING */}
        {scanStep === "processing" && (
          <div className="scanner-body-content loader-content">
            <div className="processing-scan-graphic">
              <div className="skeleton-outline-rendering" />
              <div className="horizontal-scan-ray" />
            </div>
            <h3>Computing Body Profile</h3>
            <p>Analyzing depth aspect-ratios and calibrating custom circumferences...</p>
          </div>
        )}

        {/* 8. RESULTS POPUP */}
        {scanStep === "results" && measurements && (
          <div className="scanner-body-content results-content">
            <div className="results-badge-success">
              <CheckCircle size={16} />
              <span>YOUR MEASUREMENTS ✓</span>
            </div>

            <p className="results-intro-text">
              These are your estimated body measurements. Adjust individual values before applying them to your atelier profile.
            </p>

            <div className="measurements-adjustment-list">
              {/* Height Row */}
              <div className="measurement-row">
                <span className="m-label">Height</span>
                <span className="m-value">{formatCmToFtIn(measurements.height)} ({measurements.height} cm)</span>
                <div className="m-controls-placeholder">Calibrated</div>
              </div>

              {/* Shoulders Row */}
              <div className="measurement-row">
                <span className="m-label">Shoulder Width</span>
                <span className="m-value">{cmToInchesString(measurements.shoulderWidth)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("shoulderWidth", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("shoulderWidth", true)}>+</button>
                </div>
              </div>

              {/* Chest Row */}
              <div className="measurement-row">
                <span className="m-label">Chest / Bust</span>
                <span className="m-value">{cmToInchesString(measurements.chest)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("chest", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("chest", true)}>+</button>
                </div>
              </div>

              {/* Waist Row */}
              <div className="measurement-row">
                <span className="m-label">Waist</span>
                <span className="m-value">{cmToInchesString(measurements.waist)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("waist", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("waist", true)}>+</button>
                </div>
              </div>

              {/* Hips Row */}
              <div className="measurement-row">
                <span className="m-label">Hips</span>
                <span className="m-value">{cmToInchesString(measurements.hip)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("hip", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("hip", true)}>+</button>
                </div>
              </div>

              {/* Arm Length Row */}
              <div className="measurement-row">
                <span className="m-label">Arm Length</span>
                <span className="m-value">{cmToInchesString(measurements.armLength)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("armLength", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("armLength", true)}>+</button>
                </div>
              </div>

              {/* Inseam Row */}
              <div className="measurement-row">
                <span className="m-label">Inseam</span>
                <span className="m-value">{cmToInchesString(measurements.inseam)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("inseam", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("inseam", true)}>+</button>
                </div>
              </div>

              {/* Torso Length Row */}
              <div className="measurement-row">
                <span className="m-label">Torso Length</span>
                <span className="m-value">{cmToInchesString(measurements.torsoLength)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("torsoLength", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("torsoLength", true)}>+</button>
                </div>
              </div>
            </div>

            <div className="results-privacy-warning">
              Estimated measurements. Camera frames have been processed entirely on-device and have not left your terminal.
            </div>

            <button type="button" className="scanner-primary-btn" onClick={handleUseMeasurements}>
              USE MEASUREMENTS
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default BodyScanner;
