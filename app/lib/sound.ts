"use client";

import { useSyncExternalStore } from "react";

/*
 * Page sound: the ambient track, the two machine motors, and synthesised pops.
 *
 * On by default (the visitor's choice is remembered in localStorage). Browsers
 * block audio until a user gesture, so nothing is created or downloaded until
 * the first pointerdown / keydown anywhere on the page; then the AudioContext
 * starts, the track is fetched and fades in. "Sound off" fades everything out.
 * prefers-reduced-motion does not affect sound.
 *
 * Music loop: decoded into a buffer, silent head/tail trimmed, each repeat
 * overlaps the previous one with an equal-power crossfade (no MP3 seam gap).
 * Motors: engine.mp3 is prepared as a seamless loop (its tail is crossfaded into
 * its head offline), so it can loop in the buffer while its rate wobbles.
 */

const STORE_KEY = "ataman:sound";
const TRACK = "/media/ambient.mp3";
const ENGINE = "/media/engine.mp3";
// Levels (0–1, straight to the speakers). Tune here.
const MUSIC_VOLUME = 0.15; // the ambient track, in the background
const ENGINE_MAX = 0.12; // a motor with its machine at the centre of the screen; fades to 0 with distance
const FADE_IN = 2.5;
const FADE_OUT = 1.6;
const XFADE = 4;

type Track = { buffer: AudioBuffer; start: number; end: number };

const listeners = new Set<() => void>();
let enabled: boolean | null = null; // the visitor's choice; null = not read yet
let ctx: AudioContext | null = null;
let popBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let engineBus: GainNode | null = null;
let music: { stop: (at: number) => void } | null = null;
let musicTrack: Promise<Track | null> | null = null;
let engineTrack: Promise<Track | null> | null = null;
let engines: { stop: () => void } | null = null;
let gestureArmed = false;

/* ---------- preference ---------- */

function readEnabled() {
  if (enabled !== null) return enabled;
  try {
    enabled = window.localStorage.getItem(STORE_KEY) !== "off";
  } catch {
    enabled = true;
  }
  return enabled;
}

function saveEnabled(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(STORE_KEY, on ? "on" : "off");
  } catch {
    // storage blocked: the in-memory choice still applies for this visit
  }
  listeners.forEach((l) => l());
}

/* ---------- decoding ---------- */

function load(url: string, context: AudioContext, floor: number) {
  return fetch(url)
    .then((r) => r.arrayBuffer())
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      // Find where the sound really starts and ends (MP3 padding, silent tails).
      const ch = buffer.getChannelData(0);
      let a = 0;
      while (a < ch.length && Math.abs(ch[a]) < floor) a++;
      let b = ch.length - 1;
      while (b > a && Math.abs(ch[b]) < floor) b--;
      return { buffer, start: a / buffer.sampleRate, end: (b + 1) / buffer.sampleRate };
    })
    .catch(() => null);
}

/* ---------- music ---------- */

/** Equal-power fade curve (0→1 or 1→0): no loudness dip at the seam. */
function curve(rising: boolean) {
  const n = 64;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    c[i] = rising ? Math.sin((t * Math.PI) / 2) : Math.cos((t * Math.PI) / 2);
  }
  return c;
}

function startMusic(context: AudioContext, out: AudioNode, t: Track) {
  const length = t.end - t.start;
  const xf = Math.min(XFADE, length / 4);
  const live: AudioBufferSourceNode[] = [];
  let timer = 0;
  let stopped = false;

  /** Queue one repeat on the audio clock; returns when the next one must start. */
  const queue = (when: number, first: boolean) => {
    const src = context.createBufferSource();
    src.buffer = t.buffer;
    const gain = context.createGain();
    src.connect(gain).connect(out);
    if (first) gain.gain.setValueAtTime(1, when);
    else gain.gain.setValueCurveAtTime(curve(true), when, xf);
    const next = when + length - xf;
    gain.gain.setValueCurveAtTime(curve(false), next, xf);
    src.start(when, t.start, length);
    live.push(src);
    src.onended = () => {
      const i = live.indexOf(src);
      if (i >= 0) live.splice(i, 1);
    };
    return next;
  };
  // Always one repeat queued ahead on the (sample-accurate) audio clock, so a
  // throttled timer in a background tab still has a whole loop of slack.
  let nextAt = queue(context.currentTime + 0.05, true);
  nextAt = queue(nextAt, false);
  const pump = () => {
    if (stopped) return;
    nextAt = queue(nextAt, false);
    timer = window.setTimeout(pump, (length - xf) * 1000);
  };
  timer = window.setTimeout(pump, (length - xf) * 1000);

  return {
    stop: (at: number) => {
      stopped = true;
      window.clearTimeout(timer);
      live.forEach((src) => {
        try {
          src.stop(at);
        } catch {
          // already stopped
        }
      });
    },
  };
}

