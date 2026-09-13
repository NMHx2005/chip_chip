import { describe, expect, it } from "vitest";
import { shouldClearDirty } from "@/components/admin/saveRevision";

/**
 * Regression tests for the save-during-typing race.
 *
 * `saveAll` used to clear `dirty` unconditionally once every locale's
 * request resolved, discarding whatever the user typed while the request
 * was in flight. `shouldClearDirty` is the rule that replaces that: compare
 * the revision counter captured at send time against the counter read after
 * the save resolves.
 */
describe("shouldClearDirty", () => {
  it("clears dirty when the revision has not moved since the save was sent", () => {
    expect(shouldClearDirty(3, 3)).toBe(true);
  });

  it("keeps dirty when the revision moved during the save", () => {
    // The user typed more while the request was in flight.
    expect(shouldClearDirty(3, 4)).toBe(false);
  });

  it("evaluates each locale independently: one moved, the other did not", () => {
    // vi was edited during the save, en was left untouched.
    expect(shouldClearDirty(1, 2)).toBe(false);
    expect(shouldClearDirty(5, 5)).toBe(true);
  });
});
