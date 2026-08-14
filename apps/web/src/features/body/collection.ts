import {
  createCollection,
  localStorageCollectionOptions,
  useLiveQuery,
} from "@tanstack/react-db";
import { useMemo } from "react";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteBodyEntries,
  fetchBodyEntries,
  upsertBodyEntries,
} from "@/server/body";
import { bodyEntrySchema, type BodyEntry, type BodyEntryInput } from "./schema";

/**
 * Every weigh-in — the collection that piloted the fork every other one now
 * uses. See `lib/synced-collection.ts` for how the two backings work.
 *
 * Separate collection from `natty.log.v1`: a body measurement shares no shape
 * with a training set, and nothing queries across the two.
 */
const localBodyEntries = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.body.v1",
    getKey: (entry) => entry.id,
    schema: bodyEntrySchema,
  }),
);

export const bodyEntriesFork = forkCollection({
  queryKey: "body-entries",
  local: localBodyEntries,
  getKey: (entry: BodyEntry) => entry.id,
  fetch: () => fetchBodyEntries(),
  upsert: (rows) => upsertBodyEntries({ data: rows }),
  remove: (ids) => deleteBodyEntries({ data: ids }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const activeBodyEntries = () => bodyEntriesFork.active();

/** Record a weigh-in. Returns the row and its transaction, as `logSet` does. */
export function logBodyEntry(input: BodyEntryInput) {
  const entry = { ...input, id: crypto.randomUUID() };
  const transaction = activeBodyEntries().insert(entry);
  return { entry, transaction };
}

/**
 * Correct a weigh-in — weight, unit, body fat, or the date it happened.
 *
 * The date is editable on purpose (`schema.ts` says so) — a weigh-in entered
 * a day late should be dated to when it happened, not to when you typed it,
 * or the heatmap and the weekly averages both file it under the wrong day.
 */
export function updateBodyEntry(id: string, patch: BodyEntryInput): void {
  activeBodyEntries().update(id, (draft) => Object.assign(draft, patch));
}

/**
 * Remove one, handing back the row so a toast can offer Undo.
 *
 * Immediate rather than behind a confirm — the same call `deleteMeasurement`
 * and `deleteSet` make: small, frequent and fully reversible, so a dialog
 * would only add friction undo already covers. Nothing needs fixing up
 * afterwards either — FFMI, the weekly average and the heatmap are all
 * derived from the rows on each read, never stored.
 */
export function deleteBodyEntry(id: string): BodyEntry | undefined {
  const entry = activeBodyEntries().get(id);
  if (entry !== undefined) activeBodyEntries().delete(id);
  return entry;
}

export function restoreBodyEntry(entry: BodyEntry): void {
  activeBodyEntries().insert(entry);
}

/** Every weigh-in, most recent first. */
export function useBodyEntries(): {
  entries: BodyEntry[];
  latest: BodyEntry | undefined;
  isLoading: boolean;
} {
  const collection = bodyEntriesFork.useActive();

  // Ordered by the query, not by a JS sort afterwards: `orderBy` is
  // incrementally maintained, where re-sorting the result array throws that
  // away and redoes the whole thing on every change. The dep re-subscribes
  // the live query when sign-in swaps the backing collection.
  const { data, isLoading } = useLiveQuery(
    (q) =>
      q
        .from({ entry: collection })
        .orderBy(({ entry }) => entry.measuredAt, "desc"),
    [collection],
  );

  const entries = useMemo(() => data ?? [], [data]);

  return { entries, latest: entries[0], isLoading };
}
