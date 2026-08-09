import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { isNewRecord } from "./pr";
import {
  loggedSetSchema,
  type LoggedSet,
  type LoggedSetInput,
} from "./schema";

/**
 * Every set ever logged, persisted to localStorage.
 *
 * A TanStack DB collection rather than another hand-rolled Store +
 * localStorage pair like `session-store.ts`: this data is queried (per
 * exercise, for PRs and last-set) rather than just read whole, and the
 * collection gives live queries and cross-tab sync for free. Swapping to a
 * server-backed adapter later changes only the options creator here.
 *
 * Separate key from `natty.session.v1` on purpose — the session is scratch
 * state that `endSession()` throws away, this is the permanent record.
 */
export const loggedSets = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.log.v1",
    getKey: (set) => set.id,
    schema: loggedSetSchema,
  }),
);

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
  return [...loggedSets.values()].filter(
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
  return [...loggedSets.values()].filter(
    (set) =>
      set.exerciseId === ref.exerciseId &&
      set.routineSlug === ref.routineSlug &&
      set.weekNumber === ref.weekNumber &&
      set.dayNumber === ref.dayNumber &&
      set.setNumber === ref.setNumber,
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
  const transaction = loggedSets.insert(set);
  return { set, transaction, isRecord: isNewRecord(previouslyLogged, set) };
}
