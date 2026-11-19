import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Variable-weight grotesque. Latin only (covers á/í/é etc. used on the page) and
// no width axis: one small preloaded file instead of ~176 KB, which kept the
// first text paint (LCP) waiting on mobile.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ataman Dev — AI Web Developer",
  description:
    "I automate business processes with AI and build web applications with authentication and payments. Fast delivery, honest prices.",
  openGraph: {
    title: "Ataman Dev — AI Web Developer",
    description:
      "I automate business processes with AI and build web applications with authentication and payments. Fast delivery, honest prices.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3f9cff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
