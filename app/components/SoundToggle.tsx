"use client";

import { setSoundEnabled, useSoundEnabled } from "../lib/sound";
import { SoundOffIcon, SoundOnIcon } from "./icons";

/** Quiet ambient + pops. Off by default; label says what the click will do. */
export function SoundToggle() {
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!on)}
      className="plaque plaque-white toggle-plaque text-xs"
    >
      {on ? <SoundOnIcon /> : <SoundOffIcon />}
      <span className="sr-only sm:not-sr-only">{on ? "Sound off" : "Sound on"}</span>
    </button>
  );
}
