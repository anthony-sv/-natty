import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteDocuments,
  fetchDocuments,
  upsertDocuments,
} from "@/server/documents";
import { extraWorkSchema, type ExtraWork, type ExtraWorkInput } from "./schema";

/**
 * Extra work, persisted to localStorage.
 *
 * A seventh `user_documents` kind rather than a table of its own — the same
 * case `src/features/supplements/collection.ts` made for the sixth: a
 * handful of small documents, read whole, queried client-side. No
 * migration, no new table, no new endpoint.
 */
const localExtras = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.extras.v1",
    getKey: (extra) => extra.id,
    schema: extraWorkSchema,
  }),
);

export const extrasFork = forkCollection({
  queryKey: "extras",
  local: localExtras,
  getKey: (extra) => extra.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "extra" } })) as ExtraWork[],
  upsert: (rows) => upsertDocuments({ data: { kind: "extra", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "extra", ids } }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const extras = () => extrasFork.active();

/**
 * Every extra ever logged, read straight from the collection.
 *
 * For event handlers, which must not depend on a `useLiveQuery` snapshot —
 * the rule `setsFor` (`features/log/collection.ts`) exists for.
 */
export function allExtras(): ExtraWork[] {
  return [...extras().values()];
}

export function createExtra(input: ExtraWorkInput) {
  const extra: ExtraWork = {
    ...input,
    id: `extra:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { extra, transaction: extras().insert(extra) };
}

/** Remove an extra. Returns the row too, so the caller can offer an undo. */
export function deleteExtra(id: string) {
  const extra = extras().get(id);
  const transaction = extras().delete(id);
  return { extra, transaction };
}

/** Put a deleted extra back, id and `createdAt` both — what undo calls.
 *
 * Keeping the original `createdAt` matters beyond restoring the row
 * verbatim: it's what `composeDay` sorts and expires by, so restoring with
 * a fresh timestamp would silently reorder it or resurrect an already-spent
 * one as pending again.
 */
export function restoreExtra(extra: ExtraWork) {
  return extras().insert(extra);
}
