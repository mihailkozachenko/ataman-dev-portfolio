"use client";

import { useRef, type CSSProperties } from "react";
import type { Project } from "../../data/projects";
import { useAnimationGate } from "../../lib/motion";
import { hashString } from "../../lib/random";
import { useDrift } from "../../lib/useDrift";
import { ArrowUpRightIcon } from "../icons";
import { PixelCloud } from "../PixelCloud";

// Staggered vertical offsets on wider screens so clouds don't sit on one line.
const OFFSETS = [0, 72, 24, 96, 8, 56];
const DRIFT = { ampX: 26, ampY: 12, speed: 0.22 };

export function ProjectClouds({ projects }: { projects: Project[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  // Drift only while the clouds themselves are on screen.
  const { active } = useAnimationGate(listRef);
  const { bind } = useDrift(projects.length, active, DRIFT);

  return (
    <ul
      ref={listRef}
      className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-10 sm:mt-16 sm:justify-start">
      {projects.map((project, i) => (
        <li
          key={project.url}
          {...bind(i)}
          className="sm:mt-[var(--offset)]"
          style={{ "--offset": `${OFFSETS[i % OFFSETS.length]}px` } as CSSProperties}
        >
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="floaty relative flex aspect-[36/20] w-[min(86vw,330px)] flex-col justify-end rounded-[30%/45%] px-[11%] pb-[9%] pt-[25%] text-ink"
          >
            <PixelCloud
              seed={hashString(project.name)}
              stretch
              className="absolute inset-0 h-full w-full drop-shadow-[0_8px_0_rgb(13_36_64_/_0.14)]"
            />
            <span className="relative text-xl font-bold uppercase leading-none tracking-tight sm:text-2xl">
              {project.name}
              <ArrowUpRightIcon className="ml-1.5 inline-block h-[0.7em] w-[0.7em] align-baseline" />
            </span>
            <span className="relative mt-1.5 text-sm font-medium leading-snug text-ink-soft">
              {project.description}
            </span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
