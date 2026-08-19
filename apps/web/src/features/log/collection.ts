import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteLoggedSets,
  fetchLoggedSets,
  upsertLoggedSets,
} from "@/server/log";
import { isNewRecord } from "./pr";
import {
  loggedSetSchema,
  type LoggedSet,
  type LoggedSetInput,
} from "./schema";

/**
 * Every set ever logged.
 *
 * A TanStack DB collection rather than another hand-rolled Store +
 * localStorage pair like `session-store.ts`: this data is queried (per
 * exercise, for PRs and last-set) rather than just read whole, and the
 * collection gives live queries and cross-tab sync for free — which is also
 * what let it gain a server backing without a single caller changing.
 *
 * Separate key from `natty.session.v1` on purpose — the session is scratch
 * state that `endSession()` throws away, this is the permanent record.
 */
const localLoggedSets = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.log.v1",
    getKey: (set) => set.id,
    schema: loggedSetSchema,
  }),
);

export const loggedSetsFork = forkCollection({
  queryKey: "logged-sets",
  local: localLoggedSets,
  getKey: (set) => set.id,
  fetch: () => fetchLoggedSets(),
  upsert: (rows) => upsertLoggedSets({ data: rows }),
  remove: (ids) => deleteLoggedSets({ data: ids }),
});

/**
 * The collection backing the app right now.
 *
 * A function, not a const: which one it is depends on whether you're signed
 * in, and that changes while the app is running.
 */
const loggedSets = () => loggedSetsFork.active();

export { localLoggedSets, loggedSets };

/**
 * Every set logged for one exercise, read straight from the collection.
 *
 * For event handlers, which must not use the `useLiveQuery` snapshot from
 * `useExerciseLog`: that snapshot is whatever the last render saw, and on the
 * first render after the player advances to a new set it can be empty (query
 * still warming) or hold the previous exercise's rows. Deciding "is this a
 * record?" from it produced both a false PR on a repeated set and a missed PR
 * on a first-ever one.
 */
export function setsFor(exerciseId: string): LoggedSet[] {
  return [...loggedSets().values()].filter(
    (set) => set.exerciseId === exerciseId,
  );
}

/** Identifies one set of one exercise within a running session. */
export interface StepRef {
  routineSlug: string;
  weekNumber: number;
  dayNumber: number;
  setNumber: number;
  exerciseId: string;
}

/**
 * Everything recorded against this step of the session.
 *
 * A list rather than a single set: one prescribed set can hold more than one
 * logged entry, which is how a drop set or extra work beyond the prescription
 * gets recorded. Matched on provenance rather than tracked in component state
 * so it survives remounting and stepping Back and forward again.
 */
export function loggedSetsForStep(ref: StepRef): LoggedSet[] {
  return [...loggedSets().values()].filter(
    (set) =>
      set.exerciseId === ref.exerciseId &&
      set.routineSlug === ref.routineSlug &&
      set.weekNumber === ref.weekNumber &&
      set.dayNumber === ref.dayNumber &&
      set.setNumber === ref.setNumber,
  );
}

/**
 * Whether anything has been logged against this training day at all,
 * regardless of which exercise or set.
 *
 * Logging is explicit — advancing through the player's steps records nothing
 * on its own — so a session that ends without a single popover submitted
 * leaves no trace here, and `nextTrainingDay` then reads exactly like the day
 * was never trained. `hasLoggedAnythingForDay` (this, plus its cardio
 * counterpart) is what lets the player say so before you close the session
 * rather than leaving that discovery for the heatmap tomorrow.
 */
export function hasLoggedSetsForDay(
  ref: Omit<StepRef, "setNumber" | "exerciseId">,
): boolean {
  return [...loggedSets().values()].some(
    (set) =>
      set.routineSlug === ref.routineSlug &&
      set.weekNumber === ref.weekNumber &&
      set.dayNumber === ref.dayNumber,
  );
}

/**
 * Record a set, and say whether it was a personal record.
 *
 * `isRecord` is decided here rather than by the caller because it is
 * order-sensitive: the write is optimistic, so the new row is visible the
 * instant it is inserted. Judging after that would compare the set against
 * itself, tie, and never report a record.
 *
 * `transaction.isPersisted.promise` resolves once the write has landed — that
 * is what the "logged" toast tracks, and it stays meaningful if a
 * server-backed adapter ever replaces localStorage.
 */
export function logSet(input: LoggedSetInput) {
  const previouslyLogged = setsFor(input.exerciseId);
  const set = { ...input, id: crypto.randomUUID() };
  const transaction = loggedSets().insert(set);
  return { set, transaction, isRecord: isNewRecord(previouslyLogged, set) };
}

/**
 * Correct a set that was logged wrong.
 *
 * **Nothing needs fixing up afterwards.** `isRecord` is decided by `prFrontier`
 * every time it's asked and is never stored, so changing a weight silently
 * corrects the records table, both exercise charts and the PR line the player
 * shows mid-set. That is the whole reason this is safe to offer: without a
 * derived frontier, editing one row would leave a stale record behind it.
 *
 * `exerciseId` deliberately isn't editable — a set logged against the wrong
 * lift is a different set, and moving it would silently rewrite two exercises'
 * histories at once. Delete it and log the right one.
 */
export function updateSet(
  id: string,
  patch: Pick<LoggedSet, "weight" | "unit" | "reps" | "performedAt">,
) {
  return loggedSets().update(id, (draft) => {
    draft.weight = patch.weight;
    draft.unit = patch.unit;
    draft.reps = patch.reps;
    draft.performedAt = patch.performedAt;
  });
}

/** Remove a set. Returns the row too, so the caller can offer an undo. */
export function deleteSet(id: string) {
  const set = loggedSets().get(id);
  const transaction = loggedSets().delete(id);
  return { set, transaction };
}

/** Put a deleted set back, id and all — what the undo on the toast calls. */
export function restoreSet(set: LoggedSet) {
  return loggedSets().insert(set);
}

/** Every set logged on one local calendar day, for the history sheet. */
export function setsBetween(from: number, to: number): LoggedSet[] {
  return [...loggedSets().values()]
    .filter((set) => set.performedAt >= from && set.performedAt < to)
    .sort((a, b) => a.performedAt - b.performedAt);
}
