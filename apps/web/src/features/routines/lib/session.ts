import type {
  ExerciseEntry,
  PoseCue,
  Prescription,
  SetModifiers,
  SetSegment,
  TrainingDay,
} from "@/data/routines";
import {
  exerciseDisplayName,
  formatAlternatives,
  formatDuration,
  formatRange,
  formatSegments,
  type Formatting,
} from "./format";

/**
 * One step of a guided workout. A day is flattened into an alternating run of
 * `work` and `rest` steps, so the player only ever has to know "which index am
 * I on" — all the structure lives here.
 */
export type SessionStep = WorkStep | PoseStep | RestStep;

/**
 * Seconds of "get into position" before any hold starts counting.
 *
 * Every timed hold used to begin the instant you tapped Done, which meant the
 * clock was already running while you were still reaching for the cable or
 * finding the pose — a 10s hold reliably measured about seven. Three seconds
 * rather than one, because the point is a 3-2-1 you can count along with
 * without watching the screen.
 *
 * Rest is deliberately exempt: you've just stopped, so there is nothing to get
 * ready for and a lead-in would only make every rest three seconds longer.
 */
export const LEAD_IN_SECONDS = 3;

/**
 * How long the untimed parts of a sequence set are paced at.
 *
 * A sequence runs as one continuous set — you cannot tap a phone between a hold
 * and the pulses that follow it, which is the whole reason these are paced
 * rather than waited on. Only holds carry a real duration; pulses and reps
 * carry a *count*, so the player converts one to the other at a fixed tempo and
 * the clock is a pacer, not a measurement. It's adjustable mid-set (+10s, skip)
 * precisely because the tempo is an assumption and yours will differ.
 *
 * All three sit in a 1.5–2s band — fast enough that a 7-rep pulsed leg doesn't
 * read as a second hold, which is what the previous 3–4s tempo did. This is
 * also why a falling rep count (the hold-and-pulse ramp's 12/10/8/6) has to
 * actually shorten the clock: at 4s a rep, 12 vs 6 reps only differed by 24s
 * out of roughly a minute, easy to read as "about the same"; at this tempo the
 * same gap is a third of the part's length.
 */
const PULSE_SECONDS = 1.5;
const REP_SECONDS = 1.75;
/** A rep that ends in a pulse is one rep plus a beat, not two reps. */
const PULSED_REP_SECONDS = 2;

/** Where the load goes on this set, against the one before it. */
export interface LoadCue {
  direction: "heavier" | "same" | "lighter";
  /**
   * The routine said so, rather than it being read off a falling rep target.
   *
   * Kept apart because the two deserve different wording: a stated ramp is an
   * instruction, an inferred one is an observation about the numbers, and
   * presenting a guess in the voice of the program is how you end up adding
   * weight the author never asked for.
   */
  stated: boolean;
}

/** One part of a set that runs as a sequence, placed on a clock. */
export interface SequencePart {
  /** 1-based position within the set. */
  index: number;
  detail: SetSegment;
  seconds: number;
  /**
   * Offset from the start of the sequence.
   *
   * The running part is *derived* from elapsed time against these bounds rather
   * than stored and advanced. That's what makes the sequence survive a screen
   * lock, a reload and a background tab for free — the same reasoning that puts
   * a deadline rather than a remaining count in the session store.
   */
  startMs: number;
  endMs: number;
  /** The routine put a clock on this part; the others are paced from a count. */
  isTimed: boolean;
}

export interface SetSequence {
  parts: SequencePart[];
  /** Paced length of the whole set. */
  seconds: number;
}

