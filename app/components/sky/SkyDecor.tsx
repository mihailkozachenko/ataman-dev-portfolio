import type { CSSProperties } from "react";
import { cloudAnim, clouds } from "../../data/media";
import { AnimatedImage, Photo } from "../media/Picture";

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
};

// Three depths: far (small, faint, soft) · mid · near (big, crisp, at the edges
// so they never sit under body text).
const LAYERS: Layer[] = [
  // far
  { kind: "cloud-2", top: 3, left: 58, vw: 12, max: 200, depth: 0.32, opacity: 0.5, blur: 1.5, desktopOnly: true },
  { kind: "cloud-1", top: 15, left: 8, vw: 10, max: 170, depth: 0.32, opacity: 0.45, blur: 1.5, desktopOnly: true },
  { kind: "anim", top: 33, left: 70, vw: 14, max: 220, depth: 0.3, opacity: 0.55, blur: 1, desktopOnly: true },
  { kind: "cloud-2", top: 52, left: 40, vw: 11, max: 180, depth: 0.32, opacity: 0.45, blur: 1.5, desktopOnly: true },
  { kind: "cloud-1", top: 70, left: 80, vw: 12, max: 190, depth: 0.3, opacity: 0.5, blur: 1.5, desktopOnly: true },
  // mid
  { kind: "cloud-1", top: 9, left: 72, vw: 26, max: 420, depth: 0.16, opacity: 0.85 },
  { kind: "anim", top: 24, left: -6, vw: 24, max: 360, depth: 0.15, opacity: 0.8 },
  { kind: "cloud-2", top: 44, left: 78, vw: 24, max: 380, depth: 0.16, opacity: 0.8, flip: true },
  { kind: "cloud-1", top: 62, left: -4, vw: 22, max: 340, depth: 0.15, opacity: 0.8 },
  // near
  { kind: "cloud-2", top: 18, left: 82, vw: 40, max: 620, depth: 0.05, opacity: 0.95 },
  { kind: "cloud-1", top: 56, left: -14, vw: 40, max: 600, depth: 0.05, opacity: 0.95, flip: true },
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
              <div data-anim-scope>
                <AnimatedImage anim={cloudAnim} className="h-auto w-full" />
              </div>
            ) : (
              <Photo
                photo={clouds[layer.kind === "cloud-1" ? 0 : 1]}
                sizes={`min(${layer.vw}vw, ${layer.max}px)`}
                className="h-auto w-full"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
