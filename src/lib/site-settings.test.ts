import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, readSettings } from "@/lib/site-settings";

describe("readSettings", () => {
  it("falls back to the code defaults when nothing is stored", () => {
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(readSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it("reads the four settings", () => {
    const settings = readSettings([
      { key: "contact_email", value: "xin-chao@example.com" },
      {
        key: "social_links",
        value: [
          { key: "facebook", href: "https://facebook.com/chipchip" },
          { key: "tiktok", href: "https://tiktok.com/@chipchip" },
        ],
      },
      { key: "response_time", value: { vi: "Trong 2 ngày", en: "Within 2 days" } },
      { key: "privacy_updated", value: "2026-10-02" },
    ]);

    expect(settings.contactEmail).toBe("xin-chao@example.com");
    expect(settings.socialLinks).toEqual([
      { key: "facebook", href: "https://facebook.com/chipchip" },
      { key: "tiktok", href: "https://tiktok.com/@chipchip" },
    ]);
    expect(settings.responseTime).toEqual({ vi: "Trong 2 ngày", en: "Within 2 days" });
    expect(settings.privacyUpdated).toBe("2026-10-02");
  });

  it("keeps both social icons in a known order even when the value is partial", () => {
    const settings = readSettings([
      { key: "social_links", value: [{ key: "tiktok", href: "https://tiktok.com/@x" }] },
    ]);
    expect(settings.socialLinks.map((link) => link.key)).toEqual(["facebook", "tiktok"]);
    expect(settings.socialLinks[0].href).toBe("");
    expect(settings.socialLinks[1].href).toBe("https://tiktok.com/@x");
  });

  it("drops a value of the wrong shape instead of failing", () => {
    // Anything malformed must leave the page rendering its defaults: this runs
    // on every public page.
    const settings = readSettings([
      { key: "contact_email", value: 42 },
      { key: "social_links", value: "nope" },
      { key: "response_time", value: ["vi"] },
      { key: "privacy_updated", value: "ngày 2 tháng 10" },
    ]);

    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("ignores a blank reply note so the message copy stays in charge", () => {
    const settings = readSettings([{ key: "response_time", value: { vi: "   ", en: "Later" } }]);
    expect(settings.responseTime).toEqual({ en: "Later" });
  });
});
