import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${lora.variable}`}
    >
      <body className="min-h-full bg-near-black text-almost-white antialiased">
        {children}
      </body>
    </html>
  );
}
