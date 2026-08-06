import { routineSchema, type Routine } from "./schema";
import { day, ex, finisher, restDay } from "./authoring";

// Title default: (8-12, 2, 150s) — reps 8-12, 2 sets, 150s rest, unless a
// bullet overrides. Source has two mid-list "rest, 150s" bullets that are
// formatting artifacts (the title's own default rest note), not exercises —
// they're dropped rather than transcribed as fake exercises.
const REPS: [number, number] = [8, 12];
const SETS = 2;
const REST = 150;

const raw: Routine = {
  slug: "back-program",
  name: "Back Program",
  defaultPrescription: { reps: REPS, sets: SETS, restSeconds: REST },
  weeks: [
    {
      weekNumber: 1,
      days: [
        day(1, "Back/Biceps", [
          ex("Lat pulldown wide", REPS, SETS, REST),
          ex("Bent over T-bar rows wide", REPS, SETS, REST),
          ex("Single arm db high rows", [10, 15], SETS, REST, { perSide: true }),
          finisher("Cable straight arm pulldowns", "double biceps", [10, 12]),
          ex("Db alternating curl", REPS, SETS, REST),
          ex("Rope hammer curls", [10, 15], SETS, REST),
        ]),
        day(2, "Chest/Triceps", [
          ex("Incline barbell bench press", REPS, SETS, REST),
          ex("Flat machine chest press", REPS, SETS, REST),
          ex("Machine dips chest", REPS, SETS, REST),
          ex("Cable crossover middle", [10, 15], SETS, REST),
          ex("Cable cambered bar pushdowns", REPS, SETS, REST),
          ex("Db skull crushers", [10, 15], SETS, REST),
        ]),
        day(3, "Legs", [
          ex("Leg extension", [10, 15], SETS, REST),
          ex("Hack squat", REPS, SETS, 180),
          ex("45° Leg press", [10, 15], SETS, 180),
          ex("Db straight leg deadlift", REPS, SETS, REST),
          ex("Lying leg curls", REPS, 3, REST),
          ex("Standing calf raise", [8, 15], 3, REST),
        ]),
        restDay(4),
        day(5, "Back/Rear Delts", [
          ex("Lat pulldown close grip", REPS, SETS, REST),
          ex("Bent over barbell rows underhand", REPS, SETS, REST),
          ex("Machine mid row overhand", [10, 15], SETS, REST),
          finisher("Cable pulldown rope", "rear lat spread", [10, 12]),
          ex("Hyperextension", [10, 15], SETS, REST),
          ex("Reverse fly machine", [10, 15], 3, REST),
        ]),
        day(6, "Shoulder/Arms", [
          ex("Seated db lateral raises overhand", REPS, 3, REST),
          ex("Db shoulder press", REPS, SETS, REST),
          ex("Close grip barbell bench press", REPS, 3, REST),
          ex("Single arm machine preacher curls", REPS, SETS, REST),
          ex("Cable tricep pushdowns rope", [10, 15], SETS, REST),
          ex("Standing incline cable curls", [10, 15], SETS, REST),
        ]),
        restDay(7),
      ],
    },
  ],
};

export const backProgram: Routine = routineSchema.parse(raw);
