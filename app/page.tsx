import { AreYouReal } from "./components/decor/AreYouReal";
import { BubbleSection } from "./components/bubbles/BubbleSection";
import { BubbleCursor } from "./components/experience/BubbleCursor";
import { FogSection } from "./components/fog/FogSection";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { MotionDirector } from "./components/MotionDirector";
import { Nav } from "./components/Nav";
import { SkyDecor } from "./components/sky/SkyDecor";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="xp-btn sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      {/* Vertical descent: sky → clouds → grass. Cloud layers span the whole page. */}
      <div className="relative overflow-x-clip">
        <SkyDecor />
        <div className="relative">
          <Nav />
          <main id="main">
            <Hero />
            <AreYouReal />
            <FogSection />
            <BubbleSection />
          </main>
          <Footer />
        </div>
      </div>
      <MotionDirector />
      <BubbleCursor />
      {/* Static film grain over the whole page. */}
      <div aria-hidden="true" className="film-grain" />
    </>
  );
}
