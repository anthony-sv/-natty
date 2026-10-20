import { ex, orElse } from "./authoring";
import type { ExerciseEntry } from "./schema";

/**
 * The six sessions both evidence-based PPL programs run — `ppl-x2-program`
 * back to back over a week, `ppl-rolling-program` five a week so the rotation
 * drifts across the calendar. One copy, because two would drift, and the
 * one that drifted would be whichever program nobody checked.
 *
 * Unlike every other file in this directory these aren't transcribed from a
 * source doc. They're written against the hypertrophy literature, and the
 * routine notes say which findings each choice leans on:
 *
 * - Every muscle twice a week, roughly 10-20 direct sets a week (volume
 *   dose-response with diminishing returns; frequency mostly as a way to
 *   spread that volume).
 * - Lifts that load the muscle in its stretched position where a choice
 *   exists: incline press, cable fly, overhead triceps extension, incline
 *   cable curl, seated leg curl, deep squats, RDLs, cable pullover.
 * - Leg extension stays in because squats barely grow the rectus femoris;
 *   seated leg curl because it outgrew the lying one for the biarticular
 *   hamstrings; standing calf raise because it outgrew the seated one.
 * - Push A leads with chest (incline first, while fresh — upper chest is the
 *   part most physiques lag); Push B leads with shoulders and is where the
 *   front raise lives, since pressing alone is the front delts' only other
 *   direct work.
 * - Step-ups rank highest for glute max activation in the EMG review, which
 *   is activation rather than growth — but they're also the one glute-primary
 *   lunge pattern in the library.
 * - Heavy compounds at 6-10 with long rests, isolation at 10-20 with short
 *   ones. Rep range matters far less than proximity to failure.
 */

const ARMS_SUPERSET = { id: "pull-b-forearms" };

export const PUSH_A: ExerciseEntry[] = [
  ex("Incline barbell bench press", [6, 8], 3, 180),
  ex("Flat dumbbell press", [8, 10], 3, 150),
  ex("Chest dip", [8, 12], 2, 120),
  ex("Cable fly", [10, 15], 3, 90),
  ex("Cable lateral raise", [12, 15], 3, 60),
  ex("Rope overhead triceps extension", [10, 12], 3, 90),
  ex("Rope triceps pushdown", [10, 15], 2, 60),
];

export const PULL_A: ExerciseEntry[] = [
  orElse(ex("Wide-grip pull-up", [6, 10], 3, 150), "Wide-grip lat pulldown"),
  ex("Low cable row (V-bar)", [8, 12], 3, 120),
  ex("Cable pullover", [12, 15], 2, 90),
  ex("Reverse fly machine", [12, 15], 3, 60),
  ex("Standing incline cable curl", [10, 12], 3, 90),
  ex("Rope hammer curl", [10, 15], 2, 60),
  ex("Weighted hyperextension", [10, 15], 2, 90),
];

export const LEGS_A: ExerciseEntry[] = [
  orElse(ex("Barbell back squat", [6, 8], 3, 180), "Hack squat"),
  ex("Barbell stiff-leg deadlift", [8, 10], 3, 150),
  ex("Leg extension", [10, 15], 3, 90),
  ex("Seated leg curl", [10, 12], 3, 90),
  ex("Standing calf raise", [8, 12], 4, 90),
  ex("Seated hip abduction machine", [15, 20], 2, 60),
  ex("Hanging leg raise", [10, 15], 3, 60),
];

export const PUSH_B: ExerciseEntry[] = [
  orElse(
    ex("Dumbbell shoulder press", [6, 10], 3, 150),
    "Machine shoulder press (neutral grip)",
  ),
  ex("Incline smith machine bench press", [8, 10], 3, 150),
  ex("Seated dumbbell lateral raise", [12, 20], 4, 60),
  ex("Incline dumbbell front raise", [10, 15], 2, 60),
  ex("Pec deck (open hand)", [12, 15], 2, 90),
  ex("EZ-bar skull crusher", [8, 12], 3, 90),
  ex("Decline reverse crunch", [10, 15], 3, 60),
];

export const PULL_B: ExerciseEntry[] = [
  ex("Shoulder-width T-bar row", [6, 10], 3, 150),
  ex("Reverse-grip lat pulldown", [8, 12], 3, 120),
  ex("Single-arm dumbbell row", [8, 12], 2, 90, { perSide: true }),
  ex("Cable face pull", [12, 15], 3, 60),
  ex("Dumbbell shrug", [10, 15], 3, 60),
  ex("EZ-bar preacher curl", [8, 12], 3, 90),
  { ...ex("Seated dumbbell wrist curl", [15, 20], 2, 60), group: ARMS_SUPERSET },
  {
    ...ex("Seated dumbbell reverse wrist curl", [15, 20], 2, 60),
    group: ARMS_SUPERSET,
  },
];

export const LEGS_B: ExerciseEntry[] = [
  ex("Hack squat", [8, 10], 4, 150),
  ex("Barbell hip thrust", [8, 12], 3, 120),
  ex("Dumbbell step-up", [8, 12], 2, 120, { perSide: true }),
  ex("Lying leg curl", [10, 12], 3, 90),
  ex("Seated hip adduction machine", [12, 15], 2, 60),
  ex("Seated calf raise", [12, 15], 3, 60),
  {
    ...ex("Plank", 1, 3, 60),
    prescriptions: [{ sets: 3, durationSeconds: [30, 60], restSeconds: 60 }],
  },
];

/** The rotation in order — what a rolling schedule walks through. */
export const PPL_ROTATION: Array<{ label: string; exercises: ExerciseEntry[] }> = [
  { label: "Push A", exercises: PUSH_A },
  { label: "Pull A", exercises: PULL_A },
  { label: "Legs A", exercises: LEGS_A },
  { label: "Push B", exercises: PUSH_B },
  { label: "Pull B", exercises: PULL_B },
  { label: "Legs B", exercises: LEGS_B },
];

/**
 * Shared by both programs. Plain English sentences; `names.text` carries the
 * Spanish, keyed on these exact strings.
 */
export const PPL_NOTES = [
  "Built from the hypertrophy research rather than one coach's method: every muscle twice a week, about 10-20 hard sets per muscle per week.",
  "Take every working set to 0-3 reps short of failure. Rep range matters much less than effort — anything from 6 to 20 grows muscle when the set is hard.",
  "Exercises that load the muscle at long lengths were picked where there was a choice: incline press, cable fly, overhead triceps extension, incline curls, seated leg curl, deep squats and RDLs.",
  "Leg extension stays because squats barely grow the rectus femoris. Seated leg curl beat lying curls for hamstring growth, and standing calf raises beat seated ones.",
  "Add reps until you hit the top of the range on every set, then add weight. Deload for a week every 6-8 weeks or when performance stalls.",
];
