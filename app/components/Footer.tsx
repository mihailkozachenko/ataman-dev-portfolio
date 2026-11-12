import { site } from "../data/site";
import { Container } from "./Container";

/**
 * Lies over the lower part of the hill (pulled up with a negative margin).
 * Only the signature: the contacts live in the contact block above.
 */
export function Footer() {
  return (
    <footer className="footer-on-grass relative z-30 -mt-36 pb-6 sm:-mt-28">
      <Container>
        <p className="text-[length:var(--step-small)] font-bold text-paper">
          {site.name}, {site.role}
        </p>
      </Container>
    </footer>
  );
}
