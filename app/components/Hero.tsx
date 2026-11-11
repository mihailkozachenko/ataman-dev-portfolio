import { site } from "../data/site";
import { Container } from "./Container";
import { Collage } from "./decor/Collage";
import { ArrowDownIcon } from "./icons";
import { HeroTitle } from "./letters/HeroTitle";

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative">
      <Collage section="hero" />

      <Container className="relative pb-20 pt-14 sm:pb-28 sm:pt-20">
        {/* White on the deepest part of the sky gradient. */}
        <HeroTitle />

        <p className="plaque plaque-tag plaque-lime mt-6 text-lg sm:text-2xl">{site.role}</p>

        <p className="label-box mt-8 max-w-xl px-4 py-3 text-lg font-medium leading-snug text-ink sm:text-xl">
          I build web applications with AI, authentication and payments. Fast delivery, honest
          prices.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={site.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="plaque plaque-red text-base"
          >
            Contact me
            <span className="sr-only"> on Telegram (opens in a new tab)</span>
          </a>
          <a href="#projects" className="plaque plaque-white text-base">
            Float down <ArrowDownIcon />
          </a>
        </div>
      </Container>
    </section>
  );
}