export interface WorkStep {
  type: "work";
  id: string;
  exerciseIndex: number;
  /** Library key, for looking up this exercise's logged sets and records. */
  exerciseId: string;
  exerciseName: string;
  kind: ExerciseEntry["kind"];
  isFinisher: boolean;
  /**
   * 1-based, counted across the exercise's prescriptions — **warmups and
   * working sets counted separately**, so a warmup reads "warmup 1 of 2" and
   * the first real set is still "set 1 of 4". Numbering them together would
   * make every routine that adds a warmup look like it grew two sets.
   */
  setNumber: number;
  setsInExercise: number;
  /**
   * A ramp-up set, not a working one. Not loggable, and excluded from the day's
   * working-set count — but it still takes time and still draws a dot, because
   * you do actually perform it.
   */
  isWarmup: boolean;
  reps?: number | [number, number];
  /** Present for cardio/holds — the step runs its own countdown. */
  durationSeconds?: number;
  perSide?: boolean;
  /** Posing hold closing this set, on finishers. */
  pose?: PoseCue;
  notes?: string;
  /** Intensity techniques for this set, from its own prescription phase. */
  modifiers?: SetModifiers;
  /** How hard to go, on the work that prescribes effort rather than load. */
  intensity?: "low" | "moderate" | "high";
  /** "or Hack squat" — equally acceptable substitutes, rendered for reading. */
  alternatives?: string;
  /**
   * The same substitutes as ids, so the player can offer them as a swap.
   *
   * Separate from `alternatives` because that one is a sentence and this one is
   * data — deriving ids back out of a rendered, translated string is the kind
   * of thing that works until someone's exercise name contains the word "or".
   */
  alternativeIds: string[];
  /**
   * This set runs as a sequence of parts rather than as plain reps.
   *
   * **One step, not one step per part.** The earlier model gave every leg its
   * own step, which is defensible on paper and unusable in a gym: advancing a
   * step is a tap, the parts of a sequence have no rest between them, and so
   * the model asked you to tap a phone with both hands loaded, four times,
   * mid-set. Holding the whole sequence on one step is what lets it run itself
   * — see `SequencePart.startMs`.
   *
   * It also collapses three special cases that existed only to undo the split:
   * logging on the last leg, counting sets at the leg that ended them, and
   * charging the time estimate once per set rather than once per leg.
   */
  sequence?: SetSequence;
  /** Where the load goes against the previous set. Absent on straight sets. */
  load?: LoadCue;
  /**
   * The exercise that follows this one, named on its last set.
   *
   * Knowing what's coming is what lets you send someone for the bench while you
   * finish, and it's the question the card couldn't answer without backing out
   * of the session to the day list.
   */
  nextExerciseName?: string;
  /** Where this set sits in a superset or circuit. Absent on ordinary work. */
  group?: GroupCue;
}

/**
 * A set's place in a superset or circuit.
 *
 * `setNumber` still counts this exercise's own sets, because the ladder, the
 * PR line and the log's provenance are all per exercise. The round is the
 * other axis and the card needs both: "set 2 of 3" answers how much of *this*
 * lift is left, and "round 2 of 3 · 1 of 2" answers where you are in the
 * rotation you're actually running.
 */
export interface GroupCue {
  id: string;
  /** 1-based position within one round. */
  position: number;
  /** How many exercises are in the rotation. Two is a superset. */
  size: number;
  round: number;
  rounds: number;
}

/**
 * The posing hold closing a finisher set — its own step so it gets a real
 * countdown, the same way rest does, rather than being a line of text on the
 * set you've already finished.
 */
export interface PoseStep {
  type: "pose";
  id: string;
  exerciseIndex: number;
  seconds: number;
  pose: PoseCue;
  /** Which set this closes — a finisher is seven of these and they blur. */
  exerciseName: string;
  setNumber: number;
  setsInExercise: number;
}

export interface RestStep {
  type: "rest";
  id: string;
  seconds: number;
  /** The exercise this rest belongs to, for highlighting the day list. */
  exerciseIndex: number;
  /** "Machine dips — set 1 of 2"; empty if nothing follows. */
  nextLabel: string;
  /** Set only when the next set is a *different* lift — i.e. you have to move. */
  nextExerciseName?: string;
}

/** A duration may be authored as a range; the countdown uses the upper bound. */
function countdownSeconds(value: number | [number, number]): number {
  return Array.isArray(value) ? value[1] : value;
}

/** A count may be authored as a range; pacing plans for the longer one. */
function pacedCount(value: number | [number, number]): number {
  return Array.isArray(value) ? value[1] : value;
}

