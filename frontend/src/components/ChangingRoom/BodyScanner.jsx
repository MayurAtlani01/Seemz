import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Camera, RefreshCw, AlertCircle, CheckCircle, ChevronLeft, FlipHorizontal, Sparkles } from "lucide-react";
import { mapMeasurementsToAvatarParams } from "../../services/changingRoom/avatarEngine";
import "./BodyScanner.css";

// Dynamic CDN link for MediaPipe Pose
const POSE_JS_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";

// Luxury Color Swatches for the Live Try-On Garment
const GARMENT_COLORS = [
  { id: "noir", name: "Noir Black", hex: "#121214", border: "#333338" },
  { id: "atelier-white", name: "Atelier White", hex: "#F3F3F5", border: "#E0E0E5" },
  { id: "charcoal", name: "Charcoal Grey", hex: "#2A2D34", border: "#454954" },
  { id: "burgundy", name: "Deep Crimson", hex: "#54161B", border: "#782229" },
  { id: "olive", name: "Atelier Olive", hex: "#27382B", border: "#3D5743" },
];

function BodyScanner({ initialGender = "men", initialStep = "setup", onClose, onSave }) {
  const navigate = useNavigate();

  // Setup States
  const [gender, setGender] = useState(initialGender);
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [heightCm, setHeightCm] = useState("178");
  const [useMetric, setUseMetric] = useState(false);

  // Scanner Steps: "setup" | "loading" | "front_prep" | "front_scan" | "side_prep" | "side_scan" | "processing" | "results" | "live_tryon"
  const [scanStep, setScanStep] = useState(initialStep);
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

  // Live Try-On Customization
  const [selectedColor, setSelectedColor] = useState(GARMENT_COLORS[0]);
  const [facingMode, setFacingMode] = useState("user"); // "user" | "environment"
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Refs for video, canvas, camera, and active pose model
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseModelRef = useRef(null);
  const streamRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const activeLoopRef = useRef(false);
  const frameCollectionRef = useRef([]);
  const prevLandmarksRef = useRef(null);

  // Live Try-On EMA Smoothing State Refs (prevents jitter)
  const smoothedPoseRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;

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

  // Check available cameras
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.().then((devices) => {
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoInputs.length > 1);
    }).catch(() => {});
  }, []);

  const getCameraDeviceId = async (mode) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      if (videoDevices.length <= 1) return null;

      if (mode === "user") {
        const frontCameras = videoDevices.filter((d) => {
          const label = d.label.toLowerCase();
          return label.includes("front") || label.includes("user") || label.includes("selfie");
        });
        if (frontCameras.length === 0) return null;
        // Avoid ultra-wide (0.5x)
        const standardFront = frontCameras.find((d) => {
          const label = d.label.toLowerCase();
          return !label.includes("ultra") && !label.includes("wide") && !label.includes("0.5x");
        });
        return standardFront ? standardFront.deviceId : frontCameras[0].deviceId;
      } else {
        const backCameras = videoDevices.filter((d) => {
          const label = d.label.toLowerCase();
          return label.includes("back") || label.includes("rear") || label.includes("environment");
        });
        return backCameras.length > 0 ? backCameras[0].deviceId : null;
      }
    } catch (err) {
      console.warn("Failed to enumerate video devices:", err);
      return null;
    }
  };

  const startScannerLifecycle = async () => {
    setScanStep("loading");
    setErrorMessage("");

    try {
      await loadScript(POSE_JS_URL);
      if (!window.Pose) {
        throw new Error("MediaPipe Pose library failed to initialize from CDN.");
      }
      setModelLoaded(true);
      setScanStep("front_prep");
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load computer-vision assets. Please check your connection.");
      setScanStep("setup");
    }
  };

  // Start Camera and bind MediaPipe Pose instance with Segmentation
  const startCamera = async (overrideFacingMode) => {
    console.log("[LiveTryOn] Initializing camera start...");
    setCameraLoading(true);
    setErrorMessage("");
    const targetFacing = overrideFacingMode || facingMode;

    // 1. Cleanup any previous running stream
    if (streamRef.current) {
      console.log("[LiveTryOn] Cleaning up existing stream tracks");
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 2. Verify mediaDevices availability
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.error("[LiveTryOn] mediaDevices.getUserMedia not available in this browser context");
      setErrorMessage("Camera access is not supported in this browser. Please use Chrome, Edge, or Safari over HTTPS.");
      setCameraLoading(false);
      return;
    }

    console.log("[LiveTryOn] mediaDevices available: true. Requesting camera permission for facingMode:", targetFacing);

    try {
      let stream = null;
      let lastErr = null;

      // Construct sequential constraint tiers
      const constraintsList = [
        {
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        {
          video: {
            facingMode: targetFacing
          },
          audio: false
        },
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];

      for (const constraints of constraintsList) {
        try {
          console.log("[LiveTryOn] Requesting camera with constraints:", JSON.stringify(constraints.video));
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) {
            console.log("[LiveTryOn] Camera stream received successfully!");
            break;
          }
        } catch (err) {
          console.warn("[LiveTryOn] Constraint tier failed:", err.name, err.message);
          lastErr = err;
        }
      }

      if (!stream) {
        throw lastErr || new Error("Failed to acquire video stream from any constraint tier.");
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        console.error("[LiveTryOn] videoRef.current is null when stream acquired");
        setErrorMessage("Video display element failed to initialize. Please retry.");
        setCameraLoading(false);
        return;
      }

      console.log("[LiveTryOn] Video element connected, assigning srcObject");
      video.srcObject = stream;

      // Ensure video is playing and metadata is available without race conditions
      await new Promise((resolve) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.onloadeddata = () => resolve();
          video.onloadedmetadata = () => resolve();
          video.oncanplay = () => resolve();
          setTimeout(resolve, 800); // 800ms safety timeout
        }
      });

      try {
        await video.play();
        console.log("[LiveTryOn] Video playback started successfully. Frame size:", video.videoWidth, "x", video.videoHeight);
      } catch (playErr) {
        console.warn("[LiveTryOn] video.play() warning:", playErr.name, playErr.message);
      }

      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;

      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement("canvas");
      }
      maskCanvasRef.current.width = videoWidth;
      maskCanvasRef.current.height = videoHeight;

      setCameraLoading(false);
      activeLoopRef.current = true;
      requestAnimationFrame(processFrameLoop);

      // Initialize MediaPipe Pose instance with full segmentation
      if (!poseModelRef.current && window.Pose) {
        console.log("[LiveTryOn] Initializing MediaPipe Pose instance...");
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true,
          smoothSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults(onPoseResults);
        await pose.initialize?.();
        poseModelRef.current = pose;
        console.log("[LiveTryOn] MediaPipe Pose ready");
      }

    } catch (err) {
      console.error("[LiveTryOn] Camera error:", err.name, err.message);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera access is required for Live Try-On. Please allow camera permissions in your browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage("No camera detected. Please connect a webcam or enable your camera device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMessage("Camera is currently in use by another application or browser tab. Please close other camera apps and retry.");
      } else {
        setErrorMessage(`Camera error: ${err.message || err.name || "Unable to access camera"}. Please allow camera access.`);
      }
      cleanupCamera();
      setCameraLoading(false);
    }
  };

  const processFrameLoop = async () => {
    if (!activeLoopRef.current) return;
    const video = videoRef.current;
    if (poseModelRef.current && video && video.readyState >= 2 && !video.paused) {
      try {
        await poseModelRef.current.send({ image: video });
      } catch (err) {
        console.error("Error sending frame to MediaPipe:", err);
      }
    }
    if (activeLoopRef.current) {
      requestAnimationFrame(processFrameLoop);
    }
  };

  // Flip Camera on mobile devices
  const handleToggleCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    cleanupCamera();
    startCamera(nextFacing);
  };

  // Exponential Moving Average (EMA) smoothing for landmark coordinates (eliminates webcam noise jitter)
  const smoothLandmarks = (rawLandmarks, alpha = 0.4) => {
    if (!smoothedPoseRef.current) {
      smoothedPoseRef.current = rawLandmarks.map((lm) => ({ ...lm }));
      return smoothedPoseRef.current;
    }

    const smoothed = rawLandmarks.map((curr, i) => {
      const prev = smoothedPoseRef.current[i] || curr;
      return {
        x: prev.x * (1 - alpha) + curr.x * alpha,
        y: prev.y * (1 - alpha) + curr.y * alpha,
        z: (prev.z || 0) * (1 - alpha) + (curr.z || 0) * alpha,
        visibility: curr.visibility
      };
    });

    smoothedPoseRef.current = smoothed;
    return smoothed;
  };

  // Callback from MediaPipe Pose model
  const onPoseResults = (results) => {
    const step = scanStepRef.current;
    if (!canvasRef.current || !videoRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    // 1. Draw camera video feed (mirrored for selfie mode)
    const isMirrored = facingMode === "user";
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

    // 2. Handle Live Try-On Step with Parametric Garment Fitting & Occlusion
    if (step === "live_tryon") {
      handleLiveTryOnRender(ctx, results, width, height, isMirrored);
      return;
    }

    // 3. Handle Body Scanner (Front & Side Scan)
    if (step === "front_scan" || step === "side_scan") {
      handleBodyScannerRender(ctx, results, width, height, step, isMirrored);
    }
  };

  // =========================================================================
  // LIVE TRY-ON RENDERING PIPELINE (High-Performance Landmark Fitting + Occlusion)
  // =========================================================================
  const handleLiveTryOnRender = (ctx, results, width, height, isMirrored) => {
    if (!results.poseLandmarks) {
      setFullBodyDetected(false);
      setGuidanceText("Move into the camera frame.");
      return;
    }

    // Smooth landmarks to eliminate jitter
    const rawLandmarks = results.poseLandmarks;
    const landmarks = smoothLandmarks(rawLandmarks, 0.4);

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const minVis = 0.45;
    const upperBodyVisible =
      leftShoulder.visibility > minVis &&
      rightShoulder.visibility > minVis &&
      leftHip.visibility > minVis &&
      rightHip.visibility > minVis;

    if (!upperBodyVisible) {
      setFullBodyDetected(false);
      setGuidanceText("Make sure your upper body and shoulders are visible.");
      return;
    }

    // Coordinate conversion (accounting for selfie mirror)
    const mapPoint = (lm) => {
      const px = isMirrored ? (1 - lm.x) * width : lm.x * width;
      const py = lm.y * height;
      return { x: px, y: py, z: lm.z, vis: lm.visibility };
    };

    const sL = mapPoint(leftShoulder);
    const sR = mapPoint(rightShoulder);
    const hL = mapPoint(leftHip);
    const hR = mapPoint(rightHip);
    const eL = mapPoint(leftElbow);
    const eR = mapPoint(rightElbow);
    const wL = mapPoint(leftWrist);
    const wR = mapPoint(rightWrist);
    const n = mapPoint(nose);

    // Anatomical Geometry Measurements
    const shoulderSpan = Math.hypot(sL.x - sR.x, sL.y - sR.y);
    const shoulderWidthRatio = shoulderSpan / width;

    // Real-Time Distance & Bounds Checks
    if (shoulderWidthRatio < 0.16) {
      setFullBodyDetected(false);
      setGuidanceText("Move closer to the camera.");
      return;
    } else if (shoulderWidthRatio > 0.75) {
      setFullBodyDetected(false);
      setGuidanceText("Step back slightly.");
      return;
    } else {
      setFullBodyDetected(true);
      setGuidanceText("BODY DETECTED ✓");
    }

    // 1. Draw Fitted Parametric Seemz Luxury T-Shirt
    const currentColor = selectedColorRef.current || GARMENT_COLORS[0];
    drawParametricTShirt(ctx, {
      sL, sR, hL, hR, eL, eR, n,
      color: currentColor,
      isMirrored
    });

    // 2. Perform Real-Time Arm/Foreground Occlusion using MediaPipe Segmentation
    if (results.segmentationMask && maskCanvasRef.current) {
      applyArmAndHeadOcclusion(ctx, results, { sL, sR, hL, hR, eL, eR, wL, wR, n }, width, height, isMirrored);
    }
  };

  // Draws a realistic luxury atelier T-shirt fitted across anatomical landmarks
  const drawParametricTShirt = (ctx, { sL, sR, hL, hR, eL, eR, n, color, isMirrored }) => {
    ctx.save();

    // Key anatomical vectors
    const midShoulder = { x: (sL.x + sR.x) / 2, y: (sL.y + sR.y) / 2 };
    const midHip = { x: (hL.x + hR.x) / 2, y: (hL.y + hR.y) / 2 };
    
    // Shoulder vector & orientation
    const dx = sL.x - sR.x;
    const dy = sL.y - sR.y;
    const shoulderLen = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Dynamic ease & drape margins
    const easeX = shoulderLen * 0.18; // atelier relaxed drape
    const sleeveLength = shoulderLen * 0.42;
    const hemExtension = shoulderLen * 0.25;

    // Torso anchor positions
    const collarCenter = {
      x: midShoulder.x,
      y: midShoulder.y + shoulderLen * 0.08
    };

    const leftShoulderTip = {
      x: sL.x + Math.cos(angle) * easeX,
      y: sL.y + Math.sin(angle) * easeX
    };

    const rightShoulderTip = {
      x: sR.x - Math.cos(angle) * easeX,
      y: sR.y - Math.sin(angle) * easeX
    };

    // Sleeve Endpoints (projected toward elbows)
    const sleeveL = eL.vis > 0.4 ? {
      x: leftShoulderTip.x + (eL.x - sL.x) * 0.65,
      y: leftShoulderTip.y + (eL.y - sL.y) * 0.65
    } : {
      x: leftShoulderTip.x + Math.cos(angle + 0.6) * sleeveLength,
      y: leftShoulderTip.y + Math.sin(angle + 0.6) * sleeveLength
    };

    const sleeveR = eR.vis > 0.4 ? {
      x: rightShoulderTip.x + (eR.x - sR.x) * 0.65,
      y: rightShoulderTip.y + (eR.y - sR.y) * 0.65
    } : {
      x: rightShoulderTip.x - Math.cos(angle - 0.6) * sleeveLength,
      y: rightShoulderTip.y - Math.sin(angle - 0.6) * sleeveLength
    };

    const underarmL = {
      x: sL.x + Math.cos(angle + 1.5) * (shoulderLen * 0.35),
      y: sL.y + Math.sin(angle + 1.5) * (shoulderLen * 0.35)
    };

    const underarmR = {
      x: sR.x + Math.cos(angle - 1.5) * (shoulderLen * 0.35),
      y: sR.y + Math.sin(angle - 1.5) * (shoulderLen * 0.35)
    };

    const hemL = {
      x: hL.x + Math.cos(angle) * (easeX * 0.9),
      y: Math.max(hL.y, midHip.y) + hemExtension
    };

    const hemR = {
      x: hR.x - Math.cos(angle) * (easeX * 0.9),
      y: Math.max(hR.y, midHip.y) + hemExtension
    };

    // 1. Draw Garment Body Contour Path
    ctx.beginPath();
    // Collar Curve
    ctx.moveTo(rightShoulderTip.x + Math.cos(angle) * (shoulderLen * 0.15), rightShoulderTip.y + Math.sin(angle) * (shoulderLen * 0.15));
    ctx.quadraticCurveTo(collarCenter.x, collarCenter.y + shoulderLen * 0.22, leftShoulderTip.x - Math.cos(angle) * (shoulderLen * 0.15), leftShoulderTip.y - Math.sin(angle) * (shoulderLen * 0.15));
    
    // Left Shoulder Seam & Left Sleeve
    ctx.lineTo(leftShoulderTip.x, leftShoulderTip.y);
    ctx.lineTo(sleeveL.x, sleeveL.y);
    ctx.lineTo(underarmL.x, underarmL.y);

    // Left Torso Side Seam to Hem
    ctx.quadraticCurveTo(hL.x + easeX * 0.5, (underarmL.y + hemL.y) / 2, hemL.x, hemL.y);

    // Bottom Hem Drape Curve
    ctx.quadraticCurveTo(midHip.x, midHip.y + hemExtension + shoulderLen * 0.06, hemR.x, hemR.y);

    // Right Torso Side Seam
    ctx.quadraticCurveTo(hR.x - easeX * 0.5, (underarmR.y + hemR.y) / 2, underarmR.x, underarmR.y);

    // Right Sleeve & Shoulder Seam
    ctx.lineTo(sleeveR.x, sleeveR.y);
    ctx.lineTo(rightShoulderTip.x, rightShoulderTip.y);
    ctx.closePath();

    // 2. Fill Fabric with Realistic Depth Gradient & Shading
    const fabricGradient = ctx.createLinearGradient(rightShoulderTip.x, rightShoulderTip.y, hemL.x, hemL.y);
    if (color.id === "atelier-white") {
      fabricGradient.addColorStop(0, "#FFFFFF");
      fabricGradient.addColorStop(0.5, "#EEEEF2");
      fabricGradient.addColorStop(1, "#DCDCE2");
    } else {
      fabricGradient.addColorStop(0, color.hex);
      fabricGradient.addColorStop(0.5, adjustHexBrightness(color.hex, 1.15));
      fabricGradient.addColorStop(1, adjustHexBrightness(color.hex, 0.85));
    }

    ctx.fillStyle = fabricGradient;
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    // 3. Subtle Atelier Seam Highlights & Neckband
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = color.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Collar Ribbing Contour
    ctx.beginPath();
    ctx.moveTo(rightShoulderTip.x + Math.cos(angle) * (shoulderLen * 0.15), rightShoulderTip.y + Math.sin(angle) * (shoulderLen * 0.15));
    ctx.quadraticCurveTo(collarCenter.x, collarCenter.y + shoulderLen * 0.25, leftShoulderTip.x - Math.cos(angle) * (shoulderLen * 0.15), leftShoulderTip.y - Math.sin(angle) * (shoulderLen * 0.15));
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Seemz Minimalist Micro Logo on Chest
    const logoX = isMirrored ? sR.x + (sL.x - sR.x) * 0.28 : sL.x + (sR.x - sL.x) * 0.28;
    const logoY = midShoulder.y + shoulderLen * 0.38;
    ctx.fillStyle = color.id === "atelier-white" ? "#111111" : "rgba(255, 255, 255, 0.85)";
    ctx.font = `600 ${Math.max(8, Math.round(shoulderLen * 0.042))}px 'Inter', sans-serif`;
    ctx.letterSpacing = "2px";
    ctx.fillText("SEEMZ", logoX, logoY);

    ctx.restore();
  };

  // Composites real-time foreground arms & head over the rendered T-shirt
  const applyArmAndHeadOcclusion = (ctx, results, coords, width, height, isMirrored) => {
    const { eL, eR, wL, wR, n, sL, sR } = coords;
    
    // Check if hands/forearms are positioned in front of the torso region
    const leftArmInFront = (wL.vis > 0.5 && wL.y < coords.hL.y && wL.y > sL.y) || (eL.vis > 0.5 && Math.abs(eL.x - coords.hL.x) < 40);
    const rightArmInFront = (wR.vis > 0.5 && wR.y < coords.hR.y && wR.y > sR.y) || (eR.vis > 0.5 && Math.abs(eR.x - coords.hR.x) < 40);

    if (leftArmInFront || rightArmInFront || n.vis > 0.7) {
      const maskCtx = maskCanvasRef.current.getContext("2d");
      maskCtx.clearRect(0, 0, width, height);

      // Draw MediaPipe segmentation mask
      maskCtx.save();
      if (isMirrored) {
        maskCtx.translate(width, 0);
        maskCtx.scale(-1, 1);
      }
      maskCtx.drawImage(results.segmentationMask, 0, 0, width, height);
      maskCtx.restore();

      // Clip mask specifically to foreground arm & neck bounding zones
      ctx.save();
      // Draw neck/chin foreground
      if (n.vis > 0.7) {
        ctx.beginPath();
        ctx.arc(n.x, n.y + (sL.y - n.y) * 0.45, Math.hypot(sL.x - sR.x, sL.y - sR.y) * 0.18, 0, 2 * Math.PI);
        ctx.clip();
        ctx.save();
        if (isMirrored) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(results.image, 0, 0, width, height);
        ctx.restore();
      }

      // Draw Left Forearm Foreground if in front of chest
      if (leftArmInFront && wL.vis > 0.5 && eL.vis > 0.5) {
        ctx.beginPath();
        ctx.arc(wL.x, wL.y, 35, 0, 2 * Math.PI);
        ctx.arc(eL.x, eL.y, 30, 0, 2 * Math.PI);
        ctx.clip();
        ctx.save();
        if (isMirrored) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(results.image, 0, 0, width, height);
        ctx.restore();
      }

      // Draw Right Forearm Foreground if in front of chest
      if (rightArmInFront && wR.vis > 0.5 && eR.vis > 0.5) {
        ctx.beginPath();
        ctx.arc(wR.x, wR.y, 35, 0, 2 * Math.PI);
        ctx.arc(eR.x, eR.y, 30, 0, 2 * Math.PI);
        ctx.clip();
        ctx.save();
        if (isMirrored) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(results.image, 0, 0, width, height);
        ctx.restore();
      }

      ctx.restore();
    }
  };

  const adjustHexBrightness = (hex, factor) => {
    let num = parseInt(hex.replace("#", ""), 16);
    let r = Math.min(255, Math.round(((num >> 16) & 0xff) * factor));
    let g = Math.min(255, Math.round(((num >> 8) & 0xff) * factor));
    let b = Math.min(255, Math.round((num & 0xff) * factor));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // =========================================================================
  // BODY SCANNER CALIBRATION SCAN PIPELINE
  // =========================================================================
  const handleBodyScannerRender = (ctx, results, width, height, step, isMirrored) => {
    if (results.poseLandmarks) {
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

      const minVisibility = 0.65;

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
        
        let isStable = true;
        if (prevLandmarksRef.current) {
          let totalShift = 0;
          let count = 0;
          [11, 12, 23, 24].forEach((idx) => {
            const current = landmarks[idx];
            const prev = prevLandmarksRef.current[idx];
            if (current && prev) {
              totalShift += Math.hypot(current.x - prev.x, current.y - prev.y);
              count++;
            }
          });
          const avgShift = count > 0 ? totalShift / count : 0;
          
          if (avgShift > 0.02) {
            isStable = false;
            setGuidanceText("Moving too much! Stand still.");
          }
        }
        
        prevLandmarksRef.current = landmarks;

        if (isStable) {
          if (!countdownActiveRef.current) {
            triggerCountdown();
          } else {
            collectFrameData(landmarks, step);
          }
        } else {
          resetCountdown();
        }
      } else {
        setGuidanceText(
          step === "front_scan"
            ? "Ankles or head not fully visible. Please step back."
            : "Turn sideways. Position profile inside outline guide."
        );
        resetCountdown();
      }

      drawSkeletonFeedback(ctx, landmarks, isAligned, width, height);
    } else {
      setFullBodyDetected(false);
      setGuidanceText("No body detected in camera frame.");
      resetCountdown();
    }
  };

  const drawSkeletonFeedback = (ctx, landmarks, isAligned, width, height) => {
    const color = isAligned ? "#ffffff" : "rgba(255, 255, 255, 0.35)";
    
    // Key joint dots
    [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
      const lm = landmarks[idx];
      if (lm && lm.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc((1 - lm.x) * width, lm.y * height, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });

    // Connection lines
    const connections = [
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], 
      [11, 23], [12, 24], [23, 24], 
      [23, 25], [25, 27], [24, 26], [26, 28] 
    ];

    ctx.strokeStyle = color;
    ctx.lineWidth = isAligned ? 2.5 : 1.5;
    connections.forEach(([i1, i2]) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      }
    });
  };

  const triggerCountdown = () => {
    setCountdownActive(true);
    setCountdown(3);
    frameCollectionRef.current = [];
    prevLandmarksRef.current = null;
    
    let timer = 3;
    countdownIntervalRef.current = setInterval(() => {
      timer -= 1;
      setCountdown(timer);

      if (timer <= 0) {
        clearInterval(countdownIntervalRef.current);
        finishScanCapture();
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

  const collectFrameData = (landmarks, step) => {
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const leftHeel = landmarks[29];
    const rightHeel = landmarks[30];

    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    if (step === "front_scan") {
      const shoulderDist = dist(leftShoulder, rightShoulder);
      const headY = nose.y - shoulderDist * 0.72;
      const feetY = Math.max(leftAnkle.y, rightAnkle.y, leftHeel.y, rightHeel.y);
      const heightCoords = feetY - headY;

      const shoulderWidthCoords = shoulderDist;
      const torsoLengthCoords = dist(
        { x: (leftShoulder.x + rightShoulder.x)/2, y: (leftShoulder.y + rightShoulder.y)/2 },
        { x: (leftHip.x + rightHip.x)/2, y: (leftHip.y + rightHip.y)/2 }
      );
      
      const leftArm = dist(leftShoulder, landmarks[13]) + dist(landmarks[13], landmarks[15]);
      const rightArm = dist(rightShoulder, landmarks[14]) + dist(landmarks[14], landmarks[16]);
      const armLengthCoords = Math.max(leftArm, rightArm);
      
      const inseamCoords = dist(
        { x: (leftHip.x + rightHip.x)/2, y: (leftHip.y + rightHip.y)/2 },
        { x: (leftAnkle.x + rightAnkle.x)/2, y: (leftAnkle.y + rightAnkle.y)/2 }
      );

      const frontChestWidthCoords = shoulderDist * 0.90;
      const frontWaistWidthCoords = dist(leftHip, rightHip) * 0.94;
      const frontHipWidthCoords = dist(leftHip, rightHip) * 1.28;

      frameCollectionRef.current.push({
        heightCoords,
        shoulderWidthCoords,
        torsoLengthCoords,
        armLengthCoords,
        inseamCoords,
        frontChestWidthCoords,
        frontWaistWidthCoords,
        frontHipWidthCoords
      });
    } else if (step === "side_scan") {
      const shoulderS = landmarks[11] || landmarks[12];
      const hipS = landmarks[23] || landmarks[24];
      const kneeS = landmarks[25] || landmarks[26];
      const ankleS = landmarks[27] || landmarks[28];
      const heelS = landmarks[29] || landmarks[30];

      const headY = nose.y - 0.15; 
      const feetY = Math.max(ankleS.y, heelS.y);
      const heightCoords = feetY - headY;

      const sideChestDepthCoords = Math.max(0.08, Math.abs(nose.x - shoulderS.x)) * 1.8;
      const sideWaistDepthCoords = Math.max(0.08, Math.abs(hipS.x - kneeS.x)) * 0.65;
      const sideHipDepthCoords = Math.max(0.10, Math.abs(hipS.x - kneeS.x)) * 0.85;

      frameCollectionRef.current.push({
        heightCoords,
        sideChestDepthCoords,
        sideWaistDepthCoords,
        sideHipDepthCoords
      });
    }
  };

  const finishScanCapture = () => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const step = scanStepRef.current;
    
    if (frameCollectionRef.current.length < 8) {
      console.warn("Insufficient stable frames collected.");
      alert("Scan jitter detected due to movement. Please stand still and try again.");
      resetCountdown();
      return;
    }

    if (step === "front_scan") {
      const aggregated = aggregateFront(frameCollectionRef.current);
      setFrontLandmarks(aggregated);
      cleanupCamera();
      setScanStep("side_prep");
    } else if (step === "side_scan") {
      const aggregated = aggregateSide(frameCollectionRef.current);
      setSideLandmarks(aggregated);
      cleanupCamera();
      setScanStep("processing");
    }
  };

  const getMedian = (arr) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const aggregateFront = (frames) => {
    return {
      heightCoords: getMedian(frames.map((f) => f.heightCoords)),
      shoulderWidthCoords: getMedian(frames.map((f) => f.shoulderWidthCoords)),
      armLengthCoords: getMedian(frames.map((f) => f.armLengthCoords)),
      torsoLengthCoords: getMedian(frames.map((f) => f.torsoLengthCoords)),
      inseamCoords: getMedian(frames.map((f) => f.inseamCoords)),
      frontChestWidthCoords: getMedian(frames.map((f) => f.frontChestWidthCoords)),
      frontWaistWidthCoords: getMedian(frames.map((f) => f.frontWaistWidthCoords)),
      frontHipWidthCoords: getMedian(frames.map((f) => f.frontHipWidthCoords)),
    };
  };

  const aggregateSide = (frames) => {
    return {
      heightCoords: getMedian(frames.map((f) => f.heightCoords)),
      sideChestDepthCoords: getMedian(frames.map((f) => f.sideChestDepthCoords)),
      sideWaistDepthCoords: getMedian(frames.map((f) => f.sideWaistDepthCoords)),
      sideHipDepthCoords: getMedian(frames.map((f) => f.sideHipDepthCoords)),
    };
  };

  useEffect(() => {
    if (scanStep === "processing") {
      const timer = setTimeout(() => {
        calculateMeasurements();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scanStep]);

  const calculateMeasurements = () => {
    if (!frontLandmarks || !sideLandmarks) {
      setErrorMessage("Scan data incomplete. Please reset scanner.");
      setScanStep("setup");
      return;
    }

    const heightVal = useMetric 
      ? parseFloat(heightCm) 
      : (parseInt(heightFt) * 12 + parseInt(heightIn)) * 2.54;

    const scaleFactorF = heightVal / frontLandmarks.heightCoords;
    const shoulderWidthCm = frontLandmarks.shoulderWidthCoords * scaleFactorF * 1.14;
    const torsoLengthCm = frontLandmarks.torsoLengthCoords * scaleFactorF;
    const armLengthCm = frontLandmarks.armLengthCoords * scaleFactorF * 1.05;
    const inseamCm = frontLandmarks.inseamCoords * scaleFactorF * 0.88;

    const frontChestWidth = shoulderWidthCm * 0.90;
    const frontWaistWidth = frontLandmarks.frontWaistWidthCoords * scaleFactorF;
    const frontHipWidth = frontLandmarks.frontHipWidthCoords * scaleFactorF;

    const scaleFactorS = heightVal / sideLandmarks.heightCoords;
    const sideChestDepth = sideLandmarks.sideChestDepthCoords * scaleFactorS;
    const sideWaistDepth = sideLandmarks.sideWaistDepthCoords * scaleFactorS;
    const sideHipDepth = sideLandmarks.sideHipDepthCoords * scaleFactorS;

    const ellipsePerimeter = (w, d) => {
      const a = w / 2;
      const b = d / 2;
      const term1 = 3 * (a + b);
      const term2 = Math.sqrt((3 * a + b) * (a + 3 * b));
      return Math.PI * (term1 - term2);
    };

    const chestCm = ellipsePerimeter(frontChestWidth, sideChestDepth);
    const waistCm = ellipsePerimeter(frontWaistWidth, sideWaistDepth);
    const hipCm = ellipsePerimeter(frontHipWidth, sideHipDepth);

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
      const diff = increment ? 1 : -1;
      return {
        ...prev,
        [field]: Math.max(10, prev[field] + diff)
      };
    });
  };

  const handleUseMeasurements = () => {
    if (!measurements) return;
    const avatarParams = mapMeasurementsToAvatarParams(measurements, gender);

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
    console.log("[LiveTryOn] Stopping camera tracks and cleaning stream");
    activeLoopRef.current = false;
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
    smoothedPoseRef.current = null;
    resetCountdown();
  };

  useEffect(() => {
    if (scanStep === "front_scan" || scanStep === "side_scan" || scanStep === "live_tryon") {
      // Start camera immediately so preview appears without delay
      startCamera();

      // Ensure MediaPipe is loaded in background
      if (!window.Pose) {
        loadScript(POSE_JS_URL)
          .then(() => {
            setModelLoaded(true);
            if (!poseModelRef.current && window.Pose && videoRef.current) {
              const pose = new window.Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
              });
              pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: true,
                smoothSegmentation: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
              });
              pose.onResults(onPoseResults);
              pose.initialize?.();
              poseModelRef.current = pose;
            }
          })
          .catch((err) => {
            console.warn("[LiveTryOn] MediaPipe background load warning:", err);
          });
      }
    }
    return () => {
      if (scanStep === "front_scan" || scanStep === "side_scan" || scanStep === "live_tryon") {
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
    return `~${Math.round(cm * 0.393701)}″`;
  };

  return (
    <div className="scanner-modal-overlay">
      <div className={`scanner-card step-${scanStep}`}>
        
        {/* HEADER */}
        <header className="scanner-header">
          <div className="scanner-header-left">
            <span className="scanner-eyebrow">
              {scanStep === "live_tryon" ? "SEEMZ LIVE ATELIER" : "SEEMZ AI ATELIER"}
            </span>
            <h2>{scanStep === "live_tryon" ? "Live Try-On (Beta)" : "Body Scanner"}</h2>
          </div>
          <div className="scanner-header-actions">
            {scanStep === "live_tryon" && hasMultipleCameras && (
              <button 
                type="button" 
                className="scanner-icon-action-btn" 
                onClick={handleToggleCamera} 
                title="Flip Camera"
              >
                <FlipHorizontal size={18} />
              </button>
            )}
            <button type="button" className="scanner-close-btn" onClick={onClose} title="Close">
              <X size={20} />
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
                <span>Stand far enough so your full body is visible inside the frame.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">2</span>
                <span>Stand straight with your feet fully visible.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">3</span>
                <span>Keep your arms slightly away from your body.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">4</span>
                <span>Use good lighting for best detection.</span>
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

            <div className="overlay-silhouette-front" />
            <div className={`camera-flash-overlay ${flashActive ? "active" : ""}`} />

            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                {fullBodyDetected ? "POSTURE DETECTED ✓" : "ALIGNING POSTURE..."}
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

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
                <span>Turn sideways and stand straight.</span>
              </div>
              <div className="prep-bullet">
                <span className="bullet-num">2</span>
                <span>Keep your body straight without leaning forwards or backwards.</span>
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

            <div className="overlay-silhouette-side" />
            <div className={`camera-flash-overlay ${flashActive ? "active" : ""}`} />

            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                {fullBodyDetected ? "POSTURE DETECTED ✓" : "ALIGNING POSTURE..."}
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

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
            <p>Aggregating median stable landmarks and calculating custom circumferences...</p>
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
              These are your estimated measurements. Feel free to refine individual values before applying them.
            </p>

            <div className="measurements-adjustment-list">
              <div className="measurement-row">
                <span className="m-label">Height</span>
                <span className="m-value">{formatCmToFtIn(measurements.height)} ({measurements.height} cm)</span>
                <div className="m-controls-placeholder">Calibrated</div>
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
                <span className="m-label">Chest</span>
                <span className="m-value">{cmToInchesString(measurements.chest)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("chest", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("chest", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Waist</span>
                <span className="m-value">{cmToInchesString(measurements.waist)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("waist", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("waist", true)}>+</button>
                </div>
              </div>

              <div className="measurement-row">
                <span className="m-label">Hips</span>
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
                <span className="m-label">Torso Length</span>
                <span className="m-value">{cmToInchesString(measurements.torsoLength)}</span>
                <div className="m-actions">
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("torsoLength", false)}>-</button>
                  <button type="button" className="adjust-btn" onClick={() => handleUpdateMeasurement("torsoLength", true)}>+</button>
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
            </div>

            <div className="results-privacy-warning">
              Estimated measurements. Processing is entirely on-device. Camera frames do not leave your terminal.
            </div>

            <div className="results-actions-row">
              <button type="button" className="scanner-sec-btn ar-btn" onClick={() => { cleanupCamera(); setScanStep("live_tryon"); }}>
                <Sparkles size={14} />
                <span>LIVE TRY-ON (BETA)</span>
              </button>
              <button type="button" className="scanner-primary-btn" onClick={handleUseMeasurements}>
                USE MEASUREMENTS
              </button>
            </div>
          </div>
        )}

        {/* 9. REAL-TIME HIGH PERFORMANCE LIVE TRY-ON */}
        {scanStep === "live_tryon" && (
          <div className="scanner-camera-viewport live-tryon-viewport">
            <video ref={videoRef} className="live-tryon-video" playsInline muted autoPlay />
            <canvas ref={canvasRef} width={640} height={480} className="live-tryon-canvas" />

            {cameraLoading && (
              <div className="tryon-camera-loading-overlay">
                <RefreshCw className="spinner-icon" size={32} />
                <span>Activating camera stream...</span>
              </div>
            )}

            {/* Dynamic Status HUD */}
            <div className="scanner-hud-overlay">
              <div className={`hud-status-badge ${fullBodyDetected ? "ready" : "warning"}`}>
                <span className="pulse-dot" />
                <span>{fullBodyDetected ? "BODY DETECTED ✓" : "ALIGNING..."}</span>
              </div>
              <p className="hud-guidance-text">{guidanceText}</p>
            </div>

            {/* Floating Live Try-On Controls Bar */}
            <div className="live-tryon-floating-controls">
              <div className="tryon-swatches-selector">
                <span className="swatches-label">Garment Color</span>
                <div className="swatches-row">
                  {GARMENT_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      className={`tryon-swatch-btn ${selectedColor.id === col.id ? "active" : ""}`}
                      style={{ backgroundColor: col.hex }}
                      onClick={() => setSelectedColor(col)}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>

              <div className="tryon-actions-row">
                <button
                  type="button"
                  className="scanner-sec-btn tryon-back-btn"
                  onClick={() => {
                    cleanupCamera();
                    setScanStep(measurements ? "results" : "setup");
                  }}
                >
                  {measurements ? "BACK TO RESULTS" : "EXIT TRY-ON"}
                </button>
                <button
                  type="button"
                  className="scanner-primary-btn tryon-save-btn"
                  onClick={handleUseMeasurements}
                >
                  SAVE & CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default BodyScanner;
