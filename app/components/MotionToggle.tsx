"use client";

import { useEffect } from "react";
import { setMotionPaused, useMotionPaused, usePrefersReducedMotion } from "../lib/motion";
import { PauseIcon, PlayIcon, StopIcon } from "./icons";

/**
 * WCAG 2.2.2 (Pause, Stop, Hide): looping motion must be stoppable by the user,
 * not only via the OS setting. Also mirrors the state onto <html data-motion>
 * so CSS-only animations pause too.
 */
export function MotionToggle() {
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();
  const still = reduced || paused;

  useEffect(() => {
    document.documentElement.dataset.motion = still ? "still" : "on";
  }, [still]);

  if (reduced) {
    return (
      <span className="plaque plaque-tag plaque-white text-xs">
        <StopIcon /> Motion off
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!paused)}
      className="plaque plaque-white text-xs"
    >
      {paused ? <PlayIcon /> : <PauseIcon />}
      {paused ? "Play motion" : "Pause motion"}
    </button>
  );
}