/** "Exercise name — Set 2 of 4". Exported so a caller with a swapped
    exercise's resolved name can format the same way — see `RestStepBody`. */
export function workLabel(step: WorkStep, { t }: Formatting): string {
  return `${step.exerciseName} — ${t(
    step.isWarmup ? "routines.warmupSetOf" : "routines.setOf",
    { number: step.setNumber, total: step.setsInExercise },
  )}`;
}

/** How long one part of a sequence is given, timed exactly or paced from its count. */
function secondsForSegment(detail: SetSegment): number {
  switch (detail.kind) {
    case "hold":
      return detail.seconds;
    case "pulses":
      return Math.ceil(pacedCount(detail.count) * PULSE_SECONDS);
    case "reps":
      return Math.ceil(
        pacedCount(detail.count) *
          (detail.pulsePerRep === true ? PULSED_REP_SECONDS : REP_SECONDS),
      );
  }
}

/** Lay a set's parts out on one clock, so the running part is a subtraction. */
export function buildSequence(segments: SetSegment[]): SetSequence {
  return layOut(
    segments.map((detail) => ({
      detail,
      seconds: secondsForSegment(detail),
      isTimed: detail.kind === "hold",
    })),
  );
}

function layOut(
  parts: Pick<SequencePart, "detail" | "seconds" | "isTimed">[],
): SetSequence {
  let startMs = 0;
  const laid = parts.map((part, index) => {
    const placed: SequencePart = {
      ...part,
      index: index + 1,
      startMs,
      endMs: startMs + part.seconds * 1000,
    };
    startMs = placed.endMs;
    return placed;
  });

  return { parts: laid, seconds: startMs / 1000 };
}

/**
 * The same sequence with time you asked for mid-set folded in.
 *
 * Pressing "+10s" cannot just push the deadline out: the part boundaries are
 * offsets from the derived start, so moving the end moves the start with it and
 * elapsed time goes *down* — ten seconds of rewind, straight back into the part
 * you'd finished. Growing the current part here is the other half, and it's
 * what holds elapsed still while everything downstream shifts.
 *
 * Returns the sequence unchanged when nothing was granted, so the common case
 * allocates nothing and keeps a stable identity.
 */
export function extendSequence(
  sequence: SetSequence,
  extraMs: Record<string, number>,
): SetSequence {
  if (Object.keys(extraMs).length === 0) return sequence;

  return layOut(
    sequence.parts.map((part) => ({
      detail: part.detail,
      isTimed: part.isTimed,
      seconds: part.seconds + (extraMs[String(part.index)] ?? 0) / 1000,
    })),
  );
}

/**
 * The part of a sequence running at `elapsedMs`, clamping to the last one.
 *
 * Clamped rather than returning undefined past the end: a sequence that has run
 * out still has to render something, and "the last part, finished" is both true
 * and what you want on screen while you rack the weight.
 */
export function partAt(sequence: SetSequence, elapsedMs: number): SequencePart {
  const clamped = Math.max(0, elapsedMs);
  return (
    sequence.parts.find((part) => clamped < part.endMs) ??
    sequence.parts[sequence.parts.length - 1]
  );
}

/**
 * The rep figure a set is aiming at, for comparing one set against the next.
 *
 * A sequence answers with its rep part: a hold-and-pulse set whose shape is
 * fixed and whose rep leg falls 12/10/8/6 is a ramp in exactly the way four
 * plain sets of 12/10/8/6 are, and the load cue should read the same on both.
 */
function repTargetOf(p: Prescription): number | undefined {
  if (p.reps !== undefined) return pacedCount(p.reps);
  const repSegment = p.segments?.find((segment) => segment.kind === "reps");
  return repSegment === undefined ? undefined : pacedCount(repSegment.count);
}

/**
 * Where the load goes on the first set of a phase.
 *
 * Stated wins. Otherwise a falling rep target is read as a ramp — fewer reps
 * for the same effort means more weight, which is what a 12/10/8/6 scheme has
 * always meant — and a *rising* one as a back-off. Equal reps produce nothing:
 * inferring "same weight" there would badge every straight set in the app with
 * a fact you already knew.
 */
