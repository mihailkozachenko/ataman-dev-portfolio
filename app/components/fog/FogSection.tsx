import type { CSSProperties } from "react";
import { fogMachine, fogNozzle } from "../../data/media";
import { projects } from "../../data/projects";
import { Container } from "../Container";
import { Collage } from "../decor/Collage";
import { DissolveTitle } from "../letters/DissolveTitle";
import { Photo } from "../media/Picture";
import { Plume, type Puff } from "./Plume";
import { ProjectClouds } from "./ProjectClouds";

const NOZZLE: CSSProperties = { left: `${fogNozzle.x * 100}%`, top: `${fogNozzle.y * 100}%` };

/*
 * The plume, as one continuous column: dense and narrow at the nozzle, then
 * wider, softer and paler as it rises and meanders, ending in the project clouds.
 * Desktop units are cqw of the scene (the scene is 100 × 100 cqw), so the nozzle,
 * the smoke and the cloud slots stay locked together at any width.
 * Nozzle on desktop ≈ scene (32, 13); cloud slots: see ProjectClouds.
 */
const BACK_DESKTOP: Puff[] = [
  { kind: "cloud1", x: 8, y: 5, w: 14, blur: 2, opacity: 0.8, billow: true },
  { kind: "plumeB", x: 15, y: 9, w: 30, rot: 62, blur: 1, opacity: 0.95, pulse: "late" },
  { kind: "cloud2", x: 19, y: 11, w: 18, blur: 3, opacity: 0.75, billow: true },
  { kind: "plumeC", x: 26, y: 14, w: 36, rot: 40, blur: 2.5, opacity: 0.85 },
  { kind: "cloud2", x: 31, y: 22, w: 26, blur: 5, opacity: 0.75, billow: true },
  { kind: "plumeB", x: 24, y: 32, w: 40, rot: -16, blur: 4, opacity: 0.7 },
  { kind: "cloud1", x: 23, y: 40, w: 34, blur: 8, opacity: 0.6, billow: true },
  { kind: "plumeC", x: 34, y: 49, w: 46, rot: 28, blur: 6, opacity: 0.55 },
  { kind: "cloud2", x: 44, y: 58, w: 42, blur: 12, opacity: 0.45, flip: true, billow: true },
];
// Two base-anchored plumes, out of phase, make the column dense right at the nozzle.
const FRONT_DESKTOP: Puff[] = [
  { kind: "plume", x: 0, y: 0, w: 22, rot: 58, base: true, pulse: "on" },
  { kind: "plumeC", x: 0.5, y: 0, w: 25, rot: 64, base: true, opacity: 0.8, pulse: "late" },
];

// Phones: the clouds stack above the machine, so the plume rises almost straight up.
const BACK_MOBILE: Puff[] = [
  { kind: "cloud1", x: 10, y: 10, w: 34, blur: 2, opacity: 0.8, billow: true },
  { kind: "plumeB", x: 12, y: 26, w: 62, rot: 14, blur: 1, opacity: 0.9, pulse: "late" },
  { kind: "cloud2", x: 8, y: 56, w: 70, blur: 5, opacity: 0.7, billow: true },
  { kind: "plumeC", x: 2, y: 84, w: 80, rot: -8, blur: 3, opacity: 0.65 },
  { kind: "cloud1", x: 10, y: 116, w: 90, blur: 8, opacity: 0.5, billow: true },
];
const FRONT_MOBILE: Puff[] = [
  { kind: "plume", x: 0, y: 0, w: 46, rot: 26, base: true, pulse: "on" },
  { kind: "plumeC", x: 1, y: 0, w: 52, rot: 34, base: true, opacity: 0.8, pulse: "late" },
];

export function FogSection() {
  return (
    <section id="projects" data-anim-scope aria-labelledby="projects-title" className="relative">
      <Container className="relative pt-20 sm:pt-28">
        <div className="fog-scene relative lg:aspect-square">
          <Collage section="projects" />

          <div className="relative z-20 lg:absolute lg:left-0 lg:top-0 lg:w-[60%]">
            <DissolveTitle
              text="Projects"
              id="projects-title"
              className="text-display whitespace-nowrap text-[clamp(3rem,10.5vw,7.25rem)] text-ink"
            />
            <p className="label-box mt-5 max-w-sm px-4 py-3 text-base font-medium text-ink sm:text-lg">
              Every cloud is something I shipped. Pick one and float over.
            </p>
          </div>

          <ProjectClouds projects={projects} />

          {/* Machine in the foreground; the far smoke sits behind it. */}
          <div
            aria-hidden="true"
            className="relative z-10 mt-6 lg:absolute lg:bottom-0 lg:left-[2%] lg:mt-0"
            style={{ width: "var(--mw)", aspectRatio: `${fogMachine.width} / ${fogMachine.height}` }}
          >
            <div className="absolute z-0" style={NOZZLE}>
              <Plume puffs={BACK_DESKTOP} className="hidden lg:block [--u:1cqw]" />
              <Plume puffs={BACK_MOBILE} className="lg:hidden [--u:1vw]" />
            </div>
            <div className="contact-shadow absolute -bottom-[6%] left-[4%] z-[1] h-[14%] w-[92%]" />
            <div className="engine-kick relative z-[2] h-full w-full">
              <div className="engine-hum h-full w-full">
                <Photo
                  photo={fogMachine}
                  sizes="(max-width: 1024px) 200px, 31vw"
                  className="h-full w-full object-contain drop-shadow-[0_18px_18px_rgb(5_25_80/0.25)]"
                />
              </div>
            </div>
            <div className="absolute z-[3]" style={NOZZLE}>
              <Plume puffs={FRONT_DESKTOP} className="hidden lg:block [--u:1cqw]" />
              <Plume puffs={FRONT_MOBILE} className="lg:hidden [--u:1vw]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
