import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import {
  authUsers,
  bodyEntries,
  cardioEntries,
  handles,
  intakeEntries,
  loggedSets,
  measurements,
  profiles,
  userDocuments,
  workoutCompletions,
} from "./db/schema";

/**
 * Deleting an account, and everything in it.
 *
 * ## Why this doesn't use the service-role key
 *
 * The obvious way to delete a user is Supabase's admin API, which needs the
 * service-role key — a key that bypasses every policy in the project and that
 * CLAUDE.md says is read nowhere in this codebase. Adding it for one button
 * would put the most dangerous credential Supabase issues into the app's
 * runtime so that a user could remove their own row.
 *
 * The Drizzle connection already authenticates as the database owner, so it
 * can delete the `auth.users` row directly. Same outcome, no new credential.
 *
 * ## Why the data is deleted explicitly first
 *
 * Every table cascades from `auth.users`, so deleting that row alone would
 * take the rest with it. The explicit deletes run anyway, in the same
 * transaction, because a cascade is a property of the schema rather than of
 * this function: if a future table is added without `onDelete: "cascade"`,
 * the cascade quietly stops covering it while this list is what a reviewer
 * actually reads. Deleting twice costs nothing; missing a table is a person's
 * data left behind after they asked for it to be gone.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.userId;

    // One transaction: a half-deleted account is worse than a failed
    // deletion, because the second attempt has nothing left to report on.
    await db().transaction(async (tx) => {
      await tx.delete(loggedSets).where(eq(loggedSets.userId, userId));
      await tx.delete(cardioEntries).where(eq(cardioEntries.userId, userId));
      await tx
        .delete(workoutCompletions)
        .where(eq(workoutCompletions.userId, userId));
      await tx.delete(bodyEntries).where(eq(bodyEntries.userId, userId));
      await tx.delete(measurements).where(eq(measurements.userId, userId));
      await tx.delete(intakeEntries).where(eq(intakeEntries.userId, userId));
      await tx.delete(userDocuments).where(eq(userDocuments.userId, userId));
      await tx.delete(handles).where(eq(handles.userId, userId));
      await tx.delete(profiles).where(eq(profiles.userId, userId));
      // Last, and what actually ends the account: without this the rows are
      // gone but the sign-in still works, which is not what was asked for.
      await tx.delete(authUsers).where(eq(authUsers.id, userId));
    });
  });
