import { fogMachine } from "../../data/media";
import { projects } from "../../data/projects";
import { Container } from "../Container";
import { MissingImage } from "../decor/Collage";
import { DissolveTitle } from "../letters/DissolveTitle";
import { Photo } from "../media/Picture";
import { ProjectClouds } from "./ProjectClouds";
import { SmokeMass } from "./SmokeMass";

/*
 * The fog machine fills the sky with one big billowing mass of smoke; the project
 * clouds stand out of it. The smoke is a canvas particle system (SmokeMass) that
 * measures the clouds and the nozzle, so it follows the layout at any width.
 */
export function FogSection() {
  return (
    <section id="projects" data-anim-scope aria-labelledby="projects-title" className="relative">
      <SmokeMass />
      <Container className="relative pt-[var(--section-gap)]">
        <div className="fog-scene relative lg:aspect-square">
          <div className="relative z-20 lg:absolute lg:left-0 lg:top-0 lg:w-[60%]">
            <DissolveTitle
              text="Projects"
              id="projects-title"
              className="text-display whitespace-nowrap text-[length:var(--step-h2)] text-ink"
            />
            <p className="lead mt-6 text-ink">
              Every cloud is something I shipped. Pick one and float over.
            </p>
          </div>

          {/* Transparent-PNG bald spots in the open sky (desktop only). */}
          <MissingImage className="absolute right-0 top-[1%] hidden aspect-[16/9] w-[14%] lg:block" />
          <MissingImage glyph={false} className="absolute bottom-[7%] right-0 hidden aspect-[4/3] w-[9%] lg:block" />

          <ProjectClouds projects={projects} />

          {/* Machine in the foreground, in front of the smoke. */}
          <div
            data-fog-machine=""
            data-engine=""
            aria-hidden="true"
            className="relative z-10 mt-6 lg:absolute lg:bottom-0 lg:left-[2%] lg:mt-0"
            style={{ width: "var(--mw)", aspectRatio: `${fogMachine.width} / ${fogMachine.height}` }}
          >
            {/* It floats in the sky: a slow bob, with the motor's hum and kick on top. */}
            <div className="float-bob relative z-[2] h-full w-full">
              <div className="engine-kick h-full w-full">
                <div className="engine-hum h-full w-full">
                  <Photo
                    photo={fogMachine}
                    sizes="(max-width: 1024px) 200px, 31vw"
                    className="h-full w-full object-contain drop-shadow-[var(--shadow-object)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
