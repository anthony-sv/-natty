import { describe, expect, it } from "vitest";
import { routines } from "@/data/routines";
import type { Routine } from "@/data/routines";
import { overrides } from "./use-routines";

const BUILT_IN = routines[0]!.slug;

function routine(slug: string): Routine {
  return {
    slug,
    name: "whatever",
    weeks: [{ weekNumber: 1, days: [] }],
  };
}

/**
 * A routine you saved at a built-in's slug replaces it rather than joining it.
 *
 * That collision is the whole mechanism — `slugFor` exists to *avoid* it for
 * genuinely new routines, and `saveBuiltInOverride` deliberately bypasses it.
 * Get this wrong in either direction and you either see two "Bulking Plan"s or
 * you see the shipped one instead of your edit.
 */
describe("overriding a built-in", () => {
  it("marks a built-in you've saved over", () => {
    expect([...overrides([routine(BUILT_IN)])]).toEqual([BUILT_IN]);
  });

  it("leaves the other built-ins alone", () => {
    const replaced = overrides([routine(BUILT_IN)]);

    for (const other of routines.slice(1)) {
      expect(replaced.has(other.slug)).toBe(false);
    }
  });

  it("says nothing about a routine you wrote from scratch", () => {
    // `slugFor` appends a random suffix precisely so this can't collide.
    expect([...overrides([routine("push-day-a1b2c3")])]).toEqual([]);
  });

  it("has nothing to override when you've written nothing", () => {
    expect([...overrides([])]).toEqual([]);
  });

  it("hides exactly the built-ins that were overridden", () => {
    const mine = [routine(BUILT_IN), routine("my-own-x9y8z7")];
    const replaced = overrides(mine);
    const visible = [
      ...mine,
      ...routines.filter((r) => !replaced.has(r.slug)),
    ];

    // One entry per slug: the override stands in for the built-in rather than
    // appearing beside it under the same name.
    const slugs = visible.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain(BUILT_IN);
    expect(visible.length).toBe(routines.length + 1);
  });
});
