"use client";

import type { MouseEvent, ReactNode } from "react";
import { useStillMotion } from "../lib/motion";
import { arriveAt, easeInOut, scrollDuration, scrollToY } from "../lib/scroll";

/** Rect of the text itself (not the block box), via a Range over the contents. */
function textRect(el: Element) {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

function rgb(color: string) {
  const m = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [m[0], m[1], m[2]];
}

/**
 * A nav link whose word tears off the menu and flies with the scroll to its
 * section, growing into the section's heading and landing exactly on it (FLIP:
 * the copy starts at the link, ends at the heading's final on-screen place).
 * Then the heading fades in under it and the copy fades out.
 * Still motion (reduced or paused): a plain jump to the section. Always a real <a>.
 */
export function FlyLink({ href, headingId, className, children }: { href: string; headingId: string; className?: string; children: ReactNode }) {
  const still = useStillMotion();

  const onClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    const heading = document.getElementById(headingId);
    if (still || !heading) return; // the browser follows the hash as usual
    e.preventDefault();
    const link = e.currentTarget;
    if (link.dataset.flying) return;

    // Where the page will stop: the heading at 30 % of the screen height.
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const hDocTop = heading.getBoundingClientRect().top + window.scrollY;
    const y = Math.max(0, Math.min(max, hDocTop - vh * 0.3));
    const duration = scrollDuration(y - window.scrollY);

    // First (the link's word) and Last (the heading's text, where it will be).
    // The heading is one left-aligned line: its box gives the spot, its line
    // height the size (a Range would also catch the fallen letter on the hill).
    const from = textRect(link);
    const hs = getComputedStyle(heading);
    const hr = heading.getBoundingClientRect();
    const lineH = parseFloat(hs.lineHeight) || parseFloat(hs.fontSize);
    const to = { left: hr.left, top: hr.top, height: lineH };
    const toTop = to.top + window.scrollY - y;
    const ls = getComputedStyle(link);
    const scale0 = from.height / to.height;
    const c0 = rgb(ls.color);
    const c1 = rgb(hs.color);

    // The flying copy, styled as the heading, placed at the heading's final spot
    // and transformed back to the link (Invert), then Played to identity.
    const word = document.createElement("span");
    word.className = "fly-word";
    word.setAttribute("aria-hidden", "true");
    word.textContent = heading.getAttribute("aria-label") ?? heading.textContent ?? "";
    Object.assign(word.style, {
      left: `${to.left}px`,
      top: `${toTop}px`,
      fontFamily: hs.fontFamily,
      fontSize: hs.fontSize,
      fontWeight: hs.fontWeight,
      letterSpacing: hs.letterSpacing,
      lineHeight: `${lineH}px`,
      textTransform: hs.textTransform,
    });
    document.body.appendChild(word);

    link.dataset.flying = "true";
    heading.style.transition = "none";
    heading.style.opacity = "0";

    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / (duration * 1000));
        const e2 = easeInOut(t);
        const dx = (from.left - to.left) * (1 - e2);
        const dy = (from.top - toTop) * (1 - e2);
        const s = scale0 + (1 - scale0) * e2;
        word.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`;
        const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * Math.min(1, e2 * 1.4)));
        word.style.color = `rgb(${c.join(",")})`;
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
      void scrollToY(y, duration);
    });

    // Landed: the heading shows up under the copy, the copy dissolves.
    heading.style.transition = "opacity 0.3s ease-out";
    heading.style.opacity = "";
    word.style.transition = "opacity 0.3s ease-out";
    word.style.opacity = "0";
    window.setTimeout(() => {
      word.remove();
      heading.style.transition = "";
      delete link.dataset.flying;
    }, 350);
    arriveAt(heading, href);
  };

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
