"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { angel, clouds } from "../../data/media";
import { useStillMotion } from "../../lib/motion";
import { useGaze } from "../../lib/useGaze";
import { Photo } from "../media/Picture";

/** The small eyes on the ring: how many, and where the first one sits (deg, 0 = right, clockwise). */
const MINIS = 8;
const MINI_FROM = 22.5;
const MINI_BLINK = { min: 3500, max: 11000, ms: 200 };
/** The central iris: diameter (% of the eye box width) and its gaze. */
const IRIS_W = 33;
const GAZE = { reach: { x: 8.5, y: 2.6 }, fullTurn: 480, blink: { min: 4000, max: 8000, ms: 240 } };

/**
 * The winged eye floating in the sky (collage style): two white feathered wings
 * on either side of a white ring studded with silver beads, small eyes round
 * the ring, and a big eye in the middle. The wings slowly beat and the whole
 * thing gently sways; the central iris follows the pointer (on touch screens,
 * the scroll) and blinks every 4–8 s; the small eyes blink now and then, each on
 * its own. Decorative (aria-hidden). Motion reduced or paused: it stands still
 * and looks straight ahead.
 */
export function Angel({ className = "" }: { className?: string }) {
  const still = useStillMotion();
  const root = useRef<HTMLDivElement>(null);
  const eye = useRef<HTMLDivElement>(null);
  const iris = useRef<HTMLImageElement>(null);

  useGaze(eye, iris, still, GAZE);

  // The small eyes blink at random, out of step, only while the angel is on screen.
  useEffect(() => {
    const el = root.current;
    if (!el || still) return;
    const minis = Array.from(el.querySelectorAll<HTMLElement>(".angel-mini"));
    let onScreen = false;
    const timers: number[] = [];
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    io.observe(el);
    minis.forEach((m, i) => {
      const next = () => {
        timers[i] = window.setTimeout(
          () => {
            if (onScreen && document.visibilityState === "visible") {
              m.setAttribute("data-blink", "");
              window.setTimeout(() => m.removeAttribute("data-blink"), MINI_BLINK.ms);
            }
            next();
          },
          MINI_BLINK.min + Math.random() * (MINI_BLINK.max - MINI_BLINK.min),
        );
      };
      next();
    });
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      minis.forEach((m) => m.removeAttribute("data-blink"));
    };
  }, [still]);

  const b = angel.box;
  return (
    <div ref={root} aria-hidden="true" className={`angel ${className}`}>
      <div className="angel-sway">
        <span className="angel-wing angel-wing-l">
          <Photo photo={angel.wing} sizes="(max-width: 1024px) 100px, 200px" />
        </span>
        <span className="angel-wing angel-wing-r">
          <Photo photo={angel.wing} sizes="(max-width: 1024px) 100px, 200px" />
        </span>
        <div className="angel-core">
          <span className="angel-glow" />
          <Photo photo={angel.ring} sizes="(max-width: 1024px) 80px, 160px" className="angel-ring" />
          {Array.from({ length: MINIS }, (_, i) => (
            <span key={i} className="angel-mini" style={{ "--a": `${MINI_FROM + (360 / MINIS) * i}deg` } as CSSProperties}>
              <Photo photo={angel.small} sizes="40px" />
            </span>
          ))}
          <div
            ref={eye}
            className="cloud-eye angel-eye"
            style={
              {
                "--opening": `url(${angel.opening})`,
                "--ix": `${b.left + b.width / 2}%`,
                "--iy": `${b.top + b.height / 2}%`,
                "--iw": `${IRIS_W}%`,
                "--lid-top": `${b.top}%`,
                "--lid-bottom": `${b.top + b.height}%`,
                "--lid-shift": `${(-100 * (b.height + 6)) / (b.top + b.height + 3)}%`,
              } as CSSProperties
            }
          >
            <Photo photo={angel.white} sizes="(max-width: 1024px) 60px, 120px" />
            <div className="cloud-eye-open">
              {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-sized WebP */}
              <img
                ref={iris}
                src={angel.iris.src}
                width={angel.iris.width}
                height={angel.iris.height}
                alt=""
                className="cloud-eye-iris"
                loading="lazy"
                decoding="async"
              />
              <span className="cloud-eye-lid" />
            </div>
          </div>
        </div>
        <Photo photo={clouds[1]} sizes="(max-width: 1024px) 140px, 320px" className="angel-cloud" />
      </div>
    </div>
  );
}