/* ---------- motors ---------- */

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * One looping motor per `[data-engine]` element. Its volume follows how close
 * the machine is to the centre of the screen; off screen it is silent and its
 * source is stopped (paused). A slow, uneven wobble of volume and pitch (±3 %)
 * makes it grumble instead of drone.
 */
function startEngines(context: AudioContext, out: AudioNode, t: Track) {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-engine]"));
  const motors = els.map((el, i) => {
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(out);
    return { el, gain, src: null as AudioBufferSourceNode | null, quietSince: 0, phase: i * 2.1 };
  });

  const startSrc = (m: (typeof motors)[number]) => {
    const src = context.createBufferSource();
    src.buffer = t.buffer;
    src.loop = true;
    src.loopStart = t.start;
    src.loopEnd = t.end;
    src.connect(m.gain);
    // Each motor starts at its own point of the loop, so the two never phase.
    src.start(0, t.start + ((m.phase * 3.7) % (t.end - t.start)));
    m.src = src;
  };

  const tick = () => {
    const now = context.currentTime;
    const vh = window.innerHeight;
    for (const m of motors) {
      const r = m.el.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < vh && r.width > 0;
      const d = Math.abs(r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      const w = 0.6 * Math.sin(now * 0.83 + m.phase) + 0.4 * Math.sin(now * 2.3 + m.phase * 1.7);
      const target = visible ? ENGINE_MAX * (1 - smoothstep(0.1, 1, d)) * (1 + 0.03 * w) : 0;
      m.gain.gain.setTargetAtTime(target, now, 0.25);
      if (target > 0.0005) {
        m.quietSince = 0;
        if (!m.src) startSrc(m);
        m.src?.playbackRate.setTargetAtTime(1 + 0.03 * w, now, 0.3);
      } else if (m.src) {
        // Silent for a moment: pause the source entirely.
        m.quietSince ||= now;
        if (now - m.quietSince > 1) {
          m.src.stop();
          m.src = null;
        }
      }
    }
  };
  tick();
  const timer = window.setInterval(tick, 120);

  return {
    stop: () => {
      window.clearInterval(timer);
      motors.forEach((m) => {
        m.gain.gain.setTargetAtTime(0, context.currentTime, 0.2);
        try {
          m.src?.stop(context.currentTime + 1);
        } catch {
          // already stopped
        }
      });
    },
  };
}

/* ---------- start / stop ---------- */

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  popBus = ctx.createGain();
  popBus.gain.value = 0.5;
  popBus.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(ctx.destination);
  engineBus = ctx.createGain();
  engineBus.gain.value = 0;
  engineBus.connect(ctx.destination);
  // A hidden tab goes quiet; it comes back where it was.
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (readEnabled()) void ctx.resume();
  });
  return ctx;
}

function ramp(bus: GainNode, to: number, seconds: number) {
  const now = bus.context.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(bus.gain.value, now);
  bus.gain.linearRampToValueAtTime(to, now + seconds);
}

/** Must be called from inside a user gesture (the first one, or the button). */
function startAudio() {
  const context = ensureContext();
  if (!context || !musicBus || !engineBus) return;
  void context.resume();
  const mBus = musicBus;
  const eBus = engineBus;
  musicTrack ??= load(TRACK, context, 0.003);
  engineTrack ??= load(ENGINE, context, 0.0001);
  void musicTrack.then((t) => {
    if (!t || !readEnabled()) return;
    if (!music) music = startMusic(context, mBus, t);
    ramp(mBus, MUSIC_VOLUME, FADE_IN);
  });
  void engineTrack.then((t) => {
    if (!t || !readEnabled()) return;
    if (!engines) engines = startEngines(context, eBus, t);
    ramp(eBus, 1, FADE_IN);
  });
}

