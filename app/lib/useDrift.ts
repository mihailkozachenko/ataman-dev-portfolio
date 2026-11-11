"use client";

import { useCallback, useEffect, useRef } from "react";

type DriftOptions = {
  /** Horizontal amplitude, px. */
  ampX: number;
  /** Vertical amplitude, px. */
  ampY: number;
  /** Angular speed, rad/s. */
  speed: number;
};

type Slot = {
  t: number;
  /** 0 → 1 ramp so the element eases out of its SSR position instead of jumping. */
  env: number;
  hover: boolean;
  focus: boolean;
  held: boolean;
};

function getSlot(slots: Slot[], i: number) {
  return (slots[i] ??= { t: 0, env: 0, hover: false, focus: false, held: false });
}

/**
 * Slow wandering around each element's home position, driven by a single rAF loop
 * that writes `transform` directly (no React re-renders). An element freezes while
 * hovered, focused or explicitly held, and resumes from where it stopped.
 */
export function useDrift(count: number, active: boolean, { ampX, ampY, speed }: DriftOptions) {
  const els = useRef<(HTMLElement | null)[]>([]);
  const slots = useRef<Slot[]>([]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (let i = 0; i < count; i++) {
        const slot = getSlot(slots.current, i);
        // A hovered / focused / held element stays exactly where it is.
        if (slot.hover || slot.focus || slot.held) continue;
        slot.t += dt;
        slot.env = Math.min(1, slot.env + dt / 2);
        const env = slot.env * slot.env * (3 - 2 * slot.env);
        const el = els.current[i];
        if (!el) continue;
        const a = slot.t * speed + i * 1.7;
        const x = (Math.sin(a) * ampX + Math.sin(a * 2.1 + i) * ampX * 0.25) * env;
        const y = Math.cos(a * 0.83 + i * 0.6) * ampY * env;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, count, ampX, ampY, speed]);

  const bind = useCallback(
    (i: number) => ({
      ref: (el: HTMLElement | null) => {
        els.current[i] = el;
      },
      onPointerEnter: () => {
        getSlot(slots.current, i).hover = true;
      },
      onPointerLeave: () => {
        getSlot(slots.current, i).hover = false;
      },
      onFocus: () => {
        getSlot(slots.current, i).focus = true;
      },
      onBlur: () => {
        getSlot(slots.current, i).focus = false;
      },
    }),
    [],
  );

  const hold = useCallback((i: number, held: boolean) => {
    getSlot(slots.current, i).held = held;
  }, []);

  return { bind, hold };
}
