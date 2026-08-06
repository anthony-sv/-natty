import type { Prescription, Routine } from "@/data/routines";

function formatRange(value: number | [number, number]): string {
  return Array.isArray(value) ? `${value[0]}-${value[1]}` : `${value}`;
}

function formatDuration(value: number | [number, number]): string {
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
