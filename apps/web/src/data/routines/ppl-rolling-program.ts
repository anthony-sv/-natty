import { routineSchema, type Routine, type TrainingWeek } from "./schema";
import { day, restDay } from "./authoring";
import { PPL_NOTES, PPL_ROTATION } from "./ppl-sessions";

/**
 * Five sessions a week over a six-session rotation — Push/Pull/Legs/Push/Pull,
 * then Legs/Push/Pull/Legs/Push the week after, and so on.
 *
 * A fixed "PPLPP" week would train legs once a week forever. Letting the
 * rotation roll instead hits every muscle five times every three weeks
 * (~1.7× a week) on five gym days, which is the point of the schedule. The
 * sequence lines up with the calendar again after six weeks (30 sessions =
 * five full A/B rotations), so that's how many weeks are written out.
 *
 * Training days 1-3 and 5-6, rest on 4 and 7: no more than three in a row.
 */
const TRAINING_DAYS = [1, 2, 3, 5, 6];
const REST_DAYS = [4, 7];
const WEEKS = 6;

function rollingWeeks(): TrainingWeek[] {
  const weeks: TrainingWeek[] = [];
  let session = 0;
  for (let w = 1; w <= WEEKS; w++) {
    const days = [
      ...TRAINING_DAYS.map((dayNumber) => {
        const { label, exercises } = PPL_ROTATION[session % PPL_ROTATION.length];
        session++;
        return day(dayNumber, label, exercises);
      }),
      ...REST_DAYS.map(restDay),
    ].sort((a, b) => a.dayNumber - b.dayNumber);
    weeks.push({ weekNumber: w, days });
  }
  return weeks;
}

const raw: Routine = {
  slug: "ppl-rolling-program",
  name: "Push/Pull/Legs rolling 5-day",
  style: "Push/Pull/Legs",
  notes: [
    "Five gym days a week: the six-session rotation keeps rolling instead of restarting each Monday, so legs aren't stuck at once a week.",
    ...PPL_NOTES,
  ],
  defaultPrescription: { reps: [8, 12], sets: 3, restSeconds: 120 },
  weeks: rollingWeeks(),
};

export const pplRollingProgram: Routine = routineSchema.parse(raw);
