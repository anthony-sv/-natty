import { z } from "zod";
import { exerciseSchema, type Exercise } from "./schema";

/**
 * The variant library. One row per distinct thing a routine can prescribe.
 *
 * `aliases` exists so the six programs in `data/routines/` resolve without
 * being rewritten — every spelling that appears there lands somewhere here,
 * enforced by `exercises.test.ts`. Matching is case- and
 * punctuation-insensitive (see `normalizeName`), so an alias is only
 * needed when it differs from `name` by more than casing or punctuation.
 *
 * `needsReview: true` marks a mapping that was a judgment call on an ambiguous
 * source name — those are listed by `exercisesNeedingReview()` rather than
 * quietly becoming fact. The set is currently empty: every ambiguity was
 * settled against the source docs in `gym-docs/` or by the author.
 *
 * Spellings that encoded an intensity technique or an either/or in their
 * wording ("Barbell curls (Negative/Forced reps/Partials)", "Smith
 * machine/Hack squat") are deliberately NOT aliases — those now live on the
 * prescription's `modifiers` and the entry's `orAlternatives`, so admitting the
 * old wording would let a routine restate a technique without modelling it.
 * Writing one throws "Unknown exercise", which is the intended nudge; the
 * original wording is recorded in `notes` and in `gym-docs/`.
 */
