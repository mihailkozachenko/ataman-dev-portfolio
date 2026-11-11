import { pixelCloud } from "../lib/pixelCloud";

type Props = {
  seed: number;
  cols?: number;
  rows?: number;
  className?: string;
  /** Stretch to fill the parent box (for clouds that hold text). */
  stretch?: boolean;
  body?: string;
  shade?: string;
};

/** Decorative stepped-pixel cloud, generated from a seed. Always aria-hidden. */
export function PixelCloud({
  seed,
  cols = 36,
  rows = 20,
  className,
  stretch = false,
  body = "#ffffff",
  shade = "#d4e6fb",
}: Props) {
  const shape = pixelCloud(seed, cols, rows);
  return (
    <svg
      viewBox={`0 0 ${shape.cols} ${shape.rows}`}
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={shape.body} fill={body} />
      <path d={shape.shade} fill={shade} />
    </svg>
  );
}
