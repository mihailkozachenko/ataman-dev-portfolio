"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { door, doorSpot, grass } from "../../data/media";
import { useStillMotion } from "../../lib/motion";
import { playChime, playCreak } from "../../lib/sound";
import { Photo } from "../media/Picture";

/*
 * Leaf angles: how far the leaf has swung OUT, towards the viewer, about its
 * hinge on the left (0 = shut). Three states that read at a glance (share of
 * the opening the portal shows, with this perspective):
 *   AJAR  — at rest: a narrow strip of the other world (~13 %);
 *   WIDER — hover / keyboard focus: most of it (~60 %, ≈ 5× the strip);
 *   OPEN  — click: flung wide past the casing, the whole portal, then the zoom.
 */
const AJAR = 32;
const WIDER = 68;
const OPEN = 165;
/** Where the leaf's edges sit, % of the opening (a hair under the casing at hinge and head). */
const LEAF_EDGES = { hinge: -1.5, top: -0.8, free: -1, bottom: 0 };
/** Portal parallax: how far the far world drifts, px, at the edge of the screen. */
const DRIFT = { x: 9, y: 5 };
/* The click: the leaf swings wide, the portal comes at you, and goes back. */
const ZOOM_AT = 220;
const ZOOM_IN = 700;
const ZOOM_HOLD = 140;
const ZOOM_OUT = 520;
const BLINK_MS = 1100;

// The portal image (one optimised rendition: used in the opening and for the zoom).
const PORTAL = getImageProps({
  src: door.portal.src,
  width: door.portal.width,
  height: door.portal.height,
  alt: "",
  sizes: "(max-width: 640px) 120px, 240px",
}).props;

