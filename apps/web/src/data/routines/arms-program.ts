import { routineSchema, type Routine } from "./schema";
import { day, ex, finisher, restDay } from "./authoring";

// Title default: (2 sets, 150s rest) — used for every regular exercise
// unless a bullet gives its own set count or rest override.
const SETS = 2;
const REST = 150;

const raw: Routine = {
  slug: "arms-program",
  name: "Arms Program",
  defaultPrescription: { sets: SETS, restSeconds: REST },
  weeks: [
    {
      weekNumber: 1,
      days: [
        day(1, "Arms", [
          ex("Standing barbell curls", [10, 15], SETS, REST),
          ex("Machine dips", [8, 12], SETS, REST),
          finisher("Standing incline cable curls", "front double biceps", [10, 15]),
          ex("EZ bar skull crushers", [10, 15], SETS, REST),
          ex("Db hammer curls alternating", [10, 15], SETS, REST),
          ex("Cable tricep pushdowns rope", [10, 15], SETS, REST),
        ]),
        day(2, "Back/Chest", [
          ex("Lat pulldown close grip", [8, 12], SETS, REST),
          ex("Incline db press", [8, 12], SETS, REST),
          ex("Bent over T-bar rows wide", [8, 12], SETS, REST),
          ex("Flat machine chest press", [10, 15], SETS, REST),
          ex("Machine mid row neutral", [10, 15], SETS, REST),
          ex("Cable crossover middle", [10, 15], SETS, REST),
        ]),
        day(3, "Legs", [
          ex("Leg extension", [10, 15], SETS, REST),
          ex("Smith machine/Hack squat", [8, 12], SETS, 180),
          ex("45° Leg press", [10, 15], SETS, 180),
          ex("Db straight leg deadlift", [8, 12], SETS, REST),
          ex("Lying leg curls", [8, 12], 3, REST),
          ex("Standing calf raise", [8, 15], 3, REST),
        ]),
        restDay(4),
        day(5, "Shoulders/Arms", [
          ex("Seated db lateral raises overhand", [8, 12], 3, REST),
          ex("Db shoulder press/machine", [8, 12], SETS, REST),
          ex("Close grip barbell bench press", [8, 12], 3, REST),
          ex("Machine preacher curls", [8, 12], 3, REST),
          finisher("Overhead tricep extensions rope", "side tricep", [10, 12]),
          ex("Incline hammer curl with db", [8, 12], SETS, REST),
        ]),
        day(6, "Chest/Back", [
          ex("Incline smith machine bench press", [8, 12], SETS, REST),
          ex("Lat pulldown wide", [8, 12], SETS, REST),
          ex("Flat db press", [8, 12], SETS, REST),
          ex("Machine mid row overhand", [8, 12], SETS, REST),
          ex("Pec deck open hand", [10, 15], SETS, REST),
          ex("Low cable row mag grip", [10, 15], SETS, REST),
        ]),
        restDay(7),
      ],
    },
  ],
};

export const armsProgram: Routine = routineSchema.parse(raw);
