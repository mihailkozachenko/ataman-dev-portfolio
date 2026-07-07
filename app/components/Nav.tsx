"use client";

import { useState } from "react";
import { Container } from "./Container";
import { CloseIcon, MenuIcon } from "./icons";

const NAV_LINKS = [
  { href: "#projects", label: "Projects" },
  { href: "#services", label: "Services" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ash/30 bg-[#333248]/70 backdrop-blur-md">
      <Container className="flex items-center justify-between py-4">
        <a href="#top" className="font-sans text-base font-medium tracking-tight text-almost-white">
          Ataman Dev
        </a>

        <nav className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-sans text-xs uppercase tracking-[0.07em] text-steel transition-colors hover:text-almost-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="https://t.me/AtamanApp"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center rounded-[8px] border border-almost-white/70 px-4 py-2 font-sans text-sm text-almost-white transition-colors hover:bg-almost-white hover:text-near-black sm:inline-flex"
        >
          Contact me
        </a>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-[6px] border border-almost-white/20 p-2 text-almost-white sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-ash/30 bg-near-black/95 px-6 py-6 sm:hidden">
          <nav className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-sans text-sm uppercase tracking-[0.07em] text-steel transition-colors hover:text-almost-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://t.me/AtamanApp"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-[8px] border border-almost-white/70 px-4 py-3 font-sans text-sm text-almost-white"
            >
              Contact me
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
