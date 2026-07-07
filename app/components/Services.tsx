import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { ScrambleText } from "./ScrambleText";
import { SectionStamp } from "./SectionStamp";

const SERVICES = [
  "Landing pages",
  "AI web applications",
  "Business card websites",
  "Telegram bots",
  "Online stores",
];

export function Services() {
  return (
    <section id="services" className="py-24 sm:py-32">
      <Container>
        <Reveal>
          <SectionStamp>
            <ScrambleText text="Services" />
          </SectionStamp>
        </Reveal>

        <div className="mt-12 border-t border-almost-white/10 sm:mt-16">
          {SERVICES.map((service, index) => (
            <Reveal key={service} delay={index * 80}>
              <div className="flex items-center gap-6 border-b border-almost-white/10 py-6 sm:py-7">
                <span className="font-mono text-sm text-graphite">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ScrambleText
                  text={service}
                  className="font-sans text-xl font-light text-almost-white sm:text-2xl"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
