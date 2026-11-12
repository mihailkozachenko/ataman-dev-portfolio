"use client";

import { setMotionPaused, useMotionPaused, usePrefersReducedMotion } from "../lib/motion";
import { PauseIcon, PlayIcon, StopIcon } from "./icons";

/**
 * WCAG 2.2.2 (Pause, Stop, Hide): looping motion must be stoppable by the user,
 * not only via the OS setting. MotionDirector applies the state to the page.
 * A 44px icon square; the label is for screen readers and the tooltip.
 */
export function MotionToggle() {
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();

  if (reduced) {
    return (
      <span className="xp-btn xp-btn-icon xp-btn-off" title="Motion off (system setting)">
        <StopIcon />
        <span className="sr-only">Motion off</span>
      </span>
    );
  }

  const label = paused ? "Play motion" : "Pause motion";
  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!paused)}
      className="xp-btn xp-btn-icon"
      title={label}
    >
      {paused ? <PlayIcon /> : <PauseIcon />}
      <span className="sr-only">{label}</span>
    </button>
  );
}
