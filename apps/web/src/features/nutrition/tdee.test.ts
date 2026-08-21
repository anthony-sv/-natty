import { describe, expect, it } from "vitest";
import {
  activityFactorForTrainingDays,
  estimatedBmr,
  estimatedTdee,
  suggestedTargetKcal,
} from "./tdee";

describe("estimatedBmr", () => {
  it("applies Mifflin-St Jeor for a man", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(
      estimatedBmr({ weightKg: 80, heightCm: 180, age: 30, sex: "male" }),
    ).toBe(1780);
  });

  it("applies Mifflin-St Jeor for a woman", () => {
    // 10*80 + 6.25*180 - 5*30 - 161 = 1614
    expect(
      estimatedBmr({ weightKg: 80, heightCm: 180, age: 30, sex: "female" }),
    ).toBe(1614);
  });
});

describe("activityFactorForTrainingDays", () => {
  it("maps the standard Mifflin-St Jeor table", () => {
    expect(activityFactorForTrainingDays(0)).toBe(1.2);
    expect(activityFactorForTrainingDays(1)).toBe(1.375);
    expect(activityFactorForTrainingDays(3)).toBe(1.375);
    expect(activityFactorForTrainingDays(4)).toBe(1.55);
    expect(activityFactorForTrainingDays(5)).toBe(1.55);
    expect(activityFactorForTrainingDays(6)).toBe(1.725);
    expect(activityFactorForTrainingDays(7)).toBe(1.9);
  });
});

describe("estimatedTdee", () => {
  it("multiplies BMR by the activity factor", () => {
    expect(estimatedTdee(1780, 1.55)).toBeCloseTo(2759, 5);
  });
});

describe("suggestedTargetKcal", () => {
  it("cuts 200 under TDEE for cutting", () => {
    expect(suggestedTargetKcal(2500, "cutting")).toBe(2300);
  });

  it("adds 200 over TDEE for bulking", () => {
    expect(suggestedTargetKcal(2500, "bulking")).toBe(2700);
  });

  it("matches TDEE for maintenance", () => {
    expect(suggestedTargetKcal(2500, "maintenance")).toBe(2500);
  });

  it("rounds to the nearest 10", () => {
    expect(suggestedTargetKcal(2456, "maintenance")).toBe(2460);
  });
});
