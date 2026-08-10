import { describe, expect, it } from "vitest";
import { exercises } from "@/data/exercises";
import { matchesAllWords, searchWords } from "./search";

describe("searchWords", () => {
  it("folds case and punctuation the way the library does", () => {
    expect(searchWords("Lat pulldown (Wide grip)")).toEqual([
      "lat",
      "pulldown",
      "wide",
      "grip",
    ]);
  });

  it("yields nothing for an empty or punctuation-only query", () => {
    expect(searchWords("")).toEqual([]);
    expect(searchWords("   ")).toEqual([]);
    expect(searchWords("-/()")).toEqual([]);
  });
});

describe("matchesAllWords", () => {
  it("matches words in any order", () => {
    // The failure that motivated this: a contiguous substring match finds
    // nothing here, because you typed the words the other way round.
    expect(matchesAllWords("Incline barbell bench press", "bench incline")).toBe(
      true,
    );
  });

  it("ignores punctuation on both sides", () => {
    expect(matchesAllWords("Pec deck open", "pec-deck")).toBe(true);
    expect(matchesAllWords("Lat pulldown (Wide grip)", "pulldown wide")).toBe(
      true,
    );
  });

  it("requires every word, not just one", () => {
    expect(matchesAllWords("Incline barbell bench press", "bench squat")).toBe(
      false,
    );
  });

  it("matches on a prefix, so it filters as you type", () => {
    expect(matchesAllWords("Incline barbell bench press", "incl bar")).toBe(true);
  });

  it("matches everything on an empty query", () => {
    expect(matchesAllWords("anything at all", "")).toBe(true);
  });
});

describe("against the real exercise library", () => {
  /** What the records table and the backfill Combobox both search over. */
  const searchText = (exercise: { name: string; aliases: string[] }) =>
    [exercise.name, ...exercise.aliases].join(" ");

  it("finds every exercise by every spelling the library accepts", () => {
    for (const exercise of exercises) {
      for (const alias of exercise.aliases) {
        expect(
          matchesAllWords(searchText(exercise), alias),
          `"${alias}" should find ${exercise.id}`,
        ).toBe(true);
      }
    }
  });

  it("finds the ones the curated name alone can't", () => {
    // The point of making aliases searchable. Nobody types "dumbbell" in a gym,
    // and the plural is how you'd say it out loud — neither is in the name the
    // table displays.
    const distinct = exercises.filter((exercise) =>
      exercise.aliases.some((alias) => !matchesAllWords(exercise.name, alias)),
    );
    // 88 of 113, so this is the common case rather than a handful of oddities.
    expect(distinct.length).toBeGreaterThan(50);

    const byName = (name: string) => exercises.find((e) => e.name === name)!;
    expect(matchesAllWords(searchText(byName("Flat dumbbell press")), "flat db press")).toBe(true);
    expect(matchesAllWords(byName("Flat dumbbell press").name, "flat db press")).toBe(false);
    expect(matchesAllWords(searchText(byName("Dumbbell pullover")), "db pullover")).toBe(true);
    expect(matchesAllWords(byName("Dumbbell pullover").name, "db pullover")).toBe(false);
  });
});
