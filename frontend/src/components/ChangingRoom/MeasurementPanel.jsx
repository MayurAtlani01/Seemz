import React from "react";
import { AVATAR_PRESETS, DEFAULT_AVATAR_PARAMS } from "../../services/changingRoom/avatarEngine";
import { Sliders, Sparkles, X, RotateCcw, User } from "lucide-react";
import "./MeasurementPanel.css";

const MeasurementPanel = ({
  bodyParams = DEFAULT_AVATAR_PARAMS,
  onUpdateBody,
  onClose,
  isMobileModal = false,
}) => {
  const currentParams = { ...DEFAULT_AVATAR_PARAMS, ...bodyParams };
  const currentCategory = currentParams.category || "men";
  const activePresets = AVATAR_PRESETS[currentCategory] || AVATAR_PRESETS.men;

  const handleCategoryChange = (newCat) => {
    onUpdateBody({
      ...currentParams,
      category: newCat,
    });
  };

  const handleSliderChange = (field, value) => {
    const num = Math.max(0, Math.min(100, parseFloat(value) || 0));
    onUpdateBody({
      ...currentParams,
      [field]: num,
    });
  };

  const handlePresetSelect = (presetId) => {
    const preset = activePresets.find((p) => p.id === presetId);
    if (preset) {
      onUpdateBody({ ...preset.params });
    }
  };

  const handleReset = () => {
    onUpdateBody({ ...DEFAULT_AVATAR_PARAMS, category: currentCategory });
  };

  return (
    <div className={`measurement-panel-card ${isMobileModal ? "mobile-modal" : ""}`}>
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Sliders size={16} strokeWidth={1.8} />
          <h3>BODY ARCHITECTURE</h3>
        </div>
        <div className="panel-header-actions">
          <button
            type="button"
            className="panel-reset-icon-btn"
            onClick={handleReset}
            title="Reset to Neutral Baseline"
          >
            <RotateCcw size={14} />
          </button>
          {onClose && (
            <button type="button" className="panel-close-btn" onClick={onClose} title="Close Panel">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 1. Man / Woman Morphology Toggle */}
      <div className="measurement-section">
        <label className="section-label">HUMAN PROFILE</label>
        <div className="category-toggle-grid">
          <button
            type="button"
            className={`category-btn ${currentCategory === "men" ? "active" : ""}`}
            onClick={() => handleCategoryChange("men")}
          >
            <User size={14} />
            <span>MAN</span>
          </button>
          <button
            type="button"
            className={`category-btn ${currentCategory === "women" ? "active" : ""}`}
            onClick={() => handleCategoryChange("women")}
          >
            <User size={14} />
            <span>WOMAN</span>
          </button>
        </div>
      </div>

      {/* 2. Proportion Presets */}
      <div className="measurement-section">
        <label className="section-label">SILHOUETTE PRESETS</label>
        <div className="presets-pill-row">
          {activePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-pill-btn"
              onClick={() => handlePresetSelect(preset.id)}
            >
              <Sparkles size={12} />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 4 Clean Body Parameters */}
      <div className="measurement-section sliders-section">
        <label className="section-label">PARAMETRIC MORPH CONTROLS</label>

        {/* 1. Height */}
        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-title">Height</span>
            <div className="slider-input-wrap">
              <span className="slider-num-value">{Math.round(currentParams.height)}</span>
              <span className="unit-label">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={currentParams.height}
            onChange={(e) => handleSliderChange("height", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* 2. Weight */}
        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-title">Weight</span>
            <div className="slider-input-wrap">
              <span className="slider-num-value">{Math.round(currentParams.weight)}</span>
              <span className="unit-label">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={currentParams.weight}
            onChange={(e) => handleSliderChange("weight", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* 3. Muscle */}
        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-title">Muscle</span>
            <div className="slider-input-wrap">
              <span className="slider-num-value">{Math.round(currentParams.muscle)}</span>
              <span className="unit-label">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={currentParams.muscle}
            onChange={(e) => handleSliderChange("muscle", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* 4. Proportions / Contour */}
        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-title">
              {currentCategory === "women" ? "Bust & Contour" : "Torso Proportion"}
            </span>
            <div className="slider-input-wrap">
              <span className="slider-num-value">{Math.round(currentParams.proportions)}</span>
              <span className="unit-label">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={currentParams.proportions}
            onChange={(e) => handleSliderChange("proportions", e.target.value)}
            className="seemz-range-slider"
          />
        </div>
      </div>

      <div className="panel-footer-note">
        <span>* Dynamic 3D avatar morphs smoothly in real time</span>
      </div>
    </div>
  );
};

export default MeasurementPanel;
