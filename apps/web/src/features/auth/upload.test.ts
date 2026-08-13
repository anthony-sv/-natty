import { describe, expect, it } from "vitest";
import { belongsToAnotherAccount } from "./upload";

/**
 * The shared-device guard.
 *
 * Uploading pours this device's local data into whichever account is signed
 * in, which is right on your own device and wrong on a borrowed one. The
 * preview dialog is the primary protection — a year of someone else's
 * training is unmistakable as a list of counts — and this is the stronger
 * warning shown when the device is *known* to have been claimed by someone
 * else.
 */
describe("belongsToAnotherAccount", () => {
  it("says nothing about a device nobody has uploaded from", () => {
    // The common case, and deliberately not a warning: a fresh device has no
    // owner to compare against, and crying wolf here would train people to
    // click through the dialog that matters.
    expect(belongsToAnotherAccount(null, "user-a")).toBe(false);
  });

  it("stays quiet for the account that claimed the device", () => {
    expect(belongsToAnotherAccount("user-a", "user-a")).toBe(false);
  });

  it("warns when someone else claimed this device", () => {
    expect(belongsToAnotherAccount("user-a", "user-b")).toBe(true);
  });
});
