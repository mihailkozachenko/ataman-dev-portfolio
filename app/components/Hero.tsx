import { site } from "../data/site";
import { Container } from "./Container";
import { ArrowDownIcon } from "./icons";
import { PixelCloud } from "./PixelCloud";

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="checker absolute right-[7%] top-[12%] h-[34%] w-[30%] min-w-[140px]" />
        <div className="checker absolute bottom-[10%] left-[38%] h-14 w-28 sm:h-20 sm:w-44" />
        <PixelCloud
          seed={3}
          className="drift-css absolute -left-[6%] top-[6%] w-[46vw] max-w-[460px] opacity-95"
        />
        <PixelCloud
          seed={17}
          cols={30}
          rows={16}
          className="drift-css-slow absolute right-[2%] top-[40%] w-[34vw] max-w-[360px]"
        />
        <PixelCloud
          seed={29}
          cols={24}
          rows={14}
          className="drift-css absolute bottom-[4%] right-[30%] w-[22vw] max-w-[220px] opacity-90"
        />
      </div>

      <Container className="relative pb-24 pt-14 sm:pb-32 sm:pt-20">
        <p className="plaque plaque-tag plaque-red text-xs sm:text-sm">Available for new projects</p>

        <h1
          id="hero-title"
          className="mt-6 text-[clamp(3.75rem,16vw,13rem)] font-bold uppercase leading-[0.82] tracking-[-0.055em]"
        >
          Ataman
          <br />
          Dev
        </h1>

        <p className="plaque plaque-tag plaque-lime mt-6 text-lg sm:text-2xl">{site.role}</p>

        <p className="mt-8 max-w-xl text-lg font-medium leading-snug text-ink-soft sm:text-2xl">
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
            Float to projects <ArrowDownIcon />
          </a>
        </div>
      </Container>
    </section>
  );
}
