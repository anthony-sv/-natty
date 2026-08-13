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
