"use client";

import { useEffect, useState } from "react";

const LINES = [
  "> booting interface",
  "> core: reasoning engine — online",
  "> auth: supabase — verified",
  "> payments: stripe — ready",
  "> status: ONLINE",
  "> services: landing pages, AI web apps, Telegram bots, e-commerce",
];

// Fixed decorative pattern (not random) so server and client markup match on hydration.
const PIXELS = [
  1, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1,
  1, 0, 1, 0, 0, 1,
];

export function ScanCard() {
  const [lines, setLines] = useState<string[]>([]);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      const id = setTimeout(() => setLines(LINES), 0);
      return () => clearTimeout(id);
    }

    let lineIndex = 0;
    let charIndex = 0;
    let committed: string[] = [];
    let timer: ReturnType<typeof setInterval>;

    const typeChar = () => {
      const line = LINES[lineIndex];
      charIndex += 1;
      setCurrent(line.slice(0, charIndex));

      if (charIndex === line.length) {
        committed = [...committed, line];
        setLines(committed);
        setCurrent("");
        lineIndex += 1;
        charIndex = 0;

        if (lineIndex === LINES.length) {
          clearInterval(timer);
          setTimeout(() => {
            committed = [];
            lineIndex = 0;
            charIndex = 0;
            setLines([]);
            timer = setInterval(typeChar, 28);
          }, 2600);
        }
      }
    };

    timer = setInterval(typeChar, 28);
    return () => clearInterval(timer);
  }, []);

  const text = [...lines, current].filter(Boolean).join("\n");

  return (
    <div className="relative overflow-hidden rounded-[19.2px] border border-almost-white/15 bg-almost-white/[0.04] p-8 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel">
          Session
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-steel">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-violet motion-safe:animate-pulse" />
          Online
        </span>
      </div>

      <div className="mt-6 grid grid-cols-8 gap-[3px]">
        {PIXELS.map((filled, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-[1px] ${filled ? "bg-signal-violet/70" : "bg-almost-white/10"}`}
          />
        ))}
      </div>

      <div className="mt-6 min-h-[104px] whitespace-pre-line font-mono text-[13px] leading-relaxed text-lavender-mist">
        {text}
        <span className="ml-0.5 motion-safe:animate-pulse">▌</span>
      </div>
    </div>
  );
}
