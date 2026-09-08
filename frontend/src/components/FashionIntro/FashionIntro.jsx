import React, { useState, useEffect, useRef, useCallback } from "react";
import "./FashionIntro.css";
import { ArrowDown } from "lucide-react";

import standDesktop from "../../assets/intro/stand.jpg";
import trousersDesktop from "../../assets/intro/trousers.jpg";
import teeDesktop from "../../assets/intro/tee.jpg";
import overcoatDesktop from "../../assets/intro/overcoat.jpg";
import bootsDesktop from "../../assets/intro/boots.jpg";
import completeDesktop from "../../assets/intro/complete.jpg";

import standMobile from "../../assets/intro/stand_mobile.jpg";
import trousersMobile from "../../assets/intro/trousers_mobile.jpg";
import teeMobile from "../../assets/intro/tee_mobile.jpg";
import overcoatMobile from "../../assets/intro/overcoat_mobile.jpg";
import bootsMobile from "../../assets/intro/boots_mobile.jpg";
import completeMobile from "../../assets/intro/complete_mobile.jpg";

/**
 * FashionIntro — Ultra-Luxury Scroll-Driven Cinematic Fashion Opening for SEEMZ Studio.
 */

const STAGES = [
  {
    id: "stand",
    number: "01",
    label: "THE ARMATURE",
    garment: "Atelier Tailor Stand",
    spec: "Dark Ash & Brushed Titanium",
    description: "Every iconic silhouette begins with architectural precision. An armature designed to anchor modern tailoring.",
    tagline: "Structure // Stained Ash & Metal",
    desktopSrc: standDesktop,
    mobileSrc: standMobile,
    hotspot: { top: "45%", left: "50%", label: "01 // TITANIUM ARMATURE" },
  },
  {
    id: "trousers",
    number: "02",
    label: "LOWER PROPORTION",
    garment: "Pleated Wide-Leg Trousers",
    spec: "100% Merino Wool • 380 GSM",
    description: "Tailored with a high-rise waist and deep front pleats. The fluid wide leg falls naturally with a clean sculptural break.",
    tagline: "Midnight Charcoal // Merino Wool",
    desktopSrc: trousersDesktop,
    mobileSrc: trousersMobile,
    hotspot: { top: "60%", left: "50%", label: "02 // MERINO WOOL PLEATS" },
  },
  {
    id: "tee",
    number: "03",
    label: "FOUNDATIONAL LAYER",
    garment: "Structured Cotton Tee",
    spec: "280 GSM Organic Cotton Interlock",
    description: "Crafted from dense organic cotton with interlock ribbing. Relaxed dropped shoulders establish a crisp, modern base.",
    tagline: "Chalk Ivory // Heavyweight Cotton",
    desktopSrc: teeDesktop,
    mobileSrc: teeMobile,
    hotspot: { top: "32%", left: "50%", label: "03 // 280 GSM INTERLOCK RIB" },
  },
  {
    id: "overcoat",
    number: "04",
    label: "THE SILHOUETTE",
    garment: "Double-Faced Tailored Coat",
    spec: "Virgin Wool & Cashmere Blend",
    description: "The statement piece. Features wide peak lapels, deep tailored cuffs, and double-faced construction for structural drape.",
    tagline: "Obsidian Black // Wool & Cashmere",
    desktopSrc: overcoatDesktop,
    mobileSrc: overcoatMobile,
    hotspot: { top: "38%", left: "50%", label: "04 // DOUBLE-FACED COAT" },
  },
  {
    id: "boots",
    number: "05",
    label: "BASE FOUNDATION",
    garment: "Square-Toe Chelsea Boots",
    spec: "Handcrafted Calfskin Leather",
    description: "Handcrafted in genuine calfskin leather with a square-toe silhouette and stacked Cuban sole for all-day presence.",
    tagline: "Polished Black // Stacked Sole",
    desktopSrc: bootsDesktop,
    mobileSrc: bootsMobile,
    hotspot: { top: "82%", left: "50%", label: "05 // CALFSKIN CHELSEA BOOTS" },
  },
  {
    id: "complete",
    number: "06",
    label: "COMPLETE ENSEMBLE",
    garment: "Look 01 — Signature Silhouette",
    spec: "Full 6-Piece Collection Ensemble",
    description: "A complete dialogue between modern tailoring, texture, and silhouette. Designed to transcend seasonal trends.",
    tagline: "SEEMZ Atelier // Autumn-Winter",
    desktopSrc: completeDesktop,
    mobileSrc: completeMobile,
    hotspot: { top: "25%", left: "50%", label: "06 // SIGNATURE ENSEMBLE" },
  },
];

