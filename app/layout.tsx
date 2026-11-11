import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ataman Dev — AI Web Developer",
  description:
    "I build web applications with AI, authentication and payments. Fast delivery, honest prices.",
  openGraph: {
    title: "Ataman Dev — AI Web Developer",
    description:
      "I build web applications with AI, authentication and payments. Fast delivery, honest prices.",
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
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
