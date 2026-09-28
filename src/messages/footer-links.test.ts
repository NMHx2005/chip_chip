import { describe, expect, it } from "vitest";
import vi from "@/messages/vi.json";
import en from "@/messages/en.json";
import { FOOTER_LINKS } from "@/lib/constants";

/**
 * Regression test for the footer rendering raw translation keys: Footer.tsx
 * reads `footer.links.label` and `footer.links.<key>` for every entry in
 * FOOTER_LINKS, so those keys must exist (and be non-empty) in both
 * catalogues, not just be present as some value.
 */
describe("footer.links", () => {
  const catalogues = { vi, en };

  it.each(Object.entries(catalogues))("%s has a non-empty label", (_name, catalogue) => {
    expect(typeof catalogue.footer.links?.label).toBe("string");
    expect(catalogue.footer.links?.label.length).toBeGreaterThan(0);
  });

  it.each(Object.entries(catalogues))("%s has a non-empty string for every FOOTER_LINKS key", (_name, catalogue) => {
    for (const link of FOOTER_LINKS) {
      const value = catalogue.footer.links?.[link.key];
      expect(typeof value).toBe("string");
      expect(value?.length).toBeGreaterThan(0);
    }
  });
});