function loadCueFor(
  p: Prescription,
  previousTarget: number | undefined,
): LoadCue | undefined {
  if (p.load !== undefined) return { direction: p.load, stated: true };

  const target = repTargetOf(p);
  if (target === undefined || previousTarget === undefined) return undefined;
  if (target < previousTarget) return { direction: "heavier", stated: false };
  if (target > previousTarget) return { direction: "lighter", stated: false };
  return undefined;
}

/**
 * Flatten a training day into ordered player steps.
 *
 * Multiple prescriptions on one exercise are a ramp (e.g. 2 sets @10-12/90s
 * then 2 more @8-12/120s), not alternatives — so set numbering runs
 * continuously across them and the total is the sum. Rest steps come from each
 * set's own prescription, which is what lets rest change partway through.
 *
 * Naming is injected rather than resolved here, so the steps a player runs on
 * carry names in the reader's language without this module importing a store.
 */
/**
 * One set and everything that hangs off it, before anything decides where it
 * lands in the day.
 *
 * The rest is a *number* here rather than a step, which is the whole reason
 * this exists: inside a superset the rest after a set is not that set's
 * business — it belongs to the round — so the decision has to be made one
 * level up. Ungrouped work is then just the degenerate case of a rotation of
 * one, and both paths run the same code.
 */
interface SetUnit {
  work: WorkStep;
  pose?: PoseStep;
  restSeconds?: number;
}

/**
 * Consecutive entries sharing a group id, as runs.
 *
 * Adjacency is the rule, not merely a convention: two entries with the same id
 * either side of a third lift are not a superset you could run, and treating
 * them as one would reorder the day under the author.
 */
function groupRuns(
  exercises: ExerciseEntry[],
): Array<Array<{ exercise: ExerciseEntry; index: number }>> {
  const runs: Array<Array<{ exercise: ExerciseEntry; index: number }>> = [];

  exercises.forEach((exercise, index) => {
    const previous = runs[runs.length - 1];
    const id = exercise.group?.id;
    const previousId =
      previous === undefined
        ? undefined
        : previous[previous.length - 1].exercise.group?.id;

    if (id !== undefined && previous !== undefined && id === previousId) {
      previous.push({ exercise, index });
    } else {
      runs.push([{ exercise, index }]);
    }
  });

  return runs;
}

