import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldUseFirebaseEmulators } from "./firebaseRuntimeConfig.js";

describe("shouldUseFirebaseEmulators", () => {
  it("enables emulator mode when explicitly requested in development", () => {
    assert.equal(
      shouldUseFirebaseEmulators({ DEV: true, VITE_USE_FIREBASE_EMULATORS: "true" }, "localhost"),
      true
    );
  });

  it("disables emulator mode when explicitly disabled", () => {
    assert.equal(
      shouldUseFirebaseEmulators({ DEV: true, VITE_USE_FIREBASE_EMULATORS: "false" }, "localhost"),
      false
    );
  });

  it("defaults to emulator mode for local development hosts", () => {
    assert.equal(shouldUseFirebaseEmulators({ DEV: true }, "localhost"), true);
    assert.equal(shouldUseFirebaseEmulators({ DEV: true }, "127.0.0.1"), true);
  });
});
