import type { ExerciseEntry, TrainingDay } from "@/data/routines";
import type { WorkoutCompletion } from "@/features/log/completion-schema";
import type { ExtraWork } from "./schema";

/** A (routine, week, day) coordinate — what an extra attaches to. */
export interface DayTarget {
  routineSlug: string;
  weekNumber: number;
  dayNumber: number;
}

/**
 * The most recent time this exact day was finished, however it ended.
 *
 * Both `finishIfLast` and `EndWorkoutButton` (`SessionPlayer.tsx`) log a
 * `WorkoutCompletion` on every session close, reached-the-end or bailed-out
 * early — so this is the one signal that reliably means "this occurrence is
 * over", the same way `nextTrainingDay` treats it as proof a day was
 * trained. Used by `composeDay` to decide whether a pending extra has
 * already served its one occurrence.
 */
export function lastCompletionFor(
  completions: WorkoutCompletion[],
  target: DayTarget,
): number | undefined {
  return completions
    .filter(
      (c) =>
        c.routineSlug === target.routineSlug &&
        c.weekNumber === target.weekNumber &&
        c.dayNumber === target.dayNumber,
    )
    .reduce<number | undefined>(
      (max, c) =>
        max === undefined || c.performedAt > max ? c.performedAt : max,
      undefined,
    );
}

export interface ComposedDay {
  day: TrainingDay;
  /**
   * Which indices in `day.exercises` are extra work rather than a
   * prescription. A `Set`, not a "from here on" cutoff: `"beforeCardio"`
   * placement (see `composeDay`) can land extras in the middle of the
   * array, so membership is the only test that stays correct regardless of
   * where they ended up.
   */
  extraIndices: Set<number>;
  /**
   * The source row behind each appended index — what `DayExerciseList` reads
   * to show "Added {date}" and to know which id a remove control deletes.
   * Keyed by position in `day.exercises` rather than carried on the entry
   * itself, since `ExerciseEntry` has no room for it and shouldn't grow one
   * just for display.
   */
  extraMeta: Map<number, { id: string; createdAt: number }>;
}

/**
 * Where a pending extra lands relative to the day's own exercises.
 *
 * - `"beforeCardio"` — non-cardio extras go right before the day's first
 *   cardio entry (or at the end, if there isn't one); a cardio extra goes
 *   after everything, including the day's own cardio. This is what makes an
 *   accessory or finisher you tack on run *before* you get on the bike,
 *   which is how it actually happens at the gym, and it's the placement
 *   every caller wants **except** a running session.
 * - `"append"` — everything goes at the tail, full stop, regardless of
 *   cardio. This is the one that keeps a live session safe: see the
 *   `composeDay` doc comment for why `"beforeCardio"` cannot be used there.
 */
export type ExtraPlacement = "beforeCardio" | "append";

