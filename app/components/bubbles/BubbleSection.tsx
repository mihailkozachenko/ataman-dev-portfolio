import type { CSSProperties } from "react";
import { bubbleMachine } from "../../data/machines";
import { services } from "../../data/services";
import { Container } from "../Container";
import { MachineImage } from "../MachineImage";
import { BubbleLayer } from "./BubbleLayer";
import { ServiceBubbles } from "./ServiceBubbles";

const MACHINE_WIDTH = "clamp(170px, 30vw, 320px)";

// Server component: only BubbleLayer and ServiceBubbles hydrate.
export function BubbleSection() {
  const ratio = bubbleMachine.height / bubbleMachine.width;

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="relative overflow-hidden"
      style={
        {
          "--machine-w": MACHINE_WIDTH,
          paddingBottom: `calc(var(--machine-w) * ${ratio} + 3rem)`,
        } as CSSProperties
      }
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="checker absolute left-0 top-[22%] h-48 w-[22%]" />
        <div className="checker absolute right-[34%] top-[8%] h-16 w-32 sm:h-24 sm:w-48" />
      </div>

      <MachineImage
        machine={bubbleMachine}
        sizes="(max-width: 640px) 170px, 320px"
        className="absolute bottom-6 right-[4%] w-[var(--machine-w)]"
      />

      <BubbleLayer machine={bubbleMachine} />

      <Container className="relative z-10 pt-16 sm:pt-24">
        <div className="flex flex-col items-start sm:items-end sm:text-right">
          <p className="plaque plaque-tag plaque-lime text-xs">02 · Bubble machine</p>
          <h2
            id="services-title"
            className="mt-4 text-[clamp(3rem,12vw,9.5rem)] font-bold uppercase leading-[0.85] tracking-[-0.045em]"
          >
            Services
          </h2>
          <p className="mt-4 max-w-md text-lg font-medium text-ink-soft">
            Pop a bubble to see what&apos;s inside.
          </p>
        </div>
        <ServiceBubbles services={services} />
      </Container>
    </section>
  );
}
