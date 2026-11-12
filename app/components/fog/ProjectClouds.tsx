"use client";

import { useRef, type CSSProperties } from "react";
import { clouds } from "../../data/media";
import type { Project } from "../../data/projects";
import { useAnimationGate } from "../../lib/motion";
import { useDrift } from "../../lib/useDrift";
import { Photo } from "../media/Picture";

/*
 * Desktop slots in the smoke mass, in cqw of the fog scene (centre x, centre y
 * from the bottom, width). The first project is the big one in the middle; the
 * next two are smaller, on either side. Extra slots are ready for more projects.
 */
const SLOTS = [
  { x: 57, y: 47, w: 50 },
  { x: 24, y: 58, w: 31 },
  { x: 84, y: 64, w: 30 },
  { x: 86, y: 30, w: 28 },
  { x: 30, y: 34, w: 28 },
];
// Phones: a single column. The first (big) project sits in the middle of the
// column; the others are narrower and nudged left / right.
const MOBILE = [
  { nudge: 0, w: 100 },
  { nudge: -9, w: 78 },
  { nudge: 9, w: 78 },
  { nudge: -6, w: 78 },
  { nudge: 6, w: 78 },
];
// Visual order on phones: second project on top, the big first one in the
// middle, the third below it (DOM / reading order stays first-to-last).
const MOBILE_ORDER = [2, 1, 3, 4, 5];
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
      className="relative z-20 mt-8 flex flex-col items-center gap-2 lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:block"
    >
      {projects.map((project, i) => {
        const cloud = clouds[i % clouds.length];
        const slot = SLOTS[i % SLOTS.length];
        const phone = MOBILE[i % MOBILE.length];
        return (
          <li
            key={project.url}
            {...bind(i)}
            className="cloud-slot lg:pointer-events-auto"
            style={
              {
                "--x": slot.x,
                "--y": slot.y,
                "--w": slot.w,
                "--nudge": `${phone.nudge}vw`,
                order: MOBILE_ORDER[i] ?? i + 1,
              } as CSSProperties
            }
          >
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cloud-link floaty relative block w-[calc(min(100vw-2rem,480px)*var(--mw-cloud-k,1))] text-ink [container-type:inline-size] lg:w-[calc(var(--w)*1cqw)]"
              style={{ aspectRatio: `${cloud.width} / ${cloud.height}`, ["--mw-cloud-k" as string]: phone.w / 100 }}
            >
              <Photo
                photo={cloud}
                sizes="(max-width: 1024px) 100vw, 400px"
                className="cloud-img absolute inset-0 h-full w-full object-contain"
              />
              <span
                className="absolute w-[66%] -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: `${cloud.text.x}%`, top: `${cloud.text.y}%` }}
              >
                <span className="cloud-name text-glow text-display block text-[7cqw] leading-none">
                  {project.name}
                </span>
                <span className="text-glow mt-[1.6cqw] block text-[3.9cqw] font-medium leading-[1.3]">
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
