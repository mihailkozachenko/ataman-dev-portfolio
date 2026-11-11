import type { CSSProperties } from "react";
import { clouds, smokePlume, smokePlumeB, smokePlumeC, type Anim } from "../../data/media";
import { AnimatedImage, Photo } from "../media/Picture";

type Kind = "plume" | "plumeB" | "plumeC" | "cloud1" | "cloud2";

export type Puff = {
  kind: Kind;
  /** Centre relative to the nozzle, in plume units (cqw on desktop, vw on mobile). y is up. */
  x: number;
  y: number;
  /** Width in plume units. */
  w: number;
  /** Rotation from vertical, degrees (positive leans right). */
  rot?: number;
  blur?: number;
  opacity?: number;
  flip?: boolean;
  /** The first puff is anchored by its base, right at the nozzle. */
  base?: boolean;
  /** Engine pulse (synchronised with the machine kick). */
  pulse?: "on" | "late";
  /** Slow volumetric swell for the soft far part. */
  billow?: boolean;
};

const ANIMS: Partial<Record<Kind, Anim>> = { plume: smokePlume, plumeB: smokePlumeB, plumeC: smokePlumeC };

function PuffLayer({ puff }: { puff: Puff }) {
  const anim = ANIMS[puff.kind];
  const rot = puff.rot ?? 0;
  const flip = puff.flip ? " scaleX(-1)" : "";
  const outer: CSSProperties = {
    left: `calc(${puff.x} * var(--u))`,
    bottom: `calc(${puff.y} * var(--u))`,
    width: `calc(${puff.w} * var(--u))`,
    opacity: puff.opacity ?? 1,
    // Base-anchored: the plume image starts ~9% above its bottom edge, so it is
    // pulled down onto the nozzle. Others are centred on their point.
    transform: puff.base
      ? `translateX(-50%) rotate(${rot}deg) translateY(9%)${flip}`
      : `translate(-50%, 50%) rotate(${rot}deg)${flip}`,
    transformOrigin: puff.base ? "50% 100%" : "50% 50%",
    filter: puff.blur ? `blur(${puff.blur}px) brightness(1.06) contrast(0.85)` : undefined,
  };
  const inner = puff.pulse === "on" ? "smoke-puff" : puff.pulse === "late" ? "smoke-puff-late" : puff.billow ? "billow" : "";
  return (
    <div className="absolute" style={outer}>
      <div className={inner} style={{ transformOrigin: puff.base ? "50% 100%" : "50% 50%" }}>
        {anim ? (
          <AnimatedImage anim={anim} className="block h-auto w-full max-w-none" />
        ) : (
          <Photo
            photo={clouds[puff.kind === "cloud1" ? 0 : 1]}
            sizes="40vw"
            className="block h-auto w-full max-w-none"
          />
        )}
      </div>
    </div>
  );
}

/** A 0×0 anchor at the nozzle; puffs are placed around it. */
export function Plume({ puffs, className = "" }: { puffs: Puff[]; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute h-0 w-0 ${className}`}>
      {puffs.map((puff, i) => (
        <PuffLayer key={i} puff={puff} />
      ))}
    </div>
  );
}
