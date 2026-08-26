import React from "react";
import { RotateCw, Maximize2, Compass, Camera } from "lucide-react";
import "./CameraControls.css";

const CAMERA_VIEWS = [
  { id: "front", label: "FRONT" },
  { id: "threequarter", label: "3/4" },
  { id: "side", label: "PROFILE" },
  { id: "back", label: "BACK" },
  { id: "detail", label: "DETAIL" },
];

const CameraControls = ({ activeCameraView, onChangeCameraView, isAutoRotate, onToggleAutoRotate }) => {
  return (
    <div className="camera-controls-toolbar">
      <div className="camera-views-group">
        <div className="toolbar-label">
          <Camera size={13} strokeWidth={1.8} />
          <span>VIEW</span>
        </div>
        <div className="camera-view-pills">
          {CAMERA_VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`cam-view-btn ${activeCameraView === v.id ? "active" : ""}`}
              onClick={() => onChangeCameraView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="camera-actions-group">
        {/* Turntable 360 Auto-Rotate */}
        <button
          type="button"
          className={`cam-action-btn ${isAutoRotate ? "active" : ""}`}
          onClick={onToggleAutoRotate}
          title="360° Turntable Rotation"
        >
          <RotateCw size={14} className={isAutoRotate ? "spin-icon" : ""} />
          <span>360° SPIN</span>
        </button>
      </div>
    </div>
  );
};

export default CameraControls;
