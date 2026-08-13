import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { bodyEntrySchema, type BodyEntry } from "@/features/body/schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { bodyEntries } from "./db/schema";

/**
 * The weigh-in sync endpoints — the pilot for every collection that follows.
 *
 * The shape to copy: reads and writes scope by `context.userId` from the
 * middleware and nothing else; payloads are validated by the *same* Zod schema
 * the client collection uses; and writes are upserts on `(user_id, id)`, so a
 * retry after a dropped connection is harmless rather than a duplicate.
 */

function toEntry(row: typeof bodyEntries.$inferSelect): BodyEntry {
  return {
    id: row.id,
    measuredAt: row.measuredAt,
    weight: row.weight,
    unit: row.unit,
    // Postgres has no undefined; the app's schema has no null. Convert at the
    // boundary in both directions.
    bodyFatPercent: row.bodyFatPercent ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export const fetchBodyEntries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Array<BodyEntry>> => {
    const rows = await db
      .select()
      .from(bodyEntries)
      .where(eq(bodyEntries.userId, context.userId));
    return rows.map(toEntry);
  });

export const upsertBodyEntries = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(bodyEntrySchema).min(1))
  .handler(async ({ context, data }) => {
    await db
      .insert(bodyEntries)
      .values(
        data.map((entry) => ({
          userId: context.userId,
          id: entry.id,
          measuredAt: entry.measuredAt,
          weight: entry.weight,
          unit: entry.unit,
          bodyFatPercent: entry.bodyFatPercent ?? null,
          notes: entry.notes ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: [bodyEntries.userId, bodyEntries.id],
        set: {
          measuredAt: sql`excluded.measured_at`,
          weight: sql`excluded.weight`,
          unit: sql`excluded.unit`,
          bodyFatPercent: sql`excluded.body_fat_percent`,
          notes: sql`excluded.notes`,
        },
      });
  });

export const deleteBodyEntries = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(z.string()).min(1))
  .handler(async ({ context, data }) => {
    await db
      .delete(bodyEntries)
      .where(
        and(eq(bodyEntries.userId, context.userId), inArray(bodyEntries.id, data)),
      );
  });
