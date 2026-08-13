import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { intakeEntrySchema, type IntakeEntry } from "@/features/intake/schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { intakeEntries } from "./db/schema";

/** Sync for what you ate. */

function toEntry(row: typeof intakeEntries.$inferSelect): IntakeEntry {
  return {
    id: row.id,
    day: row.day,
    loggedAt: row.loggedAt,
    source: row.source,
  };
}

export const fetchIntake = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Array<IntakeEntry>> => {
    const rows = await db()
      .select()
      .from(intakeEntries)
      .where(eq(intakeEntries.userId, context.userId));
    return rows.map(toEntry);
  });

export const upsertIntake = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(intakeEntrySchema).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .insert(intakeEntries)
      .values(
        data.map((entry) => ({
          userId: context.userId,
          id: entry.id,
          day: entry.day,
          loggedAt: entry.loggedAt,
          source: entry.source,
        })),
      )
      .onConflictDoUpdate({
        target: [intakeEntries.userId, intakeEntries.id],
        set: {
          day: sql`excluded.day`,
          loggedAt: sql`excluded.logged_at`,
          source: sql`excluded.source`,
        },
      });
  });

export const deleteIntake = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(z.string()).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .delete(intakeEntries)
      .where(
        and(
          eq(intakeEntries.userId, context.userId),
          inArray(intakeEntries.id, data),
        ),
      );
  });