// Authored shape, not parsed shape: `aliases`/`facets`/`needsReview` have
// schema defaults, so entries below may omit them.
const raw: z.input<typeof exerciseSchema>[] = [
  // ── Chest: bench press ─────────────────────────────────────────────────
  {
    id: "flat-barbell-bench-press",
    movementId: "bench-press",
    name: "Flat barbell bench press",
    facets: { implement: "barbell", posture: "lying", gripWidth: "shoulder" },
  },
  {
    id: "close-grip-bench-press",
    movementId: "bench-press",
    name: "Close-grip barbell bench press",
    facets: { implement: "barbell", posture: "lying", gripWidth: "close" },
    // A close grip turns the bench into a triceps lift — the one case in this
    // library where grip width alone justifies overriding the movement.
    muscleOverride: {
      primaryMuscles: ["triceps"],
      secondaryMuscles: ["chest", "front-delts"],
    },
  },
  {
    id: "flat-dumbbell-press",
    movementId: "bench-press",
    name: "Flat dumbbell press",
    aliases: ["Flat db press"],
    facets: { implement: "dumbbell", posture: "lying" },
  },
  {
    id: "flat-smith-bench-press",
    movementId: "bench-press",
    name: "Flat smith machine bench press",
    aliases: ["Flat smith machine chest press"],
    facets: { implement: "smith", posture: "lying" },
  },
  {
    id: "flat-machine-chest-press",
    movementId: "bench-press",
    name: "Flat machine chest press",
    facets: { implement: "machine", posture: "seated" },
  },

  // ── Chest: incline press ───────────────────────────────────────────────
  {
    id: "incline-barbell-bench-press",
    movementId: "incline-press",
    name: "Incline barbell bench press",
    facets: { implement: "barbell", posture: "incline" },
  },
  {
    id: "incline-dumbbell-press",
    movementId: "incline-press",
    name: "Incline dumbbell press",
    aliases: ["Incline db press"],
    facets: { implement: "dumbbell", posture: "incline" },
  },
  {
    id: "incline-dumbbell-neutral-press",
    movementId: "incline-press",
    name: "Incline dumbbell neutral-grip press",
    aliases: ["Incline db neutral grip press"],
    facets: { implement: "dumbbell", posture: "incline", grip: "neutral" },
  },
  {
    id: "incline-smith-bench-press",
    movementId: "incline-press",
    name: "Incline smith machine bench press",
    facets: { implement: "smith", posture: "incline" },
  },
  // ── Chest: fly ─────────────────────────────────────────────────────────
  {
    id: "incline-dumbbell-fly",
    movementId: "chest-fly",
    name: "Incline dumbbell fly",
    aliases: ["Incline bench db flyes"],
    facets: { implement: "dumbbell", posture: "incline" },
    notes:
      '"Db incline intense variations" is this same fly — "intense variations" is the author\'s shorthand for intensity techniques, now held in `modifiers` on the prescription. The two spellings never share a day, so folding them is safe.',
  },
  {
    id: "pec-deck",
    movementId: "chest-fly",
    name: "Pec deck (open hand)",
    aliases: ["Pec deck open"],
    facets: { implement: "machine", posture: "seated", grip: "open-hand" },
  },
  {
    id: "cable-crossover-mid",
    movementId: "chest-fly",
    name: "Cable crossover (middle)",
    facets: { implement: "cable", posture: "standing", pulleyHeight: "middle" },
  },
  {
    id: "cable-fly",
    movementId: "chest-fly",
    name: "Cable fly",
    facets: { implement: "cable", posture: "standing" },
    notes:
      'Distinct from `cable-crossover-mid`: this one has no fixed pulley height, because the ladder runs through them. "Ladder" is a within-set protocol — one rep is three: a fly at abs height, one at mid, one straight to the front. It now lives in `modifiers` on the prescription.',
  },

  // ── Chest: dips, push-ups, cable press, pullover ───────────────────────
  {
    id: "chest-dip",
    movementId: "dip",
    name: "Chest dip",
    aliases: ["Chest dips"],
    facets: { implement: "bodyweight" },
  },
  {
    id: "machine-chest-dip",
    movementId: "dip",
    name: "Machine dip (chest)",
    aliases: ["Machine dips chest"],
    facets: { implement: "machine", posture: "seated" },
  },
  {
    id: "machine-triceps-dip",
    movementId: "dip",
    name: "Machine dip (triceps)",
    aliases: ["Machine dips (Triceps)", "Machine dips"],
    facets: { implement: "machine", posture: "seated" },
    muscleOverride: {
      primaryMuscles: ["triceps"],
      secondaryMuscles: ["chest", "front-delts"],
    },
    notes:
      'Bare "Machine dips" resolves here: the source docs spell the same slot "Machine dips triceps"/"(Triceps)" everywhere else, and the chest one is always spelled "machine dips chest".',
  },
  {
    id: "feet-elevated-push-up",
    movementId: "push-up",
    name: "Feet-elevated push-up (chest)",
    aliases: ["Feet elevated push-ups (Chest)"],
    facets: { implement: "bodyweight", posture: "decline" },
  },
  {
    id: "standing-cable-chest-press",
    movementId: "cable-chest-press",
    name: "Standing cable chest press",
    facets: { implement: "cable", posture: "standing" },
  },
  {
    id: "dumbbell-pullover",
    movementId: "pullover",
    name: "Dumbbell pullover",
    aliases: ["Db pullover"],
    facets: { implement: "dumbbell", posture: "lying" },
  },

  // ── Back: vertical pull ────────────────────────────────────────────────
  {
    id: "lat-pulldown-wide",
    movementId: "lat-pulldown",
    name: "Wide-grip lat pulldown",
    aliases: ["Lat pulldown (Wide grip)", "Lat pulldown wide"],
    facets: {
      implement: "cable",
      posture: "seated",
      grip: "pronated",
      gripWidth: "wide",
    },
  },
  {
    id: "lat-pulldown-close",
    movementId: "lat-pulldown",
    name: "Close-grip lat pulldown",
    aliases: ["Lat pulldown (Close grip)"],
    facets: {
      implement: "cable",
      posture: "seated",
      grip: "neutral",
      gripWidth: "close",
    },
  },
  {
    id: "lat-pulldown-reverse",
    movementId: "lat-pulldown",
    name: "Reverse-grip lat pulldown",
    aliases: ["Lat pulldown (Reverse grip)"],
    facets: { implement: "cable", posture: "seated", grip: "supinated" },
  },
  {
    id: "wide-grip-pull-up",
    movementId: "pull-up",
    name: "Wide-grip pull-up",
    aliases: ["Wide grip pull ups"],
    facets: { implement: "bodyweight", grip: "pronated", gripWidth: "wide" },
  },
  {
    id: "cable-straight-arm-pulldown",
    movementId: "straight-arm-pulldown",
    name: "Cable straight-arm pulldown",
    aliases: ["Cable straight arm pulldowns"],
    facets: { implement: "cable", attachment: "straight-bar" },
  },
  {
    id: "rope-straight-arm-pulldown",
    movementId: "straight-arm-pulldown",
    name: "Rope straight-arm pulldown",
    aliases: ["Cable pulldowns (Rope)", "Cable pulldown rope"],
    facets: { implement: "cable", attachment: "rope", pulleyHeight: "high" },
    notes:
      'Source says only "Cable pulldowns (Rope)"; confirmed as the standing straight-arm version, not a kneeling rope lat pulldown.',
  },

  // ── Back: horizontal pull ──────────────────────────────────────────────
  {
    id: "t-bar-row-wide",
    movementId: "t-bar-row",
    name: "Wide-grip T-bar row",
    aliases: ["Bent over T-bar rows wide"],
    facets: { implement: "t-bar", posture: "bent-over", gripWidth: "wide" },
  },
  {
    id: "t-bar-row-shoulder",
    movementId: "t-bar-row",
    name: "Shoulder-width T-bar row",
    aliases: ["Bent over T-bar rows (Shoulder-width grip)"],
    facets: { implement: "t-bar", posture: "bent-over", gripWidth: "shoulder" },
  },
  {
    id: "t-bar-row-v-bar",
    movementId: "t-bar-row",
    name: "V-bar T-bar row",
    aliases: ["Bent over T-bar rows (V-bar grip)"],
    facets: {
      implement: "t-bar",
      posture: "bent-over",
      attachment: "v-bar",
      grip: "neutral",
    },
  },
  {
    id: "barbell-row-underhand",
    movementId: "barbell-row",
    name: "Underhand bent-over barbell row",
    aliases: ["Bent over barbell row (Underhand grip)", "Bent over barbell rows (Underhand)"],
    facets: { implement: "barbell", posture: "bent-over", grip: "supinated" },
  },
  {
    id: "barbell-row-overhand",
    movementId: "barbell-row",
    name: "Overhand bent-over barbell row",
    aliases: ["Overhand bent over barbell rows"],
    facets: { implement: "barbell", posture: "bent-over", grip: "pronated" },
  },
  {
    id: "single-arm-dumbbell-row",
    movementId: "dumbbell-row",
    name: "Single-arm dumbbell row",
    aliases: ["Single arm db row"],
    facets: {
      implement: "dumbbell",
      posture: "bent-over",
      laterality: "unilateral",
    },
  },
  {
    id: "single-arm-dumbbell-high-row",
    movementId: "dumbbell-row",
    name: "Single-arm dumbbell high row",
    aliases: ["Single arm db high rows"],
    facets: {
      implement: "dumbbell",
      posture: "bent-over",
      laterality: "unilateral",
    },
  },
  {
    id: "incline-bench-dumbbell-row",
    movementId: "dumbbell-row",
    name: "Incline-bench dumbbell row",
    aliases: ["Db rows incline bench", "Db rows on incline bench"],
    facets: { implement: "dumbbell", posture: "incline" },
  },
  {
    id: "low-cable-row-mag",
    movementId: "cable-row",
    name: "Low cable row (mag grip)",
    facets: {
      implement: "cable",
      posture: "seated",
      attachment: "mag-grip",
      pulleyHeight: "low",
    },
  },
  {
    id: "low-cable-row-rope",
    movementId: "cable-row",
    name: "Low cable row (rope)",
    facets: {
      implement: "cable",
      posture: "seated",
      attachment: "rope",
      pulleyHeight: "low",
    },
  },
  {
    id: "low-cable-row-v-bar",
    movementId: "cable-row",
    name: "Low cable row (V-bar)",
    facets: {
      implement: "cable",
      posture: "seated",
      attachment: "v-bar",
      grip: "neutral",
      pulleyHeight: "low",
    },
  },
  {
    id: "machine-mid-row-neutral",
    movementId: "machine-row",
    name: "Machine mid row (neutral grip)",
    aliases: ["Machine mid row neutral"],
    facets: { implement: "machine", posture: "seated", grip: "neutral" },
  },
  {
    id: "machine-mid-row-overhand",
    movementId: "machine-row",
    name: "Machine mid row overhand",
    facets: { implement: "machine", posture: "seated", grip: "pronated" },
  },
  {
    id: "hyperextension",
    movementId: "back-extension",
    name: "Hyperextension",
    facets: { implement: "bodyweight" },
  },

  // ── Shoulders: overhead press ──────────────────────────────────────────
  {
    id: "seated-barbell-shoulder-press",
    movementId: "overhead-press",
    name: "Seated barbell shoulder press",
    facets: { implement: "barbell", posture: "seated" },
  },
  {
    id: "dumbbell-shoulder-press",
    movementId: "overhead-press",
    name: "Dumbbell shoulder press",
    aliases: ["Db shoulder press"],
    facets: { implement: "dumbbell", posture: "seated" },
    notes:
      '"Db shoulder press/machine" is an either/or with `machine-shoulder-press-neutral` — is held in `orAlternatives` on the entry.',
  },
  {
    id: "machine-shoulder-press-neutral",
    movementId: "overhead-press",
    name: "Machine shoulder press (neutral grip)",
    facets: { implement: "machine", posture: "seated", grip: "neutral" },
  },
  {
    id: "smith-shoulder-press",
    movementId: "overhead-press",
    name: "Smith machine shoulder press",
    facets: { implement: "smith", posture: "seated" },
    notes: "Forced reps is a set modifier — now lives in `modifiers` on the prescription.",
  },

  // ── Shoulders: raises ──────────────────────────────────────────────────
  {
    id: "seated-dumbbell-lateral-raise",
    movementId: "lateral-raise",
    name: "Seated dumbbell lateral raise",
    aliases: ["Seated db lateral raises overhand"],
    facets: { implement: "dumbbell", posture: "seated", grip: "pronated" },
    notes:
      'All three source spellings are this one exercise. "Variations" is the author\'s shorthand for intensity techniques — any or all of forced reps, negatives and partials — not a different lift; it now lives in `modifiers` on the prescription.',
  },
  {
    id: "single-arm-cable-lateral-raise",
    movementId: "lateral-raise",
    name: "Single arm cable lateral raise",
    facets: {
      implement: "cable",
      attachment: "single-handle",
      laterality: "unilateral",
    },
  },
  {
    id: "dumbbell-front-raise",
    movementId: "front-raise",
    name: "Standing dumbbell front raise",
    aliases: ["Standing db front raises (Overhand)"],
    facets: { implement: "dumbbell", posture: "standing", grip: "pronated" },
  },
  {
    id: "dumbbell-front-raise-together",
    movementId: "front-raise",
    name: "Standing dumbbell front raise (arms together)",
    aliases: ["Standing db front raises (Overhand, arms together)", "Standing db front raises (Overhand, together)", "Standing db front raised (Overhand, arms together)"],
    facets: {
      implement: "dumbbell",
      posture: "standing",
      grip: "pronated",
      orientation: "arms-together",
    },
  },
  {
    id: "plate-front-raise",
    movementId: "front-raise",
    name: "Plate front raise",
    aliases: ["Front raises (Plate)"],
    facets: { implement: "plate", posture: "standing" },
  },
  {
    id: "steering-wheel-front-raise",
    movementId: "front-raise",
    name: "Steering wheel front raise",
    aliases: ["Front raises (Steering wheels)"],
    facets: { implement: "plate", posture: "standing" },
  },
  {
    id: "spider-bench-front-raise",
    movementId: "front-raise",
    name: "Spider bench front raise (overhand)",
    aliases: ["Spider bench front raises (Overhand)"],
    facets: { implement: "dumbbell", posture: "spider", grip: "pronated" },
  },
  {
    id: "incline-dumbbell-front-raise",
    movementId: "front-raise",
    name: "Incline dumbbell front raise",
    facets: { implement: "dumbbell", posture: "incline" },
    notes:
      '"Ladder" is a within-set protocol, not part of the exercise — one rep is three: a low partial, a mid, then a full-range raise. It now lives in `modifiers` on the prescription.',
  },
  {
    id: "bent-over-dumbbell-rear-delt-raise",
    movementId: "rear-delt-fly",
    name: "Bent-over dumbbell rear delt raise (overhand)",
    aliases: ["Bent over db lateral raise (Overhand)"],
    facets: { implement: "dumbbell", posture: "bent-over", grip: "pronated" },
  },
  {
    id: "seated-bent-over-rear-delt-raise",
    movementId: "rear-delt-fly",
    name: "Seated bent-over rear delt raise (overhand)",
    aliases: ["Seated bent over lateral raises (Overhand)", "Seated bent over lateral raised (Overhand)"],
    facets: { implement: "dumbbell", posture: "bent-over", grip: "pronated" },
  },
  {
    id: "reverse-fly-machine",
    movementId: "rear-delt-fly",
    name: "Reverse fly machine",
    facets: { implement: "machine", posture: "seated" },
  },
  {
    id: "cable-face-pull",
    movementId: "face-pull",
    name: "Cable face pull",
    aliases: ["Cable face pulls"],
    facets: { implement: "cable", attachment: "rope" },
  },

  // ── Shoulders/traps: upright row & shrugs ──────────────────────────────
  {
    id: "barbell-upright-row",
    movementId: "upright-row",
    name: "Standing barbell upright row",
    aliases: ["Standing barbell upright rows"],
    facets: { implement: "barbell", posture: "standing" },
  },
  {
    id: "barbell-shrug",
    movementId: "shrug",
    name: "Standing barbell shrug",
    aliases: ["Standing barbell shrugs", "Standing barbell upright shrugs"],
    facets: { implement: "barbell", posture: "standing" },
    notes:
      '"Standing barbell upright shrugs" is a shrug, confirmed — despite the parallel Big Wheels slot being an upright row.',
  },
  {
    id: "dumbbell-shrug",
    movementId: "shrug",
    name: "Dumbbell shrug",
    aliases: ["Db shrugs"],
    facets: { implement: "dumbbell", posture: "standing" },
  },
  {
    id: "smith-shrug",
    movementId: "shrug",
    name: "Smith machine shrug",
    aliases: ["Smith machine shoulder shrugs"],
    facets: { implement: "smith", posture: "standing" },
  },

  // ── Biceps ─────────────────────────────────────────────────────────────
  {
    id: "standing-barbell-curl",
    movementId: "barbell-curl",
    name: "Standing barbell curl",
    aliases: ["Standing barbell curls"],
    facets: { implement: "barbell", posture: "standing", grip: "supinated" },
    notes:
      "Negatives/forced reps/partials are set modifiers — they now live in `modifiers` on the prescription.",
  },
  {
    id: "standing-ez-bar-curl",
    movementId: "barbell-curl",
    name: "Standing EZ-bar curl",
    aliases: ["Standing EZ-bar curls"],
    facets: { implement: "ez-bar", posture: "standing", grip: "supinated" },
  },
  {
    id: "ez-bar-reverse-curl",
    movementId: "barbell-curl",
    name: "Standing EZ-bar reverse curl",
    aliases: ["Standing EZ-bar reverse curls"],
    facets: { implement: "ez-bar", posture: "standing", grip: "pronated" },
    muscleOverride: {
      primaryMuscles: ["forearms"],
      secondaryMuscles: ["biceps"],
    },
  },
  {
    id: "standing-dumbbell-curl",
    movementId: "dumbbell-curl",
    name: "Standing dumbbell curl",
    aliases: ["Standing db bicep curls"],
    facets: { implement: "dumbbell", posture: "standing", grip: "supinated" },
    notes: "Static holds is a set modifier — now lives in `modifiers` on the prescription.",
  },
  {
    id: "standing-dumbbell-curl-together",
    movementId: "dumbbell-curl",
    name: "Standing dumbbell curl (arms together)",
    aliases: ["Standing db bicep curls (Arms together)", "Standing db bicep curls together"],
    facets: {
      implement: "dumbbell",
      posture: "standing",
      grip: "supinated",
      orientation: "arms-together",
    },
  },
  {
    id: "alternating-dumbbell-curl",
    movementId: "dumbbell-curl",
    name: "Alternating dumbbell curl",
    aliases: ["Db alternating curl", "Db alternating curls", "Db curls (Alternating)", "Standing db curls (Alternating)"],
    facets: {
      implement: "dumbbell",
      posture: "standing",
      grip: "supinated",
      laterality: "alternating",
    },
  },
  {
    id: "spider-bench-dumbbell-curl",
    movementId: "dumbbell-curl",
    name: "Spider bench dumbbell curl",
    aliases: ["Spider bench db curls"],
    facets: { implement: "dumbbell", posture: "spider", grip: "supinated" },
  },
  {
    id: "waiter-curl",
    movementId: "dumbbell-curl",
    name: "Waiter curl",
    aliases: ["Waiter curls"],
    facets: { implement: "dumbbell", posture: "standing" },
  },
  {
    id: "standing-hammer-curl",
    movementId: "hammer-curl",
    name: "Standing hammer curl",
    aliases: ["Standing hammer curls"],
    facets: { implement: "dumbbell", posture: "standing", grip: "neutral" },
  },
  {
    id: "alternating-hammer-curl",
    movementId: "hammer-curl",
    name: "Alternating hammer curl",
    aliases: ["Db hammer curls (Alternating)"],
    facets: {
      implement: "dumbbell",
      posture: "standing",
      grip: "neutral",
      laterality: "alternating",
    },
  },
  {
    id: "rope-hammer-curl",
    movementId: "hammer-curl",
    name: "Rope hammer curl",
    aliases: ["Rope hammer curls"],
    facets: { implement: "cable", attachment: "rope", grip: "neutral" },
  },
  {
    id: "incline-hammer-curl",
    movementId: "hammer-curl",
    name: "Incline hammer curl",
    aliases: ["Incline hammer curl with db"],
    facets: { implement: "dumbbell", posture: "incline", grip: "neutral" },
  },
  {
    id: "machine-preacher-curl",
    movementId: "preacher-curl",
    name: "Machine preacher curl",
    aliases: ["Machine preacher curls"],
    facets: { implement: "machine", posture: "seated" },
    notes: "Negatives is a set modifier — now lives in `modifiers` on the prescription.",
  },
  {
    id: "single-arm-machine-preacher-curl",
    movementId: "preacher-curl",
    name: "Single-arm machine preacher curl",
    aliases: ["Single arm machine preacher curls"],
    facets: {
      implement: "machine",
      posture: "seated",
      laterality: "unilateral",
    },
  },
  {
    id: "ez-bar-preacher-curl",
    movementId: "preacher-curl",
    name: "EZ-bar preacher curl",
    aliases: ["Preacher curl EZ-bar"],
    facets: { implement: "ez-bar", posture: "seated", grip: "supinated" },
  },
  {
    id: "low-cable-curl-straight-bar",
    movementId: "cable-curl",
    name: "Low cable curl (straight bar)",
    aliases: ["Low cable curls (Straight bar)"],
    facets: {
      implement: "cable",
      attachment: "straight-bar",
      grip: "supinated",
      pulleyHeight: "low",
    },
  },
  {
    id: "incline-cable-curl",
    movementId: "cable-curl",
    name: "Standing incline cable curl",
    aliases: ["Standing incline cable curls"],
    facets: { implement: "cable", posture: "standing" },
  },
  {
    id: "front-double-bicep-cable-curl",
    movementId: "cable-curl",
    name: "Front double bicep cable curl",
    aliases: ["Front double bicep cable curls"],
    facets: { implement: "cable", posture: "standing" },
  },

  // ── Triceps ────────────────────────────────────────────────────────────
  {
    id: "rope-pushdown",
    movementId: "triceps-pushdown",
    name: "Rope triceps pushdown",
    aliases: ["Cable tricep pushdowns (Rope)", "Cable pushdowns (Rope)"],
    facets: { implement: "cable", attachment: "rope", grip: "neutral" },
  },
  {
    id: "cable-pushdown",
    movementId: "triceps-pushdown",
    name: "Cable triceps pushdown",
    aliases: ["Cable tricep pushdowns"],
    facets: { implement: "cable" },
    notes:
      "Attachment unspecified in the source — deliberately distinct from `straight-bar-pushdown`, which the docs name explicitly.",
  },
  {
    id: "straight-bar-pushdown",
    movementId: "triceps-pushdown",
    name: "Straight-bar triceps pushdown",
    facets: { implement: "cable", attachment: "straight-bar" },
    notes:
      'Prescribed only as the other half of the "Cable cambered bar pushdowns/ straight bar" either/or.',
  },
  {
    id: "cambered-bar-pushdown",
    movementId: "triceps-pushdown",
    name: "Cambered-bar triceps pushdown",
    aliases: ["Cable cambered bar pushdown", "Cable cambered bar pushdowns"],
    facets: { implement: "cable", attachment: "cambered-bar" },
    notes:
      'The source writes "Cable cambered bar pushdowns/ straight bar" — an either/or with a straight-bar pushdown, held in `orAlternatives` on the entry.',
  },
  {
    id: "reverse-grip-pushdown",
    movementId: "triceps-pushdown",
    name: "Reverse-grip pushdown",
    aliases: ["Cable reverse pushdown", "Cable reverse pushdowns"],
    facets: { implement: "cable", grip: "supinated" },
  },
  {
    id: "single-arm-reverse-pushdown",
    movementId: "triceps-pushdown",
    name: "Single-arm reverse-grip pushdown",
    aliases: ["Cable single arm reverse pushdown"],
    facets: {
      implement: "cable",
      attachment: "single-handle",
      grip: "supinated",
      laterality: "unilateral",
    },
  },
  {
    id: "ez-bar-skull-crusher",
    movementId: "skull-crusher",
    name: "EZ-bar skull crusher",
    aliases: ["EZ bar skull crushers"],
    facets: { implement: "ez-bar", posture: "lying" },
  },
  {
    id: "dumbbell-skull-crusher",
    movementId: "skull-crusher",
    name: "Dumbbell skull crusher",
    aliases: ["Db skull crushers"],
    facets: { implement: "dumbbell", posture: "lying" },
  },
  {
    id: "rope-overhead-extension",
    movementId: "overhead-triceps-extension",
    name: "Rope overhead triceps extension",
    aliases: ["Overhead tricep extension (Rope)", "Overhead tricep extensions rope"],
    facets: { implement: "cable", attachment: "rope" },
  },
  {
    id: "dumbbell-seated-overhead-extension",
    movementId: "overhead-triceps-extension",
    name: "Seated dumbbell overhead extension",
    aliases: ["Db seated overhead extension"],
    facets: { implement: "dumbbell", posture: "seated" },
  },
  {
    id: "single-arm-dumbbell-overhead-extension",
    movementId: "overhead-triceps-extension",
    name: "Single-arm seated dumbbell overhead extension",
    aliases: ["Db seated overhead extension (single arm)"],
    facets: {
      implement: "dumbbell",
      posture: "seated",
      laterality: "unilateral",
    },
  },
  {
    id: "dumbbell-kickback",
    movementId: "triceps-kickback",
    name: "Dumbbell kickback (palms down)",
    aliases: ["Db kickback palms down"],
    facets: {
      implement: "dumbbell",
      posture: "bent-over",
      orientation: "palms-down",
    },
  },
  {
    id: "dumbbell-kickback-pinky-up",
    movementId: "triceps-kickback",
    name: "Dumbbell kickback (pinky up)",
    aliases: ["Db kickback (Pinky up)"],
    facets: {
      implement: "dumbbell",
      posture: "bent-over",
      orientation: "pinky-up",
    },
  },

  // ── Legs: squat patterns ───────────────────────────────────────────────
  {
    id: "back-squat",
    movementId: "squat",
    name: "Barbell back squat",
    aliases: ["Barbell squat"],
    facets: { implement: "barbell", stance: "shoulder" },
  },
  {
    id: "front-squat",
    movementId: "squat",
    name: "Front barbell squat",
    facets: { implement: "barbell", stance: "shoulder" },
  },
  {
    id: "dumbbell-squat",
    movementId: "squat",
    name: "Dumbbell squat",
    aliases: ["Db squats"],
    facets: { implement: "dumbbell" },
  },
  {
    id: "smith-machine-squat",
    movementId: "squat",
    name: "Smith machine squat",
    facets: { implement: "smith" },
    notes:
      'The source writes "Smith machine/Hack squat" — an either/or, and the smith squat is the one named first, so it is the primary with `hack-squat` as the alternative.',
  },
  {
    id: "power-squat-machine",
    movementId: "squat",
    name: "Power squat machine",
    aliases: ["Power squat super squat"],
    facets: { implement: "machine" },
  },
  {
    id: "hack-squat",
    movementId: "hack-squat",
    name: "Hack squat",
    facets: { implement: "machine", stance: "shoulder" },
  },
  {
    id: "hack-squat-narrow",
    movementId: "hack-squat",
    name: "Hack squat (narrow stance)",
    aliases: ["Hack squat (Narrow)", "Hack squats (Narrow)"],
    facets: { implement: "machine", stance: "narrow" },
  },
  {
    id: "hack-squat-sumo",
    movementId: "hack-squat",
    name: "Hack squat (sumo stance)",
    aliases: ["Hack squat sumo"],
    facets: { implement: "machine", stance: "sumo" },
  },
  {
    id: "leg-press-45",
    movementId: "leg-press",
    name: "45° leg press",
    facets: { implement: "machine", angleDegrees: 45 },
  },

  // ── Legs: isolation ────────────────────────────────────────────────────
  {
    id: "leg-extension",
    movementId: "leg-extension",
    name: "Leg extension",
    facets: { implement: "machine", posture: "seated" },
    notes: "Partials is a set modifier — now lives in `modifiers` on the prescription.",
  },
  {
    id: "leg-extension-toes-pointed",
    movementId: "leg-extension",
    name: "Leg extension (toes pointed)",
    facets: {
      implement: "machine",
      posture: "seated",
      orientation: "toes-pointed",
    },
  },
  {
    id: "walking-lunge",
    movementId: "lunge",
    name: "Walking lunge",
    aliases: ["Walking lunges"],
    facets: { implement: "bodyweight", laterality: "alternating" },
  },
  {
    id: "alternating-dumbbell-lunge",
    movementId: "lunge",
    name: "Alternating dumbbell lunge",
    aliases: ["Alternating db lunges"],
    facets: { implement: "dumbbell", laterality: "alternating" },
  },
  {
    id: "smith-bulgarian-split-squat",
    movementId: "split-squat",
    name: "Smith machine Bulgarian split squat",
    aliases: ["Smith machine BSS"],
    facets: {
      implement: "smith",
      stance: "staggered",
      laterality: "unilateral",
    },
  },
  {
    id: "lying-leg-curl",
    movementId: "leg-curl",
    name: "Lying leg curl",
    aliases: ["Lying leg curls"],
    facets: { implement: "machine", posture: "lying" },
  },
  {
    id: "seated-leg-curl",
    movementId: "leg-curl",
    name: "Seated leg curl",
    aliases: ["Seated leg curls"],
    facets: { implement: "machine", posture: "seated" },
  },
  {
    id: "standing-single-leg-curl",
    movementId: "leg-curl",
    name: "Standing single leg curl",
    facets: {
      implement: "machine",
      posture: "standing",
      stance: "single-leg",
      laterality: "unilateral",
    },
  },
  {
    id: "dumbbell-stiff-leg-deadlift",
    movementId: "romanian-deadlift",
    name: "Dumbbell straight-leg deadlift",
    aliases: ["Db straight leg deadlift"],
    facets: { implement: "dumbbell", posture: "standing" },
  },

  // ── Calves ─────────────────────────────────────────────────────────────
  {
    id: "standing-calf-raise",
    movementId: "calf-raise",
    name: "Standing calf raise",
    facets: { implement: "machine", posture: "standing" },
  },
  {
    id: "seated-calf-raise",
    movementId: "calf-raise",
    name: "Seated calf raise",
    facets: { implement: "machine", posture: "seated" },
  },
  {
    id: "calf-extension-toes-in",
    movementId: "calf-raise",
    name: "Calf extension machine (toes in)",
    facets: { implement: "machine", orientation: "toes-in" },
  },
  {
    id: "calf-extension-toes-out",
    movementId: "calf-raise",
    name: "Calf extension machine (toes out)",
    facets: { implement: "machine", orientation: "toes-out" },
  },

  // ── Conditioning ───────────────────────────────────────────────────────
  {
    id: "liss-cardio",
    movementId: "steady-state-cardio",
    name: "Low-intensity steady-state cardio",
    aliases: ["Low-intensity cardio"],
    facets: {},
  },
];

export const exercises: Exercise[] = raw.map((e) => exerciseSchema.parse(e));
