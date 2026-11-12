"use client";

import { useEffect } from "react";
import { armButtonClicks, armSoundOnFirstGesture, setSoundEnabled, useSoundEnabled } from "../lib/sound";
import { SoundOffIcon, SoundOnIcon } from "./icons";

/**
 * Music + motors + pops. On by default (the choice is remembered); audio starts
 * on the first click / key press anywhere, as browsers require. The label says
 * what a click will do.
 */
export function SoundToggle() {
  const on = useSoundEnabled();
  useEffect(() => {
    armSoundOnFirstGesture();
    armButtonClicks();
  }, []);
  const label = on ? "Sound off" : "Sound on";
  return (
    <button
      type="button"
      data-sound-toggle=""
      aria-pressed={on}
      onClick={() => setSoundEnabled(!on)}
      className="xp-btn xp-btn-icon"
      title={label}
    >
      {on ? <SoundOnIcon /> : <SoundOffIcon />}
      <span className="sr-only">Sound</span>
    </button>
  );
}
