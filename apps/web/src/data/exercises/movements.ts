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
  // A fly's wide, cross-body arc keeps the whole pec under stretch and load
  // through the rep, unlike a press's narrower bar path — so tilting the
  // bench biases it toward the clavicular head without handing it over the
  // way it does for a press. Chest stays primary; upper-chest rides along as
  // secondary, and the exercise is written and prescribed interchangeably
  // with the other chest flies (`chest-fly`) rather than as its own slot.
  {
    id: "incline-chest-fly",
    name: "Incline chest fly",
    pattern: "chest-fly",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["upper-chest", "front-delts"],
  },
  // A feet-elevated ("decline") push-up tilts the press angle *toward* the
  // head, not away from it — the opposite of what "decline" implies from
  // bench-press terminology, and mechanically the same shift incline press
  // makes. `feet-elevated-push-up` used to sit under plain `push-up`/`chest`.
  // Pattern follows that shift too, not just the muscle: it's the bodyweight
  // sibling of `incline-press`, not a second, separate upper-chest pattern —
  // left as `horizontal-press` once, it made the coverage card treat a plain
  // push-up variant as the only fix for a gap regular incline pressing
  // already closes.
  {
    id: "incline-push-up",
    name: "Incline (feet-elevated) push-up",
    pattern: "incline-press",
    primaryMuscles: ["upper-chest"],
    secondaryMuscles: ["triceps", "front-delts"],
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

  // ── Forearms ───────────────────────────────────────────────────────────
  // The one muscle `muscleGaps` could name but the library couldn't fix —
  // every other mention of forearms anywhere above is a secondary muscle
  // riding on a curl or a shrug. These are the first movements that make it
  // primary on purpose.
  {
    id: "wrist-curl",
    name: "Wrist curl",
    pattern: "wrist-flexion",
    primaryMuscles: ["forearms"],
    secondaryMuscles: [],
  },
  {
    id: "reverse-wrist-curl",
    name: "Reverse wrist curl",
    pattern: "wrist-extension",
    primaryMuscles: ["forearms"],
    secondaryMuscles: [],
  },
  // Lowest-confidence addition in the research pass this came from — the
  // evidence for a real, distinct third forearm pattern is thinner than
  // the rest (mostly trade sources, not peer-reviewed head-to-heads).
  // Included anyway; flagged here so it isn't mistaken for the same
  // confidence level as the rest of this section.
  {
    id: "farmers-carry",
    name: "Farmer's carry",
    pattern: "loaded-carry",
    primaryMuscles: ["forearms"],
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
    id: "step-up",
    name: "Step-up",
    pattern: "lunge",
    // Glute-primary, unlike `lunge`/`split-squat` just above — a step-up
    // drives through a fully extended hip at the top of the movement, which
    // is what tips the emphasis off the quad and onto the glute doing the
    // work of standing up.
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["quads", "hamstrings"],
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
  // `nordic-curl` the exercise used to sit under `leg-curl` — a concentric,
  // machine-driven pattern that a bodyweight eccentric-only movement doesn't
  // actually belong to. See the `nordic-curl` pattern's own comment.
  {
    id: "nordic-hamstring-curl",
    name: "Nordic hamstring curl",
    pattern: "nordic-curl",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["calves"],
  },
  {
    id: "calf-raise",
    name: "Calf raise",
    pattern: "calf-raise",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },
  // `seated-calf-raise` the exercise used to sit under plain `calf-raise` —
  // see the `seated-calf-raise` pattern's own comment for why the bent-knee
  // version is split out.
  {
    id: "bent-knee-calf-raise",
    name: "Seated (bent-knee) calf raise",
    pattern: "seated-calf-raise",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
  },

  // ── Hips ───────────────────────────────────────────────────────────────
  // Glutes and adductors are primary here — and on `step-up` above, grouped
  // with `lunge`/`split-squat` instead since it shares their pattern.
  // Everything else works them constantly and never on purpose, which is
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
  // Research pass finding: wide-stance squats/lunges don't meaningfully
  // train adductors despite the folk wisdom that they do — dedicated
  // adduction work activates them far more. Copenhagen plank is the
  // well-studied (soccer injury-prevention literature) exception: a
  // genuinely different, closed-chain, eccentric, bodyweight loading
  // strategy the two machine/cable exercises above don't cover. Same
  // `hip-adduction` pattern — the joint action is identical, only the
  // loading strategy differs, so this is a movement addition, not a
  // pattern one.
  {
    id: "copenhagen-plank",
    name: "Copenhagen plank",
    pattern: "hip-adduction",
    primaryMuscles: ["adductors"],
    secondaryMuscles: ["abs"],
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
  // Added via the routine coverage card's variety section, not the muscle
  // gaps card — abs was already directly trainable via `ab-crunch`, just
  // with only one pattern in the whole catalog. See CLAUDE.md's "Coverage
  // passes" section.
  {
    id: "plank-hold",
    name: "Plank",
    pattern: "core-stability",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  {
    id: "ab-wheel-rollout",
    name: "Ab wheel rollout",
    pattern: "core-stability",
    primaryMuscles: ["abs"],
    secondaryMuscles: [],
  },
  // See the `anti-rotation` pattern's own comment. Resisting rotation is an
  // oblique job, not a rectus-abdominis one — obliques primary, abs
  // secondary for the bracing. Not `abs`-primary like `ab-crunch`/
  // `plank-hold`: crediting anti-rotation/anti-lateral-flexion/rotation work
  // to plain `abs` was flagging a routine as "missing abs variety" over
  // patterns that are really an oblique-training decision most lifters make
  // on purpose (a bigger waist isn't the goal for most physiques), not a gap
  // in their ab training.
  {
    id: "pallof-press",
    name: "Pallof press",
    pattern: "anti-rotation",
    primaryMuscles: ["obliques"],
    secondaryMuscles: ["abs"],
  },
  // See the `anti-lateral-flexion` pattern's own comment, and `pallof-press`
  // just above for why this is obliques-primary rather than abs-primary.
  // Covers both the plain bodyweight hold and the loaded suitcase-carry
  // variant — the latter gets a `muscleOverride` on its own exercise entry
  // for the added forearms grip demand, since a static hold and a loaded
  // carry aren't equally forearm-taxing.
  {
    id: "side-plank",
    name: "Side plank",
    pattern: "anti-lateral-flexion",
    primaryMuscles: ["obliques"],
    secondaryMuscles: ["abs"],
  },
  // See the `rotation` pattern's own comment, and `pallof-press` above for
  // why this is obliques-primary rather than abs-primary.
  {
    id: "trunk-rotation",
    name: "Trunk rotation",
    pattern: "rotation",
    primaryMuscles: ["obliques"],
    secondaryMuscles: ["abs"],
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
