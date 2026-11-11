import { site } from "../data/site";
import { Container } from "./Container";
import { PixelCloud } from "./PixelCloud";

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="checker absolute right-[4%] top-[10%] h-[55%] w-[38%]" />
        <PixelCloud
          seed={41}
          className="drift-css-slow absolute -right-[4%] bottom-[2%] w-[40vw] max-w-[420px]"
        />
      </div>

      <Container className="relative">
        <div className="max-w-3xl border-2 border-ink bg-paper p-8 shadow-[8px_8px_0_var(--ink)] sm:p-14">
          <p className="plaque plaque-tag plaque-lime text-xs">03 · Signal</p>
          <h2
            id="contact-title"
            className="mt-6 text-[clamp(2.5rem,8vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.04em]"
          >
            Got a project in mind?
          </h2>
          <p className="mt-6 max-w-xl text-lg font-medium text-ink-soft sm:text-xl">
            Tell me what you need — I&apos;ll get back to you on Telegram.
          </p>
          <a
            href={site.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="plaque plaque-red mt-8 text-base"
          >
            Message me on Telegram
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </Container>
    </section>
  );
}
