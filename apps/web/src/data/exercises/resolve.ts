import { normalizeName } from "@/data/normalize";
import { exercises } from "./exercises";
import { movements } from "./movements";
import { musclesFor, type Exercise, type MuscleId, type Movement } from "./schema";

const movementsById = new Map<string, Movement>();
for (const movement of movements) {
  if (movementsById.has(movement.id)) {
    throw new Error(`Duplicate movement id: ${movement.id}`);
  }
  movementsById.set(movement.id, movement);
}

const exercisesById = new Map<string, Exercise>();
const exercisesByName = new Map<string, Exercise>();

for (const exercise of exercises) {
  if (exercisesById.has(exercise.id)) {
    throw new Error(`Duplicate exercise id: ${exercise.id}`);
  }
  if (!movementsById.has(exercise.movementId)) {
    throw new Error(
      `Exercise "${exercise.id}" references unknown movement "${exercise.movementId}"`,
    );
  }
  exercisesById.set(exercise.id, exercise);

  // The curated name is matchable too, so it never has to be repeated below it.
  for (const spelling of [exercise.name, ...exercise.aliases]) {
    const key = normalizeName(spelling);
    const claimed = exercisesByName.get(key);
    if (claimed && claimed.id !== exercise.id) {
      throw new Error(
        `Name "${spelling}" is claimed by both "${claimed.id}" and "${exercise.id}"`,
      );
    }
    exercisesByName.set(key, exercise);
  }
}

/** Resolve a written exercise name to its library entry, if it's known. */
export function resolveExerciseName(name: string): Exercise | undefined {
  return exercisesByName.get(normalizeName(name));
}

export function getExercise(id: string): Exercise | undefined {
  return exercisesById.get(id);
}

export function getMovement(id: string): Movement | undefined {
  return movementsById.get(id);
}

/** The movement an exercise rolls up to. Throws only if the data is corrupt. */
export function movementOf(exercise: Exercise): Movement {
  const movement = movementsById.get(exercise.movementId);
  if (!movement) {
    throw new Error(`Exercise "${exercise.id}" has no movement`);
  }
  return movement;
}

/** Every variant of one movement — "show me all the lat pulldowns". */
export function exercisesForMovement(movementId: string): Exercise[] {
  return exercises.filter((e) => e.movementId === movementId);
}

/** Primary + secondary muscles for an exercise, applying any variant override. */
export function musclesForExercise(exercise: Exercise): {
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
} {
  return musclesFor(exercise, movementOf(exercise));
}

/**
 * Entries whose mapping was a judgment call on an ambiguous source name.
 * Surfaced so they get settled deliberately instead of hardening into fact.
 */
export function exercisesNeedingReview(): Exercise[] {
  return exercises.filter((e) => e.needsReview);
}
