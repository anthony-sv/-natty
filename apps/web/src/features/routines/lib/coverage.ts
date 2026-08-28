import { movementPatternSchema, type MovementPattern, type MuscleId } from "@/data/exercises";
import type { Routine } from "@/data/routines";
import type { ExerciseAnatomy } from "@/features/log/volume";
import { scheduleSequence } from "./next-day";

/**
 * Does a routine's *authored* exercise list cover every muscle, and enough
 * movement variety within the muscles it does train — answered from
 * `Routine.weeks[].days[].exercises[]` directly, no log involved.
 *
 * **Not `muscleGaps` (`features/log/volume.ts`) applied to a routine.**
 * `muscleGaps` reads `WeekVolume[]` derived from what you've actually
 * *logged* over recent weeks — "what have I been neglecting lately." This
 * reads what a program *prescribes*, so it answers instantly for a routine
 * you wrote five minutes ago and have never trained. Two different
 * questions; fusing them would mean the design-time one needs a log to
 * answer a question about a document.
 *
 * **Per routine, not per day.** A single day is supposed to specialize —
 * leg day has no chest work on purpose — so a per-day version of this would
 * just relearn the split back at you. This flattens every week and day via
 * `scheduleSequence`.
 *
 * **Movement variety is scoped per muscle, not per push/pull/legs/core
 * split.** `SPLIT_FOR_PATTERN` buckets `chest-fly` with `lateral-raise`
 * under "push," which can't answer "am I doing all the chest movements" —
 * that needs grouping by muscle instead. Only 8 of the 18 muscles have more
 * than one pattern in the whole library, so this section reads quiet on a
 * well-covered routine by construction, not because it's broken. And "only
 * flat bench, no incline" isn't a chest finding here — incline press trains
 * `upper-chest`, a different muscle from `chest` (flat press + fly) — it
 * shows up as an `upper-chest` muscle gap instead, not a chest variety gap.
 *
 * **Both sides count only exercises that make the muscle primary.**
 * Measuring the library's available patterns by primary but the routine's
 * usage by primary-or-secondary would let a muscle read "fully covered"
 * while never actually getting a direct set in that pattern. Accepted cost:
 * a routine with only barbell rows (upper-back primary, lats secondary)
 * reports `lats` missing `horizontal-pull`, because the row was never a
 * lats-primary exercise — defensible, since you genuinely never do a
 * horizontal pull *for lats* there.
 *
 * **No `kind` filter, no `warmupRefs` handling.** `mobility`/`stretch`
 * `ExerciseEntry.kind` values are schema-allowed but nothing authors them;
 * cardio movements carry empty muscle arrays and `"cardio"` is excluded
 * from the pattern universe below, so a cardio entry naturally contributes
 * nothing; `warmupRefs` (the day-level mobility opener) carries free move
 * names with no `exerciseId` and structurally can't reach this. An entry
 * whose *every* prescription is `isWarmup: true` is skipped, following
 * `isLoggableStep`'s existing rule that a warmup set isn't real work — a
 * mixed entry (a warmup phase then working sets) still counts.
 */

export type RoutineMuscleGapReason =
  /** No exercise in the whole library makes it primary — a catalog fact. */
  | "never-direct"
  /** This routine loads it, just never on purpose. */
  | "indirect-only"
  /** The library could train it directly; this program doesn't. */
  | "not-in-routine";

export interface RoutineMuscleGap {
  muscle: MuscleId;
  reason: RoutineMuscleGapReason;
  /** Exercise entries in the routine listing it as secondary. */
  indirectCount: number;
}

/** One directly-trained muscle's movement variety, already grouped. */
export interface RoutineMuscleVariety {
  muscle: MuscleId;
  used: MovementPattern[];
  missing: MovementPattern[];
}

export interface RoutineCoverage {
  muscleGaps: RoutineMuscleGap[];
  /** Only muscles trained directly *and* missing at least one pattern. */
  variety: RoutineMuscleVariety[];
}

/**
 * Library-wide facts, injected — `MergedLibrary` (`features/library/merged.ts`)
 * satisfies this structurally, so a real call site passes it straight
 * through and a test builds a two-field object instead of faking the rest.
 */
export interface LibraryMuscleIndex {
  trainableDirectly: ReadonlySet<MuscleId>;
  patternsByMuscle: ReadonlyMap<MuscleId, ReadonlySet<MovementPattern>>;
}

/** Canonical display order, matching the schema's own declaration order. */
const PATTERN_ORDER = new Map(
  movementPatternSchema.options.map((pattern, index) => [pattern, index]),
);

function byPatternOrder(a: MovementPattern, b: MovementPattern): number {
  return (PATTERN_ORDER.get(a) ?? 0) - (PATTERN_ORDER.get(b) ?? 0);
}

