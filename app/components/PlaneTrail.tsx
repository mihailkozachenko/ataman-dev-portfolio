"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Flight path expressed as percentages of the hero's own box, shared by the
// trail (SVG, stretches with the box) and the plane (HTML, stays undistorted).
const START = { x: -6, y: 68 };
const END = { x: 106, y: 16 };

// Fallback used only for the first frame, before the container has been
// measured — the box is always wider than tall, so this leans shallow.
const FALLBACK_ANGLE_DEG = -17;

const FLIGHT_DURATION = 4.5;
const REPEAT_DELAY = 9;
const OPACITY_KEYFRAMES = [0, 1, 1, 0];
const OPACITY_TIMES = [0, 0.1, 0.88, 1];

// A slim, minimal jet dart — not the folded paper-plane glyph used elsewhere
// in the UI. Two triangles for the fuselage/wings plus a small tail fin.
const PLANE_PATH = "M100,20 L34,8 L0,17 L0,23 L34,32 Z";

export function PlaneTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [angleDeg, setAngleDeg] = useState(FALLBACK_ANGLE_DEG);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // The trail's own line is an SVG stretched with preserveAspectRatio="none",
    // so it always matches the box's real aspect ratio automatically. The
    // plane is a plain HTML element instead (so its silhouette isn't skewed
    // by that stretch), which means its rotation has to be computed from the
    // path's real pixel-space slope — not a fixed angle tuned for one aspect.
    const updateAngle = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dx = ((END.x - START.x) / 100) * width;
      const dy = ((END.y - START.y) / 100) * height;
      setAngleDeg((Math.atan2(dy, dx) * 180) / Math.PI);
    };

    updateAngle();
    const observer = new ResizeObserver(updateAngle);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="planeTrailGradient"
            gradientUnits="userSpaceOnUse"
            x1={START.x}
            y1={START.y}
            x2={END.x}
            y2={END.y}
          >
            <stop offset="0%" stopColor="var(--color-lavender-mist)" stopOpacity={0} />
            <stop offset="55%" stopColor="var(--color-lavender-mist)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-lavender-mist)" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <motion.path
          d={`M ${START.x} ${START.y} L ${END.x} ${END.y}`}
          pathLength={1}
          fill="none"
          stroke="url(#planeTrailGradient)"
          strokeWidth={0.15}
          strokeLinecap="round"
          strokeDasharray="1 1"
          initial={{ strokeDashoffset: 1, opacity: 0 }}
          animate={{ strokeDashoffset: 0, opacity: OPACITY_KEYFRAMES }}
          transition={{
            strokeDashoffset: {
              duration: FLIGHT_DURATION,
              repeat: Infinity,
              repeatDelay: REPEAT_DELAY,
              ease: "easeInOut",
            },
            opacity: {
              duration: FLIGHT_DURATION,
              times: OPACITY_TIMES,
              repeat: Infinity,
              repeatDelay: REPEAT_DELAY,
              ease: "linear",
            },
          }}
        />
      </svg>

      <motion.div
        className="absolute h-[11px] w-[27px] -translate-x-1/2 -translate-y-1/2 text-lavender-mist"
        style={{ rotate: angleDeg }}
        initial={{ left: `${START.x}%`, top: `${START.y}%`, opacity: 0 }}
        animate={{
          left: [`${START.x}%`, `${END.x}%`],
          top: [`${START.y}%`, `${END.y}%`],
          opacity: OPACITY_KEYFRAMES,
        }}
        transition={{
          left: { duration: FLIGHT_DURATION, repeat: Infinity, repeatDelay: REPEAT_DELAY, ease: "easeInOut" },
          top: { duration: FLIGHT_DURATION, repeat: Infinity, repeatDelay: REPEAT_DELAY, ease: "easeInOut" },
          opacity: {
            duration: FLIGHT_DURATION,
            times: OPACITY_TIMES,
            repeat: Infinity,
            repeatDelay: REPEAT_DELAY,
            ease: "linear",
          },
        }}
      >
        <svg viewBox="0 0 100 40" className="h-full w-full" fill="currentColor">
          <path d={PLANE_PATH} />
        </svg>
      </motion.div>
    </div>
  );
}
