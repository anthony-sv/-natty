import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { cardioEntrySchema, type CardioEntry } from "@/features/log/cardio-schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { cardioEntries } from "./db/schema";

/** Sync for the cardio log — the same shape `server/log.ts` establishes. */

function toEntry(row: typeof cardioEntries.$inferSelect): CardioEntry {
  return {
    id: row.id,
    performedAt: row.performedAt,
    exerciseId: row.exerciseId,
    distance: row.distance,
    unit: row.unit,
    durationSeconds: row.durationSeconds ?? undefined,
    routineSlug: row.routineSlug ?? undefined,
    weekNumber: row.weekNumber ?? undefined,
    dayNumber: row.dayNumber ?? undefined,
    setNumber: row.setNumber ?? undefined,
  };
}

export const fetchCardioEntries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Array<CardioEntry>> => {
    const rows = await db()
      .select()
      .from(cardioEntries)
      .where(eq(cardioEntries.userId, context.userId));
    return rows.map(toEntry);
  });

export const upsertCardioEntries = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(cardioEntrySchema).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .insert(cardioEntries)
      .values(
        data.map((entry) => ({
          userId: context.userId,
          id: entry.id,
          performedAt: entry.performedAt,
          exerciseId: entry.exerciseId,
          distance: entry.distance,
          unit: entry.unit,
          durationSeconds: entry.durationSeconds ?? null,
          routineSlug: entry.routineSlug ?? null,
          weekNumber: entry.weekNumber ?? null,
          dayNumber: entry.dayNumber ?? null,
          setNumber: entry.setNumber ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: [cardioEntries.userId, cardioEntries.id],
        set: {
          performedAt: sql`excluded.performed_at`,
          exerciseId: sql`excluded.exercise_id`,
          distance: sql`excluded.distance`,
          unit: sql`excluded.unit`,
          durationSeconds: sql`excluded.duration_seconds`,
          routineSlug: sql`excluded.routine_slug`,
          weekNumber: sql`excluded.week_number`,
          dayNumber: sql`excluded.day_number`,
          setNumber: sql`excluded.set_number`,
        },
      });
  });

export const deleteCardioEntries = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(z.string()).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .delete(cardioEntries)
      .where(
        and(
          eq(cardioEntries.userId, context.userId),
          inArray(cardioEntries.id, data),
        ),
      );
  });
