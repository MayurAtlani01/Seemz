import React from "react";
import "./ProductColorStudio.css";

/**
 * ProductColorStudio — Interactive architectural color palette selector.
 * Provides smooth colorway switching with authentic luxury editorial styling.
 */
const CURATED_COLORWAYS = [
  { id: "noir", name: "Obsidian Black", hex: "#0c0c0c", border: "rgba(255,255,255,0.25)" },
  { id: "chalk", name: "Ivory White", hex: "#e8e6e1", border: "transparent" },
  { id: "charcoal", name: "Charcoal Grey", hex: "#262629", border: "rgba(255,255,255,0.15)" },
  { id: "espresso", name: "Dark Brown", hex: "#281f1b", border: "rgba(255,255,255,0.15)" },
  { id: "navy", name: "Midnight Navy", hex: "#111827", border: "rgba(255,255,255,0.15)" },
];

function ProductColorStudio({ selectedColor, onSelectColor, availableColors = null }) {
  const colorways = availableColors && availableColors.length > 0
    ? availableColors
    : CURATED_COLORWAYS;

  return (
    <div className="product-color-studio">
      <div className="color-studio-header">
        <span className="studio-kicker">COLOR</span>
        <span className="selected-color-name">
          {selectedColor?.name || colorways[0]?.name || "Obsidian Black"}
        </span>
      </div>

      <div className="color-swatches-grid">
        {colorways.map((cw) => {
          const isActive = (selectedColor?.id || "noir") === cw.id;
          return (
            <button
              key={cw.id}
              type="button"
              className={`swatch-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => onSelectColor && onSelectColor(cw)}
              title={cw.name}
            >
              <span
                className="swatch-circle"
                style={{
                  backgroundColor: cw.hex,
                  border: `1px solid ${cw.border}`,
                }}
              />
              <span className="swatch-label">{cw.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProductColorStudio;
export { CURATED_COLORWAYS };
