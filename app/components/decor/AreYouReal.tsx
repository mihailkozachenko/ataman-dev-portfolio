"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useStillMotion } from "../../lib/motion";
import { Container } from "../Container";

const TEXT = "are you real?";
const LINES = 4;
/** The line that glitches once it has landed (0-based). */
const GLITCH_LINE = 2;
/** Each line starts this far "in front of the screen": scale and blur. */
const FROM = { scale: 2.5, blur: 14 };
/** Lines land one after another: start offset and length of each line's flight, in scroll progress. */
const STAGGER = 0.15;
const SPAN = 0.5;
const GLITCH = { min: 3000, max: 6000, ms: 150 };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * "are you real?" four times, stepped to the right, between the hero and
 * Projects, with a soft rainbow passing behind the letters. Scroll-scrubbed: each line flies in from right in front of the
 * viewer — big, blurred, transparent, from the middle of the screen — and
 * settles to its size as you scroll; scrolling back sends it back out. The
 * third line, once landed, tears into bands for ~150 ms every few seconds.
 * Only transform / opacity / filter change (no layout). Decorative
 * (aria-hidden). Motion reduced or paused: the lines just stand, no glitch.
 */
export function AreYouReal() {
  const root = useRef<HTMLDivElement>(null);
  const still = useStillMotion();

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const lines = Array.from(el.querySelectorAll<HTMLElement>(".ayr-line"));
    const glitchEl = el.querySelector<HTMLElement>("[data-glitchable]");
    el.dataset.live = "";
    if (still) {
      lines.forEach((l) => {
        l.style.transform = "";
        l.style.opacity = "";
        l.style.filter = "";
      });
      return;
    }

    // Each line's centre, x relative to the block (layout values: unaffected by transforms).
    let centres: number[] = [];
    const measure = () => {
      centres = lines.map((l) => l.offsetLeft + l.offsetWidth / 2);
      apply();
    };

    let landed = false;
    let glitchTimer = 0;
    let glitchOff = 0;
    const scheduleGlitch = () => {
      window.clearTimeout(glitchTimer);
      glitchTimer = window.setTimeout(
        () => {
          glitchEl?.setAttribute("data-glitch", "");
          glitchOff = window.setTimeout(() => {
            glitchEl?.removeAttribute("data-glitch");
            if (landed) scheduleGlitch();
          }, GLITCH.ms);
        },
        GLITCH.min + Math.random() * (GLITCH.max - GLITCH.min),
      );
    };
    const stopGlitch = () => {
      window.clearTimeout(glitchTimer);
      window.clearTimeout(glitchOff);
      glitchEl?.removeAttribute("data-glitch");
    };

    let raf = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0: the block's top at the bottom of the screen; 1: its middle at 55 % of the screen.
      const p = (vh - r.top) / (vh * 0.45 + r.height / 2);
      const toMid = window.innerWidth / 2 - r.left;
      lines.forEach((line, i) => {
        const t = clamp01((p - i * STAGGER) / SPAN);
        const e = easeOut(t);
        const k = 1 - e;
        if (t >= 1) {
          line.style.transform = "none";
          line.style.filter = "none";
          line.style.opacity = "1";
        } else {
          // From the middle of the screen (where the viewer is) to its place.
          const dx = (toMid - (centres[i] ?? 0)) * k * 0.6;
          line.style.transform = `translate3d(${dx.toFixed(1)}px, ${(k * 24).toFixed(1)}px, 0) scale(${(1 + (FROM.scale - 1) * k).toFixed(3)})`;
          line.style.filter = `blur(${(FROM.blur * k).toFixed(2)}px)`;
          line.style.opacity = (e * e).toFixed(3);
        }
        if (i === GLITCH_LINE) {
          if (t >= 1 && !landed) {
            landed = true;
            scheduleGlitch();
          } else if (t < 1 && landed) {
            landed = false;
            stopGlitch();
          }
        }
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      stopGlitch();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, [still]);

  return (
    <div aria-hidden="true" className="relative">
      <Container className="relative">
        <div ref={root} className="ayr py-8 lg:py-12">
          {/* The rainbow passes right through the lines, behind the letters. */}
          <span className="ayr-rainbow" />
          {Array.from({ length: LINES }, (_, i) => (
            <p key={i} className="ayr-line" style={{ "--i": i } as CSSProperties}>
              {i === GLITCH_LINE ? (
                <span className="ayr-word" data-glitchable="">
                  <span className="ayr-text">{TEXT}</span>
                  <span className="ayr-slice">{TEXT}</span>
                  <span className="ayr-slice">{TEXT}</span>
                  <span className="ayr-slice">{TEXT}</span>
                </span>
              ) : (
                TEXT
              )}
            </p>
          ))}
        </div>
      </Container>
    </div>
  );
}
