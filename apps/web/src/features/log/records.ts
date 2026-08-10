import type { WeightUnit } from "@/lib/units";
import { prFrontier } from "./pr";
import type { LoggedSet } from "./schema";

/**
 * One record, flattened out of its exercise's frontier.
 *
 * The records view is a single table rather than a card per exercise: the
 * library has 113 exercises, and a page that grows a card for each one can't
 * be searched, sorted or virtualized. Carrying the exercise's name on the row
 * is what lets one table do all three.
 */
export interface RecordRow {
  /** The logged set's own id — stable across re-derivation, so it keys rows. */
  id: string;
  exerciseId: string;
  exerciseName: string;
  /** Rolled into the searchable text, not shown: "row" should find seated row. */
  movementName: string | undefined;
  /**
   * The library's other spellings for this lift, also searchable and also not
   * shown. The curated name is one way to say it; "pec deck", "flat db press"
   * and "lat pulldown wide" are the ways you'd actually type it.
   */
  aliases: string[];
  reps: number;
  weight: number | undefined;
  unit: WeightUnit;
  performedAt: number;
}

/** Names an exercise id, or gives up and returns the id. */
export interface ExerciseNaming {
  exerciseName: (exerciseId: string) => string;
  movementName: (exerciseId: string) => string | undefined;
  /** Every other spelling the library accepts for this exercise. */
  aliases: (exerciseId: string) => string[];
}

/**
 * Every logged set's exercise, reduced to that exercise's records.
 *
 * Pure and naming-injected so it can be tested without the exercise library or
 * the collection — the same reason `pr.ts` avoids both.
 *
 * Ordered most recently performed first, matching what the per-exercise view
 * did. The table re-sorts from there.
 */
export function toRecordRows(
  sets: LoggedSet[],
  naming: ExerciseNaming,
): RecordRow[] {
  const byExercise = new Map<string, LoggedSet[]>();
  for (const set of sets) {
    const existing = byExercise.get(set.exerciseId);
    if (existing) existing.push(set);
    else byExercise.set(set.exerciseId, [set]);
  }

  const rows: RecordRow[] = [];
  for (const [exerciseId, exerciseSets] of byExercise) {
    for (const record of prFrontier(exerciseSets)) {
      rows.push({
        id: record.id,
        exerciseId,
        exerciseName: naming.exerciseName(exerciseId),
        movementName: naming.movementName(exerciseId),
        aliases: naming.aliases(exerciseId),
        reps: record.reps,
        weight: record.weight,
        unit: record.unit,
        performedAt: record.performedAt,
      });
    }
  }

  return rows.sort((a, b) => b.performedAt - a.performedAt);
}
