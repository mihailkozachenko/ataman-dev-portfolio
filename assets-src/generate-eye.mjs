// Generates the eye in the sky cloud: two photos with a transparent background,
// straight-on, so they stack — the white of the eye with its lids (no iris), and
// the iris with its pupil alone (it moves inside the opening in the browser).
//   node assets-src/generate-eye.mjs white   → assets-src/eye/white-<n>.png
//   node assets-src/generate-eye.mjs iris    → assets-src/eye/iris-<n>.png
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
const OUT = join(here, "eye");
mkdirSync(OUT, { recursive: true });

const PROMPTS = {
  white:
    "Photorealistic macro photograph of a single human eye region seen exactly straight-on, the eye calmly open, " +
    "neutral relaxed expression. The almond-shaped eye opening shows ONLY the white of the eye: completely empty, " +
    "NO iris, NO pupil, no coloured ring — a clean, bright, smooth white eyeball with very soft natural shading " +
    "towards the corners, a faint soft shadow under the upper lid, and the light pink of the inner corner. " +
    "Natural upper and lower eyelids with fine, delicate lashes, soft fair skin around the eye, no eyebrow, no makeup. " +
    "The skin fades out smoothly to fully transparent in a soft oval around the eye — no hard cut-out edge. " +
    "Soft diffuse daylight, crisp detail. Isolated, centred, horizontal, transparent background, no text.",
  iris:
    "Photorealistic macro photograph of a human iris with its pupil, seen exactly straight-on: a perfect circle, " +
    "centred, filling most of the image with a small even margin. A soft grey-blue iris with fine natural radial " +
    "fibres, a slightly darker limbal ring at its outer edge, a round black pupil in the middle, one small soft " +
    "catchlight in the upper left. Only the iris disc itself: no white of the eye, no eyelids, no lashes, no skin, " +
    "the edge of the disc soft but clean. Transparent background, no text.",
};
const SIZE = { white: "1536x1024", iris: "1024x1024" };

const cost = (u = {}) => {
  const textIn = u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0;
  const imageIn = u.input_tokens_details?.image_tokens ?? 0;
  return (textIn * PRICE.textIn + imageIn * PRICE.imageIn + (u.output_tokens ?? 0) * PRICE.imageOut) / 1e6;
};

const [kind] = process.argv.slice(2);
if (!PROMPTS[kind]) throw new Error("usage: generate-eye.mjs white | iris");
const res = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model: MODEL,
    prompt: PROMPTS[kind],
    n: 2,
    size: SIZE[kind],
    quality: "high",
    background: "transparent",
    output_format: "png",
  }),
});
const json = await res.json();
if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
const taken = readdirSync(OUT).filter((f) => f.startsWith(kind)).length;
json.data.forEach((d, i) => writeFileSync(join(OUT, `${kind}-${taken + i + 1}.png`), Buffer.from(d.b64_json, "base64")));
const u = json.usage ?? {};
console.log(
  `${kind}: ${json.data.length} images · in ${u.input_tokens} (image ${u.input_tokens_details?.image_tokens ?? 0}), out ${u.output_tokens} · ${MODEL} · $${cost(u).toFixed(4)}`,
);
