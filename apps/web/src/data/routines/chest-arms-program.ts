import { routineSchema, type Routine } from "./schema";
import { cardio, day, ex, finisher, ramp, restDay, withModifiers } from "./authoring";
import type { ExerciseEntry } from "./schema";

// Title default: (8-12, 3, 90s). Each day's first ("Chest/Arms" combo, leg,
// shoulder, back, or chest) lift ramps 2 sets @10-12 then 2 sets @8-12; the
// source gives no rest for that line, so the title default (90s) applies to
// both phases. Mid-list "rest 90s" bullets are the title default restated
// inline, not real exercises — dropped rather than transcribed as fake ones.
const ACC_REPS: [number, number] = [8, 12];
const ACC_SETS = 3;
const ACC_REST = 90;

function acc(name: string, reps: [number, number] = ACC_REPS): ExerciseEntry {
  return ex(name, reps, ACC_SETS, ACC_REST);
}

function heavyRamp(name: string): ExerciseEntry {
  return ramp(name, [
    { sets: 2, reps: [10, 12], restSeconds: 90 },
    { sets: 2, reps: [8, 12], restSeconds: 90 },
  ]);
}

const CARDIO_15MIN = () => cardio("Low-intensity cardio", 900);

const raw: Routine = {
  slug: "chest-arms-program",
  name: "Chest & Arms Program",
  defaultPrescription: { reps: ACC_REPS, sets: ACC_SETS, restSeconds: ACC_REST },
  weeks: [
    {
      weekNumber: 1,
      days: [
        day(1, "Chest/Arms", [
          heavyRamp("Flat smith machine bench press"),
          acc("Incline barbell bench press"),
          acc("Chest dips"),
          finisher("Cable crossover (Middle)", "most muscular"),
          acc("Db alternating curls"),
          acc("Front double bicep cable curls"),
          acc("Cable cambered bar pushdown"),
          acc("Db skull crushers"),
          CARDIO_15MIN(),
        ]),
        day(2, "Legs", [
          heavyRamp("Leg extension"),
          acc("45° Leg press"),
          acc("Db squats"),
          acc("Db straight leg deadlift"),
          finisher("Lying leg curls", "quad"),
        ]),
        day(3, "Shoulder/Calves", [
          heavyRamp("Seated barbell shoulder press"),
          acc("Front raises (Plate)"),
          acc("Reverse fly machine"),
          finisher("Single arm cable lateral raise", "most muscular"),
          acc("Standing calf raise"),
          acc("Seated calf raise"),
          CARDIO_15MIN(),
        ]),
        day(4, "Back/Biceps", [
          heavyRamp("Lat pulldown wide"),
          acc("Overhand bent over barbell rows"),
          acc("Db rows on incline bench"),
          finisher("Cable pushdowns (Rope)", "back double biceps"),
          acc("Hyperextension"),
          acc("Standing db bicep curls together"),
          acc("Standing hammer curls"),
          finisher("Front double bicep cable curls", "back double biceps"),
          CARDIO_15MIN(),
        ]),
        day(5, "Chest/Triceps", [
          heavyRamp("Flat db press"),
          acc("Incline db neutral grip press"),
          finisher("Pec deck open", "most muscular"),
          acc("Db seated overhead extension"),
          acc("Db skull crushers"),
          acc("Cable reverse pushdowns"),
          finisher("Feet elevated push-ups (Chest)", "side tricep"),
          CARDIO_15MIN(),
        ]),
        restDay(6),
        restDay(7),
      ],
    },
    {
      weekNumber: 2,
      days: [
        day(1, "Chest/Arms", [
          heavyRamp("Incline smith machine bench press"),
          acc("Flat barbell bench press"),
          acc("Incline bench db flyes"),
          acc("Chest dips"),
          finisher("Flat machine chest press", "most muscular"),
          acc("Standing ez bar curls"),
          acc("Waiter curls"),
          acc("Close grip barbell bench press"),
          acc("Cable tricep pushdowns (Rope)"),
          CARDIO_15MIN(),
        ]),
        day(2, "Legs", [
          heavyRamp("Seated leg curls"),
          acc("Db straight leg deadlift"),
          acc("Walking lunges"),
          finisher("Leg extension", "quad"),
        ]),
        day(3, "Shoulder/Calves", [
          heavyRamp("Machine shoulder press (Neutral grip)"),
          acc("Standing db front raises (Overhand, together)"),
          acc("Seated bent over lateral raises (Overhand)"),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          acc("Standing calf raise"),
          acc("Calf extension machine (Toes in)"),
          acc("Seated calf raise"),
          CARDIO_15MIN(),
        ]),
        day(4, "Back/Biceps", [
          heavyRamp("Overhand bent over barbell rows"),
          acc("Lat pulldown wide"),
          acc("Db pullover"),
          finisher("Machine mid row (Neutral grip)", "front lat spread"),
          acc("Hyperextension"),
          acc("Standing barbell curls"),
          acc("Incline hammer curl with db"),
          finisher("Low cable curls (Straight bar)", "back double biceps"),
          CARDIO_15MIN(),
        ]),
        day(5, "Chest/Triceps", [
          heavyRamp("Flat barbell bench press"),
          acc("Incline barbell bench press"),
          finisher("Pec deck open", "most muscular"),
          acc("Cable cambered bar pushdowns"),
          acc("Overhead tricep extension (Rope)"),
          acc("Db kickback (Pinky up)"),
          finisher("Cable tricep pushdowns", "side tricep"),
          CARDIO_15MIN(),
        ]),
        restDay(6),
        restDay(7),
      ],
    },
    {
      weekNumber: 3,
      days: [
        day(1, "Chest/Arms", [
          heavyRamp("Flat barbell bench press"),
          acc("Incline barbell bench press"),
          acc("Chest dips"),
          finisher("Pec deck open", "most muscular"),
          acc("Standing barbell curls"),
          acc("Spider bench db curls"),
          ex("Db seated overhead extension (single arm)", ACC_REPS, ACC_SETS, ACC_REST, {
            perSide: true,
          }),
          acc("Cable reverse pushdown"),
          CARDIO_15MIN(),
        ]),
        day(2, "Legs", [
          heavyRamp("Leg extension"),
          acc("Lying leg curls"),
          acc("Barbell squat"),
          acc("Db straight leg deadlift"),
          finisher("Hack squat", "quad"),
        ]),
        day(3, "Shoulder/Calves", [
          withModifiers(heavyRamp("Seated dumbbell lateral raise"), { forcedReps: true, negatives: true, partials: true }),
          acc("Spider bench front raises (Overhand)"),
          acc("Bent over db lateral raise (Overhand)"),
          finisher("Single arm cable lateral raise", "most muscular"),
          acc("Standing calf raise"),
          acc("Calf extension machine (Toes out)"),
          acc("Seated calf raise"),
          CARDIO_15MIN(),
        ]),
        day(4, "Back/Biceps", [
          heavyRamp("Wide grip pull ups"),
          acc("Bent over barbell rows (Underhand)"),
          acc("Machine mid row neutral"),
          finisher("Low cable row (V-bar)", "rear lat spread"),
          acc("Hyperextension"),
          acc("Incline hammer curl with db"),
          acc("Db hammer curls alternating"),
          finisher("Low cable curls (Straight bar)", "back double biceps"),
          CARDIO_15MIN(),
        ]),
        day(5, "Chest/Triceps", [
          heavyRamp("Incline db neutral grip press"),
          acc("Flat machine chest press"),
          finisher("Incline bench db flyes", "most muscular"),
          acc("Close grip barbell bench press"),
          acc("Machine dips (Triceps)"),
          finisher("Db kickback (Pinky up)", "side tricep"),
          CARDIO_15MIN(),
        ]),
        restDay(6),
        restDay(7),
      ],
    },
    {
      weekNumber: 4,
      days: [
        day(1, "Chest/Arms", [
          heavyRamp("Incline db neutral grip press"),
          acc("Flat db press"),
          acc("Chest dips"),
          withModifiers(acc("Incline bench db flyes"), { forcedReps: true, negatives: true, partials: true }),
          finisher("Cable crossover (Middle)", "most muscular"),
          withModifiers(acc("Machine preacher curls"), { negatives: true }),
          acc("Low cable curls (Straight bar)"),
          acc("Ez bar skull crushers"),
          acc("Machine dips (Triceps)"),
          CARDIO_15MIN(),
        ]),
        day(2, "Legs", [
          heavyRamp("Lying leg curls"),
          acc("Leg extension"),
          acc("Power squat super squat"),
          acc("Alternating db lunges"),
          finisher("Hack squat (Narrow)", "quad"),
        ]),
        day(3, "Shoulder/Calves", [
          heavyRamp("Seated barbell shoulder press"),
          withModifiers(acc("Incline dumbbell front raise"), { ladder: ["low", "mid", "full"] }),
          acc("Seated bent over lateral raises (Overhand)"),
          finisher("Machine shoulder press (Neutral grip)", "most muscular"),
          acc("Standing calf raise"),
          acc("Seated calf raise"),
          CARDIO_15MIN(),
        ]),
        day(4, "Back/Biceps", [
          heavyRamp("Lat pulldown wide"),
          acc("Bent over T-bar rows (Shoulder-width grip)"),
          finisher("Machine mid row (Neutral grip)", "rear lat spread"),
          acc("Hyperextension"),
          acc("Db alternating curls"),
          finisher("Rope hammer curls", "back double biceps"),
          CARDIO_15MIN(),
        ]),
        day(5, "Chest/Triceps", [
          heavyRamp("Flat db press"),
          acc("Incline barbell bench press"),
          finisher("Pec deck open", "most muscular"),
          acc("Cable cambered bar pushdowns"),
          acc("Db kickback palms down"),
          finisher("Feet elevated push-ups (Chest)", "side tricep"),
          CARDIO_15MIN(),
        ]),
        restDay(6),
        restDay(7),
      ],
    },
  ],
};

export const chestArmsProgram: Routine = routineSchema.parse(raw);
