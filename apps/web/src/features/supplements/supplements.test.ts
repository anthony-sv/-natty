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
    servingsPerDay: 1,
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

  it("carries every serving logged that day, not just the first", () => {
    // Three fish-oil capsules ticked one at a time — each is its own row, and
    // none of them should quietly disappear into the others.
    const entries = [
      tick("supplement:omega", DAY, "first"),
      tick("supplement:omega", DAY, "second"),
      tick("supplement:omega", DAY, "third"),
    ];
    expect(takenOn(entries, DAY).get("supplement:omega")).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});

describe("supplementDay", () => {
  const stack = [
    supplement("Omega 3", { servingsPerDay: 3 }),
    supplement("Magnesium", { amount: 2 }),
  ];

  it("lists the whole stack, ticked or not", () => {
    const day = supplementDay(
      stack,
      [tick("supplement:Omega 3", DAY, "a"), tick("supplement:Omega 3", DAY, "b")],
      DAY,
      "en",
    );

    expect(day.rows.map((row) => row.supplement.name)).toEqual([
      "Magnesium",
      "Omega 3",
    ]);
    expect(day.rows.map((row) => row.taken)).toEqual([0, 2]);
    // Magnesium is fully taken at 0 of 1... it isn't, so neither counts here.
    expect(day.taken).toBe(0);
    expect(day.total).toBe(2);
  });

  it("only counts a supplement as taken once every serving is logged", () => {
    const partial = supplementDay(
      stack,
      [tick("supplement:Omega 3", DAY, "a"), tick("supplement:Magnesium", DAY, "b")],
      DAY,
      "en",
    );
    // Magnesium's one serving is done; Omega 3's three are not.
    expect(partial.taken).toBe(1);

    const full = supplementDay(
      stack,
      [
        tick("supplement:Omega 3", DAY, "a"),
        tick("supplement:Omega 3", DAY, "b"),
        tick("supplement:Omega 3", DAY, "c"),
        tick("supplement:Magnesium", DAY, "d"),
      ],
      DAY,
      "en",
    );
    expect(full.taken).toBe(2);
  });

  it("carries the entry ids, so each serving can untick itself", () => {
    const day = supplementDay(
      stack,
      [tick("supplement:Omega 3", DAY, "x"), tick("supplement:Omega 3", DAY, "y")],
      DAY,
      "en",
    );
    expect(day.rows.find((row) => row.supplement.name === "Omega 3")?.entryIds).toEqual([
      "x",
      "y",
    ]);
  });

  it("draws a slot per serving, not just per supplement", () => {
    const day = supplementDay(stack, [], DAY, "en");
    const omega = day.rows.find((row) => row.supplement.name === "Omega 3")!;
    const mag = day.rows.find((row) => row.supplement.name === "Magnesium")!;
    expect(omega.slots).toBe(3);
    expect(mag.slots).toBe(1);
  });

  it("keeps a slot open for a serving logged past the current count", () => {
    // servingsPerDay was lowered to 1 after two servings were already ticked
    // today — both stay real, tickable rows rather than becoming invisible.
    const lowered = [supplement("Creatine", { servingsPerDay: 1 })];
    const day = supplementDay(
      lowered,
      [tick("supplement:Creatine", DAY, "a"), tick("supplement:Creatine", DAY, "b")],
      DAY,
      "en",
    );
    expect(day.rows[0].taken).toBe(2);
    expect(day.rows[0].slots).toBe(2);
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
