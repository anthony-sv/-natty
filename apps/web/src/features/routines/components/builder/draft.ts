import type {
  ExerciseEntry,
  Prescription,
  Routine,
  SetSegment,
  TrainingDay,
} from "@/data/routines";
import { FINISHER_CONVENTION } from "@/data/routines/authoring";

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
   * Shared with the entries it is run in rotation with — a superset, or a
   * circuit past two. Members are the *consecutive* run sharing an id, so the
   * builder only ever links an exercise to the one directly above it and a
   * circuit is built by chaining.
   */
  groupId?: string;
  /**
   * Seconds between this exercise and the next one in the rotation.
   *
   * On the entry *before* the gap, which is what lets the editor put the field
   * in the link row that represents that gap. Blank is the ordinary case and
   * the whole point: you go straight into the next lift.
   */
  transitionSeconds?: string;
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
  /**
   * The pose this set ends on, and how long it's held.
   *
   * This is the half of a finisher that does something. `isFinisher` is a
   * badge and a count; the pose is what makes `buildSteps` emit a
   * `work → pose → rest` triple, which is the 10-second hold with its own
   * countdown that the transcribed programs prescribe.
   *
   * Present-but-blank is a real state and not the same as absent: flipping the
   * switch on gives every phase the slot so the picker has something to bind
   * to, and a phase whose `poseId` is still "" saves without a pose rather
   * than blocking the whole routine on a field you haven't reached yet.
   */
  pose?: DraftPose;
  modifiers: {
    forcedReps: boolean;
    negatives: boolean;
    partials: boolean;
    staticHolds: boolean;
    dropSet: boolean;
    restPause: boolean;
  };
}

