"use client";

import { useEffect } from "react";
import { useIdleReady, usePageVisible, useStillMotion } from "../lib/motion";

/**
 * One place that applies the global motion state to plain (server-rendered) DOM:
 *  - <html data-motion="on|still"> — CSS animations pause when still.
 *  - [data-anim-scope] gets data-offscreen while outside the viewport, which
 *    pauses CSS animations inside it and swaps animated WebPs to still frames.
 *  - [data-depth] decorative layers get a light scroll parallax.
 * Renders nothing.
 */
export function MotionDirector() {
  const still = useStillMotion();
  const pageVisible = usePageVisible();
  const ready = useIdleReady();

  useEffect(() => {
    document.documentElement.dataset.motion = still ? "still" : "on";
  }, [still]);

  // Deferred photos (see Photo): attach the real sources once the page is idle,
  // including images React mounts later (e.g. a service bubble that reforms).
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.ready = "true";
    const attach = (img: HTMLImageElement) => {
      if (!("defer" in img.dataset)) return;
      delete img.dataset.defer;
      img.addEventListener("load", () => (img.dataset.loaded = "true"), { once: true });
      if (img.dataset.sizes) img.sizes = img.dataset.sizes;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      if (img.dataset.src) img.src = img.dataset.src;
    };
    document.querySelectorAll<HTMLImageElement>("img[data-defer]").forEach(attach);
    const mo = new MutationObserver((records) => {
      for (const r of records)
        r.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) attach(n);
          else if (n instanceof Element) n.querySelectorAll<HTMLImageElement>("img[data-defer]").forEach(attach);
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [ready]);

  // Off-screen scopes + animated image swapping.
  useEffect(() => {
    const scopes = Array.from(document.querySelectorAll<HTMLElement>("[data-anim-scope]"));
    const offscreen = new Map<HTMLElement, boolean>(scopes.map((s) => [s, true]));

    const sync = () => {
      document.querySelectorAll<HTMLImageElement>("img[data-still]").forEach((img) => {
        const scope = img.closest<HTMLElement>("[data-anim-scope]");
        const freeze = still || !ready || !pageVisible || (scope ? offscreen.get(scope) !== false : false);
        const want = freeze ? img.dataset.still! : img.dataset.live!;
        if (img.getAttribute("src") !== want) img.setAttribute("src", want);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          offscreen.set(el, !entry.isIntersecting);
          el.dataset.offscreen = entry.isIntersecting ? "false" : "true";
        }
        sync();
      },
      { rootMargin: "150px 0px" },
    );
    scopes.forEach((s) => observer.observe(s));
    sync();
    return () => observer.disconnect();
  }, [still, pageVisible, ready]);

  // Parallax: offset each layer by its distance from the viewport centre.
  useEffect(() => {
    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    if (still || layers.length === 0) {
      layers.forEach((el) => (el.style.translate = ""));
      return;
    }
    let base: { el: HTMLElement; center: number; k: number }[] = [];
    const measure = () => {
      base = layers
        .filter((el) => el.offsetParent !== null) // skip layers hidden on this breakpoint
        .map((el) => {
          el.style.translate = "";
          const r = el.getBoundingClientRect();
          return { el, center: r.top + window.scrollY + r.height / 2, k: Number(el.dataset.depth) || 0 };
        });
      apply();
    };
    let raf = 0;
    const apply = () => {
      raf = 0;
      const mid = window.scrollY + window.innerHeight / 2;
      for (const b of base) {
        const d = b.center - mid;
        if (Math.abs(d) > window.innerHeight * 1.5) continue; // far away: not worth a write
        b.el.style.translate = `0 ${(d * b.k).toFixed(1)}px`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [still]);

  return null;
}
