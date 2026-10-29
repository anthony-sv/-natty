import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import {
  allIntake,
  removeIntakeEntries,
  restoreIntakeEntries,
} from "@/features/intake/collection";
import type { IntakeEntry } from "@/features/intake/schema";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteDocuments,
  fetchDocuments,
  upsertDocuments,
} from "@/server/documents";
import {
  supplementSchema,
  type Supplement,
  type SupplementInput,
} from "./schema";
import { ticksOf } from "./supplements";

/**
 * Your supplement stack, persisted to localStorage.
 *
 * A sixth `user_documents` kind rather than a table of its own, which is
 * exactly the case that table was shaped for: a handful of small documents,
 * read whole, queried client-side. It needed no migration — the reason the
 * five authored kinds share one table in the first place.
 */
const localSupplements = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.supplements.v1",
    getKey: (supplement) => supplement.id,
    schema: supplementSchema,
  }),
);

export const supplementsFork = forkCollection({
  queryKey: "supplements",
  local: localSupplements,
  getKey: (supplement) => supplement.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "supplement" } })) as Supplement[],
  upsert: (rows) => upsertDocuments({ data: { kind: "supplement", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "supplement", ids } }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const supplements = () => supplementsFork.active();

/**
 * The whole stack, read straight from the collection.
 *
 * For event handlers and for name resolution, which must not depend on a
 * `useLiveQuery` snapshot — the rule `setsFor` exists for.
 */
export function allSupplements(): Supplement[] {
  return [...supplements().values()];
}

export function getSupplement(id: string): Supplement | undefined {
  return supplements().get(id);
}

export function createSupplement(input: SupplementInput) {
  const supplement: Supplement = {
    ...input,
    id: `supplement:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { supplement, transaction: supplements().insert(supplement) };
}

export function updateSupplement(id: string, patch: SupplementInput) {
  return supplements().update(id, (draft) => {
    draft.name = patch.name;
    draft.amount = patch.amount;
    draft.unit = patch.unit;
    draft.servingsPerDay = patch.servingsPerDay;
    draft.timing = patch.timing;
  });
}

/** Off the checklist, still readable on every day you ticked it. */
export function archiveSupplement(id: string) {
  return supplements().update(id, (draft) => {
    draft.archivedAt = Date.now();
  });
}

export function restoreSupplement(id: string) {
  return supplements().update(id, (draft) => {
    draft.archivedAt = undefined;
  });
}

/**
 * Remove it outright.
 *
 * Offered straight away when nothing was ever ticked against it — the
 * checklist archives instead when there is history, the same call
 * `LibraryPanel` makes.
 */
export function deleteSupplement(id: string) {
  const supplement = supplements().get(id);
  return { supplement, transaction: supplements().delete(id) };
}

/**
 * Remove it **and every tick against it**, for good.
 *
 * Archiving stays the default once something's been ticked, because it keeps
 * the days you took it. This is the other choice, offered from the archived
 * list behind a confirm: a supplement you'd rather your history didn't
 * mention at all. Deleting only the supplement would leave its ticks behind
 * as nameless orphans, which is the thing archiving exists to avoid.
 */
export function deleteSupplementAndTicks(id: string): {
  supplement: Supplement | undefined;
  ticks: IntakeEntry[];
} {
  const supplement = supplements().get(id);
  const ticks = removeIntakeEntries(ticksOf(allIntake(), id).map((t) => t.id));
  if (supplement !== undefined) supplements().delete(id);
  return { supplement, ticks };
}

/** Undo for `deleteSupplementAndTicks`. */
export function restoreSupplementAndTicks(
  supplement: Supplement,
  ticks: IntakeEntry[],
) {
  supplements().insert(supplement);
  restoreIntakeEntries(ticks);
}
