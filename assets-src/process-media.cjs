// Builds public/media/*.webp from the sources in this folder.
// Run from the project root: node assets-src/process-media.cjs [bubbles|machines|clouds|grass|anims]
// Not part of the app: assets-src/ is outside public/ and is never deployed.
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const SRC = __dirname;
const OUT = path.join(__dirname, "..", "public", "media");
const ONLY = process.argv[2];
const p = (f) => path.join(SRC, f);
const q = (f) => path.join(OUT, f);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const report = [];

async function raw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}
async function saveWebp(img, out, { maxSide, quality = 82, trim = true, trimAlpha = 6 } = {}) {
  let s = sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } });
  if (trim) {
    // Crop to the alpha bounding box with a small margin.
    let x0 = img.w, y0 = img.h, x1 = 0, y1 = 0;
    for (let y = 0; y < img.h; y++)
      for (let x = 0; x < img.w; x++)
        if (img.data[(y * img.w + x) * 4 + 3] > trimAlpha) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    const m = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02) + 2;
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m);
    x1 = Math.min(img.w - 1, x1 + m); y1 = Math.min(img.h - 1, y1 + m);
    s = sharp(await s.extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer());
  }
  if (maxSide) s = s.resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true });
  await s.webp({ quality, alphaQuality: 90, effort: 6 }).toFile(q(out));
  const meta = await sharp(q(out)).metadata();
  report.push(`${out.padEnd(22)} ${meta.width}x${meta.height}  ${(fs.statSync(q(out)).size / 1024).toFixed(0)} KB`);
}

/* Separable box blur on a Float32 single channel. */
function blur(ch, w, h, r) {
  const tmp = new Float32Array(ch.length);
  const out = new Float32Array(ch.length);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += ch[y * w + clamp(x + k, 0, w - 1)];
      tmp[y * w + x] = s / n;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[clamp(y + k, 0, h - 1) * w + x];
      out[y * w + x] = s / n;
    }
  return out;
}
function erode(ch, w, h, r) {
  const out = new Float32Array(ch.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let m = 1;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const v = ch[clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)];
          if (v < m) m = v;
        }
      out[y * w + x] = m;
    }
  return out;
}

/* ---------- soap bubbles on black: alpha from brightness ---------- */
async function bubble(src, out) {
  const img = await raw(p(src));
  const d = img.data;
  const floor = 10; // JPEG noise in the black background
  for (let i = 0; i < d.length; i += 4) {
    const m = Math.max(d[i], d[i + 1], d[i + 2]);
    const a = clamp((m - floor) / (255 - floor), 0, 1);
    if (a <= 0) {
      d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
      continue;
    }
    // Un-premultiply from black: observed = colour × alpha.
    const k = 255 / Math.max(m, 1);
    d[i] = clamp(d[i] * k, 0, 255);
    d[i + 1] = clamp(d[i + 1] * k, 0, 255);
    d[i + 2] = clamp(d[i + 2] * k, 0, 255);
    // Boosted so rims and highlights still read on a pale sky.
    d[i + 3] = Math.round(clamp(Math.pow(a, 0.7) * 1.35, 0, 1) * 255);
  }
  await saveWebp(img, out, { maxSide: 640, quality: 85, trimAlpha: 140 });
}

