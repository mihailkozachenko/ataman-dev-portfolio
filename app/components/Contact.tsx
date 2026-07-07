import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SendIcon } from "./icons";

export function Contact() {
  return (
    <section id="contact" className="py-24 sm:py-32">
      <Container>
        <Reveal className="flex flex-col items-start gap-8 rounded-[19.2px] border border-almost-white/15 bg-almost-white/[0.03] px-8 py-16 sm:px-16 sm:py-20">
          <h2 className="max-w-2xl font-display text-[32px] italic font-light leading-tight text-lavender-mist sm:text-[48px]">
            Got a project in mind?
          </h2>
          <p className="max-w-xl font-sans text-lg font-light text-steel">
            Tell me what you need — I&apos;ll get back to you on Telegram.
          </p>
          <a
            href="https://t.me/AtamanApp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[1584px] bg-signal-violet px-8 py-4 font-sans text-base font-medium text-near-black transition-opacity hover:opacity-90"
          >
            <SendIcon className="h-4 w-4" />
            Contact me
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
