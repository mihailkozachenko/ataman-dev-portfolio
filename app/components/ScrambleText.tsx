"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useScramble } from "use-scramble";

type ScrambleTextProps = {
  text: string;
  className?: string;
};

export function ScrambleText({ text, className }: ScrambleTextProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(wrapperRef, { amount: 0.3, once: true });

  const { ref, replay } = useScramble({
    text,
    speed: 0.6,
    tick: 1,
    step: 2,
    scramble: 6,
    seed: 2,
    playOnMount: false,
  });

  useEffect(() => {
    if (inView) replay();
  }, [inView, replay]);

  return (
    <span ref={wrapperRef}>
      <span ref={ref} className={className} />
    </span>
  );
}
