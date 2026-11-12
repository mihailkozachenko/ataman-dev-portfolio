import { site } from "../data/site";
import { Container } from "./Container";
import { FlyLink } from "./FlyLink";
import { MotionToggle } from "./MotionToggle";
import { PhoneLink } from "./PhoneLink";
import { SoundToggle } from "./SoundToggle";

const LINKS = [
  { href: "#projects", label: "Projects", headingId: "projects-title" },
  { href: "#services", label: "Services", headingId: "services-title" },
];

/**
 * Wordmark, two text links (their word flies to its section's heading), the
 * Contact link as an old rotary phone, two small icon toggles.
 * Phones: wordmark + toggles on the first row, the links on the second.
 */
export function Nav() {
  return (
    <header className="relative z-20">
      <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 pt-6">
        <a href="#top" className="text-link text-display text-[1.375rem] tracking-[-0.03em]">
          {site.name}
        </a>
        <nav aria-label="Main" className="order-last w-full sm:order-none sm:ml-auto sm:w-auto">
          <ul className="flex items-center gap-x-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <FlyLink href={link.href} headingId={link.headingId} className="text-link">
                  {link.label}
                </FlyLink>
              </li>
            ))}
            <li className="ml-auto sm:ml-0">
              <PhoneLink />
            </li>
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
