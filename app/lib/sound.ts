"use client";

import { useSyncExternalStore } from "react";

/*
 * Everything is synthesised with the Web Audio API — no audio files.
 * Off by default; the AudioContext is only created on the user's first "Sound on"
 * click (browsers require a gesture anyway).
 */

let enabled = false;
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { stop: () => void } | null = null;

function noiseBuffer(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * seconds), context.sampleRate);
  const data = buffer.getChannelData(0);
  // Brown-ish noise: softer than white, closer to wind/air.
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function startAmbient(context: AudioContext, out: AudioNode) {
  const bus = context.createGain();
  bus.gain.value = 0;
  bus.gain.linearRampToValueAtTime(1, context.currentTime + 2.5);
  bus.connect(out);

  // Airy bed: looping noise through a slowly breathing low-pass.
  const air = context.createBufferSource();
  air.buffer = noiseBuffer(context, 4);
  air.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = context.createGain();
  lfoDepth.gain.value = 260;
  lfo.connect(lfoDepth).connect(lp.frequency);
  const airGain = context.createGain();
  airGain.gain.value = 0.18;
  air.connect(lp).connect(airGain).connect(bus);

  // A soft, slightly detuned pad (fifth) underneath.
  const pad = context.createGain();
  pad.gain.value = 0.035;
  pad.connect(bus);
  const oscs = [110, 110.6, 164.8].map((f) => {
    const o = context.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(pad);
    return o;
  });

  air.start();
  lfo.start();
  oscs.forEach((o) => o.start());
  return {
    stop: () => {
      const t = context.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.6);
      [air, lfo, ...oscs].forEach((n) => n.stop(t + 0.7));
    },
  };
}

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function setSoundEnabled(next: boolean) {
  enabled = next;
  if (next) {
    const context = ensureContext();
    if (context && master) {
      void context.resume();
      ambient?.stop();
      ambient = startAmbient(context, master);
    }
  } else {
    ambient?.stop();
    ambient = null;
  }
  listeners.forEach((l) => l());
}

/** A soft "puff" for a popping bubble. Silent when sound is off. */
export function playPop(intensity = 1) {
  if (!enabled || !ctx || !master) return;
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
  burst.connect(bp).connect(g).connect(master);
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
  o.connect(og).connect(master);
  o.start(t);
  o.stop(t + 0.12);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, () => enabled, () => false);
}
