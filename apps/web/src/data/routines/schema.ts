import { z } from "zod";

/** A single number, or an inclusive [min, max] range (e.g. "8-12 reps", "20-30 seconds"). */
const numberOrRange = z.union([
  z.number().int().positive(),
  z.tuple([z.number().int().positive(), z.number().int().positive()]),
]);
const repRange = numberOrRange;

/**
 * One prescription for an exercise. Most exercises have exactly one; a
 * ramp/pyramid structure (e.g. 2 sets @ 10-12 reps/90s rest, then 2 more sets
 * @ 8-12 reps/120s rest) is represented as multiple prescriptions in order.
 */
export const prescriptionSchema = z.object({
  sets: z.number().int().positive(),
  /** Omitted for pure-duration items (a stretch hold, a cardio block). */
  reps: repRange.optional(),
  /** Stretch hold, cardio duration, dead hang — a duration instead of reps. */
  durationSeconds: numberOrRange.optional(),
  restSeconds: z.number().int().nonnegative().optional(),
  /** Posing/flex cue shown instead of (or alongside) rest on a finisher set: "most muscular", "quad flex". */
  cue: z.string().optional(),
  /** Reps/duration figure is per side (e.g. single-arm rows). */
  perSide: z.boolean().optional(),
});
export type Prescription = z.infer<typeof prescriptionSchema>;

export const exerciseEntrySchema = z.object({
  name: z.string(),
  kind: z.enum(["resistance", "cardio", "mobility", "stretch"]),
  /** Finisher set: high reps, short rest, a posing cue. */
  isFinisher: z.boolean().default(false),
  prescriptions: z.array(prescriptionSchema).min(1),
  notes: z.string().optional(),
});
export type ExerciseEntry = z.infer<typeof exerciseEntrySchema>;

export const trainingDaySchema = z.object({
  /** Preserves the source doc's numbering, including rest days. */
  dayNumber: z.number().int().positive(),
  /** "Chest", "Back/Biceps", "Shoulders/Traps/Quads", ... */
  label: z.string(),
  isRest: z.boolean().default(false),
  exercises: z.array(exerciseEntrySchema).default([]),
  /** Warmup section slugs, resolved by muscle group at authoring time. */
  warmupRefs: z.array(z.string()).default([]),
});
export type TrainingDay = z.infer<typeof trainingDaySchema>;

export const trainingWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  days: z.array(trainingDaySchema),
});
export type TrainingWeek = z.infer<typeof trainingWeekSchema>;

export const routineSchema = z.object({
  slug: z.string(),
  name: z.string(),
  /** Who this program is attributed to/sourced from, if known. */
  source: z.string().optional(),
  /** Training style/methodology label, if any (e.g. "Push/Pull/Legs"). */
  style: z.string().optional(),
  goal: z.enum(["bulking", "cutting"]).optional(),
  /**
   * Display-only fallback shown in the program header (e.g. "Default: 8-12
   * reps, 3 sets, 90s rest"). Every exercise's own prescription is already
   * fully resolved at authoring time — nothing merges this at render time.
   */
  defaultPrescription: z
    .object({
      reps: repRange.optional(),
      sets: z.number().int().positive().optional(),
      restSeconds: z.number().int().nonnegative().optional(),
    })
    .optional(),
  weeks: z.array(trainingWeekSchema).min(1),
});
export type Routine = z.infer<typeof routineSchema>;

export const warmupMoveSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive().optional(),
  reps: repRange.optional(),
  durationSeconds: numberOrRange.optional(),
  perSide: z.boolean().optional(),
  purpose: z.string().optional(),
});
export type WarmupMove = z.infer<typeof warmupMoveSchema>;

export const warmupSectionSchema = z.object({
  slug: z.string(),
  title: z.string(),
  durationMinutes: numberOrRange.optional(),
  moves: z.array(warmupMoveSchema),
});
export type WarmupSection = z.infer<typeof warmupSectionSchema>;
