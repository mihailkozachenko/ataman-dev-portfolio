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
 *
 * Kept cheap on the GPU on purpose (it used to take the tab down):
 *  - the canvas is set up once; going on / off screen only starts / stops the
 *    loop, it never re-creates the canvas or reloads the sprites;
 *  - its backing store is RES × the CSS size, whatever the screen's DPR: the
 *    smoke is soft, so the browser's upscale costs nothing visible;
 *  - only particles that touch the visible part of the canvas are drawn;
 *  - the slow drift is drawn at 30 fps;
 *  - no ctx.filter / shadow — the softness is baked into the sprites.
 */

type Kind = "mass" | "bridge" | "stream";
type P = {
  kind: Kind;
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
/** Backing-store pixels per CSS pixel (instead of devicePixelRatio). */
const RES = 0.5;
/** Frame interval of the loop, ms (30 fps). */
const FRAME_MS = 1000 / 30;
// Fewer, slightly bigger and denser puffs than before: the same body, far less overdraw.
const COUNTS = { desktop: { mass: 44, bridge: 10, stream: 18 }, mobile: { mass: 34, bridge: 8, stream: 12 } };
const DENSITY = 1.18;

export function SmokeMass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { active, still, ready } = useAnimationGate(canvasRef);
  // The running system exposes play / pause, so `active` never rebuilds it.
  const control = useRef<{ play: () => void; pause: () => void } | null>(null);
  const activeRef = useRef(active);

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
    let clouds: Anchor[] = [];
    let nozzle = { x: 0, y: 0 };
    let target = { x: 0, y: 0 };
    let mobile = false;
    let particles: P[] = [];
    const rnd = mulberry32(7);

    const measure = () => {
      const box = section.getBoundingClientRect();
      W = box.width;
      H = box.height + BLEED_TOP + BLEED_BOTTOM;
      mobile = W < 1024;
      // Only touch the backing store when the size really changes (a resize
      // reallocates the GPU texture).
      const bw = Math.max(1, Math.round(W * RES));
      const bh = Math.max(1, Math.round(H * RES));
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
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

    const spawn = (p: P) => {
      const ref = clouds[0]?.w ?? 300;
      p.rot = rnd() * Math.PI * 2;
      p.vr = (rnd() - 0.5) * 0.12;
      p.age = 0;
      const pool = p.kind === "stream" ? POOL.stream : POOL.mass;
      p.sprite = pool[Math.floor(rnd() * pool.length)] % sprites.length;
      if (p.kind === "stream" || clouds.length === 0) {
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
        p.size = ref * (0.14 + rnd() * 0.1);
        p.grow = 3.2 + rnd() * 1.8;
        p.life = 7 + rnd() * 3;
        p.alpha = Math.min(1, (0.75 + rnd() * 0.2) * DENSITY);
        return;
      }
      let cx: number, cy: number, w: number, h: number;
      if (p.kind === "bridge" && clouds.length > 1) {
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
      p.size = ref * (0.36 + rnd() * 0.34);
      p.grow = 1.35 + rnd() * 0.5;
      p.life = 9 + rnd() * 7;
      p.alpha = Math.min(1, (0.55 + rnd() * 0.3) * DENSITY);
    };

    const fill = () => {
      const c = mobile ? COUNTS.mobile : COUNTS.desktop;
      const kinds: Kind[] = [
        ...Array<Kind>(c.mass).fill("mass"),
        ...Array<Kind>(c.bridge).fill("bridge"),
        ...Array<Kind>(c.stream).fill("stream"),
      ];
      particles = kinds.map((kind) => {
        const p = { kind } as P;
        spawn(p);
        // Spread the ages so they never die together.
        p.age = rnd() * p.life;
        return p;
      });
    };

    const step = (dt: number) => {
      for (const p of particles) {
        p.age += dt;
        if (p.age >= p.life) {
          spawn(p);
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

    /** Draws the particles that touch the band [top, bottom] of the canvas (CSS px). */
    const draw = (all = false) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (loaded < sprites.length) return;
      let top = 0;
      let bottom = H;
      if (!all) {
        const r = canvas.getBoundingClientRect();
        top = -r.top;
        bottom = top + window.innerHeight;
      }
      for (const p of particles) {
        const t = p.age / p.life;
        const s = p.size * (1 + (p.grow - 1) * Math.sqrt(t));
        // Rotated square sprite: its reach is at most s·√2 / 2 from the centre.
        const reach = s * 0.71;
        if (p.y + reach < top || p.y - reach > bottom) continue;
        // Fade in, hold, long fade out.
        const env = smoothstep(0, 0.22, t) * (1 - smoothstep(0.55, 1, t));
        // Never let a particle reach the canvas edge visibly.
        const edge =
          smoothstep(0, 80, p.x) * smoothstep(0, 80, W - p.x) * smoothstep(0, 90, p.y) * smoothstep(0, 90, H - p.y);
        const a = p.alpha * env * edge;
        if (a < 0.01) continue;
        const img = sprites[p.sprite];
        const k = s / Math.max(img.naturalWidth, img.naturalHeight);
        const w = img.naturalWidth * k;
        const h = img.naturalHeight * k;
        const cos = Math.cos(p.rot) * RES;
        const sin = Math.sin(p.rot) * RES;
        ctx.globalAlpha = a;
        ctx.setTransform(cos, sin, -sin, cos, p.x * RES, p.y * RES);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = 0;
    let acc = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(100, now - (last || now));
      last = now;
      acc += dt;
      if (acc < FRAME_MS - 2) return;
      step(Math.min(0.1, acc / 1000));
      acc = 0;
      draw();
    };
    const play = () => {
      if (raf || disposed || still || loaded < sprites.length) return;
      last = 0;
      acc = FRAME_MS;
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    control.current = { play, pause };

    const start = () => {
      if (disposed) return;
      measure();
      fill();
      // Pre-simulate so the mass is already full on the first frame.
      for (let t = 0; t < 12; t += 1 / 20) step(1 / 20);
      canvas.dataset.on = "true";
      draw(true);
      if (activeRef.current) play();
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

    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver(() => {
      const box = section.getBoundingClientRect();
      if (Math.abs(box.width - lastW) < 1 && Math.abs(box.height - lastH) < 1) return;
      lastW = box.width;
      lastH = box.height;
      if (loaded < sprites.length) return;
      const wasMobile = mobile;
      measure();
      if (mobile !== wasMobile) fill();
      if (!raf) draw(true);
    });
    ro.observe(section);

    return () => {
      disposed = true;
      pause();
      control.current = null;
      ro.disconnect();
      sprites.forEach((img) => (img.onload = null));
    };
  }, [still, ready]);

  // On / off screen, tab hidden: only the loop starts and stops.
  useEffect(() => {
    activeRef.current = active;
    if (active) control.current?.play();
    else control.current?.pause();
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="smoke-mass pointer-events-none absolute inset-x-0 z-0 w-full"
      style={{ top: -BLEED_TOP, height: `calc(100% + ${BLEED_TOP + BLEED_BOTTOM}px)` }}
    />
  );
}