const FashionIntro = ({
  title = "SEEMZ STUDIO",
  subtitle = "DIGITAL ATELIER • EXHIBIT 01",
  skipText = "CUSTOMIZE IN STUDIO",
  skipTargetId = "studio-workspace-section",
  onProgressUpdate,
  onSkip,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [stageFloat, setStageFloat] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const imagesCacheRef = useRef([]);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const animFrameRef = useRef(null);
  const isRunningRef = useRef(false);

  // Check reduced motion & mobile width
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionChange);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener("change", handleMotionChange);
      }
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Preload and cache all images
  useEffect(() => {
    let isMounted = true;
    const mobile = window.innerWidth <= 768;
    const cache = [];
    imagesCacheRef.current = cache;

    STAGES.forEach((stage, idx) => {
      const img = new Image();
      img.src = mobile ? stage.mobileSrc : stage.desktopSrc;
      img.onload = () => {
        if (isMounted) {
          drawCanvas(currentProgressRef.current);
        }
      };
      cache[idx] = img;
    });

    return () => {
      isMounted = false;
    };
  }, [isMobile]);

  // High-performance canvas rendering loop
  const drawCanvas = useCallback((progress) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const cache = imagesCacheRef.current;
    if (!cache || cache.length === 0) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    // Continuous stage float interpolation from 0.0 to 5.0
    const floatVal = Math.max(0, Math.min(STAGES.length - 1, progress * (STAGES.length - 1)));
    const baseIdx = Math.floor(floatVal);
    const nextIdx = Math.min(STAGES.length - 1, baseIdx + 1);
    const fraction = floatVal - baseIdx;

    // Smooth Hermite curve
    const alpha = Math.max(0, Math.min(1, fraction * fraction * (3 - 2 * fraction)));

    const imgA = cache[baseIdx] && cache[baseIdx].complete ? cache[baseIdx] : null;
    const imgB = cache[nextIdx] && cache[nextIdx].complete ? cache[nextIdx] : null;

    ctx.clearRect(0, 0, width, height);

    const drawCover = (img, imgAlpha, scaleFactor = 1.0) => {
      if (!img || !img.naturalWidth || !img.naturalHeight) return;

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;

      let renderW, renderH, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        renderW = width * scaleFactor;
        renderH = (width / imgRatio) * scaleFactor;
      } else {
        renderH = height * scaleFactor;
        renderW = (height * imgRatio) * scaleFactor;
      }

      offsetX = (width - renderW) / 2;
      offsetY = (height - renderH) / 2;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, imgAlpha));
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
      ctx.restore();
    };

    const baseScale = 1.0 + progress * 0.035;

    if (imgA) {
      drawCover(imgA, 1.0, baseScale);
    }

    if (imgB && alpha > 0.005 && imgB !== imgA) {
      drawCover(imgB, alpha, baseScale);
    }

    // Atmospheric subtle vignette
    const gradient = ctx.createRadialGradient(
      width / 2,
      height * 0.45,
      height * 0.25,
      width / 2,
      height / 2,
      height * 0.85
    );
    gradient.addColorStop(0, "rgba(5, 5, 5, 0)");
    gradient.addColorStop(0.7, "rgba(5, 5, 5, 0.2)");
    gradient.addColorStop(1, "rgba(5, 5, 5, 0.65)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, []);

  // Resize canvas according to display dimensions & DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 768 ? 1.5 : 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (displayWidth === 0 || displayHeight === 0) return;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    drawCanvas(currentProgressRef.current);
  }, [drawCanvas]);

  // Direct & Immediate Scroll Listener + Inertia Dampening
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const lerp = (a, b, n) => a + (b - a) * n;

    const updateStateFromProgress = (p) => {
      setScrollProgress(p);
      const floatVal = p * (STAGES.length - 1);
      setStageFloat(floatVal);
      const currentIdx = Math.min(STAGES.length - 1, Math.round(floatVal));
      setActiveStageIndex(currentIdx);
      drawCanvas(p);
      if (onProgressUpdate) {
        onProgressUpdate(p);
      }
    };

    const renderLoop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current = lerp(currentProgressRef.current, targetProgressRef.current, 0.18);
        const p = Math.max(0, Math.min(1, currentProgressRef.current));
        updateStateFromProgress(p);
        animFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        currentProgressRef.current = targetProgressRef.current;
        const p = Math.max(0, Math.min(1, currentProgressRef.current));
        updateStateFromProgress(p);
        isRunningRef.current = false;
      }
    };

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;

      const currentScroll = -rect.top;
      const rawP = Math.max(0, Math.min(1, currentScroll / totalScroll));
      targetProgressRef.current = rawP;

      // Immediately update state on scroll event for 0ms latency
      updateStateFromProgress(rawP);

      if (!isRunningRef.current) {
        isRunningRef.current = true;
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawCanvas, resizeCanvas, onProgressUpdate]);

  // Smooth skip directly to target workspace
  const handleSkipToTarget = () => {
    if (onSkip) {
      onSkip();
      return;
    }
    const targetEl = skipTargetId ? document.getElementById(skipTargetId) : null;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const nextTarget = container.offsetTop + container.offsetHeight;
    window.scrollTo({
      top: nextTarget,
      behavior: "smooth",
    });
  };

  // Jump smoothly to a specific stage via HUD timeline pill
  const handleJumpToStage = (index) => {
    const container = containerRef.current;
    if (!container) return;
    const totalScroll = container.offsetHeight - window.innerHeight;
    const targetP = index / (STAGES.length - 1);
    const targetScrollY = container.offsetTop + targetP * totalScroll;

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  };

  const currentStage = STAGES[activeStageIndex] || STAGES[0];

  // If user prefers reduced motion, render high-fashion static completed look
  if (prefersReducedMotion) {
    return (
      <section className="fashion-intro-static" id="fashion-intro-static">
        <div className="static-bg-overlay" />
        <img
          src={isMobile ? STAGES[5].mobileSrc : STAGES[5].desktopSrc}
          alt="SEEMZ Signature Look 01"
          className="static-hero-img"
        />
        <div className="static-content-card">
          <span className="intro-kicker">SEEMZ ATELIER // LOOK 01</span>
          <h1 className="static-title">THE ART OF DRESSING</h1>
          <p className="static-desc">
            A masterclass in modern proportion, Merino wool drape, and architectural tailoring.
          </p>
          <button type="button" onClick={handleSkipToTarget} className="intro-skip-btn static-btn">
            {skipText} <ArrowDown size={14} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} className="fashion-intro-container" id="fashion-intro">
      <div className="fashion-intro-sticky">
        {/* ================= MULTI-STAGE DOM BACKDROP STACK ================= */}
        <div className="intro-image-backdrop">
          {STAGES.map((stg, idx) => {
            const dist = Math.abs(stageFloat - idx);
            // Ensure first and last images stay solid at the track boundaries
            let opacity = 0;
            if (idx === 0 && stageFloat <= 0.05) {
              opacity = 1;
            } else if (idx === STAGES.length - 1 && stageFloat >= STAGES.length - 1.05) {
              opacity = 1;
            } else if (dist < 1) {
              opacity = Math.max(0, 1 - dist);
            }

            return (
              <img
                key={stg.id}
                src={isMobile ? stg.mobileSrc : stg.desktopSrc}
                alt={stg.garment}
                className="intro-backdrop-img"
                style={{
                  opacity: opacity,
                  transform: `scale(${1 + scrollProgress * 0.035})`,
                }}
              />
            );
          })}
        </div>

        {/* Hardware-Accelerated 60fps Canvas Stage */}
        <canvas ref={canvasRef} className="fashion-intro-canvas" />

        {/* Ambient Atmospheric Lighting Overlay */}
        <div className="intro-lighting-glow" />

        {/* ================= TOP EDITORIAL HUD BAR ================= */}
        <header className="intro-hud-topbar">
          <div className="topbar-branding">
            <span className="topbar-logo-kicker">{title}</span>
            <span className="topbar-sub">{subtitle}</span>
          </div>

          {/* Timeline Pills */}
          <nav className="topbar-timeline" aria-label="Intro Stages">
            {STAGES.map((stg, idx) => {
              const isActive = idx === activeStageIndex;
              const isPast = idx < activeStageIndex;
              return (
                <button
                  key={stg.id}
                  type="button"
                  className={`timeline-pill ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                  onClick={() => handleJumpToStage(idx)}
                  title={`Jump to ${stg.label}`}
                >
                  <span className="pill-dot" />
                  <span className="pill-label">{stg.number}</span>
                </button>
              );
            })}
          </nav>

          {/* Discrete "SKIP TO TARGET" Action */}
          <button
            type="button"
            className="intro-skip-btn"
            onClick={handleSkipToTarget}
            aria-label={skipText}
          >
            <span>{skipText}</span>
            <ArrowDown size={13} className="skip-arrow" />
          </button>
        </header>

        {/* ================= ACTIVE LAYER CALLOUT HOTSPOT ================= */}
        {currentStage.hotspot && (
          <div
            className="intro-layer-hotspot"
            key={`hotspot-${activeStageIndex}`}
            style={{
              top: currentStage.hotspot.top,
              left: currentStage.hotspot.left,
            }}
          >
            <div className="hotspot-pulse-ring" />
            <div className="hotspot-core-dot" />
            <div className="hotspot-tag-card">
              <span className="hotspot-tag-text">{currentStage.hotspot.label}</span>
            </div>
          </div>
        )}

        {/* ================= EDITORIAL HUD TELEMETRY (FLANKS) ================= */}
        <div className="intro-hud-body">
          {/* Left Flank: Garment Narrative Card */}
          <aside className="intro-flank left-flank" key={`stage-left-${activeStageIndex}`}>
            <div className="flank-content">
              <span className="flank-kicker">
                LAYER {currentStage.number} &bull; {currentStage.label}
              </span>
              <h2 className="flank-title">{currentStage.garment}</h2>
              <div className="flank-spec-badge">
                <span>{currentStage.spec}</span>
              </div>
              <p className="flank-desc">{currentStage.description}</p>
            </div>
          </aside>

          {/* Right Flank: Atelier Metrics & Fabric Specs */}
          <aside className="intro-flank right-flank" key={`stage-right-${activeStageIndex}`}>
            <div className="flank-content">
              <div className="telemetry-block">
                <span className="telemetry-label">ATELIER TELEMETRY</span>
                <span className="telemetry-value">{currentStage.tagline}</span>
              </div>

              <div className="telemetry-block">
                <span className="telemetry-label">SEQUENCE PROGRESS</span>
                <div className="progress-meter">
                  <div
                    className="progress-meter-fill"
                    style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                  />
                </div>
                <div className="progress-numbers">
                  <span>{currentStage.number}</span>
                  <span>/ 06</span>
                </div>
              </div>

              <div className="telemetry-cue">
                <span className="cue-text">
                  {activeStageIndex === 5 ? "LOOK COMPLETED" : "SCROLL TO DRESS"}
                </span>
                <div className="cue-indicator">
                  <span className="cue-bar" />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Completion Prompt Banner (Visible on Stage 06) */}
        {activeStageIndex === 5 && (
          <div className="intro-completion-prompt" onClick={handleSkipToTarget}>
            <div className="completion-prompt-card">
              <span className="completion-kicker">LOOK 01 ASSEMBLED</span>
              <span className="completion-title">Enter Outfit Builder & Atelier</span>
              <span className="completion-action">
                Scroll Down or Click to Customize <ArrowDown size={12} />
              </span>
            </div>
          </div>
        )}

        {/* ================= MOBILE STREAMLINED DRAWER ================= */}
        <div className="intro-mobile-hud" key={`mobile-hud-${activeStageIndex}`}>
          <div className="mobile-hud-pill">
            <div className="mobile-pill-header">
              <span className="mobile-step">STAGE {currentStage.number}</span>
              <span className="mobile-garment">{currentStage.garment}</span>
            </div>
            <p className="mobile-spec">{currentStage.spec}</p>
          </div>
          <div className="mobile-scroll-cue" onClick={handleSkipToTarget}>
            <span>{activeStageIndex === 5 ? "ENTER STUDIO BUILDER ↓" : "SCROLL TO DRESS"}</span>
            <div className="mobile-pulse-dot" />
          </div>
        </div>

        {/* Stage Progress Bottom Bar */}
        <div className="intro-bottom-rail">
          <div
            className="bottom-rail-fill"
            style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default FashionIntro;
