import { z } from "zod";

/** A single number, or an inclusive [min, max] range (e.g. "8-12 reps", "20-30 seconds"). */
const numberOrRange = z.union([
  z.number().int().positive(),
  z.tuple([z.number().int().positive(), z.number().int().positive()]),
]);
const repRange = numberOrRange;

/**
 * Intensity techniques applied to the sets of one prescription phase.
 *
 * These sit here rather than on the exercise because they're how a set is run,
 * not what the lift is: the same barbell curl is a different prescription with
 * negatives than without, and history for both should still roll up to one
 * exercise.
 *
 * Because a phase covers a run of sets, "drop set on the last set only" needs
 * no extra structure — split the exercise into two phases and put the modifier
 * on the second:
 *
 *   prescriptions: [
 *     { sets: 3, reps: [8, 12], restSeconds: 90 },
 *     { sets: 1, reps: [8, 12], restSeconds: 90, modifiers: { partials: true } },
 *   ]
 *
 * Only the techniques the routines actually prescribe are modelled. Adding
 * to-failure, drop sets, rest-pause or tempo is a field each — do it when a
 * routine needs one, not before.
 */
export const setModifiersSchema = z.object({
  /** Assisted reps past failure. */
  forcedReps: z.boolean().optional(),
  /** Emphasised or assisted eccentrics. */
  negatives: z.boolean().optional(),
  /** Partial-range reps, typically once full reps fail. */
  partials: z.boolean().optional(),
  /** Isometric holds during the set. */
  staticHolds: z.boolean().optional(),
  /**
   * One rep is several reps at different positions, named here in order — the
   * source docs' "ladder". A front raise ladder is ["low", "mid", "full"];
   * a cable fly ladder is ["abs height", "mid", "front"].
   */
  ladder: z.array(z.string()).min(2).optional(),
});
export type SetModifiers = z.infer<typeof setModifiersSchema>;

/**
 * The posing hold that closes a finisher set — "most muscular, 10 seconds".
 *
 * A reference into `data/poses`, not a free string, because the docs spell the
 * same pose several ways ("quad" / "Quad flex"). `holdSeconds` is separate from
 * the pose so it can vary: finisher sets are 10s throughout, but nothing about the
 * model assumes that.
 */
export const poseCueSchema = z.object({
  poseId: z.string(),
  /** Seconds to hold. Omitted means "strike the pose", no timed hold. */
  holdSeconds: z.number().int().positive().optional(),
});
export type PoseCue = z.infer<typeof poseCueSchema>;

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
  /** Posing/flex hold closing a finisher set. */
  pose: poseCueSchema.optional(),
  /** Reps/duration figure is per side (e.g. single-arm rows). */
  perSide: z.boolean().optional(),
  /** Intensity techniques for these sets. Absent means straight sets. */
  modifiers: setModifiersSchema.optional(),
});
export type Prescription = z.infer<typeof prescriptionSchema>;

export const exerciseEntrySchema = z.object({
  /**
   * Link into the exercise library (`data/exercises`) — the source of truth for
   * what this lift is. Resolved from the source-doc spelling at authoring time
   * by the helpers in `authoring.ts`, which throw on an unknown name.
   *
   * The spelling itself is not stored: it stays visible in the program files as
   * the argument to `ex(...)`, which is where the transcription audit trail
   * belongs. Use `exerciseDisplayName()` to render an entry.
   */
  exerciseId: z.string(),
  /**
   * Equally acceptable substitutes, in the source's own order — how the docs'
   * "Db shoulder press/machine" and "Smith machine/Hack squat" are modelled.
   * `exerciseId` is the one written first; these are the rest.
   */
  orAlternatives: z.array(z.string()).default([]),
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
