import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteCardioEntries,
  fetchCardioEntries,
  upsertCardioEntries,
} from "@/server/cardio";
import {
  cardioEntrySchema,
  type CardioEntry,
  type CardioEntryInput,
} from "./cardio-schema";

/**
 * Every cardio session ever logged — the same shape `collection.ts`
 * establishes for `loggedSets`, kept as a parallel collection rather than a
 * third kind folded into it. See `cardio-schema.ts` for why.
 */
const localCardioEntries = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.cardio.v1",
    getKey: (entry) => entry.id,
    schema: cardioEntrySchema,
  }),
);

export const cardioEntriesFork = forkCollection({
  queryKey: "cardio-entries",
  local: localCardioEntries,
  getKey: (entry) => entry.id,
  fetch: () => fetchCardioEntries(),
  upsert: (rows) => upsertCardioEntries({ data: rows }),
  remove: (ids) => deleteCardioEntries({ data: ids }),
});

const cardioEntries = () => cardioEntriesFork.active();

export { localCardioEntries, cardioEntries };

/** Every cardio entry logged for one exercise, read straight from the collection. */
export function cardioFor(exerciseId: string): CardioEntry[] {
  return [...cardioEntries().values()].filter(
    (entry) => entry.exerciseId === exerciseId,
  );
}

/** Identifies one cardio entry within a running session — same shape as `StepRef`. */
export interface CardioStepRef {
  routineSlug: string;
  weekNumber: number;
  dayNumber: number;
  setNumber: number;
  exerciseId: string;
}

/** Everything recorded against this cardio step of the session. */
export function cardioForStep(ref: CardioStepRef): CardioEntry[] {
  return [...cardioEntries().values()].filter(
    (entry) =>
      entry.exerciseId === ref.exerciseId &&
      entry.routineSlug === ref.routineSlug &&
      entry.weekNumber === ref.weekNumber &&
      entry.dayNumber === ref.dayNumber &&
      entry.setNumber === ref.setNumber,
  );
}

/** Record a cardio session. */
export function logCardio(input: CardioEntryInput) {
  const entry = { ...input, id: crypto.randomUUID() };
  const transaction = cardioEntries().insert(entry);
  return { entry, transaction };
}

/** Correct a cardio entry logged wrong — same reasoning as `updateSet`. */
export function updateCardio(
  id: string,
  patch: Pick<CardioEntry, "distance" | "unit" | "durationSeconds" | "performedAt">,
) {
  return cardioEntries().update(id, (draft) => {
    draft.distance = patch.distance;
    draft.unit = patch.unit;
    draft.durationSeconds = patch.durationSeconds;
    draft.performedAt = patch.performedAt;
  });
}

/** Remove a cardio entry. Returns the row too, so the caller can offer an undo. */
export function deleteCardio(id: string) {
  const entry = cardioEntries().get(id);
  const transaction = cardioEntries().delete(id);
  return { entry, transaction };
}

/** Put a deleted cardio entry back, id and all — what the undo on the toast calls. */
export function restoreCardio(entry: CardioEntry) {
  return cardioEntries().insert(entry);
}
