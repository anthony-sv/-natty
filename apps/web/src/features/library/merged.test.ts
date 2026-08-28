import { describe, expect, it } from "vitest";
import { muscleSchema } from "@/data/exercises";
import { weeklyVolume } from "@/features/log/volume";
import { mergeLibrary } from "./merged";
import type { UserExercise } from "./schema";

/**
 * The merge layer is what makes a custom exercise a first-class one — it feeds
 * the anatomy that volume, the split chart and the gaps card all read. These
 * check the seams a custom row could fall through, not the flattening itself.
 */

function custom(overrides: Partial<UserExercise> = {}): UserExercise {
  return {
    id: "user:abc",
    name: "Reverse hyper",
    aliases: [],
    pattern: "hip-extension",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    createdAt: 0,
    ...overrides,
  };
}

describe("merging", () => {
  it("resolves a custom exercise by id and by name", () => {
    const library = mergeLibrary([custom()]);
    expect(library.byId("user:abc")?.name).toBe("Reverse hyper");
    expect(library.byName("reverse hyper")?.id).toBe("user:abc");
  });

  it("matches a name the way the built-in resolver does", () => {
    const library = mergeLibrary([custom({ aliases: ["Reverse hyperextension"] })]);
    // Case, punctuation and spacing all ignored — same `normalizeName`.
    expect(library.byName("REVERSE  HYPEREXTENSION")?.id).toBe("user:abc");
  });

  it("keeps the built-in library reachable alongside it", () => {
    const library = mergeLibrary([custom()]);
    expect(library.byId("flat-barbell-bench-press")?.isCustom).toBe(false);
    expect(library.byName("Barbell hip thrust")?.id).toBe("barbell-hip-thrust");
  });

  it("never lets a custom exercise shadow a built-in name", () => {
    // Otherwise naming your own lift "Hip thrust" would silently repoint an
    // authored routine's lookup at your row, and the built-in is the one with
    // the curation behind it.
    const library = mergeLibrary([
      custom({ id: "user:shadow", name: "Barbell hip thrust" }),
    ]);
    expect(library.byName("Barbell hip thrust")?.id).toBe("barbell-hip-thrust");
    // It still resolves by its own id, so its own logged sets read correctly.
    expect(library.byId("user:shadow")?.name).toBe("Barbell hip thrust");
  });
});

describe("archiving", () => {
  it("hides an archived exercise from the pickers but not from lookup", () => {
    const library = mergeLibrary([custom({ archivedAt: 123 })]);
    expect(library.selectable.some((e) => e.id === "user:abc")).toBe(false);
    // The whole point: sets already logged against it still render a name.
    expect(library.byId("user:abc")?.name).toBe("Reverse hyper");
    expect(library.all.some((e) => e.id === "user:abc")).toBe(true);
  });

  it("still counts an archived exercise's volume", () => {
    // Archiving is about what you can log *next*, not about rewriting history —
    // hiding its past sets would silently drop a muscle's weekly total.
    const library = mergeLibrary([custom({ archivedAt: 123 })]);
    const weeks = weeklyVolume(
      [
        {
          id: "s1",
          exerciseId: "user:abc",
          reps: 10,
          unit: "kg",
          performedAt: Date.UTC(2026, 0, 7, 12),
        },
      ],
      [],
      library.anatomy,
      { exercisesFor: () => undefined },
      Date.UTC(2026, 0, 7, 12),
    );
    expect(
      weeks.at(-1)?.muscles.find((m) => m.muscle === "glutes")?.directSets,
    ).toBe(1);
  });
});

describe("feeding the volume derivation", () => {
  it("gives a custom exercise its muscles and its split", () => {
    const library = mergeLibrary([custom()]);
    expect(library.anatomy.muscles("user:abc")).toEqual({
      primary: ["glutes"],
      secondary: ["hamstrings"],
    });
    expect(library.anatomy.pattern("user:abc")).toBe("hip-extension");
  });

  it("counts a custom exercise toward what's directly trainable", () => {
    // This used to assert that abs were *un*trainable without a custom
    // exercise, which stopped being true once the library gained crunches.
    // What it's really checking is that a custom row reaches
    // `trainableDirectly` at all — so it uses a muscle and an exercise the
    // built-ins genuinely don't have.
    const library = mergeLibrary([
      custom({
        id: "user:neck",
        name: "Neck curl",
        pattern: "spinal-flexion",
        primaryMuscles: ["traps"],
      }),
    ]);
    expect(library.byId("user:neck")).toBeDefined();
    expect(library.anatomy.muscles("user:neck").primary).toEqual(["traps"]);
    // And it lands in the set the gaps card reads.
    expect(library.trainableDirectly.has("traps")).toBe(true);
  });

  it("adds a custom exercise's pattern to its primary muscle's set, not its secondary one", () => {
    const library = mergeLibrary([custom()]);
    expect(library.patternsByMuscle.get("glutes")?.has("hip-extension")).toBe(
      true,
    );
    // Hamstrings is only secondary on this fixture — hip-extension shouldn't
    // land there even though hamstrings has other real patterns from the
    // built-in library (hinge, knee-flexion).
    expect(
      library.patternsByMuscle.get("hamstrings")?.has("hip-extension"),
    ).toBeFalsy();
  });

  it("returns nothing for an id from neither half", () => {
    const library = mergeLibrary([]);
    expect(library.byId("user:deleted")).toBeUndefined();
    expect(library.anatomy.muscles("user:deleted")).toEqual({
      primary: [],
      secondary: [],
    });
    expect(library.anatomy.pattern("user:deleted")).toBeUndefined();
  });

  it("only ever reports muscles the schema knows", () => {
    const library = mergeLibrary([custom()]);
    const known = new Set<string>(muscleSchema.options);
    for (const entry of library.all) {
      for (const muscle of [...entry.primaryMuscles, ...entry.secondaryMuscles]) {
        expect(known.has(muscle)).toBe(true);
      }
    }
  });
});
