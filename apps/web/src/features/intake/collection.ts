import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import { deleteIntake, fetchIntake, upsertIntake } from "@/server/intake";
import { startOfDay } from "@/lib/week";
import { intakeEntrySchema, type IntakeEntry, type IntakeSource } from "./schema";

/**
 * Everything you've eaten, persisted to localStorage.
 *
 * Its own key and its own collection rather than a field on the diet plan: a
 * plan is a document you wrote, this is a record of what happened, and nothing
 * queries across them beyond `resolveIntake` reading both.
 */
const localIntakeEntries = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.intake.v1",
    getKey: (entry) => entry.id,
    schema: intakeEntrySchema,
  }),
);

export const intakeEntriesFork = forkCollection({
  queryKey: "intake-entries",
  local: localIntakeEntries,
  getKey: (entry) => entry.id,
  fetch: () => fetchIntake(),
  upsert: (rows) => upsertIntake({ data: rows }),
  remove: (ids) => deleteIntake({ data: ids }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const intakeEntries = () => intakeEntriesFork.active();

/**
 * Every entry, read straight from the collection.
 *
 * For event handlers, which must not read a `useLiveQuery` snapshot — the same
 * rule `setsFor` exists for, and the same class of bug if it's ignored: the
 * toggle below decides whether a meal is already ticked, and deciding that
 * from a stale render would log a duplicate.
 */
export function allIntake(): IntakeEntry[] {
  return [...intakeEntries().values()];
}

function insert(day: number, source: IntakeSource) {
  const entry: IntakeEntry = {
    id: crypto.randomUUID(),
    day: startOfDay(day),
    source,
    loggedAt: Date.now(),
  };
  return { entry, transaction: intakeEntries().insert(entry) };
}

export function logMeal(
  day: number,
  planSlug: string,
  mealName: string,
  optionIndex: number,
) {
  return insert(day, { kind: "meal", planSlug, mealName, optionIndex });
}

export function logItem(day: number, foodId: string, amount: number) {
  return insert(day, { kind: "item", foodId, amount });
}

/**
 * Log one serving of a supplement taken.
 *
 * **Not a toggle.** A supplement can be taken more than once a day —
 * `servingsPerDay` says how many — so each tap of an untaken box adds its own
 * row rather than flipping a single one. Untaking a serving is `removeIntake`
 * on that row's own id, the same function unticking a meal already uses;
 * there's nothing supplement-specific about taking a row away.
 */
export function logSupplementServing(day: number, supplementId: string) {
  return insert(day, { kind: "supplement", supplementId });
}

/** Returns the row so a toast can offer Undo, the way `deleteSet` does. */
export function removeIntake(id: string): IntakeEntry | undefined {
  const entry = intakeEntries().get(id);
  if (entry === undefined) return undefined;
  intakeEntries().delete(id);
  return entry;
}

export function restoreIntake(entry: IntakeEntry) {
  return intakeEntries().insert(entry);
}

/**
 * Change which swap of an already-ticked meal you ate.
 *
 * An update rather than a delete-and-insert so `loggedAt` — and therefore the
 * row's place in the day — survives changing your mind.
 */
export function setMealOption(id: string, optionIndex: number) {
  return intakeEntries().update(id, (draft) => {
    if (draft.source.kind === "meal") draft.source.optionIndex = optionIndex;
  });
}
