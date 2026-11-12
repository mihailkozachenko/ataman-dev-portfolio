"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { wmpSlides } from "../../data/media";
import { projects } from "../../data/projects";
import { useIdleReady, useInView, usePageVisible, useStillMotion } from "../../lib/motion";

type State = "playing" | "paused" | "stopped";

/** One frame on screen, ms (the cross-fade is part of it). */
const SLIDE_MS = 4800;
const REEL_MS = SLIDE_MS * wmpSlides.length;
/** Ken Burns: from this scale, slowly in by ZOOM, drifting by PAN (% of the frame) per slide. */
const KB = { from: 1.03, zoom: 0.09 };
const PAN: [number, number][] = [
  [0, 0], // the title card: a straight push in
  [-2.2, -1.2],
  [2, -1.5],
  [-1.6, 1.4],
  [1.8, 1.2],
  [-2, 1],
  [1.6, -1.2],
];
const STEP = 16; // keyboard move, px
/** Dragging only where there is room for it: wide screens with a mouse. */
const DRAG_QUERY = "(min-width: 1024px) and (pointer: fine)";

const pad = (n: number) => String(n).padStart(2, "0");
const timecode = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M2 1l7 4-7 4z" fill="currentColor" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M2 1h2.2v8H2zM5.8 1H8v8H5.8z" fill="currentColor" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M1.5 1.5h7v7h-7z" fill="currentColor" />
    </svg>
  );
}
/** A generic media-file glyph (a disc with a play mark), not anyone's logo. */
function MediaGlyph() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="17" fill="#f08a1c" stroke="#fff" strokeWidth="2" />
      <path d="M8 14a13 13 0 0 1 14-9" fill="none" stroke="#ffd27a" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 12.5l11 7.5-11 7.5z" fill="#fff" />
    </svg>
  );
}

/**
 * projects.wmv: an old media-player window (same desktop system as the other
 * windows) playing a "tape" of my projects' public pages — slides with a slow
 * Ken Burns push, under scanlines, noise and soft bled colours, with a VHS
 * counter. Play / Pause / Stop are real buttons; clicking the picture opens the
 * project on screen in a new tab. Drag it by the title bar (desktop; or arrow
 * keys on the focused title bar), close it with × — a desktop icon stays, and
 * opens it again. Its box never changes size (closing only hides it), so
 * nothing on the page moves. Motion reduced or paused: it waits on the first
 * frame, and plays without the push only when asked.
 */
