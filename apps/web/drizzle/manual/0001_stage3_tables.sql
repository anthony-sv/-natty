-- Stage 3 tables: the set log, measurements, intake, and authored documents.
--
-- Applied by hand in the Supabase SQL editor rather than by `drizzle-kit
-- push`, which cannot introspect this Postgres version (it trips over the
-- not-null CHECK constraints the server reports). See CLAUDE.md.

CREATE TABLE "intake_entries" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"day" bigint NOT NULL,
	"logged_at" bigint NOT NULL,
	"source" jsonb NOT NULL,
	CONSTRAINT "intake_entries_user_id_id_pk" PRIMARY KEY("user_id","id")
);

ALTER TABLE "intake_entries" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "logged_sets" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"performed_at" bigint NOT NULL,
	"exercise_id" text NOT NULL,
	"weight" double precision,
	"unit" text DEFAULT 'kg' NOT NULL,
	"reps" integer NOT NULL,
	"routine_slug" text,
	"week_number" integer,
	"day_number" integer,
	"set_number" integer,
	CONSTRAINT "logged_sets_user_id_id_pk" PRIMARY KEY("user_id","id")
);

ALTER TABLE "logged_sets" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "measurements" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"measured_at" bigint NOT NULL,
	"site" text NOT NULL,
	"side" text,
	"value" double precision NOT NULL,
	"unit" text DEFAULT 'cm' NOT NULL,
	"notes" text,
	CONSTRAINT "measurements_user_id_id_pk" PRIMARY KEY("user_id","id")
);

ALTER TABLE "measurements" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "user_documents" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "user_documents_user_id_kind_id_pk" PRIMARY KEY("user_id","kind","id")
);

ALTER TABLE "user_documents" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "intake_entries" ADD CONSTRAINT "intake_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "logged_sets" ADD CONSTRAINT "logged_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "measurements" ADD CONSTRAINT "measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "intake_entries_user_day_idx" ON "intake_entries" USING btree ("user_id","day");

CREATE INDEX "logged_sets_user_exercise_idx" ON "logged_sets" USING btree ("user_id","exercise_id");

CREATE INDEX "logged_sets_user_performed_idx" ON "logged_sets" USING btree ("user_id","performed_at");
