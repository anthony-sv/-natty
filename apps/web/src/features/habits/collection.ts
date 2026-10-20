import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteDocuments,
  fetchDocuments,
  upsertDocuments,
} from "@/server/documents";
import {
  habitLogId,
  habitLogSchema,
  habitSchema,
  type Habit,
  type HabitInput,
  type HabitLog,
} from "./schema";

/**
 * Habits and what you did of them, persisted to localStorage.
 *
 * Two more `user_documents` kinds, the eighth and ninth — the same call
 * supplements and extras made. No migration, no table, no endpoint. The log
 * is one row per habit per day (see `habitLogSchema`), which is what keeps a
 * year of three-a-day ticks small enough to read whole.
 */
const localHabits = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.habits.v1",
    getKey: (habit) => habit.id,
    schema: habitSchema,
  }),
);

const localHabitLogs = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.habit-logs.v1",
    getKey: (log) => log.id,
    schema: habitLogSchema,
  }),
);

export const habitsFork = forkCollection({
  queryKey: "habits",
  local: localHabits,
  getKey: (habit) => habit.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "habit" } })) as Habit[],
  upsert: (rows) => upsertDocuments({ data: { kind: "habit", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "habit", ids } }),
});

export const habitLogsFork = forkCollection({
  queryKey: "habit-logs",
  local: localHabitLogs,
  getKey: (log) => log.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "habitLog" } })) as HabitLog[],
  upsert: (rows) => upsertDocuments({ data: { kind: "habitLog", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "habitLog", ids } }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const habits = () => habitsFork.active();
export const habitLogs = () => habitLogsFork.active();

/** Read straight from the collection, for event handlers — the `setsFor` rule. */
export function allHabits(): Habit[] {
  return [...habits().values()];
}

export function allHabitLogs(): HabitLog[] {
  return [...habitLogs().values()];
}

export function createHabit(input: HabitInput) {
  const habit: Habit = {
    ...input,
    id: `habit:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { habit, transaction: habits().insert(habit) };
}

export function updateHabit(id: string, patch: HabitInput) {
  return habits().update(id, (draft) => {
    draft.name = patch.name;
    draft.target = patch.target;
    draft.schedule = patch.schedule;
    draft.timing = patch.timing;
  });
}

export function archiveHabit(id: string) {
  return habits().update(id, (draft) => {
    draft.archivedAt = Date.now();
  });
}

export function restoreHabit(id: string) {
  return habits().update(id, (draft) => {
    draft.archivedAt = undefined;
  });
}

/** Only offered with no history; `HabitList` archives otherwise. */
export function deleteHabit(id: string) {
  const habit = habits().get(id);
  return { habit, transaction: habits().delete(id) };
}

/**
 * Move a day's amount by `delta` — +1 for a tick, +15 for a quarter hour,
 * negative to take one back.
 *
 * Reads the collection rather than a render's snapshot, so two quick taps
 * land as two. A row that falls to zero is deleted rather than kept at 0: a
 * zero row and no row mean the same thing, and only one of them costs a
 * document.
 */
export function adjustHabit(habitId: string, day: number, delta: number) {
  const id = habitLogId(habitId, day);
  const existing = habitLogs().get(id);
  const amount = Math.max(0, (existing?.amount ?? 0) + delta);

  if (existing === undefined) {
    if (amount === 0) return undefined;
    return habitLogs().insert({ id, habitId, day, amount, updatedAt: Date.now() });
  }
  if (amount === 0) return habitLogs().delete(id);
  return habitLogs().update(id, (draft) => {
    draft.amount = amount;
    draft.updatedAt = Date.now();
  });
}
