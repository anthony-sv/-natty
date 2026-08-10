import { describe, expect, it } from "vitest";
import {
  REALISTIC_SHARE,
  percentOfPotential,
  potentialFor,
} from "./casey-butt";

/**
 * The reference case, checked against the published calculator's own output
 * for these exact inputs. Every figure below is what that calculator prints,
 * so a coefficient typo fails here rather than showing up as a plausible
 * wrong number in the UI.
 */
const REFERENCE = {
  heightCm: 179,
  wristCm: 18,
  ankleCm: 23,
  bodyFatPercent: 12,
};

describe("potentialFor", () => {
  it("matches the published calculator on the reference case", () => {
    const result = potentialFor(REFERENCE)!;

    expect(result.leanMassKg).toBeCloseTo(83.2, 1);
    expect(result.girths.neck).toBeCloseTo(42.7, 1);
    expect(result.girths.chest).toBeCloseTo(121.2, 1);
    expect(result.girths.biceps).toBeCloseTo(43.8, 1);
    expect(result.girths.forearm).toBeCloseTo(35.0, 1);
    expect(result.girths.thigh).toBeCloseTo(64.2, 1);
    expect(result.girths.calf).toBeCloseTo(43.0, 1);
  });

  it("matches its 95% figures too", () => {
    const result = potentialFor(REFERENCE)!;

    expect(result.leanMassKg * REALISTIC_SHARE).toBeCloseTo(79.1, 1);
    expect(result.girths.chest * REALISTIC_SHARE).toBeCloseTo(115.2, 1);
    expect(result.girths.calf * REALISTIC_SHARE).toBeCloseTo(40.9, 1);
  });

  it("rises with body fat, since the fat itself carries some lean tissue", () => {
    const lean = potentialFor({ ...REFERENCE, bodyFatPercent: 8 })!;
    const fatter = potentialFor({ ...REFERENCE, bodyFatPercent: 20 })!;

    expect(fatter.leanMassKg).toBeGreaterThan(lean.leanMassKg);
  });

  it("rises with frame size", () => {
    const smaller = potentialFor({ ...REFERENCE, wristCm: 16 })!;
    const bigger = potentialFor({ ...REFERENCE, wristCm: 20 })!;

    expect(bigger.leanMassKg).toBeGreaterThan(smaller.leanMassKg);
    expect(bigger.girths.forearm).toBeGreaterThan(smaller.girths.forearm);
  });

  it("leaves girths that don't depend on the wrist alone", () => {
    const a = potentialFor({ ...REFERENCE, wristCm: 16 })!;
    const b = potentialFor({ ...REFERENCE, wristCm: 20 })!;

    // Thigh and calf are predicted from ankle and height only.
    expect(a.girths.thigh).toBeCloseTo(b.girths.thigh, 10);
    expect(a.girths.calf).toBeCloseTo(b.girths.calf, 10);
  });

  it("gives nothing back until every input is usable", () => {
    expect(potentialFor({})).toBeUndefined();
    expect(potentialFor({ ...REFERENCE, wristCm: undefined })).toBeUndefined();
    expect(potentialFor({ ...REFERENCE, heightCm: 0 })).toBeUndefined();
    expect(potentialFor({ ...REFERENCE, ankleCm: -1 })).toBeUndefined();
    expect(
      potentialFor({ ...REFERENCE, bodyFatPercent: 100 }),
    ).toBeUndefined();
    expect(potentialFor({ ...REFERENCE, bodyFatPercent: NaN })).toBeUndefined();
  });

  it("accepts zero body fat, which is a valid input even if nobody is there", () => {
    expect(potentialFor({ ...REFERENCE, bodyFatPercent: 0 })).toBeDefined();
  });
});

describe("percentOfPotential", () => {
  it("reports where a current lean mass sits", () => {
    const potential = potentialFor(REFERENCE)!;

    expect(percentOfPotential(potential.leanMassKg, potential)).toBeCloseTo(
      100,
      6,
    );
    expect(percentOfPotential(potential.leanMassKg / 2, potential)).toBeCloseTo(
      50,
      6,
    );
  });

  it("can exceed 100 — the model is a fit, not a wall", () => {
    const potential = potentialFor(REFERENCE)!;

    expect(percentOfPotential(potential.leanMassKg * 1.1, potential)).toBeGreaterThan(100);
  });
});
