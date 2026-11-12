// Generates the door on the hill (contact): two matching photos with a
// transparent background, straight-on (so the leaf fits its opening exactly at
// every angle it swings to). A white panelled interior door with a white casing.
//   node assets-src/generate-door.mjs frame          → assets-src/door/frame-<n>.png
//   node assets-src/generate-door.mjs leaf frame-1   → assets-src/door/leaf-<n>.png
//     (the leaf is an edit of the chosen frame, so wood, paint, light and the
//     opening's proportions match)
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
const OUT = join(here, "door");
mkdirSync(OUT, { recursive: true });

const FRAME =
  "Photorealistic photograph of a lone white interior door frame: a modern white-painted wooden door frame " +
  "with a flat white casing (architrave) around it — a head casing and two side casings of the same simple " +
  "flat profile — and nothing else. Clean smooth satin white paint, like a new apartment interior door. " +
  "Straight-on frontal view, camera centred at the middle of the opening, the frame plane exactly parallel " +
  "to the image plane, perfectly symmetric, vertical lines vertical. " +
  "The opening inside the frame is completely EMPTY: no door, no wall, no room, no light — fully transparent " +
  "like the background. No threshold, no floor, no ground, no shadow. " +
  "Bright soft daylight, crisp detail. " +
  "Isolated object, fully inside the image with a clear margin on every side, transparent background, no text.";

const LEAF =
  "The reference image is a modern white interior door frame with a flat white casing, seen straight-on, " +
  "with an empty opening. Generate ONLY the matching door leaf that fits exactly into that opening: the same " +
  "width-to-height proportions as the opening, the same smooth satin white paint and bright soft daylight, " +
  "the same straight-on frontal view (the leaf plane parallel to the image plane). " +
  "A modern white panelled interior door: one tall raised rectangular panel in the upper part and one short " +
  "raised rectangular panel near the bottom, a slim brushed-silver lever handle on the RIGHT side at mid height, " +
  "hinges on the LEFT edge. " +
  "The leaf alone as a clean upright rectangle, centred, filling most of the image height with a small margin: " +
  "no frame, no wall, no floor, no shadow, transparent background, no text.";

const cost = (u = {}) => {
  const textIn = u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0;
  const imageIn = u.input_tokens_details?.image_tokens ?? 0;
  return (textIn * PRICE.textIn + imageIn * PRICE.imageIn + (u.output_tokens ?? 0) * PRICE.imageOut) / 1e6;
};

const [step, ref] = process.argv.slice(2);
let res;
if (step === "frame") {
  res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      prompt: FRAME,
      n: 2,
      size: "1024x1536",
      quality: "high",
      background: "transparent",
      output_format: "png",
    }),
  });
} else if (step === "leaf" && ref) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", LEAF);
  form.append("n", "2");
  form.append("size", "1024x1536");
  form.append("quality", "high");
  form.append("background", "transparent");
  form.append("output_format", "png");
  form.append("image[]", new Blob([readFileSync(join(OUT, `${ref}.png`))], { type: "image/png" }), `${ref}.png`);
  res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
} else {
  throw new Error("usage: generate-door.mjs frame | leaf <frame-name>");
}
const json = await res.json();
if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
const kind = step === "frame" ? "frame" : "leaf";
const taken = readdirSync(OUT).filter((f) => f.startsWith(kind)).length;
json.data.forEach((d, i) => writeFileSync(join(OUT, `${kind}-${taken + i + 1}.png`), Buffer.from(d.b64_json, "base64")));
const u = json.usage ?? {};
console.log(
  `${kind}: ${json.data.length} images · in ${u.input_tokens} (image ${u.input_tokens_details?.image_tokens ?? 0}), out ${u.output_tokens} · ${MODEL} · $${cost(u).toFixed(4)}`,
);
