import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only. Import this from server-function handlers and nowhere else —
 * it reads DATABASE_URL, which deliberately has no VITE_ prefix so Vite can
 * never bundle it client-side.
 *
 * **Connected on first query, not on import.** A module that throws while
 * being imported takes down everything that transitively imports it, however
 * little of it was going to be used: the data-layer tests import a collection,
 * which imports its server functions, which land here — and a test run has no
 * database and needs none, since a signed-out session resolves every
 * collection to its local backing.
 *
 * `prepare: false` is required, not tuning: DATABASE_URL points at Supabase's
 * transaction-mode pooler (port 6543), and transaction pooling can't hold
 * prepared statements across the connection handoffs.
 */
function connect() {
  // POSTGRES_URL is what the Supabase↔Vercel integration writes (already
  // pooled); DATABASE_URL is the local .env name and wins when both exist.
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("Neither DATABASE_URL nor POSTGRES_URL is set");
  }
  return drizzle(postgres(connectionString, { prepare: false }), { schema });
}

let instance: ReturnType<typeof connect> | undefined;

export function db(): ReturnType<typeof connect> {
  return (instance ??= connect());
}
