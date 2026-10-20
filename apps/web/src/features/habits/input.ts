import type { HabitInput } from "./schema";

/**
 * What a filled-in habit form becomes. Its own file so the starter chips on
 * the checklist build the exact same shape the form does.
 */
export function toHabitInput(value: {
  name: string;
  kind: "count" | "minutes";
  perDay: number;
  scheduleKind: "daily" | "weekdays" | "weekly";
  days: number[];
  timesPerWeek: number;
  timing: string;
}): HabitInput {
  return {
    name: value.name.trim(),
    target: { kind: value.kind, perDay: value.perDay },
    schedule:
      value.scheduleKind === "weekdays"
        ? { kind: "weekdays", days: [...value.days].sort((a, b) => a - b) }
        : value.scheduleKind === "weekly"
          ? { kind: "weekly", timesPerWeek: value.timesPerWeek }
          : { kind: "daily" },
    timing: value.timing.trim() === "" ? undefined : value.timing.trim(),
  };
}
