import type { ReactNode } from "react";

// Pixel-style icons drawn on an 8×8 grid. Inline SVG instead of Unicode glyphs
// (↗ ↓ ▶ ❚❚): those aren't in Arial/Helvetica, and each one makes the browser
// scan system fonts for a fallback during the first layout.

type IconProps = {
  className?: string;
};

function PixelIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 8 8"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className ?? "h-[0.8em] w-[0.8em]"}
    >
      <path d={d} />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M2 1h5v5H6V3H5v1H4v1H3v1H2v1H1V6h1V5h1V4h1V3h1V2H2z" />;
}

export function ArrowDownIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M3 0h2v4h2v1H6v1H5v1H3V6H2V5H1V4h2z" />;
}

export function PauseIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M1 1h2v6H1zM5 1h2v6H5z" />;
}

export function PlayIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z" />;
}

export function SoundOnIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M1 3h2l2-2h1v6H5L3 5H1zM7 2h1v1H7zM7 5h1v1H7zM7 3.5h1v1H7z" />;
}

export function SoundOffIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M1 3h2l2-2h1v6H5L3 5H1zM6.5 2.5h1v1h-1zM6.5 4.5h1v1h-1z" />;
}

export function StopIcon({ className }: IconProps) {
  return <PixelIcon className={className} d="M1 1h6v6H1z" />;
}

/* ---------- XP-style button icons: small, rounded, drawn in currentColor ---------- */

function LineIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

/** A sealed envelope (the hero's "Contact me"). */
export function EnvelopeIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" fill="currentColor" fillOpacity="0.18" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </LineIcon>
  );
}

/** A paper plane (Telegram). */
export function PaperPlaneIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M21.5 3L2.5 10.6l7 2.6 2.6 7.3L21.5 3z" fill="currentColor" fillOpacity="0.18" />
      <path d="M9.5 13.2L21.5 3" />
    </LineIcon>
  );
}

/** A speech balloon with a handset in it (WhatsApp). */
export function ChatPhoneIcon({ className }: IconProps) {
  return (
    <LineIcon className={className}>
      <path d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L2.8 21.2l4.6-1.3A9.2 9.2 0 1 0 12 2.8z" fill="currentColor" fillOpacity="0.18" />
      <path
        d="M9.2 8.2c.4-.4.9-.3 1.1.1l.7 1.4c.2.4 0 .8-.3 1.1l-.4.4c.5 1.1 1.4 2 2.5 2.5l.4-.4c.3-.3.7-.5 1.1-.3l1.4.7c.4.2.5.7.1 1.1l-.6.6c-.6.6-1.6.7-2.4.3a8.6 8.6 0 0 1-4-4c-.4-.8-.3-1.8.3-2.4z"
        fill="currentColor"
        stroke="none"
      />
    </LineIcon>
  );
}

/** An envelope on a page — the contact window's caption icon. */
export function NewMessageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false" className={className}>
      <rect x="1.5" y="3.5" width="15" height="11" rx="1.5" fill="#fffbe8" stroke="#8a6d1f" />
      <path d="M2 4.5l7 5.2 7-5.2" fill="none" stroke="#8a6d1f" strokeWidth="1.2" />
      <circle cx="14.5" cy="4" r="3" fill="#f2b632" stroke="#9b6a07" strokeWidth="0.8" />
    </svg>
  );
}
