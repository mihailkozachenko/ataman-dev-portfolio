"use client";

import { useEffect, useRef, useState } from "react";
import { bubbles } from "../../data/media";
import { popBubble } from "../../lib/pop";
import { playPop } from "../../lib/sound";
import { Photo } from "../media/Picture";

const NEXT_AFTER = 1200; // the popped one is gone; a new one sets off from the right

/**
 * A lone soap bubble crossing the low sky of the hero — a first hint of the
 * bubble machine at the bottom. Pressing it pops it on the spot: sound and
 * picture in the same frame (popBubble). Then a NEW bubble sets off from the
 * right edge (the flight restarts), so the pop reads as a pop, not as the same
 * bubble blinking back.
 * A 14 px invisible margin makes the moving target easy to hit. Decorative.
 */
export function DriftBubble() {
  const [popped, setPopped] = useState(false);
  const [generation, setGeneration] = useState(0);
  const img = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-[6%] left-0 z-[5] w-14 sm:w-16">
      <div key={generation} className="drift-across">
        <div className="drift-bob">
          <div
            data-poppable={popped ? undefined : ""}
            className={`drift-hit relative ${popped ? "" : "pointer-events-auto"}`}
            onPointerDown={() => {
              if (popped || !img.current) return;
              playPop(0.7);
              popBubble(img.current);
              setPopped(true);
              timer.current = window.setTimeout(() => {
                setPopped(false);
                setGeneration((g) => g + 1);
              }, NEXT_AFTER);
            }}
          >
            <div ref={img}>
              <Photo photo={bubbles[1]} sizes="64px" className="h-auto w-full drop-shadow-[var(--shadow-object)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
