import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-almost-white/10">
      <Container className="flex flex-col gap-4 py-8 font-sans text-sm text-ash sm:flex-row sm:items-center sm:justify-between">
        <span>
          Ataman Dev <span className="text-graphite">— AI Web Developer</span>
        </span>
        <a
          href="https://t.me/AtamanApp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ash transition-colors hover:text-almost-white"
        >
          Telegram
        </a>
      </Container>
    </footer>
  );
}
