import { normalizeName } from "@/data/normalize";
import {
  exercises,
  getExercise,
  movementOf,
  musclesForExercise,
  type MovementPattern,
  type MuscleId,
} from "@/data/exercises";
import type { ExerciseAnatomy } from "@/features/log/volume";
import type { UserExercise } from "./schema";

/**
 * One row of the merged library — a built-in or a custom lift, flattened to
 * what every consumer actually needs.
 *
 * Flattening is what keeps the merge honest. A built-in resolves its muscles
 * through `musclesForExercise` (which applies a variant's override) and its
 * pattern through its movement; a custom one carries both directly. Callers
 * shouldn't have to know which they're holding, and before this existed every
 * caller reached for `getExercise` and would silently miss half the library.
 */
export interface LibraryEntry {
  id: string;
  name: string;
  aliases: string[];
  pattern: MovementPattern;
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  isCustom: boolean;
  /** Custom and archived: resolves everywhere, offered nowhere. */
  isArchived: boolean;
}

function fromBuiltIn(id: string): LibraryEntry | undefined {
  const exercise = getExercise(id);
  if (exercise === undefined) return undefined;
  const { primaryMuscles, secondaryMuscles } = musclesForExercise(exercise);
  return {
    id: exercise.id,
    name: exercise.name,
    aliases: exercise.aliases,
    pattern: movementOf(exercise).pattern,
    primaryMuscles,
    secondaryMuscles,
    isCustom: false,
    isArchived: false,
  };
}

/** Built once — the compiled-in half never changes. */
const BUILT_IN: LibraryEntry[] = exercises.map(
  (exercise) => fromBuiltIn(exercise.id)!,
);

function fromUser(exercise: UserExercise): LibraryEntry {
  return {
    id: exercise.id,
    name: exercise.name,
    aliases: exercise.aliases,
    pattern: exercise.pattern,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    isCustom: true,
    isArchived: exercise.archivedAt !== undefined,
  };
}

export interface MergedLibrary {
  /** Everything, archived included — this is what *resolves* an id. */
  all: LibraryEntry[];
  /** What a picker offers: archived custom lifts are excluded. */
  selectable: LibraryEntry[];
  byId: (id: string) => LibraryEntry | undefined;
  /** Case- and punctuation-insensitive, like the built-in resolver. */
  byName: (name: string) => LibraryEntry | undefined;
  anatomy: ExerciseAnatomy;
  /** Every muscle something in the merged library makes primary. */
  trainableDirectly: ReadonlySet<MuscleId>;
}

/**
 * Merge the compiled-in library with a user's own exercises.
 *
 * Pure and taking the user rows as an argument, like everything else in this
 * codebase's derivation layer — so it tests without a collection and without
 * React, and `useLibrary` is a thin memo over it.
 */
export function mergeLibrary(userRows: UserExercise[]): MergedLibrary {
  const all = [...BUILT_IN, ...userRows.map(fromUser)];

  const byId = new Map(all.map((entry) => [entry.id, entry]));

  const byName = new Map<string, LibraryEntry>();
  for (const entry of all) {
    for (const spelling of [entry.name, ...entry.aliases]) {
      const key = normalizeName(spelling);
      // First writer wins, so a custom exercise can never shadow a built-in
      // name. Letting it would silently repoint an authored routine's lookup at
      // a user's row, and the built-in library is the one with the curation.
      if (!byName.has(key)) byName.set(key, entry);
    }
  }

  const anatomy: ExerciseAnatomy = {
    muscles: (id) => {
      const entry = byId.get(id);
      return entry === undefined
        ? { primary: [], secondary: [] }
        : { primary: entry.primaryMuscles, secondary: entry.secondaryMuscles };
    },
    pattern: (id) => byId.get(id)?.pattern,
  };

  return {
    all,
    selectable: all.filter((entry) => !entry.isArchived),
    byId: (id) => byId.get(id),
    byName: (name) => byName.get(normalizeName(name)),
    anatomy,
    trainableDirectly: new Set(all.flatMap((entry) => entry.primaryMuscles)),
  };
}
