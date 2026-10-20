import { routineSchema, type Routine } from "./schema";
import { day, restDay } from "./authoring";
import { PPL_NOTES, PPL_ROTATION } from "./ppl-sessions";

// Six days on, one off: the whole A/B rotation fits a week exactly, so one
// week that repeats is the entire program.
const raw: Routine = {
  slug: "ppl-x2-program",
  name: "Push/Pull/Legs ×2",
  style: "Push/Pull/Legs",
  notes: PPL_NOTES,
  defaultPrescription: { reps: [8, 12], sets: 3, restSeconds: 120 },
  weeks: [
    {
      weekNumber: 1,
      days: [
        ...PPL_ROTATION.map((session, index) =>
          day(index + 1, session.label, session.exercises),
        ),
        restDay(7),
      ],
    },
  ],
};

export const pplX2Program: Routine = routineSchema.parse(raw);
