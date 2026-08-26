import React, { useEffect, useState } from "react";
import "./TransitionOverlay.css";

const TransitionOverlay = ({ onComplete }) => {
  const [stage, setStage] = useState("enter"); // 'enter', 'reveal', 'done'

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("reveal"), 800);
    const timer2 = setTimeout(() => {
      setStage("done");
      if (onComplete) onComplete();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (stage === "done") return null;

  return (
    <div className={`transition-portal-overlay ${stage}`}>
      <div className="portal-light-beam" />
      <div className="portal-content">
        <div className="portal-tagline">SEEMZ ATELIER</div>
        <h1 className="portal-title">3D FASHION LABORATORY</h1>
        <div className="portal-status">
          <span className="portal-dot" /> INITIALIZING PROCEDURAL ENGINE
        </div>
      </div>
      <div className="portal-shutter-top" />
      <div className="portal-shutter-bottom" />
    </div>
  );
};

export default TransitionOverlay;
