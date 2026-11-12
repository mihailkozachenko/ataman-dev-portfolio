"use client";

/*
 * Programmatic scrolling for the word flights and the phone. Native scrolling
 * only (Lenis was removed: it fought the browser's own scrolling — find in
 * page, focus, anchors). Each frame jumps instantly to the tweened position,
 * so CSS `scroll-behavior: smooth` cannot smooth the tween a second time.
 */

/** Smooth, symmetric ease used for every programmatic scroll (and the flights). */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Scroll the window to `y` over `duration` seconds; resolves when it arrives. */
export function scrollToY(y: number, duration: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.max(0, Math.min(max, y));
  return new Promise<void>((resolve) => {
    const from = window.scrollY;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / (duration * 1000));
      window.scrollTo({ top: from + (target - from) * easeInOut(t), behavior: "instant" });
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

/** How long a programmatic scroll over `distance` px should take, in seconds. */
export function scrollDuration(distance: number) {
  return Math.min(2.2, Math.max(0.9, Math.abs(distance) / 1400));
}

/** After arriving: move focus to the target without scrolling, and update the hash. */
export function arriveAt(el: HTMLElement, hash: string) {
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  history.pushState(null, "", hash);
}
