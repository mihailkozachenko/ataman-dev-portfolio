"use client";

import { useEffect } from "react";
import { useIdleReady, useStillMotion } from "../../lib/motion";

/**
 * Lenis smooth scrolling. Loaded lazily after the page is idle, only for fine
 * pointers (touch keeps native scrolling), and switched off entirely when motion
 * is reduced or paused.
 */
export function SmoothScroll() {
  const still = useStillMotion();
  const ready = useIdleReady();

  useEffect(() => {
    if (still || !ready || !window.matchMedia("(pointer: fine)").matches) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.11 });
      destroy = () => lenis.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [still, ready]);

  return null;
}
