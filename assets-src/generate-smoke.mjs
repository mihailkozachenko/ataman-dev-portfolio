// Generates the smoke sprite sources (white smoke on pure black) with the OpenAI
// Images API. Run once from the project root: node assets-src/generate-smoke.mjs
// Reads OPENAI_API_KEY from .env.local. Writes assets-src/smoke/smoke-<n>.png and
// prints token usage and cost. Not part of the app.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(here, "..", ".env.local"), "utf8");
const key = /^OPENAI_API_KEY=(.*)$/m.exec(env)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) throw new Error("OPENAI_API_KEY missing in .env.local");

const MODEL = "gpt-image-2.5-flare";
// $ per 1M tokens (developers.openai.com/api/docs/pricing, standard tier).
const PRICE = { textIn: 5, imageIn: 8, imageOut: 30 };

const BASE =
  "Photorealistic studio photograph of a single isolated mass of thick white smoke, " +
  "soft volumetric light from above, fine turbulent detail, realistic. " +
  "The smoke is fully contained inside the frame with a wide empty margin on every side, nothing touches the edges. " +
  "Pure solid black background (#000000), no gradient, no vignette, no floor, no objects, no text, no colour.";
const VARIANTS = [
  "A round, dense, billowing puff, like a cauliflower-shaped cumulus of smoke.",
  "A wide, low, rolling bank of smoke, wider than tall, soft lumpy top edge.",
  "A cluster of five or six small overlapping round puffs of smoke.",
  "A tall rising column of smoke that curls over at the top into a soft mushroom.",
  "A thin, wispy, torn veil of smoke with soft curling tendrils, semi-transparent.",
  "A heavy dense ball of smoke with deep shadowed folds and bright rim light.",
];

const out = join(here, "smoke");
mkdirSync(out, { recursive: true });

const results = await Promise.all(
  VARIANTS.map(async (v, i) => {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${BASE} ${v}`,
        n: 1,
        size: "1024x1024",
        quality: "high",
        background: "opaque",
        output_format: "png",
      }),
    });
    const json = await res.json();
    if (!res.ok) return { i, error: json.error?.message ?? res.status };
    writeFileSync(join(out, `smoke-${i + 1}.png`), Buffer.from(json.data[0].b64_json, "base64"));
    return { i, usage: json.usage };
  }),
);

let cost = 0;
for (const r of results) {
  if (r.error) {
    console.log(`smoke-${r.i + 1}: ERROR ${r.error}`);
    continue;
  }
  const u = r.usage ?? {};
  const textIn = u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0;
  const imageIn = u.input_tokens_details?.image_tokens ?? 0;
  const c = (textIn * PRICE.textIn + imageIn * PRICE.imageIn + (u.output_tokens ?? 0) * PRICE.imageOut) / 1e6;
  cost += c;
  console.log(`smoke-${r.i + 1}: in ${u.input_tokens} (text ${textIn}), out ${u.output_tokens} → $${c.toFixed(4)}`);
}
console.log(`model ${MODEL} · total $${cost.toFixed(4)}`);
