"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { bubbles } from "../../data/media";
import type { Service } from "../../data/services";
import { site } from "../../data/site";
import { useAnimationGate } from "../../lib/motion";
import { POP_MS, popBubble } from "../../lib/pop";
import { playPop } from "../../lib/sound";
import { useDrift } from "../../lib/useDrift";
import { EnvelopeIcon } from "../icons";
import { Photo } from "../media/Picture";

// Different sizes so they read as a loose cluster rising from the machine.
const SIZES = [196, 162, 214, 172];
const OFFSETS = [60, 0, 96, 24];
const DRIFT = { ampX: 14, ampY: 18, speed: 0.5 };

type OpenState = { id: string; phase: "popping" | "open" } | null;
type FocusTarget = { kind: "heading" | "button"; id: string } | null;

export function ServiceBubbles({ services }: { services: Service[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  // Bob only while the bubbles themselves are on screen.
  const { active, still } = useAnimationGate(listRef);
  const { bind, hold } = useDrift(services.length, active, DRIFT);
  const [open, setOpen] = useState<OpenState>(null);
  const [reforming, setReforming] = useState<string | null>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const headings = useRef<Record<string, HTMLHeadingElement | null>>({});
  const pictures = useRef<Record<string, HTMLSpanElement | null>>({});
  const labels = useRef<Record<string, HTMLSpanElement | null>>({});
  const focusTarget = useRef<FocusTarget>(null);
  const timer = useRef<number | undefined>(undefined);
  /** A bubble popped under a pressed mouse / pen, waiting for the release. */
  const pressed = useRef<string | null>(null);

  const reveal = (id: string) => {
    focusTarget.current = { kind: "heading", id };
    setOpen({ id, phase: "open" });
  };

  /** The pop itself: sound and picture in the same frame. */
  const burst = (id: string) => {
    window.clearTimeout(timer.current);
    if (open && open.id !== id) {
      setReforming(open.id);
      // Popped but never opened (still the same button): bring its picture back.
      [pictures.current[open.id], labels.current[open.id]].forEach((el) => el?.getAnimations().forEach((a) => a.cancel()));
    }
    playPop();
    const picture = pictures.current[id];
    if (picture) popBubble(picture, { drops: 9, also: [labels.current[id]] });
    setOpen({ id, phase: "popping" });
  };

  // Mouse / pen: the bubble pops the moment it is pressed; its panel opens once
  // the button is released (so the release never lands on the new panel).
  // Touch waits for the tap (click): a finger that starts a scroll on a bubble
  // must not pop it.
  const onPointerDown = (id: string, event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch" || event.button !== 0 || open?.id === id) return;
    burst(id);
    pressed.current = id;
    const t0 = event.timeStamp;
    const release = (up: Event) => {
      const left = Math.max(0, POP_MS - (up.timeStamp - t0));
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      // After the click that follows this pointerup has been dispatched.
      window.setTimeout(() => {
        if (pressed.current !== id) return;
        pressed.current = null;
        timer.current = window.setTimeout(() => reveal(id), left);
      }, 0);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  };

  // Keyboard (Enter / Space) and touch taps.
  const onClick = (id: string) => {
    if (pressed.current === id || open?.id === id) return;
    burst(id);
    if (still) reveal(id);
    else timer.current = window.setTimeout(() => reveal(id), POP_MS);
  };

  const close = (id: string) => {
    window.clearTimeout(timer.current);
    focusTarget.current = { kind: "button", id };
    setReforming(still ? null : id);
    setOpen(null);
  };

  // Move focus after the DOM swap: into the revealed panel, or back to its bubble.
  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = null;
    const el = target.kind === "heading" ? headings.current[target.id] : buttons.current[target.id];
    el?.focus();
  }, [open]);

  // An open panel stays put while it is read.
  useEffect(() => {
    services.forEach((service, i) => hold(i, open?.id === service.id));
  }, [open, services, hold]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ul
      ref={listRef}
      className="mt-12 flex flex-wrap items-start justify-center gap-x-4 gap-y-6 sm:mt-16 sm:justify-end sm:gap-x-10 sm:gap-y-8 sm:pr-[4%]">
      {services.map((service, i) => {
        const size = SIZES[i % SIZES.length];
        const isOpen = open?.id === service.id && open.phase === "open";
        const popping = open?.id === service.id && open.phase === "popping";
        const panelId = `service-${service.id}`;
        return (
          <li
            key={service.id}
            {...bind(i)}
            className="flex min-h-[var(--size)] min-w-[var(--size)] items-center justify-center sm:mt-[var(--offset)]"
            style={
              {
                // Phones: two bubbles per row, so each one is capped at ~half the width.
                "--size": `min(${size}px, 41vw)`,
                "--offset": `${OFFSETS[i % OFFSETS.length]}px`,
              } as CSSProperties
            }
          >
            {isOpen ? (
              <div
                id={panelId}
                className="panel-in label-box w-[min(88vw,330px)] p-6"
                onKeyDown={(event) => {
                  if (event.key === "Escape") close(service.id);
                }}
              >
                <h3
                  ref={(el) => {
                    headings.current[service.id] = el;
                  }}
                  tabIndex={-1}
                  className="text-display text-display-wrap text-[1.75rem]"
                >
                  {service.title}
                </h3>
                <p className="mt-3 text-base font-medium leading-snug text-ink-soft">
                  {service.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href={site.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="xp-cta"
                  >
                    <EnvelopeIcon />
                    Contact me
                    <span className="sr-only">
                      {" "}
                      about {service.title} on Telegram (opens in a new tab)
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => close(service.id)}
                    className="xp-btn xp-btn-sm"
                  >
                    Close<span className="sr-only"> {service.title}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                ref={(el) => {
                  buttons.current[service.id] = el;
                }}
                type="button"
                onPointerDown={(event) => onPointerDown(service.id, event)}
                onClick={() => onClick(service.id)}
                className="floaty relative grid h-[var(--size)] w-[var(--size)] place-items-center rounded-full text-ink"
              >
                <span
                  ref={(el) => {
                    pictures.current[service.id] = el;
                  }}
                  aria-hidden="true"
                  className={`absolute inset-0 ${!popping && reforming === service.id ? "bubble-reform" : ""}`}
                  onAnimationEnd={(event) => {
                    if (event.animationName === "bubble-reform") setReforming(null);
                  }}
                >
                  <Photo
                    photo={bubbles[i % bubbles.length]}
                    sizes={`${size}px`}
                    className="h-full w-full object-contain drop-shadow-[var(--shadow-object)]"
                  />
                </span>
                {/* Text straight inside the clear bubble: dark on the sky that shows
                    through it, with a white glow over the iridescent rim. */}
                <span
                  ref={(el) => {
                    labels.current[service.id] = el;
                  }}
                  className="text-glow relative max-w-[72%] text-center text-[0.9375rem] font-bold leading-tight sm:text-lg"
                >
                  {service.title}
                  <span className="sr-only">, show details</span>
                </span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
