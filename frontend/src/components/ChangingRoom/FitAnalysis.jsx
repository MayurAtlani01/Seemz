import React from "react";
import { analyzeFit } from "../../services/changingRoom/fitEngine";
import { Activity, Eye, ShieldCheck, HelpCircle } from "lucide-react";
import "./FitAnalysis.css";

const FitAnalysis = ({ bodyParams, garmentConfig, isTensionMode, onToggleTensionMode }) => {
  const analysis = analyzeFit(bodyParams, garmentConfig);

  return (
    <div className="fit-analysis-card">
      <div className="fit-header">
        <div className="fit-title-wrap">
          <Activity size={16} strokeWidth={1.8} />
          <h3>3D FIT ESTIMATION</h3>
        </div>
        {/* Tension Heatmap Mode Toggle */}
        <button
          type="button"
          className={`tension-toggle-btn ${isTensionMode ? "active" : ""}`}
          onClick={onToggleTensionMode}
          title="Toggle tension analysis"
        >
          <Eye size={12} />
          <span>{isTensionMode ? "HEATMAP ON" : "STUDIO VIEW"}</span>
        </button>
      </div>

      {/* Silhouette Hero */}
      <div className="silhouette-hero">
        <span className="silhouette-tag">ESTIMATED SILHOUETTE</span>
        <h4 className="silhouette-title">{analysis.silhouette}</h4>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="fit-metrics-list">
        {Object.entries(analysis.metrics).map(([key, metric]) => (
          <div key={key} className="fit-metric-row">
            <div className="metric-left">
              <span className="metric-name">{metric.label}</span>
              {metric.deltaCm !== undefined && (
                <span className="metric-delta">
                  {metric.deltaCm >= 0 ? `+${metric.deltaCm}` : metric.deltaCm} cm
                </span>
              )}
            </div>
            <div className="metric-right">
              <span className="metric-status" style={{ color: metric.color }}>
                {metric.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="fit-disclaimer">
        <span>* Parametric fit estimation calculated for visual proportion testing</span>
      </div>
    </div>
  );
};

export default FitAnalysis;