/* ---------- product shots on white: edge-aware flood fill ---------- */
async function machine(src, out, { white = 228, grad = 14, floor = null } = {}) {
  const img = await raw(p(src));
  const { data: d, w, h } = img;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  const g = (x, y) => gray[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)];
  const bgLike = (minWhite, maxGrad) => (x, y) => {
    const i = (y * w + x) * 4;
    const mn = Math.min(d[i], d[i + 1], d[i + 2]);
    const mx = Math.max(d[i], d[i + 1], d[i + 2]);
    if (mn < minWhite || mx - mn > 22) return false;
    const gx = g(x + 1, y) - g(x - 1, y);
    const gy = g(x, y + 1) - g(x, y - 1);
    return Math.hypot(gx, gy) < maxGrad; // object outlines act as a barrier
  };
  const bg = new Uint8Array(w * h);
  const fill = (seeds, test, yMin = 0) => {
    const q = seeds;
    while (q.length) {
      const y = q.pop(), x = q.pop();
      const k = y * w + x;
      if (y < yMin || (bg[k] && !q.reseed) || !test(x, y)) continue;
      bg[k] = 2;
      if (x > 0 && bg[k - 1] !== 2) q.push(x - 1, y);
      if (x < w - 1 && bg[k + 1] !== 2) q.push(x + 1, y);
      if (y > 0 && bg[k - w] !== 2) q.push(x, y - 1);
      if (y < h - 1 && bg[k + w] !== 2) q.push(x, y + 1);
    }
  };
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, 0, x, h - 1);
  for (let y = 0; y < h; y++) border.push(0, y, w - 1, y);
  fill(border, bgLike(white, grad));
  if (floor) {
    // Second pass for the floor shadow: greyer and smooth, only in the bottom band,
    // grown from background already found there.
    const yMin = Math.round(h * floor.fromY);
    const seeds = [];
    for (let y = yMin; y < h; y++) for (let x = 0; x < w; x++) if (bg[y * w + x]) seeds.push(x, y);
    for (let k = 0; k < w * h; k++) if (bg[k]) bg[k] = 1; // allow re-visiting from seeds
    seeds.reseed = true;
    fill(seeds, bgLike(floor.white, floor.grad), yMin);
  }
  let fg = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) fg[k] = bg[k] ? 0 : 1;
  fg = erode(fg, w, h, 1); // drop the 1-px light rim left by the fill
  const a = blur(fg, w, h, 1); // soft edge
  for (let k = 0; k < w * h; k++) {
    const i = k * 4;
    const al = a[k];
    if (al < 0.02) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
    if (al < 0.999) {
      // Un-blend from white so the edge carries no white halo.
      for (let c = 0; c < 3; c++) d[i + c] = clamp((d[i + c] - (1 - al) * 255) / al, 0, 255);
    }
    d[i + 3] = Math.round(al * 255);
  }
  await saveWebp(img, out, { maxSide: 900, quality: 84 });
  return img;
}

/* ---------- clouds: kill the yellow fringe ---------- */
async function cloud(src, out) {
  const img = await raw(p(src));
  const { data: d, w, h } = img;
  // Reference colour = mean of fully opaque pixels (the cloud's own white/grey).
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; }
  const ref = n ? [sr / n, sg / n, sb / n] : [245, 247, 250];
  let alpha = new Float32Array(w * h);
  for (let k = 0; k < w * h; k++) alpha[k] = d[k * 4 + 3] / 255;
  alpha = erode(alpha, w, h, 1);
  alpha = blur(alpha, w, h, 1);
  for (let k = 0; k < w * h; k++) {
    const i = k * 4;
    const a0 = d[i + 3] / 255;
    if (a0 < 1) {
      // Neutralise the cast: grey of itself, pulled toward the cloud colour.
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const t = 1 - a0;
      for (let c = 0; c < 3; c++) d[i + c] = clamp(lum * (1 - t) + ref[c] * t, 0, 255);
    }
    d[i + 3] = Math.round(clamp(alpha[k], 0, 1) * 255);
  }
  report.push(`  ${src} reference colour rgb(${ref.map(Math.round).join(",")})`);
  await saveWebp(img, out, { maxSide: 1100, quality: 82 });
}

