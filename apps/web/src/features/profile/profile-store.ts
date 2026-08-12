import { Store } from "@tanstack/store";
import { z } from "zod";

const STORAGE_KEY = "natty.profile.v1";

/**
 * Standing facts about you, as opposed to anything you did on a given day.
 *
 * A plain TanStack Store persisted to localStorage, the same shape as
 * `session-store.ts` — a single always-present record with a handful of fields
 * doesn't want a queryable collection.
 */
export const profileSchema = z.object({
  /** Centimetres. Required for FFMI, which is mass over height squared. */
  heightCm: z.number().positive().optional(),
  /**
   * Only used to pick which population the FFMI reference scale is drawn
   * from — fat-free mass norms differ enough between them that one scale would
   * misdescribe half its readers. Optional: without it the numbers still show,
   * just without a band.
   */
  sex: z.enum(["male", "female"]).optional(),
  /**
   * Centimetres, measured at the narrowest point. Frame proxies for the
   * `/calculator` route: both are mostly bone and tendon, so they barely move
   * with training or body fat, which is what makes them usable as one. Stored
   * here rather than on a weigh-in for the same reason height is — they belong
   * to you, not to a given morning.
   */
  wristCm: z.number().positive().optional(),
  ankleCm: z.number().positive().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

function loadPersisted(): Profile {
  if (typeof localStorage === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = profileSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export const profileStore = new Store<Profile>(loadPersisted());

profileStore.subscribe(() => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profileStore.state));
});

export function setProfile(patch: Partial<Profile>): void {
  profileStore.setState((state) => ({ ...state, ...patch }));
}
