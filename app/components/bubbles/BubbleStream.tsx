"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import { bubbles } from "../../data/media";
import { popBubble } from "../../lib/pop";
import { playPop } from "../../lib/sound";

export type Emitter = {
  /** Fraction of the emitter element's box. */
  nozzle: { x: number; y: number };
  /** Stream direction, degrees (0 = right, -90 = up). */
  angle: number;
};

type Props = {
  containerRef: RefObject<HTMLElement | null>;
  emitterRef: RefObject<HTMLElement | null>;
  emitter: Emitter;
  active: boolean;
  still: boolean;
};

// Small renditions of the bubble photos; the 64px box is scaled per bubble.
const BUBBLE_IMGS = bubbles.map(
  (b) => getImageProps({ src: b.src, width: b.width, height: b.height, alt: "", sizes: "96px" }).props,
);

/** Deterministic PRNG so the stream's rhythm is the same on every visit. */
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Bubble = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  seed: number;
  /** Simulation time before which this slot may not spawn again (after a pop). */
  rest: number;
};

const POOL = 14;
const POOL_MOBILE = 7;
const BASE = 64; // .bubble-deco is 64×64; size is applied via scale → no layout work

// Where bubbles rest when motion is off: distance along the stream, sideways offset, size.
const STATIC_LAYOUT = [
  { d: 46, p: -8, s: 26 },
  { d: 96, p: 18, s: 44 },
  { d: 150, p: -26, s: 32 },
  { d: 210, p: 30, s: 56 },
  { d: 268, p: -6, s: 36 },
  { d: 128, p: -60, s: 20 },
  { d: 330, p: 22, s: 48 },
  { d: 380, p: -40, s: 28 },
  { d: 60, p: 44, s: 18 },
  { d: 300, p: 70, s: 24 },
];

