import { describe, expect, it } from "vitest";
import { ageFromBirthDate, estimatedMaxHr, zone2Range } from "./heart-rate";

describe("ageFromBirthDate", () => {
  it("counts whole years", () => {
    const birthDate = Date.UTC(1990, 0, 1);
    const now = Date.UTC(2026, 0, 1);
    expect(ageFromBirthDate(birthDate, now)).toBe(36);
  });

  it("hasn't turned yet this year", () => {
    const birthDate = Date.UTC(1990, 5, 15);
    const now = Date.UTC(2026, 0, 1);
    expect(ageFromBirthDate(birthDate, now)).toBe(35);
  });
});

describe("estimatedMaxHr", () => {
  it("applies the Tanaka formula", () => {
    // 208 - 0.7 * 30 = 187
    expect(estimatedMaxHr(30)).toBe(187);
    // 208 - 0.7 * 40 = 180
    expect(estimatedMaxHr(40)).toBe(180);
  });
});

describe("zone2Range", () => {
  it("is 60-70% of max, rounded", () => {
    // max 187 -> 112.2 / 130.9
    expect(zone2Range(187)).toEqual({ lowBpm: 112, highBpm: 131 });
  });

  it("rounds a clean number cleanly", () => {
    // max 180 -> 108 / 126 exactly
    expect(zone2Range(180)).toEqual({ lowBpm: 108, highBpm: 126 });
  });
});
