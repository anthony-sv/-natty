import { useEffect, useRef } from "react";
import { Store } from "@tanstack/store";
import { z } from "zod";

/**
 * The player's non-visual output: a short tone and a buzz.
 *
 * The whole premise of a guided session is that you are not looking at the
 * phone — you're under a bar, or holding a contraction with your eyes shut. A
 * countdown you have to watch is a countdown that doesn't work, which is the
 * same problem the auto-running sequence solves from the other side.
 *
 * Deliberately synthesised rather than shipped as audio files: four short tones
 * are a few lines of oscillator here and ~50KB of assets otherwise, and an
 * asset that fails to load fails silently at exactly the wrong moment.
 */
export type Cue = "tick" | "go" | "part" | "end";

const PREFS_KEY = "natty.player.v1";

const prefsSchema = z.object({
  /**
   * One switch for tone *and* vibration, not two.
   *
   * They answer the same question — "may the phone interrupt me" — and a gym
   * has exactly two states: earbuds in, or a settings screen you'd rather not
   * be reading between sets.
   */
  cues: z.boolean().default(true),
});

export type PlayerPrefs = z.infer<typeof prefsSchema>;

function loadPrefs(): PlayerPrefs {
  if (typeof localStorage === "undefined") return { cues: true };
  const raw = localStorage.getItem(PREFS_KEY);
  if (raw === null) return { cues: true };
  try {
    const result = prefsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : { cues: true };
  } catch {
    return { cues: true };
  }
}

export const playerPrefs = new Store<PlayerPrefs>(loadPrefs());

playerPrefs.subscribe(() => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(playerPrefs.state));
});

export function toggleCues(): void {
  playerPrefs.setState((state) => ({ ...state, cues: !state.cues }));
}

/**
 * One context for the session, built on first use.
 *
 * Browsers refuse to start audio outside a user gesture, and the first cue
 * always follows one — you tapped Start, or Done. Creating it eagerly at import
 * time would produce a suspended context that stays suspended.
 */
let audio: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (Ctor === undefined) return null;
  audio ??= new Ctor();
  // Autoplay policy suspends a context created before the first gesture, and
  // resuming is a no-op once it's running.
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

/** A single tone. Short, because it has to land between two reps. */
function tone(hz: number, ms: number, delayMs = 0, gain = 0.2): void {
  const ctx = context();
  if (ctx === null) return;

  const at = ctx.currentTime + delayMs / 1000;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();

  oscillator.frequency.value = hz;
  oscillator.type = "sine";
  // Ramped rather than switched: a square-edged gain change is an audible
  // click, which on a 60ms beep is most of what you hear.
  envelope.gain.setValueAtTime(0, at);
  envelope.gain.linearRampToValueAtTime(gain, at + 0.01);
  envelope.gain.linearRampToValueAtTime(0, at + ms / 1000);

  oscillator.connect(envelope).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + ms / 1000 + 0.02);
}

function buzz(pattern: number | number[]): void {
  // Absent on iOS Safari and on desktop. Nothing here depends on it landing.
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(pattern);
}

/**
 * Play a cue, unless they're muted.
 *
 * The four are pitched apart rather than being one sound at different volumes,
 * so you can tell "one second left" from "that's the set" without counting.
 */
export function playCue(cue: Cue): void {
  if (!playerPrefs.state.cues) return;

  switch (cue) {
    case "tick":
      tone(660, 60, 0, 0.12);
      buzz(25);
      break;
    case "go":
      tone(990, 140);
      buzz(60);
      break;
    // A part boundary inside a set: two quick notes, because it means "change
    // what you're doing", not "stop".
    case "part":
      tone(760, 70);
      tone(1010, 70, 90);
      buzz([40, 60, 40]);
      break;
    case "end":
      tone(880, 120);
      tone(1320, 200, 150);
      buzz([80, 80, 160]);
      break;
  }
}

/**
 * Fire `cue` whenever `key` changes.
 *
 * The key is a description of *where the clock is* — "lead-2", "part-3",
 * "end" — so the cue is a function of derived state rather than something the
 * render path has to remember to call. Nothing here sets state, which is what
 * keeps it clear of the `set-state-in-effect` rule the app enforces outside
 * `ui/`.
 *
 * The first key a mounted body sees is skipped: arriving at a step is not a
 * transition, and beeping on arrival would fire on every reload of a session
 * parked on a finished rest.
 */
export function useCue(cue: Cue | undefined, key: string): void {
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const isFirst = previous.current === null;
    const changed = previous.current !== key;
    previous.current = key;
    if (!isFirst && changed && cue !== undefined) playCue(cue);
  }, [cue, key]);
}
