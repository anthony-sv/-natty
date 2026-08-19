import type { MessageKey } from "@/i18n/use-t";
import type { ForkedCollection } from "@/lib/synced-collection";
import { bodyEntriesFork } from "@/features/body/collection";
import { intakeEntriesFork } from "@/features/intake/collection";
import { userExercisesFork } from "@/features/library/collection";
import { cardioEntriesFork } from "@/features/log/cardio-collection";
import { loggedSetsFork } from "@/features/log/collection";
import { workoutCompletionsFork } from "@/features/log/completion-collection";
import { measurementsFork } from "@/features/measurements/collection";
import { userDietsFork } from "@/features/nutrition/collection";
import { userFoodsFork, userRecipesFork } from "@/features/pantry/collection";
import { userRoutinesFork } from "@/features/routines/collection";
import { supplementsFork } from "@/features/supplements/collection";

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
 *
 * ## Why it counts first and writes second
 *
 * On a shared device the local data belongs to whoever used it last, and the
 * account signed in now may not be theirs — so uploading on a single press
 * could pour one person's training history into another's account. It's
 * their own press and their own device, so refusing outright would be
 * paternalistic and sometimes wrong. Showing what is about to move is the
 * honest version: a year of someone else's training is unmistakable as a
 * list of counts, and nobody confirms 1,824 sets they don't recognise.
 */

/** Which account last uploaded from this device. */
const OWNER_KEY = "natty.upload.owner.v1";

/**
 * Deliberately *not* `natty.profile.owner.v1`. That one is rewritten on every
 * sign-in, so by the time someone reads the upload card it already names
 * them — it can say who is here, never whose data this is. This is written
 * only by an upload, so it survives a different person signing in.
 */
function storedOwner(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(OWNER_KEY);
}

function rememberOwner(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(OWNER_KEY, userId);
}

/**
 * Whether this device's data is known to have been uploaded by someone else.
 *
 * Only ever *known* — a device nobody has uploaded from returns false, and
 * the preview is what protects that case. Exported for its test.
 */
export function belongsToAnotherAccount(
  owner: string | null,
  userId: string,
): boolean {
  return owner !== null && owner !== userId;
}

/**
 * Loosely typed on purpose — a dozen collections of a dozen different row
 * shapes, and the only thing this file does with a row is read its key and
 * hand it back. Each fork keeps its own types at its own call sites.
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
  { labelKey: "data.kind.cardio", fork: cardioEntriesFork as unknown as AnyFork },
  {
    labelKey: "data.kind.completions",
    fork: workoutCompletionsFork as unknown as AnyFork,
  },
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
  {
    labelKey: "data.kind.supplements",
    fork: supplementsFork as unknown as AnyFork,
  },
];

export interface PendingUpload {
  /** What would move, per collection — only the non-empty ones. */
  rows: Array<{ labelKey: MessageKey; count: number }>;
  total: number;
  /** True when a *different* account uploaded from this device before. */
  fromAnotherAccount: boolean;
}

/**
 * What would be uploaded, without uploading it.
 *
 * The rows themselves are deliberately not returned: re-reading them at
 * commit time is one more cheap pass over an in-memory collection, and
 * holding a snapshot across a confirmation dialog would upload what was true
 * when the dialog opened rather than when it was confirmed.
 */
export async function pendingUpload(userId: string): Promise<PendingUpload> {
  const rows: PendingUpload["rows"] = [];

  for (const { labelKey, fork } of TARGETS) {
    const count = (await missingRows(fork)).length;
    if (count > 0) rows.push({ labelKey, count });
  }

  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.count, 0),
    fromAnotherAccount: belongsToAnotherAccount(storedOwner(), userId),
  };
}

/** Everything this device has that the account doesn't. */
async function missingRows(fork: AnyFork): Promise<Array<object>> {
  const local = fork.local;
  const synced = fork.synced();
  // **Both sides have to be awake first.** Collections load lazily, so an
  // unloaded one reads back empty — which here would mean either uploading
  // nothing or re-uploading everything.
  await Promise.all([local.preload(), synced.preload()]);

  const have = new Set(synced.keys());
  return [...local.values()].filter(
    (row) => !have.has(fork.getKey(row as never)),
  );
}

export interface UploadResult {
  uploaded: Array<{ labelKey: MessageKey; count: number }>;
  total: number;
}

export async function uploadLocalData(userId: string): Promise<UploadResult> {
  const uploaded: UploadResult["uploaded"] = [];

  for (const { labelKey, fork } of TARGETS) {
    const missing = await missingRows(fork);
    if (missing.length === 0) continue;

    // One transaction per collection: each is a single round trip.
    fork.synced().insert(missing as Array<never>);
    uploaded.push({ labelKey, count: missing.length });
  }

  // Claims the device for this account, so a different one is warned next
  // time. Recorded even for an empty upload: pressing the button is the
  // claim, and "nothing was missing" still means this account owns it.
  rememberOwner(userId);

  return {
    uploaded,
    total: uploaded.reduce((sum, row) => sum + row.count, 0),
  };
}
