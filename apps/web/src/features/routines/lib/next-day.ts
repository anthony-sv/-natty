import type { Routine, TrainingDay } from "@/data/routines";
import type { WorkoutCompletion } from "@/features/log/completion-schema";
import type { LoggedSet } from "@/features/log/schema";
import { daysBetween } from "@/lib/week";

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
 * **A rest day needs no activity to move past, and that's the one place
 * "derived from the log" alone doesn't work.** A training day waits for you
 * indefinitely — good, that's the whole point, skipping the app costs
 * nothing — but a rest day has nothing to log by design, so with no other
 * signal it would freeze the app on "rest" forever the moment you reached
 * one. `now` is what breaks the tie: once a full calendar day has passed
 * since your last logged activity, this steps over exactly one *consecutive*
 * rest day for it, the same way actually running the program would — reach
 * the day after that and it's still rest, step over another, and so on —
 * but it stops dead the instant it reaches a training day. That one still
 * gets the indefinite wait; only rest days are time-based.
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
  startAt: DayCoordinate | undefined,
  now: number,
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

  // Anchored on the *earliest* activity for that same (week, day), not
  // `last.performedAt` itself — a session that runs past midnight logs its
  // `WorkoutCompletion` on the calendar day after the one it was actually
  // trained on, and that later timestamp winning here shifted the whole
  // rest-day countdown a day late: the day after training read as "day of
  // training" all over again.
  //
  // **Scoped to the current occurrence, not every lap that ever touched this
  // (week, day).** A routine with one week repeats forever on the same
  // `weekNumber` (`userRoutineSchema`'s "one week, which repeats"), so a
  // routine trained for a month has logged activity against, say,
  // `(week 1, day 3)` on several different real calendar weeks — matching on
  // (week, day) alone, as the midnight fix above does, isn't enough to tell
  // those laps apart, since they share the exact same coordinates. Scanning
  // all of it for the minimum picked up whichever lap happened to be
  // earliest — often the very first one ever — and anchored `elapsed` on a
  // session from weeks ago, which skipped straight past a rest day (or
  // several) that hadn't actually happened yet.
  //
  // Walking backward from the chronologically latest entry and stopping the
  // instant the gap to the next-older one exceeds a single session's length
  // keeps only this occurrence: still absorbs a completion logged after
  // midnight (a few hours' gap, at most), but not a session on the exact
  // same day-of-week from a lap ago (days or weeks).
  const MAX_SESSION_GAP_MS = 12 * 60 * 60 * 1000; // generous: no real session runs this long
  const chronological = [...activity].sort(
    (a, b) => a.performedAt - b.performedAt,
  );
  let anchor = last.performedAt;
  for (let i = chronological.length - 1; i >= 0; i--) {
    const entry = chronological[i]!;
    if (
      entry.weekNumber !== last.weekNumber ||
      entry.dayNumber !== last.dayNumber ||
      anchor - entry.performedAt > MAX_SESSION_GAP_MS
    ) {
      break;
    }
    anchor = entry.performedAt;
  }

  // The day right after `last` is always shown as-is, rest or not — one
  // elapsed calendar day accounts for that one. Each day beyond it steps
  // past one more *consecutive* rest day, stopping the moment a training day
  // is reached (that one waits for real activity, same as ever) or once a
  // full lap of the sequence has been covered (an all-rest edge case has no
  // more to say past that, and it bounds how long a long-idle app spends
  // walking forward here).
  const elapsed = daysBetween(anchor, now);
  let index = lastIndex;
  let skipped = 0;
  while (
    skipped < elapsed - 1 &&
    skipped < sequence.length &&
    sequence[(index + 1) % sequence.length]!.day.isRest
  ) {
    index = (index + 1) % sequence.length;
    skipped += 1;
  }

  return sequence[(index + 1) % sequence.length];
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
