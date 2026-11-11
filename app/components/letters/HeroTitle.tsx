"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useAnimationGate } from "../../lib/motion";

const WORDS = ["Ataman", "Dev"];
// Deterministic start tilt per letter (no Math.random in render → no hydration mismatch).
const TILT = [-28, 34, -16, 22, -38, 14, 30, -24, 18];

type Spring = { el: HTMLElement; cx: number; cy: number; x: number; y: number; vx: number; vy: number };

/**
 * "ATAMAN DEV": letters drop in from above and bounce into place (CSS keyframes on
 * `transform`, so it starts on first paint without waiting for JS). Afterwards the
 * cursor pushes nearby letters away and they spring back; on touch a tap kicks the
 * letter under the finger. The push uses the separate `translate` property, so it
 * never fights the drop animation. Screen readers get the plain heading text.
 */
export function HeroTitle() {
  const ref = useRef<HTMLHeadingElement>(null);
  const { active } = useAnimationGate(ref);

  useEffect(() => {
    const h = ref.current;
    if (!active || !h) return;
    const section = h.closest("section") ?? h;
    const els = Array.from(h.querySelectorAll<HTMLElement>(".hero-letter"));
    const springs: Spring[] = els.map((el) => ({ el, cx: 0, cy: 0, x: 0, y: 0, vx: 0, vy: 0 }));
    const pointer = { x: 0, y: 0, on: false };
    let dropped = h.dataset.dropped === "true";
    let raf = 0;
    let last = 0;

    const measure = () => {
      for (const s of springs) {
        const r = s.el.getBoundingClientRect();
        // Subtract the current push so we store the letter's resting centre.
        s.cx = r.left + r.width / 2 - s.x + window.scrollX;
        s.cy = r.top + r.height / 2 - s.y + window.scrollY;
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - (last || now)) / 1000) || 0.016;
      last = now;
      const fontSize = parseFloat(getComputedStyle(h).fontSize);
      const R = fontSize * 1.1;
      const maxPush = fontSize * 0.32;
      let moving = false;
      for (const s of springs) {
        let tx = 0;
        let ty = 0;
        if (pointer.on) {
          const dx = s.cx - (pointer.x + window.scrollX);
          const dy = s.cy - (pointer.y + window.scrollY);
          const d = Math.hypot(dx, dy) || 1;
          if (d < R) {
            const f = (1 - d / R) ** 2 * maxPush;
            tx = (dx / d) * f;
            ty = (dy / d) * f;
          }
        }
        // Damped spring toward the target offset.
        const ax = 170 * (tx - s.x) - 16 * s.vx;
        const ay = 170 * (ty - s.y) - 16 * s.vy;
        s.vx += ax * dt;
        s.vy += ay * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (Math.abs(s.x) + Math.abs(s.y) > 0.05 || Math.abs(s.vx) + Math.abs(s.vy) > 0.5 || tx || ty) moving = true;
        s.el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
      }
      if (moving) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => {
      if (!raf && dropped) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = true;
      kick();
    };
    const onLeave = () => {
      pointer.on = false;
      kick();
    };
    // Touch / pen: a tap kicks the nearest letter away from the finger.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || !dropped) return;
      const px = e.clientX + window.scrollX;
      const py = e.clientY + window.scrollY;
      let best: Spring | null = null;
      let bestD = Infinity;
      for (const s of springs) {
        const d = Math.hypot(s.cx - px, s.cy - py);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      const fontSize = parseFloat(getComputedStyle(h).fontSize);
      if (best && bestD < fontSize) {
        const dx = best.cx - px || 1;
        const dy = best.cy - py || -1;
        const d = Math.hypot(dx, dy);
        best.vx += (dx / d) * fontSize * 9;
        best.vy += (dy / d) * fontSize * 9;
        kick();
      }
    };

    const onDropped = () => {
      dropped = true;
      h.dataset.dropped = "true";
      measure();
    };
    // The drop runs ~1.9 s; enable pushing when the last letter lands.
    const lastLetter = els[els.length - 1];
    const onEnd = (e: AnimationEvent) => {
      if (e.animationName === "letter-drop") onDropped();
    };
    let timer: number | undefined;
    if (!dropped) {
      lastLetter.addEventListener("animationend", onEnd);
      timer = window.setTimeout(onDropped, 2600);
    } else {
      measure();
    }

    section.addEventListener("pointermove", onMove as EventListener, { passive: true });
    section.addEventListener("pointerleave", onLeave);
    section.addEventListener("pointerdown", onDown as EventListener, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      lastLetter.removeEventListener("animationend", onEnd);
      section.removeEventListener("pointermove", onMove as EventListener);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerdown", onDown as EventListener);
      window.removeEventListener("resize", measure);
      // Let the letters settle back exactly into place.
      for (const s of springs) s.el.style.translate = "";
    };
  }, [active]);

  let index = 0;
  return (
    <h1
      ref={ref}
      id="hero-title"
      aria-label="Ataman Dev"
      className="hero-drop text-display text-[clamp(3.5rem,14.5vw,11.5rem)] leading-[0.82] text-paper [text-shadow:0_4px_0_rgb(10_10_10/0.35)]"
    >
      {WORDS.map((word) => (
        <span key={word} aria-hidden="true" className="block whitespace-nowrap">
          {Array.from(word).map((ch) => {
            const i = index++;
            return (
              <span
                key={i}
                className="hero-letter"
                style={{ "--i": i, "--r": `${TILT[i % TILT.length]}deg` } as CSSProperties}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
