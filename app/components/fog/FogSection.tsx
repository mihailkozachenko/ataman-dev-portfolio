import type { CSSProperties } from "react";
import { fogMachine } from "../../data/machines";
import { projects } from "../../data/projects";
import { Container } from "../Container";
import { MachineImage } from "../MachineImage";
import { FogLayer } from "./FogLayer";
import { ProjectClouds } from "./ProjectClouds";

const MACHINE_WIDTH = "clamp(180px, 32vw, 340px)";

// Server component: only FogLayer and ProjectClouds hydrate.
export function FogSection() {
  const ratio = fogMachine.height / fogMachine.width;

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative overflow-hidden"
      style={
        {
          "--machine-w": MACHINE_WIDTH,
          paddingBottom: `calc(var(--machine-w) * ${ratio} + 3rem)`,
        } as CSSProperties
      }
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="checker absolute left-[55%] top-[6%] h-40 w-[30%] sm:h-56" />
        <div className="checker absolute bottom-[18%] right-0 h-24 w-[18%]" />
      </div>

      <MachineImage
        machine={fogMachine}
        sizes="(max-width: 640px) 180px, 340px"
        className="absolute bottom-6 left-[4%] w-[var(--machine-w)]"
      />

      <FogLayer machine={fogMachine} />

      <Container className="relative z-10 pt-16 sm:pt-24">
        <p className="plaque plaque-tag plaque-red text-xs">01 · Fog machine</p>
        <h2
          id="projects-title"
          className="mt-4 text-[clamp(3rem,12vw,9.5rem)] font-bold uppercase leading-[0.85] tracking-[-0.045em]"
        >
          Projects
        </h2>
        <p className="mt-4 max-w-md text-lg font-medium text-ink-soft">
          Every cloud is something I shipped. Pick one and float over.
        </p>
        <ProjectClouds projects={projects} />
      </Container>
    </section>
  );
}
