import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  measurementSchema,
  type Measurement,
} from "@/features/measurements/schema";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { measurements } from "./db/schema";

/** Sync for girth measurements. */

function toMeasurement(row: typeof measurements.$inferSelect): Measurement {
  return {
    id: row.id,
    measuredAt: row.measuredAt,
    site: row.site,
    side: row.side ?? undefined,
    value: row.value,
    unit: row.unit,
    notes: row.notes ?? undefined,
  };
}

export const fetchMeasurements = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Array<Measurement>> => {
    const rows = await db()
      .select()
      .from(measurements)
      .where(eq(measurements.userId, context.userId));
    return rows.map(toMeasurement);
  });

export const upsertMeasurements = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(measurementSchema).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .insert(measurements)
      .values(
        data.map((row) => ({
          userId: context.userId,
          id: row.id,
          measuredAt: row.measuredAt,
          site: row.site,
          side: row.side ?? null,
          value: row.value,
          unit: row.unit,
          notes: row.notes ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: [measurements.userId, measurements.id],
        set: {
          measuredAt: sql`excluded.measured_at`,
          site: sql`excluded.site`,
          side: sql`excluded.side`,
          value: sql`excluded.value`,
          unit: sql`excluded.unit`,
          notes: sql`excluded.notes`,
        },
      });
  });

export const deleteMeasurements = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.array(z.string()).min(1))
  .handler(async ({ context, data }) => {
    await db()
      .delete(measurements)
      .where(
        and(
          eq(measurements.userId, context.userId),
          inArray(measurements.id, data),
        ),
      );
  });
