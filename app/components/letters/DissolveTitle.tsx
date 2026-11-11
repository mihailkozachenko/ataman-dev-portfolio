"use client";

import { useEffect, useRef } from "react";
import { useAnimationGate } from "../../lib/motion";

/**
 * As you scroll on toward the fog machine, the letters break up one by one into
 * haze and drift off the way the plume goes (right and up); scrolling back
 * reassembles them. Purely scroll-position driven (no timeline), transform +
 * opacity + blur only. Off when motion is reduced or paused.
 */
export function DissolveTitle({ text, id, className }: { text: string; id: string; className: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const { active } = useAnimationGate(ref);

  useEffect(() => {
    const h = ref.current;
    if (!active || !h) return;
    const els = Array.from(h.querySelectorAll<HTMLElement>(".dissolve-letter"));
    const n = els.length;
    let raf = 0;

    const update = () => {
      raf = 0;
      const r = h.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 while the heading sits in the upper third, 1 once it is leaving the top.
      const p = Math.min(1, Math.max(0, (vh * 0.3 - r.top) / (vh * 0.42)));
      const fs = parseFloat(getComputedStyle(h).fontSize);
      els.forEach((el, i) => {
        // Staggered from the last letter (nearest the plume) to the first.
        const start = ((n - 1 - i) / n) * 0.55;
        const t = Math.min(1, Math.max(0, (p - start) / 0.45));
        const e = t * t * (3 - 2 * t);
        if (e === 0) {
          el.style.transform = "";
          el.style.filter = "";
          el.style.opacity = "";
          return;
        }
        const wobble = Math.sin(i * 1.7) * 0.25;
        el.style.transform = `translate(${(e * fs * (1.3 + wobble)).toFixed(1)}px, ${(-e * fs * (0.55 + wobble * 0.5)).toFixed(1)}px) scale(${(1 + e * 0.7).toFixed(3)}) rotate(${(e * 14 * (wobble + 0.4)).toFixed(1)}deg)`;
        el.style.filter = `blur(${(e * 14).toFixed(1)}px)`;
        el.style.opacity = (1 - e ** 1.2).toFixed(3);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      // Motion off (or out of view): letters back in place.
      els.forEach((el) => {
        el.style.transform = "";
        el.style.filter = "";
        el.style.opacity = "";
      });
    };
  }, [active]);

  return (
    <h2 ref={ref} id={id} aria-label={text} className={className}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden="true" className="dissolve-letter">
          {ch}
        </span>
      ))}
    </h2>
  );
}
