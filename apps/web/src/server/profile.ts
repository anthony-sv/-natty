import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { profileSchema, type Profile } from "@/features/profile/profile-store";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { profiles } from "./db/schema";

/**
 * The profile is one row, not a collection — so it gets a plain read and
 * write rather than the sync-collection treatment weigh-ins have.
 */

export const fetchProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Profile | null> => {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, context.userId));
    if (!row) return null;
    // Parsed on the way out too: a row written by an older version of the app
    // shouldn't hand an unknown shape to the store.
    const result = profileSchema.safeParse(row.data);
    return result.success ? result.data : null;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(profileSchema)
  .handler(async ({ context, data }) => {
    await db
      .insert(profiles)
      .values({ userId: context.userId, data })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { data: sql`excluded.data` },
      });
  });
