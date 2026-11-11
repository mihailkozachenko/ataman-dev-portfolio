"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Service } from "../../data/services";
import { site } from "../../data/site";
import { useAnimationGate } from "../../lib/motion";
import { useDrift } from "../../lib/useDrift";

const SIZES = [176, 158, 190, 166];
const OFFSETS = [40, 0, 80, 20];
const DRIFT = { ampX: 14, ampY: 18, speed: 0.5 };
const POP_MS = 300;
const DROPS = Array.from({ length: 9 }, (_, k) => ({ angle: k * 40 + (k % 2) * 12, extra: (k % 3) * 14 }));

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
  const focusTarget = useRef<FocusTarget>(null);
  const timer = useRef<number | undefined>(undefined);

  const pop = (id: string) => {
    window.clearTimeout(timer.current);
    if (open && open.id !== id) setReforming(open.id);
    const reveal = () => {
      focusTarget.current = { kind: "heading", id };
      setOpen({ id, phase: "open" });
    };
    if (still) {
      reveal();
      return;
    }
    setOpen({ id, phase: "popping" });
    timer.current = window.setTimeout(reveal, POP_MS);
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
      className="mt-12 flex flex-wrap items-start justify-center gap-x-10 gap-y-8 sm:mt-16 sm:justify-start">
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
                "--size": `${size}px`,
                "--offset": `${OFFSETS[i % OFFSETS.length]}px`,
              } as CSSProperties
            }
          >
            {isOpen ? (
              <div
                id={panelId}
                className="panel-in w-[min(88vw,330px)] border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--ink)]"
                onKeyDown={(event) => {
                  if (event.key === "Escape") close(service.id);
                }}
              >
                <h3
                  ref={(el) => {
                    headings.current[service.id] = el;
                  }}
                  tabIndex={-1}
                  className="text-2xl font-bold uppercase leading-none tracking-tight"
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
                    className="plaque plaque-red text-sm"
                  >
                    Contact me
                    <span className="sr-only">
                      {" "}
                      about {service.title} on Telegram (opens in a new tab)
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => close(service.id)}
                    className="plaque plaque-white text-sm"
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
                onClick={() => {
                  if (!popping) pop(service.id);
                }}
                className="floaty relative grid place-items-center rounded-full text-ink"
                style={{ width: size, height: size }}
              >
                <span
                  aria-hidden="true"
                  className={`bubble absolute inset-0 ${popping ? "bubble-popping" : reforming === service.id ? "bubble-reform" : ""}`}
                  onAnimationEnd={(event) => {
                    if (event.animationName === "bubble-reform") setReforming(null);
                  }}
                />
                {popping && (
                  <span aria-hidden="true" className="absolute inset-0">
                    {DROPS.map((drop, k) => (
                      <span
                        key={k}
                        className="pop-drop"
                        style={
                          {
                            "--a": `${drop.angle}deg`,
                            "--d": `${size * 0.55 + drop.extra}px`,
                          } as CSSProperties
                        }
                      />
                    ))}
                  </span>
                )}
                <span
                  className={`relative flex flex-col items-center px-5 text-center transition-opacity duration-150 ${popping ? "opacity-0" : ""}`}
                >
                  <span className="text-base font-bold uppercase leading-tight tracking-tight sm:text-lg">
                    {service.title}
                  </span>
                  <span aria-hidden="true" className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em]">
                    pop me
                  </span>
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
