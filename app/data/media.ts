// All photographic assets live in /public/media, generated from /assets-src by
// assets-src/process-media.cjs (untouched originals: /assets-src/_originals).

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

/**
 * The door standing on the hill (contact): a white panelled interior door in a
 * white casing — the casing with an empty opening and the leaf apart, generated
 * straight-on (assets-src/generate-door.mjs), cropped tight to their alpha — and
 * the world seen through it: another part of the original field photo, with a
 * deeper sky (process-media door).
 */
export const door = {
  frame: { src: "/media/door-frame.webp", width: 316, height: 640 } as Photo,
  leaf: { src: "/media/door-leaf.webp", width: 266, height: 640 } as Photo,
  portal: { src: "/media/door-portal.webp", width: 781, height: 1201 } as Photo,
  /** The empty opening inside the casing, % of the casing box (measured by process-media door). */
  opening: { left: 11.71, top: 6.09, width: 76.58, height: 93.91 },
};

/**
 * Where the door stands in the hill box: x = its centre, base = where its foot
 * meets the grass (% of the hill's width / height). Below the crest, on the
 * field in front: a little in front of the horizon, like the reference.
 * Desktop: between the contact window and the bubble machine; phones: left of
 * the machine, under the window.
 */
export const doorSpot = {
  desktop: { x: 62, base: 40 },
  mobile: { x: 30, base: 46 },
};

/** The header's Contact link: a generated rotary phone (process-media phone). */
export const phone: Photo = { src: "/media/phone.webp", width: 192, height: 147 };

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

/** Smoke puffs for the particle system (soft, feathered to zero on every side). */
export const smokePuffs: string[] = [1, 2, 3, 4, 5, 6].map((n) => `/media/smoke-puff-${n}.webp`);

/** Emitters as a fraction of the machine image box (x from left, y from top). */
// Fog: centre of the octagonal outlet on the right end of the blue housing.
export const fogNozzle = { x: 0.975, y: 0.37 };
// Bubbles: the mouth of the machine — the open front between the tray lip and
// the lid, where the wand wheels turn (bubble-machine-2: ~ (415, 160) of 900 × 795).
export const bubbleNozzle = { x: 0.46, y: 0.2, angle: -100 };

/**
 * The eye in a sky cloud (generate-eye.mjs → process-media eye): the white with
 * its lids (skin feathered into cloud), the opening between the lids as a mask
 * (it clips the iris and the blink), and the iris on its own.
 */
export const eye = {
  white: { src: "/media/eye-white.webp", width: 480, height: 338 } as Photo,
  opening: "/media/eye-opening.webp",
  iris: { src: "/media/eye-iris.webp", width: 196, height: 200 } as Photo,
  /** The opening, % of the eye box (measured by process-media eye). */
  box: { left: 32.9, top: 29.2, width: 37, height: 37.4 },
};

/**
 * projects.wmv: the still on the player's screen, and the little windows it
 * throws out — one screenshot each (16:10 frames, process-media wmp), titled
 * with a file name. Listed in throw order: the last one lands on top of the
 * pile. `phone`: one of the few thrown on phones.
 */
export const wmpStill = { src: "/media/wmp/ukol-home.webp", project: 0, alt: "UKOL — home page" };
export type WmpShot = { src: string; file: string; project: number; alt: string; phone?: boolean };
export const wmpShots: WmpShot[] = [
  { src: "/media/wmp/chat-widget.webp", file: "chat_widget.png", project: 2, alt: "AI Chat Widget — a demo chat", phone: true },
  { src: "/media/wmp/dokli-home.webp", file: "doklicz.png", project: 1, alt: "DokliCZ — upload an official letter", phone: true },
  { src: "/media/wmp/ukol-home.webp", file: "ukol_site.png", project: 0, alt: "UKOL — home page" },
  { src: "/media/wmp/ukol-app-prices.webp", file: "ukol_prices.png", project: 0, alt: "UKOL app — the price list" },
  { src: "/media/wmp/ukol-app-dictate.webp", file: "ukol_dictate.png", project: 0, alt: "UKOL app — dictate the job" },
  { src: "/media/wmp/ukol-title.webp", file: "ukol_logo.png", project: 0, alt: "UKOL logo", phone: true },
  { src: "/media/wmp/ukol-app-quote.webp", file: "ukol_quote.png", project: 0, alt: "UKOL app — the quote, ready to send", phone: true },
];

/**
 * The winged eye in the sky (generate-angel.mjs → process-media angel): one
 * wing (the right one is its mirror), the studded ring, and the eye — the
 * white with its lids, the opening between them as a mask, and the iris on its
 * own (the small eyes on the ring are the same eye, smaller).
 */
export const angel = {
  wing: { src: "/media/angel-wing.webp", width: 560, height: 534 } as Photo,
  ring: { src: "/media/angel-ring.webp", width: 513, height: 520 } as Photo,
  white: { src: "/media/angel-eye-white.webp", width: 300, height: 150 } as Photo,
  opening: "/media/angel-eye-opening.webp",
  /** The same eye with its lids closed (an edit of that photo, the same outline): the blink. */
  closed: { src: "/media/angel-eye-closed.webp", width: 300, height: 150 } as Photo,
  iris: { src: "/media/angel-iris.webp", width: 155, height: 160 } as Photo,
  /** The opening, % of the eye box (measured by process-media angel). */
  box: { left: 19.8, top: 13.6, width: 58.2, height: 62.8 },
};