/** Where each entry sits in its rotation, aligned to `day.exercises`. */
export interface GroupMembership {
  position: number;
  size: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * The same runs `buildSteps` works from, for anything that draws the day.
 *
 * Exported so the day list can bracket a superset without re-deriving what
 * counts as one — two readings of "which entries are grouped" is two readings
 * to disagree, and the list would be the one that looked wrong.
 */
export function groupMembership(
  exercises: ExerciseEntry[],
): Array<GroupMembership | undefined> {
  const membership: Array<GroupMembership | undefined> = exercises.map(
    () => undefined,
  );

  for (const run of groupRuns(exercises)) {
    // A run of one is an ordinary exercise, whatever id it carries.
    if (run.length === 1) continue;
    run.forEach((member, position) => {
      membership[member.index] = {
        position: position + 1,
        size: run.length,
        isFirst: position === 0,
        isLast: position === run.length - 1,
      };
    });
  }

  return membership;
}

/** Every set of one exercise, in order, each with its rest still detached. */
function unitsFor(
  exercise: ExerciseEntry,
  exerciseIndex: number,
  f: Formatting,
): SetUnit[] {
  const units: SetUnit[] = [];

  // Two totals, two counters: a warmup is "warmup 1 of 2" and the working
  // sets still run 1..n. Sharing one counter would renumber every set of
  // every routine that gained a warmup.
  const totals = { warmup: 0, work: 0 };
  for (const p of exercise.prescriptions) {
    totals[p.isWarmup === true ? "warmup" : "work"] += p.sets;
  }
  const counters = { warmup: 0, work: 0 };
  // Tracked per bucket for the same reason the counters are: a light ramp-up
  // and the working sets are two separate progressions, and reading one
  // against the other would call the first working set a back-off.
  const lastTarget: { warmup?: number; work?: number } = {};

  for (const p of exercise.prescriptions) {
    const bucket = p.isWarmup === true ? "warmup" : "work";
    // Only the first set of a phase can differ from what came before it —
    // the rest are the phase repeating. A *stated* load applies to all of
    // them, since "these four sets get heavier" means each one does.
    const opening = loadCueFor(p, lastTarget[bucket]);
    const sequence =
      p.segments === undefined ? undefined : buildSequence(p.segments);

    for (let i = 0; i < p.sets; i++) {
      counters[bucket]++;
      const setNumber = counters[bucket];

      const work: WorkStep = {
        type: "work",
        exerciseIndex,
        exerciseId: exercise.exerciseId,
        exerciseName: exerciseDisplayName(exercise, f),
        kind: exercise.kind,
        isFinisher: exercise.isFinisher,
        setNumber,
        setsInExercise: totals[bucket],
        isWarmup: bucket === "warmup",
        perSide: p.perSide,
        notes: exercise.notes,
        modifiers: p.modifiers,
        intensity: p.intensity,
        alternatives: formatAlternatives(exercise, f),
        alternativeIds: exercise.orAlternatives,
        // The bucket is in the id because the two counters both start at 1 —
        // without it a warmup's first set and a working first set would share
        // a key, and React would reuse one for the other.
        id: `${exerciseIndex}-${bucket}${setNumber}-work`,
        reps: p.reps,
        durationSeconds:
          p.durationSeconds === undefined
            ? undefined
            : countdownSeconds(p.durationSeconds),
        pose: p.pose,
        sequence,
        load: i === 0 || opening?.stated === true ? opening : undefined,
      };

      units.push({
        work,
        // The hold belongs between the set and its rest: you finish the reps,
        // hold the pose, then rest. A pose with no `holdSeconds` is a cue to
        // strike rather than something to time, so it stays on the work step.
        pose:
          p.pose?.holdSeconds === undefined
            ? undefined
            : {
                type: "pose",
                id: `${exerciseIndex}-${bucket}${setNumber}-pose`,
                exerciseIndex,
                seconds: p.pose.holdSeconds,
                pose: p.pose,
                exerciseName: exerciseDisplayName(exercise, f),
                setNumber,
                setsInExercise: totals[bucket],
              },
        restSeconds: p.restSeconds,
      });
    }

    lastTarget[bucket] = repTargetOf(p) ?? lastTarget[bucket];
  }

  return units;
}

/**
 * A unit as steps, with the rest the caller decided on.
 *
 * `restSeconds` is required rather than defaulted to the unit's own, because
 * "no rest here" is passed as `undefined` and a default would quietly turn
 * every superset transition back into the member's full rest — which is
 * precisely the behaviour this feature exists to stop.
 */
function emit(
  unit: SetUnit,
  exerciseIndex: number,
  restSeconds: number | undefined,
): SessionStep[] {
  const steps: SessionStep[] = [unit.work];
  if (unit.pose !== undefined) steps.push(unit.pose);
  if (restSeconds !== undefined && restSeconds > 0) {
    steps.push({
      type: "rest",
      id: `${unit.work.id.replace(/-work$/, "")}-rest`,
      seconds: restSeconds,
      exerciseIndex,
      nextLabel: "",
    });
  }
  return steps;
}

export function buildSteps(day: TrainingDay, f: Formatting): SessionStep[] {
  const steps: SessionStep[] = [];

  for (const run of groupRuns(day.exercises)) {
    const units = run.map(({ exercise, index }) => unitsFor(exercise, index, f));

    // A run of one is an ordinary exercise, whether or not it carries a group
    // id — deleting the other half of a superset leaves one behind, and it
    // should read as the plain lift it now is rather than as a rotation of one.
    if (run.length === 1) {
      for (const unit of units[0]) {
        steps.push(...emit(unit, run[0].index, unit.restSeconds));
      }
      continue;
    }

    // The rotation. Rounds are the longest member's set count: an uneven
    // superset (3 sets of one, 4 of the other) runs its last round alone,
    // which is what actually happens in a gym.
    const rounds = Math.max(...units.map((forMember) => forMember.length));
    for (let round = 0; round < rounds; round++) {
      // Members that still have a set this round, so the last of *them* takes
      // the round's rest rather than a member that has already finished.
      const present = run
        .map((member, position) => ({ member, position }))
        .filter(({ position }) => units[position][round] !== undefined);

      present.forEach(({ member, position }, order) => {
        const unit = units[position][round];
        unit.work.group = {
          id: member.exercise.group?.id ?? "",
          position: position + 1,
          size: run.length,
          round: round + 1,
          rounds,
        };

        const isLastOfRound = order === present.length - 1;
        steps.push(
          ...emit(
            unit,
            member.index,
            // Between stations you go straight on, unless the entry states a
            // transition — and after the last one you take that member's own
            // rest, which is the round's rest. The earlier members' rests are
            // deliberately dropped: resting after each is what a superset isn't.
            isLastOfRound
              ? unit.restSeconds
              : member.exercise.group?.transitionSeconds,
          ),
        );
      });
    }
  }

  // A rest step that ended up last has nothing to rest *for* — drop it.
  while (steps.length > 0 && steps[steps.length - 1].type === "rest") {
    steps.pop();
  }

  // Second pass: say what's coming. A rest step announces the set that follows
  // it, and both rest and the last set of an exercise name the *next exercise*
  // when the one after them is a different lift — which is the difference
  // between resting where you are and needing to go and find a machine.
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.type === "pose") continue;

