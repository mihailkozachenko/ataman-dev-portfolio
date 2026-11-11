"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { MachineConfig } from "../../data/machines";
import { useAnimationGate, useLatch } from "../../lib/motion";

// Purely decorative: no SSR, and its code loads only once it is needed.
const FogCanvas = dynamic(() => import("./FogCanvas").then((m) => m.FogCanvas), { ssr: false });

/**
 * Full-section decorative layer. Lives inside a server-rendered section, so it
 * finds the machine image (`[data-emitter]`) through the DOM instead of props.
 */
export function FogLayer({ machine }: { machine: MachineConfig }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const emitterRef = useRef<HTMLElement | null>(null);
  const { active, still, ready, inView } = useAnimationGate(layerRef);
  // Mount once the page is idle and the section is near (or immediately for a
  // static frame when motion is off); keep it mounted afterwards.
  const show = useLatch((ready && inView) || still);

  useEffect(() => {
    emitterRef.current = layerRef.current?.parentElement?.querySelector("[data-emitter]") ?? null;
  }, []);

  return (
    <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {show && (
        <FogCanvas
          containerRef={layerRef}
          emitterRef={emitterRef}
          machine={machine}
          active={active}
          still={still}
        />
      )}
    </div>
  );
}
