import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import ChatAssistant from '../components/ChatAssistant/ChatAssistant';
import BodyScanner from '../components/ChangingRoom/BodyScanner';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/profileservices';
import { Camera } from 'lucide-react';
import './Mainlayout.css';

function Mainlayout() {
  const [showBodyScanner, setShowBodyScanner] = useState(false);
  const [scannerInitialStep, setScannerInitialStep] = useState("setup");
  const { user, refreshUser } = useAuth();

  const handleOpenScanner = (step = "setup") => {
    setScannerInitialStep(step);
    setShowBodyScanner(true);
  };

  const handleSaveBodyScan = async (scannedProfile) => {
    // 1. Update LocalStorage config structure
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

    try {
      // Keep other config variables intact if they exist
      const existing = localStorage.getItem("seemz_changing_room_config_v1");
      let parsed = {};
      if (existing) {
        try {
          parsed = JSON.parse(existing);
        } catch (e) {}
      }
      localStorage.setItem("seemz_changing_room_config_v1", JSON.stringify({
        ...parsed,
        body: newBodyState
      }));
    } catch (err) {
      console.error("Failed to save body scan configuration:", err);
    }

    // 2. Sync to database profile if authenticated
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
        console.error("Failed to sync scanned profile with DB:", err);
      }
    }
  };

  return (
    <>
      <ScrollToTop/>
      <Navbar/>
      <Outlet context={{ 
        onStartBodyScan: () => handleOpenScanner("setup"),
        onStartLiveTryOn: () => handleOpenScanner("live_tryon")
      }} />
      <Footer/>
      <ChatAssistant/>

      {/* Floating Action Body Scan Button (Bottom-Left) */}
      <button 
        type="button" 
        className="seemz-floating-scan-btn"
        onClick={() => handleOpenScanner("setup")}
        title="Start AI Body Scan"
      >
        <Camera size={16} />
        <span>BODY SCAN</span>
      </button>

      {/* AI Body Scanner Overlay Modal */}
      {showBodyScanner && (
        <BodyScanner
          initialGender={user?.bodyProfile?.gender || "men"}
          initialStep={scannerInitialStep}
          onClose={() => setShowBodyScanner(false)}
          onSave={handleSaveBodyScan}
        />
      )}
    </>
  );
}

export default Mainlayout;