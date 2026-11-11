"use client";

import { startTransition, useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/* ---------- prefers-reduced-motion ---------- */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/* ---------- user "Pause motion" toggle (WCAG 2.2.2) ---------- */

const PAUSE_KEY = "ataman:motion-paused";
const pauseListeners = new Set<() => void>();
// In-memory copy so the toggle still works when storage is blocked.
let pausedMemo: boolean | null = null;

function readPaused() {
  if (pausedMemo !== null) return pausedMemo;
  try {
    pausedMemo = window.localStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    pausedMemo = false;
  }
  return pausedMemo;
}

function subscribePaused(onChange: () => void) {
  pauseListeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PAUSE_KEY) return;
    pausedMemo = null;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    pauseListeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setMotionPaused(paused: boolean) {
  pausedMemo = paused;
  try {
    window.localStorage.setItem(PAUSE_KEY, paused ? "1" : "0");
  } catch {
    // Storage unavailable (private mode etc.) — the in-memory value still applies.
  }
  pauseListeners.forEach((listener) => listener());
}

export function useMotionPaused() {
  return useSyncExternalStore(subscribePaused, readPaused, () => false);
}

/** True when nothing should animate: system setting or the user's pause toggle. */
export function useStillMotion() {
  const reduced = usePrefersReducedMotion();
  const paused = useMotionPaused();
  return reduced || paused;
}

/* ---------- tab visibility ---------- */

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

export function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

/* ---------- section in viewport ---------- */

export function useInView(ref: RefObject<Element | null>, rootMargin = "120px") {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/* ---------- page idle after load ---------- */

// Animation loops wait until the page has loaded and the main thread is idle,
// so they never compete with hydration (keeps Total Blocking Time low).
let idleReady = false;
let idleScheduled = false;
const idleListeners = new Set<() => void>();

function subscribeIdle(onChange: () => void) {
  if (idleReady) {
    const id = setTimeout(onChange, 0);
    return () => clearTimeout(id);
  }
  idleListeners.add(onChange);
  if (!idleScheduled) {
    idleScheduled = true;
    const markReady = () => {
      idleReady = true;
      idleListeners.forEach((listener) => listener());
    };
    const whenIdle = () => {
      if ("requestIdleCallback" in window) window.requestIdleCallback(markReady, { timeout: 2500 });
      else setTimeout(markReady, 1200);
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
  }
  return () => {
    idleListeners.delete(onChange);
  };
}

export function useIdleReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    // A transition, not useSyncExternalStore: the flip re-renders both animated
    // sections, and a transition lets React split that work instead of one long task.
    return subscribeIdle(() => startTransition(() => setReady(true)));
  }, [ready]);
  return ready;
}

/**
 * `active` — run the animation loop now (page idle, section on screen, tab visible, motion allowed).
 * `still`  — motion is disabled entirely; render a static layout instead.
 */
export function useAnimationGate(ref: RefObject<Element | null>) {
  const still = useStillMotion();
  const visible = usePageVisible();
  const inView = useInView(ref);
  const ready = useIdleReady();
  return { active: ready && !still && visible && inView, still, ready, inView };
}

/** Becomes true the first time `value` is true, then stays true. */
export function useLatch(value: boolean) {
  const [latched, setLatched] = useState(value);
  // Adjusting state during render (React's documented pattern for derived state).
  if (value && !latched) setLatched(true);
  return latched || value;
}