export function MediaPlayer() {
  const still = useStillMotion();
  const ready = useIdleReady();
  const pageVisible = usePageVisible();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);

  const [state, setState] = useState<State>("playing");
  const [slide, setSlide] = useState(0);
  const [closed, setClosed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const time = useRef(0);
  const touched = useRef(false);
  const slides = useRef<(HTMLImageElement | null)[]>([]);
  const fill = useRef<HTMLSpanElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const iconBtn = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  // Reduced motion: no autoplay — unless the visitor pressed Play.
  useEffect(() => {
    if (still && !touched.current) {
      const id = requestAnimationFrame(() => setState((s) => (s === "playing" ? "paused" : s)));
      return () => cancelAnimationFrame(id);
    }
  }, [still]);

  /** Draw the reel at the current time: Ken Burns on the frame, seek bar, counter. */
  const paint = useCallback(
    (i: number) => {
      const t = time.current;
      const local = (t % SLIDE_MS) / SLIDE_MS;
      const img = slides.current[i];
      if (img) {
        if (still) img.style.transform = "";
        else {
          const [px, py] = PAN[i % PAN.length];
          img.style.transform = `scale(${(KB.from + KB.zoom * local).toFixed(4)}) translate(${(px * local).toFixed(3)}%, ${(py * local).toFixed(3)}%)`;
        }
      }
      if (fill.current) fill.current.style.transform = `scaleX(${(t / REEL_MS).toFixed(4)})`;
      if (counter.current) counter.current.textContent = timecode(t);
    },
    [still],
  );

  const running = state === "playing" && !closed && ready && pageVisible && inView;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let current = Math.floor(time.current / SLIDE_MS);
    const tick = (now: number) => {
      time.current = (time.current + Math.min(100, now - last)) % REEL_MS;
      last = now;
      const i = Math.floor(time.current / SLIDE_MS);
      if (i !== current) {
        current = i;
        setSlide(i);
      }
      paint(i);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, paint]);

  const play = () => {
    touched.current = true;
    setState("playing");
  };
  const pause = () => {
    touched.current = true;
    setState((s) => (s === "playing" ? "paused" : s));
  };
  const stop = () => {
    touched.current = true;
    time.current = 0;
    setSlide(0);
    setState("stopped");
    slides.current.forEach((img) => img && (img.style.transform = ""));
    paint(0);
  };

  const close = () => {
    setClosed(true);
    requestAnimationFrame(() => iconBtn.current?.focus({ preventScroll: true }));
  };
  const reopen = () => {
    setClosed(false);
    requestAnimationFrame(() => closeBtn.current?.focus({ preventScroll: true }));
  };

  /** Keep the window inside the Projects section. */
  const clamp = (x: number, y: number) => {
    const el = root.current;
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
  const canDrag = () => window.matchMedia(DRAG_QUERY).matches;
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button") || !canDrag()) return;
    e.preventDefault();
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
    if (!canDrag()) return;
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

  const current = wmpSlides[slide];
  const project = projects[current.project];
  const osd = state === "playing" ? "▶ PLAY" : state === "paused" ? "❚❚ PAUSE" : "■ STOP";

  return (
    <div
      ref={root}
      data-state={state}
      className="wmp"
      style={{ translate: `${pos.x}px ${pos.y}px` }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !closed) close();
      }}
    >
      {/* Tape colour bleed: red a pixel right, blue a pixel left. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
        <filter id="wmp-vhs" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r" />
          <feOffset in="r" dx="1.2" result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b" />
          <feOffset in="b" dx="-1.2" result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>

      <div
        role="group"
        aria-label="projects.wmv — media player"
        className="wmp-window"
        data-closed={closed || undefined}
        inert={closed}
      >
        <div
          className="xp-bar wmp-drag"
          tabIndex={0}
          aria-label="Title bar: on wide screens the arrow keys move the window"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
        >
          <span className="wmp-title">
            <MediaGlyph />
            <span>projects.wmv - Windows Media Player</span>
          </span>
          <span className="wmp-caps">
            <span aria-hidden="true" className="xp-cap">
              <svg viewBox="0 0 10 10" focusable="false">
                <path d="M2 8h5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </span>
            <button ref={closeBtn} type="button" className="wmp-close" onClick={close} aria-label="Close the media player">
              <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
              </svg>
            </button>
          </span>
        </div>
        <div aria-hidden="true" className="wmp-menu">
          <span><u>V</u>iew</span>
          <span><u>P</u>lay</span>
          <span><u>T</u>ools</span>
          <span><u>H</u>elp</span>
        </div>

        <div className="wmp-screen-wrap">
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="wmp-screen">
            <span className="wmp-reel">
              {wmpSlides.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- small pre-sized WebP frames
                <img
                  key={s.src}
                  ref={(el) => {
                    slides.current[i] = el;
                  }}
                  src={s.src}
                  alt={s.label}
                  aria-hidden={i !== slide || undefined}
                  width={720}
                  height={450}
                  loading="lazy"
                  decoding="async"
                  className="wmp-slide"
                  data-on={i === slide || undefined}
                />
              ))}
            </span>
            <span aria-hidden="true" className="wmp-noise" />
            <span aria-hidden="true" className="wmp-osd wmp-osd-state">
              {osd}
            </span>
            <span aria-hidden="true" className="wmp-osd wmp-osd-time">
              SP <span ref={counter}>0:00:00</span>
            </span>
            <span className="sr-only"> — open {project.name} (opens in a new tab)</span>
          </a>
        </div>

        <div className="wmp-status">
          <span>{state === "stopped" ? "Ready" : `${state === "playing" ? "Playing" : "Paused"}: ${project.name}`}</span>
          <span aria-hidden="true">
            {slide + 1}/{wmpSlides.length}
          </span>
        </div>
        <div aria-hidden="true" className="wmp-progress">
          <span ref={fill} className="wmp-progress-fill" />
        </div>
        <div className="wmp-controls">
          <button type="button" className="wmp-btn" onClick={play} aria-pressed={state === "playing"}>
            <PlayIcon /> Play
          </button>
          <button type="button" className="wmp-btn" onClick={pause} aria-pressed={state === "paused"}>
            <PauseIcon /> Pause
          </button>
          <button type="button" className="wmp-btn" onClick={stop} aria-pressed={state === "stopped"}>
            <StopIcon /> Stop
          </button>
        </div>
      </div>

      {closed && (
        <button ref={iconBtn} type="button" className="wmp-icon" onClick={reopen} aria-label="Open projects.wmv in the media player">
          <MediaGlyph />
          <span>projects.wmv</span>
        </button>
      )}
    </div>
  );
}
