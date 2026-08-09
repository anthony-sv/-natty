import { getExercise } from "@/data/exercises";
import { getPose } from "@/data/poses";
import type {
  ExerciseEntry,
  PoseCue,
  Prescription,
  Routine,
  SetModifiers,
} from "@/data/routines";

/**
 * What to call an exercise entry on screen — the library's curated name.
 *
 * The id fallback only fires if an entry points at an exercise that no longer
 * exists — `authoring.ts` throws on an unknown name, so it shouldn't happen,
 * but a dangling id should read as a visible id rather than an empty heading.
 */
export function exerciseDisplayName(entry: ExerciseEntry): string {
  return getExercise(entry.exerciseId)?.name ?? entry.exerciseId;
}

/** "or Machine shoulder press (neutral grip)" — the source's "/" alternatives. */
export function formatAlternatives(entry: ExerciseEntry): string | undefined {
  if (entry.orAlternatives.length === 0) return undefined;
  const names = entry.orAlternatives.map((id) => getExercise(id)?.name ?? id);
  return `or ${names.join(", or ")}`;
}

/** "Most muscular, 10s hold" — the pose closing a finisher set. */
export function formatPose(pose: PoseCue): string {
  const name = getPose(pose.poseId)?.name ?? pose.poseId;
  return pose.holdSeconds === undefined
    ? name
    : `${name}, ${pose.holdSeconds}s hold`;
}

/**
 * Short labels for the intensity techniques on a set, in a fixed order so the
 * same prescription always reads the same way.
 */
export function formatModifiers(modifiers: SetModifiers): string[] {
  const labels: string[] = [];
  if (modifiers.forcedReps) labels.push("Forced reps");
  if (modifiers.negatives) labels.push("Negatives");
  if (modifiers.partials) labels.push("Partials");
  if (modifiers.staticHolds) labels.push("Static holds");
  if (modifiers.ladder) {
    labels.push(`Ladder: ${modifiers.ladder.join(" → ")}`);
  }
  return labels;
}

export function formatRange(value: number | [number, number]): string {
  return Array.isArray(value) ? `${value[0]}-${value[1]}` : `${value}`;
}

export function formatDuration(value: number | [number, number]): string {
  if (Array.isArray(value)) return `${value[0]}-${value[1]}s`;
  return value % 60 === 0 ? `${value / 60} min` : `${value}s`;
}

/** One compact line describing a single prescription phase. */
export function formatPrescription(p: Prescription): string {
  const parts: string[] = [];

  if (p.reps !== undefined) {
    parts.push(`${p.sets}×${formatRange(p.reps)}${p.perSide ? "/side" : ""}`);
  } else if (p.durationSeconds !== undefined) {
    const label = p.sets > 1 ? `${p.sets}×${formatDuration(p.durationSeconds)}` : formatDuration(p.durationSeconds);
    parts.push(label);
  } else {
    parts.push(`${p.sets} sets`);
  }

  if (p.pose) parts.push(formatPose(p.pose));
  if (p.restSeconds !== undefined) parts.push(`${p.restSeconds}s rest`);

  return parts.join(" · ");
}

export function formatWeekLabel(weekNumber: number): string {
  return `Week ${weekNumber}`;
}

/** Countdown clock, e.g. 90000 → "1:30". Rounds up so it hits 0:00 only at zero. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Program-level default shown in the routine header, e.g. "8-12 reps, 3 sets, 90s rest". */
export function formatDefaultPrescription(
  d: NonNullable<Routine["defaultPrescription"]>,
): string {
  const parts: string[] = [];
  if (d.reps !== undefined) parts.push(`${formatRange(d.reps)} reps`);
  if (d.sets !== undefined) parts.push(`${d.sets} sets`);
  if (d.restSeconds !== undefined) parts.push(`${d.restSeconds}s rest`);
  return parts.join(", ");
}
