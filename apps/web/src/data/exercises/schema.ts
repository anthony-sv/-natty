import { z } from "zod";

/**
 * Muscles are coarse on purpose — enough to compute per-muscle volume and to
 * suggest substitutes, not an anatomy textbook. Cardio movements have none.
 */
export const muscleSchema = z.enum([
  "chest",
  "upper-chest",
  "lats",
  "upper-back",
  "traps",
  "front-delts",
  "side-delts",
  "rear-delts",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "adductors",
  "calves",
  "spinal-erectors",
  "abs",
]);
export type MuscleId = z.infer<typeof muscleSchema>;

/**
 * The mechanical pattern a movement belongs to. Two exercises sharing a
 * pattern are plausible substitutes for each other even across movements
 * (a hack squat for a leg press); two sharing a *movement* are the same lift.
 */
export const movementPatternSchema = z.enum([
  "horizontal-press",
  "incline-press",
  "overhead-press",
  "chest-fly",
  "vertical-pull",
  "horizontal-pull",
  "pullover",
  "lateral-raise",
  "front-raise",
  "rear-delt",
  "shrug",
  "elbow-flexion",
  "elbow-extension",
  "squat",
  "hinge",
  "lunge",
  "knee-extension",
  "knee-flexion",
  "calf-raise",
  "spinal-extension",
  "cardio",
]);
export type MovementPattern = z.infer<typeof movementPatternSchema>;

/**
 * How a variant is executed. These are *metadata for querying* — filtering
 * ("all narrow-stance quad work"), grouping, and substitution by facet
 * distance. They are deliberately NOT used to generate display names:
 * generated names read like robot output, so `Exercise.name` stays curated.
 *
 * Every facet here is drawn from a parenthetical that actually appears in
 * `data/routines/`; don't add speculative ones.
 */
export const facetsSchema = z.object({
  /** What you hold or sit in. */
  implement: z
    .enum([
      "barbell",
      "dumbbell",
      "cable",
      "machine",
      "smith",
      "ez-bar",
      "t-bar",
      "plate",
      "bodyweight",
    ])
    .optional(),
  /** Pulley position. "Low cable row", "Cable crossover (Middle)". */
  pulleyHeight: z.enum(["low", "middle", "high"]).optional(),
  /** Cable/machine handle. "Low cable row (Mag grip)", "…(V-bar)". */
  attachment: z
    .enum([
      "rope",
      "straight-bar",
      "v-bar",
      "cambered-bar",
      "mag-grip",
      "wide-bar",
      "single-handle",
    ])
    .optional(),
  /** Forearm rotation. "open-hand" is the thumbless pec-deck cue. */
  grip: z.enum(["pronated", "supinated", "neutral", "open-hand"]).optional(),
  gripWidth: z.enum(["close", "shoulder", "wide"]).optional(),
  stance: z
    .enum(["narrow", "shoulder", "wide", "sumo", "staggered", "single-leg"])
    .optional(),
  posture: z
    .enum([
      "standing",
      "seated",
      "lying",
      "incline",
      "decline",
      "bent-over",
      "prone",
      "spider",
    ])
    .optional(),
  /** "45° Leg press". */
  angleDegrees: z.number().int().positive().optional(),
  laterality: z.enum(["bilateral", "unilateral", "alternating"]).optional(),
  /** Limb orientation cues: "(Toes in)", "(Pinky up)", "(Toes pointed)". */
  orientation: z
    .enum([
      "toes-in",
      "toes-out",
      "toes-pointed",
      "pinky-up",
      "palms-down",
      "arms-together",
    ])
    .optional(),
});
export type Facets = z.infer<typeof facetsSchema>;

/**
 * The canonical identity of a lift. This is the key that history, PRs and
 * per-muscle volume should aggregate on — every grip/stance/implement variant
 * of a lat pulldown rolls up to one `lat-pulldown` movement.
 */
export const movementSchema = z.object({
  id: z.string(),
  name: z.string(),
  pattern: movementPatternSchema,
  primaryMuscles: z.array(muscleSchema),
  secondaryMuscles: z.array(muscleSchema).default([]),
});
export type Movement = z.infer<typeof movementSchema>;

/**
 * A variant people actually perform and name. One row per distinct thing a
 * routine can prescribe; `aliases` carries every spelling seen in the wild so
 * existing routine data resolves without being rewritten.
 */
export const exerciseSchema = z.object({
  id: z.string(),
  movementId: z.string(),
  /** Curated display name. Also matched as an alias — don't repeat it below. */
  name: z.string(),
  /** Every other spelling that should resolve here. Matched case/punctuation-insensitively. */
  aliases: z.array(z.string()).default([]),
  facets: facetsSchema.default({}),
  /** Set only when the variant genuinely shifts emphasis off the movement's default. */
  muscleOverride: z
    .object({
      primaryMuscles: z.array(muscleSchema),
      secondaryMuscles: z.array(muscleSchema).default([]),
    })
    .optional(),
  /**
   * The source routine name was ambiguous and this mapping is a judgment call.
   * Surfaced by `exercisesNeedingReview()` so it can be settled deliberately
   * rather than silently inherited.
   */
  needsReview: z.boolean().default(false),
  notes: z.string().optional(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

/** Resolved primary/secondary muscles for an exercise, applying any override. */
export function musclesFor(
  exercise: Exercise,
  movement: Movement,
): { primaryMuscles: MuscleId[]; secondaryMuscles: MuscleId[] } {
  return (
    exercise.muscleOverride ?? {
      primaryMuscles: movement.primaryMuscles,
      secondaryMuscles: movement.secondaryMuscles,
    }
  );
}
