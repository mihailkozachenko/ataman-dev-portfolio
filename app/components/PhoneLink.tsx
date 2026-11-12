"use client";

import { useRef, useState, type MouseEvent } from "react";
import { phone } from "../data/media";
import { usePrefersReducedMotion, useStillMotion } from "../lib/motion";
import { arriveAt, scrollDuration, scrollToY } from "../lib/scroll";
import { playRing } from "../lib/sound";

/**
 * The header's Contact link is an old rotary phone. Hover: it hops and the
 * handset trembles. Click: it rings twice (if Sound is on) and shakes, then the
 * page glides down to the contact block, which receives focus.
 * Reduced motion / paused: no hop or shake; the page goes straight there.
 */
export function PhoneLink() {
  const still = useStillMotion();
  const reduced = usePrefersReducedMotion();
  const [ringing, setRinging] = useState(false);
  const busy = useRef(false);

  const onClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("contact");
    if (!target) return; // let the browser follow the hash
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const ring = playRing();
    if (!still) {
      setRinging(true);
      await new Promise((r) => setTimeout(r, Math.max(700, Math.min(1100, ring * 1000))));
      setRinging(false);
    }
    const y = target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.1;
    if (reduced) window.scrollTo(0, y);
    else await scrollToY(y, scrollDuration(y - window.scrollY));
    arriveAt(target, "#contact");
    busy.current = false;
  };

  return (
    <a href="#contact" aria-label="Contact" className="phone-link" data-ringing={ringing || undefined} onClick={onClick}>
      <span className="phone-body" aria-hidden="true">
        {/* Body and dial (everything below the handset)… */}
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny, already optimised WebP above the fold */}
        <img src={phone.src} width={phone.width} height={phone.height} alt="" className="phone-base" />
        {/* …and the handset as its own layer, so it can tremble in its cradle. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- same file, second layer */}
        <img src={phone.src} width={phone.width} height={phone.height} alt="" className="phone-handset" />
      </span>
    </a>
  );
}
