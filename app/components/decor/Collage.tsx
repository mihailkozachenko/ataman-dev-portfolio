import type { CSSProperties } from "react";
import { clouds } from "../../data/media";
import { Photo } from "../media/Picture";

/*
 * Dreamcore collage: holes where the "PNG" is missing (checkerboard), a broken
 * image frame, torn edges, pieces of sky pasted in the wrong place, and one cloud
 * that "failed to render" (flat chroma-key silhouette). Purely decorative.
 * Positions are % of the parent box and chosen to sit in empty areas only.
 */

type Edge = "top" | "right" | "bottom" | "left";
type Item = {
  type: "hole" | "patch" | "chroma";
  style: CSSProperties;
  /** Thin grey border + broken-image glyph. */
  frame?: boolean;
  torn?: Edge;
  /** Shown on phones too (smaller via the style's clamp()); default: md and up. */
  mobile?: boolean;
  /** Only on phones (a re-placed variant of a desktop item). */
  mobileOnly?: boolean;
  /** Very slow drift. */
  drift?: boolean;
};

// Deterministic jagged edge for clip-path.
function tornPath(edge: Edge) {
  const teeth = [0, 7, 3, 9, 2, 6, 1, 8, 4, 6, 2, 9, 3, 5, 1];
  const n = teeth.length - 1;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const along = (i / n) * 100;
    const depth = teeth[i];
    if (edge === "right") pts.push(`${100 - depth}% ${along}%`);
    if (edge === "left") pts.push(`${depth}% ${100 - along}%`);
    if (edge === "top") pts.push(`${along}% ${depth}%`);
    if (edge === "bottom") pts.push(`${100 - along}% ${100 - depth}%`);
  }
  const corners: Record<Edge, string[]> = {
    right: ["0 100%", "0 0"],
    left: ["100% 0", "100% 100%"],
    top: ["100% 100%", "0 100%"],
    bottom: ["0 0", "100% 0"],
  };
  const ordered =
    edge === "right" || edge === "top" ? [...pts, ...corners[edge]] : [...corners[edge], ...pts];
  return `polygon(${ordered.join(", ")})`;
}

const SETS: Record<string, Item[]> = {
  hero: [
    // Kept clear of the white title everywhere (white-on-checker would be unreadable).
    { type: "hole", style: { right: "4%", top: "42%", width: "22%", height: "26%" } },
    { type: "hole", mobileOnly: true, style: { right: "-4%", top: "28%", width: "30%", height: "12%" } },
    { type: "hole", style: { left: "44%", bottom: "12%", width: "clamp(90px,10vw,150px)", height: "clamp(40px,4.5vw,64px)" } },
    { type: "hole", frame: true, style: { right: "4%", top: "78%", width: "18%", height: 22 } },
  ],
  projects: [
    { type: "hole", frame: true, style: { left: "3%", top: "38%", width: "11%", height: "9%" } },
    { type: "hole", style: { right: "0.5%", top: "4%", width: "2.2%", height: "26%" } },
    { type: "hole", torn: "right", style: { left: "36%", top: "60%", width: "7%", height: "11%" } },
    { type: "hole", torn: "left", mobileOnly: true, style: { right: "-6vw", top: "44%", width: "18vw", height: "12vw" } },
  ],
  services: [
    { type: "chroma", style: { left: "16%", top: "3%", width: "min(17vw, 260px)" }, drift: true },
    { type: "chroma", mobileOnly: true, style: { right: "-9vw", top: "15%", width: "32vw" } },
    { type: "patch", torn: "bottom", style: { left: "4%", top: "30%", width: "min(16vw, 240px)", height: "min(10vw, 150px)", rotate: "-3deg" } },
    { type: "hole", frame: true, mobileOnly: true, style: { left: "-3vw", top: "40%", width: "16vw", height: "10vw" } },
  ],
  hill: [
    { type: "hole", torn: "bottom", mobile: true, style: { left: "55%", top: "-5%", width: "clamp(70px,10vw,150px)", height: "clamp(48px,7vw,104px)" } },
    { type: "patch", torn: "right", style: { left: "14%", bottom: "38%", width: "min(12vw, 180px)", height: "min(6vw, 90px)", rotate: "4deg" } },
    { type: "hole", style: { right: "34%", bottom: "30%", width: "5%", height: "2.2%" } },
  ],
};

function BrokenGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="absolute left-1 top-1 h-3.5 w-3.5" shapeRendering="crispEdges">
      <path d="M1 1h10l4 4v10H1z" fill="#fff" stroke="#8f8f8f" />
      <path d="M3 12l3-4 2 2 2-3 3 5z" fill="#6aa84f" />
      <path d="M11 1v4h4" fill="none" stroke="#8f8f8f" />
    </svg>
  );
}

function CollageItem({ item }: { item: Item }) {
  const visibility = item.mobileOnly ? "md:hidden" : item.mobile ? "" : "hidden md:block";
  const clip = item.torn ? { clipPath: tornPath(item.torn) } : {};
  const drift = item.drift ? "collage-drift" : "";
  if (item.type === "chroma") {
    const c = clouds[1];
    return (
      <div
        className={`chroma-cloud absolute ${visibility} ${drift}`}
        style={{ ...item.style, aspectRatio: `${c.width} / ${c.height}`, ["--cloud-mask" as string]: `url(${c.src})` }}
      />
    );
  }
  if (item.type === "patch") {
    // A piece of the deep top sky with a bit of cloud, pasted onto pale sky.
    return (
      <div
        className={`sky-patch absolute overflow-hidden ${visibility} ${drift}`}
        style={{ ...item.style, ...clip }}
      >
        <Photo photo={clouds[0]} sizes="240px" className="absolute -right-[30%] top-[10%] h-auto w-[130%] max-w-none" />
      </div>
    );
  }
  return (
    <div
      className={`checker absolute ${item.frame ? "broken-frame" : ""} ${visibility} ${drift}`}
      style={{ ...item.style, ...clip }}
    >
      {item.frame && <BrokenGlyph />}
    </div>
  );
}

export function Collage({ section }: { section: keyof typeof SETS }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SETS[section].map((item, i) => (
        <CollageItem key={i} item={item} />
      ))}
    </div>
  );
}
