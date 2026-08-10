import { describe, expect, it } from "vitest";
import { KG_PLATES, LB_PLATES, defaultInventory } from "./equipment";
import { solveLoading, weightOf } from "./solve";

/** How many plates go on one side, across all denominations. */
function totalPlates(result: ReturnType<typeof solveLoading>): number {
  if (!result.ok) return -1;
  return result.loading.perSide.reduce((sum, entry) => sum + entry.pairs, 0);
}

/** Pairs of one denomination in the answer. */
function pairsOf(
  result: ReturnType<typeof solveLoading>,
  weight: number,
): number {
  if (!result.ok) return -1;
  return (
    result.loading.perSide.find((entry) => entry.plate.weight === weight)
      ?.pairs ?? 0
  );
}

/** Compact "25x2, 5x1" for readable assertions. */
function shape(result: ReturnType<typeof solveLoading>): string {
  if (!result.ok) return `failed:${result.reason}`;
  return result.loading.perSide
    .map((entry) => `${entry.plate.weight}x${entry.pairs}`)
    .join(", ");
}

/** Every denomination, plenty of it. */
const wellStocked: Record<string, number> = Object.fromEntries(
  KG_PLATES.map((plate) => [String(plate.weight), 10]),
);

describe("solveLoading", () => {
  it("loads a bare bar as nothing", () => {
    const result = solveLoading(20, 20, KG_PLATES, wellStocked);

    expect(shape(result)).toBe("");
    expect(result.ok && result.loading.totalWeight).toBe(20);
  });

  it("splits the load across both ends", () => {
    const result = solveLoading(100, 20, KG_PLATES, wellStocked);

    // 40 a side, not 80, and in as few discs as 40 can be made.
    expect(shape(result)).toBe("20x2");
    expect(result.ok && result.loading.totalWeight).toBe(100);
  });

  it("uses the fewest plates that reach the weight", () => {
    // 50 a side has one two-disc answer and a pile of longer ones.
    expect(shape(solveLoading(120, 20, KG_PLATES, wellStocked))).toBe("25x2");

    // 60 a side ties at three — 25+25+10 and 20+20+20 — so only the count is
    // pinned. What matters is that it never walks down to six 10s.
    expect(totalPlates(solveLoading(140, 20, KG_PLATES, wellStocked))).toBe(3);
  });

  it("reaches decimal targets without float drift", () => {
    const result = solveLoading(47.5, 20, KG_PLATES, wellStocked);

    expect(result.ok && result.loading.totalWeight).toBe(47.5);
    expect(result.ok && result.loading.shortBy).toBe(0);
  });

  it("refuses a target under the bar", () => {
    const result = solveLoading(15, 20, KG_PLATES, wellStocked);

    expect(result.ok).toBe(false);
  });

  it("respects how many pairs the rack has", () => {
    const twoTwenties = { ...wellStocked, "25": 0, "20": 2 };
    const result = solveLoading(120, 20, KG_PLATES, twoTwenties);

    // 50 a side with only two 20 pairs on the rack. Several three-disc
    // loadings tie here, so what matters is that it lands exactly and never
    // asks for a third 20.
    expect(result.ok && result.loading.totalWeight).toBe(120);
    expect(totalPlates(result)).toBe(3);
    expect(pairsOf(result, 20)).toBeLessThanOrEqual(2);
  });

  it("finds an exact answer a greedy pass would miss", () => {
    // 13.75 a side with no 10s. Greedy takes 5+5+2.5 and stalls at 45kg;
    // 5+5+2.5+1.25 is exact and this has to find it.
    const noTens = { "25": 0, "20": 0, "15": 0, "10": 0, "5": 2, "2.5": 2, "1.25": 2 };
    const result = solveLoading(47.5, 20, KG_PLATES, noTens);

    expect(result.ok && result.loading.totalWeight).toBe(47.5);
    expect(result.ok && result.loading.isApproximate).toBe(false);
    expect(shape(result)).toBe("5x2, 2.5x1, 1.25x1");
  });

  it("comes as close as it can when the target is unreachable", () => {
    const onlyTwenties = { "20": 2 };
    const result = solveLoading(75, 20, KG_PLATES, onlyTwenties);

    expect(result.ok && result.loading.totalWeight).toBe(60);
    expect(result.ok && result.loading.shortBy).toBe(15);
    expect(result.ok && result.loading.isApproximate).toBe(true);
  });

  it("never overshoots the target", () => {
    for (const target of [42.5, 61.25, 103, 147.5, 200]) {
      const result = solveLoading(target, 20, KG_PLATES, defaultInventory("kg"));
      expect(result.ok && result.loading.totalWeight).toBeLessThanOrEqual(target);
    }
  });

  it("reports an empty rack honestly rather than pretending", () => {
    const result = solveLoading(100, 20, KG_PLATES, {});

    expect(shape(result)).toBe("");
    expect(result.ok && result.loading.totalWeight).toBe(20);
    expect(result.ok && result.loading.isApproximate).toBe(true);
    expect(result.ok && result.loading.shortBy).toBe(80);
  });

  it("ignores a half pair, since one plate can't be loaded symmetrically", () => {
    const oddOne = { "25": 0.5, "20": 1 };
    const result = solveLoading(100, 20, KG_PLATES, oddOne);

    expect(shape(result)).toBe("20x1");
  });

  it("works in pounds too", () => {
    const result = solveLoading(225, 45, LB_PLATES, defaultInventory("lb"));

    expect(shape(result)).toBe("45x2");
    expect(result.ok && result.loading.totalWeight).toBe(225);
  });
});

describe("weightOf", () => {
  it("adds a hand-picked loading back up", () => {
    const twentyFive = KG_PLATES[0]!;
    const twoAndAHalf = KG_PLATES[5]!;

    expect(
      weightOf(
        [
          { plate: twentyFive, pairs: 2 },
          { plate: twoAndAHalf, pairs: 1 },
        ],
        20,
      ),
    ).toBe(125);
  });

  it("is the inverse of solving", () => {
    const result = solveLoading(142.5, 20, KG_PLATES, wellStocked);

    expect(result.ok && weightOf(result.loading.perSide, 20)).toBe(142.5);
  });

  it("is just the bar with nothing on it", () => {
    expect(weightOf([], 15)).toBe(15);
  });
});
