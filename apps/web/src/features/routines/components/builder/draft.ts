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
  /**
   * One entry per distinct week, each a cycle of days.
   *
   * Most routines have exactly one and repeat it — that's what the builder
   * wrote for a long time, and it's why editing a shipped eight-week program
   * used to warn you it would throw seven of them away. A second week is only
   * worth writing when the *numbers* change between them, which is what the
   * transcribed programs actually do.
   */
  weeks: DraftWeek[];
  /** Free lines under the program — editable, one per row. */
  notes: string[];
}

export interface DraftWeek {
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
   *
   * **In `durationUnit`, not in seconds**, because it's what you typed and the
   * house rule is that draft numbers stay as typed — converting on every
   * keystroke turns a half-entered "7." into 7 and fights you. The model gets
   * seconds; `toPrescription` does the multiplication once, on save.
   */
  duration?: string;
  /**
   * Which unit `duration` is in.
   *
   * Both are needed and neither wins: a twenty-minute steady-state block in
   * seconds is 1200, and a thirty-second HIIT interval in minutes is 0.5.
   * Whichever you force, half the cardio anyone writes reads badly.
   */
  durationUnit: "s" | "min";
  /** Easy, moderate or hard — the other half of a cardio prescription. */
  intensity: "" | "low" | "moderate" | "high";
  /** Ramp-up sets: not logged, not counted as working sets. */
  isWarmup: boolean;
  /**
   * Where the load goes against the set before. "" means you didn't say, which
   * the player reads differently from "same" — it falls back to inferring a
   * ramp from the rep target, where "same" is you overruling that.
   */
  load: "" | "heavier" | "same" | "lighter";
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
    durationUnit: "min",
    intensity: "",
    isWarmup: false,
    load: "",
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

export function emptyWeek(): DraftWeek {
  return { days: [emptyDay()] };
}

export function emptyDraft(): DraftRoutine {
  return { name: "", style: "", weeks: [emptyWeek()], notes: [] };
}

/**
 * A copy of a week, ready to be changed.
 *
 * How a second week is almost always written: the split stays, the numbers
 * move. Starting from an empty week would mean retyping the whole cycle to
 * change one rep target, which is the reason nobody would use this.
 *
 * `structuredClone` rather than a spread — a week is four levels deep (days →
 * exercises → phases → segments) and a shallow copy would leave both weeks
 * editing the same phases.
 */
export function duplicateWeek(week: DraftWeek): DraftWeek {
  return structuredClone(week);
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
  // Same rule: "" means you didn't say, which is different from "moderate".
  const intensity =
    phase.intensity === "" ? undefined : { intensity: phase.intensity };
  // And again: unsaid leaves the player free to infer a ramp from the rep
  // target, where "same" is you telling it not to.
  const load = phase.load === "" ? undefined : { load: phase.load };

  if (phase.segments !== undefined) {
    const segments = phase.segments
      .map(toSegment)
      .filter((segment): segment is SetSegment => segment !== undefined);
    // The schema's own `.min(2)` would reject this too, but returning undefined
    // keeps the failure a "this phase is incomplete" rather than a parse error
    // pointing at an index nobody can see.
    if (segments.length < 2) return undefined;
    return { sets, segments, restSeconds, ...load, ...withModifiers, ...warmup };
  }

  // Timed and repped are exclusive, the same either/or `prescriptionSchema`
  // enforces — carrying both would leave the player, the day list and the
  // estimate each guessing which one wins.
  if (phase.duration !== undefined) {
    // Minutes are converted here and only here: the draft keeps what you
    // typed, the model keeps seconds. Rounded because 7.5 minutes is 450
    // seconds and 7.51 shouldn't be 450.6.
    const typed = Number(phase.duration);
    if (!Number.isFinite(typed) || typed <= 0) return undefined;
    const durationSeconds = Math.round(
      phase.durationUnit === "min" ? typed * 60 : typed,
    );
    if (durationSeconds <= 0) return undefined;
    return {
      sets,
      durationSeconds,
      restSeconds,
      ...intensity,
      ...load,
      ...withModifiers,
      ...warmup,
    };
  }

  const from = num(phase.repsFrom);
  if (from === undefined) return undefined;
  const to = num(phase.repsTo);
  const reps = to !== undefined && to > from ? ([from, to] as [number, number]) : from;

  return { sets, reps, restSeconds, ...load, ...withModifiers, ...warmup };
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

  const weeks = draft.weeks.map((week, weekIndex) => ({
    weekNumber: weekIndex + 1,
    days: toDays(week),
  }));

  // A week with no days at all can't be run, and `routineSchema.weeks` is
  // `.min(1)` — so an empty one keeps the save button disabled rather than
  // producing a routine that renders as nothing.
  if (weeks.length === 0 || weeks.some((week) => week.days.length === 0)) {
    return undefined;
  }

  return {
    slug,
    name: draft.name.trim(),
    style: draft.style.trim() === "" ? undefined : draft.style.trim(),
    weeks,
    // Blank rows are dropped rather than saved, as in the diet builder: an
    // empty note renders as an empty bullet, which reads as a failure to load.
    notes: draft.notes
      .map((note) => note.trim())
      .filter((note) => note !== ""),
  };
}

function toDays(week: DraftWeek): TrainingDay[] {
  return week.days.map((day, index) => {
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
}

/**
 * Read a stored duration back into the editor in the unit it reads best in.
 *
 * Whole minutes come back as minutes — a 1200-second block is "20 min", not
 * "1200 s" — and anything else stays in seconds, so a 45-second stretch hold
 * doesn't become "0.75 min". A phase with no duration gets neither field,
 * which is what marks it as repped rather than timed.
 */
function durationFields(
  seconds: number | undefined,
): { duration?: string; durationUnit: DraftPhase["durationUnit"] } {
  if (seconds === undefined) return { durationUnit: "min" };
  return seconds >= 60 && seconds % 60 === 0
    ? { duration: String(seconds / 60), durationUnit: "min" }
    : { duration: String(seconds), durationUnit: "s" };
}

/**
 * Load an existing routine back into the editor.
 *
 * **Every week, not just the first.** Taking `weeks[0]` is what made editing a
 * shipped eight-week program throw seven of them away, and the edit page had
 * to warn you about it before you pressed save.
 */
export function toDraft(routine: Routine): DraftRoutine {
  return {
    name: routine.name,
    style: routine.style ?? "",
    notes: [...(routine.notes ?? [])],
    weeks: routine.weeks.map((week) => ({
      days: week.days.map((day) => ({
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
            ...durationFields(
              p.durationSeconds === undefined
                ? undefined
                : Array.isArray(p.durationSeconds)
                  ? p.durationSeconds[1]
                  : p.durationSeconds,
            ),
            intensity: p.intensity ?? "",
            load: p.load ?? "",
            restSeconds:
              p.restSeconds !== undefined ? String(p.restSeconds) : "",
            segments: p.segments?.map((segment) => ({
              kind: segment.kind,
              count: segment.kind === "hold" ? "12" : String(segment.count),
              seconds: segment.kind === "hold" ? String(segment.seconds) : "10",
              pulsePerRep:
                segment.kind === "reps" && segment.pulsePerRep === true,
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
    })),
  };
}
