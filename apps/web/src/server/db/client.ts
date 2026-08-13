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
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
