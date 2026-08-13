import type { MessageKey } from "@/i18n/use-t";
import type { ForkedCollection } from "@/lib/synced-collection";
import { bodyEntriesFork } from "@/features/body/collection";
import { intakeEntriesFork } from "@/features/intake/collection";
import { userExercisesFork } from "@/features/library/collection";
import { loggedSetsFork } from "@/features/log/collection";
import { measurementsFork } from "@/features/measurements/collection";
import { userDietsFork } from "@/features/nutrition/collection";
import { userFoodsFork, userRecipesFork } from "@/features/pantry/collection";
import { userRoutinesFork } from "@/features/routines/collection";

/**
 * Putting this device's data into your account.
 *
 * Sign-in doesn't migrate anything by itself — the lesson `logSet` learned
 * when advancing through a workout recorded sets nobody performed. This is
 * the explicit version: press it and every row this device has that the
 * account doesn't is uploaded.
 *
 * **Idempotent.** Rows already in the account are skipped by key, and the
 * server upserts on `(user_id, id)` anyway, so pressing it twice does nothing
 * the first press didn't. Local rows are never cleared: sign out and this
 * device still shows its own data.
 */

/**
 * Loosely typed on purpose — nine collections of nine different row shapes,
 * and the only thing this file does with a row is read its key and hand it
 * back. Each fork keeps its own types at its own call sites.
 */
type AnyFork = ForkedCollection<{
  preload: () => Promise<unknown>;
  values: () => Iterable<object>;
  keys: () => Iterable<string>;
  insert: (rows: Array<never>) => unknown;
}>;

/** Everything that syncs, in the order the summary reads. */
const TARGETS: Array<{ labelKey: MessageKey; fork: AnyFork }> = [
  { labelKey: "data.kind.sets", fork: loggedSetsFork as unknown as AnyFork },
  {
    labelKey: "data.kind.bodyEntries",
    fork: bodyEntriesFork as unknown as AnyFork,
  },
  {
    labelKey: "data.kind.measurements",
    fork: measurementsFork as unknown as AnyFork,
  },
  {
    labelKey: "data.kind.exercises",
    fork: userExercisesFork as unknown as AnyFork,
  },
  {
    labelKey: "data.kind.routines",
    fork: userRoutinesFork as unknown as AnyFork,
  },
  { labelKey: "data.kind.foods", fork: userFoodsFork as unknown as AnyFork },
  { labelKey: "data.kind.recipes", fork: userRecipesFork as unknown as AnyFork },
  { labelKey: "data.kind.diets", fork: userDietsFork as unknown as AnyFork },
  { labelKey: "data.kind.intake", fork: intakeEntriesFork as unknown as AnyFork },
];

export interface UploadResult {
  /** How many rows were sent, per collection — only the non-empty ones. */
  uploaded: Array<{ labelKey: MessageKey; count: number }>;
  total: number;
}

export async function uploadLocalData(): Promise<UploadResult> {
  const uploaded: UploadResult["uploaded"] = [];

  for (const { labelKey, fork } of TARGETS) {
    const local = fork.local;
    const synced = fork.synced();
    // **Both sides have to be awake first.** Collections load lazily, so an
    // unloaded one reads back empty — which here would mean either uploading
    // nothing or re-uploading everything.
    await Promise.all([local.preload(), synced.preload()]);

    const have = new Set(synced.keys());
    const missing = [...local.values()].filter(
      (row) => !have.has(fork.getKey(row as never)),
    );
    if (missing.length === 0) continue;

    // One transaction per collection: each is a single round trip.
    synced.insert(missing as Array<never>);
    uploaded.push({ labelKey, count: missing.length });
  }

  return {
    uploaded,
    total: uploaded.reduce((sum, row) => sum + row.count, 0),
  };
}
