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
import { routines, type Routine } from "@/data/routines";
import { userRoutineSchema, type UserRoutine } from "./schema";

// Re-exported so the many existing importers don't all have to move.
export { userRoutineSchema, type UserRoutine };

const localUserRoutines = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.routines.v1",
    getKey: (routine) => routine.slug,
    schema: userRoutineSchema,
  }),
);

export const userRoutinesFork = forkCollection({
  queryKey: "routines",
  local: localUserRoutines,
  getKey: (routine) => routine.slug,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "routine" } })) as UserRoutine[],
  upsert: (rows) => upsertDocuments({ data: { kind: "routine", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "routine", ids } }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const userRoutines = () => userRoutinesFork.active();

/** Slugs the built-in programs already own. */
const BUILT_IN_SLUGS = new Set(routines.map((routine) => routine.slug));

/**
 * A url-safe slug for a new routine, guaranteed not to collide.
 *
 * The suffix isn't decoration. A slug lands in `LoggedSet.routineSlug` as
 * provenance, so two routines sharing one would merge each other's history —
 * and "Push day" is exactly the name two people (or one person, twice) would
 * pick. Checked against the built-ins too, so naming yours "Bulking" can't
 * shadow the real one.
 */
export function slugFor(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      // Strip accents, so "Día de glúteos" doesn't become a string of dashes.
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "routine";

  let slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  while (BUILT_IN_SLUGS.has(slug) || userRoutines().get(slug) !== undefined) {
    slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  }
  return slug;
}

export function createUserRoutine(routine: Routine) {
  const now = Date.now();
  const row: UserRoutine = { ...routine, createdAt: now, updatedAt: now };
  return { routine: row, transaction: userRoutines().insert(row) };
}

/** Whether this slug belongs to one of the compiled-in programs. */
export function isBuiltInSlug(slug: string): boolean {
  return BUILT_IN_SLUGS.has(slug);
}

/**
 * Save your edit of a built-in, at the built-in's own slug.
 *
 * Deliberately **not** routed through `slugFor`, which exists to avoid exactly
 * this collision. Here the collision is the mechanism: `useRoutines` drops any
 * built-in whose slug you've saved over, so your version replaces it in every
 * list and picker instead of appearing beside it under the same name.
 *
 * Keeping the slug also keeps a session you're part-way through resumable —
 * `isSessionFor` matches on it — which a fresh slug would quietly break.
 */
export function saveBuiltInOverride(routine: Routine) {
  const existing = userRoutines().get(routine.slug);
  if (existing !== undefined) return updateUserRoutine(routine.slug, routine);

  const now = Date.now();
  const row: UserRoutine = { ...routine, createdAt: now, updatedAt: now };
  return userRoutines().insert(row);
}

/**
 * Throw your edit away and get the shipped program back.
 *
 * Possible at all because the original is compiled in and was never touched —
 * an override is one row in localStorage, so undoing it is deleting that row.
 */
export function resetBuiltIn(slug: string) {
  const routine = userRoutines().get(slug);
  return { routine, transaction: userRoutines().delete(slug) };
}

export function updateUserRoutine(slug: string, routine: Routine) {
  return userRoutines().update(slug, (draft) => {
    // The slug is the key and is provenance on every set already logged against
    // it, so renaming a routine keeps its url and its history.
    Object.assign(draft, routine, { slug, updatedAt: Date.now() });
  });
}

/** Returns the row too, so the caller can offer an undo the way `deleteSet` does. */
export function deleteUserRoutine(slug: string) {
  const routine = userRoutines().get(slug);
  return { routine, transaction: userRoutines().delete(slug) };
}

export function restoreUserRoutine(routine: UserRoutine) {
  return userRoutines().insert(routine);
}
