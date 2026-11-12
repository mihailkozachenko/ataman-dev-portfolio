"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { eye } from "../../data/media";
import { useStillMotion } from "../../lib/motion";
import { Photo } from "../media/Picture";

/** How far the iris may travel from the centre, % of the eye box width (it stays in the white). */
const REACH = { x: 6.5, y: 3.2 };
/** Iris diameter, % of the eye box width (a little over the opening's height, as in life). */
const IRIS_W = 27;
/** Pointer distance (px) at which the gaze is fully turned. */
const FULL_TURN = 420;
/** Follow speed per frame (0..1). */
const EASE = 0.12;
const BLINK = { min: 4000, max: 8000, ms: 240 };

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

  useEffect(() => {
    const el = root.current;
    const img = iris.current;
    if (!el || !img) return;
    if (still) {
      img.style.transform = "";
      el.removeAttribute("data-blink");
      return;
    }

    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    let onScreen = false;
    const centre = () => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
    };
    const frame = () => {
      raf = 0;
      cur.x += (target.x - cur.x) * EASE;
      cur.y += (target.y - cur.y) * EASE;
      const w = el.offsetWidth;
      img.style.transform = `translate(${((cur.x * REACH.x * w) / 100).toFixed(2)}px, ${((cur.y * REACH.y * w) / 100).toFixed(2)}px)`;
      if (onScreen && (Math.abs(target.x - cur.x) > 0.002 || Math.abs(target.y - cur.y) > 0.002)) kick();
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!onScreen) return;
      const c = centre();
      const dx = e.clientX - c.x;
      const dy = e.clientY - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(1, d / FULL_TURN);
      target.x = (dx / d) * m;
      target.y = (dy / d) * m;
      kick();
    };
    let lastY = window.scrollY;
    let settle = 0;
    const onScroll = () => {
      if (!onScreen) return;
      const c = centre();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const v = Math.max(-1, Math.min(1, (window.scrollY - lastY) / 40));
      lastY = window.scrollY;
      // Towards the middle of the screen, plus a glance in the scroll's direction.
      target.x = Math.max(-1, Math.min(1, ((vw / 2 - c.x) / (vw / 2)) * 1.2));
      target.y = Math.max(-1, Math.min(1, ((vh / 2 - c.y) / (vh / 2)) * 1.6 + v * 0.8));
      kick();
      window.clearTimeout(settle);
      settle = window.setTimeout(onScroll, 160);
    };

    let blinkTimer = 0;
    let blinkOff = 0;
    const blink = () => {
      blinkTimer = window.setTimeout(
        () => {
          if (onScreen && document.visibilityState === "visible") {
            el.setAttribute("data-blink", "");
            blinkOff = window.setTimeout(() => el.removeAttribute("data-blink"), BLINK.ms);
          }
          blink();
        },
        BLINK.min + Math.random() * (BLINK.max - BLINK.min),
      );
    };
    blink();

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !fine) onScroll();
    });
    io.observe(el);
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    else window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
      window.clearTimeout(blinkOff);
      window.clearTimeout(settle);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [still]);

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
