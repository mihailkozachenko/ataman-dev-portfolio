// All photographic assets live in /public/media (prepared from /public/media/_originals).

export type Photo = { src: string; width: number; height: number };
export type Anim = Photo & { /** Single frame used for reduced motion / paused / off-screen. */ still: string };

export const fogMachine: Photo = { src: "/media/fog-machine.webp", width: 575, height: 384 };
export const bubbleMachine: Photo = { src: "/media/bubble-machine-2.webp", width: 900, height: 795 };
export const grass: Photo = { src: "/media/grass.webp", width: 2560, height: 746 };

export type CloudPhoto = Photo & {
  /** Centre of the densest white part of the cloud (% of the image box) — where text goes. */
  text: { x: number; y: number };
};

export const clouds: CloudPhoto[] = [
  { src: "/media/cloud-1.webp", width: 1024, height: 467, text: { x: 54, y: 41 } },
  { src: "/media/cloud-2.webp", width: 974, height: 491, text: { x: 49, y: 43 } },
];

export const bubbles: Photo[] = [
  { src: "/media/bubble-1.webp", width: 640, height: 620 },
  { src: "/media/bubble-2.webp", width: 640, height: 630 },
  { src: "/media/bubble-3.webp", width: 639, height: 640 },
  { src: "/media/bubble-4.webp", width: 640, height: 633 },
];

export const cloudAnim: Anim = {
  src: "/media/cloud-anim-1.webp",
  still: "/media/cloud-anim-1-still.webp",
  width: 400,
  height: 400,
};
/** Vertical plume, base at the bottom centre. */
export const smokePlume: Anim = {
  src: "/media/smoke-anim-1.webp",
  still: "/media/smoke-anim-1-still.webp",
  width: 480,
  height: 360,
};
/** The same plume started from frames 19 and 38: instances billow out of sync. */
export const smokePlumeB: Anim = {
  src: "/media/smoke-anim-1b.webp",
  still: "/media/smoke-anim-1b-still.webp",
  width: 480,
  height: 360,
};
export const smokePlumeC: Anim = {
  src: "/media/smoke-anim-1c.webp",
  still: "/media/smoke-anim-1c-still.webp",
  width: 480,
  height: 360,
};

/** Emitters as a fraction of the machine image box (x from left, y from top). */
// Fog: centre of the octagonal outlet on the right end of the blue housing.
export const fogNozzle = { x: 0.975, y: 0.37 };
// Bubbles: the wand tray at the top-left of the machine.
export const bubbleNozzle = { x: 0.33, y: 0.2, angle: -112 };
