-- Workout completions: proof a session was run to "Finish", with no weight
-- or reps — so it can never register as a PR the way a logged set can. What
-- lets pressing Finish count a day as trained without a logged set.
--
-- Applied by hand in the Supabase SQL editor rather than by `drizzle-kit
-- push`, which cannot introspect this Postgres version. See CLAUDE.md.

CREATE TABLE "workout_completions" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"routine_slug" text NOT NULL,
	"week_number" integer NOT NULL,
	"day_number" integer NOT NULL,
	"performed_at" bigint NOT NULL,
	CONSTRAINT "workout_completions_user_id_id_pk" PRIMARY KEY("user_id","id")
);

ALTER TABLE "workout_completions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "workout_completions" ADD CONSTRAINT "workout_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "workout_completions_user_routine_idx" ON "workout_completions" USING btree ("user_id","routine_slug");
CREATE INDEX "workout_completions_user_performed_idx" ON "workout_completions" USING btree ("user_id","performed_at");
