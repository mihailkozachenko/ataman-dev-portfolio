import { site } from "../data/site";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-paper">
      <Container className="flex flex-col gap-4 py-6 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
        <span className="uppercase tracking-wide">
          {site.name} — {site.role}
        </span>
        <a
          href={site.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-2 underline-offset-4 hover:decoration-plaque-red"
        >
          Telegram<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Container>
    </footer>
  );
}
