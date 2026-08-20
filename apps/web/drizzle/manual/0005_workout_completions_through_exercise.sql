-- Records how far into the day a completion actually got — a position in
-- day.exercises, the same index every SessionStep carries. Nullable: rows
-- written before this column existed have no value and read as "the whole
-- day", which was already true of every completion so far (only a full
-- "Finish" ever wrote one). What lets "End workout" credit partial progress
-- instead of nothing, without inventing exercises you never reached.
--
-- Applied by hand in the Supabase SQL editor rather than by `drizzle-kit
-- push`, which cannot introspect this Postgres version. See CLAUDE.md.

ALTER TABLE "workout_completions" ADD COLUMN "through_exercise_index" integer;
