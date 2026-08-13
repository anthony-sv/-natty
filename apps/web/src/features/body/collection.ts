import {
  createCollection,
  localStorageCollectionOptions,
  useLiveQuery,
} from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { useMemo } from "react";
import { queryClient } from "@/lib/query-client";
import { sessionStore, useSession } from "@/features/auth/session-store";
import {
  deleteBodyEntries,
  fetchBodyEntries,
  upsertBodyEntries,
} from "@/server/body";
import { bodyEntrySchema, type BodyEntry, type BodyEntryInput } from "./schema";

/**
 * Every weigh-in. Two backings, one interface — the pilot for taking the
 * whole data layer server-side.
 *
 * Signed out, this is the localStorage collection it always was. Signed in,
 * it's a query collection whose reads and writes go through server functions,
 * scoped to the account. Everything downstream (`useBodyEntries`, FFMI, the
 * charts, the trend tables) sees only the collection interface and can't
 * tell the difference — which is the point.
 *
 * The local collection is *not* migrated or cleared on sign-in: it stays this
 * device's data, visible again the moment you sign out. The account page
 * offers the one-tap upload of local rows the account doesn't have.
 */

/** Separate collection from `natty.log.v1` — shapes share nothing. */
export const localBodyEntries = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.body.v1",
    getKey: (entry) => entry.id,
    schema: bodyEntrySchema,
  }),
);

/**
 * Created lazily: the collection only exists once someone is signed in, and
 * creating it eagerly would fire an unauthenticated fetch on every boot.
 */
let synced: ReturnType<typeof createSyncedCollection> | null = null;

function createSyncedCollection() {
  return createCollection(
    queryCollectionOptions({
      queryKey: ["body-entries"],
      queryFn: () => fetchBodyEntries(),
      queryClient,
      getKey: (entry: BodyEntry) => entry.id,
      schema: bodyEntrySchema,
      onInsert: async ({ transaction }) => {
        await upsertBodyEntries({
          data: transaction.mutations.map((m) => m.modified),
        });
      },
      onUpdate: async ({ transaction }) => {
        await upsertBodyEntries({
          data: transaction.mutations.map((m) => m.modified),
        });
      },
      onDelete: async ({ transaction }) => {
        await deleteBodyEntries({
          data: transaction.mutations.map((m) => String(m.key)),
        });
      },
    }),
  );
}

export function syncedBodyEntries() {
  synced ??= createSyncedCollection();
  return synced;
}

/**
 * The collection the app should read and write *right now*.
 *
 * Session `loading` resolves to local: the store settles from the cookie in
 * milliseconds, and a boot-time reader is better served by this device's data
 * than by an unauthenticated fetch that would be thrown away.
 */
export function activeBodyEntries() {
  return sessionStore.state.status === "signed-in"
    ? syncedBodyEntries()
    : localBodyEntries;
}

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
  const session = useSession();
  const collection =
    session.status === "signed-in" ? syncedBodyEntries() : localBodyEntries;

  // Ordered by the query, not by a JS sort afterwards: `orderBy` is
  // incrementally maintained, where re-sorting the result array throws that
  // away and redoes the whole thing on every change. The dep re-subscribes
  // the live query when sign-in swaps the backing collection.
  const { data, isLoading } = useLiveQuery(
    (q) =>
      q.from({ entry: collection }).orderBy(({ entry }) => entry.measuredAt, "desc"),
    [collection],
  );

  const entries = useMemo(() => data ?? [], [data]);

  return { entries, latest: entries[0], isLoading };
}
