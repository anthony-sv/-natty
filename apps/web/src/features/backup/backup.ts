import { z } from "zod";
import { loggedSetSchema } from "@/features/log/schema";
import { bodyEntrySchema } from "@/features/body/schema";
import { measurementSchema } from "@/features/measurements/schema";
import { userExerciseSchema } from "@/features/library/schema";
import { userRoutineSchema } from "@/features/routines/collection";
import { recipeSchema, userFoodSchema } from "@/features/pantry/schema";
import { userDietPlanSchema } from "@/features/nutrition/collection";
import { intakeEntrySchema } from "@/features/intake/schema";
import { supplementSchema } from "@/features/supplements/schema";
import { profileSchema } from "@/features/profile/profile-store";

/**
 * Taking your data out, and putting it back.
 *
 * Everything the app knows lives in localStorage, which one cleared browser
 * removes for good — and the half that would hurt most is the half nobody
 * could reconstruct: the exercises, recipes, routines and plans you wrote.
 *
 * Pure, and parsed with the **existing** schemas rather than new ones. A
 * hand-edited file is rejected with what failed rather than landing half-valid
 * in a collection, and a schema change automatically applies here too.
 */

/**
 * Bumped when the *envelope* changes, not when a collection's schema does.
 *
 * Written now so a future migration has something to branch on; a file from a
 * version this build doesn't know is refused rather than guessed at.
 */
export const BACKUP_VERSION = 1;

/**
 * The collections a backup carries, and nothing else.
 *
 * Deliberately excludes `natty.session.v1` (a half-finished workout is scratch
 * state, and restoring one onto another device would resume a session you
 * aren't in), plus theme and locale — preferences of the device you're reading
 * on, not data you'd mourn.
 */
export const backupDataSchema = z.object({
  sets: z.array(loggedSetSchema).default([]),
  bodyEntries: z.array(bodyEntrySchema).default([]),
  measurements: z.array(measurementSchema).default([]),
  exercises: z.array(userExerciseSchema).default([]),
  routines: z.array(userRoutineSchema).default([]),
  foods: z.array(userFoodSchema).default([]),
  recipes: z.array(recipeSchema).default([]),
  diets: z.array(userDietPlanSchema).default([]),
  intake: z.array(intakeEntrySchema).default([]),
  supplements: z.array(supplementSchema).default([]),
  profile: profileSchema.optional(),
});
export type BackupData = z.infer<typeof backupDataSchema>;

export const backupSchema = z.object({
  /** Named so a stray JSON file is rejected before its shape is even read. */
  app: z.literal("natty"),
  version: z.number().int().positive(),
  exportedAt: z.number(),
  /**
   * "everything" or the one thing you're sharing.
   *
   * Widening this list doesn't bump `version`: a file written by an older
   * build still parses, which is the direction that matters. A *newer* file
   * reaching an older build was always going to be refused, and it reports the
   * honest reason — the scope isn't one it knows — rather than a version it
   * would then try to migrate.
   */
  scope: z.enum(["full", "routine", "diet", "recipe", "food", "exercise"]),
  data: backupDataSchema,
});
export type Backup = z.infer<typeof backupSchema>;

/**
 * TanStack DB hangs its own bookkeeping off every row it hands back —
 * `$synced`, `$origin`, `$key`, `$collectionId` — and `[...collection.values()]`
 * returns rows wearing all four. They rode straight into every exported file.
 *
 * Harmless in the sense that none of it is secret: `$key` repeats the row's own
 * `id` and `$collectionId` is a localStorage key name. But a backup is a
 * *document*, and a document whose shape is "our schema plus whatever the
 * storage layer happened to attach" has no contract — the reader would be
 * within its rights to start trusting a field we never meant to write, and a
 * file people hand to each other shouldn't carry our internal storage keys at
 * all.
 *
 * Stripping by `$` prefix rather than by naming the four: the set is the
 * library's to change, and none of *our* schemas declare a `$`-prefixed field
 * — `backup.test.ts` walks them and asserts exactly that, so this rule can
 * never start eating real data.
 *
 * A plain strip rather than re-parsing through `backupDataSchema`: an export is
 * the thing you reach for *because* something is wrong, so it must not be able
 * to throw on the way out. Reading still parses, which is where validation
 * belongs.
 */
export function stripInternal<T>(row: T): T {
  if (typeof row !== "object" || row === null) return row;
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => !key.startsWith("$")),
  ) as T;
}

/**
 * Every collection in the envelope, cleaned.
 *
 * Applied inside `buildBackup` rather than at each caller, because that is the
 * one function every export — full backup and each single-item share — already
 * goes through. A strip the callers have to remember is a strip one of them
 * eventually won't.
 */
function cleanData(data: BackupData): BackupData {
  return {
    sets: data.sets.map(stripInternal),
    bodyEntries: data.bodyEntries.map(stripInternal),
    measurements: data.measurements.map(stripInternal),
    exercises: data.exercises.map(stripInternal),
    routines: data.routines.map(stripInternal),
    foods: data.foods.map(stripInternal),
    recipes: data.recipes.map(stripInternal),
    diets: data.diets.map(stripInternal),
    intake: data.intake.map(stripInternal),
    supplements: data.supplements.map(stripInternal),
    ...(data.profile === undefined ? {} : { profile: stripInternal(data.profile) }),
  };
}

