import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { loggedSetSchema, type LoggedSet } from "@/features/log/schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { loggedSets } from "./db/schema";

/** Sync for the set log — the same shape `server/body.ts` establishes. */

function toSet(row: typeof loggedSets.$inferSelect): LoggedSet {
  return {
    id: row.id,
    performedAt: row.performedAt,
    exerciseId: row.exerciseId,
    weight: row.weight ?? undefined,
    unit: row.unit,
    reps: row.reps,
    routineSlug: row.routineSlug ?? undefined,
    weekNumber: row.weekNumber ?? undefined,
    dayNumber: row.dayNumber ?? undefined,
    setNumber: row.setNumber ?? undefined,
  };
}

export const fetchLoggedSets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Array<LoggedSet>> => {
    const rows = await db()
      .select()
      .from(loggedSets)
      .where(eq(loggedSets.userId, context.userId));
    return rows.map(toSet);
  });

export const upsertLoggedSets = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(loggedSetSchema).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .insert(loggedSets)
      .values(
        data.map((set) => ({
          userId: context.userId,
          id: set.id,
          performedAt: set.performedAt,
          exerciseId: set.exerciseId,
          weight: set.weight ?? null,
          unit: set.unit,
          reps: set.reps,
          routineSlug: set.routineSlug ?? null,
          weekNumber: set.weekNumber ?? null,
          dayNumber: set.dayNumber ?? null,
          setNumber: set.setNumber ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: [loggedSets.userId, loggedSets.id],
        set: {
          performedAt: sql`excluded.performed_at`,
          exerciseId: sql`excluded.exercise_id`,
          weight: sql`excluded.weight`,
          unit: sql`excluded.unit`,
          reps: sql`excluded.reps`,
          routineSlug: sql`excluded.routine_slug`,
          weekNumber: sql`excluded.week_number`,
          dayNumber: sql`excluded.day_number`,
          setNumber: sql`excluded.set_number`,
        },
      });
  });

export const deleteLoggedSets = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(z.string()).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .delete(loggedSets)
      .where(
        and(eq(loggedSets.userId, context.userId), inArray(loggedSets.id, data)),
      );
  });
