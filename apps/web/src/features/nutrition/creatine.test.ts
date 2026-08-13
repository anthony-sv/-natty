import { describe, expect, it } from "vitest";
import {
  ASSUMED_FFM_SHARE,
  creatineDose,
  LOADING_SPLIT,
  MAINTENANCE_G_PER_KG_BODY,
  SIMPLE_DOSE_G,
} from "./creatine";

describe("creatineDose", () => {
  it("lands where the published dosing does for a lean person", () => {
    // The scaling exists to leave this case alone: 83 kg at 25% fat is
    // exactly the FFM share the per-bodyweight figures assume, so both bases
    // have to agree here or the coefficient is wrong.
    const viaFfm = creatineDose(83, 25);
    const viaBody = creatineDose(83);
    expect(viaFfm?.maintenanceG).toBe(viaBody?.maintenanceG);
    expect(viaBody?.maintenanceG).toBeCloseTo(83 * MAINTENANCE_G_PER_KG_BODY, 1);
  });

  it("separates two people of the same weight and different composition", () => {
    // The whole reason for using fat-free mass. Bodyweight alone would tell
    // these two to take the same amount.
    const lean = creatineDose(90, 12);
    const heavier = creatineDose(90, 30);
    expect(lean!.maintenanceG).toBeGreaterThan(heavier!.maintenanceG);
  });

  it("says which mass it scaled from", () => {
    expect(creatineDose(83, 15)?.basis).toBe("fat-free-mass");
    // No body-fat reading means no fat-free mass — it falls back rather than
    // inventing a percentage and reporting the result as if it were measured.
    expect(creatineDose(83)?.basis).toBe("body-mass");
    expect(creatineDose(83)?.basisKg).toBe(83);
  });

  it("splits a loading dose into something swallowable", () => {
    const dose = creatineDose(83, 15)!;
    expect(dose.loadingG).toBeGreaterThan(dose.maintenanceG * 5);
    // Exactly, not approximately: the total is derived from the rounded dose
    // so the card can never print two figures that contradict each other.
    expect(dose.loadingPerDoseG * LOADING_SPLIT).toBe(dose.loadingG);
  });

  it("stays under the dose that makes it optional", () => {
    // If the formula ever tells an ordinary person to take *more* than the
    // 5 g the card offers as the easy answer, the card contradicts itself.
    for (const [weight, fat] of [
      [60, 12],
      [83, 15],
      [100, 20],
      [120, 30],
    ]) {
      expect(creatineDose(weight, fat)!.maintenanceG).toBeLessThanOrEqual(
        SIMPLE_DOSE_G,
      );
    }
  });

  it("refuses input it can't use", () => {
    expect(creatineDose(0)).toBeUndefined();
    expect(creatineDose(-5)).toBeUndefined();
    expect(creatineDose(Number.NaN)).toBeUndefined();
    // An impossible body-fat reading falls back to body mass rather than
    // producing a negative lean mass.
    expect(creatineDose(83, 100)?.basis).toBe("body-mass");
  });

  it("keeps the share it scales through honest", () => {
    expect(ASSUMED_FFM_SHARE).toBeGreaterThan(0.6);
    expect(ASSUMED_FFM_SHARE).toBeLessThan(0.9);
  });
});
