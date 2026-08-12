import type {
  ExerciseEntry,
  Prescription,
  Routine,
  SetSegment,
  TrainingDay,
} from "@/data/routines";

/**
 * The builder's working copy.
 *
 * **Why a draft rather than TanStack Form.** Every other form here is a flat
 * set of fields with per-field validation, which is what `field.tsx` is for.
 * This is a document editor: four levels of dynamic arrays (days → exercises →
 * phases → segments), where almost every interaction is a structural edit
 * rather than a value edit. Modelling that as form state means a field path
 * per node and re-deriving it on every insert; modelling it as a value and
 * parsing with `routineSchema` on save is the same validation with none of the
 * bookkeeping — and the schema is the authority either way.
 *
 * Numbers are strings for the same reason the other forms keep them as strings:
 * that's what a number input produces, and coercing mid-edit makes a
 * half-typed "1" become 1 and fight you.
 */
export interface DraftRoutine {
  name: string;
  style: string;
  days: DraftDay[];
}

export interface DraftDay {
  label: string;
  isRest: boolean;
  exercises: DraftExercise[];
}

export interface DraftExercise {
  exerciseId: string;
  /**
   * Lifts you'd equally accept, in your own order of preference.
   *
   * Ids rather than free text, so the player can offer them as a swap and log
   * against whichever you actually did — a substitute you can't log against is
   * a note to yourself, not a feature.
   */
  orAlternatives: string[];
  kind: ExerciseEntry["kind"];
  isFinisher: boolean;
  phases: DraftPhase[];
}

export interface DraftPhase {
  sets: string;
  repsFrom: string;
  /** Blank for a single number rather than a range. */
  repsTo: string;
  restSeconds: string;
  /**
   * How long the set runs, for the things you time rather than count — a
   * cardio block, a stretch, a dead hang.
   *
   * Present means this phase is timed and `reps` is ignored, mirroring
   * `prescriptionSchema`'s own either/or. Without it the builder could only
   * write reps, so writing a twenty-minute cardio block came out as "3 sets of
   * 8-12 reps" of walking.
   */
  durationSeconds?: string;
  /** Ramp-up sets: not logged, not counted as working sets. */
  isWarmup: boolean;
  /** Present means the set runs as a sequence; `reps` is ignored then. */
  segments?: DraftSegment[];
  modifiers: {
    forcedReps: boolean;
    negatives: boolean;
    partials: boolean;
    staticHolds: boolean;
    dropSet: boolean;
    restPause: boolean;
  };
}

export interface DraftSegment {
  kind: SetSegment["kind"];
  /** Reps or pulses. */
  count: string;
  /** Holds. */
  seconds: string;
  pulsePerRep: boolean;
}

export function emptyPhase(): DraftPhase {
  return {
    sets: "3",
    repsFrom: "8",
    repsTo: "12",
    restSeconds: "90",
    isWarmup: false,
    modifiers: {
      forcedReps: false,
      negatives: false,
      partials: false,
      staticHolds: false,
      dropSet: false,
      restPause: false,
    },
  };
}

export function emptySegment(kind: SetSegment["kind"]): DraftSegment {
  return { kind, count: "12", seconds: "10", pulsePerRep: false };
}

export function emptyDay(): DraftDay {
  return { label: "", isRest: false, exercises: [] };
}

export function emptyDraft(): DraftRoutine {
  return { name: "", style: "", days: [emptyDay()] };
}

/** A positive integer, or undefined if the field is blank or nonsense. */
function num(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}

function toSegment(segment: DraftSegment): SetSegment | undefined {
  if (segment.kind === "hold") {
    const seconds = num(segment.seconds);
    return seconds === undefined ? undefined : { kind: "hold", seconds };
  }
  const count = num(segment.count);
  if (count === undefined) return undefined;
  return segment.kind === "pulses"
    ? { kind: "pulses", count }
    : { kind: "reps", count, pulsePerRep: segment.pulsePerRep || undefined };
}

function toPrescription(phase: DraftPhase): Prescription | undefined {
  const sets = num(phase.sets);
  if (sets === undefined) return undefined;

  const rest = Number(phase.restSeconds);
  const restSeconds = Number.isFinite(rest) && rest >= 0 ? Math.round(rest) : undefined;

  const modifiers = Object.fromEntries(
    Object.entries(phase.modifiers).filter(([, on]) => on),
  );
  const withModifiers =
    Object.keys(modifiers).length > 0 ? { modifiers } : undefined;
  // Written only when true, so a routine that prescribes no warmups round-trips
  // to exactly what it was — `draft.test.ts` pins that.
  const warmup = phase.isWarmup ? { isWarmup: true } : undefined;

  if (phase.segments !== undefined) {
    const segments = phase.segments
      .map(toSegment)
      .filter((segment): segment is SetSegment => segment !== undefined);
    // The schema's own `.min(2)` would reject this too, but returning undefined
    // keeps the failure a "this phase is incomplete" rather than a parse error
    // pointing at an index nobody can see.
    if (segments.length < 2) return undefined;
    return { sets, segments, restSeconds, ...withModifiers, ...warmup };
  }

  // Timed and repped are exclusive, the same either/or `prescriptionSchema`
  // enforces — carrying both would leave the player, the day list and the
  // estimate each guessing which one wins.
  if (phase.durationSeconds !== undefined) {
    const durationSeconds = num(phase.durationSeconds);
    if (durationSeconds === undefined) return undefined;
    return { sets, durationSeconds, restSeconds, ...withModifiers, ...warmup };
  }

  const from = num(phase.repsFrom);
  if (from === undefined) return undefined;
  const to = num(phase.repsTo);
  const reps = to !== undefined && to > from ? ([from, to] as [number, number]) : from;

  return { sets, reps, restSeconds, ...withModifiers, ...warmup };
}

