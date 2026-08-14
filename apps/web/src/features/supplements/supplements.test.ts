import { describe, expect, it } from "vitest";
import { startOfDay } from "@/lib/week";
import type { IntakeEntry } from "@/features/intake/schema";
import { hasHistory, supplementDay, takenOn } from "./supplements";
import type { Supplement } from "./schema";

const DAY = startOfDay(Date.UTC(2026, 7, 14, 12));
const YESTERDAY = DAY - 24 * 60 * 60 * 1000;

function supplement(name: string, over: Partial<Supplement> = {}): Supplement {
  return {
    id: `supplement:${name}`,
    name,
    amount: 3,
    unit: "pill",
    createdAt: 0,
    ...over,
  };
}

function tick(id: string, day: number, entryId = `e-${id}-${day}`): IntakeEntry {
  return {
    id: entryId,
    day,
    source: { kind: "supplement", supplementId: id },
    loggedAt: day,
  };
}

describe("takenOn", () => {
  it("only counts the day asked for", () => {
    const entries = [tick("supplement:omega", YESTERDAY), tick("supplement:mag", DAY)];
    expect([...takenOn(entries, DAY).keys()]).toEqual(["supplement:mag"]);
  });

  it("ignores meals and items sharing the day", () => {
    const entries: IntakeEntry[] = [
      { id: "m", day: DAY, source: { kind: "meal", planSlug: "p", mealName: "Lunch", optionIndex: 0 }, loggedAt: DAY },
      { id: "i", day: DAY, source: { kind: "item", foodId: "food:x", amount: 100 }, loggedAt: DAY },
      tick("supplement:omega", DAY),
    ];
    expect([...takenOn(entries, DAY).keys()]).toEqual(["supplement:omega"]);
  });

  it("resolves a duplicate tick to one row", () => {
    // Two devices, one day. The list unticks the row it is showing rather
    // than leaving a second one behind.
    const entries = [
      tick("supplement:omega", DAY, "first"),
      tick("supplement:omega", DAY, "second"),
    ];
    expect(takenOn(entries, DAY).get("supplement:omega")).toBe("first");
  });
});

describe("supplementDay", () => {
  const stack = [supplement("Omega 3"), supplement("Magnesium", { amount: 2 })];

  it("lists the whole stack, ticked or not", () => {
    const day = supplementDay(stack, [tick("supplement:Omega 3", DAY)], DAY, "en");

    expect(day.rows.map((row) => row.supplement.name)).toEqual([
      "Magnesium",
      "Omega 3",
    ]);
    expect(day.rows.map((row) => row.taken)).toEqual([false, true]);
    expect(day.taken).toBe(1);
    expect(day.total).toBe(2);
  });

  it("carries the entry id, so a row can untick itself", () => {
    const day = supplementDay(stack, [tick("supplement:Omega 3", DAY, "x")], DAY, "en");
    expect(day.rows.find((row) => row.taken)?.entryId).toBe("x");
  });

  it("keeps an archived supplement on the days you took it", () => {
    // Stopping one today must not rewrite the months you were taking it.
    const archived = [
      supplement("Omega 3", { archivedAt: DAY }),
      supplement("Magnesium"),
    ];

    const taken = supplementDay(archived, [tick("supplement:Omega 3", DAY)], DAY, "en");
    expect(taken.rows.map((row) => row.supplement.name)).toEqual([
      "Magnesium",
      "Omega 3",
    ]);

    const untaken = supplementDay(archived, [], DAY, "en");
    expect(untaken.rows.map((row) => row.supplement.name)).toEqual(["Magnesium"]);
  });

  it("counts a tick against something no longer in the stack", () => {
    // It has no name to render, so it can't be a row — but dropping it
    // silently would make the day read as one supplement short.
    const day = supplementDay(stack, [tick("supplement:gone", DAY)], DAY, "en");
    expect(day.orphaned).toBe(1);
    expect(day.rows).toHaveLength(2);
  });
});

describe("hasHistory", () => {
  it("is what decides archive versus delete", () => {
    const entries = [tick("supplement:omega", YESTERDAY)];
    expect(hasHistory(entries, "supplement:omega")).toBe(true);
    expect(hasHistory(entries, "supplement:mag")).toBe(false);
  });
});
