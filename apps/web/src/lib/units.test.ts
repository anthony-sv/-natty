import { describe, expect, it } from "vitest";
import { convertWeight, toKilograms } from "./units";

describe("toKilograms", () => {
  it("leaves kilos alone", () => {
    expect(toKilograms(100, "kg")).toBe(100);
  });

  it("converts pounds", () => {
    expect(toKilograms(100, "lb")).toBeCloseTo(45.359, 3);
  });
});

describe("convertWeight", () => {
  it("is an identity within one unit", () => {
    expect(convertWeight(82.5, "kg", "kg")).toBe(82.5);
    expect(convertWeight(182, "lb", "lb")).toBe(182);
  });

  it("agrees with toKilograms", () => {
    expect(convertWeight(100, "lb", "kg")).toBe(toKilograms(100, "lb"));
  });

  it("round-trips", () => {
    expect(convertWeight(convertWeight(82.5, "kg", "lb"), "lb", "kg")).toBeCloseTo(
      82.5,
      10,
    );
  });
});
