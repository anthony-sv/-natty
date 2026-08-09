import { describe, expect, it } from "vitest";
import { normalizeName } from "./normalize";
import { getPose, poses, resolvePoseName } from "./poses";
import { routines } from "./routines";

/** Every pose cue prescribed by any routine. */
function allPoseCues() {
  return routines.flatMap((r) =>
    r.weeks.flatMap((w) =>
      w.days.flatMap((d) =>
        d.exercises.flatMap((e) =>
          e.prescriptions.map((p) => p.pose).filter((p) => p !== undefined),
        ),
      ),
    ),
  );
}

describe("pose vocabulary", () => {
  it("is the eight classic mandatory poses", () => {
    expect(poses.map((p) => p.id).sort()).toEqual([
      "back-double-biceps",
      "front-double-biceps",
      "front-lat-spread",
      "most-muscular",
      "quad-flex",
      "rear-lat-spread",
      "side-chest",
      "side-triceps",
    ]);
  });

  it("carries no alias that only restates the name", () => {
    const redundant: string[] = [];
    for (const pose of poses) {
      const seen = new Set([normalizeName(pose.name)]);
      for (const alias of pose.aliases) {
        const key = normalizeName(alias);
        if (seen.has(key)) redundant.push(`${pose.id}: "${alias}"`);
        seen.add(key);
      }
    }
    expect(redundant).toEqual([]);
  });

  it("explains every alias it collapses", () => {
    const unexplained = poses
      .filter((p) => p.aliases.length > 0 && !p.notes)
      .map((p) => p.id);
    expect(unexplained).toEqual([]);
  });
});

describe("pose matching", () => {
  it("collapses the source docs' duplicate spellings", () => {
    // Both confirmed against gym-docs: the same finisher is written each way in
    // different weeks.
    expect(resolvePoseName("quad")?.id).toBe("quad-flex");
    expect(resolvePoseName("Quad flex")?.id).toBe("quad-flex");
    expect(resolvePoseName("double biceps")?.id).toBe("back-double-biceps");
    expect(resolvePoseName("Back double biceps")?.id).toBe("back-double-biceps");
    expect(resolvePoseName("side tricep")?.id).toBe("side-triceps");
  });

  it("keeps the front and back double biceps apart", () => {
    expect(resolvePoseName("front double biceps")?.id).toBe(
      "front-double-biceps",
    );
    expect(resolvePoseName("back double biceps")?.id).toBe(
      "back-double-biceps",
    );
  });

  it("ignores case and punctuation", () => {
    expect(resolvePoseName("MOST  MUSCULAR")?.id).toBe("most-muscular");
    expect(resolvePoseName("front-lat-spread")?.id).toBe("front-lat-spread");
  });

  it("returns undefined for something it has never seen", () => {
    expect(resolvePoseName("vacuum")).toBeUndefined();
  });
});

describe("routine pose cues", () => {
  it("resolves every cue the routines prescribe", () => {
    const dangling = allPoseCues()
      .map((cue) => cue.poseId)
      .filter((id) => !getPose(id));
    expect([...new Set(dangling)]).toEqual([]);
  });

  it("holds every finisher for 10 seconds", () => {
    // The Bulking and Cutting docs state this on all 86 of their finisher
    // lines; the four per-muscle program docs omit it the way they omit the 7-set
    // count, so the convention fills it in.
    const holds = [...new Set(allPoseCues().map((cue) => cue.holdSeconds))];
    expect(holds).toEqual([10]);
  });

  it("attaches a pose to finisher sets and nothing else", () => {
    const misplaced = routines.flatMap((r) =>
      r.weeks.flatMap((w) =>
        w.days.flatMap((d) =>
          d.exercises
            .filter(
              (e) => e.prescriptions.some((p) => p.pose) !== e.isFinisher,
            )
            .map((e) => e.exerciseId),
        ),
      ),
    );
    expect([...new Set(misplaced)]).toEqual([]);
  });

  it("uses every pose in the vocabulary", () => {
    const used = new Set(allPoseCues().map((cue) => cue.poseId));
    const unused = poses.filter((p) => !used.has(p.id)).map((p) => p.id);
    expect(unused).toEqual([]);
  });
});