/* ---------- field: remove the sky column by column ---------- */
async function grass(src, out) {
  const img = await raw(p(src));
  const { data: d, w, h } = img;
  const isGrass = (x, y) => {
    const i = (y * w + x) * 4;
    return d[i + 1] - d[i + 2] > 28 && d[i + 1] > d[i] * 0.95;
  };
  const horizon = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    let y = 0;
    for (; y < h - 8; y++) {
      let ok = true;
      for (let k = 0; k < 8 && ok; k++) ok = isGrass(x, y + k);
      if (ok) break;
    }
    horizon[x] = y;
  }
  // Median filter removes single-column spikes.
  const hz = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const win = [];
    for (let k = -6; k <= 6; k++) win.push(horizon[clamp(x + k, 0, w - 1)]);
    win.sort((a, b) => a - b);
    hz[x] = win[6];
  }
  // Sample the sky colour just above the horizon (cloud-free middle part).
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let x = Math.round(w * 0.45); x < w * 0.75; x += 3)
    for (let y = Math.max(0, hz[x] - 60); y < hz[x] - 20; y += 3) {
      const i = (Math.round(y) * w + x) * 4;
      sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++;
    }
  const top = [0, 0, 0];
  for (let x = 0; x < w; x += 4) for (let c = 0; c < 3; c++) top[c] += d[(2 * w + x) * 4 + c] / (w / 4);
  const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  report.push(`  sky near horizon ${hex([sr / n, sg / n, sb / n])}, sky top ${hex(top)}`);

  const feather = 3;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = smooth(hz[x] - feather / 2, hz[x] + feather, y);
      if (a <= 0) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }
      if (y < hz[x] + feather + 2) {
        // Edge pixels are mixed with sky: borrow grass colour from just below.
        const j = (Math.min(h - 1, Math.round(hz[x] + feather + 4)) * w + x) * 4;
        d[i] = d[j]; d[i + 1] = d[j + 1]; d[i + 2] = d[j + 2];
      }
      d[i + 3] = Math.round(a * 255);
    }
  await saveWebp(img, out, { maxSide: 2560, quality: 80 });
}

/* ---------- animated GIF → animated WebP with full frames ---------- */
async function anim(src, out, { slow = 1, width, quality = 60 } = {}) {
  const meta = await sharp(p(src), { animated: true }).metadata();
  const delay = (meta.delay || []).map((v) => Math.round((v || 100) * slow));
  let s = sharp(p(src), { animated: true });
  if (width) s = s.resize({ width });
  // libvips decodes every frame as a complete canvas; WebPAnimEncoder then picks
  // correct dispose/blend per frame, so frames can no longer pile up.
  await s.webp({ quality, alphaQuality: 80, effort: 6, loop: 0, delay }).toFile(q(out));
  const m2 = await sharp(q(out), { animated: true }).metadata();
  report.push(
    `${out.padEnd(22)} ${m2.width}x${m2.pageHeight} ${m2.pages}f  ${delay[0]}ms/frame  ${(fs.statSync(q(out)).size / 1024).toFixed(0)} KB`,
  );
}

/* The same animation, started from a different frame. Several instances of one
   plume then billow out of sync instead of pulsing together. */
async function animShifted(srcGif, out, shift, { width, quality = 55, slow = 1 } = {}) {
  // Decode the GIF as one strip of complete frames, rotate the strip, re-encode
  // through the normal animated path (keeps inter-frame compression).
  const meta = await sharp(p(srcGif), { animated: true }).metadata();
  let dec = sharp(p(srcGif), { animated: true }).ensureAlpha();
  if (width) dec = dec.resize({ width });
  const { data, info } = await dec.raw().toBuffer({ resolveWithObject: true });
  const n = meta.pages;
  const ph = info.height / n;
  const frameBytes = info.width * ph * 4;
  const order = Array.from({ length: n }, (_, i) => (i + shift) % n);
  const strip = Buffer.concat(order.map((i) => data.subarray(i * frameBytes, (i + 1) * frameBytes)));
  const delay = order.map((i) => Math.round((meta.delay[i] || 100) * slow));
  await sharp(strip, { raw: { width: info.width, height: info.height, channels: 4, pageHeight: ph } })
    .webp({ quality, alphaQuality: 75, effort: 6, loop: 0, delay })
    .toFile(q(out));
  report.push(`${out.padEnd(22)} ${info.width}x${ph} shift ${shift}f  ${(fs.statSync(q(out)).size / 1024).toFixed(0)} KB`);
}

