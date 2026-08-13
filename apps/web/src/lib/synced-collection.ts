import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/query-client";
import { sessionStore, useSession } from "@/features/auth/session-store";

/**
 * One collection, two backings.
 *
 * Signed out it's the localStorage collection the app has always had; signed
 * in it's a query collection over server functions. Every consumer goes
 * through `active()` or `useActive()` and sees only the collection interface,
 * which is what let the whole derivation layer survive the move to a server
 * untouched.
 *
 * Local rows are never migrated or cleared on sign-in — sign out and the
 * device shows its own data again. The account page offers the explicit,
 * idempotent upload instead.
 *
 * **A synced collection belongs to exactly one account, and that is a
 * security property rather than bookkeeping.** The instance used to be
 * memoised in a bare `synced ??=` with a cache key of `[queryKey]`, and
 * nothing dropped it when the session changed — so on a shared browser, A
 * signing out and B signing in handed B the same populated instance, and B's
 * first render of `/progress` painted A's logged sets, weigh-ins and
 * measurements until a refetch replaced them. Signing out is not a reload
 * here, so nothing else was going to clear it either.
 */
export interface ForkedCollection<TCollection> {
  /** This device's own data, whoever is signed in. */
  local: TCollection;
  /** How a row is keyed — what the upload diff compares. */
  getKey: (row: never) => string;
  /** The account's data. Created on first use — see below. */
  synced: () => TCollection;
  /** Whichever backs the app right now. For plain functions and handlers. */
  active: () => TCollection;
  /** The same choice, as a hook, so components re-render when it changes. */
  useActive: () => TCollection;
}

export interface SyncedCollectionOptions<TRow extends object, TCollection> {
  /** Distinguishes this collection's cache entry from every other one. */
  queryKey: string;
  local: TCollection;
  getKey: (row: TRow) => string;
  fetch: () => Promise<Array<TRow>>;
  upsert: (rows: Array<TRow>) => Promise<unknown>;
  remove: (keys: Array<string>) => Promise<unknown>;
}

/**
 * Every fork's teardown, so one subscription can reset all of them together
 * rather than each collection module wiring up its own.
 */
const resetters = new Set<() => void>();

/**
 * Stop a collection syncing and drop the rows it holds.
 *
 * Not awaited anywhere: the reference is already gone by the time this runs,
 * and it's the *reference* that decides what the next account is handed. This
 * only stops the old one polling and frees its rows.
 */
function discard(collection: unknown): void {
  void (collection as { cleanup?: () => Promise<void> } | null)?.cleanup?.();
}

if (typeof document !== "undefined") {
  let owner = sessionStore.state.userId;
  sessionStore.subscribe(() => {
    const next = sessionStore.state.userId;
    // Only a change of *account*. The store also fires for the email
    // resolving and for token refreshes, neither of which is a new user.
    if (next === owner) return;
    owner = next;
    for (const reset of resetters) reset();
    // The react-query cache outlives the collection that filled it, so
    // dropping the collections alone would leave the previous account's rows
    // sitting in the singleton client.
    queryClient.clear();
  });
}

export function forkCollection<TRow extends object, TCollection>({
  queryKey,
  local,
  getKey,
  fetch,
  upsert,
  remove,
}: SyncedCollectionOptions<TRow, TCollection>): ForkedCollection<TCollection> {
  let synced: TCollection | null = null;
  /** Which account `synced` was built for — `null` when there isn't one. */
  let syncedOwner: string | null = null;

  resetters.add(() => {
    const stale = synced;
    synced = null;
    syncedOwner = null;
    discard(stale);
  });

  /**
   * Lazy, and that matters: creating it eagerly would fire an
   * unauthenticated fetch on every boot, signed in or not.
   */
  const getSynced = (): TCollection => {
    const userId = sessionStore.state.userId;

    // The subscription above normally clears this the moment the account
    // changes. This is the guarantee rather than the tidying: whatever else
    // happened, a collection built for someone else is never handed out.
    if (synced !== null && syncedOwner !== userId) {
      discard(synced);
      synced = null;
    }

    if (synced === null) {
      syncedOwner = userId;
      synced = createCollection(
        queryCollectionOptions({
          // The account is part of the key, so two accounts can't read each
          // other's cache entry even if one outlives its collection.
          queryKey: [queryKey, userId],
          queryFn: () => fetch(),
          queryClient,
          getKey,
          // Mutations arrive as whole transactions, so each of these is one
          // round trip however many rows it carries.
          onInsert: async ({ transaction }) => {
            await upsert(transaction.mutations.map((m) => m.modified as TRow));
          },
          onUpdate: async ({ transaction }) => {
            await upsert(transaction.mutations.map((m) => m.modified as TRow));
          },
          onDelete: async ({ transaction }) => {
            await remove(transaction.mutations.map((m) => String(m.key)));
          },
        }),
        // The one cast, made here so no call site needs one. The two adapters
        // differ only in generics nothing in this app touches — adapter `utils`
        // and how each carries its schema — while the rows, the key and every
        // method the app actually calls are identical. Typing both as the local
        // collection's type is what keeps `active()` a single type rather than a
        // union every consumer would have to narrow.
      ) as unknown as TCollection;
    }

    return synced;
  };

  /**
   * `loading` resolves to local: the session settles from the cookie in
   * milliseconds, and a boot-time reader is better served by this device's
   * data than by an unauthenticated fetch that would be thrown away.
   */
  return {
    local,
    getKey: getKey as (row: never) => string,
    synced: getSynced,
    active: () =>
      sessionStore.state.status === "signed-in" ? getSynced() : local,
    useActive: () => {
      const session = useSession();
      return session.status === "signed-in" ? getSynced() : local;
    },
  };
}