function stopAudio() {
  if (!ctx || !musicBus || !engineBus) return;
  ramp(musicBus, 0, FADE_OUT);
  ramp(engineBus, 0, FADE_OUT);
  const at = ctx.currentTime + FADE_OUT + 0.05;
  music?.stop(at);
  music = null;
  const e = engines;
  engines = null;
  window.setTimeout(() => e?.stop(), (FADE_OUT + 0.1) * 1000);
}

/** The Sound button. It is a gesture itself, so it can start audio directly. */
export function setSoundEnabled(next: boolean) {
  saveEnabled(next);
  if (next) startAudio();
  else stopAudio();
}

/**
 * Sound is on by default but may only start on a user gesture: the first
 * pointerdown / keydown anywhere starts it (unless the visitor switched it off).
 * Gestures on the Sound button itself are left to the button.
 */
export function armSoundOnFirstGesture() {
  if (gestureArmed) return;
  gestureArmed = true;
  const onGesture = (e: Event) => {
    if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
    // Modifier-only or Escape keys are not user activation in every browser.
    if (e instanceof KeyboardEvent && (e.key === "Escape" || ["Shift", "Control", "Alt", "Meta"].includes(e.key))) return;
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("keydown", onGesture, true);
    if (readEnabled() && !music) startAudio();
  };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}

/* ---------- pops ---------- */

function noiseBuffer(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish noise: a soft breathy burst.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

/** A soft "puff" for a popping bubble. Silent when sound is off or not started. */
export function playPop(intensity = 1) {
  if (!readEnabled() || !ctx || !popBus) return;
  const t = ctx.currentTime;
  // Breathy burst.
  const burst = ctx.createBufferSource();
  burst.buffer = noiseBuffer(ctx, 0.2);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1800, t);
  bp.frequency.exponentialRampToValueAtTime(500, t + 0.12);
  bp.Q.value = 0.9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5 * intensity, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  burst.connect(bp).connect(g).connect(popBus);
  burst.start(t);
  burst.stop(t + 0.2);
  // Tiny pitched "plip".
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(900 + Math.random() * 300, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 0.09);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.12 * intensity, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(og).connect(popBus);
  o.start(t);
  o.stop(t + 0.12);
}

/**
 * The classic double ring of an old bell telephone, quietly: two bursts of a
 * hammer striking two bells ~22 times a second. Silent when sound is off.
 * Returns the ring's length in seconds (0 when silent).
 */
export function playRing() {
  if (!readEnabled() || !ctx || !popBus) return 0;
  const context = ctx;
  const t0 = context.currentTime + 0.02;
  const bell = context.createGain();
  bell.gain.value = 0.0001;
  bell.connect(popBus);
  const tones = [1250, 1660, 2480].map((f, i) => {
    const o = context.createOscillator();
    o.type = i === 2 ? "sine" : "triangle";
    o.frequency.value = f;
    const g = context.createGain();
    g.gain.value = [1, 0.7, 0.18][i];
    o.connect(g).connect(bell);
    return o;
  });
  const RING = 0.45;
  const GAP = 0.18;
  const STRIKE = 1 / 22;
  for (const start of [t0, t0 + RING + GAP]) {
    for (let t = start; t < start + RING; t += STRIKE) {
      bell.gain.setValueAtTime(0.0001, t);
      bell.gain.linearRampToValueAtTime(0.05, t + 0.004);
      bell.gain.exponentialRampToValueAtTime(0.004, t + STRIKE * 0.95);
    }
  }
  const end = t0 + 2 * RING + GAP + 0.1;
  bell.gain.setValueAtTime(0.0001, end - 0.05);
  tones.forEach((o) => {
    o.start(t0);
    o.stop(end);
  });
  return end - context.currentTime;
}

/* ---------- the door in the sky ---------- */

