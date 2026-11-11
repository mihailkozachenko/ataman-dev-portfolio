"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { MachineConfig } from "../../data/machines";
import { FogEngine, type FogConfig } from "../../lib/fogEngine";
import { useInView } from "../../lib/motion";

type Props = {
  /** Element the fog covers (the section). */
  containerRef: RefObject<HTMLElement | null>;
  /** The machine image box — the nozzle is placed relative to it. */
  emitterRef: RefObject<HTMLElement | null>;
  machine: MachineConfig;
  active: boolean;
  still: boolean;
};

const FRAME_MS = 1000 / 30; // fog is slow; 30 fps is plenty and halves the cost
const FOG_REACH = 820; // CSS px of sky above the nozzle that the fog can occupy
const WARMUP_SECONDS = 5; // pre-simulated so the fog is already there on first sight
const WARMUP_SLICE = 1; // simulated seconds per frame while warming up
const FILTER_ID = "fog-posterize";
// 20 equal alpha bins → output alpha. Bins below 0.30 are empty (that covers the
// dither added to empty pixels, see DITHER_AMPLITUDE), then three tones.
const ALPHA_TABLE = [
  ...Array(6).fill(0),
  ...Array(4).fill(0.49),
  ...Array(6).fill(0.76),
  ...Array(4).fill(0.94),
].join(" ");

/**
 * Decorative pixel fog. Simulated on a tiny canvas (1 cell = 5–6 CSS px) and
 * upscaled with `image-rendering: pixelated`.
 */
export function FogCanvas({ containerRef, emitterRef, machine, active, still }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FogEngine | null>(null);
  // Seconds of warm-up simulation still to run; deferred until the fog is needed.
  const warmupLeft = useRef(WARMUP_SECONDS);
  const { nozzle, angle } = machine;
  // The section can be on screen while its fog band (at the bottom) is not —
  // e.g. on a phone right after load. Animate only when the canvas itself shows.
  const canvasInView = useInView(canvasRef, "60px");
  const running = active && canvasInView;

  // Create the engine once; keep it sized to the section.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const engine = FogEngine.create(canvas, angle);
    if (!engine) return;
    engineRef.current = engine;

    const measure = () => {
      const box = container.getBoundingClientRect();
      const emitter = emitterRef.current?.getBoundingClientRect();
      const mobile = box.width < 640;
      const pixel = 6;
      const nozzleY = emitter ? emitter.top - box.top + emitter.height * nozzle.y : box.height;
      // Fog never climbs much higher than this above the nozzle, so the canvas only
      // covers that band — fewer pixels to process per frame on tall mobile layouts.
      const top = Math.max(0, Math.floor(nozzleY - FOG_REACH));
      const cfg: FogConfig = {
        cssWidth: box.width,
        cssHeight: box.height - top,
        pixel,
        nozzleX: emitter ? emitter.left - box.left + emitter.width * nozzle.x : 0,
        nozzleY: nozzleY - top,
        maxParticles: mobile ? 45 : 110,
        rate: mobile ? 4 : 8,
        radius: mobile ? [40, 80] : [60, 120],
      };
      const { w, h } = engine.configure(cfg);
      canvas.style.top = `${top}px`;
      canvas.style.width = `${w * pixel}px`;
      canvas.style.height = `${h * pixel}px`;
      if (warmupLeft.current <= 0) engine.render();
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (emitterRef.current) observer.observe(emitterRef.current);
    return () => {
      observer.disconnect();
      engineRef.current = null;
      warmupLeft.current = WARMUP_SECONDS;
    };
  }, [containerRef, emitterRef, nozzle.x, nozzle.y, angle]);

  // Run the loop only while allowed and visible; with motion off, draw one static frame.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || (!running && !still)) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Warm-up is spread over several frames, outside React's commit, so no
      // single frame turns into a long task. The first draw follows it.
      if (warmupLeft.current > 0) {
        engine.warmup(Math.min(WARMUP_SLICE, warmupLeft.current));
        warmupLeft.current -= WARMUP_SLICE;
        if (warmupLeft.current <= 0) engine.render();
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      if (still) return;
      raf = requestAnimationFrame(tick);
      const elapsed = now - last;
      if (elapsed < FRAME_MS) return;
      last = now;
      engine.step(Math.min(0.1, elapsed / 1000));
      engine.render();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, still]);

  return (
    <>
      <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
        {/* Posterise: accumulated alpha (+ dither) → three flat fog tones, tinted
            slightly bluer at the thin edges. Runs at raster time, off the main thread. */}
        <filter id={FILTER_ID} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues={ALPHA_TABLE} />
          </feComponentTransfer>
          <feColorMatrix
            type="matrix"
            values="0 0 0 .2356 .7785  0 0 0 .1667 .8433  0 0 0 0 1  0 0 0 1 0"
          />
        </filter>
      </svg>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[1] [image-rendering:pixelated]"
        style={{ filter: `url(#${FILTER_ID})` }}
      />
    </>
  );
}
