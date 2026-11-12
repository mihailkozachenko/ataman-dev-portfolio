// Generates the rotary-phone source for the header Contact link (transparent
// background). Run once from the project root: node assets-src/generate-phone.mjs
// Reads OPENAI_API_KEY from .env.local; writes assets-src/phone/phone-<n>.png and
// prints token usage and cost. Not part of the app.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(here, "..", ".env.local"), "utf8");
const key = /^OPENAI_API_KEY=(.*)$/m.exec(env)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error("OPENAI_API_KEY missing in .env.local");

const MODEL = "gpt-image-2.5-flare";
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 }; // $ per 1M tokens, standard tier
const PROMPT =
  "Photorealistic product photograph of a single vintage rotary dial telephone from the 1970s, " +
  "glossy red bakelite body, white numbered rotary dial, the handset resting on top in its cradle, " +
  "curly cord, three-quarter front view, soft studio light, crisp detail. " +
  "Isolated object, fully inside the frame with a margin on every side, no shadow on the ground, " +
  "transparent background, no text, no other objects.";

const res = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model: MODEL,
    prompt: PROMPT,
    n: 2,
    size: "1024x1024",
    quality: "high",
    background: "transparent",
    output_format: "png",
  }),
});
const json = await res.json();
if (!res.ok) throw new Error(json.error?.message ?? String(res.status));
const out = join(here, "phone");
mkdirSync(out, { recursive: true });
json.data.forEach((d, i) => writeFileSync(join(out, `phone-${i + 1}.png`), Buffer.from(d.b64_json, "base64")));
const u = json.usage ?? {};
const textIn = u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0;
const imageIn = u.input_tokens_details?.image_tokens ?? 0;
const cost = (textIn * PRICE.textIn + imageIn * PRICE.imageIn + (u.output_tokens ?? 0) * PRICE.imageOut) / 1e6;
console.log(`${json.data.length} images · in ${u.input_tokens} (text ${textIn}), out ${u.output_tokens} · ${MODEL} · $${cost.toFixed(4)}`);
