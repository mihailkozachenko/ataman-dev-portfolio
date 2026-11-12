import { site } from "../data/site";
import { Container } from "./Container";
import { MissingImage } from "./decor/Collage";
import { DriftBubble } from "./decor/DriftBubble";
import { ErrorWindow } from "./decor/ErrorWindow";
import { ArrowDownIcon, EnvelopeIcon } from "./icons";
import { HeroTitle } from "./letters/HeroTitle";

export function Hero() {
  return (
    <section id="top" data-anim-scope aria-labelledby="hero-title" className="relative">
      {/* A lone soap bubble crossing the low sky, slowly, under the actions. */}
      <DriftBubble />

      <Container className="click-through relative grid grid-cols-1 gap-x-10 pb-24 pt-16 sm:pt-24 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-12 lg:content-center lg:pb-32 lg:pt-16">
        {/* Row 1: the title, and beside it the missing portrait, cut exactly from
            the title's cap line to its baseline. */}
        <div className="min-w-0 lg:col-span-9">
          {/* White on the deepest part of the sky gradient. */}
          <HeroTitle />
        </div>
        {/* Rendering error 1: the portrait that never loaded, and its error message
            (right edge on the portrait's, top just above its lower edge). */}
        <div className="relative hidden text-[length:var(--step-hero)] lg:col-span-3 lg:block lg:py-[0.075em]">
          <MissingImage className="relative h-full w-full" />
          <div className="absolute right-0 top-[calc(100%-2.75rem)] z-10 text-base">
            <ErrorWindow />
          </div>
        </div>

        {/* Row 2: who, what, and the two actions. */}
        <div className="lg:col-span-9">
          <p className="mt-10 text-[length:var(--step-lead)] font-bold text-paper">{site.role}</p>
          <p className="lead mt-2 text-paper">
            I build web applications with AI, authentication and payments. Fast delivery, honest
            prices.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-4">
            <a
              href={site.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="xp-cta"
            >
              <EnvelopeIcon />
              Contact me
              <span className="sr-only"> on Telegram (opens in a new tab)</span>
            </a>
            <a id="hero-next" href="#projects" className="xp-btn">
              Float down <ArrowDownIcon />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
