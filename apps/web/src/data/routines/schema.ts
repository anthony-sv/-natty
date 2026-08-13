import { z } from "zod";

/** A single number, or an inclusive [min, max] range (e.g. "8-12 reps", "20-30 seconds"). */
const numberOrRange = z.union([
  z.number().int().positive(),
  z.tuple([z.number().int().positive(), z.number().int().positive()]),
]);
const repRange = numberOrRange;

/**
 * Intensity techniques applied to the sets of one prescription phase.
 *
 * These sit here rather than on the exercise because they're how a set is run,
 * not what the lift is: the same barbell curl is a different prescription with
 * negatives than without, and history for both should still roll up to one
 * exercise.
 *
 * Because a phase covers a run of sets, "drop set on the last set only" needs
 * no extra structure — split the exercise into two phases and put the modifier
 * on the second:
 *
 *   prescriptions: [
 *     { sets: 3, reps: [8, 12], restSeconds: 90 },
 *     { sets: 1, reps: [8, 12], restSeconds: 90, modifiers: { partials: true } },
 *   ]
 *
 * Only the techniques the routines actually prescribe are modelled. Adding
 * to-failure, drop sets, rest-pause or tempo is a field each — do it when a
 * routine needs one, not before.
 */
export const setModifiersSchema = z.object({
  /** Assisted reps past failure. */
  forcedReps: z.boolean().optional(),
  /** Strip weight and keep going, without racking. */
  dropSet: z.boolean().optional(),
  /**
   * Take the set to failure, rack it for a breath or two, then squeeze out
   * more reps at the same weight.
   *
   * Distinct from `dropSet`, which changes the load and doesn't stop, and from
   * `forcedReps`, which needs a spotter. This one is the same weight and no
   * help — just a pause.
   */
  restPause: z.boolean().optional(),
  /** Emphasised or assisted eccentrics. */
  negatives: z.boolean().optional(),
  /** Partial-range reps, typically once full reps fail. */
  partials: z.boolean().optional(),
  /** Isometric holds during the set. */
  staticHolds: z.boolean().optional(),
  /**
   * One rep is several reps at different positions, named here in order — the
   * source docs' "ladder". A front raise ladder is ["low", "mid", "full"];
   * a cable fly ladder is ["abs height", "mid", "front"].
   */
  ladder: z.array(z.string()).min(2).optional(),
});
export type SetModifiers = z.infer<typeof setModifiersSchema>;

/**
 * The posing hold that closes a finisher set — "most muscular, 10 seconds".
 *
 * A reference into `data/poses`, not a free string, because the docs spell the
 * same pose several ways ("quad" / "Quad flex"). `holdSeconds` is separate from
 * the pose so it can vary: finisher sets are 10s throughout, but nothing about the
 * model assumes that.
 */
export const poseCueSchema = z.object({
  poseId: z.string(),
  /** Seconds to hold. Omitted means "strike the pose", no timed hold. */
  holdSeconds: z.number().int().positive().optional(),
});
export type PoseCue = z.infer<typeof poseCueSchema>;

/**
 * One leg of a set that is run as a sequence rather than as plain reps.
 *
 * Some protocols make one "set" a fixed run of different things — a hold, then
 * pulses, then full reps, then another hold. `modifiers` can't express that:
 * it says *how* a set is run, not what it's made of, and `ladder` is a
 * per-rep structure (one rep is three partial reps) rather than a per-set one.
 *
 * Deliberately only three kinds. Anything else — tempo, rest-pause, cluster —
 * is a new member here when a routine actually prescribes one, the same rule
 * `setModifiersSchema` follows.
 */
export const setSegmentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("reps"),
    count: repRange,
    /** Each rep ends in a small pulse at the contracted position. */
    pulsePerRep: z.boolean().optional(),
  }),
  /** Short partial reps at the contracted position, counted not timed. */
  z.object({ kind: z.literal("pulses"), count: repRange }),
  /** An isometric hold, in seconds — the player gives it a real countdown. */
  z.object({ kind: z.literal("hold"), seconds: z.number().int().positive() }),
]);
export type SetSegment = z.infer<typeof setSegmentSchema>;

