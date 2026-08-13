/**
 * The public name — `@you` — as opposed to the private one.
 *
 * `Profile.displayName` is what *you* see: seeded from the provider, so it's
 * usually your real name, and it stays on your own device and your own
 * account. A handle is the opposite: it's the thing that would appear on
 * something you shared, so it's chosen rather than inherited, and it has to be
 * unique — which is why it lives in its own table with a unique index rather
 * than in the profile blob. Uniqueness is not a claim a client can make.
 *
 * Nothing public exists yet. The namespace is being reserved *because* of
 * that: handing out handles after people have picked names means backfilling
 * collisions, and there is no good answer for the two accounts that both
 * want `@anthony`.
 *
 * Pure and tested — the server validates with this exact function, so a
 * client-side check can't drift from the one that decides.
 */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;

/**
 * Lowercase letters, digits and underscores, starting with a letter.
 *
 * No dots or hyphens: they collide visually with each other and with the
 * dot-separated ids elsewhere in the app. No leading digit, so a handle can
 * never be mistaken for a number in a URL.
 */
const SHAPE = /^[a-z][a-z0-9_]*$/;

/**
 * Names the app might want for itself, or that would misrepresent someone.
 *
 * Short and boring on purpose: a long blocklist is a maintenance burden that
 * still misses the case you cared about, and the ones here are the ones that
 * would actually cause confusion in a URL or a conversation.
 */
const RESERVED = new Set([
  "natty",
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "api",
  "auth",
  "account",
  "settings",
  "about",
  "me",
  "you",
  "new",
  "edit",
  "null",
  "undefined",
]);

export type HandleProblem = "too-short" | "too-long" | "shape" | "reserved";

/**
 * Fold a typed handle to the form that's stored and compared.
 *
 * Case is *not* part of a handle: `@Anthony` and `@anthony` being different
 * people is how impersonation works. Stored lowercase, so the unique index
 * does the enforcing rather than every caller remembering to compare
 * case-insensitively.
 */
export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase();
}

/** What's wrong with it, or undefined if nothing is. */
export function handleProblem(input: string): HandleProblem | undefined {
  const handle = normalizeHandle(input);
  if (handle.length < HANDLE_MIN) return "too-short";
  if (handle.length > HANDLE_MAX) return "too-long";
  if (!SHAPE.test(handle)) return "shape";
  if (RESERVED.has(handle)) return "reserved";
  return undefined;
}

export function isValidHandle(input: string): boolean {
  return handleProblem(input) === undefined;
}

/**
 * A first suggestion, from whatever name we already have.
 *
 * Only ever a *suggestion* — it's offered in the field and can be typed over,
 * because deriving a public name from a real one without being asked is
 * exactly the thing the display/handle split exists to avoid.
 */
export function suggestHandle(from: string): string {
  const base = from
    .trim()
    .toLowerCase()
    .normalize("NFD")
    // Strip accents rather than dropping the letters under them: "Muñoz"
    // should suggest "munoz", not "muoz".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

  const withLetter = /^[a-z]/.test(base) ? base : `a${base}`;
  return withLetter.slice(0, HANDLE_MAX).replace(/_+$/, "");
}
