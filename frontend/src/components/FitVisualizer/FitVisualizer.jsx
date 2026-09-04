import React, { useState, useEffect } from "react";
import { Camera, Check, Sparkles, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import "./FitVisualizer.css";

/**
 * FitVisualizer — Algorithmic size & bespoke fit recommendation engine.
 * Connects saved biometric scan data to product size charts.
 */
function FitVisualizer({ product, selectedSize, onSelectSize, onOpenScanner }) {
  const [bodyProfile, setBodyProfile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("seemz_body_profile_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.measurements || parsed?.height) {
          setBodyProfile(parsed);
        }
      }
    } catch (e) {
      console.warn("Could not load stored body profile", e);
    }
  }, []);

  // Compute recommended size based on product category & measurements
  const calculateRecommendation = () => {
    if (!bodyProfile) return null;
    const m = bodyProfile.measurements || bodyProfile;
    const chest = m.chest || 98;
    const waist = m.waist || 82;
    const shoulder = m.shoulderWidth || 45;

    // Sizing thresholds
    const sizes = [
      { size: "S", chestMax: 94, waistMax: 78, shoulderMax: 43 },
      { size: "M", chestMax: 102, waistMax: 86, shoulderMax: 46 },
      { size: "L", chestMax: 110, waistMax: 94, shoulderMax: 49 },
      { size: "XL", chestMax: 118, waistMax: 102, shoulderMax: 52 },
      { size: "XXL", chestMax: 126, waistMax: 110, shoulderMax: 55 },
    ];

    let recommended = "M";
    for (const sz of sizes) {
      if (chest <= sz.chestMax) {
        recommended = sz.size;
        break;
      }
      recommended = sz.size;
    }

    // Calculate match score for each size
    const sizeScores = sizes.map((s) => {
      const diff = Math.abs(chest - (s.chestMax - 4));
      const score = Math.max(15, Math.min(98, 98 - diff * 4.5));
      return {
        size: s.size,
        score: Math.round(score),
        isRecommended: s.size === recommended,
      };
    });

    return {
      recommendedSize: recommended,
      confidence: bodyProfile.confidenceScore || 95,
      sizeScores,
      measurements: m,
    };
  };

  const recData = calculateRecommendation();

  // Auto-select recommended size if available and not yet selected
  useEffect(() => {
    if (recData?.recommendedSize && onSelectSize && (!selectedSize || selectedSize === "")) {
      if (Array.isArray(product?.sizes) && product.sizes.includes(recData.recommendedSize)) {
        onSelectSize(recData.recommendedSize);
      }
    }
  }, [recData?.recommendedSize, product?.sizes, onSelectSize, selectedSize]);

  if (!bodyProfile || !recData) {
    return (
      <div className="fit-visualizer-uncalibrated">
        <div className="uncalibrated-header">
          <div className="uncalibrated-title-group">
            <span className="visualizer-kicker">SEEMZ SMART FIT</span>
            <h4>Size Recommendation</h4>
          </div>
          <button
            type="button"
            className="activate-scanner-btn"
            onClick={onOpenScanner}
          >
            <Camera size={14} />
            <span>SCAN BODY</span>
          </button>
        </div>
        <p className="uncalibrated-desc">
          Scan your body in under 10 seconds to get your recommended size for this item.
        </p>
      </div>
    );
  }

  return (
    <div className="fit-visualizer-card">
      <div className="visualizer-header">
        <div className="visualizer-status">
          <span className="visualizer-kicker">SEEMZ SMART FIT</span>
          <div className="recommended-badge-row">
            <h4>Recommended: <span className="rec-size-highlight">{recData.recommendedSize}</span></h4>
            <span className="confidence-tag">{recData.confidence}% FIT MATCH</span>
          </div>
        </div>

        <button
          type="button"
          className="recalibrate-link-btn"
          onClick={onOpenScanner}
          title="Retake body scan"
        >
          <Camera size={12} />
          <span>RESCAN</span>
        </button>
      </div>

      {/* Sizing Distribution Bars */}
      <div className="fit-distribution-list">
        {recData.sizeScores.map((item) => {
          const isSelected = selectedSize === item.size;
          const isAvailable = !product?.sizes || product.sizes.includes(item.size);

          return (
            <button
              key={item.size}
              type="button"
              className={`fit-score-row ${item.isRecommended ? "is-rec" : ""} ${isSelected ? "is-selected" : ""} ${!isAvailable ? "is-disabled" : ""}`}
              onClick={() => isAvailable && onSelectSize && onSelectSize(item.size)}
              disabled={!isAvailable}
            >
              <span className="fit-size-label">{item.size}</span>
              <div className="fit-bar-track">
                <div
                  className="fit-bar-fill"
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <span className="fit-score-num">
                {item.isRecommended ? "Best Match" : `${item.score}%`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toggle Anatomical Diagnostics */}
      <button
        type="button"
        className="details-toggle-btn"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span>{showDetails ? "Hide Measurements" : "View Saved Measurements"}</span>
        {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {showDetails && (
        <div className="fit-measurements-drawer">
          <div className="drawer-metric">
            <span className="drawer-kicker">HEIGHT</span>
            <span className="drawer-val">{recData.measurements.height || 178} cm</span>
          </div>
          <div className="drawer-metric">
            <span className="drawer-kicker">CHEST</span>
            <span className="drawer-val">{recData.measurements.chest || 98} cm</span>
          </div>
          <div className="drawer-metric">
            <span className="drawer-kicker">WAIST</span>
            <span className="drawer-val">{recData.measurements.waist || 82} cm</span>
          </div>
          <div className="drawer-metric">
            <span className="drawer-kicker">SHOULDER</span>
            <span className="drawer-val">{recData.measurements.shoulderWidth || 45} cm</span>
          </div>
        </div>
      )}

      <span className="fit-disclaimer">
        Size recommendations are calculated using your saved measurements.
      </span>
    </div>
  );
}

export default FitVisualizer;
