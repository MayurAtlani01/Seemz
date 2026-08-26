import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChangingRoomScene from "../../components/ChangingRoom/ChangingRoomScene";
import MeasurementPanel from "../../components/ChangingRoom/MeasurementPanel";
import GarmentControls from "../../components/ChangingRoom/GarmentControls";
import FitAnalysis from "../../components/ChangingRoom/FitAnalysis";
import CameraControls from "../../components/ChangingRoom/CameraControls";
import TransitionOverlay from "../../components/ChangingRoom/TransitionOverlay";
import { DEFAULT_BODY_MEN } from "../../services/changingRoom/bodyEngine";
import agentBridge from "../../services/changingRoom/agentBridge";
import { Sliders, Layers, Activity, ArrowLeft, RotateCcw, Eye, Sparkles } from "lucide-react";
import "./ChangingRoom.css";

const STORAGE_KEY = "seemz_changing_room_config";

const DEFAULT_INITIAL_STATE = {
  body: DEFAULT_BODY_MEN,
  garment: {
    category: "tshirt",
    material: "cotton",
    style: "oversized",
    size: "L",
    color: "#F5F5F5",
  },
};

function ChangingRoom() {
  const navigate = useNavigate();

  // Load persisted configuration or defaults
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_INITIAL_STATE;
  });

  // UI Interactive States
  const [showPortalTransition, setShowPortalTransition] = useState(true);
  const [activeCameraView, setActiveCameraView] = useState("front");
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isTensionMode, setIsTensionMode] = useState(false);

  // Mobile Drawer Tab: 'garment', 'fit', 'body', or null (closed)
  const [activeMobileTab, setActiveMobileTab] = useState("garment");
  const [showBodyPanelDesktop, setShowBodyPanelDesktop] = useState(true);

  // Save changes to localStorage & sync agent bridge
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
    agentBridge.syncState(config.body, config.garment, null);
  }, [config]);

  // Subscribe to Agentic AI commands
  useEffect(() => {
    const unsubscribe = agentBridge.subscribe((action, payload) => {
      if (action === "SET_BODY_MEASUREMENTS") {
        setConfig((prev) => ({ ...prev, body: { ...prev.body, ...payload } }));
      } else if (action === "SET_GARMENT_CATEGORY") {
        setConfig((prev) => ({ ...prev, garment: { ...prev.garment, category: payload } }));
      } else if (action === "SET_MATERIAL") {
        setConfig((prev) => ({ ...prev, garment: { ...prev.garment, material: payload } }));
      } else if (action === "SET_STYLE") {
        setConfig((prev) => ({ ...prev, garment: { ...prev.garment, style: payload } }));
      } else if (action === "SET_SIZE") {
        setConfig((prev) => ({ ...prev, garment: { ...prev.garment, size: payload } }));
      } else if (action === "SET_COLOR") {
        setConfig((prev) => ({ ...prev, garment: { ...prev.garment, color: payload } }));
      } else if (action === "CHANGE_CAMERA") {
        setActiveCameraView(payload);
      }
    });

    return unsubscribe;
  }, []);

  const handleUpdateBody = (newBody) => {
    setConfig((prev) => ({ ...prev, body: newBody }));
  };

  const handleUpdateGarment = (newGarment) => {
    setConfig((prev) => ({ ...prev, garment: newGarment }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_INITIAL_STATE);
  };

  return (
    <div className="changing-room-page">
      {/* Cinematic Transition Portal on load */}
      {showPortalTransition && (
        <TransitionOverlay onComplete={() => setShowPortalTransition(false)} />
      )}

      {/* Top Luxury Studio Header */}
      <header className="studio-top-bar">
        <div className="studio-brand-left">
          <Link to="/" className="studio-back-btn" title="Return to SEEMZ">
            <ArrowLeft size={16} />
            <span>EXIT ATELIER</span>
          </Link>
          <div className="studio-brand-badge">
            <span className="atelier-tag">SEEMZ EXCLUSIVE</span>
            <h1>CHANGING ROOM</h1>
          </div>
        </div>

        <div className="studio-top-actions">
          <button
            type="button"
            className={`studio-header-btn ${showBodyPanelDesktop ? "active" : ""}`}
            onClick={() => setShowBodyPanelDesktop((prev) => !prev)}
          >
            <Sliders size={14} />
            <span>BODY METRICS</span>
          </button>

          <button
            type="button"
            className="studio-header-btn"
            onClick={handleReset}
            title="Reset All Configurations"
          >
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>
        </div>
      </header>

      {/* Main 3D Changing Room Viewport */}
      <main className="studio-viewport-area">
        <ChangingRoomScene
          bodyParams={config.body}
          garmentConfig={config.garment}
          activeCameraView={activeCameraView}
          isAutoRotate={isAutoRotate}
          isTensionMode={isTensionMode}
        />

        {/* Desktop Floating Left Panel (Body Measurements) */}
        {showBodyPanelDesktop && (
          <aside className="studio-floating-panel desktop-left-panel">
            <MeasurementPanel
              bodyParams={config.body}
              onUpdateBody={handleUpdateBody}
              onClose={() => setShowBodyPanelDesktop(false)}
            />
          </aside>
        )}

        {/* Desktop Floating Right Panel (Garment & Live Fit Analysis) */}
        <aside className="studio-floating-panel desktop-right-panel">
          <GarmentControls
            garmentConfig={config.garment}
            onUpdateGarment={handleUpdateGarment}
          />
          <FitAnalysis
            bodyParams={config.body}
            garmentConfig={config.garment}
            isTensionMode={isTensionMode}
            onToggleTensionMode={() => setIsTensionMode((prev) => !prev)}
          />
        </aside>

        {/* Floating Bottom Center: Camera & Turntable Controls */}
        <div className="studio-camera-dock">
          <CameraControls
            activeCameraView={activeCameraView}
            onChangeCameraView={setActiveCameraView}
            isAutoRotate={isAutoRotate}
            onToggleAutoRotate={() => setIsAutoRotate((prev) => !prev)}
          />
        </div>
      </main>

      {/* Mobile Drawer Bottom Sheets */}
      <div className="mobile-studio-sheet-wrapper">
        {/* Mobile Tab Trigger Bar */}
        <div className="mobile-bottom-tabs">
          <button
            type="button"
            className={`mobile-tab-btn ${activeMobileTab === "garment" ? "active" : ""}`}
            onClick={() =>
              setActiveMobileTab((prev) => (prev === "garment" ? null : "garment"))
            }
          >
            <Layers size={16} />
            <span>GARMENT</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeMobileTab === "fit" ? "active" : ""}`}
            onClick={() =>
              setActiveMobileTab((prev) => (prev === "fit" ? null : "fit"))
            }
          >
            <Activity size={16} />
            <span>FIT ANALYSIS</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${activeMobileTab === "body" ? "active" : ""}`}
            onClick={() =>
              setActiveMobileTab((prev) => (prev === "body" ? null : "body"))
            }
          >
            <Sliders size={16} />
            <span>BODY</span>
          </button>
        </div>

        {/* Mobile Slide-Up Drawer Content */}
        {activeMobileTab && (
          <div className="mobile-drawer-sheet">
            <div className="mobile-drawer-handle" onClick={() => setActiveMobileTab(null)} />
            <div className="mobile-drawer-content">
              {activeMobileTab === "garment" && (
                <GarmentControls
                  garmentConfig={config.garment}
                  onUpdateGarment={handleUpdateGarment}
                />
              )}
              {activeMobileTab === "fit" && (
                <FitAnalysis
                  bodyParams={config.body}
                  garmentConfig={config.garment}
                  isTensionMode={isTensionMode}
                  onToggleTensionMode={() => setIsTensionMode((prev) => !prev)}
                />
              )}
              {activeMobileTab === "body" && (
                <MeasurementPanel
                  bodyParams={config.body}
                  onUpdateBody={handleUpdateBody}
                  onClose={() => setActiveMobileTab(null)}
                  isMobileModal={true}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChangingRoom;
