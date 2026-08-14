import { describe, expect, it } from "vitest";
import type { WeightUnit } from "@/lib/units";
import {
  describeFfmi,
  ffmi,
  ffmiScale,
  formatIndex,
  lastBodyFat,
  leanMassKg,
  normalizedFfmi,
  withCarriedBodyFat,
} from "./ffmi";
import type { BodyEntry } from "./schema";

function entry(
  weight: number,
  bodyFatPercent?: number,
  unit: WeightUnit = "kg",
  measuredAt = 1,
): BodyEntry {
  return { id: `b${measuredAt}`, measuredAt, weight, unit, bodyFatPercent };
}

describe("leanMassKg", () => {
  it("takes the fat off", () => {
    // 100kg at 20% fat leaves 80kg of everything else.
    expect(leanMassKg(entry(100, 20))).toBeCloseTo(80, 5);
  });

  it("converts pounds first", () => {
    // 220lb is 99.79kg; at 25% fat that leaves 74.84kg.
    expect(leanMassKg(entry(220, 25, "lb"))).toBeCloseTo(74.84, 1);
  });

  it("is undefined without a body-fat reading", () => {
    expect(leanMassKg(entry(90))).toBeUndefined();
  });

  it("treats 0% fat as a real reading, not a missing one", () => {
    expect(leanMassKg(entry(80, 0))).toBeCloseTo(80, 5);
  });
});

describe("lastBodyFat", () => {
  it("is undefined when body fat has never been logged", () => {
    expect(lastBodyFat([entry(90, undefined, "kg", 1)])).toBeUndefined();
  });

  it("finds the most recent reading, not just the most recent entry", () => {
    // Today's weigh-in has no caliper reading; last week's does.
    const entries = [
      entry(90, undefined, "kg", 20),
      entry(91, 18, "kg", 10),
      entry(92, 19, "kg", 1),
    ];
    expect(lastBodyFat(entries)).toEqual({ percent: 18, measuredAt: 10 });
  });

  it("ignores list order", () => {
    const entries = [
      entry(90, 20, "kg", 1),
      entry(91, 18, "kg", 10),
    ];
    expect(lastBodyFat(entries)?.percent).toBe(18);
  });
});

describe("withCarriedBodyFat", () => {
  it("leaves an entry with its own reading untouched", () => {
    const latest = entry(90, 20, "kg", 10);
    const result = withCarriedBodyFat(latest, [latest]);
    expect(result).toEqual({ entry: latest, isCarried: false });
  });

  it("fills in the last known reading when the latest has none", () => {
    const latest = entry(90, undefined, "kg", 20);
    const older = entry(88, 22, "kg", 10);
    const result = withCarriedBodyFat(latest, [latest, older]);

    // Today's weight, carried body fat.
    expect(result.entry.weight).toBe(90);
    expect(result.entry.bodyFatPercent).toBe(22);
    expect(result.isCarried).toBe(true);
    expect(result.measuredAt).toBe(10);
  });

  it("shows nothing when body fat has never been logged at all", () => {
    const latest = entry(90, undefined, "kg", 20);
    const result = withCarriedBodyFat(latest, [latest]);
    expect(result.entry.bodyFatPercent).toBeUndefined();
    expect(result.isCarried).toBe(false);
  });
});

describe("ffmi", () => {
  it("is lean mass over height squared", () => {
    // 80kg lean at 1.80m -> 80 / 3.24 = 24.69
    expect(ffmi(entry(100, 20), 180)).toBeCloseTo(24.69, 2);
  });

  it("is undefined without a height", () => {
    expect(ffmi(entry(100, 20), undefined)).toBeUndefined();
  });

  it("is undefined without a body-fat reading", () => {
    expect(ffmi(entry(100), 180)).toBeUndefined();
  });

  it("rejects a nonsense height rather than dividing by zero", () => {
    expect(ffmi(entry(100, 20), 0)).toBeUndefined();
  });
});

describe("normalizedFfmi", () => {
  it("leaves a 1.8m reading unchanged", () => {
    // The correction is relative to 1.8m, so there is nothing to adjust.
    const raw = ffmi(entry(100, 20), 180)!;
    expect(normalizedFfmi(entry(100, 20), 180)).toBeCloseTo(raw, 5);
  });

  it("adjusts a shorter reading upward", () => {
    // 1.70m is 0.1m short of the reference, so +0.61.
    const raw = ffmi(entry(80, 20), 170)!;
    expect(normalizedFfmi(entry(80, 20), 170)).toBeCloseTo(raw + 0.61, 5);
  });

  it("adjusts a taller reading downward", () => {
    const raw = ffmi(entry(95, 15), 190)!;
    expect(normalizedFfmi(entry(95, 15), 190)).toBeCloseTo(raw - 0.61, 5);
  });
});

describe("describeFfmi", () => {
  it("bands a male reading across the full scale", () => {
    expect(describeFfmi(17, "male")).toBe("Below average");
    expect(describeFfmi(19, "male")).toBe("Average");
    expect(describeFfmi(21, "male")).toBe("Above average");
    expect(describeFfmi(22.5, "male")).toBe("Excellent");
    expect(describeFfmi(24, "male")).toBe("Superior");
    expect(describeFfmi(27, "male")).toBe("Suspicious");
    expect(describeFfmi(29, "male")).toBe("Unlikely");
  });

  it("keeps anything past the top boundary in the top band", () => {
    // Rather than falling off the end and rendering nothing.
    expect(describeFfmi(35, "male")).toBe("Unlikely");
    expect(describeFfmi(30, "female")).toBe("Unlikely");
  });

  it("bands a female reading on its own scale", () => {
    // The same 17 that is "below average" for men sits higher here.
    expect(describeFfmi(17, "female")).toBe("Above average");
    expect(describeFfmi(13, "female")).toBe("Below average");
  });

  it("shows no band when sex is unset, rather than guessing a scale", () => {
    expect(describeFfmi(21, undefined)).toBeUndefined();
  });

  it("shows no band without a value", () => {
    expect(describeFfmi(undefined, "male")).toBeUndefined();
  });
});

describe("ffmiScale", () => {
  it("spans the published male chart", () => {
    const scale = ffmiScale("male");
    expect([scale.min, scale.max]).toEqual([16, 30]);
    expect(scale.bands[0]).toEqual({ from: 16, to: 18, label: "Below average" });
    expect(scale.bands.at(-1)).toEqual({ from: 28, to: 30, label: "Unlikely" });
  });

  it("leaves no gaps between bands", () => {
    for (const sex of ["male", "female"] as const) {
      const { bands, min, max } = ffmiScale(sex);
      expect(bands[0].from).toBe(min);
      expect(bands.at(-1)!.to).toBe(max);
      bands.forEach((band, i) => {
        if (i > 0) expect(band.from).toBe(bands[i - 1].to);
      });
    }
  });
});

describe("formatIndex", () => {
  it("rounds to one decimal", () => {
    expect(formatIndex(24.691)).toBe("24.7");
  });

  it("renders a dash when there is nothing to show", () => {
    expect(formatIndex(undefined)).toBe("—");
  });
});
