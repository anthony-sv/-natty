import { routineSchema, type ExerciseEntry, type Routine } from "./schema";
import { cardio, day, ex, finisher, orElse, ramp, restDay, withModifiers } from "./authoring";

// Weeks 1-4 use the source's flat-bullet format with no per-exercise
// numbers; its header note ("1 set is always 2 sets of 10-12, then 2 sets of
// 8-12") is the actual prescription for every regular exercise, applied here
// as a 2-phase ramp at the title's default 90s rest. Finisher lines give a
// cue but no numbers either — resolved via the finisher-set convention (7
// sets, 30s rest) and the 15-20 rep range that weeks 5-8 use for the same
// finishers.
//
// Weeks 5-8 switch to the source's fully explicit nested-numbered format
// (its own reps/rest/sets per exercise) — and turn out identical to the
// Cutting plan's weeks 5-8, an independent cross-check that both
// transcriptions read the source correctly.
function rampDefault(name: string): ExerciseEntry {
  return ramp(name, [
    { sets: 2, reps: [10, 12], restSeconds: 90 },
    { sets: 2, reps: [8, 12], restSeconds: 90 },
  ]);
}

const CARDIO_30MIN = () => cardio("Low-intensity steady-state cardio", 1800);

const raw: Routine = {
  slug: "bulking-program",
  name: "Bulking Plan",
  goal: "bulking",
  defaultPrescription: { reps: [8, 12], sets: 3, restSeconds: 90 },
  weeks: [
    {
      weekNumber: 1,
      days: [
        day(1, "Chest", [
          rampDefault("Flat smith machine chest press"),
          rampDefault("Incline barbell bench press"),
          rampDefault("Incline bench db flyes"),
          rampDefault("Chest dips"),
          finisher("Cable crossover (Middle)", "most muscular"),
        ]),
        day(2, "Back", [
          rampDefault("Lat pulldown (Wide grip)"),
          rampDefault("Overhand bent over barbell rows"),
          rampDefault("Db rows incline bench"),
          finisher("Cable pulldowns (Rope)", "back double biceps"),
          rampDefault("Hyperextension"),
        ]),
        day(3, "Shoulder/Traps", [
          rampDefault("Db shoulder press"),
          rampDefault("Front raises (Plate)"),
          rampDefault("Seated bent over lateral raises (Overhand)"),
          finisher("Single arm cable lateral raise", "most muscular"),
          rampDefault("Standing barbell shrugs"),
        ]),
        restDay(4),
        day(5, "Legs", [
          rampDefault("Leg extension"),
          rampDefault("Db straight leg deadlift"),
          rampDefault("45° Leg press"),
          rampDefault("Barbell squat"),
          finisher("Lying leg curls", "quad flex"),
        ]),
        day(6, "Arms/Calves", [
          rampDefault("Close grip barbell bench press"),
          rampDefault("Cable tricep pushdowns (Rope)"),
          finisher("Machine dips (Triceps)", "side tricep"),
          rampDefault("Standing barbell curls"),
          rampDefault("Standing hammer curls"),
          finisher("Waiter curls", "back double biceps"),
          rampDefault("Standing calf raise"),
          finisher("Seated calf raise", "quad flex"),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 2,
      days: [
        day(1, "Chest", [
          rampDefault("Incline smith machine bench press"),
          rampDefault("Flat smith machine bench press"),
          rampDefault("Incline bench db flyes"),
          rampDefault("Chest dips"),
          finisher("Flat machine chest press", "side chest"),
        ]),
        day(2, "Back", [
          rampDefault("Overhand bent over barbell rows"),
          rampDefault("Lat pulldown (Wide grip)"),
          rampDefault("Db pullover"),
          finisher("Machine mid row (Neutral grip)", "front lat spread"),
          rampDefault("Hyperextension"),
        ]),
        day(3, "Shoulder/Traps", [
          rampDefault("Machine shoulder press (Neutral grip)"),
          rampDefault("Standing db front raises (Overhand, arms together)"),
          rampDefault("Seated bent over lateral raises (Overhand)"),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          rampDefault("Db shrugs"),
        ]),
        restDay(4),
        day(5, "Legs", [
          rampDefault("Seated leg curls"),
          rampDefault("Standing single leg curl"),
          rampDefault("Walking lunges"),
          rampDefault("Db squats"),
          finisher("Leg extension", "quad"),
        ]),
        day(6, "Arms/Calves", [
          rampDefault("Close grip barbell bench press"),
          rampDefault("Db kickback palms down"),
          finisher("Cable reverse pushdown", "side tricep"),
          rampDefault("Db curls (Alternating)"),
          rampDefault("Standing EZ-bar reverse curls"),
          finisher("Front double bicep cable curls", "back double biceps"),
          rampDefault("Standing calf raise"),
          finisher("Seated calf raise", "quad flex"),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 3,
      days: [
        day(1, "Chest", [
          rampDefault("Flat barbell bench press"),
          rampDefault("Incline barbell bench press"),
          rampDefault("Chest dips"),
          rampDefault("Incline db neutral grip press"),
          finisher("Pec deck open", "most muscular"),
        ]),
        day(2, "Back", [
          rampDefault("Wide grip pull ups"),
          rampDefault("Bent over barbell rows (Underhand)"),
          rampDefault("Machine mid row neutral"),
          finisher("Low cable row (V-bar)", "rear lat spread"),
          rampDefault("Hyperextension"),
        ]),
        day(3, "Shoulder/Traps", [
          withModifiers(
            rampDefault("Seated dumbbell lateral raise"),
            { forcedReps: true, negatives: true, partials: true },
          ),
          rampDefault("Spider bench front raises (Overhand)"),
          rampDefault("Bent over db lateral raise (Overhand)"),
          finisher("Single arm cable lateral raise", "most muscular"),
          rampDefault("Standing barbell upright shrugs"),
        ]),
        restDay(4),
        day(5, "Legs", [
          rampDefault("Leg extension"),
          rampDefault("Lying leg curls"),
          rampDefault("Barbell squat"),
          rampDefault("Db straight leg deadlift"),
          finisher("Hack squat", "quad flex"),
        ]),
        day(6, "Arms/Calves", [
          rampDefault("Db seated overhead extension"),
          rampDefault("Cable single arm reverse pushdown"),
          finisher("Db skull crushers", "side tricep"),
          rampDefault("Standing ez bar curls"),
          rampDefault("Rope hammer curls"),
          finisher("Low cable curls (Straight bar)", "back double biceps"),
          rampDefault("Calf extension machine (Toes in)"),
          rampDefault("Calf extension machine (Toes out)"),
          finisher("Seated calf raise", "quad"),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 4,
      days: [
        day(1, "Chest", [
          rampDefault("Incline db neutral grip press"),
          rampDefault("Flat db press"),
          rampDefault("Chest dips"),
          withModifiers(rampDefault("Incline bench db flyes"), { forcedReps: true, negatives: true, partials: true }),
          finisher("Cable crossover (Middle)", "most muscular"),
        ]),
        day(2, "Back", [
          rampDefault("Lat pulldown wide"),
          rampDefault("Bent over barbell rows (Underhand)"),
          rampDefault("Bent over T-bar rows (Shoulder-width grip)"),
          finisher("Machine mid row (Neutral grip)", "rear lat spread"),
          rampDefault("Hyperextension"),
        ]),
        day(3, "Shoulder/Traps", [
          rampDefault("Seated barbell shoulder press"),
          withModifiers(
            rampDefault("Incline dumbbell front raise"),
            { ladder: ["low", "mid", "full"] },
          ),
          rampDefault("Seated bent over lateral raises (Overhand)"),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          rampDefault("Db shrugs"),
        ]),
        restDay(4),
        day(5, "Legs", [
          rampDefault("Lying leg curls"),
          rampDefault("Leg extension"),
          rampDefault("Standing single leg curl"),
          rampDefault("Power squat super squat"),
          rampDefault("Walking lunges"),
          finisher("Hack squat", "quad flex"),
        ]),
        day(6, "Arms/Calves", [
          rampDefault("Close grip barbell bench press"),
          rampDefault("Cable single arm reverse pushdown"),
          finisher("Machine dips (Triceps)", "side tricep"),
          rampDefault("Standing db bicep curls together"),
          rampDefault("Rope hammer curls"),
          finisher("Waiter curls", "back double biceps"),
          rampDefault("Calf extension machine (Toes in)"),
          rampDefault("Calf extension machine (Toes out)"),
          finisher("Seated calf raise", "quad"),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 5,
      days: [
        day(1, "Chest", [
          ex("Incline db neutral grip press", [12, 15], 4, 90),
          ex("Flat db press", [12, 15], 3, 120),
          ex("Pec deck (Open hand)", [12, 15], 3, 120),
          ex("Chest dips", [12, 15], 3, 120),
          finisher("Flat machine chest press", "most muscular"),
          CARDIO_30MIN(),
        ]),
        day(2, "Back", [
          ex("Bent over T-bar rows (V-bar grip)", [12, 15], 4, 90),
          ex("Db pullover", [12, 15], 3, 90),
          ex("Single arm db row", [12, 15], 3, 90, { perSide: true }),
          finisher("Machine mid row (Neutral grip)", "back double biceps"),
          ex("Hyperextension", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        day(3, "Shoulder/Traps", [
          ex("Db shoulder press", [12, 15], 4, 90),
          ex("Front raises (Steering wheels)", [12, 15], 3, 90),
          ex("Reverse fly machine", [12, 15], 3, 90),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          ex("Standing barbell shrugs", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        restDay(4),
        day(5, "Legs", [
          ex("Seated leg curls", [12, 15], 4, 90),
          ex("Db straight leg deadlift", [12, 15], 3, 90),
          ex("Walking lunges", [12, 15], 3, 90),
          ex("Hack squat sumo", [12, 15], 3, 90),
          finisher("Lying leg curls", "quad flex"),
          CARDIO_30MIN(),
        ]),
        day(6, "Arms/Calves", [
          ex("Db skull crushers", [12, 15], 4, 90),
          ex("Db kickback palms down", [12, 15], 3, 90),
          finisher("Cable reverse pushdown", "side tricep"),
          ex("Standing db curls (Alternating)", [12, 15], 3, 90),
          ex("Db hammer curls (Alternating)", [12, 15], 3, 90),
          finisher("Front double bicep cable curls", "back double biceps"),
          ex("Calf extension machine (Toes out)", [12, 15], 3, 90),
          ex("Standing calf raise", [12, 15], 3, 90),
          finisher("Seated calf raise", "quad flex"),
          CARDIO_30MIN(),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 6,
      days: [
        day(1, "Chest", [
          ex("Incline smith machine bench press", [12, 15], 4, 90),
          ex("Standing cable chest press", [9, 12], 3, 90),
          withModifiers(ex("Cable fly", [12, 15], 3, 90), { ladder: ["abs height", "mid", "front"] }),
          ex("Chest dips", [12, 15], 3, 90),
          finisher("Flat machine chest press", "side chest"),
          CARDIO_30MIN(),
        ]),
        day(2, "Back", [
          ex("Low cable row (Mag grip)", [12, 15], 4, 90),
          ex("Lat pulldown (Reverse grip)", [12, 15], 3, 90),
          ex("Cable face pulls", [12, 15], 3, 90),
          finisher("Machine mid row (Neutral grip)", "front lat spread"),
          ex("Hyperextension", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        day(3, "Shoulder/Traps", [
          ex("Seated barbell shoulder press", [12, 15], 4, 90),
          ex("Standing db front raised (Overhand, arms together)", [12, 15], 3, 90),
          ex("Seated bent over lateral raised (Overhand)", [12, 15], 3, 90),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          ex("Db shrugs", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        restDay(4),
        day(5, "Legs", [
          ex("Lying leg curls", [12, 15], 4, 90),
          ex("Db straight leg deadlift", [12, 15], 3, 90),
          ex("Power squat super squat", [12, 15], 3, 90),
          ex("Hack squat (Narrow stance)", [12, 15], 3, 90),
          finisher("Leg extension", "quad flex"),
          CARDIO_30MIN(),
        ]),
        day(6, "Arms/Calves", [
          ex("Close grip barbell bench press", [12, 15], 4, 90),
          ex("Db skull crushers", [12, 15], 3, 90),
          finisher("Machine dips (Triceps)", "side tricep"),
          ex("Standing db curls (Alternating)", [12, 15], 3, 90),
          ex("Preacher curl EZ-bar", [12, 15], 3, 90),
          finisher("Front double bicep cable curl", "back double biceps"),
          ex("Calf extension machine (Toes out)", [12, 15], 3, 90),
          ex("Standing calf raise", [12, 15], 3, 90),
          finisher("Seated calf raise", "quad flex"),
          CARDIO_30MIN(),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 7,
      days: [
        day(1, "Chest", [
          ex("Incline barbell bench press", [12, 15], 4, 90),
          ex("Flat smith machine bench press", [12, 15], 3, 90),
          ex("Incline bench db flyes", [12, 15], 3, 90),
          ex("Chest dips", [12, 15], 3, 90),
          finisher("Flat machine chest press", "most muscular"),
          CARDIO_30MIN(),
        ]),
        day(2, "Back", [
          ex("Low cable row (Rope)", [12, 15], 4, 90),
          ex("Lat pulldown (Wide grip)", [12, 15], 3, 90),
          ex("Db pullover", [12, 15], 3, 90),
          finisher("Machine mid row (Neutral grip)", "back double biceps"),
          ex("Hyperextension", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        day(3, "Shoulder/Traps", [
          ex("Machine shoulder press (Neutral grip)", [12, 15], 4, 90),
          ex("Front raises (Plate)", [12, 15], 3, 90),
          ex("Reverse fly machine", [12, 15], 3, 90),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          ex("Db shrugs", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        restDay(4),
        day(5, "Legs", [
          ex("Seated leg curls", [12, 15], 4, 90),
          ex("Db straight leg deadlift", [12, 15], 3, 90),
          ex("Walking lunges", [12, 15], 3, 90),
          ex("Front barbell squat", [12, 15], 3, 90),
          finisher("Lying leg curls", "quad flex"),
          CARDIO_30MIN(),
        ]),
        day(6, "Arms/Calves", [
          orElse(
            ex("Cable cambered bar pushdowns", [12, 15], 4, 90),
            "Straight-bar triceps pushdown",
          ),
          ex("Cable single arm reverse pushdown", [12, 15], 3, 90, { perSide: true }),
          finisher("Cable reverse pushdown", "side tricep"),
          withModifiers(
            ex("Standing barbell curls", [12, 15], 3, 90),
            { forcedReps: true, negatives: true, partials: true },
          ),
          ex("Low cable curl (Straight bar)", [12, 15], 3, 90),
          finisher("Front double bicep cable curl", "back double biceps"),
          ex("Calf extension machine (Toes in)", [12, 15], 3, 90),
          ex("Standing calf raise", [12, 15], 3, 90),
          finisher("Seated calf raise", "quad flex"),
          CARDIO_30MIN(),
        ]),
        restDay(7),
      ],
    },
    {
      weekNumber: 8,
      days: [
        day(1, "Chest", [
          ex("Incline db neutral grip press", [12, 15], 4, 90),
          ex("Flat db press", [12, 15], 3, 90),
          ex("Pec deck (Open hand)", [12, 15], 3, 90),
          ex("Chest dips", [12, 15], 3, 90),
          finisher("Flat machine chest press", "side chest"),
          CARDIO_30MIN(),
        ]),
        day(2, "Back", [
          ex("Overhand bent over barbell rows", [12, 15], 4, 90),
          ex("Machine mid row (Neutral grip)", [12, 15], 3, 90),
          ex("Cable face pulls", [12, 15], 3, 90),
          finisher("Machine mid row (Neutral grip)", "front lat spread"),
          ex("Hyperextension", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        day(3, "Shoulder/Traps", [
          ex("Db shoulder press", [12, 15], 4, 90),
          ex("Standing db front raises (Overhand, arms together)", [12, 15], 3, 90),
          ex("Bent over db lateral raise (Overhand)", [12, 15], 3, 90),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          ex("Standing barbell shrugs", [12, 15], 3, 90),
          CARDIO_30MIN(),
        ]),
        restDay(4),
        day(5, "Legs", [
          ex("Lying leg curls", [12, 15], 4, 90),
          ex("Db straight leg deadlift", [12, 15], 3, 90),
          ex("Walking lunges", [12, 15], 3, 90),
          ex("Barbell squat", [12, 15], 3, 90),
          finisher("Leg extension", "quad flex"),
          CARDIO_30MIN(),
        ]),
        day(6, "Arms/Calves", [
          ex("Cable reverse pushdowns", [12, 15], 4, 90),
          ex("Overhead tricep extension (Rope)", [12, 15], 3, 90, { perSide: true }),
          finisher("Machine dips (Triceps)", "side tricep"),
          ex("Standing db curls (Alternating)", [12, 15], 3, 90),
          ex("Rope hammer curls", [12, 15], 3, 90),
          finisher("Front double bicep cable curl", "back double biceps"),
          ex("Calf extension machine (Toes out)", [12, 15], 3, 90),
          ex("Standing calf raise", [12, 15], 3, 90),
          finisher("Seated calf raise", "quad flex"),
          CARDIO_30MIN(),
        ]),
        restDay(7),
      ],
    },
  ],
};

export const bulkingProgram: Routine = routineSchema.parse(raw);