/** Decorative soap bubbles blown from the machine's wand. Pooled DOM nodes, one rAF loop. */
export function BubbleStream({ containerRef, emitterRef, emitter, active, still }: Props) {
  const els = useRef<(HTMLImageElement | null)[]>([]);
  const pool = useRef<Bubble[]>([]);
  const warmed = useRef(false);
  const { nozzle, angle } = emitter;

  useEffect(() => {
    const container = containerRef.current;
    const emitter = emitterRef.current;
    if (!container || !emitter) return;

    if (pool.current.length === 0) {
      for (let i = 0; i < POOL; i++) {
        pool.current.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, size: 0, seed: 0, rest: 0 });
      }
    }
    const bubbles = pool.current;
    const rnd = mulberry32(99);
    const rad = (angle * Math.PI) / 180;
    const dir = { x: Math.cos(rad), y: Math.sin(rad) };

    let wand = { x: 0, y: 0 };
    let mouth = 0;
    let bounds = { w: 0, h: 0 };
    let count = POOL;
    let scaleK = 1;

    const measure = () => {
      const box = container.getBoundingClientRect();
      const e = emitter.getBoundingClientRect();
      wand = { x: e.left - box.left + e.width * nozzle.x, y: e.top - box.top + e.height * nozzle.y };
      mouth = e.width * 0.3; // the open front of the machine, where the wands turn
      bounds = { w: box.width, h: box.height };
      const mobile = box.width < 640;
      count = mobile ? POOL_MOBILE : POOL;
      scaleK = mobile ? 0.75 : 1;
    };

    const place = (el: HTMLImageElement, x: number, y: number, size: number, opacity: number) => {
      el.style.transform = `translate3d(${(x - BASE / 2).toFixed(1)}px, ${(y - BASE / 2).toFixed(1)}px, 0) scale(${(size / BASE).toFixed(3)})`;
      el.style.opacity = opacity.toFixed(2);
    };

    const placeStatic = () => {
      els.current.forEach((el, i) => {
        if (!el) return;
        const spot = STATIC_LAYOUT[i];
        if (!spot || i >= count) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          return;
        }
        el.style.pointerEvents = "auto";
        // Along the stream direction plus a perpendicular offset, with a little upward bias.
        const x = wand.x + dir.x * spot.d * scaleK - dir.y * spot.p * scaleK;
        const y = wand.y + dir.y * spot.d * scaleK + dir.x * spot.p * scaleK - spot.d * 0.25;
        place(el, x, y, spot.s * scaleK, 1);
      });
    };

    measure();

    // Press a bubble: it pops on the spot — picture and sound in the same frame.
    let simTime = 0;
    const listeners: [HTMLImageElement, (e: PointerEvent) => void][] = [];
    const bindPop = (pop: (i: number, el: HTMLImageElement) => void) => {
      els.current.forEach((el, i) => {
        if (!el) return;
        const fn = (e: PointerEvent) => {
          e.stopPropagation();
          pop(i, el);
        };
        el.addEventListener("pointerdown", fn);
        listeners.push([el, fn]);
      });
    };
    const unbind = () => listeners.forEach(([el, fn]) => el.removeEventListener("pointerdown", fn));

    if (still) {
      placeStatic();
      // Motion off: the bubble just vanishes and comes back later.
      const timers: number[] = [];
      bindPop((_, el) => {
        if (el.dataset.popped) return;
        playPop(0.7);
        el.dataset.popped = "true";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        timers.push(
          window.setTimeout(() => {
            delete el.dataset.popped;
            el.style.opacity = "1";
            el.style.pointerEvents = "auto";
          }, 4000),
        );
      });
      const observer = new ResizeObserver(() => {
        measure();
        placeStatic();
      });
      observer.observe(container);
      return () => {
        observer.disconnect();
        unbind();
        timers.forEach((t) => window.clearTimeout(t));
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (!active) return () => observer.disconnect();

    bindPop((i, el) => {
      const b = bubbles[i];
      if (!b.alive) return;
      playPop(0.7);
      // The slot is free at once (draw() hides it); the pop animation plays over
      // that hidden state for POP_MS, frozen where the bubble was.
      popBubble(el, { drops: 7, hold: false });
      b.alive = false;
      b.rest = simTime + 2.5 + rnd() * 1.5; // a new one from this slot in a few seconds
    });

    const spawn = (b: Bubble) => {
      const a = rad + (rnd() - 0.5) * 0.8;
      const speed = 90 + rnd() * 120;
      b.alive = true;
      b.x = wand.x + (rnd() - 0.5) * mouth;
      b.y = wand.y + (rnd() - 0.5) * mouth * 0.15;
      b.vx = Math.cos(a) * speed;
      b.vy = Math.sin(a) * speed;
      b.age = 0;
      b.life = 5 + rnd() * 4;
      b.size = (22 + rnd() * 58) * scaleK;
      b.seed = rnd();
    };

    let spawnAcc = 0;
    const step = (dt: number) => {
      simTime += dt;
      spawnAcc += dt;
      const interval = count === POOL ? 0.38 : 0.6;
      while (spawnAcc >= interval) {
        spawnAcc -= interval;
        const free = bubbles.slice(0, count).find((b) => !b.alive && b.rest <= simTime);
        if (free) spawn(free);
      }
      for (let i = 0; i < count; i++) {
        const b = bubbles[i];
        if (!b.alive) continue;
        b.age += dt;
        // Drag, buoyancy, and a light breeze along the stream's horizontal direction.
        b.vx += (-0.6 * b.vx + dir.x * 12) * dt;
        b.vy += (-0.6 * b.vy - 24) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Bubbles that reach the top edge pop early.
        if (b.y < b.size * 0.6 && b.age < b.life - 0.2) b.life = b.age + 0.2;
        if (b.age >= b.life || b.x < -b.size || b.x > bounds.w + b.size) b.alive = false;
      }
    };

    // First start: pre-fill the air so the stream doesn't start empty.
    if (!warmed.current) {
      warmed.current = true;
      for (let t = 0; t < 3; t += 1 / 30) step(1 / 30);
    }

    const draw = () => {
      for (let i = 0; i < POOL; i++) {
        const el = els.current[i];
        if (!el) continue;
        const b = bubbles[i];
        if (i >= count || !b.alive) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          if (el.style.pointerEvents !== "none") el.style.pointerEvents = "none";
          continue;
        }
        if (el.style.pointerEvents !== "auto") el.style.pointerEvents = "auto";
        const grow = Math.min(1, 0.3 + (b.age / 0.5) * 0.7);
        const popT = Math.max(0, (b.age - (b.life - 0.2)) / 0.2);
        const wobble = Math.sin(b.age * 2.2 + b.seed * 6.28) * 6 * (b.size / 40);
        const fadeIn = Math.min(1, b.age / 0.15);
        place(el, b.x + wobble, b.y, b.size * grow * (1 + 0.3 * popT), fadeIn * (1 - popT));
      }
    };

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      unbind();
    };
  }, [active, still, containerRef, emitterRef, nozzle.x, nozzle.y, angle]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {Array.from({ length: POOL }, (_, i) => {
        const img = BUBBLE_IMGS[i % BUBBLE_IMGS.length];
        return (
          // eslint-disable-next-line @next/next/no-img-element -- optimised via getImageProps
          <img
            key={i}
            {...img}
            alt=""
            ref={(el) => {
              els.current[i] = el;
            }}
            data-poppable=""
            className="bubble-deco object-contain"
          />
        );
      })}
    </div>
  );
}
