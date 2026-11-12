"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const CLOSED_KEY = "ataman:error-closed";
const STEP = 16; // keyboard move, px (the page grid)

/**
 * The portrait never loaded, and the "system" says so: an old-desktop-style
 * error window over the missing image. Drag it by its title bar (mouse / touch)
 * or with the arrow keys once the title bar is focused; close it with ×, OK or
 * Escape. Closing is remembered for the session.
 *
 * Rendered visible on the server (works without JS), already "shown": no
 * entrance animation, nothing to switch off for reduced motion.
 */
export function ErrorWindow() {
  const [closed, setClosed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLOSED_KEY) === "1") {
        const id = requestAnimationFrame(() => setClosed(true));
        return () => cancelAnimationFrame(id);
      }
    } catch {
      // storage blocked: show it
    }
  }, []);

  /** Keep the window inside its section. */
  const clamp = (x: number, y: number) => {
    const el = ref.current;
    const box = el?.closest("section")?.getBoundingClientRect();
    if (!el || !box) return { x, y };
    const r = el.getBoundingClientRect();
    const left = r.left - pos.x;
    const top = r.top - pos.y;
    return {
      x: Math.min(box.right - r.width - left, Math.max(box.left - left, x)),
      y: Math.min(box.bottom - r.height - top, Math.max(box.top - top, y)),
    };
  };

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(CLOSED_KEY, "1");
    } catch {
      // ignore
    }
    // Focus goes on to the next thing in the hero rather than to nowhere —
    // without scrolling: on a short screen that button is below the fold, and
    // a plain focus() would scroll the page to it (the "twitch" on close).
    document.getElementById("hero-next")?.focus({ preventScroll: true });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setPos(clamp(d.ox + e.clientX - d.sx, d.oy + e.clientY - d.sy));
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    const m = move[e.key];
    if (!m) return;
    e.preventDefault();
    setPos(clamp(pos.x + m[0], pos.y + m[1]));
  };

  if (closed) return null;
  return (
    <div
      ref={ref}
      role="group"
      aria-label="Error window (decorative): move it with the arrow keys, close it with Escape"
      className="xp-window"
      style={{ translate: `${pos.x}px ${pos.y}px` }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <div
        className="xp-title"
        tabIndex={0}
        aria-label="Title bar: arrow keys move the window"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="xp-title-text">ataman.jpg</span>
        <button type="button" className="xp-close" onClick={close} aria-label="Close the error window">
          <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
          </svg>
        </button>
      </div>
      <div className="xp-body">
        <span className="xp-icon" aria-hidden="true">
          <svg viewBox="0 0 10 10" focusable="false">
            <path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </span>
        <p className="xp-text">
          The image “ataman.jpg” could not be loaded.
        </p>
      </div>
      <div className="xp-actions">
        <button type="button" className="xp-btn xp-btn-sm min-w-[88px]" onClick={close}>
          OK
        </button>
      </div>
    </div>
  );
}
