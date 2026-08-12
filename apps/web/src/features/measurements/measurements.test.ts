import { describe, expect, it } from "vitest";
import { latestBySeries, orderSeries, sitesWithData, toSeries } from "./measurements";
import {
  DEFAULT_TRACKED_SITES,
  isPaired,
  measurementSiteSchema,
  seriesKey,
  type Measurement,
} from "./schema";

const DAY = 86_400_000;
const AT = Date.UTC(2026, 7, 1);

function row(patch: Partial<Measurement> & Pick<Measurement, "site" | "value">): Measurement {
  return {
    id: `${patch.site}-${patch.side ?? "both"}-${patch.measuredAt ?? AT}`,
    measuredAt: AT,
    unit: "cm",
    ...patch,
  };
}

describe("toSeries", () => {
  it("keeps a left and a right apart rather than averaging them", () => {
    const series = toSeries([
      row({ site: "upperArm", side: "left", value: 39 }),
      row({ site: "upperArm", side: "right", value: 40.5 }),
    ]);

    expect(series).toHaveLength(2);
    expect(series.map((s) => s.key).sort()).toEqual([
      "upperArm:left",
      "upperArm:right",
    ]);
  });

  it("treats a sideless reading as its own series", () => {
    // Measuring "my arm" and measuring "my left arm" are different records.
    // Folding them together would invent a side you never wrote down.
    const series = toSeries([
      row({ site: "upperArm", value: 40 }),
      row({ site: "upperArm", side: "left", value: 39 }),
    ]);

    expect(series).toHaveLength(2);
    expect(series.find((s) => s.side === undefined)?.latest).toBe(40);
  });

  it("orders points oldest first, whatever order the rows arrive in", () => {
    const series = toSeries([
      row({ site: "waist", value: 82, measuredAt: AT + 30 * DAY }),
      row({ site: "waist", value: 85, measuredAt: AT }),
      row({ site: "waist", value: 83.5, measuredAt: AT + 15 * DAY }),
    ]);

    expect(series[0]!.points.map((p) => p.value)).toEqual([85, 83.5, 82]);
  });

  it("puts a run of mixed units on one axis, in the newest one", () => {
    // The number you recognise is the one you last wrote down, so the newest
    // reading picks the unit. Without this a switch to inches would draw a
    // collapse that never happened.
    const series = toSeries([
      row({ site: "chest", value: 101.6, unit: "cm", measuredAt: AT }),
      row({ site: "chest", value: 41, unit: "in", measuredAt: AT + DAY }),
    ]);

    expect(series[0]!.unit).toBe("in");
    expect(series[0]!.points[0]!.value).toBeCloseTo(40, 6);
    expect(series[0]!.latest).toBe(41);
  });

  it("reports the change across the whole run, in that unit", () => {
    const series = toSeries([
      row({ site: "upperArm", value: 38, measuredAt: AT }),
      row({ site: "upperArm", value: 39.5, measuredAt: AT + 60 * DAY }),
    ]);

    expect(series[0]!.change).toBeCloseTo(1.5, 6);
  });

  it("has no change to report from a single reading", () => {
    // One measurement is a measurement, not a trend. Reporting +0 would read
    // as having held steady rather than as having only just started.
    const series = toSeries([row({ site: "calf", value: 38 })]);

    expect(series[0]!.change).toBeUndefined();
    expect(series[0]!.latest).toBe(38);
  });

  it("has nothing to say about no rows", () => {
    expect(toSeries([])).toEqual([]);
  });
});

describe("orderSeries", () => {
  it("reads down the body, and left before right", () => {
    const series = toSeries([
      row({ site: "calf", side: "right", value: 38 }),
      row({ site: "neck", value: 40 }),
      row({ site: "calf", side: "left", value: 37.5 }),
      row({ site: "chest", value: 104 }),
    ]);

    expect(
      orderSeries(series, measurementSiteSchema.options).map((s) => s.key),
    ).toEqual(["neck", "chest", "calf:left", "calf:right"]);
  });

  it("puts a whole-site reading ahead of its two halves", () => {
    const series = toSeries([
      row({ site: "thigh", side: "left", value: 60 }),
      row({ site: "thigh", value: 61 }),
    ]);

    expect(
      orderSeries(series, measurementSiteSchema.options).map((s) => s.side),
    ).toEqual([undefined, "left"]);
  });
});

describe("latestBySeries", () => {
  it("keys on site and side together", () => {
    const latest = latestBySeries([
      row({ site: "forearm", side: "left", value: 30, measuredAt: AT }),
      row({ site: "forearm", side: "left", value: 31, measuredAt: AT + DAY }),
      row({ site: "forearm", side: "right", value: 30.5 }),
    ]);

    expect(latest.get(seriesKey("forearm", "left"))?.latest).toBe(31);
    expect(latest.get(seriesKey("forearm", "right"))?.latest).toBe(30.5);
    expect(latest.get(seriesKey("forearm"))).toBeUndefined();
  });
});

describe("sitesWithData", () => {
  it("is what you've measured, not what you track", () => {
    const sites = sitesWithData([
      row({ site: "waist", value: 82 }),
      row({ site: "waist", value: 81 }),
      row({ site: "neck", value: 40 }),
    ]);

    expect([...sites].sort()).toEqual(["neck", "waist"]);
  });
});

describe("the site vocabulary", () => {
  it("marks exactly the sites that come in pairs", () => {
    const paired = measurementSiteSchema.options.filter(isPaired);

    expect(paired).toEqual(["upperArm", "forearm", "thigh", "calf"]);
  });

  it("has no side on a site there's only one of", () => {
    for (const site of ["neck", "shoulders", "chest", "waist", "hips"] as const) {
      expect(isPaired(site)).toBe(false);
    }
  });

  it("defaults to sites that exist", () => {
    // The default trio is written out rather than derived, so this is what
    // stops a rename leaving the first-run form asking for nothing.
    for (const site of DEFAULT_TRACKED_SITES) {
      expect(measurementSiteSchema.options).toContain(site);
    }
  });

  it("covers every girth the natural-potential model predicts", () => {
    // `casey-butt.ts` outputs these six. Measuring them is what turns that
    // page from a number you read into one you can check yourself against.
    for (const site of [
      "neck",
      "chest",
      "upperArm",
      "forearm",
      "thigh",
      "calf",
    ] as const) {
      expect(measurementSiteSchema.options).toContain(site);
    }
  });
});
