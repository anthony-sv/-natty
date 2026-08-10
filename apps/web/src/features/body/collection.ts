import {
  createCollection,
  localStorageCollectionOptions,
  useLiveQuery,
} from "@tanstack/react-db";
import { useMemo } from "react";
import { bodyEntrySchema, type BodyEntry, type BodyEntryInput } from "./schema";

/**
 * Every weigh-in, persisted to localStorage.
 *
 * Separate collection from `natty.log.v1`: a body measurement shares no shape
 * with a training set, and nothing queries across the two.
 */
export const bodyEntries = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.body.v1",
    getKey: (entry) => entry.id,
    schema: bodyEntrySchema,
  }),
);

/** Record a weigh-in. Returns the row and its transaction, as `logSet` does. */
export function logBodyEntry(input: BodyEntryInput) {
  const entry = { ...input, id: crypto.randomUUID() };
  const transaction = bodyEntries.insert(entry);
  return { entry, transaction };
}

/** Every weigh-in, most recent first. */
export function useBodyEntries(): {
  entries: BodyEntry[];
  latest: BodyEntry | undefined;
  isLoading: boolean;
} {
  // Ordered by the query, not by a JS sort afterwards: `orderBy` is
  // incrementally maintained, where re-sorting the result array throws that
  // away and redoes the whole thing on every change.
  const { data, isLoading } = useLiveQuery((q) =>
    q.from({ entry: bodyEntries }).orderBy(({ entry }) => entry.measuredAt, "desc"),
  );

  const entries = useMemo(() => data ?? [], [data]);

  return { entries, latest: entries[0], isLoading };
}
