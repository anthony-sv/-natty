import {
  bigint,
  doublePrecision,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import type { Profile } from "@/features/profile/profile-store";
import type { WeightUnit } from "@/lib/units";

/**
 * Supabase's managed auth schema, declared only far enough to reference —
 * `schemaFilter: ["public"]` in drizzle.config.ts keeps drizzle-kit from ever
 * trying to manage it.
 */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/**
 * One weigh-in — mirrors `bodyEntrySchema` in `features/body/schema.ts` plus
 * the owner column.
 *
 * The primary key is `(user_id, id)`, not `id` alone: ids are client-minted
 * (`crypto.randomUUID()` today, but routine slugs and `food:` ids follow the
 * same path later), so uniqueness only holds per user. Every read and write
 * must be scoped by the authenticated user's id — the Data API is disabled at
 * the project level, so server functions are the only door.
 *
 * Column types stay permissive (plain text for `unit`, no check constraints):
 * the Zod schema the client already uses is the authority, revalidated in the
 * server function at the boundary. Two sources of validation rules would
 * drift.
 */
export const bodyEntries = pgTable(
  "body_entries",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    /** Epoch ms, exactly as the app stores it — the row round-trips as-is. */
    measuredAt: bigint("measured_at", { mode: "number" }).notNull(),
    weight: doublePrecision("weight").notNull(),
    unit: text("unit").$type<WeightUnit>().notNull().default("kg"),
    bodyFatPercent: doublePrecision("body_fat_percent"),
    notes: text("notes"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] })],
).enableRLS();

/**
 * Standing facts and form preferences — height, sex, wrist/ankle, which
 * girths the measurement form asks for. One row per user.
 *
 * **A jsonb blob rather than a column each, unlike `body_entries` above**, and
 * the difference is what the data is *for*: weigh-ins are rows to be ordered,
 * filtered and charted, while this is one opaque record read whole and never
 * queried across users. Columns would buy nothing and cost a migration every
 * time a preference is added. `profileSchema` validates it on the way in, the
 * same authority the client already parses localStorage with.
 */
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Profile>().notNull(),
}).enableRLS();
// RLS with no policies = deny-all for the Data API roles. The Data API is
// disabled at the project level, so this is belt and braces for the day
// someone re-enables it; Drizzle connects as the table owner and is
// unaffected. Every table in this schema should carry it.
