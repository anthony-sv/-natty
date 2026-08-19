import type { Routine, TrainingDay } from "@/data/routines";
import type { WorkoutCompletion } from "@/features/log/completion-schema";
import type { LoggedSet } from "@/features/log/schema";

export interface NextTrainingDay {
  weekNumber: number;
  day: TrainingDay;
}

/** A (week, day) coordinate — a lighter shape than `NextTrainingDay` for
 * callers that only have the numbers, not the resolved `TrainingDay`. */
export interface DayCoordinate {
  weekNumber: number;
  dayNumber: number;
}

/**
 * Every (week, day) in the routine, in the order you'd train them.
 *
 * Exported so the activate-program picker can offer the same list a "start
 * from day ___" choice needs, rather than re-deriving the order here and in
 * the UI — two readings of "what day is this" are two readings to disagree.
 */
export function scheduleSequence(routine: Routine): NextTrainingDay[] {
  return routine.weeks
    .slice()
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .flatMap((week) =>
      week.days.map((day) => ({ weekNumber: week.weekNumber, day })),
    );
}

/** The one thing both `LoggedSet` and `WorkoutCompletion` say: when, and where in the routine. */
interface Activity {
  weekNumber: number;
  dayNumber: number;
  performedAt: number;
}

/**
 * The next day to train on this routine — derived from your own log rather
 * than a separately-tracked pointer, so it can't drift from what you
 * actually did and skipping the app for a week costs nothing.
 *
 * Finds the most recent thing you actually did against this routine's slug —
 * a logged set, **or a workout run all the way to "Finish" with nothing
 * logged against it** — locates its (week, day) in the routine's own
 * sequence, and returns the entry after it — wrapping back to week 1 day 1
 * once the sequence runs out, the same way an ongoing program is actually
 * run. Rest days are real participants in the sequence (`trainingDaySchema`
 * numbers them too, same as a training day), so a rest day can come back as
 * "next" — wording that as a rest day rather than skipping past it is on the
 * caller.
 *
 * The two sources merge by comparing `performedAt`: reaching the end of a
 * session counts the same way logging a set always has, which is what stops
 * this reading "still on day 1" the morning after a workout you completed
 * but never opened the log popover for.
 *
 * No activity logged against this routine yet → `startAt` if one was given
 * (the one-time "start from day ___" choice made when the routine was
 * activated), else the first day. `startAt` is never consulted once the log
 * has anything for this routine — the day after your last real activity
 * always wins, which is what keeps this a one-time seed rather than a second
 * pointer to keep in sync.
 */
export function nextTrainingDay(
  routine: Routine,
  sets: LoggedSet[],
  completions: WorkoutCompletion[] = [],
  startAt?: DayCoordinate,
): NextTrainingDay | undefined {
  const sequence = scheduleSequence(routine);
  if (sequence.length === 0) return undefined;

  const activity: Activity[] = [
    ...sets
      .filter(
        (set): set is LoggedSet & { weekNumber: number; dayNumber: number } =>
          set.routineSlug === routine.slug &&
          set.weekNumber !== undefined &&
          set.dayNumber !== undefined,
      )
      .map((set) => ({
        weekNumber: set.weekNumber,
        dayNumber: set.dayNumber,
        performedAt: set.performedAt,
      })),
    ...completions
      .filter((completion) => completion.routineSlug === routine.slug)
      .map((completion) => ({
        weekNumber: completion.weekNumber,
        dayNumber: completion.dayNumber,
        performedAt: completion.performedAt,
      })),
  ];

  const last = activity.reduce<Activity | undefined>(
    (latest, entry) =>
      latest === undefined || entry.performedAt > latest.performedAt
        ? entry
        : latest,
    undefined,
  );

  if (last === undefined) {
    if (startAt !== undefined) {
      const seeded = sequence.find(
        (entry) =>
          entry.weekNumber === startAt.weekNumber &&
          entry.day.dayNumber === startAt.dayNumber,
      );
      if (seeded !== undefined) return seeded;
    }
    return sequence[0];
  }

  const lastIndex = sequence.findIndex(
    (entry) =>
      entry.weekNumber === last.weekNumber &&
      entry.day.dayNumber === last.dayNumber,
  );
  // Activity against a day this routine no longer has (edited out since) is
  // the same as never having done any — start over from the top.
  if (lastIndex === -1) return sequence[0];

  return sequence[(lastIndex + 1) % sequence.length];
}

/**
 * The entry that follows a given one in the routine's own sequence — used to
 * preview what's after a rest day without stepping through the log again.
 */
export function dayAfter(
  routine: Routine,
  current: NextTrainingDay,
): NextTrainingDay | undefined {
  const sequence = scheduleSequence(routine);
  const index = sequence.findIndex(
    (entry) =>
      entry.weekNumber === current.weekNumber &&
      entry.day.dayNumber === current.day.dayNumber,
  );
  if (index === -1) return undefined;
  return sequence[(index + 1) % sequence.length];
}
