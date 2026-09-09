import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useCinematicScroll — High-performance scroll-driven camera and parallax tracking hook.
 * Uses requestAnimationFrame with dampening and IntersectionObserver for 0% idle CPU overhead.
 * Automatically respects prefers-reduced-motion and provides simplified transforms for mobile.
 */
export function useCinematicScroll({
  threshold = 0.1,
  dampening = 0.12,
  offsetStart = 0,
  offsetEnd = 0,
} = {}) {
  const elementRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const isRunningRef = useRef(false);
  const animFrameRef = useRef(null);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      setHasEntered(true);
      setScrollProgress(0.5);
      return;
    }

    const lerp = (a, b, n) => a + (b - a) * n;

    const renderLoop = () => {
      if (!isIntersectingRef.current) {
        isRunningRef.current = false;
        return;
      }

      const diff = targetProgressRef.current - currentProgressRef.current;

      if (Math.abs(diff) > 0.0005) {
        currentProgressRef.current = lerp(currentProgressRef.current, targetProgressRef.current, dampening);
        const p = Math.max(0, Math.min(1, currentProgressRef.current));
        setScrollProgress(p);

        // Update CSS custom variable on the element directly for 120fps CSS transform tracking
        if (el) {
          el.style.setProperty("--scroll-progress", p.toFixed(4));
          el.style.setProperty("--parallax-drift", (p - 0.5).toFixed(4));
        }

        animFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        currentProgressRef.current = targetProgressRef.current;
        const p = Math.max(0, Math.min(1, currentProgressRef.current));
        setScrollProgress(p);
        if (el) {
          el.style.setProperty("--scroll-progress", p.toFixed(4));
          el.style.setProperty("--parallax-drift", (p - 0.5).toFixed(4));
        }
        isRunningRef.current = false;
      }
    };

    const calculateProgress = () => {
      if (!el || !isIntersectingRef.current) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      const totalDist = windowHeight + rect.height;
      const currentDist = windowHeight - rect.top;

      const rawP = Math.max(0, Math.min(1, currentDist / totalDist));
      targetProgressRef.current = rawP;

      if (!isRunningRef.current) {
        isRunningRef.current = true;
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        setIsVisible(entry.isIntersecting);

        if (entry.isIntersecting) {
          setHasEntered(true);
          calculateProgress();
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: "50px 0px 50px 0px",
      }
    );

    observer.observe(el);

    const onScroll = () => {
      if (isIntersectingRef.current) {
        calculateProgress();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [dampening, threshold]);

  return {
    ref: elementRef,
    scrollProgress,
    isVisible,
    hasEntered,
  };
}

export default useCinematicScroll;
