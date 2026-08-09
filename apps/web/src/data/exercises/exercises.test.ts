import { describe, expect, it } from "vitest";
import { normalizeName } from "@/data/normalize";
import { routines } from "@/data/routines";
import { warmupSections } from "@/data/routines";
import { exercises } from "./exercises";
import { movements } from "./movements";
import {
  exercisesNeedingReview,
  getExercise,
  resolveExerciseName,
} from "./resolve";

/** Every exercise entry prescribed by any routine, flattened. */
function allRoutineEntries() {
  return routines.flatMap((r) =>
    r.weeks.flatMap((w) => w.days.flatMap((d) => d.exercises)),
  );
}

describe("exercise library integrity", () => {
  it("gives every exercise a unique id", () => {
    const ids = exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every exercise at a movement that exists", () => {
    const movementIds = new Set(movements.map((m) => m.id));
    const orphans = exercises
      .filter((e) => !movementIds.has(e.movementId))
      .map((e) => `${e.id} -> ${e.movementId}`);
    expect(orphans).toEqual([]);
  });

  it("has no movement without at least one exercise", () => {
    const used = new Set(exercises.map((e) => e.movementId));
    const unused = movements.filter((m) => !used.has(m.id)).map((m) => m.id);
    expect(unused).toEqual([]);
  });

  it("never lets two exercises claim the same name", () => {
    const claims = new Map<string, string>();
    const collisions: string[] = [];
    for (const exercise of exercises) {
      for (const spelling of [exercise.name, ...exercise.aliases]) {
        const key = normalizeName(spelling);
        const owner = claims.get(key);
        if (owner && owner !== exercise.id) {
          collisions.push(`"${spelling}": ${owner} vs ${exercise.id}`);
        }
        claims.set(key, exercise.id);
      }
    }
    expect(collisions).toEqual([]);
  });

  it("carries no alias that only restates the name or another alias", () => {
    const redundant: string[] = [];
    for (const exercise of exercises) {
      const seen = new Set([normalizeName(exercise.name)]);
      for (const alias of exercise.aliases) {
        const key = normalizeName(alias);
        if (seen.has(key)) {
          redundant.push(`${exercise.id}: "${alias}"`);
        }
        seen.add(key);
      }
    }
    expect(redundant).toEqual([]);
  });
});

describe("routine coverage", () => {
  it("points every routine entry at an exercise that exists", () => {
    // authoring.ts throws on an unknown name, so a break here means an id was
    // renamed in the library without the alias following it.
    const ids = new Set(exercises.map((e) => e.id));
    const dangling = [
      ...new Set(
        allRoutineEntries()
          .map((e) => e.exerciseId)
          .filter((id) => !ids.has(id)),
      ),
    ];
    expect(dangling).toEqual([]);
  });

  it("gives every routine entry a display name", () => {
    const blank = allRoutineEntries().filter(
      (e) => !getExercise(e.exerciseId)?.name,
    );
    expect(blank).toEqual([]);
  });

  it("points every alternative at an exercise that exists", () => {
    const ids = new Set(exercises.map((e) => e.id));
    const dangling = allRoutineEntries()
      .flatMap((e) => e.orAlternatives)
      .filter((id) => !ids.has(id));
    expect([...new Set(dangling)]).toEqual([]);
  });

  it("never lists an exercise as its own alternative", () => {
    const selfRef = allRoutineEntries()
      .filter((e) => e.orAlternatives.includes(e.exerciseId))
      .map((e) => e.exerciseId);
    expect([...new Set(selfRef)]).toEqual([]);
  });

  it("keeps warmup moves out of the library, bar the known overlaps", () => {
    // Warmup moves are deliberately not in the library yet. A few share a name
    // with a working exercise and so resolve anyway; that set is pinned here so
    // bringing warmups in properly is a conscious change, not a surprise.
    const warmupNames = new Set(
      warmupSections.flatMap((s) => s.moves.map((m) => m.name)),
    );
    const resolved = [...warmupNames]
      .filter((name) => resolveExerciseName(name))
      .sort();
    expect(resolved).toEqual(["Walking lunges"]);
  });

  it("reaches most of the library — unused entries are deliberate", () => {
    const used = new Set(allRoutineEntries().map((e) => e.exerciseId));
    const unused = exercises
      .filter((e) => !used.has(e.id))
      .map((e) => e.id)
      .sort();
    // Reached only as the other half of "Cable cambered bar pushdowns/ straight
    // bar", i.e. via orAlternatives rather than as an entry's own exerciseId.
    expect(unused).toEqual(["straight-bar-pushdown"]);
  });
});

