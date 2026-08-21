-- The bioimpedance-scale "rating" (1-59, unitless — Omron/Tanita-style
-- consumer scales, not a percentage). Nullable: a weigh-in with no visceral
-- fat reading is still a real entry, same as bodyFatPercent already allows.
--
-- Applied by hand rather than by `drizzle-kit push`, which cannot introspect
-- this Postgres version. See CLAUDE.md.

ALTER TABLE "body_entries" ADD COLUMN "visceral_fat" double precision;
