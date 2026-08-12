import { z } from "zod";
import { loggedSetSchema } from "@/features/log/schema";
import { bodyEntrySchema } from "@/features/body/schema";
import { userExerciseSchema } from "@/features/library/schema";
import { userRoutineSchema } from "@/features/routines/collection";
import { recipeSchema, userFoodSchema } from "@/features/pantry/schema";
import { userDietPlanSchema } from "@/features/nutrition/collection";
import { intakeEntrySchema } from "@/features/intake/schema";
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
  exercises: z.array(userExerciseSchema).default([]),
  routines: z.array(userRoutineSchema).default([]),
  foods: z.array(userFoodSchema).default([]),
  recipes: z.array(recipeSchema).default([]),
  diets: z.array(userDietPlanSchema).default([]),
  intake: z.array(intakeEntrySchema).default([]),
  profile: profileSchema.optional(),
});
export type BackupData = z.infer<typeof backupDataSchema>;

export const backupSchema = z.object({
  /** Named so a stray JSON file is rejected before its shape is even read. */
  app: z.literal("natty"),
  version: z.number().int().positive(),
  exportedAt: z.number(),
  /** "everything" or the one thing you're sharing. */
  scope: z.enum(["full", "routine", "diet", "recipe"]),
  data: backupDataSchema,
});
export type Backup = z.infer<typeof backupSchema>;

export function buildBackup(
  data: BackupData,
  scope: Backup["scope"],
  /** Passed in rather than read here, so this stays pure and testable. */
  exportedAt: number,
): Backup {
  return { app: "natty", version: BACKUP_VERSION, exportedAt, scope, data };
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

/** What's in a file, for the confirmation step before anything is written. */
export function summarise(data: BackupData): { key: keyof BackupData; count: number }[] {
  return (
    [
      ["sets", data.sets.length],
      ["bodyEntries", data.bodyEntries.length],
      ["exercises", data.exercises.length],
      ["routines", data.routines.length],
      ["foods", data.foods.length],
      ["recipes", data.recipes.length],
      ["diets", data.diets.length],
      ["intake", data.intake.length],
    ] as const
  )
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key: key as keyof BackupData, count }));
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
