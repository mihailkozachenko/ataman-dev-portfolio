import { site } from "../data/site";
import { ChatPhoneIcon, NewMessageIcon, PaperPlaneIcon } from "./icons";

const LINKS = [
  { href: site.telegram, label: "Telegram", Icon: PaperPlaneIcon },
  { href: site.whatsapp, label: "WhatsApp", Icon: ChatPhoneIcon },
];

/**
 * The closing call to action as an old-desktop window, new_message.exe — one
 * system with the hero's error window and the XP buttons. The caption's
 * minimise / close are drawn only (aria-hidden); the two big green buttons are
 * the real links. Server component: the click sound is delegated (sound.ts).
 */
export function ContactWindow() {
  return (
    <div className="xp-window xp-window-lg">
      <div className="xp-bar">
        <span className="xp-bar-title">
          <NewMessageIcon />
          new_message.exe
        </span>
        <span aria-hidden="true" className="xp-caps">
          <span className="xp-cap">
            <svg viewBox="0 0 10 10" focusable="false">
              <path d="M2 8h5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
            </svg>
          </span>
          <span className="xp-cap xp-cap-close">
            <svg viewBox="0 0 10 10" focusable="false">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
            </svg>
          </span>
        </span>
      </div>
      <div className="xp-window-body">
        <h2
          id="contact-title"
          className="text-display text-display-wrap max-w-[14ch] font-sans text-[clamp(2.25rem,5vw,3.5rem)] text-ink"
        >
          Got a project in mind?
        </h2>
        <p className="mt-4 max-w-[34ch] font-sans text-[length:var(--step-lead)] font-medium leading-snug text-ink-soft">
          Tell me what you need. I&apos;ll get back to you the same day.
        </p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {LINKS.map(({ href, label, Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noopener noreferrer" className="xp-cta xp-cta-lg w-full">
                <Icon />
                {label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
