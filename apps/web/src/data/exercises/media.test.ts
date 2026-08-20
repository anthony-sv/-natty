import { describe, expect, it } from "vitest";
import { getExercise } from "./resolve";
import { EXERCISE_MEDIA } from "./media";

describe("EXERCISE_MEDIA", () => {
  it("every key resolves to a real exercise", () => {
    // The same discipline `exercises.test.ts` applies to aliases — a rename
    // or removal that left an orphaned media entry fails here rather than
    // quietly serving media nobody can reach through the app.
    const orphaned = Object.keys(EXERCISE_MEDIA).filter(
      (id) => getExercise(id) === undefined,
    );
    expect(orphaned).toEqual([]);
  });

  it("every entry has two distinct, well-formed frame paths", () => {
    for (const [id, entry] of Object.entries(EXERCISE_MEDIA)) {
      expect(entry.frames, id).toHaveLength(2);
      const [first, second] = entry.frames;
      expect(first, id).toMatch(/^\/exercises\/.+\/0\.webp$/);
      expect(second, id).toMatch(/^\/exercises\/.+\/1\.webp$/);
      expect(first, id).not.toBe(second);
    }
  });

  it("keys every frame path off the entry's own sourceId", () => {
    for (const [id, entry] of Object.entries(EXERCISE_MEDIA)) {
      for (const frame of entry.frames) {
        expect(frame, id).toContain(`/exercises/${entry.sourceId}/`);
      }
    }
  });

  it("pins coverage, so a mapping silently lost in a refactor fails here", () => {
    // Not a target to hit — a floor that only moves on a deliberate re-run of
    // `tools/apply-exercise-media.mjs` followed by updating this number.
    expect(Object.keys(EXERCISE_MEDIA).length).toBe(78);
  });
});
