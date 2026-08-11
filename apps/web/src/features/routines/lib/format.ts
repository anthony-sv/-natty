import type {
  ExerciseEntry,
  PoseCue,
  Prescription,
  Routine,
  SetModifiers,
  SetSegment,
} from "@/data/routines";
import type { Names } from "@/i18n/names";
import type { Translate } from "@/i18n/use-t";

/**
 * Rendering an authored prescription as text.
 *
 * Everything here takes an injected `{ names, t }` rather than reaching for the
 * exercise library or a locale store — the same shape `toRecordRows` already
 * uses for its `ExerciseNaming`. That's what lets these stay pure while
 * rendering in the reader's language, and it's why `buildSteps` threads one
 * through rather than resolving names itself.
 */
export interface Formatting {
  names: Names;
  t: Translate;
}

/**
 * What to call an exercise entry on screen — the library's curated name, or its
 * translation.
 *
 * The id fallback inside `names.exercise` only fires if an entry points at an
 * exercise that no longer exists; `authoring.ts` throws on an unknown name, so
 * it shouldn't happen, but a dangling id should read as a visible id rather
 * than an empty heading.
 */
export function exerciseDisplayName(
  entry: ExerciseEntry,
  { names }: Formatting,
): string {
  return names.exercise(entry.exerciseId);
}

/** "or Machine shoulder press (neutral grip)" — the source's "/" alternatives. */
export function formatAlternatives(
  entry: ExerciseEntry,
  { names, t }: Formatting,
): string | undefined {
  if (entry.orAlternatives.length === 0) return undefined;
  // Joined with the translated "or" rather than a comma list, because "o" and
  // "or" are words that have to agree with the sentence they sit in.
  const or = t("format.or");
  const rendered = entry.orAlternatives.map((id) => names.exercise(id));
  return `${or} ${rendered.join(`, ${or} `)}`;
}

/** "Most muscular, 10s hold" — the pose closing a finisher set. */
export function formatPose(pose: PoseCue, { names, t }: Formatting): string {
  const name = names.pose(pose.poseId);
  return pose.holdSeconds === undefined
    ? name
    : `${name}, ${t("format.hold", { seconds: pose.holdSeconds })}`;
}

/**
 * Short labels for the intensity techniques on a set, in a fixed order so the
 * same prescription always reads the same way.
 */
export function formatModifiers(
  modifiers: SetModifiers,
  { t }: Formatting,
): string[] {
  const labels: string[] = [];
  if (modifiers.forcedReps) labels.push(t("modifier.forcedReps"));
  if (modifiers.negatives) labels.push(t("modifier.negatives"));
  if (modifiers.partials) labels.push(t("modifier.partials"));
  if (modifiers.staticHolds) labels.push(t("modifier.staticHolds"));
  if (modifiers.dropSet) labels.push(t("modifier.dropSet"));
  if (modifiers.ladder) {
    labels.push(t("modifier.ladder", { positions: modifiers.ladder.join(" → ") }));
  }
  return labels;
}

/**
 * One leg of a segmented set: "10s hold", "12 pulses", "12 reps, pulse each".
 *
 * Short on purpose — these are read as a list of five, mid-set, so anything
 * longer stops being scannable at exactly the moment it has to be.
 */
export function formatSegment(segment: SetSegment, { t }: Formatting): string {
  switch (segment.kind) {
    case "hold":
      return t("segment.hold", { seconds: segment.seconds });
    case "pulses":
      return t("segment.pulses", { count: formatRange(segment.count) });
    case "reps":
      return segment.pulsePerRep
        ? t("segment.repsPulsed", { count: formatRange(segment.count) })
        : t("format.repsOnly", { range: formatRange(segment.count) });
  }
}

/** The whole sequence, joined — "10s hold → 12 pulses → 12 reps, pulse each". */
export function formatSegments(
  segments: SetSegment[],
  f: Formatting,
): string {
  return segments.map((segment) => formatSegment(segment, f)).join(" → ");
}

/** Numbers and a dash, so it needs no translation. */
export function formatRange(value: number | [number, number]): string {
  return Array.isArray(value) ? `${value[0]}-${value[1]}` : `${value}`;
}

/**
 * "45s" or "20 min".
 *
 * The minute abbreviation is a word and differs by language; the second is the
 * SI symbol and doesn't.
 */
export function formatDuration(
  value: number | [number, number],
  { t }: Formatting,
): string {
  if (Array.isArray(value)) return t("format.secondsRange", { value: `${value[0]}-${value[1]}` });
  return value % 60 === 0
    ? t("format.minutes", { count: value / 60 })
    : t("format.seconds", { count: value });
}

/** One compact line describing a single prescription phase. */
export function formatPrescription(p: Prescription, f: Formatting): string {
  const parts: string[] = [];

  if (p.segments !== undefined) {
    // The sets multiplier stays in front, so a four-set sequence still reads as
    // four of one thing rather than as one long instruction.
    const sequence = formatSegments(p.segments, f);
    parts.push(p.sets > 1 ? `${p.sets}× ${sequence}` : sequence);
  } else if (p.reps !== undefined) {
    parts.push(
      `${p.sets}×${formatRange(p.reps)}${p.perSide ? f.t("format.perSide") : ""}`,
    );
  } else if (p.durationSeconds !== undefined) {
    const duration = formatDuration(p.durationSeconds, f);
    parts.push(p.sets > 1 ? `${p.sets}×${duration}` : duration);
  } else {
    parts.push(f.t.plural("format.setCount", p.sets));
  }

  if (p.pose) parts.push(formatPose(p.pose, f));
  if (p.restSeconds !== undefined) {
    parts.push(f.t("format.rest", { seconds: p.restSeconds }));
  }

  return parts.join(" · ");
}

/**
 * Elapsed clock, e.g. 90000 → "1:30" and 5_400_000 → "1:30:00".
 *
 * Separate from `formatClock` because a countdown rounds *up* — a rest timer
 * should read 0:00 only when it's actually done — while time already spent
 * rounds down, so a session that started 59 seconds ago reads 0:59 rather than
 * claiming a minute it hasn't had.
 *
 * Digits and colons in every locale the app speaks, so neither clock needs one.
 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`;
}

/** Countdown clock, e.g. 90000 → "1:30". Rounds up so it hits 0:00 only at zero. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Program-level default shown in the routine header. */
export function formatDefaultPrescription(
  d: NonNullable<Routine["defaultPrescription"]>,
  { t }: Formatting,
): string {
  const parts: string[] = [];
  if (d.reps !== undefined) {
    parts.push(t("format.repsRange", { range: formatRange(d.reps) }));
  }
  if (d.sets !== undefined) parts.push(t.plural("format.setCount", d.sets));
  if (d.restSeconds !== undefined) {
    parts.push(t("format.rest", { seconds: d.restSeconds }));
  }
  return parts.join(", ");
}
