import { bubbleMachine, bubbleNozzle, grass } from "../../data/media";
import { services } from "../../data/services";
import { site } from "../../data/site";
import { Container } from "../Container";
import { Collage } from "../decor/Collage";
import { HangingTitle } from "../letters/HangingTitle";
import { Photo } from "../media/Picture";
import { BubbleLayer } from "./BubbleLayer";
import { ServiceBubbles } from "./ServiceBubbles";

const CONTACTS = [
  { href: site.telegram, label: "Telegram" },
  { href: site.whatsapp, label: "WhatsApp" },
];

/**
 * The bottom of the descent: service bubbles rising from a bubble machine that
 * stands on the hill. Server component — only the bubbles hydrate.
 */
export function BubbleSection() {
  return (
    <section id="services" data-anim-scope aria-labelledby="services-title" className="relative">
      <Collage section="services" />
      <Container className="relative z-20 pt-20 sm:pt-28">
        <div className="flex flex-col items-start sm:items-end sm:text-right">
          <HangingTitle
            text="Services"
            hangIndex={3}
            id="services-title"
            className="text-display whitespace-nowrap text-[clamp(3rem,10.5vw,7.25rem)] text-ink"
          />
          <p className="label-box mt-5 max-w-sm px-4 py-3 text-base font-medium text-ink sm:text-lg">
            Pop a bubble to see what&apos;s inside.
          </p>
        </div>
        <ServiceBubbles services={services} />

        <div id="contact" className="label-box relative mt-14 max-w-md p-5 sm:mt-10 sm:p-7">
          {/* A missing-PNG hole peeking out from behind the card. */}
          <div aria-hidden="true" className="checker broken-frame absolute -right-6 -top-5 -z-10 h-14 w-24 sm:-right-12 sm:-top-8 sm:h-20 sm:w-36" />
          <h2 className="text-display text-[clamp(1.75rem,5vw,2.75rem)]">
            Got a project in mind?
          </h2>
          <p className="mt-3 text-base font-medium text-ink-soft">
            Tell me what you need — I&apos;ll get back to you the same day.
          </p>
          <ul className="mt-5 flex flex-wrap gap-3">
            {CONTACTS.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plaque plaque-red text-sm"
                >
                  {c.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* The hill: the field photo with its real horizon, on sky that matches the
          photo's own horizon colour. The footer lies over its lower part. */}
      <div
        data-hill=""
        aria-hidden="true"
        className="hill-sky relative z-10 -mt-16 h-[clamp(300px,46vh,440px)] sm:-mt-28 sm:h-[clamp(380px,56vh,680px)]"
      >
        <Photo
          photo={grass}
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover object-[50%_0%]"
        />

        <Collage section="hill" />

        {/* The machine stands on the slope, fully visible, soft contact shadow on the grass. */}
        <div
          data-emitter=""
          className="absolute bottom-[42%] right-[4%] w-[clamp(130px,20vw,300px)] sm:bottom-[30%] sm:right-[7%]"
          style={{ aspectRatio: `${bubbleMachine.width} / ${bubbleMachine.height}` }}
        >
          <div className="contact-shadow absolute -bottom-[7%] left-[0%] h-[18%] w-[100%] [animation:none]" />
          <div className="engine-hum relative h-full w-full">
            <Photo
              photo={bubbleMachine}
              sizes="(max-width: 640px) 130px, 20vw"
              className="h-full w-full object-contain drop-shadow-[0_6px_6px_rgb(10_40_10/0.35)]"
            />
          </div>
        </div>
      </div>

      <BubbleLayer emitter={{ nozzle: bubbleNozzle, angle: bubbleNozzle.angle }} />
    </section>
  );
}
