import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { userExerciseSchema, type UserExercise, type UserExerciseInput } from "./schema";

/**
 * Exercises you added yourself, persisted to localStorage.
 *
 * Its own key and its own collection rather than a flag on the built-in
 * library: `src/data/exercises/` is compiled-in and indexed into module-scope
 * `Map`s at import time, and it stays that way. Nothing here writes to it.
 */
export const userExercises = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.exercises.v1",
    getKey: (exercise) => exercise.id,
    schema: userExerciseSchema,
  }),
);

/**
 * Every custom exercise, read straight from the collection.
 *
 * For event handlers and for the name resolver, which must not depend on a
 * `useLiveQuery` snapshot — the same reasoning as `setsFor` in the log's
 * collection, and the same bug if it's ignored.
 */
export function allUserExercises(): UserExercise[] {
  return [...userExercises.values()];
}

export function getUserExercise(id: string): UserExercise | undefined {
  return userExercises.get(id);
}

export function createUserExercise(input: UserExerciseInput) {
  const exercise: UserExercise = {
    ...input,
    id: `user:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { exercise, transaction: userExercises.insert(exercise) };
}

export function updateUserExercise(id: string, patch: UserExerciseInput) {
  return userExercises.update(id, (draft) => {
    draft.name = patch.name;
    draft.aliases = patch.aliases;
    draft.pattern = patch.pattern;
    draft.primaryMuscles = patch.primaryMuscles;
    draft.secondaryMuscles = patch.secondaryMuscles;
    draft.notes = patch.notes;
  });
}

/** Hide it from the pickers, keeping every set already logged against it readable. */
export function archiveUserExercise(id: string) {
  return userExercises.update(id, (draft) => {
    draft.archivedAt = Date.now();
  });
}

export function restoreUserExercise(id: string) {
  return userExercises.update(id, (draft) => {
    draft.archivedAt = undefined;
  });
}

/**
 * Remove it outright.
 *
 * Only safe when nothing was ever logged against it — the caller checks, and
 * `LibraryPanel` offers archive instead when there is history. There is no undo
 * on this one because there is nothing to lose: an exercise with no sets is
 * just a name.
 */
export function deleteUserExercise(id: string) {
  const exercise = userExercises.get(id);
  return { exercise, transaction: userExercises.delete(id) };
}
