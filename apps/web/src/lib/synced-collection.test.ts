import { beforeEach, describe, expect, it } from "vitest";
import { createCollection, localStorageCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";
import { sessionStore } from "@/features/auth/session-store";
import { forkCollection } from "./synced-collection";

/**
 * The security property, pinned: a synced collection belongs to one account
 * and is never handed to the next one.
 *
 * This is the regression test for a real cross-account leak. The instance was
 * memoised in a bare `synced ??=` with no owner and a cache key of
 * `[queryKey]`, and signing out doesn't reload the app — so on a shared
 * browser the second person to sign in got the first person's populated
 * collection, and `/progress` painted their logged sets and weigh-ins.
 *
 * The module's own teardown runs off a `sessionStore` subscription behind a
 * `document` guard, so it doesn't fire under Node. That's the point of
 * testing here: what's exercised is the check inside the getter, which is the
 * guarantee rather than the tidying — however the subscription behaves, a
 * collection built for someone else must never come back out.
 */

const rowSchema = z.object({ id: z.string() });

function makeFork(key: string) {
  return forkCollection({
    queryKey: key,
    local: createCollection(
      localStorageCollectionOptions({
        storageKey: `test.${key}`,
        getKey: (row: { id: string }) => row.id,
        schema: rowSchema,
      }),
    ),
    getKey: (row: { id: string }) => row.id,
    // Never actually called: nothing subscribes, so the collection stays idle.
    fetch: () => Promise.resolve([]),
    upsert: () => Promise.resolve(),
    remove: () => Promise.resolve(),
  });
}

function signIn(userId: string) {
  sessionStore.setState(() => ({
    status: "signed-in",
    userId,
    email: `${userId}@example.com`,
    name: null,
    avatarUrl: null,
  }));
}

function signOut() {
  sessionStore.setState(() => ({
    status: "signed-out",
    userId: null,
    email: null,
    name: null,
    avatarUrl: null,
  }));
}

beforeEach(signOut);

describe("a forked collection", () => {
  it("reads local while signed out", () => {
    const fork = makeFork("signed-out");
    expect(fork.active()).toBe(fork.local);
  });

  it("reads the synced collection while signed in", () => {
    const fork = makeFork("signed-in");
    signIn("user-a");
    expect(fork.active()).not.toBe(fork.local);
  });

  it("hands the same instance back for the same account", () => {
    const fork = makeFork("stable");
    signIn("user-a");
    expect(fork.active()).toBe(fork.active());
  });

  it("never hands one account's collection to another", () => {
    const fork = makeFork("handover");
    signIn("user-a");
    const forA = fork.active();

    // The shared-browser sequence, exactly as the app performs it: no reload
    // between the two, because signing out doesn't cause one.
    signOut();
    expect(fork.active()).toBe(fork.local);

    signIn("user-b");
    expect(fork.active()).not.toBe(forA);
  });

  it("catches one account replacing another with no sign-out between", () => {
    // A token refresh that resolves to a different user never passes through
    // `signed-out`, so a boolean signed-in/signed-out check would miss it.
    const fork = makeFork("swap");
    signIn("user-a");
    const forA = fork.active();
    signIn("user-b");
    expect(fork.active()).not.toBe(forA);
  });
});
