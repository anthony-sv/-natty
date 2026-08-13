import { asyncDebounce } from "@tanstack/pacer";
import { sessionStore } from "@/features/auth/session-store";
import { fetchProfile, saveProfile } from "@/server/profile";
import { profileStore } from "./profile-store";

/**
 * Keeps the profile in step with the account.
 *
 * The profile isn't a collection — it's one always-present record — so it
 * can't fork its backing the way `bodyEntries` does. It stays a localStorage
 * store on every device, and this module mirrors it to the server while
 * signed in. Imported for its side effect, like `theme-store`.
 *
 * **Fields merge; they don't replace.** On sign-in the server's values win
 * per field and the local ones fill the gaps, then the merged result is
 * pushed back. Adopting the server's record wholesale would have been simpler
 * and is wrong in a way you'd only find later: sign in on a fresh browser
 * before ever setting a height and the empty record it uploads would erase
 * the height on the device that had one. Every field is optional, so a
 * per-field merge can't lose anything.
 */

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

async function adoptRemote(): Promise<void> {
  const remote = await fetchProfile();
  if (remote) {
    applyingRemote = true;
    profileStore.setState((local) => ({ ...local, ...remote }));
    applyingRemote = false;
  }
  // Pushed either way: with no row yet this seeds the account from this
  // device, and with one it writes back the merge that just happened.
  await saveProfile({ data: profileStore.state });
}

if (typeof document !== "undefined") {
  let wasSignedIn = sessionStore.state.status === "signed-in";
  if (wasSignedIn) void adoptRemote();

  sessionStore.subscribe(() => {
    const isSignedIn = sessionStore.state.status === "signed-in";
    // Only on the transition — the store also fires for the email resolving
    // and for a token refresh, neither of which is a new sign-in.
    if (isSignedIn && !wasSignedIn) void adoptRemote();
    wasSignedIn = isSignedIn;
  });

  profileStore.subscribe(() => {
    if (applyingRemote) return;
    if (sessionStore.state.status !== "signed-in") return;
    void pushProfile();
  });
}
