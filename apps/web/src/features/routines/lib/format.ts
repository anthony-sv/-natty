import type { Prescription, Routine } from "@/data/routines";

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

  if (p.cue) parts.push(p.cue);
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
