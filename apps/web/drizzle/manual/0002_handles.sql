-- The handles table: `@you`, unique across everyone.
--
-- Applied by hand in the Supabase SQL editor rather than by `drizzle-kit
-- push`, which cannot introspect this Postgres version. See CLAUDE.md.

CREATE TABLE "handles" (
	"handle" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"claimed_at" bigint NOT NULL,
	CONSTRAINT "handles_user_id_unique" UNIQUE("user_id")
);

ALTER TABLE "handles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "handles" ADD CONSTRAINT "handles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