/**
 * One prescription for an exercise. Most exercises have exactly one; a
 * ramp/pyramid structure (e.g. 2 sets @ 10-12 reps/90s rest, then 2 more sets
 * @ 8-12 reps/120s rest) is represented as multiple prescriptions in order.
 *
 * That also covers a ramp whose *shape* stays fixed while its numbers move —
 * four sets adding weight and dropping the rep segment each time is four
 * prescriptions of `sets: 1`, not new structure.
 */
export const prescriptionSchema = z
  .object({
    sets: z.number().int().positive(),
    /** Omitted for pure-duration items (a stretch hold, a cardio block). */
    reps: repRange.optional(),
    /** Stretch hold, cardio duration, dead hang — a duration instead of reps. */
    durationSeconds: numberOrRange.optional(),
    /**
     * How hard to go, for the work where that's the prescription rather than a
     * load or a rep count.
     *
     * Cardio's whole dose is time × effort: twenty easy minutes and twenty
     * hard ones are different sessions, and nothing else here could say which
     * one was meant. `setModifiersSchema` is the wrong home — those are
     * lifting techniques (forced reps, a drop set), and none of them mean
     * anything on a bike.
     *
     * Three steps, not a percentage of max heart rate or a watt figure:
     * nobody writing a program types those, and a scale you'd have to look up
     * is a scale you'd leave blank.
     */
    intensity: z.enum(["low", "moderate", "high"]).optional(),
    /**
     * The set is a sequence, described leg by leg. Two or more, because a
     * one-segment sequence is a plain prescription written the long way.
     */
    segments: z.array(setSegmentSchema).min(2).optional(),
    restSeconds: z.number().int().nonnegative().optional(),
    /** Posing/flex hold closing a finisher set. */
    pose: poseCueSchema.optional(),
    /** Reps/duration figure is per side (e.g. single-arm rows). */
    perSide: z.boolean().optional(),
    /**
     * Ramp-up sets before the working ones — two at half the load, one at
     * ~70%, that sort of thing.
     *
     * A flag on the phase rather than a separate `warmupSets` array, because a
     * phase *is* "a run of sets described one way", which is exactly what a
     * warmup block is. It composes with everything already here: rest between
     * them, a rep range, even a ramp written as several one-set phases.
     *
     * **Distinct from `TrainingDay.warmupRefs`**, which is the general
     * mobility work that opens a session. This is the specific lift you're
     * about to do, done light.
     *
     * A warmup set is never logged — see `isLoggableStep`. That's what keeps
     * `LoggedSet` out of this entirely: no `isWarmup` on a stored set, so
     * nothing downstream (the PR frontier, per-muscle volume, the heatmap) had
     * to learn the difference or risk getting it wrong.
     *
     * Optional rather than `.default(false)`, like `perSide` beside it: a
     * default puts the key on the *output* type, which would mean writing
     * `isWarmup: false` on all seventy-odd authored prescriptions to say
     * nothing. `buildSteps` normalises it to a plain boolean on the step, so
     * the optionality stops at the model.
     */
    isWarmup: z.boolean().optional(),
    /**
     * How the load moves for these sets, against the set before them.
     *
     * A ramp is already expressible — four sets adding weight while the rep
     * target falls 12/10/8/6 is four one-set phases — but nothing *said* so.
     * The rep numbers were on screen and the instruction that goes with them
     * ("and put weight on each time") lived only in the author's head, which
     * made a ramp indistinguishable from four sets you happened to write
     * separately.
     *
     * Three values rather than a percentage or a kilo figure: what changes
     * between two sets of a ramp is a decision you make at the rack off what
     * the last one felt like, and a number here would be a number the routine
     * doesn't know. The player pairs it with your last logged set, which is the
     * half it *can* know.
     *
     * Optional, and `buildSteps` infers a direction from a falling rep target
     * when it's absent — so the transcribed programs, which state their ramps
     * only as rep numbers, read correctly without being re-authored. An
     * explicit value always wins over the inference, and is the only way to say
     * "same weight" (inferring that from equal reps would badge every straight
     * set in the app).
     */
    load: z.enum(["heavier", "same", "lighter"]).optional(),
    /** Intensity techniques for these sets. Absent means straight sets. */
    modifiers: setModifiersSchema.optional(),
  })
  // A set is described one way or the other. Carrying both would leave every
  // reader — the player, the day list, the summary estimate — to guess which
  // one wins, and they'd guess differently.
  .refine(
    (p) =>
      p.segments === undefined ||
      (p.reps === undefined && p.durationSeconds === undefined),
    {
      message:
        "A prescription describes its set either as reps/duration or as segments, not both",
      path: ["segments"],
    },
  );
