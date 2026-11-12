import type { CSSProperties } from "react";

/*
 * Dreamcore "rendering errors". The page has exactly three of them, each one
 * large, crisp and placed on the grid by the section that owns it:
 *  1. Hero — the portrait slot whose image never loaded (checkerboard).
 *  2. Services title — the hole the fallen letter leaves (the only chroma key,
 *     HangingTitle).
 *  3. Hill — the bubble machine pasted with its fake transparency showing.
 * The strangeness is in the idea; the execution stays exact: straight edges,
 * no rotation, no torn paper. Purely decorative.
 */

/** The browser's broken-image glyph, drawn on a pixel grid. */
function BrokenGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="absolute left-3 top-3 h-4 w-4"
      shapeRendering="crispEdges"
    >
      <path d="M1 1h10l4 4v10H1z" fill="var(--paper)" stroke="var(--checker-frame)" />
      <path d="M3 12l3-4 2 2 2-3 3 5z" fill="var(--checker-frame)" />
      <path d="M11 1v4h4" fill="none" stroke="var(--checker-frame)" />
    </svg>
  );
}

/**
 * Checkerboard in a 1px frame. With the glyph: an image slot that never loaded.
 * Without it: a cut-out PNG whose "transparency" is showing.
 */
export function MissingImage({
  className = "",
  style,
  glyph = true,
}: {
  className?: string;
  style?: CSSProperties;
  glyph?: boolean;
}) {
  return (
    <div aria-hidden="true" className={`checker broken-frame pointer-events-none ${className}`} style={style}>
      {glyph && <BrokenGlyph />}
    </div>
  );
}
