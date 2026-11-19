"use client";

import { useEffect, type RefObject } from "react";

export type GazeOptions = {
  /** How far the iris may travel from the centre, % of the eye box width. */
  reach: { x: number; y: number };
  /** Pointer distance (px) at which the gaze is fully turned. */
  fullTurn?: number;
  /** Follow speed per frame (0..1). */
  ease?: number;
  /** Blink every min..max ms, for ms. */
  blink?: { min: number; max: number; ms: number };
  /**
   * Several eyes looking together: every element matching this selector inside
   * the root is an iris, moved within its own eye (its closest `[data-eye]`),
   * so a small eye travels proportionally less. `irisRef` is then unused.
   */
  irises?: string;
};

/**
 * A photo eye that looks around: the iris (moved by transform only) follows the
 * pointer within the white — on touch screens it follows the scroll, looking
 * towards the middle of the screen as the eye passes, with a nudge in the
 * scroll's direction — and the eye blinks every few seconds (`data-blink` on
 * the root for `blink.ms`). Works only while the eye is on screen. Motion
 * reduced or paused (`still`): it looks straight ahead and never blinks.
 */
export function useGaze(
  rootRef: RefObject<HTMLElement | null>,
  irisRef: RefObject<HTMLElement | null>,
  still: boolean,
  { reach, fullTurn = 420, ease = 0.12, blink: blinkAt = { min: 4000, max: 8000, ms: 240 }, irises: selector }: GazeOptions,
) {
  const rx = reach.x;
  const ry = reach.y;
  const { min, max, ms } = blinkAt;
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    // Each iris with the box it moves in.
    const eyes = (selector ? Array.from(el.querySelectorAll<HTMLElement>(selector)) : [irisRef.current])
      .filter((i): i is HTMLElement => !!i)
      .map((iris) => ({ iris, box: (selector && iris.closest<HTMLElement>("[data-eye]")) || el }));
    if (!eyes.length) return;
    if (still) {
      eyes.forEach(({ iris }) => (iris.style.transform = ""));
      el.removeAttribute("data-blink");
      return;
    }

    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let raf = 0;
    let onScreen = false;
    const centre = () => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const frame = () => {
      raf = 0;
      cur.x += (target.x - cur.x) * ease;
      cur.y += (target.y - cur.y) * ease;
      for (const { iris, box } of eyes) {
        const w = box.offsetWidth;
        iris.style.transform = `translate(${((cur.x * rx * w) / 100).toFixed(2)}px, ${((cur.y * ry * w) / 100).toFixed(2)}px)`;
      }
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
      const m = Math.min(1, d / fullTurn);
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
            blinkOff = window.setTimeout(() => el.removeAttribute("data-blink"), ms);
          }
          blink();
        },
        min + Math.random() * (max - min),
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
  }, [rootRef, irisRef, still, rx, ry, fullTurn, ease, min, max, ms, selector]);
}
