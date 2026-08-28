import React from "react";
import {
  GARMENT_CATEGORIES,
  GARMENT_STYLES,
  SIZES_ALPHA,
  SIZES_NUMERIC,
} from "../../services/changingRoom/garmentEngine";
import { MATERIALS, COLOR_PALETTE } from "../../services/changingRoom/materialEngine";
import { Layers, Sparkles, Check, Palette } from "lucide-react";
import "./GarmentControls.css";

const GarmentControls = ({ garmentConfig, onUpdateGarment }) => {
  const currentCategory =
    GARMENT_CATEGORIES.find((c) => c.id === garmentConfig.category) || GARMENT_CATEGORIES[0];
  const availableStyles = GARMENT_STYLES[currentCategory.type] || GARMENT_STYLES.top;
  const isPants = currentCategory.type === "bottom";
  const availableSizes = isPants ? SIZES_NUMERIC : SIZES_ALPHA;

  const handleCategoryChange = (catId) => {
    if (catId === "none") {
      onUpdateGarment({
        ...garmentConfig,
        category: "none",
      });
      return;
    }

    const nextCategory = GARMENT_CATEGORIES.find((c) => c.id === catId);
    const nextType = nextCategory?.type || "top";
    const nextStyles = GARMENT_STYLES[nextType] || GARMENT_STYLES.top;
    const nextSizes = nextType === "bottom" ? SIZES_NUMERIC : SIZES_ALPHA;

    // Default material recommendation based on category
    let nextMat = garmentConfig.material || "cotton";
    if (catId === "jeans") nextMat = "denim";
    else if (catId === "trousers") nextMat = "wool";
    else if (catId === "shirt") nextMat = "linen";
    else if (catId === "hoodie") nextMat = "cotton";

    onUpdateGarment({
      ...garmentConfig,
      category: catId,
      material: nextMat,
      style: nextStyles[0]?.id || "regular",
      size: nextSizes[2] || "M", // Default to M or 32
    });
  };

  return (
    <div className="garment-controls-card">
      <div className="controls-header">
        <div className="controls-title-wrap">
          <Layers size={16} strokeWidth={1.8} />
          <h3>GARMENT ARCHITECTURE</h3>
        </div>
      </div>

      {/* 1. Category Selector */}
      <div className="control-group">
        <label className="control-label">GARMENT CATEGORY</label>
        <div className="category-pills-row">
          {GARMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`cat-pill-btn ${garmentConfig.category === cat.id ? "active" : ""}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Material Selector */}
      <div className="control-group">
        <div className="control-label-row">
          <label className="control-label">MATERIAL & WEAVE PHYSICS</label>
          <span className="material-current-name">
            {MATERIALS[garmentConfig.material]?.name}
          </span>
        </div>
        <div className="materials-grid">
          {Object.values(MATERIALS).map((mat) => (
            <button
              key={mat.id}
              type="button"
              className={`mat-card-btn ${garmentConfig.material === mat.id ? "active" : ""}`}
              onClick={() => onUpdateGarment({ ...garmentConfig, material: mat.id })}
            >
              <div className="mat-card-top">
                <span className="mat-title">{mat.name}</span>
                {garmentConfig.material === mat.id && <Check size={12} />}
              </div>
              <div className="mat-physics-bars">
                <div className="physics-bar-item">
                  <span>Weight</span>
                  <div className="mini-bar-track">
                    <div
                      className="mini-bar-fill"
                      style={{ width: `${mat.weight * 100}%` }}
                    />
                  </div>
                </div>
                <div className="physics-bar-item">
                  <span>Drape</span>
                  <div className="mini-bar-track">
                    <div
                      className="mini-bar-fill"
                      style={{ width: `${mat.drape * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Style / Silhouette Selector */}
      <div className="control-group">
        <div className="control-label-row">
          <label className="control-label">SILHOUETTE & EASE</label>
        </div>
        <div className="style-pills-row">
          {availableStyles.map((st) => (
            <button
              key={st.id}
              type="button"
              className={`style-pill-btn ${garmentConfig.style === st.id ? "active" : ""}`}
              onClick={() => onUpdateGarment({ ...garmentConfig, style: st.id })}
              title={st.desc}
            >
              <span>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Size Selector */}
      <div className="control-group">
        <div className="control-label-row">
          <label className="control-label">ATELIER SIZE</label>
        </div>
        <div className="size-pills-row">
          {availableSizes.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`size-pill-btn ${garmentConfig.size === sz ? "active" : ""}`}
              onClick={() => onUpdateGarment({ ...garmentConfig, size: sz })}
            >
              <span>{sz}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Color Palette */}
      <div className="control-group">
        <div className="control-label-row">
          <label className="control-label">COLOR PALETTE</label>
          <span className="color-name-label">
            {COLOR_PALETTE.find((c) => c.hex === garmentConfig.color)?.name || "Bespoke"}
          </span>
        </div>
        <div className="color-swatch-row">
          {COLOR_PALETTE.map((col) => (
            <button
              key={col.id}
              type="button"
              className={`color-swatch-btn ${garmentConfig.color === col.hex ? "active" : ""}`}
              style={{ backgroundColor: col.hex }}
              onClick={() => onUpdateGarment({ ...garmentConfig, color: col.hex })}
              title={col.name}
            >
              {garmentConfig.color === col.hex && (
                <Check
                  size={12}
                  color={col.darkText ? "#000000" : "#ffffff"}
                  strokeWidth={2.5}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GarmentControls;
