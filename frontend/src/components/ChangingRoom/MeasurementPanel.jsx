import React, { useState } from "react";
import { BODY_PRESETS, DEFAULT_BODY_MEN, DEFAULT_BODY_WOMEN } from "../../services/changingRoom/bodyEngine";
import { User, Sparkles, Check, RotateCcw, X, Sliders } from "lucide-react";
import "./MeasurementPanel.css";

const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

const MeasurementPanel = ({ bodyParams, onUpdateBody, onClose, isMobileModal = false }) => {
  const [unit, setUnit] = useState("cm"); // 'cm' or 'in'
  const [category, setCategory] = useState(bodyParams.category || "men");
  const [measurements, setMeasurements] = useState({ ...bodyParams });

  // Handle category change (Men / Women)
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const defaults = newCat === "women" ? DEFAULT_BODY_WOMEN : DEFAULT_BODY_MEN;
    const updated = { ...defaults, category: newCat };
    setMeasurements(updated);
    onUpdateBody(updated);
  };

  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    const preset = BODY_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const presetData = category === "women" ? preset.women : preset.men;
    const updated = { ...presetData, category };
    setMeasurements(updated);
    onUpdateBody(updated);
  };

  // Handle slider/input change with validation bounds
  const handleValueChange = (field, valCm) => {
    let num = Number(valCm);
    if (isNaN(num)) return;

    // Bounds limits in cm for realistic fashion mannequin
    const bounds = {
      height: [155, 205],
      chest: [75, 130],
      waist: [58, 120],
      hip: [80, 135],
      shoulderWidth: [35, 55],
      inseam: [68, 92],
    };

    if (bounds[field]) {
      num = Math.max(bounds[field][0], Math.min(bounds[field][1], num));
    }

    const updated = { ...measurements, [field]: num };
    setMeasurements(updated);
    onUpdateBody(updated);
  };

  // Convert for display
  const displayVal = (cmVal) => {
    if (unit === "in") {
      return Math.round(cmVal * CM_TO_IN * 10) / 10;
    }
    return Math.round(cmVal);
  };

  const handleDisplayChange = (field, displayVal) => {
    let num = Number(displayVal);
    if (isNaN(num)) return;
    const cmVal = unit === "in" ? num * IN_TO_CM : num;
    handleValueChange(field, cmVal);
  };

  return (
    <div className={`measurement-panel-card ${isMobileModal ? "mobile-modal" : ""}`}>
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Sliders size={16} strokeWidth={1.8} />
          <h3>BODY PROPORTIONS</h3>
        </div>
        <div className="panel-header-actions">
          {/* Unit Toggle */}
          <div className="unit-toggle-pill">
            <button
              type="button"
              className={unit === "cm" ? "active" : ""}
              onClick={() => setUnit("cm")}
            >
              CM
            </button>
            <button
              type="button"
              className={unit === "in" ? "active" : ""}
              onClick={() => setUnit("in")}
            >
              IN
            </button>
          </div>
          {onClose && (
            <button type="button" className="panel-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Category Selection */}
      <div className="measurement-section">
        <label className="section-label">ATELIER PROFILE</label>
        <div className="category-toggle-grid">
          <button
            type="button"
            className={`category-btn ${category === "men" ? "active" : ""}`}
            onClick={() => handleCategoryChange("men")}
          >
            <User size={16} />
            <span>MEN ATELIER</span>
          </button>
          <button
            type="button"
            className={`category-btn ${category === "women" ? "active" : ""}`}
            onClick={() => handleCategoryChange("women")}
          >
            <User size={16} />
            <span>WOMEN ATELIER</span>
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="measurement-section">
        <label className="section-label">PROPORTION PRESETS</label>
        <div className="presets-pill-row">
          {BODY_PRESETS.map((preset) => (
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

      {/* Measurements Sliders */}
      <div className="measurement-section sliders-section">
        <label className="section-label">PARAMETRIC METRICS</label>

        {/* Height */}
        <div className="slider-row">
          <div className="slider-header">
            <span>Height</span>
            <div className="slider-input-wrap">
              <input
                type="number"
                value={displayVal(measurements.height)}
                onChange={(e) => handleDisplayChange("height", e.target.value)}
              />
              <span className="unit-label">{unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={unit === "in" ? 61 : 155}
            max={unit === "in" ? 81 : 205}
            step={unit === "in" ? 0.5 : 1}
            value={displayVal(measurements.height)}
            onChange={(e) => handleDisplayChange("height", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* Chest / Bust */}
        <div className="slider-row">
          <div className="slider-header">
            <span>{category === "women" ? "Bust" : "Chest"}</span>
            <div className="slider-input-wrap">
              <input
                type="number"
                value={displayVal(measurements.chest)}
                onChange={(e) => handleDisplayChange("chest", e.target.value)}
              />
              <span className="unit-label">{unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={unit === "in" ? 30 : 75}
            max={unit === "in" ? 51 : 130}
            step={unit === "in" ? 0.5 : 1}
            value={displayVal(measurements.chest)}
            onChange={(e) => handleDisplayChange("chest", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* Waist */}
        <div className="slider-row">
          <div className="slider-header">
            <span>Waist</span>
            <div className="slider-input-wrap">
              <input
                type="number"
                value={displayVal(measurements.waist)}
                onChange={(e) => handleDisplayChange("waist", e.target.value)}
              />
              <span className="unit-label">{unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={unit === "in" ? 23 : 58}
            max={unit === "in" ? 47 : 120}
            step={unit === "in" ? 0.5 : 1}
            value={displayVal(measurements.waist)}
            onChange={(e) => handleDisplayChange("waist", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* Hip */}
        <div className="slider-row">
          <div className="slider-header">
            <span>Hips / Pelvis</span>
            <div className="slider-input-wrap">
              <input
                type="number"
                value={displayVal(measurements.hip)}
                onChange={(e) => handleDisplayChange("hip", e.target.value)}
              />
              <span className="unit-label">{unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={unit === "in" ? 31 : 80}
            max={unit === "in" ? 53 : 135}
            step={unit === "in" ? 0.5 : 1}
            value={displayVal(measurements.hip)}
            onChange={(e) => handleDisplayChange("hip", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* Shoulder Width (Optional) */}
        <div className="slider-row">
          <div className="slider-header">
            <span>Shoulder Breadth</span>
            <div className="slider-input-wrap">
              <input
                type="number"
                value={displayVal(measurements.shoulderWidth)}
                onChange={(e) => handleDisplayChange("shoulderWidth", e.target.value)}
              />
              <span className="unit-label">{unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={unit === "in" ? 14 : 35}
            max={unit === "in" ? 22 : 55}
            step={unit === "in" ? 0.5 : 1}
            value={displayVal(measurements.shoulderWidth)}
            onChange={(e) => handleDisplayChange("shoulderWidth", e.target.value)}
            className="seemz-range-slider"
          />
        </div>

        {/* Inseam (Optional) */}
        <div className="slider-row">
          <div className="slider-header">
            <span>Inseam / Leg Length</span>
            <div className="slider-input-wrap">
              <input
                type="number"
                value={displayVal(measurements.inseam)}
                onChange={(e) => handleDisplayChange("inseam", e.target.value)}
              />
              <span className="unit-label">{unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={unit === "in" ? 27 : 68}
            max={unit === "in" ? 36 : 92}
            step={unit === "in" ? 0.5 : 1}
            value={displayVal(measurements.inseam)}
            onChange={(e) => handleDisplayChange("inseam", e.target.value)}
            className="seemz-range-slider"
          />
        </div>
      </div>

      <div className="panel-footer-note">
        <span>* Procedural mannequin scales smoothly in real time</span>
      </div>
    </div>
  );
};

export default MeasurementPanel;