describe("name matching", () => {
  it("ignores case, punctuation and spacing", () => {
    const variants = [
      "Lat pulldown (Wide grip)",
      "lat pulldown wide grip",
      "LAT PULLDOWN - WIDE GRIP",
      "Lat  pulldown   (wide   grip)",
    ];
    for (const variant of variants) {
      expect(resolveExerciseName(variant)?.id).toBe("lat-pulldown-wide");
    }
  });

  it("keeps distinct variants of one movement apart", () => {
    expect(resolveExerciseName("Lat pulldown wide")?.id).toBe(
      "lat-pulldown-wide",
    );
    expect(resolveExerciseName("Lat pulldown close grip")?.id).toBe(
      "lat-pulldown-close",
    );
    expect(resolveExerciseName("Lat pulldown (Reverse grip)")?.id).toBe(
      "lat-pulldown-reverse",
    );
  });

  it("returns undefined for something it has never seen", () => {
    expect(resolveExerciseName("Zercher good morning")).toBeUndefined();
  });
});

describe("review queue", () => {
  it("has no mapping left awaiting a decision", () => {
    // All ten original ambiguities were settled — four against the source docs
    // in gym-docs/, six by the author. A new one must be
    // acknowledged here rather than joining a pile unnoticed.
    expect(exercisesNeedingReview().map((e) => e.id)).toEqual([]);
  });

  it("refuses the spellings whose wording encodes a technique", () => {
    // These now live on `modifiers`/`orAlternatives`. Admitting them as aliases
    // would let a routine restate a technique in the name without modelling it,
    // so resolution must fail and push the author to the plain name.
    const retired = [
      "Barbell curls (Negative/Forced reps/Partials)",
      "Cable cambered bar pushdowns/straight bar",
      "Cable fly ladders",
      "Db incline front raise ladder",
      "Db incline intense variations",
      "Db seated lateral raise (Forced reps/negatives/partials)",
      "Db seated lateral variations",
      "Db shoulder press/machine",
      "Leg extension (Partials)",
      "Machine preacher curls (Negatives)",
      "Smith machine shoulder press (Forced reps)",
      "Smith machine/Hack squat",
      "Standing db curls (Static holds)",
    ];
    const stillResolving = retired.filter((n) => resolveExerciseName(n));
    expect(stillResolving).toEqual([]);
  });

  it("explains every entry it flags", () => {
    const unexplained = exercisesNeedingReview()
      .filter((e) => !e.notes)
      .map((e) => e.id);
    expect(unexplained).toEqual([]);
  });
});

describe("modifiers and alternatives", () => {
  it("prescribes every modelled technique somewhere", () => {
    // Guards against a technique surviving in the schema but nowhere in the
    // data — which would mean it got dropped in a rewrite rather than modelled.
    const seen = new Set<string>();
    for (const entry of allRoutineEntries()) {
      for (const p of entry.prescriptions) {
        for (const key of Object.keys(p.modifiers ?? {})) seen.add(key);
      }
    }
    expect([...seen].sort()).toEqual([
      "forcedReps",
      "ladder",
      "negatives",
      "partials",
      "staticHolds",
    ]);
  });

  it("records the either/or substitutions from the source docs", () => {
    const pairs = [
      ...new Set(
        allRoutineEntries()
          .filter((e) => e.orAlternatives.length > 0)
          .map((e) => `${e.exerciseId} or ${e.orAlternatives.join("/")}`),
      ),
    ].sort();
    expect(pairs).toEqual([
      "cambered-bar-pushdown or straight-bar-pushdown",
      "dumbbell-shoulder-press or machine-shoulder-press-neutral",
      "smith-machine-squat or hack-squat",
    ]);
  });
});
