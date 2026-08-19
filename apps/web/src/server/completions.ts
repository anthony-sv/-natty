import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  workoutCompletionSchema,
  type WorkoutCompletion,
} from "@/features/log/completion-schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { workoutCompletions } from "./db/schema";

/** Sync for workout completions — the same shape `server/cardio.ts` establishes. */

function toCompletion(
  row: typeof workoutCompletions.$inferSelect,
): WorkoutCompletion {
  return {
    id: row.id,
    routineSlug: row.routineSlug,
    weekNumber: row.weekNumber,
    dayNumber: row.dayNumber,
    performedAt: row.performedAt,
  };
}

export const fetchWorkoutCompletions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Array<WorkoutCompletion>> => {
    const rows = await db()
      .select()
      .from(workoutCompletions)
      .where(eq(workoutCompletions.userId, context.userId));
    return rows.map(toCompletion);
  });

export const upsertWorkoutCompletions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(workoutCompletionSchema).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .insert(workoutCompletions)
      .values(
        data.map((completion) => ({
          userId: context.userId,
          id: completion.id,
          routineSlug: completion.routineSlug,
          weekNumber: completion.weekNumber,
          dayNumber: completion.dayNumber,
          performedAt: completion.performedAt,
        })),
      )
      .onConflictDoUpdate({
        target: [workoutCompletions.userId, workoutCompletions.id],
        set: {
          routineSlug: sql`excluded.routine_slug`,
          weekNumber: sql`excluded.week_number`,
          dayNumber: sql`excluded.day_number`,
          performedAt: sql`excluded.performed_at`,
        },
      });
  });

export const deleteWorkoutCompletions = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(z.string()).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .delete(workoutCompletions)
      .where(
        and(
          eq(workoutCompletions.userId, context.userId),
          inArray(workoutCompletions.id, data),
        ),
      );
  });
