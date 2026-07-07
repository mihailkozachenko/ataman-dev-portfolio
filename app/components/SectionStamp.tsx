import type { ReactNode } from "react";

export function SectionStamp({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-[clamp(2rem,9vw,4.625rem)] leading-[0.9] tracking-[0.2em] text-soft-white uppercase">
      {children}
    </h2>
  );
}
