import { bubbleMachine, bubbleNozzle, grass } from "../../data/media";
import { services } from "../../data/services";
import { ContactWindow } from "../ContactWindow";
import { Container } from "../Container";
import { MissingImage } from "../decor/Collage";
import { FieldDoor } from "../decor/FieldDoor";
import { HangingTitle } from "../letters/HangingTitle";
import { Photo } from "../media/Picture";
import { BubbleLayer } from "./BubbleLayer";
import { ServiceBubbles } from "./ServiceBubbles";

/**
 * The bottom of the descent: service bubbles rising from a bubble machine that
 * stands on the hill. Server component — only the bubbles hydrate.
 */
export function BubbleSection() {
  return (
    <section id="services" data-anim-scope aria-labelledby="services-title" className="relative">
      {/* Bald spot on the seam between the two sections, flush with the screen
          edge (right on phones, where the fog machine stands on the left). */}
      <MissingImage
        glyph={false}
        className="absolute right-0 top-0 z-[1] h-[clamp(96px,13vw,200px)] w-[clamp(40px,6vw,96px)] -translate-y-1/2 lg:left-0 lg:right-auto"
      />
      <Container className="click-through relative z-20 pt-[var(--section-gap)]">
        <div>
          <HangingTitle
            text="Services"
            hangIndex={3}
            id="services-title"
            className="text-display whitespace-nowrap text-[length:var(--step-h2)] text-ink"
          />
          <p className="lead mt-6 text-ink">Pop a bubble to see what&apos;s inside.</p>
        </div>

        <ServiceBubbles services={services} />

        {/* The closing moment: a message window on the old desktop. */}
        <section id="contact" aria-labelledby="contact-title" className="relative mt-24 scroll-mt-8 pb-16 sm:mt-28 sm:pb-24">
          {/* A missing tile in the sky beside the window, top-aligned with it (desktop). */}
          <MissingImage className="absolute left-[44rem] top-0 hidden aspect-square w-28 lg:block" />
          <ContactWindow />
        </section>
      </Container>

      {/* The hill: the field photo with its real horizon, on sky that matches the
          photo's own horizon colour, and a lone door standing on its crest. The
          footer lies over its lower part. Decorative apart from the door. */}
      <div
        data-hill=""
        className="door-field hill-sky relative z-10 -mt-16 h-[clamp(300px,46vh,440px)] sm:-mt-28 sm:h-[clamp(380px,56vh,680px)]"
      >
        <Photo
          photo={grass}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-[50%_0%]"
        />

        {/* A tile of the panorama that never loaded, flush with the left edge and
            straddling the horizon. */}
        <MissingImage
          glyph={false}
          className="absolute left-0 top-[34%] h-[clamp(72px,12vw,180px)] w-[clamp(48px,8vw,128px)] sm:top-[9%]"
        />

        {/* The machine stands on the slope. Rendering error 4: it was pasted in
            with its fake "transparent" background still showing. */}
        <div
          aria-hidden="true"
          data-emitter=""
          data-engine=""
          className="absolute bottom-[42%] right-[4%] w-[clamp(130px,20vw,300px)] sm:bottom-[30%] sm:right-[7%]"
          style={{ aspectRatio: `${bubbleMachine.width} / ${bubbleMachine.height}` }}
        >
          <div className="contact-shadow absolute -bottom-[7%] left-[0%] h-[18%] w-[100%] [animation:none]" />
          <div className="engine-hum relative h-full w-full">
            <MissingImage glyph={false} className="absolute inset-0" />
            <Photo
              photo={bubbleMachine}
              sizes="(max-width: 640px) 130px, 20vw"
              className="relative h-full w-full object-contain"
            />
          </div>
        </div>

        {/* A door in the field: the way to the contact block. */}
        <FieldDoor />
      </div>

      <BubbleLayer emitter={{ nozzle: bubbleNozzle, angle: bubbleNozzle.angle }} />
    </section>
  );
}
