import type { CSSProperties } from "react";
import { cloudAnim, clouds } from "../../data/media";
import { AnimatedImage, Photo } from "../media/Picture";
import { CloudEye } from "./CloudEye";

type Layer = {
  kind: "cloud-1" | "cloud-2" | "anim";
  /** Position on the whole page, % of its height / width. */
  top: number;
  left: number;
  /** Width in vw (capped in px). */
  vw: number;
  max: number;
  /** Parallax factor: far layers lag more behind the scroll. */
  depth: number;
  opacity: number;
  blur?: number;
  flip?: boolean;
  /** Far layers are skipped on phones. */
  desktopOnly?: boolean;
  /** The one cloud with an eye in it. */
  eye?: boolean;
};

// Three depths: far (small, faint, soft) · mid · near (big, crisp). Placed in
// the side gutters and in the gaps between blocks only — never behind a title,
// text, a project cloud or one of the "rendering errors" (checked at 1440 and 390).
// Every layer lies fully inside the page width (left ≥ 0, left + vw ≤ 100), so
// no cloud is ever cut by the edge of the screen.
const LAYERS: Layer[] = [
  // far
  { kind: "cloud-2", top: 0.8, left: 46, vw: 12, max: 200, depth: 0.32, opacity: 0.5, blur: 1.5, desktopOnly: true },
  { kind: "anim", top: 19, left: 40, vw: 14, max: 220, depth: 0.3, opacity: 0.55, blur: 1, desktopOnly: true },
  { kind: "cloud-1", top: 36, left: 88, vw: 10, max: 170, depth: 0.32, opacity: 0.45, blur: 1.5, desktopOnly: true },
  { kind: "cloud-2", top: 44, left: 1, vw: 11, max: 180, depth: 0.32, opacity: 0.45, blur: 1.5, desktopOnly: true },
  // mid
  { kind: "cloud-2", top: 44, left: 76, vw: 22, max: 380, depth: 0.16, opacity: 0.8, flip: true, desktopOnly: true },
  // A real cloud right above the green-lit one.
  { kind: "cloud-1", top: 53.6, left: 76, vw: 22, max: 340, depth: 0.15, opacity: 0.85, desktopOnly: true },
  // near
  { kind: "cloud-2", top: 19, left: 58, vw: 40, max: 620, depth: 0.05, opacity: 0.95, eye: true },
  { kind: "cloud-1", top: 68, left: 0, vw: 24, max: 360, depth: 0.05, opacity: 0.95, flip: true, desktopOnly: true },
];

/** Decorative cloud layers spread over the whole page. */
export function SkyDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {LAYERS.map((layer, i) => {
        const style: CSSProperties = {
          top: `${layer.top}%`,
          left: `${layer.left}%`,
          width: `min(${layer.vw}vw, ${layer.max}px)`,
          opacity: layer.opacity,
          filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
          transform: layer.flip ? "scaleX(-1)" : undefined,
        };
        const className = `absolute h-auto ${layer.desktopOnly ? "hidden md:block" : ""}`;
        return (
          <div key={i} data-depth={layer.depth} className={className} style={style}>
            {layer.kind === "anim" ? (
              // The animation's clouds drift across a fixed 400 px frame and would be
              // cut by its edges: the frame edges fade out instead.
              <div data-anim-scope className="anim-feather">
                <AnimatedImage anim={cloudAnim} className="h-auto w-full" />
              </div>
            ) : (
              <Photo
                photo={clouds[layer.kind === "cloud-1" ? 0 : 1]}
                sizes={`min(${layer.vw}vw, ${layer.max}px)`}
                className="h-auto w-full"
              />
            )}
            {/* Weirdcore: one eye in one cloud, in its densest white part. */}
            {layer.eye && <CloudEye x={clouds[1].text.x} y={clouds[1].text.y} />}
          </div>
        );
      })}
    </div>
  );
}
