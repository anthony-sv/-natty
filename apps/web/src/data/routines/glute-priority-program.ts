import { routineSchema, type Routine } from "./schema";
import { day, ex, orElse, restDay } from "./authoring";

/**
 * Lower body three times a week, upper twice, with the priority written into
 * the volume: glutes first (~19 direct sets a week), quads second (~14),
 * hamstrings third (~9 direct, plus everything hip thrusts and RDLs give them
 * on the way).
 *
 * Like the PPL programs, written against the literature rather than
 * transcribed. The choices it leans on, briefly:
 *
 * - Squats grew the glutes as much as hip thrusts did, and grew the quads and
 *   adductors too — so deep squats and split squats carry a lot of the glute work,
 *   and thrusts are there for load at the top, not as the only glute lift.
 * - Full-depth squats outgrew half squats for glutes and adductors.
 * - Neither thrusts nor squats grew glute medius/minimus — abduction is the
 *   only lift here that trains the upper glutes directly, so it's on two days.
 * - Step-ups top the EMG review for glute max activation — activation isn't
 *   growth, but they're also the glute-primary lunge, so they take the
 *   lunge slot on the third lower day.
 * - Seated leg curl beat lying for the hamstrings; leg extension stays because
 *   squats barely touch the rectus femoris.
 * - Women grow at the same relative rate men do; there's no separate
 *   "female" physiology to program around beyond what the person wants to
 *   prioritise.
 *
 * Upper body is two full upper days rather than one push and one pull, so the
 * upper muscles still get trained twice a week on two sessions.
 */
const UPPER_A_ARMS = { id: "upper-a-arms" };
const UPPER_B_ARMS = { id: "upper-b-arms" };

const raw: Routine = {
  slug: "glute-priority-program",
  name: "Glute-priority lower/upper",
  style: "Lower/Upper",
  notes: [
    "Lower body three days a week, priority glutes, then quads, then hamstrings — set by how many weekly sets each gets, and by which lift opens each day.",
    "Squats built glutes as well as hip thrusts did in a head-to-head trial, plus more quads and adductors, so deep squats, split squats and step-ups do much of the glute work. Thrusts add heavy load at full hip extension.",
    "Hip thrusts and squats didn't grow the upper glutes (medius and minimus). Hip abduction is the lift for those, so it shows up twice a week.",
    "Go deep: full-depth squats outgrew half squats for the glutes and adductors. On split squats and step-ups, lean slightly forward to shift more of the work to the glutes.",
    "Women build muscle at the same relative rate as men. Train every working set to 0-3 reps short of failure and add weight once you hit the top of the rep range.",
    "Upper body is trained as two full upper sessions so every muscle still gets hit twice a week.",
  ],
  defaultPrescription: { reps: [8, 12], sets: 3, restSeconds: 120 },
  weeks: [
    {
      weekNumber: 1,
      days: [
        day(1, "Glutes/Hamstrings", [
          orElse(ex("Barbell hip thrust", [6, 10], 4, 150), "Machine hip thrust"),
          orElse(
            ex("Barbell stiff-leg deadlift", [8, 10], 3, 150),
            "Dumbbell straight-leg deadlift",
          ),
          ex("Seated leg curl", [10, 12], 3, 90),
          ex("Glute-biased hyperextension", [12, 20], 3, 90),
          ex("Seated hip abduction machine", [15, 20], 3, 60),
        ]),
        day(2, "Upper A", [
          ex("Incline dumbbell press", [8, 12], 3, 120),
          ex("Wide-grip lat pulldown", [8, 12], 3, 120),
          ex("Dumbbell shoulder press", [8, 12], 2, 120),
          ex("Low cable row (V-bar)", [10, 12], 3, 120),
          ex("Cable lateral raise", [12, 20], 3, 60),
          {
            ...ex("Rope overhead triceps extension", [10, 15], 2, 60),
            group: UPPER_A_ARMS,
          },
          {
            ...ex("Standing incline cable curl", [10, 15], 2, 60),
            group: UPPER_A_ARMS,
          },
        ]),
        day(3, "Glutes/Quads", [
          orElse(ex("Barbell back squat", [6, 10], 3, 180), "Hack squat"),
          ex("Smith machine Bulgarian split squat", [8, 12], 3, 120, {
            perSide: true,
          }),
          ex("Leg extension", [10, 15], 3, 90),
          ex("Cable glute kickback", [12, 15], 3, 60, { perSide: true }),
          ex("Seated hip adduction machine", [12, 15], 2, 60),
          ex("Kneeling cable crunch", [10, 15], 3, 60),
        ]),
        restDay(4),
        day(5, "Upper B", [
          ex("Flat machine chest press", [8, 12], 3, 120),
          ex("Incline-bench dumbbell row", [8, 12], 3, 120),
          ex("Reverse-grip lat pulldown", [10, 12], 2, 120),
          ex("Seated dumbbell lateral raise", [12, 20], 3, 60),
          ex("Cable face pull", [12, 15], 3, 60),
          { ...ex("Rope triceps pushdown", [10, 15], 2, 60), group: UPPER_B_ARMS },
          { ...ex("Alternating hammer curl", [10, 15], 2, 60), group: UPPER_B_ARMS },
        ]),
        day(6, "Glutes/Legs", [
          ex("45° leg press", [10, 12], 3, 150),
          ex("Barbell hip thrust", [10, 15], 3, 120),
          ex("Dumbbell step-up", [8, 12], 3, 120, { perSide: true }),
          ex("Lying leg curl", [10, 12], 3, 90),
          ex("Cable hip abduction", [15, 20], 3, 60, { perSide: true }),
          ex("Standing calf raise", [10, 15], 3, 60),
        ]),
        restDay(7),
      ],
    },
  ],
};

export const glutePriorityProgram: Routine = routineSchema.parse(raw);
