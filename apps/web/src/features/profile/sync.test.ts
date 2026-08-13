import { describe, expect, it } from "vitest";
import { mayMergeLocalProfile } from "./sync";

/**
 * The regression test for a cross-account PII write.
 *
 * The local profile carries a real name, a provider photo, height, sex and
 * two girths, and isn't cleared on sign-out. Sign-in merged it under whoever
 * signed in next and then **pushed the merge to their account** — so on a
 * shared browser one person's identity and body metrics landed in another
 * person's row, persistently, and synced on to their other devices. Worst
 * case was a brand-new account, where the server has no record at all and the
 * previous person's profile was uploaded verbatim as theirs.
 */
describe("mayMergeLocalProfile", () => {
  it("merges a record this device built while signed out", () => {
    // The case the merge exists for: whatever you set before making an
    // account is yours, and seeding the new account from it is the point.
    expect(mayMergeLocalProfile(null, "user-a")).toBe(true);
  });

  it("merges your own record on a second device", () => {
    // The other case the merge exists for: signing in on a fresh browser
    // must not upload an empty record over the height you already set.
    expect(mayMergeLocalProfile("user-a", "user-a")).toBe(true);
  });

  it("refuses to merge another account's record", () => {
    // The leak. A signs out, B signs in, and none of A's profile may travel.
    expect(mayMergeLocalProfile("user-a", "user-b")).toBe(false);
  });
});
