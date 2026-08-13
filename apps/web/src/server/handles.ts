import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { handleProblem, normalizeHandle } from "@/features/profile/handle";
import { authMiddleware } from "./auth";
import { db } from "./db/client";
import { handles } from "./db/schema";

/**
 * Claiming `@you`.
 *
 * The rules are `features/profile/handle.ts`, imported rather than restated —
 * the field checks with the same function that decides, so it can't tell you
 * something is fine and then be refused.
 */

export type ClaimResult =
  | { ok: true; handle: string }
  | { ok: false; reason: "invalid" | "taken" };

export const fetchHandle = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<string | null> => {
    const [row] = await db()
      .select({ handle: handles.handle })
      .from(handles)
      .where(eq(handles.userId, context.userId));
    return row?.handle ?? null;
  });

export const claimHandle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.string())
  .handler(async ({ context, data }): Promise<ClaimResult> => {
    const handle = normalizeHandle(data);
    if (handleProblem(handle) !== undefined) return { ok: false, reason: "invalid" };

    const [existing] = await db()
      .select({ userId: handles.userId })
      .from(handles)
      .where(eq(handles.handle, handle));
    // Re-claiming your own is a no-op rather than an error — the field
    // submits on blur, so pressing save twice must not report a conflict
    // with yourself.
    if (existing) {
      return existing.userId === context.userId
        ? { ok: true, handle }
        : { ok: false, reason: "taken" };
    }

    try {
      // The check above is a courtesy, not the guard: two people claiming the
      // same handle in the same instant both pass it, and the primary key is
      // what actually decides. A caught violation is the loser being told.
      await db()
        .insert(handles)
        .values({ handle, userId: context.userId, claimedAt: Date.now() })
        .onConflictDoUpdate({
          // Only your *own* row may move to a new handle. Someone else's is
          // an insert that hits the primary key and throws.
          target: handles.userId,
          set: { handle, claimedAt: Date.now() },
        });
    } catch {
      return { ok: false, reason: "taken" };
    }

    return { ok: true, handle };
  });