export function buildBackup(
  data: BackupData,
  scope: Backup["scope"],
  /** Passed in rather than read here, so this stays pure and testable. */
  exportedAt: number,
): Backup {
  return {
    app: "natty",
    version: BACKUP_VERSION,
    exportedAt,
    scope,
    data: cleanData(data),
  };
}

export type ReadResult =
  | { ok: true; backup: Backup }
  | { ok: false; reason: "not-natty" | "wrong-version" | "invalid"; detail?: string };

/**
 * Parse a file's contents into a backup.
 *
 * **Never throws.** Import is a place where a user hands the app an arbitrary
 * file, so every failure has to come back as a value the UI can explain.
 */
export function readBackup(json: unknown): ReadResult {
  if (
    typeof json !== "object" ||
    json === null ||
    (json as { app?: unknown }).app !== "natty"
  ) {
    return { ok: false, reason: "not-natty" };
  }

  const version = (json as { version?: unknown }).version;
  if (version !== BACKUP_VERSION) {
    // Checked before the shape, so a future file reports the version rather
    // than a confusing list of field errors from a schema that moved on.
    return { ok: false, reason: "wrong-version", detail: String(version) };
  }

  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      reason: "invalid",
      detail: first ? `${first.path.join(".")}: ${first.message}` : undefined,
    };
  }
  return { ok: true, backup: parsed.data };
}

/**
 * Which of the two imports you asked for.
 *
 * Held apart from `scope` on purpose: `scope` is what the *file* claims to be,
 * and this is what the person clicked. They're checked against each other
 * rather than one being derived from the other — see `scopeMatchesIntent`.
 */
export type ImportIntent = "restore" | "merge";

/**
 * Does this file belong to the button that was pressed?
 *
 * **The action must never be picked by the file.** Reading `scope` and
 * branching on it meant a file could route itself to `restoreEverything`,
 * which clears every collection — so a routine someone sent you decided, on
 * its own, whether your logged sets survived opening it. The dialog did say
 * "replace", but a document choosing which question you get asked is the wrong
 * shape regardless of how the question is worded.
 *
 * So the intent comes from the click and the file is checked against it. A
 * mismatch is refused outright rather than silently doing the other thing:
 * the two differ by whether your data is deleted, which is not a difference to
 * paper over with a best guess.
 */
export function scopeMatchesIntent(
  scope: Backup["scope"],
  intent: ImportIntent,
): boolean {
  return intent === "restore" ? scope === "full" : scope !== "full";
}

/**
 * What's in a file, for the confirmation step before anything is written.
 *
 * **`profile` is counted even though it isn't a collection.** It was left out
 * while every array was listed, so a file carrying only a profile previewed as
 * "there's nothing in it" — directly above a button that replaces everything.
 * A preview that under-reports is worse than no preview: it's read as
 * reassurance.
 */
export function summarise(data: BackupData): { key: keyof BackupData; count: number }[] {
  return countsOf(data).filter(({ count }) => count > 0);
}

/**
 * Every countable thing in a backup, zeroes included.
 *
 * One list so `summarise` and `compareCounts` can't disagree about what a
 * backup contains — a key added to one and forgotten in the other would go
 * missing from exactly one of the two dialogs.
 */
function countsOf(data: BackupData): { key: keyof BackupData; count: number }[] {
  return (
    [
      ["sets", data.sets.length],
      ["bodyEntries", data.bodyEntries.length],
      ["measurements", data.measurements.length],
      ["exercises", data.exercises.length],
      ["routines", data.routines.length],
      ["foods", data.foods.length],
      ["recipes", data.recipes.length],
      ["diets", data.diets.length],
      ["intake", data.intake.length],
      ["supplements", data.supplements.length],
      ["profile", data.profile === undefined ? 0 : 1],
    ] as const
  ).map(([key, count]) => ({ key: key as keyof BackupData, count }));
}

/**
 * What a restore would actually do to you, row by row.
 *
 * **Listing the file's contents was never the question a restore asks.** That
 * dialog replaces everything, so the number that matters is the one you're
 * about to lose — and a file with 3 routines and no logged sets rendered as
 * "Your routines 3", which is a true sentence that leaves out the year of sets
 * going with it.
 *
 * A row survives if *either* side is non-zero, which is the whole point: the
 * interesting rows are precisely the ones the file has nothing for. Rows where
 * both are zero are dropped, since neither having nor gaining any is news.
 */
export function compareCounts(
  current: BackupData,
  incoming: BackupData,
): { key: keyof BackupData; from: number; to: number }[] {
  const after = new Map(countsOf(incoming).map(({ key, count }) => [key, count]));
  return countsOf(current)
    .map(({ key, count }) => ({ key, from: count, to: after.get(key) ?? 0 }))
    .filter(({ from, to }) => from > 0 || to > 0);
}

/** A filename that sorts by date and says what it is. */
export function backupFilename(exportedAt: number, scope: Backup["scope"]): string {
  const d = new Date(exportedAt);
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  return scope === "full" ? `natty-backup-${date}.json` : `natty-${scope}-${date}.json`;
}
