import { site } from "../data/site";
import { Container } from "./Container";

const LINKS = [
  { href: site.telegram, label: "Telegram" },
  { href: site.whatsapp, label: "WhatsApp" },
];

/**
 * Lies over the lower part of the hill (pulled up with a negative margin).
 * White pixel plates keep the text readable on the photographic grass.
 */
export function Footer() {
  return (
    <footer className="relative z-30 -mt-36 pb-6 sm:-mt-28">
      <Container className="flex flex-wrap items-center justify-between gap-3">
        <p className="plaque plaque-tag plaque-white text-xs sm:text-sm">
          {site.name} — {site.role}
        </p>
        <ul className="flex flex-wrap gap-3">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="plaque plaque-white text-xs sm:text-sm"
              >
                {link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
