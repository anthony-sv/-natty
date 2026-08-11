import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";
import { routineSchema, routines, type Routine } from "@/data/routines";

/**
 * A routine you wrote yourself.
 *
 * `routineSchema` verbatim plus two timestamps, which is the whole trick: a
 * user routine **is** a `Routine`, so `buildSteps`, `summariseRoutine`,
 * `summariseDay`, the day page, the player and the log's provenance all work on
 * it with no change at all. Anything less faithful would have meant a second
 * renderer for every one of those.
 */
export const userRoutineSchema = routineSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type UserRoutine = z.infer<typeof userRoutineSchema>;

export const userRoutines = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.routines.v1",
    getKey: (routine) => routine.slug,
    schema: userRoutineSchema,
  }),
);

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
  while (BUILT_IN_SLUGS.has(slug) || userRoutines.get(slug) !== undefined) {
    slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  }
  return slug;
}

export function createUserRoutine(routine: Routine) {
  const now = Date.now();
  const row: UserRoutine = { ...routine, createdAt: now, updatedAt: now };
  return { routine: row, transaction: userRoutines.insert(row) };
}

export function updateUserRoutine(slug: string, routine: Routine) {
  return userRoutines.update(slug, (draft) => {
    // The slug is the key and is provenance on every set already logged against
    // it, so renaming a routine keeps its url and its history.
    Object.assign(draft, routine, { slug, updatedAt: Date.now() });
  });
}

/** Returns the row too, so the caller can offer an undo the way `deleteSet` does. */
export function deleteUserRoutine(slug: string) {
  const routine = userRoutines.get(slug);
  return { routine, transaction: userRoutines.delete(slug) };
}

export function restoreUserRoutine(routine: UserRoutine) {
  return userRoutines.insert(routine);
}
