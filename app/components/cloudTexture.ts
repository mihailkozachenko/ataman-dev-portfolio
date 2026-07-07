const VIOLET_RGB = hexToRgb("#af50ff");
const LAVENDER_RGB = hexToRgb("#e1bdff");

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hash2(ix: number, iy: number, seed: number) {
  let h = ix * 374761393 + iy * 668265263 + seed * 1274126177;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

// Value noise with a horizontal wrap period, so consecutive tiles line up
// seamlessly when the layer is scrolled with `background-repeat: repeat-x`.
function valueNoise2D(x: number, y: number, seed: number, periodX: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const wrap = (v: number) => ((v % periodX) + periodX) % periodX;
  const x0 = wrap(xi);
  const x1 = wrap(xi + 1);
  const y0 = yi;
  const y1 = yi + 1;

  const v00 = hash2(x0, y0, seed);
  const v10 = hash2(x1, y0, seed);
  const v01 = hash2(x0, y1, seed);
  const v11 = hash2(x1, y1, seed);

  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const top = v00 + sx * (v10 - v00);
  const bottom = v01 + sx * (v11 - v01);
  return top + sy * (bottom - top);
}

function fbm(x: number, y: number, seed: number, periodX: number, octaves: number) {
  let total = 0;
  let amp = 0.5;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * freq, y * freq, seed + i * 101, periodX * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export type CloudTextureOptions = {
  seed: number;
  width: number;
  height: number;
  /** Integer count of noise cells spanning the width — keeps the tile seamless. */
  cellsAcross: number;
  octaves?: number;
  /** 0..1, higher = more open sky, fewer clouds. */
  coverage?: number;
  /** Edge softness for the cloud silhouette. */
  softness?: number;
  maxAlpha?: number;
};

export function generateCloudTexture({
  seed,
  width,
  height,
  cellsAcross,
  octaves = 5,
  coverage = 0.52,
  softness = 0.24,
  maxAlpha = 1,
}: CloudTextureOptions): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const image = ctx.createImageData(width, height);
  const cellsDown = (cellsAcross * height) / width;

  for (let y = 0; y < height; y++) {
    const ny = (y / height) * cellsDown;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * cellsAcross;
      const v = fbm(nx, ny, seed, cellsAcross, octaves);
      const shade = smoothstep(0.35, 0.75, v);
      const alpha = smoothstep(coverage, coverage + softness, v) * maxAlpha;

      const idx = (y * width + x) * 4;
      image.data[idx] = LAVENDER_RGB.r * shade + VIOLET_RGB.r * (1 - shade);
      image.data[idx + 1] = LAVENDER_RGB.g * shade + VIOLET_RGB.g * (1 - shade);
      image.data[idx + 2] = LAVENDER_RGB.b * shade + VIOLET_RGB.b * (1 - shade);
      image.data[idx + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
