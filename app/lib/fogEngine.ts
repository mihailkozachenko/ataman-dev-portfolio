import { mulberry32 } from "./random";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r0: number;
  r1: number;
  seed: number;
};

export type FogConfig = {
  /** Area to cover, CSS px. */
  cssWidth: number;
  cssHeight: number;
  /** CSS px per fog pixel. Bigger = chunkier and cheaper. */
  pixel: number;
  /** Nozzle position, CSS px from the canvas origin. */
  nozzleX: number;
  nozzleY: number;
  maxParticles: number;
  /** Puffs per second (modulated by a slow pulse). */
  rate: number;
  /** Final puff radius range, CSS px. */
  radius: [number, number];
};

// 4×4 ordered-dither matrix. Its values are added to the accumulated alpha;
// the posterise filter (see FogCanvas) thresholds the sum, which turns soft
// edges into a hand-pixelled checker transition.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Max alpha the dither adds, 0–255. The filter's thresholds are shifted by the same amount. */
export const DITHER_AMPLITUDE = 75;

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function buildSprite() {
  const size = 64;
  const sprite = makeCanvas(size);
  const ctx = sprite.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.85)");
    g.addColorStop(0.7, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

function buildDitherTile() {
  const tile = makeCanvas(4);
  const ctx = tile.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(4, 4);
    for (let i = 0; i < 16; i++) {
      img.data.set([255, 255, 255, Math.round((BAYER4[i] / 15) * DITHER_AMPLITUDE)], i * 4);
    }
    ctx.putImageData(img, 0, 0);
  }
  return tile;
}

/**
 * Soft fog puffs drawn into a tiny canvas. The canvas holds plain accumulated
 * alpha; posterising into flat tones happens in an SVG filter applied with CSS,
 * so there is no per-pixel JavaScript and no canvas read-back on the main thread.
 */
export class FogEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprite = buildSprite();
  private dither: CanvasPattern | null;
  private particles: Particle[] = [];
  private rnd = mulberry32(1337);
  private angle: number;
  private time = 0;
  private emitAcc = 0;
  private cfg: FogConfig | null = null;
  private w = 0;
  private h = 0;

  static create(canvas: HTMLCanvasElement, angleDeg: number) {
    // CPU-backed context: the canvas is tiny, and skipping GPU context set-up
    // avoids a start-up stall on low-end devices.
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    return new FogEngine(canvas, ctx, angleDeg);
  }

  private constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, angleDeg: number) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.angle = angleDeg;
    this.dither = ctx.createPattern(buildDitherTile(), "repeat");
  }

  /** Returns the low-res grid size so the caller can size the canvas in CSS. */
  configure(cfg: FogConfig) {
    const w = Math.max(1, Math.ceil(cfg.cssWidth / cfg.pixel));
    const h = Math.max(1, Math.ceil(cfg.cssHeight / cfg.pixel));
    if (this.cfg && this.cfg.pixel !== cfg.pixel) {
      const k = this.cfg.pixel / cfg.pixel;
      for (const p of this.particles) {
        p.x *= k;
        p.y *= k;
        p.vx *= k;
        p.vy *= k;
        p.r0 *= k;
        p.r1 *= k;
      }
    }
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (this.particles.length > cfg.maxParticles) this.particles.length = cfg.maxParticles;
    this.cfg = cfg;
    return { w, h };
  }

  /** Simulate ahead without drawing, so the fog is already there on first paint. */
  warmup(seconds: number) {
    const step = 1 / 30;
    for (let t = 0; t < seconds; t += step) this.step(step);
  }

  private spawn(cfg: FogConfig) {
    const inv = 1 / cfg.pixel;
    const a = ((this.angle + (this.rnd() - 0.5) * 40) * Math.PI) / 180;
    const speed = (140 + this.rnd() * 120) * inv;
    this.particles.push({
      x: cfg.nozzleX * inv,
      y: cfg.nozzleY * inv,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      age: 0,
      life: 7 + this.rnd() * 5,
      r0: 5 * inv,
      r1: (cfg.radius[0] + this.rnd() * (cfg.radius[1] - cfg.radius[0])) * inv,
      seed: this.rnd(),
    });
  }

  private radius(p: Particle) {
    const t = Math.min(1, (p.age / p.life) * 1.4);
    return p.r0 + (p.r1 - p.r0) * (1 - (1 - t) * (1 - t));
  }

  private alpha(p: Particle) {
    const t = p.age / p.life;
    const fadeIn = Math.min(1, p.age / 0.5);
    const fadeOut = t > 0.55 ? Math.max(0, 1 - (t - 0.55) / 0.45) : 1;
    return 0.5 * fadeIn * fadeOut * Math.sqrt(fadeOut);
  }

  step(dt: number) {
    const cfg = this.cfg;
    if (!cfg) return;
    const inv = 1 / cfg.pixel;
    this.time += dt;

    // Fog machines puff rather than stream: modulate the rate with a slow pulse.
    const pulse = 0.5 + Math.max(0, Math.sin(this.time * 1.1));
    this.emitAcc += cfg.rate * pulse * dt;
    while (this.emitAcc >= 1) {
      this.emitAcc -= 1;
      if (this.particles.length < cfg.maxParticles) this.spawn(cfg);
    }

    const drag = 1.3;
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.age += dt;
      const swirl = Math.sin(this.time * 0.6 + p.seed * 12.9 + p.y * 0.08);
      const lift = 30 + Math.cos(this.time * 0.5 + p.seed * 7.1) * 10;
      p.vx += (-drag * p.vx + (30 + swirl * 18) * inv) * dt;
      p.vy += (-drag * p.vy - lift * inv) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const r = this.radius(p);
      if (p.age >= p.life || p.y + r < 0 || p.x - r > this.w) {
        ps[i] = ps[ps.length - 1];
        ps.pop();
      }
    }
  }

  render() {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    if (this.particles.length === 0) return;

    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    for (const p of this.particles) {
      const a = this.alpha(p);
      if (a <= 0.01) continue;
      const r = this.radius(p);
      ctx.globalAlpha = a;
      ctx.drawImage(this.sprite, p.x - r, p.y - r, r * 2, r * 2);
      x0 = Math.min(x0, p.x - r);
      y0 = Math.min(y0, p.y - r);
      x1 = Math.max(x1, p.x + r);
      y1 = Math.max(y1, p.y + r);
    }
    ctx.globalAlpha = 1;

    // Add the dither to the alpha over the fog's bounding box. Empty pixels get
    // at most DITHER_AMPLITUDE, which stays under the filter's first threshold.
    if (this.dither && x1 > x0 && y1 > y0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = this.dither;
      ctx.fillRect(Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0) + 1, Math.ceil(y1 - y0) + 1);
      ctx.globalCompositeOperation = "source-over";
    }
  }
}
