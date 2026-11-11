"use client";

import { setMotionPaused, useMotionPaused, usePrefersReducedMotion } from "../lib/motion";
import { PauseIcon, PlayIcon, StopIcon } from "./icons";

/**
 * WCAG 2.2.2 (Pause, Stop, Hide): looping motion must be stoppable by the user,
 * not only via the OS setting. MotionDirector applies the state to the page.
 * Fixed width in every state, so swapping labels never shifts the header.
 */
export function MotionToggle() {
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();

  if (reduced) {
    return (
      <span className="plaque plaque-white toggle-plaque text-xs">
        <StopIcon />
        <span className="sr-only sm:not-sr-only">Motion off</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!paused)}
      className="plaque plaque-white toggle-plaque text-xs"
    >
      {paused ? <PlayIcon /> : <PauseIcon />}
      <span className="sr-only sm:not-sr-only">{paused ? "Play motion" : "Pause motion"}</span>
    </button>
  );
}
