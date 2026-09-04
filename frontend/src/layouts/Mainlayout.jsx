import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import PageTransition from "../components/PageTransition/PageTransition";
import ChatAssistant from '../components/ChatAssistant/ChatAssistant';
import BodyScanner from '../components/BodyScanner/BodyScanner';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/profileservices';
import { Camera } from 'lucide-react';
import './Mainlayout.css';

function Mainlayout() {
  const [showBodyScanner, setShowBodyScanner] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleOpenScanner = () => {
    setShowBodyScanner(true);
  };

  const handleSaveBodyScan = async (scannedProfile) => {
    // 1. Update LocalStorage profile structure
    const newBodyState = {
      gender: scannedProfile.gender,
      height: scannedProfile.height,
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
      },
      confidenceScore: scannedProfile.confidenceScore,
      avatarParams: scannedProfile.avatarParams
    };

    try {
      localStorage.setItem("seemz_body_profile_v1", JSON.stringify(newBodyState));
      localStorage.setItem("seemz_changing_room_config_v1", JSON.stringify({ body: newBodyState }));
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
      <PageTransition>
        <Outlet context={{ 
          onStartBodyScan: handleOpenScanner
        }} />
      </PageTransition>
      <Footer/>
      <ChatAssistant/>

      {/* Floating Action Body Scan Button (Bottom-Left) */}
      <button 
        type="button" 
        className="seemz-floating-scan-btn"
        onClick={handleOpenScanner}
        title="Start AI Body Scan"
      >
        <Camera size={16} />
        <span>BODY SCAN</span>
      </button>

      {/* AI Body Scanner Overlay Modal */}
      {showBodyScanner && (
        <BodyScanner
          initialGender={user?.bodyProfile?.gender || "men"}
          onClose={() => setShowBodyScanner(false)}
          onSave={handleSaveBodyScan}
        />
      )}
    </>
  );
}

export default Mainlayout;