/**
 * A day with its pending extra work worked in, and where each piece landed.
 *
 * **Pure concatenation, on purpose** — see `schema.ts` for why an extra
 * being a bare `ExerciseEntry` is what makes this safe: `buildSteps`,
 * `summariseDay`, `DayExerciseList` and the log's provenance all read
 * `day.exercises` as a flat list and none of them need to know an entry
 * arrived this way.
 *
 * **Expiry is completion-based, not set-based, and that distinction is
 * load-bearing.** An extra is excluded once `lastCompletedAt` is at or
 * after its `createdAt` — i.e. the day it was added to has been finished
 * again since. Checking `LoggedSet`s instead would break the very session
 * you add an extra to: you add it mid-session, then log sets against it
 * (including its own), all with `performedAt` after `createdAt` — if any
 * later activity expired it, it would vanish from the workout you just
 * added it to. A `WorkoutCompletion` is written exactly once, at the
 * natural close of a session, so it's the only signal that actually means
 * "this occurrence is over." See `lastCompletionFor`.
 *
 * Consequences, stated because they're easy to assume away:
 * - Never finishing or ending that session leaves the extra pending
 *   indefinitely — it just waits for whichever completion eventually lands.
 * - Adding an extra to a day already completed this cycle doesn't attach it
 *   retroactively; it shows starting the *next* time that day comes up.
 *
 * **`group` is always stripped**, defensively — a hand-edited backup or a
 * later form change could otherwise hand an extra a `group.id` matching the
 * day's last prescribed entry, and `groupRuns`' adjacency check would
 * silently fold it into that superset's rotation.
 *
 * **Sorted by `createdAt`, not collection order** — collection iteration
 * order isn't a contract, and a sync could deliver an extra from another
 * device out of order mid-session. Stable ordering is what makes each
 * kind's block internally chronological.
 *
 * **`"beforeCardio"` can insert mid-array, which is exactly why
 * `"append"` exists and is not just a simplification of it.** Appending at
 * the tail is safe on a running session because every step index before the
 * append point is provably unchanged (see `SessionPlayer`'s doc comment).
 * Inserting before an existing cardio block does *not* have that property —
 * it can shift the indices of steps the session has already shown or passed.
 * So a live session always composes with `"append"`, full stop; the
 * "correct" gym-order placement applies from the next time that day is
 * viewed fresh, not retroactively into a session already running on it.
 *
 * Returns the same `day` reference when nothing is pending, so callers'
 * `useMemo`s stay cheap on the common case (no extras logged at all).
 */
export function composeDay(
  day: TrainingDay,
  extras: ExtraWork[],
  target: DayTarget,
  lastCompletedAt: number | undefined,
  placement: ExtraPlacement = "beforeCardio",
): ComposedDay {
  const pending = extras
    .filter(
      (e) =>
        e.routineSlug === target.routineSlug &&
        e.weekNumber === target.weekNumber &&
        e.dayNumber === target.dayNumber,
    )
    .filter((e) => lastCompletedAt === undefined || e.createdAt >= lastCompletedAt)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  if (pending.length === 0) {
    return { day, extraIndices: new Set(), extraMeta: new Map() };
  }

  const toEntry = (e: ExtraWork): ExerciseEntry => ({ ...e.entry, group: undefined });
  const meta = (e: ExtraWork) => ({ id: e.id, createdAt: e.createdAt });

  if (placement === "append") {
    const start = day.exercises.length;
    const extraIndices = new Set<number>();
    const extraMeta = new Map<number, { id: string; createdAt: number }>();
    pending.forEach((e, i) => {
      extraIndices.add(start + i);
      extraMeta.set(start + i, meta(e));
    });
    return {
      day: { ...day, exercises: [...day.exercises, ...pending.map(toEntry)] },
      extraIndices,
      extraMeta,
    };
  }

  // A cardio extra keeps company with the day's own cardio, always last;
  // everything else goes ahead of it. `filter` preserves the `createdAt`
  // order already sorted above within each half.
  const nonCardio = pending.filter((e) => e.entry.kind !== "cardio");
  const cardio = pending.filter((e) => e.entry.kind === "cardio");

  const cardioAt = day.exercises.findIndex((e) => e.kind === "cardio");
  const insertAt = cardioAt === -1 ? day.exercises.length : cardioAt;

  const exercises = [
    ...day.exercises.slice(0, insertAt),
    ...nonCardio.map(toEntry),
    ...day.exercises.slice(insertAt),
    ...cardio.map(toEntry),
  ];

  const extraIndices = new Set<number>();
  const extraMeta = new Map<number, { id: string; createdAt: number }>();
  nonCardio.forEach((e, i) => {
    extraIndices.add(insertAt + i);
    extraMeta.set(insertAt + i, meta(e));
  });
  const cardioStart = exercises.length - cardio.length;
  cardio.forEach((e, i) => {
    extraIndices.add(cardioStart + i);
    extraMeta.set(cardioStart + i, meta(e));
  });

  return { day: { ...day, exercises }, extraIndices, extraMeta };
}
