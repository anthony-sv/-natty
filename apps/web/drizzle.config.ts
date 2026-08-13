import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Vite, so the app's .env isn't loaded for it —
// Node has had this built in since 20.12. Missing file is fine (CI passes
// DATABASE_URL directly).
try {
  process.loadEnvFile(".env");
} catch {
  // no .env — rely on the environment
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Supabase owns `auth`, `storage`, etc. — drizzle-kit must only ever
  // manage `public`, or a push would try to reconcile Supabase's own tables.
  schemaFilter: ["public"],
});