/**
 * Turn the draft into a real `Routine`.
 *
 * Returns undefined if anything essential is missing, so the caller can keep
 * the save button disabled rather than surfacing a schema error mid-typing.
 * The result still goes through `routineSchema` at the collection, which is
 * what actually guarantees it.
 */
export function toRoutine(
  draft: DraftRoutine,
  slug: string,
): Routine | undefined {
  if (draft.name.trim() === "") return undefined;

  const days: TrainingDay[] = draft.days.map((day, index) => {
    const exercises: ExerciseEntry[] = day.isRest
      ? []
      : day.exercises
          .map((exercise) => {
            const prescriptions = exercise.phases
              .map(toPrescription)
              .filter((p): p is Prescription => p !== undefined);
            if (exercise.exerciseId === "" || prescriptions.length === 0) {
              return undefined;
            }
            const entry: ExerciseEntry = {
              exerciseId: exercise.exerciseId,
              // Anything that ended up empty or duplicated is dropped rather
              // than saved: an alternative pointing at the exercise itself
              // would render as "or <the same lift>".
              orAlternatives: [
                ...new Set(
                  exercise.orAlternatives.filter(
                    (id) => id !== "" && id !== exercise.exerciseId,
                  ),
                ),
              ],
              kind: exercise.kind,
              isFinisher: exercise.isFinisher,
              prescriptions,
            };
            return entry;
          })
          .filter((entry): entry is ExerciseEntry => entry !== undefined);

    return {
      dayNumber: index + 1,
      // A day with no label still needs one to render; its number is the
      // honest fallback rather than an empty heading.
      label: day.label.trim() === "" ? `Day ${index + 1}` : day.label.trim(),
      isRest: day.isRest,
      exercises,
      // Warmups are resolved from the built-in label vocabulary and a routine
      // you wrote uses your own words, so there's nothing to match against.
      warmupRefs: [],
    };
  });

  if (days.length === 0) return undefined;

  return {
    slug,
    name: draft.name.trim(),
    style: draft.style.trim() === "" ? undefined : draft.style.trim(),
    // One week, which repeats. Authoring eight by hand to match the built-ins
    // would be absurd, and `routineSchema.weeks` is already `.min(1)`.
    weeks: [{ weekNumber: 1, days }],
  };
}

/** Load an existing routine back into the editor, including a built-in to copy. */
export function toDraft(routine: Routine): DraftRoutine {
  return {
    name: routine.name,
    style: routine.style ?? "",
    days: routine.weeks[0].days.map((day) => ({
      label: day.label,
      isRest: day.isRest,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        orAlternatives: exercise.orAlternatives,
        kind: exercise.kind,
        isFinisher: exercise.isFinisher,
        phases: exercise.prescriptions.map((p) => ({
          sets: String(p.sets),
          isWarmup: p.isWarmup === true,
          repsFrom: Array.isArray(p.reps)
            ? String(p.reps[0])
            : p.reps !== undefined
              ? String(p.reps)
              : "",
          repsTo: Array.isArray(p.reps) ? String(p.reps[1]) : "",
          // A range is authored for some cardio blocks ("20-30 min"); the
          // editor takes one number, so the upper bound stands for it — the
          // same choice `countdownSeconds` makes when running one.
          durationSeconds:
            p.durationSeconds === undefined
              ? undefined
              : String(
                  Array.isArray(p.durationSeconds)
                    ? p.durationSeconds[1]
                    : p.durationSeconds,
                ),
          restSeconds: p.restSeconds !== undefined ? String(p.restSeconds) : "",
          segments: p.segments?.map((segment) => ({
            kind: segment.kind,
            count: segment.kind === "hold" ? "12" : String(segment.count),
            seconds: segment.kind === "hold" ? String(segment.seconds) : "10",
            pulsePerRep: segment.kind === "reps" && segment.pulsePerRep === true,
          })),
          modifiers: {
            forcedReps: p.modifiers?.forcedReps ?? false,
            negatives: p.modifiers?.negatives ?? false,
            partials: p.modifiers?.partials ?? false,
            staticHolds: p.modifiers?.staticHolds ?? false,
            dropSet: p.modifiers?.dropSet ?? false,
            restPause: p.modifiers?.restPause ?? false,
          },
        })),
      })),
    })),
  };
}
