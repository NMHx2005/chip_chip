import { describe, expect, it } from "vitest";
import { applySaveResult, planSave } from "@/components/admin/saveRevision";
import { routing } from "@/i18n/routing";

/**
 * Regression tests for the save-during-typing race.
 *
 * `saveAll` used to clear `dirty` unconditionally once every locale's
 * request resolved, and read `drafts`/`dirty` from the closure captured at
 * click time — both discarded (or silently skipped) whatever the user
 * typed while a request was in flight. `planSave` and `applySaveResult` are
 * the two pieces of decision logic that replace that, extracted so a
 * regression in either shows up here instead of only in production.
 */

type FakeDraft = { id: string; title: string };

const drafts: Record<"vi" | "en", FakeDraft> = {
  vi: { id: "vi-1", title: "Xin chào" },
  en: { id: "en-1", title: "Hello" },
};

describe("planSave", () => {
  it("an empty-id locale never appears in the plan", () => {
    const missingEn = { vi: drafts.vi, en: { id: "", title: "" } };
    const plan = planSave(
      routing.locales,
      { vi: true, en: true },
      missingEn,
      { vi: 0, en: 0 }
    );

    expect(plan.map((entry) => entry.locale)).toEqual(["vi"]);
  });

  it("a plan built from stale dirty does not silently drop a locale that is dirty now", () => {
    // Captured before `en` became dirty during `vi`'s in-flight save — this
    // is exactly the closure snapshot the old `saveAll` kept reusing.
    const staleDirty = { vi: true, en: false };
    // The live value by the time `en`'s turn in the loop is reached.
    const freshDirty = { vi: true, en: true };
    const revisions = { vi: 0, en: 0 };

    expect(
      planSave(routing.locales, staleDirty, drafts, revisions).map(
        (entry) => entry.locale
      )
    ).not.toContain("en");

    expect(
      planSave(routing.locales, freshDirty, drafts, revisions).map(
        (entry) => entry.locale
      )
    ).toContain("en");
  });

  it("skips a locale that is not dirty", () => {
    const plan = planSave(routing.locales, { vi: true, en: false }, drafts, {
      vi: 0,
      en: 0,
    });

    expect(plan.map((entry) => entry.locale)).toEqual(["vi"]);
  });
});

describe("applySaveResult", () => {
  it("clears dirty when the revision has not moved since the save was sent", () => {
    const next = applySaveResult({ vi: true, en: true }, "vi", 3, 3);
    expect(next.vi).toBe(false);
  });

  it("keeps dirty when the revision moved during the save", () => {
    // The user typed more into `vi` while its request was in flight.
    const next = applySaveResult({ vi: true, en: true }, "vi", 3, 4);
    expect(next.vi).toBe(true);
  });

  it("a locale edited during another locale's flight keeps its flag while the other's is cleared", () => {
    let dirty = { vi: true, en: true };
    // `vi`'s save was sent at revision 1 and nothing changed before it
    // resolved.
    dirty = applySaveResult(dirty, "vi", 1, 1);
    // `en`'s save was also sent at revision 1, but the user kept typing
    // into `en` while that request was in flight — its revision moved to 2
    // by the time the result comes back.
    dirty = applySaveResult(dirty, "en", 1, 2);

    expect(dirty).toEqual({ vi: false, en: true });
  });
});
