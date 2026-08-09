import { routineSchema, type Routine } from "./schema";
import { cardio, day, ex, finisher, ramp, restDay, withModifiers } from "./authoring";
import type { ExerciseEntry } from "./schema";

// Title default: (3, 120s) — 3 sets, 120s rest for regular accessory work.
// Each day's compound lift is a 2-phase ramp: 2 sets @ 10-12 reps/90s rest,
// then 2 more sets @ 8-12 reps/120s rest — spelled out as nested sub-lists in
// week 1, then condensed onto one comma-packed line in weeks 2-4 (same
// numbers, just formatted differently in the source).
//
// Several finisher sets in weeks 2-4 lose their label and cue in the source
// (the last accessory line before the day's cardio note) — this is
// corroborated by the same exercise appearing as an explicit finisher, with
// the same cue, elsewhere in this program family. Cues below for those are
// inferred from that cross-document pattern, not guessed blind.

const ACC_SETS = 3;
const ACC_REST = 120;

function acc(name: string, reps: [number, number] = [8, 12]): ExerciseEntry {
  return ex(name, reps, ACC_SETS, ACC_REST);
}

function heavyRamp(name: string): ExerciseEntry {
  return ramp(name, [
    { sets: 2, reps: [10, 12], restSeconds: 90 },
    { sets: 2, reps: [8, 12], restSeconds: 120 },
  ]);
}

const CARDIO_20MIN = () => cardio("Low-intensity steady-state cardio", 1200);

