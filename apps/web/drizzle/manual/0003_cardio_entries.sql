-- Cardio distance logging: one table, mirroring logged_sets.
--
-- Applied by hand in the Supabase SQL editor rather than by `drizzle-kit
-- push`, which cannot introspect this Postgres version. See CLAUDE.md.

CREATE TABLE "cardio_entries" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"performed_at" bigint NOT NULL,
	"exercise_id" text NOT NULL,
	"distance" double precision NOT NULL,
	"unit" text DEFAULT 'km' NOT NULL,
	"duration_seconds" integer,
	"routine_slug" text,
	"week_number" integer,
	"day_number" integer,
	"set_number" integer,
	CONSTRAINT "cardio_entries_user_id_id_pk" PRIMARY KEY("user_id","id")
);

ALTER TABLE "cardio_entries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "cardio_entries" ADD CONSTRAINT "cardio_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "cardio_entries_user_exercise_idx" ON "cardio_entries" USING btree ("user_id","exercise_id");
