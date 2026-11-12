"use client";

import { useEffect, useRef } from "react";
import { fogNozzle, smokePuffs } from "../../data/media";
import { useAnimationGate } from "../../lib/motion";

/*
 * One big, dense, billowing mass of smoke that the project clouds stand out of,
 * fed by a thicker stream from the fog machine's nozzle.
 *
 * A canvas particle system: each particle is a soft smoke sprite that slowly
 * grows, turns, drifts and fades out, and is replaced continuously, so the mass
 * never pulses or gaps. Spawn points follow the real layout (measured from the
 * cloud links and the machine), so it fits desktop and phone alike.
 * Motion off → one pre-simulated still frame. Off-screen / tab hidden → paused.
 */

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number; // start size, px
  grow: number; // end size multiplier
  age: number;
  life: number;
  alpha: number;
  sprite: number;
};

type Anchor = { x: number; y: number; w: number; h: number; weight: number };

/** Deterministic PRNG: the same mass on every visit. */
function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Which sprites (indexes into smokePuffs) each kind of particle uses: the round
// billows build the mass; the column and the wisps only ever ride the stream.
const POOL = { mass: [0, 1, 2, 5], stream: [3, 4, 0, 5] };

// Extra room around the section so no particle is ever cut by the canvas edge.
const BLEED_TOP = 160;
const BLEED_BOTTOM = 220;

