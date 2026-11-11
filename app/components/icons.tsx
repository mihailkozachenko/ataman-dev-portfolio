// Pixel-style icons drawn on an 8×8 grid. Inline SVG instead of Unicode glyphs
// (↗ ↓ ▶ ❚❚): those aren't in Arial/Helvetica, and each one makes the browser
// scan system fonts for a fallback during the first layout.

type IconProps = {
  className?: string;
};

function PixelIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className ?? "h-[0.8em] w-[0.8em]"}
    >
      <path d={d} />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M2 1h5v5H6V3H5v1H4v1H3v1H2v1H1V6h1V5h1V4h1V3h1V2H2z" />;
}

export function ArrowDownIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M3 0h2v4h2v1H6v1H5v1H3V6H2V5H1V4h2z" />;
}

export function PauseIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M1 1h2v6H1zM5 1h2v6H5z" />;
}

export function PlayIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />;
}

export function StopIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M1 1h6v6H1z" />;
}