export interface DraftPose {
  /** A `data/poses` id, or "" for "not chosen yet". */
  poseId: string;
  /** Blank means strike the pose with no timed hold, per `poseCueSchema`. */
  holdSeconds: string;
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

/**
 * A finisher set, as the six transcribed programs write one: seven sets of
 * 15-20, thirty seconds' rest, ending on a ten-second pose hold.
 *
 * The numbers come from `FINISHER_CONVENTION`, the same constant `finisher()`
 * authors the built-ins with, so a finisher you write and one that shipped are
 * the same thing. The pose is left unchosen — there are eight and no default
 * that isn't a guess at which muscle you just trained.
 */
export function finisherPhase(): DraftPhase {
  return {
    ...emptyPhase(),
    sets: String(FINISHER_CONVENTION.sets),
    repsFrom: String(FINISHER_CONVENTION.reps[0]),
    repsTo: String(FINISHER_CONVENTION.reps[1]),
    restSeconds: String(FINISHER_CONVENTION.restSeconds),
    pose: { poseId: "", holdSeconds: String(FINISHER_CONVENTION.holdSeconds) },
  };
}

/**
 * The other way a muscle group gets finished: one set run as a sequence, laddered.
 *
 * A 10-second hold, twelve pulses, twelve reps each ending in a pulse, another
 * hold and more pulses — then weight on, and the rep part falls to 10, 8, 6.
 * Nothing in `src/data/` authors one (the transcribed programs don't use it),
 * so unlike `FINISHER_CONVENTION` this constant has no counterpart to agree
 * with; it exists because writing it by hand is twenty-odd fields per set and
 * four sets of it, which is exactly the sort of thing a preset is for.
 */
const HOLD_PULSE_RAMP = {
  /** The rep part, set by set. Everything else repeats unchanged. */
  reps: [12, 10, 8, 6],
  holdSeconds: 10,
  pulses: 12,
  restSeconds: 90,
} as const;

/** Which shape of finisher an exercise is written as, if any. */
export type FinisherKind = "none" | "pose" | "ramp";

/**
 * One set of the hold-and-pulse ramp: a sequence, so `reps` plays no part.
 *
 * `load: "heavier"` from the second set on and unsaid on the first —
 * `Prescription.load` describes the step *from the set before*, so stating it
 * on the opening set would have the player telling you to add weight to
 * nothing.
 */
function rampPhase(reps: number, index: number): DraftPhase {
  return {
    ...emptyPhase(),
    sets: "1",
    restSeconds: String(HOLD_PULSE_RAMP.restSeconds),
    load: index === 0 ? "" : "heavier",
    segments: [
      { ...emptySegment("hold"), seconds: String(HOLD_PULSE_RAMP.holdSeconds) },
      { ...emptySegment("pulses"), count: String(HOLD_PULSE_RAMP.pulses) },
      { ...emptySegment("reps"), count: String(reps), pulsePerRep: true },
      { ...emptySegment("hold"), seconds: String(HOLD_PULSE_RAMP.holdSeconds) },
      { ...emptySegment("pulses"), count: String(HOLD_PULSE_RAMP.pulses) },
    ],
  };
}

export function rampPhases(): DraftPhase[] {
  return HOLD_PULSE_RAMP.reps.map(rampPhase);
}

/**
 * Nothing of yours is in these phases, so a preset can overwrite them freely.
 *
 * Two cases, and the second is easy to miss: an untouched exercise, and one
 * holding a preset you just picked and are now picking away from. Without the
 * second, switching from the ramp to the pose finisher left the four sequences
 * sitting there and merely hung a pose on each — a "don't throw away your
 * typing" rule protecting typing nobody did.
 */
export function isUntouched(phases: DraftPhase[]): boolean {
  const same = (a: DraftPhase[]) => JSON.stringify(a) === JSON.stringify(phases);
  return same([emptyPhase()]) || same(rampPhases()) || same([finisherPhase()]);
}

/**
 * Which of the two an exercise is currently written as.
 *
 * Read off the phases rather than stored, for the same reason `isRecord` is
 * derived: a second field saying which preset was picked would be one more
 * thing to keep true after the phases are edited by hand.
 */
export function finisherKindOf(exercise: DraftExercise): FinisherKind {
  if (!exercise.isFinisher) return "none";
  if (exercise.phases.some((phase) => phase.pose !== undefined)) return "pose";
  if (
    exercise.phases.length > 0 &&
    exercise.phases.every((phase) => phase.segments !== undefined)
  ) {
    return "ramp";
  }
  return "pose";
}

/**
 * Write one of the finisher shapes across an exercise's phases.
 *
 * **A phase you have typed into is yours — where that means anything.** Picking
 * the pose finisher on an untouched exercise writes the convention, because an
 * empty 3×8-12 is not something anyone will miss; picking it on phases you have
 * filled in only *adds* the pose slot, since rewriting hand-entered sets
 * because a control moved would be the editor throwing away work to make a
 * point.
 *
 * The ramp has no such half-measure and always replaces: a pose is a property
 * you can hang on sets you wrote, while the ramp *is* the sets. The picker says
 * so before you choose it, which is where that warning belongs.
 *
 * "None" drops the poses and leaves every number alone. The set counts are
 * then just set counts, which is what they are once the pose is gone — the
 * ramp's sequences stay too, for the same reason.
 */
export function applyFinisher(
  phases: DraftPhase[],
  kind: FinisherKind,
): DraftPhase[] {
  if (kind === "ramp") return rampPhases();

  if (kind === "none") {
    return phases.map((phase) => {
      const next = { ...phase };
      // Deleted rather than set to undefined: `toDraft` writes the key only
      // when the prescription had one, and the round-trip test compares the
      // objects.
      delete next.pose;
      return next;
    });
  }

  if (isUntouched(phases)) return [finisherPhase()];
  return phases.map((phase) => ({
    ...phase,
    pose: phase.pose ?? {
      poseId: "",
      holdSeconds: String(FINISHER_CONVENTION.holdSeconds),
    },
  }));
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
 * Move a day to another position in its week, carrying everything in it.
 *
 * The reason this exists rather than "retype the other day": swapping leg day
 * and a rest day meant deleting a day's worth of exercises and entering them
 * again one position down. Nothing inside a day refers to its own position —
 * `toDays` assigns `dayNumber` from array order on save — so moving the
 * object is the entire operation.
 *
 * Out of range is a no-op rather than an error: the buttons are disabled at
 * the ends, and a guard here means a caller that gets it wrong reorders
 * nothing instead of dropping a day.
 */
export function moveDay(
  days: DraftDay[],
  from: number,
  to: number,
): DraftDay[] {
  if (to < 0 || to >= days.length || from < 0 || from >= days.length) {
    return days;
  }
  const next = [...days];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Whether this exercise is run in rotation with the one directly above it. */
export function isLinkedToPrevious(
  exercises: DraftExercise[],
  index: number,
): boolean {
  if (index <= 0) return false;
  const id = exercises[index].groupId;
  return id !== undefined && id === exercises[index - 1].groupId;
}

/**
 * Run this exercise in rotation with the one above it.
 *
 * Linking to the *previous* one rather than picking members from a list is
 * what keeps the model an adjacency: a circuit is built by chaining, and there
 * is no way to express a group whose members aren't next to each other —
 * which is not a group you could run anyway.
 */
export function linkToPrevious(
  exercises: DraftExercise[],
  index: number,
  newId: () => string,
): DraftExercise[] {
  if (index <= 0) return exercises;
  const id = exercises[index - 1].groupId ?? newId();
  return exercises.map((exercise, i) =>
    i === index || i === index - 1 ? { ...exercise, groupId: id } : exercise,
  );
}

/**
 * Break the rotation at this exercise.
 *
 * The *tail* gets a fresh id rather than this entry simply losing one, because
 * unlinking the middle of a circuit of three has to leave two groups — and
 * clearing one id would leave the first and third sharing one while no longer
 * adjacent, which reads as a group that silently stopped working.
 */
export function unlinkFromPrevious(
  exercises: DraftExercise[],
  index: number,
  newId: () => string,
): DraftExercise[] {
  if (!isLinkedToPrevious(exercises, index)) return exercises;
  const id = exercises[index].groupId;
  const fresh = newId();
  return exercises.map((exercise, i) =>
    i >= index && exercise.groupId === id
      ? { ...exercise, groupId: fresh }
      : exercise,
  );
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
  // An unchosen pose writes nothing rather than a cue with an empty id, which
  // would resolve to no pose and render as a blank line in the player.
  // `holdSeconds` is genuinely optional in the schema — omitted means "strike
  // the pose", so a blank field drops the key instead of writing 0.
  const hold = num(phase.pose?.holdSeconds ?? "");
  const pose =
    phase.pose !== undefined && phase.pose.poseId !== ""
      ? {
          pose: {
            poseId: phase.pose.poseId,
            ...(hold !== undefined ? { holdSeconds: hold } : {}),
          },
        }
      : undefined;

  if (phase.segments !== undefined) {
    const segments = phase.segments
      .map(toSegment)
      .filter((segment): segment is SetSegment => segment !== undefined);
    // The schema's own `.min(2)` would reject this too, but returning undefined
    // keeps the failure a "this phase is incomplete" rather than a parse error
    // pointing at an index nobody can see.
    if (segments.length < 2) return undefined;
    return {
      sets,
      segments,
      restSeconds,
      ...load,
      ...pose,
      ...withModifiers,
      ...warmup,
    };
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
      ...pose,
      ...withModifiers,
      ...warmup,
    };
  }

  const from = num(phase.repsFrom);
  if (from === undefined) return undefined;
  const to = num(phase.repsTo);
  const reps = to !== undefined && to > from ? ([from, to] as [number, number]) : from;

  return { sets, reps, restSeconds, ...load, ...pose, ...withModifiers, ...warmup };
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
            const transition = num(exercise.transitionSeconds ?? "");
            const entry: ExerciseEntry = {
              exerciseId: exercise.exerciseId,
              ...(exercise.groupId === undefined
                ? {}
                : {
                    group: {
                      id: exercise.groupId,
                      ...(transition === undefined
                        ? {}
                        : { transitionSeconds: transition }),
                    },
                  }),
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

    // A group that ended up with one member isn't one — the partner was
    // deleted, or dropped for having no lift picked. Written out it would be a
    // rotation of one, which `buildSteps` already ignores; dropped here it
    // can't come back as a stale id nobody can see in the editor.
    const alone = new Set(
      [...new Set(exercises.map((entry) => entry.group?.id))]
        .filter((id): id is string => id !== undefined)
        .filter(
          (id) => exercises.filter((entry) => entry.group?.id === id).length < 2,
        ),
    );
    const grouped = exercises.map((entry) =>
      entry.group !== undefined && alone.has(entry.group.id)
        ? { ...entry, group: undefined }
        : entry,
    );

    return {
      dayNumber: index + 1,
      // A day with no label still needs one to render; its number is the
      // honest fallback rather than an empty heading.
      label: day.label.trim() === "" ? `Day ${index + 1}` : day.label.trim(),
      isRest: day.isRest,
      exercises: grouped,
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
          groupId: exercise.group?.id,
          transitionSeconds:
            exercise.group?.transitionSeconds !== undefined
              ? String(exercise.group.transitionSeconds)
              : undefined,
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
            // Absent stays absent: a phase with no pose gets no slot, which is
            // what keeps the picker off every ordinary set — and what makes
            // the round trip write back exactly what it read.
            pose:
              p.pose === undefined
                ? undefined
                : {
                    poseId: p.pose.poseId,
                    holdSeconds:
                      p.pose.holdSeconds !== undefined
                        ? String(p.pose.holdSeconds)
                        : "",
                  },
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
