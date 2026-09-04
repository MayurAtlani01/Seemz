import React, { useState, useEffect, useRef, useCallback } from "react";
import "./OutfitAssembly.css";
import { Sparkles, Layers, ChevronDown, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * OutfitAssembly — A high-fashion scroll-driven interactive atelier section for SEEMZ.
 * 
 * 7 progressive stages tied smoothly to scroll position:
 * 1. Empty stand (The Armature)
 * 2. Pants / Trousers appear & drape
 * 3. T-shirt / Shirt appears & fits
 * 4. Jacket / Tailored Overcoat appears & wraps silhouette
 * 5. Shoes / Calfskin Boots appear on pedestal
 * 6. Accessories / Titanium & Leather Details appear
 * 7. Complete Outfit (Full ensemble reveal with studio aura & lookbook spec)
 */

const STAGES = [
  {
    id: "stand",
    number: "01",
    label: "THE STAND",
    garment: "Atelier Tailor Stand",
    material: "Brushed Titanium & Dark Wood",
    description:
      "Every iconic silhouette begins with a strong foundation. A custom atelier stand crafted to anchor modern tailoring.",
    tagline: "Base Structure // Solid Wood & Metal",
    startP: 0.0,
    endP: 0.14,
  },
  {
    id: "trousers",
    number: "02",
    label: "THE WIDE-LEG TROUSERS",
    garment: "Pleated Wide-Leg Trousers",
    material: "Premium Merino Wool",
    description:
      "Tailored with a high-rise waist and clean front pleats. The fluid wide leg falls naturally with a sharp finish.",
    tagline: "Midnight Charcoal // 100% Wool",
    startP: 0.14,
    endP: 0.28,
  },
  {
    id: "shirt",
    number: "03",
    label: "THE COTTON T-SHIRT",
    garment: "Structured Cotton Tee",
    material: "Heavyweight Organic Cotton",
    description:
      "Crafted from dense organic cotton that holds its shape. Seamless shoulder construction creates a clean, structured foundation.",
    tagline: "Ivory White // 100% Organic Cotton",
    startP: 0.28,
    endP: 0.44,
  },
  {
    id: "jacket",
    number: "04",
    label: "THE TAILORED OVERCOAT",
    garment: "Double-Faced Tailored Coat",
    material: "Virgin Wool & Cashmere Blend",
    description:
      "The centerpiece of the look. Features drop shoulders, peak lapels, and refined stitching for a structured silhouette.",
    tagline: "Obsidian Black // Wool & Cashmere",
    startP: 0.44,
    endP: 0.60,
  },
  {
    id: "shoes",
    number: "05",
    label: "CHELSEA BOOTS",
    garment: "Square-Toe Chelsea Boots",
    material: "Calfskin Genuine Leather",
    description:
      "Handcrafted in calfskin leather with a square-toe finish and durable stacked sole for all-day comfort.",
    tagline: "Polished Black // Genuine Leather",
    startP: 0.60,
    endP: 0.76,
  },
  {
    id: "accessories",
    number: "06",
    label: "ACCESSORIES",
    garment: "Leather Strap & Titanium Watch",
    material: "Titanium & Genuine Leather",
    description:
      "Refined leather straps, a titanium watch, and tinted eyewear complete the ensemble with subtle detail.",
    tagline: "Brushed Metal // Genuine Leather",
    startP: 0.76,
    endP: 0.90,
  },
  {
    id: "complete",
    number: "07",
    label: "COMPLETE LOOK",
    garment: "Look 01 — Full Ensemble",
    material: "Full 7-Piece Collection Look",
    description:
      "A complete blend of modern tailoring, texture, and silhouette. Designed to outlast seasonal trends with timeless style.",
    tagline: "SEEMZ Core Collection // Look 01",
    startP: 0.90,
    endP: 1.0,
  },
];

const OutfitAssembly = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const animFrameRef = useRef(null);
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);

  // Smooth scroll scrub calculation with inertia
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isRunning = false;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updateLoop = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0005) {
        currentProgressRef.current = lerp(currentProgressRef.current, targetProgressRef.current, 0.14);
        const p = Math.max(0, Math.min(1, currentProgressRef.current));
        setScrollProgress(p);

        // Determine current active step index
        let newIndex = 0;
        for (let i = 0; i < STAGES.length; i++) {
          if (p >= STAGES[i].startP) {
            newIndex = i;
          }
        }
        setActiveStepIndex(newIndex);
        animFrameRef.current = requestAnimationFrame(updateLoop);
      } else {
        currentProgressRef.current = targetProgressRef.current;
        const p = Math.max(0, Math.min(1, currentProgressRef.current));
        setScrollProgress(p);

        let newIndex = 0;
        for (let i = 0; i < STAGES.length; i++) {
          if (p >= STAGES[i].startP) {
            newIndex = i;
          }
        }
        setActiveStepIndex(newIndex);
        isRunning = false;
      }
    };

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;

      const currentScroll = -rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentScroll / totalScroll));
      targetProgressRef.current = rawProgress;

      if (!isRunning) {
        isRunning = true;
        animFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Compute smooth progression value (0 to 1) for a specific stage window
  const getStageSubProgress = useCallback(
    (start, end) => {
      if (scrollProgress < start) return 0;
      if (scrollProgress >= end) return 1;
      const t = (scrollProgress - start) / (end - start);
      // Smooth hermite ease
      return t * t * (3 - 2 * t);
    },
    [scrollProgress]
  );

  // Layer progress factors
  const trousersProgress = getStageSubProgress(0.14, 0.28);
  const shirtProgress = getStageSubProgress(0.28, 0.44);
  const jacketProgress = getStageSubProgress(0.44, 0.60);
  const shoesProgress = getStageSubProgress(0.60, 0.76);
  const accessoriesProgress = getStageSubProgress(0.76, 0.90);
  const completeProgress = getStageSubProgress(0.90, 1.0);

  // Jump smoothly to a specific stage when user clicks an indicator pill
  const handleJumpToStage = (index) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const totalScroll = rect.height - window.innerHeight;
    const stage = STAGES[index];
    const targetP = (stage.startP + stage.endP) / 2;
    const targetScrollY = window.scrollY + rect.top + targetP * totalScroll;

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  };

  const currentStage = STAGES[activeStepIndex] || STAGES[0];

  return (
    <section ref={containerRef} className="outfit-assembly-section" id="atelier-assembly">
      <div className="outfit-sticky-stage">
        {/* Ambient Studio Lighting Background */}
        <div className="atelier-ambient-glow" />
        <div
          className="atelier-rim-spotlight"
          style={{
            opacity: 0.35 + completeProgress * 0.5,
            transform: `scale(${1 + completeProgress * 0.15})`,
          }}
        />

        {/* Top Centered Hero Editorial Branding */}
        <div className="atelier-center-header">
          <span className="about-tag">THE ATELIER // EXHIBIT 01</span>
          <h2 className="atelier-brand-title">THE ART OF DRESSING</h2>
          <p className="atelier-brand-subtitle">A scroll-driven study in silhouette, drape, and proportion.</p>
        </div>

        {/* Central Stage: Large Mannequin with Flanking Cards & Negative Space */}
        <div className="atelier-main-stage">
          {/* Left Flank Card: Active Garment Story */}
          <div className="atelier-flank-card left-flank">
            <span className="flank-step-kicker">LAYER {currentStage.number} &bull; {currentStage.label}</span>
            <h3 className="flank-garment-title">{currentStage.garment}</h3>
            <span className="flank-material-line">{currentStage.material}</span>
            <p className="flank-story-text">{currentStage.description}</p>
          </div>

          {/* Central Mannequin Exhibit Stage */}
          <div className="atelier-central-mannequin-wrapper">
            {/* Pedestal Ground Lighting Glow */}
            <div
              className="pedestal-ground-radiance"
              style={{
                opacity: 0.45 + completeProgress * 0.45,
              }}
            />

            {/* Complete Lookbook Seal Badge */}
            {completeProgress > 0.4 && (
              <div
                className="complete-seal-badge"
                style={{
                  opacity: completeProgress,
                  transform: `scale(${0.92 + completeProgress * 0.08}) translateY(${(1 - completeProgress) * 15}px)`,
                }}
              >
                <div className="seal-text-box">
                  <span className="seal-title">LOOK 01 // COMPLETE SILHOUETTE</span>
                  <span className="seal-sub">AUTUMN ATELIER SIGNATURE ENSEMBLE</span>
                </div>
              </div>
            )}

            {/* SVG Mannequin Display Stage */}
            <div className="mannequin-svg-stage">
              <svg
                viewBox="0 0 500 780"
                className="mannequin-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Studio Pedestal Gradients */}
                  <radialGradient id="pedestalBaseGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2c2c32" />
                    <stop offset="55%" stopColor="#18181c" />
                    <stop offset="100%" stopColor="#08080a" />
                  </radialGradient>
                  <radialGradient id="pedestalRimGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4a4a52" />
                    <stop offset="70%" stopColor="#202024" />
                    <stop offset="100%" stopColor="#0a0a0d" />
                  </radialGradient>
                  <radialGradient id="floorContactShadow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.85)" />
                    <stop offset="60%" stopColor="rgba(0,0,0,0.4)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>

                  {/* Stand Metallic & Form Gradients */}
                  <linearGradient id="metalPoleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1a1a1d" />
                    <stop offset="35%" stopColor="#5a5a64" />
                    <stop offset="50%" stopColor="#7e7e8c" />
                    <stop offset="75%" stopColor="#3c3c44" />
                    <stop offset="100%" stopColor="#141416" />
                  </linearGradient>

                  <linearGradient id="tailorBustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#131316" />
                    <stop offset="25%" stopColor="#222228" />
                    <stop offset="55%" stopColor="#2b2b34" />
                    <stop offset="85%" stopColor="#1b1b20" />
                    <stop offset="100%" stopColor="#0e0e11" />
                  </linearGradient>

                  <linearGradient id="neckCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2a1f18" />
                    <stop offset="50%" stopColor="#4a382c" />
                    <stop offset="100%" stopColor="#1c140e" />
                  </linearGradient>

                  {/* Garment 1: Trousers Gradients */}
                  <linearGradient id="trousersFabricGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#111114" />
                    <stop offset="20%" stopColor="#1a1a20" />
                    <stop offset="48%" stopColor="#24242c" />
                    <stop offset="52%" stopColor="#1c1c22" />
                    <stop offset="80%" stopColor="#22222a" />
                    <stop offset="100%" stopColor="#101013" />
                  </linearGradient>

                  <linearGradient id="creaseShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
                    <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                  </linearGradient>

                  {/* Garment 2: Sculpted Base Tee Gradients */}
                  <linearGradient id="shirtBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b8b6b0" />
                    <stop offset="18%" stopColor="#dedcd5" />
                    <stop offset="50%" stopColor="#f4f3ef" />
                    <stop offset="82%" stopColor="#dedcd6" />
                    <stop offset="100%" stopColor="#b4b2ac" />
                  </linearGradient>

                  <linearGradient id="shirtRibGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9a9892" />
                    <stop offset="50%" stopColor="#e2e0da" />
                    <stop offset="100%" stopColor="#9a9892" />
                  </linearGradient>

                  {/* Garment 3: Overcoat Gradients */}
                  <linearGradient id="coatBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0b0b0e" />
                    <stop offset="20%" stopColor="#18181f" />
                    <stop offset="50%" stopColor="#262630" />
                    <stop offset="80%" stopColor="#17171d" />
                    <stop offset="100%" stopColor="#08080a" />
                  </linearGradient>

                  <linearGradient id="lapelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e1e26" />
                    <stop offset="45%" stopColor="#2f2f3c" />
                    <stop offset="100%" stopColor="#15151a" />
                  </linearGradient>

                  {/* Garment 4: Shoes Gradients */}
                  <linearGradient id="bootLeatherGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#08080a" />
                    <stop offset="35%" stopColor="#25252d" />
                    <stop offset="55%" stopColor="#3a3a46" />
                    <stop offset="85%" stopColor="#18181e" />
                    <stop offset="100%" stopColor="#060608" />
                  </linearGradient>

                  <linearGradient id="soleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1b1714" />
                    <stop offset="50%" stopColor="#2e2722" />
                    <stop offset="100%" stopColor="#0c0a09" />
                  </linearGradient>

                  {/* Garment 5: Accessories Gradients */}
                  <linearGradient id="leatherHarnessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0a0a0c" />
                    <stop offset="40%" stopColor="#1f1f26" />
                    <stop offset="70%" stopColor="#2d2d37" />
                    <stop offset="100%" stopColor="#0d0d10" />
                  </linearGradient>

                  <linearGradient id="titaniumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#52525c" />
                    <stop offset="45%" stopColor="#d6d6e2" />
                    <stop offset="65%" stopColor="#9696a4" />
                    <stop offset="100%" stopColor="#44444d" />
                  </linearGradient>

                  {/* Soft Drop Shadow Filter for Layered Floating Pieces */}
                  <filter id="garmentShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.65" />
                  </filter>
                  <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* ============================================================
                    STAGE 1: THE EMPTY STAND (PEDESTAL + BUST + POST)
                   ============================================================ */}
                <g id="stage-stand" className="mannequin-layer layer-stand">
                  {/* Floor Ambient Contact Shadow */}
                  <ellipse cx="250" cy="735" rx="160" ry="24" fill="url(#floorContactShadow)" />

                  {/* Circular Studio Pedestal Platform */}
                  <ellipse cx="250" cy="722" rx="140" ry="18" fill="url(#pedestalBaseGrad)" stroke="#32323a" strokeWidth="1.5" />
                  <ellipse cx="250" cy="720" rx="130" ry="15" fill="url(#pedestalRimGrad)" stroke="#454550" strokeWidth="0.8" />
                  <ellipse cx="250" cy="719" rx="120" ry="12" fill="#121215" />

                  {/* Pedestal Collar Ring */}
                  <ellipse cx="250" cy="715" rx="22" ry="5" fill="#383842" />
                  <rect x="238" y="705" width="24" height="10" rx="2" fill="url(#metalPoleGrad)" />

                  {/* Central Brushed Titanium Upright Column */}
                  <rect x="246" y="140" width="8" height="570" fill="url(#metalPoleGrad)" />

                  {/* Height Adjustment Turn Key Knob */}
                  <circle cx="260" cy="560" r="5" fill="url(#titaniumGrad)" />
                  <line x1="250" y1="560" x2="265" y2="560" stroke="url(#titaniumGrad)" strokeWidth="3" />

                  {/* Stand Hip Cross-Arm Bar (visible when undressed) */}
                  <rect x="185" y="442" width="130" height="6" rx="3" fill="url(#metalPoleGrad)" />
                  <circle cx="185" cy="445" r="4" fill="url(#titaniumGrad)" />
                  <circle cx="315" cy="445" r="4" fill="url(#titaniumGrad)" />

                  {/* Tailor's Torso Dress Form */}
                  <path
                    d="M 226 168 
                       C 200 174, 160 196, 152 220 
                       C 146 238, 156 265, 166 288 
                       C 174 308, 182 328, 186 350
                       C 190 372, 182 405, 178 438
                       C 192 444, 230 448, 250 448
                       C 270 448, 308 444, 322 438
                       C 318 405, 310 372, 314 350
                       C 318 328, 326 308, 334 288
                       C 344 265, 354 238, 348 220
                       C 340 196, 300 174, 274 168
                       Z"
                    fill="url(#tailorBustGrad)"
                    stroke="#383842"
                    strokeWidth="1.2"
                  />

                  {/* Seam Stitch Lines on Torso Form (Architectural tailoring markers) */}
                  <path
                    d="M 250 168 L 250 448"
                    stroke="#484854"
                    strokeWidth="0.8"
                    strokeDasharray="4 3"
                  />
                  <path
                    d="M 205 185 C 218 240, 218 360, 210 442"
                    stroke="#383842"
                    strokeWidth="0.7"
                    fill="none"
                  />
                  <path
                    d="M 295 185 C 282 240, 282 360, 290 442"
                    stroke="#383842"
                    strokeWidth="0.7"
                    fill="none"
                  />
                  <path
                    d="M 186 350 C 220 358, 280 358, 314 350"
                    stroke="#383842"
                    strokeWidth="0.7"
                    strokeDasharray="3 3"
                    fill="none"
                  />

                  {/* Neck Stem & Hardwood Top Finial */}
                  <rect x="238" y="142" width="24" height="26" rx="2" fill="url(#metalPoleGrad)" />
                  <path
                    d="M 235 142 C 235 125, 265 125, 265 142 Z"
                    fill="url(#neckCapGrad)"
                    stroke="#5a4234"
                    strokeWidth="1"
                  />
                  <circle cx="250" cy="124" r="5" fill="url(#titaniumGrad)" />
                </g>

                {/* ============================================================
                    STAGE 2: TROUSERS (SUPER 130s PLEATED MERINO WOOL)
                   ============================================================ */}
                <g
                  id="stage-trousers"
                  className="mannequin-layer layer-trousers"
                  style={{
                    opacity: trousersProgress,
                    transform: `translateY(${(1 - trousersProgress) * -38}px) scale(${
                      1 + (1 - trousersProgress) * 0.04
                    }) rotate(${-(1 - trousersProgress) * 1.5}deg)`,
                    transformOrigin: "250px 480px",
                    filter: "url(#garmentShadow)",
                    pointerEvents: trousersProgress > 0.1 ? "auto" : "none",
                  }}
                >
                  {/* Trousers Silhouette */}
                  <path
                    d="M 184 345
                       C 182 360, 175 410, 173 450
                       C 171 490, 178 570, 185 660
                       L 230 660
                       C 232 580, 238 495, 248 450
                       L 252 450
                       C 262 495, 268 580, 270 660
                       L 315 660
                       C 322 570, 329 490, 327 450
                       C 325 410, 318 360, 316 345
                       C 285 349, 215 349, 184 345
                       Z"
                    fill="url(#trousersFabricGrad)"
                    stroke="#2e2e38"
                    strokeWidth="1.2"
                  />

                  {/* Waistband Construction */}
                  <path
                    d="M 184 345 C 215 349, 285 349, 316 345 L 316 360 C 285 364, 215 364, 184 360 Z"
                    fill="#151519"
                    stroke="#353540"
                    strokeWidth="0.8"
                  />

                  {/* Fly Front & Button Tab */}
                  <line x1="250" y1="347" x2="250" y2="445" stroke="#121215" strokeWidth="2.5" />
                  <line x1="250" y1="347" x2="250" y2="445" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />

                  {/* Left Leg Razor Pleat Crease */}
                  <path
                    d="M 207 360 C 206 420, 207 540, 208 660"
                    stroke="url(#creaseShadow)"
                    strokeWidth="2"
                    fill="none"
                  />

                  {/* Right Leg Razor Pleat Crease */}
                  <path
                    d="M 293 360 C 294 420, 293 540, 292 660"
                    stroke="url(#creaseShadow)"
                    strokeWidth="2"
                    fill="none"
                  />

                  {/* Welt Pockets */}
                  <line x1="190" y1="368" x2="204" y2="396" stroke="#101014" strokeWidth="2" />
                  <line x1="310" y1="368" x2="296" y2="396" stroke="#101014" strokeWidth="2" />

                  {/* Bottom Ankle Cuffs Turn-Up */}
                  <rect x="185" y="652" width="45" height="9" fill="#181820" stroke="#32323e" strokeWidth="0.8" />
                  <rect x="270" y="652" width="45" height="9" fill="#181820" stroke="#32323e" strokeWidth="0.8" />
                </g>

                {/* ============================================================
                    STAGE 3: SHIRT (280 GSM STRUCTURED CHALK-IVORY TEE)
                   ============================================================ */}
                <g
                  id="stage-shirt"
                  className="mannequin-layer layer-shirt"
                  style={{
                    opacity: shirtProgress,
                    transform: `translateY(${(1 - shirtProgress) * -32}px) scale(${
                      1 + (1 - shirtProgress) * 0.035
                    }) rotate(${(1 - shirtProgress) * 1.2}deg)`,
                    transformOrigin: "250px 240px",
                    filter: "url(#garmentShadow)",
                    pointerEvents: shirtProgress > 0.1 ? "auto" : "none",
                  }}
                >
                  {/* Main Tee Body & Sleeves */}
                  <path
                    d="M 218 170
                       C 185 180, 142 205, 126 230
                       L 152 284
                       L 172 272
                       C 178 300, 182 340, 185 366
                       C 218 372, 282 372, 315 366
                       C 318 340, 322 300, 328 272
                       L 348 284
                       L 374 230
                       C 358 205, 315 180, 282 170
                       C 275 190, 225 190, 218 170
                       Z"
                    fill="url(#shirtBodyGrad)"
                    stroke="#8c8a82"
                    strokeWidth="1"
                  />

                  {/* Crew Neckline Collar Rib */}
                  <path
                    d="M 218 170 C 224 192, 276 192, 282 170 C 274 184, 226 184, 218 170 Z"
                    fill="url(#shirtRibGrad)"
                    stroke="#7a7872"
                    strokeWidth="1.2"
                  />

                  {/* Sleeve Seam Details & Stitching */}
                  <path
                    d="M 152 284 L 172 272"
                    stroke="#9e9c94"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 348 284 L 374 230"
                    stroke="#9e9c94"
                    strokeWidth="1.5"
                  />

                  {/* Chest Drape Contour Folds (Architectural interlock volume) */}
                  <path
                    d="M 205 210 C 220 260, 220 320, 210 365"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M 295 210 C 280 260, 280 320, 290 365"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <path
                    d="M 230 240 C 250 250, 260 250, 270 240"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1"
                    fill="none"
                  />
                </g>

                {/* ============================================================
                    STAGE 4: OVERCOAT / TAILORED JACKET (DOUBLE-FACED MERINO COAT)
                   ============================================================ */}
                <g
                  id="stage-jacket"
                  className="mannequin-layer layer-jacket"
                  style={{
                    opacity: jacketProgress,
                    transform: `translateY(${(1 - jacketProgress) * -42}px) scale(${
                      1 + (1 - jacketProgress) * 0.05
                    }) rotate(${-(1 - jacketProgress) * 1.0}deg)`,
                    transformOrigin: "250px 300px",
                    filter: "url(#garmentShadow)",
                    pointerEvents: jacketProgress > 0.1 ? "auto" : "none",
                  }}
                >
                  {/* Coat Torso & Lower Drape (Left & Right Flaps) */}
                  <path
                    d="M 215 174
                       C 178 184, 134 206, 118 234
                       L 138 460
                       L 168 454
                       C 172 400, 175 350, 178 320
                       L 174 535
                       C 205 540, 240 540, 248 538
                       L 248 370
                       L 220 255
                       C 230 220, 248 185, 250 185
                       C 252 185, 270 220, 280 255
                       L 252 370
                       L 252 538
                       C 260 540, 295 540, 326 535
                       L 322 320
                       C 325 350, 328 400, 332 454
                       L 362 460
                       L 382 234
                       C 366 206, 322 184, 285 174
                       Z"
                    fill="url(#coatBodyGrad)"
                    stroke="#383846"
                    strokeWidth="1.2"
                  />

                  {/* Left Peak Lapel Facing */}
                  <path
                    d="M 216 175 L 175 250 L 210 270 L 250 380 L 244 380 L 200 280 L 158 258 Z"
                    fill="url(#lapelGrad)"
                    stroke="#484858"
                    strokeWidth="1"
                  />

                  {/* Right Peak Lapel Facing */}
                  <path
                    d="M 284 175 L 325 250 L 290 270 L 250 380 L 256 380 L 300 280 L 342 258 Z"
                    fill="url(#lapelGrad)"
                    stroke="#484858"
                    strokeWidth="1"
                  />

                  {/* Structured Tailored Shoulder Pads Highlights */}
                  <path
                    d="M 118 234 C 135 204, 180 184, 215 174"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M 382 234 C 365 204, 320 184, 285 174"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                    fill="none"
                  />

                  {/* Left Chest Welt Pocket with Ivory Pocket Square Accent */}
                  <rect x="180" y="278" width="28" height="3.5" rx="1" fill="#0d0d10" stroke="#32323e" strokeWidth="0.8" />
                  <polygon points="186,278 194,268 198,278" fill="#f0efe8" />

                  {/* Horn Buttons with Titanium Rim Details */}
                  <circle cx="253" cy="385" r="4.5" fill="#121216" stroke="url(#titaniumGrad)" strokeWidth="1" />
                  <circle cx="253" cy="425" r="4.5" fill="#121216" stroke="url(#titaniumGrad)" strokeWidth="1" />
                  <circle cx="253" cy="465" r="4.5" fill="#121216" stroke="url(#titaniumGrad)" strokeWidth="1" />

                  {/* Outer Sleeve Cuffs with 3 Horn Buttons Each */}
                  <circle cx="150" cy="442" r="2.5" fill="#121216" stroke="#484855" strokeWidth="0.6" />
                  <circle cx="154" cy="436" r="2.5" fill="#121216" stroke="#484855" strokeWidth="0.6" />
                  <circle cx="158" cy="430" r="2.5" fill="#121216" stroke="#484855" strokeWidth="0.6" />

                  <circle cx="350" cy="442" r="2.5" fill="#121216" stroke="#484855" strokeWidth="0.6" />
                  <circle cx="346" cy="436" r="2.5" fill="#121216" stroke="#484855" strokeWidth="0.6" />
                  <circle cx="342" cy="430" r="2.5" fill="#121216" stroke="#484855" strokeWidth="0.6" />
                </g>

                {/* ============================================================
                    STAGE 5: SHOES (CHISEL-TOE CHELSEA BOOTS IN POLISHED VACHETTA)
                   ============================================================ */}
                <g
                  id="stage-shoes"
                  className="mannequin-layer layer-shoes"
                  style={{
                    opacity: shoesProgress,
                    transform: `translateY(${(1 - shoesProgress) * -22}px) scale(${
                      1 + (1 - shoesProgress) * 0.04
                    })`,
                    transformOrigin: "250px 690px",
                    filter: "url(#garmentShadow)",
                    pointerEvents: shoesProgress > 0.1 ? "auto" : "none",
                  }}
                >
                  {/* Left Boot Contact Shadow */}
                  <ellipse cx="205" cy="718" rx="28" ry="7" fill="url(#floorContactShadow)" />
                  {/* Right Boot Contact Shadow */}
                  <ellipse cx="295" cy="718" rx="28" ry="7" fill="url(#floorContactShadow)" />

                  {/* Left Boot Upper */}
                  <path
                    d="M 194 656
                       L 188 684
                       C 184 700, 180 706, 174 712
                       L 225 712
                       C 230 708, 230 696, 228 684
                       L 224 656
                       Z"
                    fill="url(#bootLeatherGrad)"
                    stroke="#32323c"
                    strokeWidth="1"
                  />
                  {/* Left Boot Beveled Leather Sole & Stacked Heel */}
                  <rect x="172" y="710" width="55" height="5" rx="1.5" fill="url(#soleGrad)" />
                  <rect x="210" y="714" width="18" height="5" rx="1" fill="#0e0c0b" />
                  {/* Left Boot Elastic Side Gusset */}
                  <polygon points="204,658 200,684 212,684 210,658" fill="#101014" stroke="#25252d" strokeWidth="0.8" />
                  {/* Left Boot Specular Toe Highlight */}
                  <path d="M 178 708 C 182 704, 194 704, 198 708" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" />

                  {/* Right Boot Upper */}
                  <path
                    d="M 276 656
                       L 272 684
                       C 270 696, 270 708, 275 712
                       L 326 712
                       C 320 706, 316 700, 312 684
                       L 306 656
                       Z"
                    fill="url(#bootLeatherGrad)"
                    stroke="#32323c"
                    strokeWidth="1"
                  />
                  {/* Right Boot Beveled Leather Sole & Stacked Heel */}
                  <rect x="273" y="710" width="55" height="5" rx="1.5" fill="url(#soleGrad)" />
                  <rect x="272" y="714" width="18" height="5" rx="1" fill="#0e0c0b" />
                  {/* Right Boot Elastic Side Gusset */}
                  <polygon points="290,658 288,684 300,684 296,658" fill="#101014" stroke="#25252d" strokeWidth="0.8" />
                  {/* Right Boot Specular Toe Highlight */}
                  <path d="M 302 708 C 306 704, 318 704, 322 708" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" />
                </g>

                {/* ============================================================
                    STAGE 6: ACCESSORIES (HARNESS, TITANIUM TIMEPIECE, EYEWEAR)
                   ============================================================ */}
                <g
                  id="stage-accessories"
                  className="mannequin-layer layer-accessories"
                  style={{
                    opacity: accessoriesProgress,
                    transform: `translateY(${(1 - accessoriesProgress) * -18}px) scale(${
                      1 + (1 - accessoriesProgress) * 0.03
                    }) rotate(${(1 - accessoriesProgress) * 1.0}deg)`,
                    transformOrigin: "250px 320px",
                    filter: "url(#garmentShadow)",
                    pointerEvents: accessoriesProgress > 0.1 ? "auto" : "none",
                  }}
                >
                  {/* Bridle Leather Crossbody Harness Strap */}
                  <path
                    d="M 188 185 L 290 410 L 302 405 L 198 180 Z"
                    fill="url(#leatherHarnessGrad)"
                    stroke="#383844"
                    strokeWidth="0.8"
                  />
                  {/* Harness Titanium Buckle */}
                  <rect
                    x="234"
                    y="288"
                    width="14"
                    height="10"
                    rx="1.5"
                    fill="none"
                    stroke="url(#titaniumGrad)"
                    strokeWidth="2"
                    transform="rotate(25 241 293)"
                  />

                  {/* Titanium Timepiece on Left Wrist Cuff */}
                  <rect x="144" y="445" width="12" height="18" rx="2" fill="url(#leatherHarnessGrad)" stroke="#32323e" strokeWidth="0.6" />
                  <circle cx="150" cy="454" r="7" fill="#08080a" stroke="url(#titaniumGrad)" strokeWidth="1.8" />
                  <circle cx="150" cy="454" r="5" fill="#16161c" />
                  <line x1="150" y1="454" x2="150" y2="451" stroke="url(#titaniumGrad)" strokeWidth="1" />
                  <line x1="150" y1="454" x2="153" y2="454" stroke="url(#titaniumGrad)" strokeWidth="1" />

                  {/* Minimalist Smoked Acetate Eyewear Tucked in Lapel */}
                  <rect x="206" y="278" width="16" height="7" rx="3.5" fill="#08080a" stroke="url(#titaniumGrad)" strokeWidth="0.9" />
                  <rect x="226" y="278" width="16" height="7" rx="3.5" fill="#08080a" stroke="url(#titaniumGrad)" strokeWidth="0.9" />
                  <line x1="222" y1="281" x2="226" y2="281" stroke="url(#titaniumGrad)" strokeWidth="1" />
                </g>

                {/* ============================================================
                    STAGE 7: COMPLETE OUTFIT AURA & CELEBRATION
                   ============================================================ */}
                {completeProgress > 0.1 && (
                  <g
                    id="stage-complete-aura"
                    style={{
                      opacity: completeProgress,
                      transition: "opacity 0.4s ease",
                    }}
                  >
                    {/* Minimalist Studio Halo */}
                    <circle
                      cx="250"
                      cy="360"
                      r="220"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1.5"
                      strokeDasharray="6 8"
                    />
                    <circle
                      cx="250"
                      cy="360"
                      r="240"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.03)"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Right Flank Card: Atelier Sequence Timeline */}
          <div className="atelier-flank-card right-flank">
            <span className="flank-step-kicker">OUTFIT TIMELINE</span>
            <div className="atelier-timeline-list">
              {STAGES.map((stg, idx) => {
                const isActive = activeStepIndex === idx;
                const isPast = activeStepIndex > idx;
                return (
                  <button
                    key={stg.id}
                    onClick={() => handleJumpToStage(idx)}
                    className={`timeline-row-btn ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}
                  >
                    <span className="timeline-idx">{stg.number}</span>
                    <span className="timeline-label">{stg.garment}</span>
                    <span className="timeline-status-indicator" />
                  </button>
                );
              })}
            </div>
            <div className="flank-progress-summary">
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.round(scrollProgress * 100)}%` }}
                />
              </div>
              <span className="progress-pct">{Math.round(scrollProgress * 100)}% COMPLETED</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: SEEMZ Minimalist Scroll Indicator or Completed Look CTA */}
        <div className="atelier-bottom-bar">
          {scrollProgress < 0.92 ? (
            <div className="seemz-scroll-cue">
              <span className="cue-text">SCROLL TO ASSEMBLE</span>
              <div className="seemz-scroll-line" />
            </div>
          ) : (
            <div className="atelier-complete-cta">
              <button
                className="about-shop-btn"
                onClick={() => navigate("/products")}
              >
                <span className="btn-text">EXPLORE COLLECTION</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OutfitAssembly;
