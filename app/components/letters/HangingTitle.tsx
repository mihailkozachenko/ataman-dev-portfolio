"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { grass } from "../../data/media";
import { usePrefersReducedMotion, useStillMotion } from "../../lib/motion";
import { playPop } from "../../lib/sound";

type Phase = "hanging" | "falling" | "landed";

const HANG_DEG = 8;
// Lying on its side, tilted with the slope of the hill.
const REST_DEG = 80;

/**
 * One letter of the heading hangs crooked on a nail. Click / tap (or the keyboard
 * button) and it falls with spin and gravity onto the hill, bounces once or twice
 * and comes to rest lying on the slope — with a contact shadow, grass blades over
 * its lower edge and a slightly darker, cooler tone. Its slot in the heading
 * becomes a chroma-key (#00FF00) hole in the exact shape of the glyph.
 * By default it hangs and falls only on click. Only prefers-reduced-motion puts it
 * on the grass from the start; the user's "Pause motion" (persisted) only stops
 * the swing — a click then drops it instantly, without the fall animation.
 */
export function HangingTitle({
  text,
  hangIndex,
  id,
  className,
}: {
  text: string;
  hangIndex: number;
  id: string;
  className: string;
}) {
  const still = useStillMotion(); // reduced OR paused: no fall animation
  const reduced = usePrefersReducedMotion(); // only this starts it on the grass
  const [phase, setPhase] = useState<Phase>("hanging");
  const slotRef = useRef<HTMLSpanElement>(null); // never transformed: the resting reference
  const flyRef = useRef<HTMLSpanElement>(null); // translate
  const spinRef = useRef<HTMLSpanElement>(null); // rotate
  const groundRef = useRef<HTMLSpanElement>(null); // shadow + blades, unrotated
  const raf = useRef(0);

  /** Where the letter comes to rest, relative to its slot, in px. */
  const landing = useCallback(() => {
    const slot = slotRef.current;
    const hill = document.querySelector<HTMLElement>("[data-hill]");
    if (!slot || !hill) return null;
    const s = slot.getBoundingClientRect();
    const g = hill.getBoundingClientRect();
    const mobile = window.innerWidth < 640;
    const landX = g.left + g.width * (mobile ? 0.36 : 0.5);
    const groundY = g.top + g.height * (mobile ? 0.42 : 0.48);
    const w = s.width;
    const hgt = s.height;
    const rad = (REST_DEG * Math.PI) / 180;
    const rotH = Math.abs(w * Math.sin(rad)) + Math.abs(hgt * Math.cos(rad));
    const rotW = Math.abs(w * Math.cos(rad)) + Math.abs(hgt * Math.sin(rad));
    return {
      dx: landX - (s.left + w / 2),
      // Centre of the rotated glyph so that its lowest point touches the ground.
      dy: groundY - (s.top + hgt / 2) - rotH / 2,
      groundBelowCentre: rotH / 2,
      rotW,
      w,
      h: hgt,
    };
  }, []);

  const placeLanded = useCallback(() => {
    const L = landing();
    const fly = flyRef.current;
    const spin = spinRef.current;
    const ground = groundRef.current;
    if (!L || !fly || !spin || !ground) return;
    fly.style.transform = `translate(${L.dx.toFixed(1)}px, ${L.dy.toFixed(1)}px)`;
    spin.style.transform = `rotate(${REST_DEG}deg)`;
    ground.style.width = `${L.rotW.toFixed(0)}px`;
    ground.style.top = `calc(50% + ${L.groundBelowCentre.toFixed(1)}px)`;
  }, [landing]);

  const drop = useCallback(() => {
    if (phase !== "hanging") return;
    const L = landing();
    const fly = flyRef.current;
    const spin = spinRef.current;
    if (!L || !fly || !spin) return;
    if (still) {
      setPhase("landed");
      return;
    }
    playPop(0.4);
    setPhase("falling");
    const g = 3000 * Math.min(1.2, Math.max(0.7, window.innerHeight / 900));
    let x = 0;
    let y = 0;
    let rot = HANG_DEG;
    let vx = L.dx * 0.55; // reaches the landing x over the fall
    let vy = -260;
    let w = 420;
    let bounces = 0;
    let last = performance.now();
    let settle: { t0: number; from: { x: number; y: number; r: number } } | null = null;

    const step = (now: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (!settle) {
        vy += g * dt;
        x += vx * dt;
        y += vy * dt;
        rot += w * dt;
        if (y >= L.dy && vy > 0) {
          y = L.dy;
          bounces++;
          vy = -vy * 0.34;
          vx *= 0.5;
          w = -w * 0.45;
          if (bounces >= 2 || Math.abs(vy) < 140) settle = { t0: now, from: { x, y, r: rot } };
        }
      } else {
        // Ease into the resting pose (lying along the slope).
        const t = Math.min(1, (now - settle.t0) / 380);
        const e = 1 - (1 - t) ** 3;
        const restR = REST_DEG + 360 * Math.round((settle.from.r - REST_DEG) / 360);
        x = settle.from.x + (L.dx - settle.from.x) * e;
        y = settle.from.y + (L.dy - settle.from.y) * e;
        rot = settle.from.r + (restR - settle.from.r) * e;
        if (t >= 1) {
          setPhase("landed");
          return;
        }
      }
      fly.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      spin.style.transform = `rotate(${rot.toFixed(1)}deg)`;
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [phase, landing, still]);

  // Reduced motion (system setting): it has already fallen.
  useEffect(() => {
    if (reduced && phase === "hanging") {
      cancelAnimationFrame(raf.current);
      const id = requestAnimationFrame(() => setPhase("landed"));
      return () => cancelAnimationFrame(id);
    }
  }, [reduced, phase]);

  // Keep it on the grass through layout changes.
  useEffect(() => {
    if (phase !== "landed") return;
    placeLanded();
    window.addEventListener("resize", placeLanded);
    const ro = new ResizeObserver(placeLanded);
    ro.observe(document.body);
    return () => {
      window.removeEventListener("resize", placeLanded);
      ro.disconnect();
    };
  }, [phase, placeLanded]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const before = text.slice(0, hangIndex);
  const letter = text[hangIndex];
  const after = text.slice(hangIndex + 1);

  return (
    <div className="relative">
      <h2 id={id} aria-label={text} className={className}>
        <span aria-hidden="true">{before}</span>
        <span
          ref={slotRef}
          aria-hidden="true"
          className={`hang-slot relative inline-block ${phase !== "hanging" ? "is-empty" : ""}`}
        >
          {/* The hole left behind: exactly the glyph's shape, in chroma green. */}
          <span className="hang-chroma">{letter}</span>
          <span className="hang-nail" />
          <span ref={flyRef} className={`hang-fly ${phase === "landed" ? "is-landed" : ""}`}>
            <span
              ref={spinRef}
              className={`hang-spin ${phase === "hanging" ? "is-hanging" : ""}`}
              style={{ "--hang": `${HANG_DEG}deg` } as CSSProperties}
              onClick={drop}
            >
              {letter}
            </span>
            <span
              ref={groundRef}
              className="hang-ground"
              style={{ "--grass": `url(${grass.src})` } as CSSProperties}
            />
          </span>
        </span>
        <span aria-hidden="true">{after}</span>
      </h2>
      {phase === "hanging" && (
        <button
          type="button"
          onClick={drop}
          className="xp-btn xp-btn-sm sr-only focus:not-sr-only focus:absolute focus:right-0 focus:top-full focus:mt-2"
        >
          Knock the loose letter off
        </button>
      )}
    </div>
  );
}
