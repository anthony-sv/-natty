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
  /**
   * What to call you — the **private** half of the name pair.
   *
   * Seeded from the provider, so it's usually your real name, and it is not
   * an identity: nothing keys on it and nothing checks it's unique. The
   * public, unique one is the handle, which lives server-side in its own
   * table because uniqueness can't be enforced from here — see
   * `features/profile/handle.ts`.
   */
  displayName: z.string().min(1).max(40).optional(),
  /**
   * A provider's avatar, when it gave one. Never uploaded by the app: hosting
   * user images is a whole feature, and initials in a circle answer the same
   * question — which account am I looking at.
   */
  avatarUrl: z.string().url().optional(),
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
  /**
   * Which girths the measurement form asks for.
   *
   * A preference rather than a fixed list, because nine sites × two sides is
   * thirteen inputs on a form where most people fill three. Absent means the
   * default trio (`DEFAULT_TRACKED_SITES`) — not "none", so a first-time form
   * has something on it.
   *
   * Untyped as `MeasurementSite[]` on purpose: `profileSchema` is parsed by
   * the backup reader, and a site retired from the enum later shouldn't make
   * an old backup unreadable. The form filters to what it knows.
   */
  trackedSites: z.array(z.string()).optional(),
  /**
   * Which of those you measure left and right separately.
   *
   * A subset rather than one global switch. The switch meant ticking it gave
   * you eight inputs when you only wanted two — you might well measure both
   * arms and one thigh, and being made to choose for all four paired sites at
   * once is a decision nobody has an answer to.
   */
  sidedSites: z.array(z.string()).optional(),
  /**
   * The switch `sidedSites` replaced. Kept only so an existing preference
   * survives one more load: `MeasurementForm` seeds `sidedSites` from it and
   * then it stops mattering.
   *
   * @deprecated
   */
  trackSides: z.boolean().optional(),
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
