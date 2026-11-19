"use client";

import { useRef, type CSSProperties } from "react";
import { eye } from "../../data/media";
import { useStillMotion } from "../../lib/motion";
import { useGaze } from "../../lib/useGaze";
import { Photo } from "../media/Picture";

/** Iris diameter, % of the eye box width (a little over the opening's height, as in life). */
const IRIS_W = 27;
/** How far the iris may travel from the centre (% of the eye box width), and when it blinks. */
const GAZE = { reach: { x: 6.5, y: 3.2 }, fullTurn: 420, blink: { min: 4000, max: 8000, ms: 240 } };

/**
 * One eye in one cloud. Its iris follows the pointer within the white (on touch
 * screens it follows the scroll: it looks towards the middle of the screen as
 * the cloud passes, with a nudge in the scroll's direction) and it blinks every
 * 4–8 s. Decorative (its layer is aria-hidden). Motion reduced or paused: it
 * looks straight ahead and never blinks.
 */
export function CloudEye({ x, y }: { x: number; y: number }) {
  const still = useStillMotion();
  const root = useRef<HTMLDivElement>(null);
  const iris = useRef<HTMLImageElement>(null);

  useGaze(root, iris, still, GAZE);

  const b = eye.box;
  return (
    <div
      ref={root}
      className="cloud-eye"
      style={
        {
          left: `${x}%`,
          top: `${y}%`,
          "--opening": `url(${eye.opening})`,
          "--ix": `${b.left + b.width / 2}%`,
          "--iy": `${b.top + b.height / 2}%`,
          "--iw": `${IRIS_W}%`,
          "--lid-top": `${b.top}%`,
          "--lid-bottom": `${b.top + b.height}%`,
          // Lid up: shifted by the opening's height, in % of the lid's own height.
          "--lid-shift": `${(-100 * (b.height + 6)) / (b.top + b.height + 3)}%`,
        } as CSSProperties
      }
    >
      <Photo photo={eye.white} sizes="(max-width: 640px) 90px, 140px" />
      <div className="cloud-eye-open">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-sized WebP */}
        <img ref={iris} src={eye.iris.src} width={eye.iris.width} height={eye.iris.height} alt="" className="cloud-eye-iris" loading="lazy" decoding="async" />
        <span className="cloud-eye-lid" />
      </div>
    </div>
  );
}
