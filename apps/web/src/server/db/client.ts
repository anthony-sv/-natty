import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only. Import this from server-function handlers and nowhere else —
 * it reads DATABASE_URL, which deliberately has no VITE_ prefix so Vite can
 * never bundle it client-side.
 *
 * `prepare: false` is required, not tuning: DATABASE_URL points at Supabase's
 * transaction-mode pooler (port 6543), and transaction pooling can't hold
 * prepared statements across the connection handoffs.
 */
// POSTGRES_URL is what the Supabase↔Vercel integration writes (already
// pooled); DATABASE_URL is the local .env name and wins when both exist.
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("Neither DATABASE_URL nor POSTGRES_URL is set");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
