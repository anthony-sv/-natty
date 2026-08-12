import { z } from "zod";
import { movementSchema, type Movement } from "./schema";

/**
 * Canonical movements — the aggregation key for history, PRs and volume.
 *
 * Kept deliberately coarse: a movement is "the lift", and everything that
 * varies grip, stance, implement or laterality is an `Exercise` in
 * `exercises.ts` pointing back here. Adding a movement is a bigger decision
 * than adding a variant, because it splits a user's training history.
 */
// Authored shape, not parsed shape — `secondaryMuscles` has a schema default.
const raw: z.input<typeof movementSchema>[] = [
  // ── Chest ──────────────────────────────────────────────────────────────
  {
    id: "bench-press",
    name: "Bench press",
    pattern: "horizontal-press",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front-delts"],
  },
  {
    id: "incline-press",
    name: "Incline press",
    pattern: "incline-press",
    primaryMuscles: ["upper-chest"],
    secondaryMuscles: ["triceps", "front-delts"],
  },
  {
    id: "chest-fly",
    name: "Chest fly",
    pattern: "chest-fly",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front-delts"],
  },
  {
    id: "cable-chest-press",
    name: "Cable chest press",
    pattern: "horizontal-press",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front-delts"],
  },
  {
    id: "dip",
    name: "Dip",
    pattern: "horizontal-press",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front-delts"],
  },
  {
    id: "push-up",
    name: "Push-up",
    pattern: "horizontal-press",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["triceps", "front-delts"],
  },
  {
    id: "pullover",
    name: "Pullover",
    pattern: "pullover",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["chest"],
  },

  // ── Back ───────────────────────────────────────────────────────────────
  {
    id: "lat-pulldown",
    name: "Lat pulldown",
    pattern: "vertical-pull",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "upper-back"],
  },
  {
    id: "pull-up",
    name: "Pull-up",
    pattern: "vertical-pull",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["biceps", "upper-back"],
  },
  {
    id: "straight-arm-pulldown",
    name: "Straight-arm pulldown",
    pattern: "vertical-pull",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["triceps"],
  },
  {
    id: "t-bar-row",
    name: "T-bar row",
    pattern: "horizontal-pull",
    primaryMuscles: ["upper-back"],
    secondaryMuscles: ["lats", "biceps", "rear-delts"],
  },
  {
    id: "barbell-row",
    name: "Barbell row",
    pattern: "horizontal-pull",
    primaryMuscles: ["upper-back"],
    secondaryMuscles: ["lats", "biceps", "spinal-erectors"],
  },
  {
    id: "dumbbell-row",
    name: "Dumbbell row",
    pattern: "horizontal-pull",
    primaryMuscles: ["lats"],
    secondaryMuscles: ["upper-back", "biceps"],
  },
  {
    id: "cable-row",
    name: "Cable row",
    pattern: "horizontal-pull",
    primaryMuscles: ["upper-back"],
    secondaryMuscles: ["lats", "biceps"],
  },
  {
    id: "machine-row",
    name: "Machine row",
    pattern: "horizontal-pull",
    primaryMuscles: ["upper-back"],
    secondaryMuscles: ["lats", "biceps"],
  },
  {
    id: "back-extension",
    name: "Back extension",
    pattern: "spinal-extension",
    primaryMuscles: ["spinal-erectors"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },

  // ── Shoulders ──────────────────────────────────────────────────────────
  {
    id: "overhead-press",
    name: "Overhead press",
    pattern: "overhead-press",
    primaryMuscles: ["front-delts"],
    secondaryMuscles: ["side-delts", "triceps"],
  },
  {
    id: "lateral-raise",
    name: "Lateral raise",
    pattern: "lateral-raise",
    primaryMuscles: ["side-delts"],
    secondaryMuscles: [],
  },
  {
    id: "front-raise",
    name: "Front raise",
    pattern: "front-raise",
    primaryMuscles: ["front-delts"],
    secondaryMuscles: [],
  },
  {
    id: "rear-delt-fly",
    name: "Rear delt fly",
    pattern: "rear-delt",
    primaryMuscles: ["rear-delts"],
    secondaryMuscles: ["upper-back"],
  },
  {
    id: "face-pull",
    name: "Face pull",
    pattern: "rear-delt",
    primaryMuscles: ["rear-delts"],
    secondaryMuscles: ["upper-back", "traps"],
  },
  {
    id: "upright-row",
    name: "Upright row",
    pattern: "lateral-raise",
    primaryMuscles: ["side-delts"],
    secondaryMuscles: ["traps", "biceps"],
  },
  {
    id: "shrug",
    name: "Shrug",
    pattern: "shrug",
    primaryMuscles: ["traps"],
    secondaryMuscles: ["forearms"],
  },

  // ── Biceps ─────────────────────────────────────────────────────────────
  {
    id: "barbell-curl",
    name: "Barbell curl",
    pattern: "elbow-flexion",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
  },
  {
    id: "dumbbell-curl",
    name: "Dumbbell curl",
    pattern: "elbow-flexion",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
  },
  {
    id: "hammer-curl",
    name: "Hammer curl",
    pattern: "elbow-flexion",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
  },
  {
    id: "preacher-curl",
    name: "Preacher curl",
    pattern: "elbow-flexion",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
  },
  {
    id: "cable-curl",
    name: "Cable curl",
    pattern: "elbow-flexion",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
  },

  // ── Triceps ────────────────────────────────────────────────────────────
  {
    id: "triceps-pushdown",
    name: "Triceps pushdown",
    pattern: "elbow-extension",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    id: "skull-crusher",
    name: "Skull crusher",
    pattern: "elbow-extension",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    id: "overhead-triceps-extension",
    name: "Overhead triceps extension",
    pattern: "elbow-extension",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },
  {
    id: "triceps-kickback",
    name: "Triceps kickback",
    pattern: "elbow-extension",
    primaryMuscles: ["triceps"],
    secondaryMuscles: [],
  },

  // ── Legs ───────────────────────────────────────────────────────────────
  {
    id: "squat",
    name: "Squat",
    pattern: "squat",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings", "spinal-erectors"],
  },
  {
    id: "hack-squat",
    name: "Hack squat",
    pattern: "squat",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },
  {
    id: "leg-press",
    name: "Leg press",
    pattern: "squat",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },
  {
    id: "leg-extension",
    name: "Leg extension",
    pattern: "knee-extension",
    primaryMuscles: ["quads"],
    secondaryMuscles: [],
  },
  {
    id: "lunge",
    name: "Lunge",
    pattern: "lunge",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes", "hamstrings"],
  },
  {
    id: "split-squat",
    name: "Split squat",
    pattern: "lunge",
    primaryMuscles: ["quads"],
    secondaryMuscles: ["glutes"],
  },
  {
    id: "leg-curl",
    name: "Leg curl",
    pattern: "knee-flexion",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["calves"],
  },
  {
    id: "romanian-deadlift",
    name: "Romanian deadlift",
    pattern: "hinge",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "spinal-erectors"],
  },
  {
    id: "calf-raise",
    name: "Calf raise",
    pattern: "calf-raise",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },

  // ── Hips ───────────────────────────────────────────────────────────────
  // The only movements in the library that make glutes or adductors *primary*.
  // Everything above works them constantly and never on purpose, which is
  // exactly what `muscleGaps` was reporting as `never-direct` — a hole nothing
  // in the library could fill until these landed.
  {
    id: "hip-thrust",
    name: "Hip thrust",
    pattern: "hip-extension",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "quads"],
  },
  {
    id: "glute-bridge",
    name: "Glute bridge",
    pattern: "hip-extension",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
  },
  {
    id: "glute-kickback",
    name: "Glute kickback",
    pattern: "hip-extension",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
  },
  {
    id: "hip-abduction",
    name: "Hip abduction",
    pattern: "hip-abduction",
    primaryMuscles: ["glutes"],
    secondaryMuscles: [],
  },
  {
    id: "hip-adduction",
    name: "Hip adduction",
    pattern: "hip-adduction",
    primaryMuscles: ["adductors"],
    secondaryMuscles: [],
  },

  // ── Core ───────────────────────────────────────────────────────────────
  // The last muscle the gaps card reported as `never-direct`. Nothing in the
  // library made abs primary until this — every ab contraction came as a
  // by-product of squatting and pressing.
  {
    id: "ab-crunch",
    name: "Ab crunch",
    pattern: "spinal-flexion",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },

  // ── Conditioning ───────────────────────────────────────────────────────
  {
    id: "steady-state-cardio",
    name: "Steady-state cardio",
    pattern: "cardio",
    primaryMuscles: [],
    secondaryMuscles: [],
  },
];

export const movements: Movement[] = raw.map((m) => movementSchema.parse(m));