/**
 * An old hinge creaking as the door swings (~0.9 s): stick-slip — a train of
 * tiny damped clicks whose rate rises and falls with the swing — rung through
 * three narrow resonances (the wood). Quiet. Silent when Sound is off.
 */
export function playCreak() {
  if (!readEnabled() || !ctx || !popBus) return;
  const context = ctx;
  const sr = context.sampleRate;
  const dur = 0.9;
  const buf = context.createBuffer(1, Math.floor(sr * dur), sr);
  const d = buf.getChannelData(0);
  const tail = Math.floor(sr * 0.006);
  let sign = 1;
  for (let t = 0.02; t < dur - 0.02; ) {
    const u = t / dur;
    const env = Math.sin(Math.PI * Math.min(1, u * 1.25)) ** 0.7;
    const amp = env * (0.55 + 0.45 * Math.random());
    const i0 = Math.floor(t * sr);
    for (let k = 0; k < tail && i0 + k < d.length; k++) d[i0 + k] += sign * amp * Math.exp(-k / (sr * 0.0009));
    sign = -sign;
    // Slip rate: ~35 → ~110 → ~45 per second, a little irregular.
    const rate = 35 + 75 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + (Math.random() - 0.5) * 16;
    t += 1 / rate;
  }
  const src = context.createBufferSource();
  src.buffer = buf;
  const out = context.createGain();
  out.gain.value = 0.32;
  out.connect(popBus);
  for (const [freq, q, g] of [
    [480, 14, 1],
    [1080, 11, 0.6],
    [2350, 8, 0.28],
  ]) {
    const bp = context.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const gain = context.createGain();
    gain.gain.value = g;
    src.connect(bp).connect(gain).connect(out);
  }
  src.start();
}

/**
 * A soft, bright chime as the light floods in: three high sine partials (an
 * open fifth and its octave) struck one after another, ringing out over ~2 s.
 */
export function playChime() {
  if (!readEnabled() || !ctx || !popBus) return;
  const t0 = ctx.currentTime + 0.01;
  [
    [1318.5, 0.05, 0],
    [1975.5, 0.035, 0.07],
    [2637, 0.02, 0.14],
  ].forEach(([freq, level, delay]) => {
    const o = ctx!.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx!.createGain();
    const t = t0 + delay;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    o.connect(g).connect(popBus!);
    o.start(t);
    o.stop(t + 2.3);
  });
}

/* ---------- button clicks ---------- */

/**
 * A short, soft plastic "click" for the XP buttons: a tick of filtered noise
 * (the switch) over a quick low knock (the key travel). ~40 ms. Silent when
 * Sound is off or audio has not started.
 */
export function playClick() {
  if (!readEnabled() || !ctx || !popBus) return;
  const t = ctx.currentTime;
  const tick = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * 0.012);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  tick.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3200;
  bp.Q.value = 1.2;
  const tg = ctx.createGain();
  tg.gain.value = 0.22;
  tick.connect(bp).connect(tg).connect(popBus);
  tick.start(t);
  const knock = ctx.createOscillator();
  knock.type = "sine";
  knock.frequency.setValueAtTime(520, t);
  knock.frequency.exponentialRampToValueAtTime(180, t + 0.035);
  const kg = ctx.createGain();
  kg.gain.setValueAtTime(0.0001, t);
  kg.gain.exponentialRampToValueAtTime(0.09, t + 0.003);
  kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  knock.connect(kg).connect(popBus);
  knock.start(t);
  knock.stop(t + 0.05);
}

let clicksArmed = false;
/**
 * Every XP button clicks: on press for a pointer (like a real key), on
 * activation for the keyboard (a click event with detail 0). Delegated, so
 * server-rendered buttons need no client code.
 */
export function armButtonClicks() {
  if (clicksArmed) return;
  clicksArmed = true;
  const BUTTONS = ".xp-cta, .xp-btn";
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if ((e.target as Element | null)?.closest?.(BUTTONS)) playClick();
  });
  document.addEventListener("click", (e) => {
    if (e.detail === 0 && (e.target as Element | null)?.closest?.(BUTTONS)) playClick();
  });
}

/* ---------- React ---------- */

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** The visitor's choice (default on). The server renders the default. */
export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, readEnabled, () => true);
}
