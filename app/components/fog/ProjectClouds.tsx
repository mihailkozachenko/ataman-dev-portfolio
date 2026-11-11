"use client";

import { useRef, type CSSProperties } from "react";
import { clouds } from "../../data/media";
import type { Project } from "../../data/projects";
import { useAnimationGate } from "../../lib/motion";
import { useDrift } from "../../lib/useDrift";
import { ArrowUpRightIcon } from "../icons";
import { Photo } from "../media/Picture";

/*
 * Desktop slots along the plume, in cqw of the fog scene (centre x, centre y from
 * the bottom). Each sits on a spot where the smoke thickens (see FogSection).
 * Extra slots are ready for more projects.
 */
const SLOTS = [
  { x: 67, y: 28 },
  { x: 55, y: 50 },
  { x: 79, y: 72 },
  { x: 88, y: 50 },
  { x: 40, y: 34 },
];
// Phones: a single column, nudged left/right so it still reads as a rising plume.
// Reversed visually (flex-col-reverse) so the first project sits nearest the machine,
// while the DOM / reading order stays first-to-last.
const MOBILE_NUDGE = [10, -8, 6, -6, 8];
const DRIFT = { ampX: 18, ampY: 8, speed: 0.18 };

/**
 * Each project is a cloud: the whole cloud image is the link, and the text sits
 * straight on the cloud's densest white part (no backing box).
 */
export function ProjectClouds({ projects }: { projects: Project[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  // Drift only while the clouds themselves are on screen.
  const { active } = useAnimationGate(listRef);
  const { bind } = useDrift(projects.length, active, DRIFT);

  return (
    <ul
      ref={listRef}
      className="relative z-20 mt-8 flex flex-col-reverse items-center gap-1 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:block"
    >
      {projects.map((project, i) => {
        const cloud = clouds[i % clouds.length];
        const slot = SLOTS[i % SLOTS.length];
        return (
          <li
            key={project.url}
            {...bind(i)}
            className="cloud-slot lg:pointer-events-auto"
            style={
              {
                "--x": slot.x,
                "--y": slot.y,
                "--nudge": `${MOBILE_NUDGE[i % MOBILE_NUDGE.length]}vw`,
              } as CSSProperties
            }
          >
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cloud-link floaty relative block w-[min(calc(100vw-3rem),420px)] text-ink [container-type:inline-size] lg:w-[34cqw]"
              style={{ aspectRatio: `${cloud.width} / ${cloud.height}` }}
            >
              <Photo
                photo={cloud}
                sizes="(max-width: 1024px) 100vw, 400px"
                className="cloud-img absolute inset-0 h-full w-full object-contain drop-shadow-[0_12px_16px_rgb(5_25_80/0.22)]"
              />
              <span
                className="absolute w-[62%] -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${cloud.text.x}%`, top: `${cloud.text.y}%` }}
              >
                <span className="text-glow text-display block text-[6.2cqw] leading-none">
                  {project.name}
                  <ArrowUpRightIcon className="ml-[0.25em] inline-block h-[0.62em] w-[0.62em] align-baseline" />
                </span>
                <span className="text-glow mt-[1.2cqw] block text-[3.3cqw] font-semibold leading-tight">
                  {project.description}
                </span>
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
