import { asyncDebounce } from "@tanstack/pacer";
import { sessionStore } from "@/features/auth/session-store";
import { fetchProfile, saveProfile } from "@/server/profile";
import { adoptProviderIdentity } from "./identity";
import { profileStore } from "./profile-store";

/**
 * Keeps the profile in step with the account.
 *
 * The profile isn't a collection — it's one always-present record — so it
 * can't fork its backing the way `bodyEntries` does. It stays a localStorage
 * store on every device, and this module mirrors it to the server while
 * signed in. Imported for its side effect, like `theme-store`.
 *
 * **Fields merge; they don't replace — but only for the account the local
 * record already belongs to.** On sign-in the server's values win per field
 * and the local ones fill the gaps, then the merged result is pushed back.
 * Adopting the server's record wholesale would have been simpler and is wrong
 * in a way you'd only find later: sign in on a fresh browser before ever
 * setting a height and the empty record it uploads would erase the height on
 * the device that had one.
 *
 * That reasoning holds for *you* on a second device and breaks completely for
 * a second *person* on a shared one. The local store isn't cleared on sign-out
 * and carries a real name, a provider photo, height, sex and two girths — so
 * merging it under whoever signs in next wrote one person's identity and body
 * metrics into another person's account, persistently, and then synced it to
 * their other devices. `ownerKey` is what tells those two cases apart: same
 * account (or a record this device built while signed out) merges; a
 * different account adopts the server's record wholesale instead.
 */

/** Which account the local profile belongs to. */
const OWNER_KEY = "natty.profile.owner.v1";

/**
 * Kept beside the profile rather than inside it: `profileSchema` is the
 * payload that goes to the server and into a backup file, and an owner id in
 * there would be a field the server round-trips and a backup carries between
 * accounts — which is the problem, not the fix.
 */
function storedOwner(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(OWNER_KEY);
}

function rememberOwner(userId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(OWNER_KEY, userId);
}

/**
 * Whether this device's local profile may be folded into the account signing
 * in — the whole of the decision, exported so it can be tested without a
 * server or a browser.
 *
 * `null` is deliberately permissive: a record built while signed out belongs
 * to whoever is at the keyboard, and seeding a new account from it is what
 * the merge is *for*. Only a different, known owner is refused.
 */
export function mayMergeLocalProfile(
  owner: string | null,
  userId: string,
): boolean {
  return owner === null || owner === userId;
}

/** Suppresses the push that adopting the server's own values would trigger. */
let applyingRemote = false;

/**
 * Height is written straight through on change (`ProfileFields` has no submit
 * button), so typing "178" is three writes. Debounced rather than throttled:
 * what matters is the value you stopped on.
 */
const pushProfile = asyncDebounce(
  async () => {
    await saveProfile({ data: profileStore.state });
  },
  { wait: 800 },
);

async function adoptRemote(userId: string): Promise<void> {
  const isMine = mayMergeLocalProfile(storedOwner(), userId);
  const remote = await fetchProfile();

  applyingRemote = true;
  if (isMine) {
    if (remote) profileStore.setState((local) => ({ ...local, ...remote }));
  } else {
    // Wholesale, and empty when the account has no record yet: anything
    // carried over from the previous person is exactly what must not be.
    profileStore.setState(() => remote ?? {});
  }

  // After the adopt, never before: the provider's name and picture only fill
  // what's empty, so seeding first would have been overruled by the values we
  // just decided to discard, leaving the new account with the old one's face.
  const { email, name, avatarUrl } = sessionStore.state;
  applyingRemote = false;
  adoptProviderIdentity({ email, name, avatarUrl });

  rememberOwner(userId);

  // Pushed either way: with no row yet this seeds the account from this
  // device, and with one it writes back the merge that just happened.
  await saveProfile({ data: profileStore.state });
}

if (typeof document !== "undefined") {
  let signedInAs =
    sessionStore.state.status === "signed-in" ? sessionStore.state.userId : null;
  if (signedInAs !== null) void adoptRemote(signedInAs);

  sessionStore.subscribe(() => {
    const { status, userId } = sessionStore.state;
    const next = status === "signed-in" ? userId : null;
    // Only on a change of account — the store also fires for a token refresh
    // and for the profile-relevant fields resolving, neither of which is a
    // new sign-in. Comparing the *id* rather than a boolean also catches one
    // account replacing another with no signed-out state in between.
    if (next !== signedInAs) {
      signedInAs = next;
      if (next !== null) void adoptRemote(next);
    }
  });

  profileStore.subscribe(() => {
    if (applyingRemote) return;
    if (sessionStore.state.status !== "signed-in") return;
    void pushProfile();
  });
}
