"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { bubbles } from "../../data/media";
import { useStillMotion } from "../../lib/motion";

const FINE = "(pointer: fine)";
const INTERACTIVE = "a, button, [role='button'], [data-poppable]";
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
 * pointer with a little inertia, swells over links and buttons (also when the page
 * scrolls one under it), and pops on click (visually; silent).
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
    let seen = false; // a mouse position is known

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
    const setHover = (over: Element | null | undefined) => {
      targetScale = over?.closest?.(INTERACTIVE) ? 1.55 : 1;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (pos.x < -50) {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      seen = true;
      setHover(e.target as Element | null);
      el.dataset.visible = "true";
      kick();
    };
    // The page can scroll a link under a cursor that stands still (wheel, a flight,
    // keyboard): re-test what is under it once per frame while scrolling.
    let scrollRaf = 0;
    const onScroll = () => {
      if (!seen || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        setHover(document.elementFromPoint(target.x, target.y));
        kick();
      });
    };
    // Visual pop only: the sound belongs to the things that actually pop
    // (service bubbles, the falling letter), so a click never plays it twice.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      el.dataset.pop = "true";
      window.setTimeout(() => (el.dataset.pop = "false"), 260);
    };
    const onLeave = () => {
      seen = false;
      el.dataset.visible = "false";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
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