export type Prescription = z.infer<typeof prescriptionSchema>;

export const exerciseEntrySchema = z.object({
  /**
   * Link into the exercise library (`data/exercises`) — the source of truth for
   * what this lift is. Resolved from the source-doc spelling at authoring time
   * by the helpers in `authoring.ts`, which throw on an unknown name.
   *
   * The spelling itself is not stored: it stays visible in the program files as
   * the argument to `ex(...)`, which is where the transcription audit trail
   * belongs. Use `exerciseDisplayName()` to render an entry.
   */
  exerciseId: z.string(),
  /**
   * Equally acceptable substitutes, in the source's own order — how the docs'
   * "Db shoulder press/machine" and "Smith machine/Hack squat" are modelled.
   * `exerciseId` is the one written first; these are the rest.
   */
  orAlternatives: z.array(z.string()).default([]),
  kind: z.enum(["resistance", "cardio", "mobility", "stretch"]),
  /** Finisher set: high reps, short rest, a posing cue. */
  isFinisher: z.boolean().default(false),
  prescriptions: z.array(prescriptionSchema).min(1),
  notes: z.string().optional(),
});
export type ExerciseEntry = z.infer<typeof exerciseEntrySchema>;

export const trainingDaySchema = z.object({
  /** Preserves the source doc's numbering, including rest days. */
  dayNumber: z.number().int().positive(),
  /** "Chest", "Back/Biceps", "Shoulders/Traps/Quads", ... */
  label: z.string(),
  isRest: z.boolean().default(false),
  exercises: z.array(exerciseEntrySchema).default([]),
  /** Warmup section slugs, resolved by muscle group at authoring time. */
  warmupRefs: z.array(z.string()).default([]),
});
export type TrainingDay = z.infer<typeof trainingDaySchema>;

export const trainingWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  days: z.array(trainingDaySchema),
});
export type TrainingWeek = z.infer<typeof trainingWeekSchema>;

export const routineSchema = z.object({
  slug: z.string(),
  name: z.string(),
  /**
   * Free lines under the program — what a diet plan's `notes` are.
   *
   * `.optional()` rather than `.default([])`, which is the difference between
   * "may be absent" and "is always an array": the six transcribed programs
   * are written as `Routine` literals, and a defaulted field is *required* in
   * the parsed type, so a default here would mean adding `notes: []` to six
   * files that have none.
   */
  notes: z.array(z.string()).optional(),
  /** Who this program is attributed to/sourced from, if known. */
  source: z.string().optional(),
  /** Training style/methodology label, if any (e.g. "Push/Pull/Legs"). */
  style: z.string().optional(),
  goal: z.enum(["bulking", "cutting"]).optional(),
  /**
   * Display-only fallback shown in the program header (e.g. "Default: 8-12
   * reps, 3 sets, 90s rest"). Every exercise's own prescription is already
   * fully resolved at authoring time — nothing merges this at render time.
   */
  defaultPrescription: z
    .object({
      reps: repRange.optional(),
      sets: z.number().int().positive().optional(),
      restSeconds: z.number().int().nonnegative().optional(),
    })
    .optional(),
  weeks: z.array(trainingWeekSchema).min(1),
});
export type Routine = z.infer<typeof routineSchema>;

export const warmupMoveSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive().optional(),
  reps: repRange.optional(),
  durationSeconds: numberOrRange.optional(),
  perSide: z.boolean().optional(),
  purpose: z.string().optional(),
});
export type WarmupMove = z.infer<typeof warmupMoveSchema>;

export const warmupSectionSchema = z.object({
  slug: z.string(),
  title: z.string(),
  durationMinutes: numberOrRange.optional(),
  moves: z.array(warmupMoveSchema),
});
export type WarmupSection = z.infer<typeof warmupSectionSchema>;