export function SmokeMass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { active, still, ready } = useAnimationGate(canvasRef);
  const sim = useRef<{ particles: P[]; rnd: () => number; warmed: boolean } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const section = canvas.closest("section");
    if (!section) return;

    let disposed = false;
    const sprites: HTMLImageElement[] = [];
    let loaded = 0;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let clouds: Anchor[] = [];
    let nozzle = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let mobile = false;

    if (!sim.current) sim.current = { particles: [], rnd: mulberry32(7), warmed: false };
    const S = sim.current;
    const rnd = S.rnd;

    const measure = () => {
      const box = section.getBoundingClientRect();
      W = box.width;
      H = box.height + BLEED_TOP + BLEED_BOTTOM;
      mobile = W < 1024;
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const local = (r: DOMRect) => ({ x: r.left - box.left, y: r.top - box.top + BLEED_TOP, w: r.width, h: r.height });
      clouds = Array.from(section.querySelectorAll<HTMLElement>(".cloud-link")).map((el, i) => {
        const r = local(el.getBoundingClientRect());
        // The first project (UKOL) is the heart of the mass.
        return { x: r.x + r.w / 2, y: r.y + r.h * 0.55, w: r.w, h: r.h, weight: r.w * r.h * (i === 0 ? 1.6 : 1) };
      });
      const machine = section.querySelector<HTMLElement>("[data-fog-machine]");
      if (machine) {
        const r = local(machine.getBoundingClientRect());
        nozzle = { x: r.x + r.w * fogNozzle.x, y: r.y + r.h * fogNozzle.y };
      }
      target = clouds[0] ? { x: clouds[0].x - clouds[0].w * 0.15, y: clouds[0].y + clouds[0].h * 0.1 } : nozzle;
    };

    const pickCloud = () => {
      const total = clouds.reduce((s, c) => s + c.weight, 0);
      let r = rnd() * total;
      for (const c of clouds) if ((r -= c.weight) <= 0) return c;
      return clouds[clouds.length - 1];
    };

    const spawn = (p: P, kind: "mass" | "bridge" | "stream", age = 0) => {
      const ref = clouds[0]?.w ?? 300;
      p.rot = rnd() * Math.PI * 2;
      p.vr = (rnd() - 0.5) * 0.12;
      p.age = age;
      const pool = kind === "stream" ? POOL.stream : POOL.mass;
      p.sprite = pool[Math.floor(rnd() * pool.length)] % sprites.length;
      if (kind === "stream" || clouds.length === 0) {
        // From the nozzle toward the heart of the mass: small and dense, growing fast.
        const dx = target.x - nozzle.x;
        const dy = target.y - nozzle.y;
        const len = Math.hypot(dx, dy) || 1;
        const speed = len / (6 + rnd() * 3);
        const spread = (rnd() - 0.5) * 0.35;
        const ux = dx / len;
        const uy = dy / len;
        p.x = nozzle.x + (rnd() - 0.5) * 8;
        p.y = nozzle.y + (rnd() - 0.5) * 8;
        p.vx = (ux - uy * spread) * speed;
        p.vy = (uy + ux * spread) * speed;
        p.size = ref * (0.12 + rnd() * 0.1);
        p.grow = 3.2 + rnd() * 1.8;
        p.life = 7 + rnd() * 3;
        p.alpha = 0.75 + rnd() * 0.2;
        return;
      }
      let cx: number, cy: number, w: number, h: number;
      if (kind === "bridge" && clouds.length > 1) {
        // Between two clouds (or the stream end), so the mass reads as one body.
        const pts = [target, ...clouds];
        const i = Math.floor(rnd() * (pts.length - 1));
        const a = pts[i];
        const b = pts[i + 1];
        const t = rnd();
        cx = a.x + (b.x - a.x) * t;
        cy = a.y + (b.y - a.y) * t;
        w = h = ref * 0.35;
      } else {
        const c = pickCloud();
        cx = c.x;
        cy = c.y;
        w = c.w * 0.62;
        h = c.h * 0.7;
      }
      const ang = rnd() * Math.PI * 2;
      const rad = Math.sqrt(rnd());
      p.x = cx + Math.cos(ang) * rad * w;
      p.y = cy + Math.sin(ang) * rad * h;
      p.vx = (rnd() - 0.5) * 9;
      p.vy = -3 - rnd() * 7; // a slow rise
      p.size = ref * (0.32 + rnd() * 0.32);
      p.grow = 1.35 + rnd() * 0.5;
      p.life = 9 + rnd() * 7;
      p.alpha = 0.55 + rnd() * 0.3;
    };

    const counts = () => (mobile ? { mass: 34, bridge: 8, stream: 14 } : { mass: 60, bridge: 16, stream: 26 });

    const fill = () => {
      const c = counts();
      const kinds: ("mass" | "bridge" | "stream")[] = [
        ...Array(c.mass).fill("mass"),
        ...Array(c.bridge).fill("bridge"),
        ...Array(c.stream).fill("stream"),
      ];
      S.particles = kinds.map((k) => {
        const p = { kind: k } as P & { kind: typeof k };
        spawn(p, k);
        // Spread the ages so they never die together.
        p.age = rnd() * p.life;
        return p;
      });
    };

    const step = (dt: number) => {
      for (const p of S.particles as (P & { kind: "mass" | "bridge" | "stream" })[]) {
        p.age += dt;
        if (p.age >= p.life) {
          spawn(p, p.kind);
          continue;
        }
        // Stream particles slow down as they join the mass.
        const drag = p.kind === "stream" ? 0.35 : 0.05;
        p.vx -= p.vx * drag * dt;
        p.vy -= p.vy * drag * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (loaded < sprites.length) return;
      for (const p of S.particles) {
        const t = p.age / p.life;
        // Fade in, hold, long fade out.
        const env = smoothstep(0, 0.22, t) * (1 - smoothstep(0.55, 1, t));
        // Never let a particle reach the canvas edge visibly.
        const edge =
          smoothstep(0, 80, p.x) * smoothstep(0, 80, W - p.x) * smoothstep(0, 90, p.y) * smoothstep(0, 90, H - p.y);
        const a = p.alpha * env * edge;
        if (a < 0.01) continue;
        const s = p.size * (1 + (p.grow - 1) * Math.sqrt(t));
        const img = sprites[p.sprite];
        const k = s / Math.max(img.naturalWidth, img.naturalHeight);
        const w = img.naturalWidth * k;
        const h = img.naturalHeight * k;
        ctx.globalAlpha = a;
        ctx.setTransform(dpr * Math.cos(p.rot), dpr * Math.sin(p.rot), -dpr * Math.sin(p.rot), dpr * Math.cos(p.rot), p.x * dpr, p.y * dpr);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (disposed) return;
      measure();
      if (!S.warmed || S.particles.length !== Object.values(counts()).reduce((a, b) => a + b, 0)) {
        fill();
        // Pre-simulate so the mass is already full on the first frame.
        for (let t = 0; t < 12; t += 1 / 20) step(1 / 20);
        S.warmed = true;
      }
      canvas.dataset.on = "true";
      if (still || !active) {
        draw();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    smokePuffs.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        loaded++;
        if (loaded === smokePuffs.length) start();
      };
      img.src = src;
      sprites.push(img);
    });

    const onResize = () => {
      measure();
      if (still || !active) draw();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(section);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, still, ready]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="smoke-mass pointer-events-none absolute inset-x-0 z-0 w-full"
      style={{ top: -BLEED_TOP, height: `calc(100% + ${BLEED_TOP + BLEED_BOTTOM}px)` }}
    />
  );
}