    const nextWork = steps
      .slice(i + 1)
      .find((other): other is WorkStep => other.type === "work");
    if (nextWork === undefined) continue;

    if (step.type === "rest") {
      step.nextLabel = workLabel(nextWork, f);
    }
    if (nextWork.exerciseIndex !== step.exerciseIndex) {
      step.nextExerciseName = nextWork.exerciseName;
    }
  }

  return steps;
}

/**
 * The target line for a single set, e.g. "10-15 reps" or "20 min".
 *
 * Deliberately not `formatPrescription` — that formats a whole prescription
 * ("2×10-15"), and inside the player the set count is already shown as
 * "set 1 of 2", so repeating it would read as "1×10-15".
 */
export function describeStep(step: WorkStep, f: Formatting): string {
  // A sequence describes itself as the whole run of parts — pulses and reps are
  // both counts, and only the wording separates them.
  if (step.sequence !== undefined) {
    return formatSegments(
      step.sequence.parts.map((part) => part.detail),
      f,
    );
  }
  if (step.reps !== undefined) {
    const range = formatRange(step.reps);
    return step.perSide
      ? f.t("format.repsPerSide", { range })
      : f.t("format.repsOnly", { range });
  }
  if (step.durationSeconds !== undefined) {
    return formatDuration(step.durationSeconds, f);
  }
  return f.t.plural("format.setCount", 1);
}

/** One set's place in its exercise's plan — a rung of the ladder below. */
export interface LadderRung {
  setNumber: number;
  /** The bare figure that changes between sets: "8", "8-12", "45s". */
  target: string;
  load?: LoadCue;
  isCurrent: boolean;
  isDone: boolean;
}

/**
 * Every set of the exercise you're on, as the numbers you act on.
 *
 * "Set 2 of 4" says where you are and nothing about where you're going, so a
 * ramp written as 12/10/8/6 reached you one number at a time with no way to see
 * it was a ramp at all. Laid out as a row it reads as the plan it is, which is
 * also where the load arrows hang.
 *
 * Warmups and working sets are separate ladders for the same reason they're
 * numbered separately — they're two progressions, and interleaving them would
 * put a light single next to a top set as though they were comparable.
 */
