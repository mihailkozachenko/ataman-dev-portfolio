"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { MachineConfig } from "../../data/machines";
import { mulberry32 } from "../../lib/random";

type Props = {
  containerRef: RefObject<HTMLElement | null>;
  emitterRef: RefObject<HTMLElement | null>;
  machine: MachineConfig;
  active: boolean;
  still: boolean;
};

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
export function BubbleStream({ containerRef, emitterRef, machine, active, still }: Props) {
  const els = useRef<(HTMLSpanElement | null)[]>([]);
  const pool = useRef<Bubble[]>([]);
  const warmed = useRef(false);
  const { nozzle, angle } = machine;

  useEffect(() => {
    const container = containerRef.current;
    const emitter = emitterRef.current;
    if (!container || !emitter) return;

    if (pool.current.length === 0) {
      for (let i = 0; i < POOL; i++) {
        pool.current.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, size: 0, seed: 0 });
      }
    }
    const bubbles = pool.current;
    const rnd = mulberry32(99);
    const rad = (angle * Math.PI) / 180;
    const dir = { x: Math.cos(rad), y: Math.sin(rad) };

    let wand = { x: 0, y: 0 };
    let bounds = { w: 0, h: 0 };
    let count = POOL;
    let scaleK = 1;

    const measure = () => {
      const box = container.getBoundingClientRect();
      const e = emitter.getBoundingClientRect();
      wand = { x: e.left - box.left + e.width * nozzle.x, y: e.top - box.top + e.height * nozzle.y };
      bounds = { w: box.width, h: box.height };
      const mobile = box.width < 640;
      count = mobile ? POOL_MOBILE : POOL;
      scaleK = mobile ? 0.75 : 1;
    };

    const place = (el: HTMLSpanElement, x: number, y: number, size: number, opacity: number) => {
      el.style.transform = `translate3d(${(x - BASE / 2).toFixed(1)}px, ${(y - BASE / 2).toFixed(1)}px, 0) scale(${(size / BASE).toFixed(3)})`;
      el.style.opacity = opacity.toFixed(2);
    };

    const placeStatic = () => {
      els.current.forEach((el, i) => {
        if (!el) return;
        const spot = STATIC_LAYOUT[i];
        if (!spot || i >= count) {
          el.style.opacity = "0";
          return;
        }
        // Along the stream direction plus a perpendicular offset, with a little upward bias.
        const x = wand.x + dir.x * spot.d * scaleK - dir.y * spot.p * scaleK;
        const y = wand.y + dir.y * spot.d * scaleK + dir.x * spot.p * scaleK - spot.d * 0.25;
        place(el, x, y, spot.s * scaleK, 1);
      });
    };

    measure();

    if (still) {
      placeStatic();
      const observer = new ResizeObserver(() => {
        measure();
        placeStatic();
      });
      observer.observe(container);
      return () => observer.disconnect();
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    if (!active) return () => observer.disconnect();

    const spawn = (b: Bubble) => {
      const a = rad + (rnd() - 0.5) * 0.8;
      const speed = 90 + rnd() * 120;
      b.alive = true;
      b.x = wand.x;
      b.y = wand.y;
      b.vx = Math.cos(a) * speed;
      b.vy = Math.sin(a) * speed;
      b.age = 0;
      b.life = 5 + rnd() * 4;
      b.size = (18 + rnd() * 44) * scaleK;
      b.seed = rnd();
    };

    let spawnAcc = 0;
    const step = (dt: number) => {
      spawnAcc += dt;
      const interval = count === POOL ? 0.38 : 0.6;
      while (spawnAcc >= interval) {
        spawnAcc -= interval;
        const free = bubbles.slice(0, count).find((b) => !b.alive);
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
          continue;
        }
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
    };
  }, [active, still, containerRef, emitterRef, nozzle.x, nozzle.y, angle]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {Array.from({ length: POOL }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            els.current[i] = el;
          }}
          className="bubble bubble-deco"
        />
      ))}
    </div>
  );
}