/** Grass blades: a 24 × 16 tile, solid at the bottom, ragged blade tips on top. */
const BLADES = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let d = "M0 16V9";
  for (let x = 0; x < 24; ) {
    const w = 1.2 + rnd() * 1.8;
    const tip = 1 + rnd() * 7;
    d += `L${(x + w * 0.45).toFixed(1)} ${tip.toFixed(1)}L${(x + w).toFixed(1)} ${(8 + rnd() * 2).toFixed(1)}`;
    x += w;
  }
  d += "L24 16Z";
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16"><path d="${d}"/></svg>`)}")`;
})();

/**
 * A white door standing alone in the field below the contact window, open, and
 * through it another world: the same hill and sky from another side, the sky a
 * little deeper, drifting slightly against the pointer (on phones, the scroll)
 * so the opening has depth. Its foot is in the grass (contact shadow, blades
 * over the bottom few px). Hover / focus: it swings wider. Click: it swings
 * all the way with a creak, the portal comes at you as if you stepped through,
 * pulls back, and the contact window's title bar blinks like a new message.
 * A real <button>. Motion reduced or paused: it stands still, ajar; a click
 * just lights the window's title bar once.
 */
export function FieldDoor() {
  const still = useStillMotion();
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const portalImg = useRef<HTMLImageElement>(null);
  const preloaded = useRef(false);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Portal parallax: pointer on fine pointers, scroll on touch.
  useEffect(() => {
    const img = portalImg.current;
    const el = root.current;
    if (still || !img || !el) {
      img?.style.removeProperty("translate");
      return;
    }
    const fine = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let fx = 0;
    let fy = 0;
    const apply = () => {
      raf = 0;
      img.style.translate = `${(-fx * DRIFT.x).toFixed(2)}px ${(-fy * DRIFT.y).toFixed(2)}px`;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      fx = (e.clientX / window.innerWidth) * 2 - 1;
      fy = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      fx = 0;
      fy = Math.max(-1, Math.min(1, ((r.top + r.height / 2) / window.innerHeight) * 2 - 1));
      kick();
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    else {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [still]);

  // The full-size portal for the zoom: fetched as soon as someone reaches for the door.
  const preload = () => {
    if (preloaded.current) return;
    preloaded.current = true;
    const img = new Image();
    img.src = door.portal.src;
  };

  const blink = () => {
    const win = document.querySelector<HTMLElement>(".xp-window-lg");
    if (!win) return;
    win.removeAttribute("data-new-message");
    void win.offsetWidth; // restart the animation
    win.setAttribute("data-new-message", still ? "still" : "blink");
    playChime();
    timers.current.push(window.setTimeout(() => win.removeAttribute("data-new-message"), BLINK_MS));
  };

  const onClick = () => {
    if (busy.current) return;
    if (still) {
      blink();
      return;
    }
    busy.current = true;
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    setOpen(true);
    playCreak();
    later(ZOOM_AT, () => {
      const opening = portalImg.current?.parentElement;
      if (!opening) return;
      const from = opening.getBoundingClientRect();
      // The portal laid over the page at full-screen size, then scaled down onto
      // the opening (rendered sharp at the size it grows to).
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const k = Math.max(vw / from.width, vh / from.height) * 1.08;
      const w = from.width * k;
      const h = from.height * k;
      const layer = document.createElement("div");
      layer.className = "door-zoom";
      layer.setAttribute("aria-hidden", "true");
      Object.assign(layer.style, { left: `${(vw - w) / 2}px`, top: `${(vh - h) / 2}px`, width: `${w}px`, height: `${h}px` });
      // Underneath, the rendition already on screen (cached: shows at once);
      // on top, the full-size one, sharp once it has loaded (slow networks).
      for (const src of [portalImg.current?.currentSrc, door.portal.src]) {
        if (!src) continue;
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        layer.appendChild(img);
      }
      document.body.appendChild(layer);
      const dx = from.left + from.width / 2 - vw / 2;
      const dy = from.top + from.height / 2 - vh / 2;
      const small = `translate(${dx}px, ${dy}px) scale(${1 / k})`;
      const anim = layer.animate(
        [
          { transform: small, offset: 0 },
          { transform: "none", offset: ZOOM_IN / (ZOOM_IN + ZOOM_HOLD + ZOOM_OUT) },
          { transform: "none", offset: (ZOOM_IN + ZOOM_HOLD) / (ZOOM_IN + ZOOM_HOLD + ZOOM_OUT) },
          { transform: small, offset: 1 },
        ],
        { duration: ZOOM_IN + ZOOM_HOLD + ZOOM_OUT, easing: "cubic-bezier(0.55, 0, 0.25, 1)" },
      );
      anim.onfinish = () => {
        layer.remove();
        setOpen(false);
        blink();
        later(BLINK_MS, () => (busy.current = false));
      };
    });
  };

  const o = door.opening;
  const box = { left: `${o.left}%`, top: `${o.top}%`, width: `${o.width}%`, height: `${o.height}%` };
  return (
    <div
      ref={root}
      data-open={open || undefined}
      className="field-door"
      style={
        {
          "--ajar": `${AJAR}deg`,
          "--wider": `${WIDER}deg`,
          "--open": `${OPEN}deg`,
          "--aspect": door.frame.width / door.frame.height,
          "--x-sm": doorSpot.mobile.x,
          "--base-sm": doorSpot.mobile.base,
          "--x-lg": doorSpot.desktop.x,
          "--base-lg": doorSpot.desktop.base,
          "--o-left": `${o.left}%`,
          "--o-width": o.width / 100,
          "--grass-src": `url(${grass.src})`,
          "--grass-k": grass.width / grass.height,
          "--blades": BLADES,
        } as CSSProperties
      }
    >
      {/* On the ground: under the threshold, and under the swung leaf. */}
      <span aria-hidden="true" className="door-shade door-shade-sill" />
      <span aria-hidden="true" className="door-shade door-shade-leaf" />
      <button
        type="button"
        aria-label="Open the door"
        className="door-body"
        onClick={onClick}
        onPointerEnter={preload}
        onPointerDown={preload}
        onFocus={preload}
      >
        <span aria-hidden="true" className="door-portal" style={box}>
          {/* eslint-disable-next-line @next/next/no-img-element -- optimised via getImageProps */}
          <img ref={portalImg} {...PORTAL} alt="" className="door-portal-img" />
        </span>
        <Photo photo={door.frame} sizes="(max-width: 640px) 60px, 100px" className="door-frame" />
        <span aria-hidden="true" className="door-light" style={{ "--mask": `url(${door.frame.src})` } as CSSProperties} />
        <span
          aria-hidden="true"
          className="door-leaf"
          style={{
            left: `${o.left + (o.width * LEAF_EDGES.hinge) / 100}%`,
            width: `${(o.width * (100 - LEAF_EDGES.hinge - LEAF_EDGES.free)) / 100}%`,
            top: `${o.top + (o.height * LEAF_EDGES.top) / 100}%`,
            height: `${(o.height * (100 - LEAF_EDGES.top - LEAF_EDGES.bottom)) / 100}%`,
          }}
        >
          <Photo photo={door.leaf} sizes="(max-width: 640px) 60px, 100px" className="h-full w-full" />
          {/* Soft light from above on the paint, and a glint on the handle. */}
          <span aria-hidden="true" className="door-light" style={{ "--mask": `url(${door.leaf.src})` } as CSSProperties} />
          <span aria-hidden="true" className="door-glint" />
        </span>
      </button>
      {/* Blades of the field's own grass over the door's foot. */}
      <span aria-hidden="true" className="door-grass" />
    </div>
  );
}
