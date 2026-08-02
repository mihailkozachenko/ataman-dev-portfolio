import { ArrowUpRightIcon } from "./icons";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionStamp } from "./SectionStamp";

const PROJECTS = [
  {
    name: "DokliCZ",
    status: "Live",
    description:
      "AI-powered Czech official letter decoder for Russian/Ukrainian speakers. Built with Next.js, Supabase, Stripe, Anthropic API.",
    tags: ["Next.js", "Supabase", "Stripe", "Anthropic API"],
    href: "https://dokli-cz.com",
    label: "dokli-cz.com",
  },
  {
    name: "AI Chat Widget",
    status: "Demo",
    description:
      "Demo of an embeddable AI chat widget for small businesses — dentists, auto shops, cosmetology clinics and similar. Configurable per industry, replies to visitors in their own language. Built to show potential clients what a ready-made AI assistant on their site could look like.",
    tags: ["Next.js", "Anthropic API"],
    href: "https://chat-bot-demo-nu.vercel.app",
    label: "chat-bot-demo-nu.vercel.app",
  },
];

export function Projects() {
  return (
    <section id="projects" className="py-24 sm:py-32">
      <Container>
        <Reveal>
          <SectionStamp>Projects</SectionStamp>
        </Reveal>

        {PROJECTS.map((project, index) => (
          <Reveal key={project.name} delay={100 + index * 100} className="mt-12 sm:mt-16">
            <div className="rounded-[19.2px] border border-almost-white/15 bg-almost-white/[0.03] p-8 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-sans text-2xl font-medium text-almost-white sm:text-[32px]">
                  {project.name}
                </h3>
                <span className="inline-flex items-center gap-2 font-sans text-sm text-steel">
                  <span
                    className={`h-2 w-2 rounded-full ${project.status === "Live" ? "bg-signal-violet" : "bg-[#d6336c]"}`}
                    aria-hidden="true"
                  />
                  {project.status}
                </span>
              </div>

              <p className="mt-4 max-w-2xl font-sans text-base font-light leading-relaxed text-steel sm:text-lg">
                {project.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[6px] border border-almost-white/15 px-3 py-1 font-mono text-xs uppercase tracking-[0.07em] text-graphite"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-1 font-sans text-base text-almost-white underline-offset-4 hover:underline"
              >
                {project.label}
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        ))}
      </Container>
    </section>
  );
}
