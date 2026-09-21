/**
 * Sound effects are synthesised with the Web Audio API rather than shipped as files: no assets
 * to load, works offline, and each effect is a few lines. Browsers refuse to start audio before
 * a user gesture, so the context is created lazily on the first tap and resumed if suspended.
 */

let ctx: AudioContext | null = null;
let muted = false;

const MUTE_KEY = "dress-up-world:muted";

try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {
  // Storage blocked (private mode) — just start unmuted.
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // Non-fatal: the setting just won't survive a reload.
  }
}

function audio(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOptions {
  from: number;
  to?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone(o: ToneOptions): void {
  const ac = audio();
  if (!ac) return;

  const start = ac.currentTime + (o.delay ?? 0);
  const osc = ac.createOscillator();
  const amp = ac.createGain();

  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.from, start);
  if (o.to !== undefined) osc.frequency.exponentialRampToValueAtTime(o.to, start + o.duration);

  const peak = o.gain ?? 0.16;
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + o.duration);

  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + o.duration + 0.02);
}

/** Picking a garment or a face part. */
export function playPop(): void {
  tone({ from: 420, to: 860, duration: 0.11, type: "triangle", gain: 0.14 });
}

/** Switching category tab — lower and softer than a pick. */
export function playTap(): void {
  tone({ from: 300, to: 380, duration: 0.07, type: "sine", gain: 0.09 });
}

/** Choosing a colour. */
export function playSwatch(): void {
  tone({ from: 660, to: 990, duration: 0.09, type: "sine", gain: 0.11 });
}

/** Saving a character — a little three-note flourish. */
export function playSparkle(): void {
  tone({ from: 660, duration: 0.14, type: "triangle", gain: 0.13 });
  tone({ from: 880, duration: 0.14, type: "triangle", gain: 0.13, delay: 0.09 });
  tone({ from: 1320, duration: 0.24, type: "triangle", gain: 0.12, delay: 0.18 });
}

/** Walking through to the next room. */
export function playWhoosh(): void {
  tone({ from: 240, to: 640, duration: 0.2, type: "sine", gain: 0.1 });
  tone({ from: 480, to: 300, duration: 0.16, type: "triangle", gain: 0.07, delay: 0.05 });
}

/** A balloon going pop. */
export function playBang(): void {
  tone({ from: 900, to: 90, duration: 0.14, type: "square", gain: 0.16 });
  tone({ from: 320, to: 60, duration: 0.2, type: "triangle", gain: 0.1, delay: 0.02 });
}

/** A cupboard door or a drawer. */
export function playCreak(): void {
  tone({ from: 180, to: 300, duration: 0.16, type: "sine", gain: 0.09 });
}

/** Taking something from a market stall. */
export function playCoin(): void {
  tone({ from: 1050, duration: 0.08, type: "triangle", gain: 0.11 });
  tone({ from: 1570, duration: 0.14, type: "triangle", gain: 0.1, delay: 0.06 });
}

/** Eating something nice. */
export function playNom(): void {
  tone({ from: 300, to: 180, duration: 0.09, type: "sine", gain: 0.13 });
  tone({ from: 260, to: 150, duration: 0.11, type: "sine", gain: 0.12, delay: 0.1 });
}

/** Eating something that should have been cooked first. */
export function playYuck(): void {
  tone({ from: 300, to: 130, duration: 0.3, type: "sawtooth", gain: 0.09 });
}

/** Two things turning into dinner. */
export function playChime(): void {
  tone({ from: 520, duration: 0.14, type: "sine", gain: 0.12 });
  tone({ from: 780, duration: 0.14, type: "sine", gain: 0.12, delay: 0.08 });
  tone({ from: 1040, duration: 0.3, type: "sine", gain: 0.12, delay: 0.16 });
}

/** Something landing in the bin. */
export function playThud(): void {
  tone({ from: 200, to: 70, duration: 0.18, type: "triangle", gain: 0.14 });
}

/** Turning a piece of furniture on the spot. */
export function playTurn(): void {
  tone({ from: 380, to: 540, duration: 0.1, type: "sine", gain: 0.09 });
}

/** Water going into a plant pot. */
export function playWater(): void {
  tone({ from: 700, to: 300, duration: 0.18, type: "sine", gain: 0.1 });
  tone({ from: 520, to: 240, duration: 0.2, type: "sine", gain: 0.08, delay: 0.09 });
}
