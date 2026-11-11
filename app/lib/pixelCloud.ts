import { mulberry32 } from "./random";

export type PixelCloudShape = {
  cols: number;
  rows: number;
  /** SVG path of every filled cell. */
  body: string;
  /** Cells on the underside, drawn on top in a shade colour. */
  shade: string;
};

const cache = new Map<string, PixelCloudShape>();

/**
 * Builds a stepped "pixel" cloud: a rounded body plus a few round bumps on top,
 * rasterised onto a cols×rows grid and emitted as one row-run per path segment.
 * Pure and deterministic, so server and client render identical markup.
 */
export function pixelCloud(seed: number, cols = 36, rows = 20): PixelCloudShape {
  const key = `${seed}:${cols}:${rows}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const rnd = mulberry32(seed);
  const bodyTop = rows * 0.42;
  const bodyBottom = rows - 0.5;
  const bodyLeft = 1;
  const bodyRight = cols - 1;
  const corner = (bodyBottom - bodyTop) / 2;

  const bumps: { cx: number; cy: number; r: number }[] = [];
  const bumpCount = 3 + Math.floor(rnd() * 2);
  for (let k = 0; k < bumpCount; k++) {
    const r = rows * (0.24 + rnd() * 0.16);
    const cx = 4 + ((cols - 8) * (k + 0.5)) / bumpCount + (rnd() - 0.5) * 3;
    const cy = Math.max(r + 0.5, bodyTop + r * 0.3 + rnd() * 1.5);
    bumps.push({ cx, cy, r });
  }

  const inside = (x: number, y: number) => {
    if (y >= bodyTop && y <= bodyBottom && x >= bodyLeft && x <= bodyRight) {
      // Rounded-rect test: clamp to the inner rect, measure distance to it.
      const nx = Math.min(Math.max(x, bodyLeft + corner), bodyRight - corner);
      const ny = Math.min(Math.max(y, bodyTop + corner), bodyBottom - corner);
      if ((x - nx) ** 2 + (y - ny) ** 2 <= corner * corner) return true;
    }
    for (const b of bumps) {
      if ((x - b.cx) ** 2 + (y - b.cy) ** 2 <= b.r * b.r) return true;
    }
    return false;
  };

  const filled: boolean[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cols; x++) row.push(inside(x + 0.5, y + 0.5));
    filled.push(row);
  }

  const runs = (test: (x: number, y: number) => boolean) => {
    let d = "";
    for (let y = 0; y < rows; y++) {
      let x = 0;
      while (x < cols) {
        if (!test(x, y)) {
          x++;
          continue;
        }
        const start = x;
        while (x < cols && test(x, y)) x++;
        d += `M${start} ${y}h${x - start}v1h-${x - start}z`;
      }
    }
    return d;
  };

  const shape: PixelCloudShape = {
    cols,
    rows,
    body: runs((x, y) => filled[y][x]),
    shade: runs((x, y) => filled[y][x] && (y + 2 >= rows || !filled[y + 2][x])),
  };
  cache.set(key, shape);
  return shape;
}