export function routineCoverage(
  routine: Routine,
  anatomy: ExerciseAnatomy,
  library: LibraryMuscleIndex,
  allMuscles: readonly MuscleId[],
): RoutineCoverage {
  const directPatterns = new Map<MuscleId, Set<MovementPattern>>();
  const indirectCount = new Map<MuscleId, number>();

  for (const { day } of scheduleSequence(routine)) {
    for (const entry of day.exercises) {
      // A warmup-only entry — every prescription flagged `isWarmup` — isn't
      // real work, same as `isLoggableStep` already treats it. A mixed
      // entry (a warmup phase plus working sets) still counts in full.
      if (entry.prescriptions.every((p) => p.isWarmup === true)) continue;

      const pattern = anatomy.pattern(entry.exerciseId);
      const { primary, secondary } = anatomy.muscles(entry.exerciseId);

      const directHere = new Set(primary);
      for (const muscle of directHere) {
        const patterns = directPatterns.get(muscle) ?? new Set<MovementPattern>();
        // Cardio's pattern (and an unresolvable exercise's undefined one)
        // never counts toward variety — in practice this never fires
        // alongside a non-empty `primary`, since only resistance movements
        // list a primary muscle at all, but it's cheap insurance either way.
        if (pattern !== undefined && pattern !== "cardio") patterns.add(pattern);
        directPatterns.set(muscle, patterns);
      }
      for (const muscle of new Set(secondary)) {
        if (directHere.has(muscle)) continue; // the stronger claim wins
        indirectCount.set(muscle, (indirectCount.get(muscle) ?? 0) + 1);
      }
    }
  }

  const muscleGaps: RoutineMuscleGap[] = allMuscles
    .filter((muscle) => !directPatterns.has(muscle))
    .map((muscle) => {
      const count = indirectCount.get(muscle) ?? 0;
      const reason: RoutineMuscleGapReason = !library.trainableDirectly.has(
        muscle,
      )
        ? "never-direct"
        : count > 0
          ? "indirect-only"
          : "not-in-routine";
      return { muscle, reason, indirectCount: count };
    })
    .sort(
      (a, b) =>
        b.indirectCount - a.indirectCount || a.muscle.localeCompare(b.muscle),
    );

  const variety: RoutineMuscleVariety[] = allMuscles
    .filter((muscle) => directPatterns.has(muscle))
    .map((muscle) => {
      const used = [...(directPatterns.get(muscle) ?? [])].sort(byPatternOrder);
      const available = library.patternsByMuscle.get(muscle) ?? new Set();
      const missing = [...available]
        .filter((pattern) => !used.includes(pattern))
        .sort(byPatternOrder);
      return { muscle, used, missing };
    })
    .filter((entry) => entry.missing.length > 0);

  return { muscleGaps, variety };
}

/** One missing pattern for a muscle, with real library exercises that would fill it. */
export interface MissingPattern {
  pattern: MovementPattern;
  /**
   * Exercise ids, not names — a built-in exercise's `name` is the canonical
   * *English* string, and rendering it raw would skip translation entirely
   * (the same mistake `exerciseDisplayName()` exists to prevent elsewhere).
   * The caller resolves these through `useNames().exercise(id)` at render
   * time.
   */
  candidates: string[];
}

/** One muscle's worth of what's missing, pattern by pattern. */
export interface MuscleCoverageEntry {
  muscle: MuscleId;
  /** Entries the routine already gives it as secondary, if any. */
  indirectCount: number;
  missing: MissingPattern[];
}

export interface UnifiedCoverage {
  /** One row per muscle missing at least one pattern the library can offer. */
  muscles: MuscleCoverageEntry[];
  /** Muscles nothing in the whole library trains directly — no candidates possible. */
  neverDirect: MuscleId[];
}

/**
 * Library-wide facts needed to name candidate exercises, not just detect a
 * gap — extends `LibraryMuscleIndex` with a name/pattern/muscle projection
 * of the catalog. `MergedLibrary` (`features/library/merged.ts`) already has
 * an `all: LibraryEntry[]` with every field this needs, so it satisfies this
 * structurally too — same reason `LibraryMuscleIndex` itself is minimal
 * rather than importing `LibraryEntry` directly.
 */
export interface LibraryPatternIndex extends LibraryMuscleIndex {
  all: readonly {
    id: string;
    pattern: MovementPattern;
    primaryMuscles: readonly MuscleId[];
  }[];
}

/**
 * `routineCoverage`'s two lists (muscle gaps, movement variety), folded into
 * one — every muscle missing something becomes a single row naming exactly
 * which patterns and which real exercises would close it. A muscle with *no*
 * direct work at all doesn't read differently in this view: `never-direct`
 * and `not-in-routine` both expand into "here's what's missing," one row per
 * pattern the library actually offers for that muscle — the distinction
 * between "you haven't" and "you can't" only survives for muscles the whole
 * catalog has no primary exercise for at all, which have nothing to expand
 * into and are reported separately in `neverDirect`.
 */
export function unifiedCoverage(
  coverage: RoutineCoverage,
  library: LibraryPatternIndex,
  allMuscles: readonly MuscleId[],
): UnifiedCoverage {
  const candidatesFor = (muscle: MuscleId, pattern: MovementPattern): string[] =>
    library.all
      .filter((entry) => entry.pattern === pattern && entry.primaryMuscles.includes(muscle))
      .map((entry) => entry.id);

  const neverDirect: MuscleId[] = [];
  const byMuscle = new Map<MuscleId, MuscleCoverageEntry>();

  for (const gap of coverage.muscleGaps) {
    const available = library.patternsByMuscle.get(gap.muscle);
    if (gap.reason === "never-direct" || available === undefined || available.size === 0) {
      neverDirect.push(gap.muscle);
      continue;
    }
    const missing = [...available]
      .sort(byPatternOrder)
      .map((pattern) => ({ pattern, candidates: candidatesFor(gap.muscle, pattern) }));
    byMuscle.set(gap.muscle, { muscle: gap.muscle, indirectCount: gap.indirectCount, missing });
  }

  for (const entry of coverage.variety) {
    const missing = entry.missing.map((pattern) => ({
      pattern,
      candidates: candidatesFor(entry.muscle, pattern),
    }));
    byMuscle.set(entry.muscle, { muscle: entry.muscle, indirectCount: 0, missing });
  }

  const muscles = allMuscles
    .filter((muscle) => byMuscle.has(muscle))
    .map((muscle) => byMuscle.get(muscle)!);

  return { muscles, neverDirect };
}
