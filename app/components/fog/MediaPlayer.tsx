"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { wmpShots, wmpStill } from "../../data/media";
import { projects } from "../../data/projects";
import { useIdleReady } from "../../lib/motion";

const STEP = 16; // keyboard move, px
/** Dragging only where there is room for it: wide screens with a mouse. */
const DRAG_QUERY = "(min-width: 1024px) and (pointer: fine)";
const DESKTOP_QUERY = "(min-width: 1024px)";

/** One thrown window: open or closed, how far it was dragged, its stacking order. */
type Pop = { open: boolean; gen: number; x: number; y: number; z: number; k: number };

function PlayIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M2 1l7 4-7 4z" fill="currentColor" />
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
function CloseIcon() {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
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
/** A generic picture-file glyph. */
function PictureGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" fill="#fff" stroke="#7a8db0" />
      <path d="M3 12l3.2-4 2.3 2.7L10.4 8 13 12z" fill="#3c9a4a" />
      <circle cx="11" cy="5.4" r="1.3" fill="#f2b630" />
    </svg>
  );
}

/** Keeps a box (moved by dx, dy from where it was laid out) inside the Projects section. */
function clampInSection(el: HTMLElement | null, from: { x: number; y: number }, x: number, y: number) {
  const box = el?.closest("section")?.getBoundingClientRect();
  if (!el || !box) return { x, y };
  const r = el.getBoundingClientRect();
  const left = r.left - from.x;
  const top = r.top - from.y;
  return {
    x: Math.min(box.right - r.width - left, Math.max(box.left - left, x)),
    y: Math.min(box.bottom - r.height - top, Math.max(box.top - top, y)),
  };
}

const canDrag = () => window.matchMedia(DRAG_QUERY).matches;

/**
 * projects.wmv: an old media-player window (same desktop system as the other
 * windows). When it scrolls into view it throws out a cascade of little XP
 * windows, one after another — each a screenshot of a project, titled with a
 * file name, lying over each other with a step. Each can be dragged by its
 * title bar (wide screens with a mouse), closed with ×, and raised by a click;
 * clicking the screenshot opens the project in a new tab. Play throws the
 * closed ones out again, Stop closes them all. The windows are absolutely
 * placed in room the layout already reserves, so nothing on the page moves.
 * The player itself can be dragged and closed (a desktop icon reopens it).
 * Phones: four windows, no dragging. Motion reduced or paused: they simply
 * appear, without the throw.
 */
