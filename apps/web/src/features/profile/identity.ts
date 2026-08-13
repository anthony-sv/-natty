import { profileStore, setProfile } from "./profile-store";

/**
 * Who the app calls you, and what it draws for you.
 *
 * Kept apart from the profile store so the sidebar, the account page and the
 * sign-in flow all answer the question the same way — there's more than one
 * plausible fallback and picking a different one per screen is how the same
 * user ends up looking like two.
 */

/** What a provider hands back about the person who just signed in. */
export interface ProviderIdentity {
  email: string | null;
  /** Google's `full_name` / `name`, when it gave one. */
  name?: string | null;
  avatarUrl?: string | null;
}

/**
 * Seed the profile from a provider, without ever overwriting your own edits.
 *
 * Both fields are **only filled when empty**: signing in again must not undo
 * a name you changed, and Google hands back the same `full_name` every time,
 * so a plain assignment would silently revert it on every sign-in.
 */
export function adoptProviderIdentity(identity: ProviderIdentity): void {
  const current = profileStore.state;
  const patch: { displayName?: string; avatarUrl?: string } = {};

  if (current.displayName === undefined) {
    const fromProvider = identity.name?.trim();
    // The local part of an email is a decent name and a terrible one — but it
    // beats an empty circle, and it's editable.
    const fromEmail = identity.email?.split("@")[0];
    const chosen = fromProvider || fromEmail;
    if (chosen) patch.displayName = chosen.slice(0, 40);
  }

  if (current.avatarUrl === undefined && identity.avatarUrl) {
    patch.avatarUrl = identity.avatarUrl;
  }

  if (Object.keys(patch).length > 0) setProfile(patch);
}

/**
 * The name to show, with a fallback chain that always lands somewhere.
 *
 * Signed out there is no account to name, so this is the one case that
 * returns undefined and lets the caller show its own prompt.
 */
export function displayName(
  chosen: string | undefined,
  email: string | null,
): string | undefined {
  return chosen ?? email?.split("@")[0] ?? email ?? undefined;
}

/**
 * One or two letters for the avatar fallback.
 *
 * Word initials where there are words ("Anthony Steiner" → AS), otherwise the
 * first two characters, because a single letter reads as a placeholder.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}
