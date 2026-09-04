import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./PageTransition.css";

/**
 * PageTransition — Lightweight, high-performance route transition wrapper.
 * Smoothly fades and elevates incoming views without blocking React Router navigation.
 */
function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === "fadeOut") {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        setTransitionStage("fadeIn");
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, location]);

  return (
    <div className={`seemz-page-transition ${transitionStage}`}>
      {children}
    </div>
  );
}

export default PageTransition;
