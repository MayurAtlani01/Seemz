import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChangingRoomScene from "../../components/ChangingRoom/ChangingRoomScene";
import MeasurementPanel from "../../components/ChangingRoom/MeasurementPanel";
import GarmentControls from "../../components/ChangingRoom/GarmentControls";
import FitAnalysis from "../../components/ChangingRoom/FitAnalysis";
import CameraControls from "../../components/ChangingRoom/CameraControls";
import TransitionOverlay from "../../components/ChangingRoom/TransitionOverlay";
import ChatAssistant from "../../components/ChatAssistant/ChatAssistant";
import BodyScanner from "../../components/ChangingRoom/BodyScanner";
import { DEFAULT_AVATAR_PARAMS } from "../../services/changingRoom/avatarEngine";
import agentBridge from "../../services/changingRoom/agentBridge";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/profileservices";
import { Sliders, Layers, Activity, ArrowLeft, RotateCcw, Eye, Sparkles } from "lucide-react";
import "./ChangingRoom.css";

const STORAGE_KEY = "seemz_changing_room_config";

const DEFAULT_INITIAL_STATE = {
  body: DEFAULT_AVATAR_PARAMS,
  garment: {
    category: "none", // Loads bare avatar - clothing is selected on demand
    material: "cotton",
    style: "regular",
    size: "M",
    color: "#F5F5F5",
  },
};

function ChangingRoom() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

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
  const [showBodyScanner, setShowBodyScanner] = useState(false);

  // Load saved body profile from user context if available
  useEffect(() => {
    if (user?.bodyProfile?.avatarParams) {
      setConfig((prev) => ({
        ...prev,
        body: {
          category: user.bodyProfile.gender || "men",
          height: user.bodyProfile.avatarParams.height ?? 50,
          weight: user.bodyProfile.avatarParams.weight ?? 50,
          muscle: user.bodyProfile.avatarParams.muscle ?? 50,
          proportions: user.bodyProfile.avatarParams.proportions ?? 50,
          measurements: {
            gender: user.bodyProfile.gender || "men",
            height: user.bodyProfile.height ?? 175,
            shoulderWidth: user.bodyProfile.shoulderWidth ?? 44,
            chest: user.bodyProfile.chest ?? 96,
            waist: user.bodyProfile.waist ?? 80,
            hip: user.bodyProfile.hip ?? 94,
            armLength: user.bodyProfile.armLength ?? 60,
            inseam: user.bodyProfile.inseam ?? 80,
            torsoLength: user.bodyProfile.torsoLength ?? 65,
          }
        }
      }));
    }
  }, [user]);

  const handleSaveBodyScan = async (scannedProfile) => {
    const newBodyState = {
      category: scannedProfile.gender,
      height: scannedProfile.avatarParams.height,
      weight: scannedProfile.avatarParams.weight,
      muscle: scannedProfile.avatarParams.muscle,
      proportions: scannedProfile.avatarParams.proportions,
      measurements: {
        gender: scannedProfile.gender,
        height: scannedProfile.height,
        shoulderWidth: scannedProfile.shoulderWidth,
        chest: scannedProfile.chest,
        waist: scannedProfile.waist,
        hip: scannedProfile.hip,
        armLength: scannedProfile.armLength,
        inseam: scannedProfile.inseam,
        torsoLength: scannedProfile.torsoLength,
      }
    };

    setConfig((prev) => ({
      ...prev,
      body: newBodyState
    }));

    try {
      const updatedConfig = { ...config, body: newBodyState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
    } catch (err) {
      console.error("Failed to save config to localStorage:", err);
    }

    if (user) {
      try {
        await updateProfile({
          bodyProfile: {
            gender: scannedProfile.gender,
            height: scannedProfile.height,
            shoulderWidth: scannedProfile.shoulderWidth,
            chest: scannedProfile.chest,
            waist: scannedProfile.waist,
            hip: scannedProfile.hip,
            armLength: scannedProfile.armLength,
            inseam: scannedProfile.inseam,
            torsoLength: scannedProfile.torsoLength,
            avatarParams: scannedProfile.avatarParams
          }
        });
        if (refreshUser) {
          await refreshUser();
        }
      } catch (err) {
        console.error("Failed to save body profile to backend:", err);
      }
    }
  };

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

        {/* Desktop Floating Left Panel (Body Measurements / Morph Controls) */}
        {showBodyPanelDesktop && (
          <aside className="studio-floating-panel desktop-left-panel">
            <MeasurementPanel
              bodyParams={config.body}
              onUpdateBody={handleUpdateBody}
              onClose={() => setShowBodyPanelDesktop(false)}
              onStartBodyScan={() => setShowBodyScanner(true)}
            />
          </aside>
        )}

        {/* Desktop Floating Right Panel (Garment & Live Fit Analysis - Disabled for avatar testing) */}
        {/* <aside className="studio-floating-panel desktop-right-panel">
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
        </aside> */}

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
                  onStartBodyScan={() => {
                    setActiveMobileTab(null);
                    setShowBodyScanner(true);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {showBodyScanner && (
        <BodyScanner
          initialGender={config.body.category || "men"}
          onClose={() => setShowBodyScanner(false)}
          onSave={handleSaveBodyScan}
        />
      )}

      {/* Seemz AI assistant */}
      <ChatAssistant />
    </div>
  );
}

export default ChangingRoom;
