"use client";

import { startTransition, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateCloudTexture } from "./cloudTexture";

type LayerConfig = {
  seed: number;
  top: string;
  height: string;
  cellsAcross: number;
  coverage: number;
  softness: number;
  maxAlpha: number;
  tileWidth: number;
  blur: number;
  duration: number;
};

// Ordered back-to-front: farther layers drift slower, sit softer/dimmer and
// hazier; nearer layers move faster, read sharper and sit more opaque —
// the classic parallax depth cue also used for the camera dolly-zoom below.
const LAYERS: LayerConfig[] = [
  {
    seed: 11,
    top: "6%",
    height: "56%",
    cellsAcross: 3,
    coverage: 0.62,
    softness: 0.36,
    maxAlpha: 0.2,
    tileWidth: 1500,
    blur: 44,
    duration: 105,
  },
  {
    seed: 23,
    top: "20%",
    height: "55%",
    cellsAcross: 4,
    coverage: 0.57,
    softness: 0.28,
    maxAlpha: 0.28,
    tileWidth: 1150,
    blur: 32,
    duration: 74,
  },
  {
    seed: 37,
    top: "38%",
    height: "54%",
    cellsAcross: 5,
    coverage: 0.53,
    softness: 0.22,
    maxAlpha: 0.4,
    tileWidth: 860,
    blur: 20,
    duration: 46,
  },
  {
    seed: 51,
    top: "56%",
    height: "50%",
    cellsAcross: 6,
    coverage: 0.48,
    softness: 0.16,
    maxAlpha: 0.55,
    tileWidth: 640,
    blur: 9,
    duration: 26,
  },
];

const TEXTURE_HEIGHT = 320;

function CloudLayer({ layer, image }: { layer: LayerConfig; image: string }) {
  if (!image) return null;
  return (
    <motion.div
      className="absolute inset-x-0 will-change-transform"
      style={{
        top: layer.top,
        height: layer.height,
        backgroundImage: `url(${image})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: `${layer.tileWidth}px ${TEXTURE_HEIGHT}px`,
        backgroundPosition: "0px 0px",
        filter: `blur(${layer.blur}px)`,
      }}
      animate={{ backgroundPositionX: [0, -layer.tileWidth] }}
      transition={{ duration: layer.duration, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function CloudScene() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const generated = LAYERS.map((layer) =>
      generateCloudTexture({
        seed: layer.seed,
        width: Math.round(layer.tileWidth / 2),
        height: TEXTURE_HEIGHT,
        cellsAcross: layer.cellsAcross,
        coverage: layer.coverage,
        softness: layer.softness,
        maxAlpha: layer.maxAlpha,
      })
    );
    startTransition(() => setImages(generated));
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-near-black">
      {/* Night-sky vertical gradient: dark aloft, soft violet glow near the horizon */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-near-black) 0%, #150a24 45%, #1d0f33 75%, var(--color-near-black) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-40"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 100%, var(--color-signal-violet) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-2/5 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, var(--color-almost-white) 50%, transparent 100%), radial-gradient(1px 1px at 65% 15%, var(--color-almost-white) 50%, transparent 100%), radial-gradient(1.5px 1.5px at 85% 45%, var(--color-lavender-mist) 50%, transparent 100%), radial-gradient(1px 1px at 40% 60%, var(--color-almost-white) 50%, transparent 100%), radial-gradient(1px 1px at 10% 75%, var(--color-lavender-mist) 50%, transparent 100%)",
          backgroundSize: "220px 220px",
          mixBlendMode: "screen",
        }}
      />

      <motion.div
        className="absolute inset-0 will-change-transform"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      >
        {LAYERS.map((layer, i) => (
          <CloudLayer key={layer.seed} layer={layer} image={images[i]} />
        ))}
      </motion.div>

      {/* Legibility scrim: keeps the headline/copy readable over the cloud texture */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, var(--color-near-black) 0%, rgba(9,9,9,0.72) 26%, rgba(9,9,9,0.32) 46%, transparent 64%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: "linear-gradient(to top, var(--color-near-black) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
