// Generates the parts of the winged eye ("angel") in the sky, each on a
// transparent background, straight-on, so they stack in the browser:
//   wing   → one white feathered wing, its root on the right (the right wing is its mirror)
//   ring   → the white ring studded with small silver beads (empty middle)
//   white  → the eye (big one in the middle, small ones round the ring): the white with its lids, no iris
//   iris   → the central iris with its pupil, alone
//   closed → the same eye (white-2) with its lids closed: an edit of that very photo, so
//            it lines up with it pixel for pixel (the blink reveals it over the open eye)
//   node assets-src/generate-angel.mjs <part>   → assets-src/angel/<part>-<n>.png
// Reads OPENAI_API_KEY from .env.local; prints token usage and cost. Not part of the app.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(here, "..", ".env.local"), "utf8");
const key = /^OPENAI_API_KEY=(.*)$/m.exec(env)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error("OPENAI_API_KEY missing in .env.local");

const MODEL = "gpt-image-2.5-flare";
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 }; // $ per 1M tokens, standard tier
const OUT = join(here, "angel");
mkdirSync(OUT, { recursive: true });

const CUT = "Isolated cut-out for a collage, transparent background, no shadow, no text, no frame.";
const PROMPTS = {
  wing:
    "Photograph of a single large white angel wing made of real soft white feathers, fully spread, seen straight-on " +
    "from the front. The wing's root (where it would attach to a body) is at the RIGHT edge, middle height; from " +
    "there the wing's upper edge (the wrist) arches up and out to the LEFT, and long layered flight feathers hang " +
    "down from it in three or four overlapping tiers, their rounded tips fanning down and to the left, the lowest " +
    "tier reaching well below the root. Fluffy, slightly translucent feather edges, pure white with soft cool " +
    "light-grey shading between the tiers, airy and fluffy like a classic angel wing photo. " + CUT,
  ring:
    "A perfectly circular, thin, flat ring seen exactly straight-on, like a halo or a bracelet lying flat towards " +
    "the camera: a smooth glossy white porcelain band studded all the way round with fourteen small evenly spaced " +
    "polished silver metal ball rivets. The middle of the ring is completely EMPTY (transparent), the ring fills the " +
    "image with a small margin, its band thin (about one tenth of the radius). Crisp product photo, soft daylight. " + CUT,
  white:
    "Photorealistic macro photograph of a single human eye region seen exactly straight-on, the eye calmly open, " +
    "neutral expression. The almond-shaped eye opening shows ONLY the white of the eye: completely empty, NO iris, " +
    "NO pupil, no coloured ring — a clean, bright, smooth white eyeball with very soft shading towards the corners, " +
    "a faint soft shadow under the upper lid, and the pink inner corner. Natural upper and lower eyelids with dark " +
    "defined lashes, a narrow margin of fair skin around the eye, no eyebrow. The skin is cut out in a clean smooth " +
    "almond / lens shape with a crisp edge, like an eye cut out of a magazine for a collage. Horizontal, centred. " + CUT,
  iris:
    "Photorealistic macro photograph of a human iris with its pupil, seen exactly straight-on: a perfect circle, " +
    "centred, filling most of the image with a small even margin. A light sky-blue iris with fine natural radial " +
    "fibres and a few paler flecks, a darker blue-grey limbal ring at its outer edge, a round black pupil in the " +
    "middle, one small soft catchlight in the upper left. Only the iris disc itself: no white of the eye, no eyelids, " +
    "no lashes, no skin, the edge of the disc soft but clean. " + CUT,
};
// Edits: made from one of the parts above, kept in its framing.
const EDITS = {
  closed: {
    from: "white-2.png",
    prompt:
      "Edit this exact photo: the same eye, now gently CLOSED, as in the middle of a blink. The upper eyelid has " +
      "come all the way down over the eyeball and rests on the lower lid; the closed lid line is a soft downward " +
      "curve slightly below the middle of where the eye opening was, with the upper lashes now pointing down along " +
      "it. No white of the eye, no iris visible. Keep EVERYTHING else identical: the same framing, size and position, " +
      "the same almond-shaped cut-out outline and its crisp edge, the same skin tone, texture and lighting, the same " +
      "transparent background.",
  },
};
const SIZE = { wing: "1024x1024", ring: "1024x1024", white: "1536x1024", iris: "1024x1024" };

const cost = (u = {}) => {
  const textIn = u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0;
  const imageIn = u.input_tokens_details?.image_tokens ?? 0;
  return (textIn * PRICE.textIn + imageIn * PRICE.imageIn + (u.output_tokens ?? 0) * PRICE.imageOut) / 1e6;
};

const [kind, n = "2"] = process.argv.slice(2);
if (!PROMPTS[kind] && !EDITS[kind])
  throw new Error(`usage: generate-angel.mjs ${[...Object.keys(PROMPTS), ...Object.keys(EDITS)].join(" | ")} [n]`);
let res;
if (EDITS[kind]) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", EDITS[kind].prompt);
  form.append("image", new Blob([readFileSync(join(OUT, EDITS[kind].from))], { type: "image/png" }), EDITS[kind].from);
  form.append("n", String(+n));
  form.append("size", "1536x1024");
  form.append("quality", "high");
  form.append("background", "transparent");
  form.append("output_format", "png");
  res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
} else {
  res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      prompt: PROMPTS[kind],
      n: +n,
      size: SIZE[kind],
      quality: "high",
      background: "transparent",
      output_format: "png",
    }),
  });
}
const json = await res.json();
if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
const taken = readdirSync(OUT).filter((f) => f.startsWith(`${kind}-`)).length;
json.data.forEach((d, i) => writeFileSync(join(OUT, `${kind}-${taken + i + 1}.png`), Buffer.from(d.b64_json, "base64")));
const u = json.usage ?? {};
console.log(
  `${kind}: ${json.data.length} images · in ${u.input_tokens} (image ${u.input_tokens_details?.image_tokens ?? 0}), out ${u.output_tokens} · ${MODEL} · $${cost(u).toFixed(4)}`,
);