/* ---------- smoke sprites for the particle system ----------
   Every sprite is multiplied by an elliptical falloff that reaches zero well
   inside its box, so no sprite can ever show a straight cut edge. */
const SMOKE_PX = 384;
function featherEllipse(img, inner = 0.55) {
  const { data: d, w, h } = img;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5) / w - 0.5;
      const ny = (y + 0.5) / h - 0.5;
      const r = Math.sqrt(nx * nx + ny * ny) * 2; // 0 centre … 1 edge midpoints
      const i = (y * w + x) * 4 + 3;
      d[i] = Math.round(d[i] * (1 - smooth(inner, 0.98, r)));
    }
}
// Generated sources: white smoke on pure black → luminance becomes alpha.
async function smokeFromBlack(src, out) {
  const img = await raw(src);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const a = smooth(0.04, 0.8, lum);
    // Un-premultiply so the shading survives, tinted to a neutral smoke white.
    const k = a > 0.01 ? Math.min(1, lum / a) : 1;
    const v = Math.round(255 * (0.55 + 0.45 * k));
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = Math.round(a * 255);
  }
  featherEllipse(img, 0.6);
  await saveWebp(img, out, { maxSide: SMOKE_PX, quality: 78 });
}
// Interim sources: soft round puffs cut out of the (already cleaned) cloud photos.
async function smokeFromCloud(srcWebp, out, box) {
  const cut = await sharp(srcWebp).extract(box).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const img = { data: cut.data, w: cut.info.width, h: cut.info.height };
  featherEllipse(img, 0.35);
  await saveWebp(img, out, { maxSide: SMOKE_PX, quality: 78 });
}

