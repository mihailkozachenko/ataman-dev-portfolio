"use client";

/*
 * One pop for every soap bubble on the page (service bubbles, the hero's drifting
 * bubble, the machine's stream). Called in the same handler as playPop(), so the
 * picture and the sound start in the same frame:
 *  - the bubble swells and is gone in POP_MS (Web Animations, no React round-trip;
 *    `scale` composes with any transform already on the element). The first
 *    frame is already a step into the pop, so nothing waits on the next frame;
 *  - droplets burst out from its centre in a fixed overlay (nothing clips them).
 * Motion off (reduced / paused): the bubble simply disappears, no droplets.
 */

export const POP_MS = 70;
const DROP_MS = 220;

function motionStill() {
  return (
    document.documentElement.dataset.motion === "still" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let layer: HTMLDivElement | null = null;
function overlay() {
  if (layer?.isConnected) return layer;
  layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.className = "pop-layer";
  document.body.appendChild(layer);
  return layer;
}

/** Droplets flying out of a circle of `size` px centred at (x, y) in the viewport. */
function splash(x: number, y: number, size: number, count: number) {
  const root = overlay();
  const at = document.createElement("span");
  at.className = "pop-splash";
  at.style.left = `${x}px`;
  at.style.top = `${y}px`;
  const reach = size * 0.55 + 8;
  for (let k = 0; k < count; k++) {
    const angle = (360 / count) * k + (k % 2) * 11;
    const dist = reach + (k % 3) * Math.min(14, size * 0.08);
    const d = document.createElement("span");
    d.className = "pop-drop";
    // Smaller bubbles throw smaller drops.
    const s = Math.max(4, Math.min(10, size * 0.07));
    d.style.width = d.style.height = `${s}px`;
    d.style.margin = `${-s / 2}px`;
    at.appendChild(d);
    d.animate(
      [
        { transform: `rotate(${angle}deg) translateY(${-size * 0.38}px) scale(1)`, opacity: 1 },
        { transform: `rotate(${angle}deg) translateY(${-dist}px) scale(0.25)`, opacity: 0 },
      ],
      { duration: DROP_MS, easing: "cubic-bezier(0.1, 0.8, 0.3, 1)", fill: "forwards" },
    );
  }
  root.appendChild(at);
  window.setTimeout(() => at.remove(), DROP_MS + 60);
}

type PopOptions = {
  /** Elements that vanish with the bubble (its label…). */
  also?: (HTMLElement | null | undefined)[];
  /** Number of droplets. */
  drops?: number;
  /** Keep the final (gone) state after the animation. Default true. */
  hold?: boolean;
};

/**
 * Pop `el` (the bubble's picture) right now. Returns the animations so a caller
 * that reuses the element can cancel them when the bubble comes back.
 */
export function popBubble(el: HTMLElement, { also = [], drops = 8, hold = true }: PopOptions = {}) {
  const still = motionStill();
  const r = el.getBoundingClientRect();
  const from = Number(getComputedStyle(el).opacity) || 1;
  const timing: KeyframeAnimationOptions = {
    duration: still ? 0 : POP_MS,
    easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    fill: hold ? "forwards" : "none",
  };
  // Starts already swollen and thinned: the very first painted frame shows the pop.
  const anims = [
    el.animate(
      [
        { scale: "1.1", opacity: from * 0.75 },
        { scale: "1.3", opacity: 0 },
      ],
      timing,
    ),
    ...also.filter((a): a is HTMLElement => !!a).map((a) => a.animate([{ opacity: 0.5 }, { opacity: 0 }], timing)),
  ];
  if (!still && r.width > 0) splash(r.left + r.width / 2, r.top + r.height / 2, r.width, drops);
  return anims;
}
