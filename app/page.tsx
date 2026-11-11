import { BubbleSection } from "./components/bubbles/BubbleSection";
import { Contact } from "./components/Contact";
import { FogSection } from "./components/fog/FogSection";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Nav } from "./components/Nav";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="plaque plaque-lime sr-only text-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <FogSection />
        <BubbleSection />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