(async () => {
  const jobs = {
    // The eye in the sky cloud (generate-eye.mjs): white-1 (lids, empty white)
    // and iris-2. The skin round the lids is feathered away so the eye sits in the
    // cloud rather than on a patch; the opening (the white between the lids) is
    // saved as a mask that clips the moving iris and the blink.
    eye: async () => {
      const W = 480;
      const src = await raw(p("eye/white-1.png"));
      // Box of everything visible, and its centre / radii for the feather.
      let x0 = src.w, y0 = src.h, x1 = 0, y1 = 0;
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++)
          if (src.data[(y * src.w + x) * 4 + 3] > 24) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
      const white = Buffer.from(src.data);
      const open = new Float32Array(src.w * src.h);
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const i = (y * src.w + x) * 4;
          const dx = (x - cx) / rx, dy = (y - cy) / ry;
          const d = Math.sqrt(dx * dx + dy * dy * 1.6);
          white[i + 3] = Math.round(white[i + 3] * (1 - smooth(0.4, 0.8, d)));
          // The white of the eye: light, neutral, well inside the oval.
          const r = src.data[i], g = src.data[i + 1], b = src.data[i + 2];
          const sat = Math.max(r, g, b) - Math.min(r, g, b);
          // Away from the lids the skin turns into cloud (a cool light grey-white).
          const toCloud = 0.85 * smooth(0.3, 0.68, d);
          const CLOUD = [236, 239, 245];
          for (let k = 0; k < 3; k++) white[i + k] = Math.round(src.data[i + k] + (CLOUD[k] - src.data[i + k]) * toCloud);
          if (d < 0.62 && src.data[i + 3] > 200 && r > 190 && sat < 34) open[y * src.w + x] = 1;
        }
      // Close the speckles (veins, catchlights) and soften the edge by a pixel or two.
      const soft = blur(blur(open, src.w, src.h, 6), src.w, src.h, 3);
      const mask = Buffer.alloc(src.w * src.h * 4, 255);
      let mx0 = src.w, my0 = src.h, mx1 = 0, my1 = 0;
      for (let k = 0; k < soft.length; k++) {
        const a = smooth(0.3, 0.6, soft[k]);
        mask[k * 4 + 3] = Math.round(a * 255);
        if (a > 0.5) {
          const x = k % src.w, y = (k / src.w) | 0;
          if (x < mx0) mx0 = x;
          if (x > mx1) mx1 = x;
          if (y < my0) my0 = y;
          if (y > my1) my1 = y;
        }
      }
      // Both cropped to the same box (the visible eye), same size.
      const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
      const out = async (buf, name, quality) => {
        await sharp(buf, { raw: { width: src.w, height: src.h, channels: 4 } })
          .extract(box)
          .resize(W)
          .webp({ quality, alphaQuality: 90, effort: 6 })
          .toFile(q(name));
        const m = await sharp(q(name)).metadata();
        report.push(`${name.padEnd(22)} ${m.width}x${m.height}  ${(fs.statSync(q(name)).size / 1024).toFixed(0)} KB`);
      };
      await out(white, "eye-white.webp", 84);
      await out(mask, "eye-opening.webp", 70);
      const iris = await raw(p("eye/iris-2.png"));
      await saveWebp(iris, "eye-iris.webp", { maxSide: 200, quality: 84 });
      const pct = (v, o, d) => +((100 * (v - o)) / d).toFixed(1);
      report.push(
        `eye opening (eye box %): left ${pct(mx0, x0, box.width)}, top ${pct(my0, y0, box.height)}, ` +
          `width ${pct(mx1, mx0, box.width)}, height ${pct(my1, my0, box.height)}  (box ${box.width}x${box.height})`,
      );
    },
    // The "video" in projects.wmv, 720 × 450 (16:10) frames:
    //  - a title card: the UKOL logo (assets-src/projects/UKOL ikon.PNG) on dark;
    //  - UKOL's own app screens (phone screenshots in assets-src/projects/), a
    //    16:10 band of each — what the screen is about, readable at that size;
    //  - the public pages (1280 × 800, captured with headless Chrome into
    //    assets-src/wmp/), cropped to their content.
    // Also the small UKOL logo for its project cloud.
    wmp: async () => {
      fs.mkdirSync(q("wmp"), { recursive: true });
      const done = async (name) => {
        const m = await sharp(q(`wmp/${name}.webp`)).metadata();
        report.push(`wmp/${name}.webp`.padEnd(26) + ` ${m.width}x${m.height}  ${(fs.statSync(q(`wmp/${name}.webp`)).size / 1024).toFixed(0)} KB`);
      };
      const LOGO = p("projects/UKOL ikon.PNG");
      await sharp({ create: { width: 720, height: 450, channels: 3, background: "#0d1214" } })
        .composite([{ input: await sharp(LOGO).resize(210).toBuffer(), gravity: "center" }])
        .webp({ quality: 82, effort: 6 })
        .toFile(q("wmp/ukol-title.webp"));
      await done("ukol-title");
      const app = {
        "ukol-app-dictate": ["photo_2026-11-12_23-54-21.jpg", 0],
        "ukol-app-quote": ["photo_2026-11-12_23-54-24.jpg", 195],
        "ukol-app-prices": ["photo_2026-11-12_23-54-25.jpg", 285],
      };
      for (const [name, [file, top]] of Object.entries(app)) {
        await sharp(p(`projects/${file}`))
          .extract({ left: 0, top, width: 1179, height: Math.round((1179 * 10) / 16) })
          .resize(720)
          .webp({ quality: 80, effort: 6 })
          .toFile(q(`wmp/${name}.webp`));
        await done(name);
      }
      const crops = {
        "ukol-home": { left: 200, top: 0, width: 880, height: 550 },
        "dokli-home": { left: 200, top: 60, width: 880, height: 550 },
        "chat-widget": { left: 400, top: 170, width: 880, height: 550 },
      };
      for (const [name, box] of Object.entries(crops)) {
        await sharp(p(`wmp/${name}.png`)).extract(box).resize(720).webp({ quality: 78, effort: 6 }).toFile(q(`wmp/${name}.webp`));
        await done(name);
      }
      await sharp(LOGO).resize(128).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(q("ukol-logo.webp"));
      report.push(`ukol-logo.webp         128x128  ${(fs.statSync(q("ukol-logo.webp")).size / 1024).toFixed(0)} KB`);
    },
    smoke: async () => {
      const gen = [1, 2, 3, 4, 5, 6].map((n) => p(`smoke/smoke-${n}.png`)).filter((f) => fs.existsSync(f));
      if (gen.length) {
        for (const [k, f] of gen.entries()) await smokeFromBlack(f, `smoke-puff-${k + 1}.webp`);
        report.push(`  smoke: ${gen.length} generated sources (luminance → alpha)`);
        return;
      }
      // No generated sources yet: interim puffs from the cloud photos.
      const c1 = q("cloud-1.webp"); // 1024 × 467
      const c2 = q("cloud-2.webp"); // 974 × 491
      const boxes = [
        [c1, { left: 20, top: 40, width: 380, height: 360 }],
        [c1, { left: 300, top: 30, width: 420, height: 380 }],
        [c1, { left: 620, top: 20, width: 390, height: 360 }],
        [c2, { left: 30, top: 100, width: 400, height: 340 }],
        [c2, { left: 240, top: 20, width: 440, height: 400 }],
        [c2, { left: 540, top: 110, width: 420, height: 370 }],
      ];
      for (const [k, [src, box]] of boxes.entries()) await smokeFromCloud(src, `smoke-puff-${k + 1}.webp`, box);
      report.push("  smoke: interim puffs cut from cloud-1/cloud-2 (no generated sources found)");
    },
    bubbles: async () => {
      for (const n of [1, 2, 3, 4]) await bubble(`bubble-${n}.jpg`, `bubble-${n}.webp`);
    },
    machines: async () => {
      await machine("fog-machine.jpg", "fog-machine.webp");
      await machine("bubble-machine-2.jpg", "bubble-machine-2.webp", { white: 236, grad: 10 });
    },
    clouds: async () => {
      await cloud("cloud-1.png", "cloud-1.webp");
      await cloud("cloud-2.png", "cloud-2.webp");
    },
    grass: () => grass("field-original.jpg", "grass.webp"),
    anims: async () => {
      await anim("cloud-anim-1.gif", "cloud-anim-1.webp", { slow: 2, width: 400 });
      // The smoke-anim-*.gif plumes are no longer used: the fog is the SmokeMass
      // particle system (smoke-puff-*.webp). animShifted() is kept for reuse.
      // Single frame for reduced motion / paused / off-screen.
      await sharp(q("cloud-anim-1.webp"), { page: 0 }).webp({ quality: 75, alphaQuality: 85, effort: 6 }).toFile(q("cloud-anim-1-still.webp"));
    },
    // Header Contact link: the generated rotary phone (already transparent).
    phone: async () => {
      const img = await raw(p("phone/phone-2.png"));
      await saveWebp(img, "phone.webp", { maxSide: 192, quality: 86 });
    },
    // The door on the hill (generate-door.mjs): white frame-3 + leaf-4, cropped tight
    // to their alpha (no margin: the opening is measured on the final frame and
    // the leaf is stretched onto it), then the opening is found — the
    // transparent hole between the casings, open at the bottom (no threshold).
    door: async () => {
      const tight = async (src, out, height) => {
        const img = await raw(p(src));
        let x0 = img.w, y0 = img.h, x1 = 0, y1 = 0;
        for (let y = 0; y < img.h; y++)
          for (let x = 0; x < img.w; x++)
            if (img.data[(y * img.w + x) * 4 + 3] > 128) {
              if (x < x0) x0 = x;
              if (x > x1) x1 = x;
              if (y < y0) y0 = y;
              if (y > y1) y1 = y;
            }
        await sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } })
          .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
          .resize({ height })
          .webp({ quality: 84, alphaQuality: 92, effort: 6 })
          .toFile(q(out));
        const m = await sharp(q(out)).metadata();
        report.push(`${out.padEnd(22)} ${m.width}x${m.height}  ${(fs.statSync(q(out)).size / 1024).toFixed(0)} KB`);
        return m;
      };
      await tight("door/frame-3.png", "door-frame.webp", 640);
      await tight("door/leaf-4.png", "door-leaf.webp", 640);
      // The world behind the door: the left part of the original field photo —
      // the cloud bank and the hill's left slope (the page shows its middle) —
      // with "another world's" sky: a deep, saturated azure (much bluer than the
      // page's pale horizon), the clouds left white, and the grass a touch brighter.
      {
        const { data, info } = await sharp(p("field-original.jpg"))
          .extract({ left: 38, top: 333, width: 781, height: 1201 }) // full size: it fills the screen on click
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const { width: w, height: h } = info;
        // Sky gradient, top → horizon (≈ 45 % of the crop).
        const TOP = [22, 98, 232];
        const LOW = [84, 160, 250];
        for (let y = 0; y < h; y++) {
          const t = smooth(0, 0.5, y / h);
          const sky = TOP.map((c, k) => c + (LOW[k] - c) * t);
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 3;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            // Sky: blue above green (grass is the other way round), and not a
            // white cloud (the sky's red stays under ~180 even at the horizon).
            const s = smooth(8, 30, b - g) * (1 - smooth(190, 232, r));
            // Grass: green clearly above blue.
            const gr = smooth(20, 60, g - b);
            if (s > 0) {
              // Keep the photo's own grain: the sky colour scaled by the pixel's lightness.
              const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 175;
              for (let k = 0; k < 3; k++) {
                const target = clamp(sky[k] * (0.85 + 0.15 * lum), 0, 255);
                data[i + k] = Math.round(data[i + k] + (target - data[i + k]) * s);
              }
            }
            if (gr > 0) {
              const k = 1 + 0.1 * gr;
              data[i] = clamp(Math.round(r * k), 0, 255);
              data[i + 1] = clamp(Math.round(g * (1 + 0.13 * gr)), 0, 255);
              data[i + 2] = clamp(Math.round(b * k), 0, 255);
            }
          }
        }
        await sharp(data, { raw: { width: w, height: h, channels: 3 } })
          .modulate({ saturation: 1.04 })
          .webp({ quality: 80, effort: 6 })
          .toFile(q("door-portal.webp"));
      }
      const pm = await sharp(q("door-portal.webp")).metadata();
      report.push(`door-portal.webp       ${pm.width}x${pm.height}  ${(fs.statSync(q("door-portal.webp")).size / 1024).toFixed(0)} KB`);
      // The opening, scanned out from the centre on many rows / columns (medians).
      const fr = await raw(q("door-frame.webp"));
      const solid = (x, y) => fr.data[(y * fr.w + x) * 4 + 3] > 128;
      const cx = Math.round(fr.w / 2);
      const med = (a) => a.sort((m, n) => m - n)[a.length >> 1];
      const lefts = [], rights = [], tops = [];
      for (let y = Math.round(fr.h * 0.3); y < fr.h * 0.9; y += 7) {
        let x = cx; while (x > 0 && !solid(x, y)) x--; lefts.push(x + 1);
        x = cx; while (x < fr.w - 1 && !solid(x, y)) x++; rights.push(x);
      }
      for (let x = Math.round(fr.w * 0.35); x < fr.w * 0.65; x += 5) {
        let y = Math.round(fr.h * 0.5); while (y > 0 && !solid(x, y)) y--; tops.push(y + 1);
      }
      const o = { x: med(lefts), y: med(tops), r: med(rights) };
      const pct = (v, d) => +((100 * v) / d).toFixed(2);
      report.push(
        `door opening (frame box %): left ${pct(o.x, fr.w)}, top ${pct(o.y, fr.h)}, width ${pct(o.r - o.x, fr.w)}, height ${pct(fr.h - o.y, fr.h)}  (frame ${fr.w}x${fr.h})`,
      );
    },
  };
  for (const [name, job] of Object.entries(jobs)) if (!ONLY || ONLY === name) await job();
  console.log(report.join("\n"));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