export function MediaPlayer() {
  const ready = useIdleReady();
  const stage = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const [closed, setClosed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pops, setPops] = useState<Pop[]>(() =>
    wmpShots.map((_, i) => ({ open: false, gen: 0, x: 0, y: 0, z: i + 1, k: 0 })),
  );
  const zTop = useRef(wmpShots.length);
  const thrown = useRef(false);

  const closeBtn = useRef<HTMLButtonElement>(null);
  const iconBtn = useRef<HTMLButtonElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const popRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number; pop: number } | null>(null);

  /** Throws out every closed window that is in play here (phones: only a few), one after another. */
  const throwClosed = () => {
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    let k = 0;
    setPops((list) =>
      list.map((p, i) => {
        if (p.open || !(desktop || wmpShots[i].phone)) return p;
        return { open: true, gen: p.gen + 1, x: 0, y: 0, z: ++zTop.current, k: k++ };
      }),
    );
  };

  // The first throw: once, when the player is well into view (and the page is idle).
  useEffect(() => {
    const el = stage.current;
    if (!el || !ready || thrown.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || thrown.current) return;
        thrown.current = true;
        io.disconnect();
        throwClosed();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  const raise = (i: number) => {
    setPops((list) => (list[i].z === zTop.current ? list : list.map((p, j) => (j === i ? { ...p, z: ++zTop.current } : p))));
  };
  const closePop = (i: number) => {
    setPops((list) => list.map((p, j) => (j === i ? { ...p, open: false } : p)));
    // Focus goes to the window now on top, or to Play when none is left.
    const rest = pops
      .map((p, j) => ({ p, j }))
      .filter(({ p, j }) => p.open && j !== i && popRefs.current[j]?.offsetParent)
      .sort((a, b) => b.p.z - a.p.z);
    requestAnimationFrame(() => {
      const next = rest[0] ? popRefs.current[rest[0].j]?.querySelector<HTMLElement>(".wmp-pop-close") : playBtn.current;
      next?.focus({ preventScroll: true });
    });
  };
  const stopAll = () => setPops((list) => list.map((p) => ({ ...p, open: false })));

  const close = () => {
    setClosed(true);
    requestAnimationFrame(() => iconBtn.current?.focus({ preventScroll: true }));
  };
  const reopen = () => {
    setClosed(false);
    requestAnimationFrame(() => closeBtn.current?.focus({ preventScroll: true }));
  };

  /* ---------- dragging: the player (pop = -1) or one of the windows ---------- */
  const startDrag = (e: PointerEvent<HTMLElement>, pop: number) => {
    if ((e.target as Element).closest("button") || !canDrag()) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const from = pop < 0 ? pos : pops[pop];
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: from.x, oy: from.y, pop };
  };
  const moveDrag = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const x = d.ox + e.clientX - d.sx;
    const y = d.oy + e.clientY - d.sy;
    if (d.pop < 0) setPos(clampInSection(root.current, pos, x, y));
    else {
      const el = popRefs.current[d.pop];
      const next = clampInSection(el, pops[d.pop], x, y);
      setPops((list) => list.map((p, j) => (j === d.pop ? { ...p, ...next } : p)));
    }
  };
  const endDrag = () => {
    drag.current = null;
  };
  const onBarKey = (e: KeyboardEvent<HTMLDivElement>) => {
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
    setPos(clampInSection(root.current, pos, pos.x + m[0], pos.y + m[1]));
  };

  const openCount = pops.filter((p) => p.open).length;
  const playing = openCount > 0;
  const still = projects[wmpStill.project];

  return (
    <div ref={stage} className="wmp-stage">
      <div
        ref={root}
        data-state={playing ? "playing" : "stopped"}
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

        <div role="group" aria-label="projects.wmv — media player" className="wmp-window" data-closed={closed || undefined} inert={closed}>
          <div
            className="xp-bar wmp-drag"
            tabIndex={0}
            aria-label="Title bar: on wide screens the arrow keys move the window"
            onPointerDown={(e) => startDrag(e, -1)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onBarKey}
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
                <CloseIcon />
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
            <a href={still.url} target="_blank" rel="noopener noreferrer" className="wmp-screen" data-screen="">
              <span className="wmp-reel">
                {/* eslint-disable-next-line @next/next/no-img-element -- small pre-sized WebP frame */}
                <img src={wmpStill.src} alt={wmpStill.alt} width={720} height={450} loading="lazy" decoding="async" className="wmp-slide" />
              </span>
              <span aria-hidden="true" className="wmp-noise" />
              <span aria-hidden="true" className="wmp-osd wmp-osd-state">
                {playing ? "▶ PLAY" : "■ STOP"}
              </span>
              <span className="sr-only"> — open {still.name} (opens in a new tab)</span>
            </a>
          </div>

          <div className="wmp-status">
            <span>{playing ? `Playing: ${openCount} file${openCount === 1 ? "" : "s"}` : "Ready"}</span>
          </div>
          <div aria-hidden="true" className="wmp-progress">
            <span className="wmp-progress-fill" style={{ transform: `scaleX(${(openCount / wmpShots.length).toFixed(3)})` }} />
          </div>
          <div className="wmp-controls">
            <button ref={playBtn} type="button" className="wmp-btn" onClick={throwClosed} aria-describedby="wmp-play-hint">
              <PlayIcon /> Play
            </button>
            <button type="button" className="wmp-btn" onClick={stopAll}>
              <StopIcon /> Stop
            </button>
            <span id="wmp-play-hint" className="sr-only">
              Opens the project screenshots as little windows again.
            </span>
          </div>
        </div>

        {closed && (
          <button ref={iconBtn} type="button" className="wmp-icon" onClick={reopen} aria-label="Open projects.wmv in the media player">
            <MediaGlyph />
            <span>projects.wmv</span>
          </button>
        )}
      </div>

      {/* The thrown windows: a cascade beside the player (desktop), below it (phones). */}
      <div className="wmp-pops">
        {wmpShots.map((shot, i) => {
          const p = pops[i];
          const project = projects[shot.project];
          return (
            <div
              key={`${i}-${p.gen}`}
              ref={(el) => {
                popRefs.current[i] = el;
              }}
              role="group"
              aria-label={shot.file}
              hidden={!p.open}
              className="wmp-pop"
              data-phone={shot.phone || undefined}
              onPointerDownCapture={() => raise(i)}
              onFocusCapture={() => raise(i)}
              style={
                {
                  "--i": i,
                  "--k": p.k,
                  zIndex: p.z,
                  translate: `${p.x}px ${p.y}px`,
                } as CSSProperties
              }
            >
              <div
                className="wmp-pop-bar"
                onPointerDown={(e) => startDrag(e, i)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
                <span className="wmp-pop-title">
                  <PictureGlyph />
                  <span>{shot.file}</span>
                </span>
                <button type="button" className="wmp-pop-close" onClick={() => closePop(i)} aria-label={`Close ${shot.file}`}>
                  <CloseIcon />
                </button>
              </div>
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="wmp-pop-shot">
                {/* eslint-disable-next-line @next/next/no-img-element -- small pre-sized WebP frame */}
                <img src={shot.src} alt={shot.alt} width={720} height={450} loading="lazy" decoding="async" />
                <span className="sr-only"> (opens {project.name} in a new tab)</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
