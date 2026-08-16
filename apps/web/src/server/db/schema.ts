import {
  bigint,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import type { IntakeSource } from "@/features/intake/schema";
import type { MeasurementSite } from "@/features/measurements/schema";
import type { Profile } from "@/features/profile/profile-store";
import type { DistanceUnit, LengthUnit, WeightUnit } from "@/lib/units";

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

/**
 * `@you` — the one public, unique name.
 *
 * Its own table rather than a field on `profiles`, and that isn't tidiness:
 * uniqueness is the entire point, a jsonb blob can't have a unique index on a
 * key inside it, and no amount of client-side checking makes a claim safe
 * against two people pressing the button at the same moment. The primary key
 * *is* the handle, so the database refuses the second one — the race can't be
 * lost, only reported.
 *
 * Stored already lowercased by `normalizeHandle`, so the key does
 * case-insensitive matching without every query remembering to.
 */
export const handles = pgTable("handles", {
  handle: text("handle").primaryKey(),
  // One each: claiming a new handle replaces the old one rather than
  // accumulating them, which is what the unique constraint here enforces.
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  claimedAt: bigint("claimed_at", { mode: "number" }).notNull(),
}).enableRLS();

/**
 * Shared by every owned table: the user column, its cascade, and the
 * client-minted id. Spread into a table's column object as `...owned()`.
 *
 * **A function, not an object.** Column builders are stateful — building a
 * table binds them to it — so spreading one shared object into four tables
 * hands them the same instances and corrupts the schema. It fails inside
 * drizzle-kit rather than at the call site, which is why this is worth the
 * comment.
 */
const owned = () => ({
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  id: text("id").notNull(),
});

/** Every set you've performed. The one collection that grows without bound. */
export const loggedSets = pgTable(
  "logged_sets",
  {
    ...owned(),
    performedAt: bigint("performed_at", { mode: "number" }).notNull(),
    exerciseId: text("exercise_id").notNull(),
    weight: doublePrecision("weight"),
    unit: text("unit").$type<WeightUnit>().notNull().default("kg"),
    reps: integer("reps").notNull(),
    // Provenance — which routine, week, day and set this came from. Optional
    // because a set logged straight from /progress has no session behind it.
    routineSlug: text("routine_slug"),
    weekNumber: integer("week_number"),
    dayNumber: integer("day_number"),
    setNumber: integer("set_number"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    // The two reads that will matter first when this stops being fetched
    // whole: one exercise's history, and a date window.
    index("logged_sets_user_exercise_idx").on(table.userId, table.exerciseId),
    index("logged_sets_user_performed_idx").on(table.userId, table.performedAt),
  ],
).enableRLS();

/** Every cardio session you've logged distance for. */
export const cardioEntries = pgTable(
  "cardio_entries",
  {
    ...owned(),
    performedAt: bigint("performed_at", { mode: "number" }).notNull(),
    exerciseId: text("exercise_id").notNull(),
    distance: doublePrecision("distance").notNull(),
    unit: text("unit").$type<DistanceUnit>().notNull().default("km"),
    durationSeconds: integer("duration_seconds"),
    routineSlug: text("routine_slug"),
    weekNumber: integer("week_number"),
    dayNumber: integer("day_number"),
    setNumber: integer("set_number"),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("cardio_entries_user_exercise_idx").on(table.userId, table.exerciseId),
  ],
).enableRLS();

/** Girth measurements, one row per site per session. */
export const measurements = pgTable(
  "measurements",
  {
    ...owned(),
    measuredAt: bigint("measured_at", { mode: "number" }).notNull(),
    site: text("site").$type<MeasurementSite>().notNull(),
    side: text("side").$type<"left" | "right">(),
    value: doublePrecision("value").notNull(),
    unit: text("unit").$type<LengthUnit>().notNull().default("cm"),
    notes: text("notes"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] })],
).enableRLS();

/** What you ate: a ticked plan meal, or an off-plan item. */
export const intakeEntries = pgTable(
  "intake_entries",
  {
    ...owned(),
    /** Local calendar day, epoch ms — what the panel buckets by. */
    day: bigint("day", { mode: "number" }).notNull(),
    loggedAt: bigint("logged_at", { mode: "number" }).notNull(),
    /**
     * jsonb inside an otherwise-columned table, deliberately: `source` is a
     * discriminated union, and splitting it into columns would mean four
     * nullable ones where exactly two are ever set together. `day` is what
     * gets queried; this is read whole with the row.
     */
    source: jsonb("source").$type<IntakeSource>().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index("intake_entries_user_day_idx").on(table.userId, table.day),
  ],
).enableRLS();

/**
 * Everything you *authored* — custom exercises, routines, foods, recipes and
 * diet plans — in one table, discriminated by `kind`.
 *
 * **One table rather than five, and a blob rather than columns**, for the
 * reason `profiles` above gives: these are documents read whole and queried
 * client-side, never across users, and several are deeply nested (a routine
 * carries weeks → days → exercises → prescriptions). Flattening those into
 * columns would be a fiction. Their access patterns are identical — fetch
 * mine of one kind, upsert, delete — so five tables would be the same three
 * queries written five times, and a sixth authored type later would need a
 * migration where this needs nothing.
 *
 * The time-series tables above are the counter-example and stay columned:
 * they grow without bound and are what partial sync would have to slice.
 */
export const userDocuments = pgTable(
  "user_documents",
  {
    ...owned(),
    /** `exercise` | `routine` | `food` | `recipe` | `diet`. */
    kind: text("kind").notNull(),
    data: jsonb("data").notNull(),
  },
  (table) => [
    // Ids are unique per kind, not globally: a routine and a diet are both
    // keyed by a slug the user's own naming produced.
    primaryKey({ columns: [table.userId, table.kind, table.id] }),
  ],
).enableRLS();
// RLS with no policies = deny-all for the Data API roles. The Data API is
// disabled at the project level, so this is belt and braces for the day
// someone re-enables it; Drizzle connects as the table owner and is
// unaffected. Every table in this schema should carry it.
