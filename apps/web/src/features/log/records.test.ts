import { describe, expect, it } from "vitest";
import { toRecordRows } from "./records";
import type { LoggedSet } from "./schema";

let seq = 0;
function set(
  exerciseId: string,
  weight: number | undefined,
  reps: number,
  performedAt = ++seq,
): LoggedSet {
  return {
    id: `s${++seq}`,
    performedAt,
    exerciseId,
    weight,
    unit: "kg",
    reps,
  };
}

/** Stands in for the exercise library, so the test doesn't depend on its data. */
const naming = {
  exerciseName: (id: string) => (id === "known" ? "Lat pulldown (Wide)" : id),
  movementName: (id: string) => (id === "known" ? "Lat pulldown" : undefined),
  aliases: (id: string) =>
    id === "known" ? ["Lat pulldown wide grip", "Wide pulldown"] : [],
};

const shape = (rows: ReturnType<typeof toRecordRows>) =>
  rows.map((row) => `${row.exerciseId}:${row.weight ?? "bw"}x${row.reps}`);

describe("toRecordRows", () => {
  it("reduces each exercise to its own frontier", () => {
    const rows = toRecordRows(
      [
        set("a", 100, 5),
        set("a", 90, 5), // dominated: same reps, less weight
        set("b", 60, 8),
      ],
      naming,
    );

    expect(shape(rows).sort()).toEqual(["a:100x5", "b:60x8"]);
  });

  it("does not compare across exercises", () => {
    // 60x8 would be dominated by 100x10 if the two lifts were pooled. They
    // aren't: a record belongs to the exercise it was set on.
    const rows = toRecordRows([set("a", 100, 10), set("b", 60, 8)], naming);

    expect(shape(rows).sort()).toEqual(["a:100x10", "b:60x8"]);
  });

  it("orders most recently performed first", () => {
    const rows = toRecordRows(
      [set("a", 100, 5, 300), set("b", 60, 8, 100), set("c", 40, 12, 200)],
      naming,
    );

    expect(rows.map((row) => row.exerciseId)).toEqual(["a", "c", "b"]);
  });

  it("carries the name, movement and aliases used for searching", () => {
    const [row] = toRecordRows([set("known", 70, 10)], naming);

    // The curated name is one way to say it; the aliases are the ways someone
    // would actually type it, and the table's search accessor joins all three.
    expect(row).toMatchObject({
      exerciseName: "Lat pulldown (Wide)",
      movementName: "Lat pulldown",
      aliases: ["Lat pulldown wide grip", "Wide pulldown"],
    });
  });

  it("falls back to the id when an exercise can't be named", () => {
    const [row] = toRecordRows([set("mystery", 70, 10)], naming);

    expect(row).toMatchObject({
      exerciseName: "mystery",
      movementName: undefined,
      aliases: [],
    });
  });

  it("has nothing to say about an empty log", () => {
    expect(toRecordRows([], naming)).toEqual([]);
  });
});
