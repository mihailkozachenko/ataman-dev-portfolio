"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { bubbles } from "../../data/media";
import { useStillMotion } from "../../lib/motion";
import { playPop } from "../../lib/sound";

const FINE = "(pointer: fine)";
const subscribeFine = (cb: () => void) => {
  const mq = window.matchMedia(FINE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

const IMG = getImageProps({
  src: bubbles[0].src,
  width: bubbles[0].width,
  height: bubbles[0].height,
  alt: "",
  sizes: "36px",
}).props;

/**
 * A small soap bubble replaces the cursor (fine pointers only). It trails the
 * pointer with a little inertia, swells over links and buttons, and pops on click.
 * The system cursor comes back whenever motion is reduced or paused.
 */
export function BubbleCursor() {
  const fine = useSyncExternalStore(subscribeFine, () => window.matchMedia(FINE).matches, () => false);
  const still = useStillMotion();
  const active = fine && !still;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("bubble-cursor", active);
    return () => document.documentElement.classList.remove("bubble-cursor");
  }, [active]);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const pos = { x: -100, y: -100 };
    const target = { x: -100, y: -100 };
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const render = () => {
      raf = 0;
      pos.x += (target.x - pos.x) * 0.28;
      pos.y += (target.y - pos.y) * 0.28;
      scale += (targetScale - scale) * 0.2;
      el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      // Keep animating only while still catching up.
      if (Math.abs(target.x - pos.x) > 0.2 || Math.abs(target.y - pos.y) > 0.2 || Math.abs(targetScale - scale) > 0.005) {
        raf = requestAnimationFrame(render);
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (pos.x < -50) {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      const over = (e.target as Element | null)?.closest?.("a, button, [role='button']");
      targetScale = over ? 1.55 : 1;
      el.dataset.visible = "true";
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.dataset.pop = "true";
      playPop(0.6);
      window.setTimeout(() => (el.dataset.pop = "false"), 320);
    };
    const onLeave = () => (el.dataset.visible = "false");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div ref={ref} aria-hidden="true" className="bubble-cursor-el" data-visible="false" data-pop="false">
      {/* eslint-disable-next-line @next/next/no-img-element -- optimised via getImageProps */}
      <img {...IMG} alt="" className="h-full w-full" />
      <span className="bubble-cursor-drops">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <span key={a} style={{ rotate: `${a}deg` }} />
        ))}
      </span>
    </div>
  );
}