const raw: Routine = {
  slug: "big-wheels-program",
  name: "Big Wheels Program",
  defaultPrescription: { sets: ACC_SETS, restSeconds: ACC_REST },
  weeks: [
    {
      weekNumber: 1,
      days: [
        day(1, "Chest", [
          heavyRamp("Flat db press"),
          acc("Incline Db neutral grip press"),
          acc("Incline bench Db flyes"),
          acc("Chest dips"),
          finisher("Cable crossover (Middle)", "most muscular", [8, 12]),
          CARDIO_20MIN(),
        ]),
        day(2, "Legs", [
          ex("Walking lunges", [10, 12], 2, 90),
          acc("45° Leg press"),
          acc("Smith machine BSS"),
          acc("Db straight leg deadlift"),
          acc("Lying leg curls"),
          finisher("Leg extension", "quad flex", [8, 12]),
          acc("Seated calf raise"),
          acc("Standing calf raise"),
        ]),
        day(3, "Back", [
          heavyRamp("Lat pulldown (Wide)"),
          acc("Overhand bent over barbell rows"),
          acc("Db rows on incline bench", [8, 12]),
          acc("Cable pulldowns (Rope)"),
          acc("Hyperextension"),
          CARDIO_20MIN(),
        ]),
        day(4, "Arms", [
          heavyRamp("Close grip barbell bench press"),
          acc("Cable tricep pushdowns (Rope)"),
          acc("Machine dips (Triceps)"),
          acc("Standing barbell curls"),
          acc("Standing hammer curls"),
          acc("Waiter curls"),
          CARDIO_20MIN(),
        ]),
        day(5, "Shoulders/Traps/Quads", [
          withModifiers(heavyRamp("Smith machine shoulder press"), {
            forcedReps: true,
          }),
          acc("Front raises (Plate)"),
          ex("Single arm cable lateral raise", [8, 12], ACC_SETS, ACC_REST, {
            perSide: true,
          }),
          acc("Reverse fly machine"),
          acc("Smith machine shoulder shrugs"),
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Barbell squat"),
          acc("Hack squats (Narrow)"),
          acc("Leg extension"),
        ]),
        day(6, "Hamstrings/Calves", [
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Db straight leg deadlift"),
          acc("Seated leg curls"),
          acc("Lying leg curls"),
          acc("Standing calf raise"),
          acc("Seated calf raise"),
          CARDIO_20MIN(),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 2,
      days: [
        day(1, "Chest", [
          heavyRamp("Incline smith machine bench press"),
          acc("Flat db press"),
          acc("Incline bench db flyes"),
          acc("Chest dips"),
          finisher("Flat machine chest press", "most muscular", [8, 12]),
          CARDIO_20MIN(),
        ]),
        day(2, "Legs", [
          ex("Walking lunges", [10, 12], 2, 90),
          ramp("Seated leg curls", [
            { sets: 2, reps: [10, 12], restSeconds: 90 },
            { sets: 2, reps: [8, 12], restSeconds: 120 },
          ]),
          acc("Db straight leg deadlift"),
          acc("Smith machine BSS"),
          acc("Db squats"),
          finisher("Leg extension", "quad flex", [8, 12]),
          acc("Calf extension machine (Toes out)"),
          acc("Seated calf raise"),
        ]),
        day(3, "Back", [
          heavyRamp("Overhand bent over barbell row"),
          acc("Lat pulldown wide"),
          acc("Db pullover"),
          finisher("Machine mid row (Neutral grip)", "rear lat spread", [8, 12]),
          acc("Hyperextension"),
          CARDIO_20MIN(),
        ]),
        day(4, "Arms", [
          heavyRamp("Close grip barbell bench press"),
          acc("Db kickback palms down"),
          acc("Cable reverse pushdown"),
          acc("Standing db bicep curls"),
          acc("Standing ez bar reverse curls"),
          finisher("Front double bicep cable curls", "back double biceps", [8, 12]),
          CARDIO_20MIN(),
        ]),
        day(5, "Shoulders/Traps/Quads", [
          heavyRamp("Machine shoulder press (Neutral grip)"),
          acc("Standing db front raises (Overhand)"),
          ex("Single arm cable lateral raise", [8, 12], ACC_SETS, ACC_REST, {
            perSide: true,
          }),
          acc("Seated bent over lateral raises (Overhand)"),
          acc("Db shrugs"),
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Power squat super squat"),
          acc("Hack squat sumo"),
          acc("Leg extension (Toes pointed)"),
        ]),
        day(6, "Hamstrings/Calves", [
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Db straight leg deadlift"),
          acc("Seated leg curls"),
          acc("Lying leg curls"),
          acc("Standing calf raise"),
          acc("Seated calf raise"),
          CARDIO_20MIN(),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 3,
      days: [
        day(1, "Chest", [
          heavyRamp("Flat db press"),
          acc("Incline smith machine bench press"),
          acc("Chest dips"),
          acc("Incline db neutral grip press"),
          finisher("Pec deck open", "most muscular", [8, 12]),
          CARDIO_20MIN(),
        ]),
        day(2, "Legs", [
          ex("Walking lunges", [10, 12], 2, 90),
          heavyRamp("Leg extension"),
          acc("Lying leg curls"),
          acc("Barbell squat"),
          acc("Db straight leg deadlift"),
          finisher("Hack squat", "quad flex", [8, 12]),
          acc("Seated calf raise"),
          acc("Standing calf raise"),
          CARDIO_20MIN(),
        ]),
        day(3, "Back", [
          heavyRamp("Wide grip pull ups"),
          acc("Bent over barbell row (Underhand grip)"),
          acc("Machine mid row neutral"),
          finisher("Low cable row (V-bar)", "rear lat spread", [8, 12]),
          acc("Hyperextension"),
          CARDIO_20MIN(),
        ]),
        day(4, "Arms", [
          heavyRamp("Db seated overhead extension"),
          ex("Cable single arm reverse pushdown", [10, 12], ACC_SETS, ACC_REST, {
            perSide: true,
          }),
          finisher("Db skull crushers", "side tricep", [8, 12]),
          acc("Standing ez bar curls"),
          acc("Rope hammer curls"),
          finisher("Low cable curl (Straight bar)", "double biceps", [8, 12]),
          CARDIO_20MIN(),
        ]),
        day(5, "Shoulders/Traps/Quads", [
          withModifiers(heavyRamp("Seated dumbbell lateral raise"), { forcedReps: true, negatives: true, partials: true }),
          acc("Spider bench front raises (Overhand)"),
          withModifiers(acc("Smith machine shoulder press"), {
            forcedReps: true,
          }),
          acc("Reverse fly machine"),
          acc("Standing barbell upright rows"),
          ex("Walking lunges", [10, 12], 2, 90),
          acc("45° Leg press"),
          acc("Hack squat (Narrow)"),
          acc("Leg extension"),
        ]),
        day(6, "Hamstrings/Calves", [
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Seated leg curls"),
          acc("Db straight leg deadlift"),
          acc("Lying leg curls"),
          acc("Calf extension machine (Toes out)"),
          acc("Seated calf raise"),
          CARDIO_20MIN(),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 4,
      days: [
        day(1, "Chest", [
          heavyRamp("Incline db neutral grip press"),
          acc("Flat db press"),
          acc("Chest dips"),
          withModifiers(acc("Incline bench db flyes"), { forcedReps: true, negatives: true, partials: true }),
          withModifiers(
            finisher("Cable fly", "most muscular", [8, 12]),
            { ladder: ["abs height", "mid", "front"] },
          ),
          CARDIO_20MIN(),
        ]),
        day(2, "Legs", [
          ex("Walking lunges", [10, 12], 2, 90),
          ramp("Lying leg curls", [
            { sets: 2, reps: [10, 12], restSeconds: 90 },
            { sets: 2, reps: [8, 12], restSeconds: 120 },
          ]),
          acc("Leg extension"),
          acc("Power squat super squat"),
          acc("Smith machine BSS"),
          finisher("Hack squat (Narrow)", "quad flex", [8, 12]),
          acc("Calf extension machine (Toes in)"),
          acc("Seated calf raise"),
        ]),
        day(3, "Back", [
          heavyRamp("Lat pulldown wide"),
          acc("Bent over barbell row (Underhand grip)"),
          acc("Bent over T-bar rows (Shoulder-width grip)"),
          finisher("Machine mid row (Neutral grip)", "rear lat spread", [8, 12]),
          acc("Hyperextension"),
          CARDIO_20MIN(),
        ]),
        day(4, "Arms", [
          heavyRamp("Close grip barbell bench press"),
          ex("Cable single arm reverse pushdown", [8, 12], ACC_SETS, ACC_REST, {
            perSide: true,
          }),
          acc("Machine dips"),
          acc("Standing db bicep curls together"),
          acc("Rope hammer curls"),
          finisher("Waiter curls", "back double biceps", [8, 12]),
          CARDIO_20MIN(),
        ]),
        day(5, "Shoulders/Traps/Quads", [
          heavyRamp("Seated barbell shoulder press"),
          withModifiers(acc("Incline dumbbell front raise"), { ladder: ["low", "mid", "full"] }),
          finisher("Machine shoulder press (Neutral grip)", "most muscular", [8, 12]),
          acc("Seated bent over lateral raises (Overhand)"),
          acc("Db shrugs"),
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Barbell squat"),
          acc("Hack squat sumo"),
          withModifiers(acc("Leg extension"), { partials: true }),
        ]),
        day(6, "Hamstrings/Calves", [
          ex("Walking lunges", [10, 12], 2, 90),
          acc("Db straight leg deadlift"),
          acc("Seated leg curls"),
          acc("Lying leg curls"),
          acc("Calf extension machine (Toes out)"),
          acc("Seated calf raise"),
          CARDIO_20MIN(),
        ]),
        restDay(7),
      ],
    },
  ],
};

export const bigWheelsProgram: Routine = routineSchema.parse(raw);