export function setLadder(
  steps: SessionStep[],
  current: WorkStep,
  f: Formatting,
): LadderRung[] {
  return steps
    .filter(
      (step): step is WorkStep =>
        step.type === "work" &&
        step.exerciseIndex === current.exerciseIndex &&
        step.isWarmup === current.isWarmup,
    )
    .map((step) => ({
      setNumber: step.setNumber,
      target: rungTarget(step, f),
      load: step.load,
      isCurrent: step.setNumber === current.setNumber,
      isDone: step.setNumber < current.setNumber,
    }));
}

/**
 * A rung shows the bare figure, not a sentence.
 *
 * The point of the row is that 12 · 10 · 8 · 6 reads as a shape at a glance;
 * "12 reps · 10 reps · 8 reps" is the same shape with the differences pushed
 * apart by a repeated word. A sequence answers with its rep part for the same
 * reason `repTargetOf` does — that's the leg the ramp moves.
 */
function rungTarget(step: WorkStep, f: Formatting): string {
  if (step.sequence !== undefined) {
    const reps = step.sequence.parts.find((part) => part.detail.kind === "reps");
    if (reps?.detail.kind === "reps") return formatRange(reps.detail.count);
    return f.t("format.seconds", { count: Math.round(step.sequence.seconds) });
  }
  if (step.reps !== undefined) return formatRange(step.reps);
  if (step.durationSeconds !== undefined) {
    return f.t("format.seconds", { count: step.durationSeconds });
  }
  return "—";
}

/** What a step's own clock counts, if it has one. */
export function timedSecondsFor(step: SessionStep): number | undefined {
  if (step.type === "rest" || step.type === "pose") return step.seconds;
  if (step.sequence !== undefined) return step.sequence.seconds;
  return step.durationSeconds;
}

/** A countdown, and how long you get to be ready for it. */
export interface AutoStart {
  seconds: number;
  leadSeconds: number;
}

/**
 * What starts counting the moment you arrive at `step`, or undefined to wait
 * for an explicit Start.
 *
 * Rest and pose holds still begin on their own — the tap you just made *was*
 * the start, and asking for a second one is the tap you can least spare. What
 * changed is that a pose gets counted in first: its clock used to begin the
 * instant you tapped Done, while you were still finding the pose, so a
 * prescribed 10s hold reliably measured about seven. Rest needs no lead-in,
 * because there is nothing to be ready for.
 *
 * Work steps wait, and always have: you have to get on the machine, or into
 * position, before a clock means anything. They carry the same lead-in when you
 * do start them.
 */
export function autoStartFor(step: SessionStep | undefined): AutoStart | undefined {
  if (step?.type === "rest") return { seconds: step.seconds, leadSeconds: 0 };
  if (step?.type === "pose") {
    return { seconds: step.seconds, leadSeconds: LEAD_IN_SECONDS };
  }
  return undefined;
}

/**
 * Whether this step is where a set gets logged.
 *
 * **Warmups are never logged, and that is the whole reason `LoggedSet` needed
 * no change.** Two ramp-up sets at half your working weight are not a record,
 * are not volume, and are not a data point about anything — they're how you
 * get ready. Storing them and then teaching the PR frontier, the volume
 * buckets and the heatmap to each exclude them would be three places to get it
 * wrong; not storing them is none.
 */
export function isLoggableStep(step: SessionStep): boolean {
  return step.type === "work" && step.kind !== "cardio" && !step.isWarmup;
}

/** Total work sets in the day, for a "12 sets" style summary. */
export function countWorkSteps(steps: SessionStep[]): number {
  return steps.filter((s) => s.type === "work").length;
}

/**
 * The set a rest step is resting *from* — the nearest work step before it.
 *
 * Not simply `steps[index - 1]`: a finisher's rest follows its pose hold, not
 * the work step directly, so this walks back past whatever sits in between.
 * What the rest screen's log prompt resolves against — see `RestStepBody`.
 */
export function previousWorkStep(
  steps: SessionStep[],
  index: number,
): WorkStep | undefined {
  for (let i = index - 1; i >= 0; i--) {
    const step = steps[i];
    if (step.type === "work") return step;
  }
  return undefined;
}
