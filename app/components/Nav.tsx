import { site } from "../data/site";
import { Container } from "./Container";
import { MotionToggle } from "./MotionToggle";
import { SoundToggle } from "./SoundToggle";

const LINKS = [
  { href: "#projects", label: "Projects", tone: "plaque-lime" },
  { href: "#services", label: "Services", tone: "plaque-lime" },
  { href: "#contact", label: "Contact", tone: "plaque-red" },
];

export function Nav() {
  return (
    <header className="relative z-20">
      <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-6">
        <a href="#top" className="plaque plaque-white text-sm">
          {site.name}
        </a>
        <nav aria-label="Main" className="order-last w-full sm:order-none sm:w-auto">
          <ul className="flex flex-wrap gap-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={`plaque ${link.tone} text-sm`}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex gap-3">
          <MotionToggle />
          <SoundToggle />
        </div>
      </Container>
    </header>
  );
}
