import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COUNTRY_BANDS, ECOSYSTEM_GROUPS, type CountryCompany } from "@/lib/constants";
import { youtubeClipEmbedUrl } from "@/lib/video";

const publicFile = (p: string) => existsSync(join(process.cwd(), "public", p));

describe("COUNTRY_BANDS", () => {
  it("lists the five countries in the agreed order", () => {
    expect(COUNTRY_BANDS.map((b) => b.id)).toEqual([
      "usa",
      "taiwan",
      "china",
      "south-korea",
      "netherlands",
    ]);
  });

  it("gives every country a usable video window", () => {
    for (const band of COUNTRY_BANDS) {
      const { youtubeId, start, end } = band.clip;
      expect(youtubeClipEmbedUrl(youtubeId, start, end), band.id).not.toBeNull();
      expect(end - start, band.id).toBeGreaterThanOrEqual(15);
    }
  });

  it("points every company at an https website", () => {
    for (const band of COUNTRY_BANDS) {
      expect(band.companies.length, band.id).toBeGreaterThan(0);
      for (const company of band.companies) {
        expect(new URL(company.href).protocol, company.name).toBe("https:");
      }
    }
  });

  it("only references flag, map and logo files that exist", () => {
    for (const band of COUNTRY_BANDS) {
      expect(publicFile(band.flag), band.flag).toBe(true);
      expect(publicFile(band.map), band.map).toBe(true);
      for (const company of band.companies) {
        if (company.logo) expect(publicFile(company.logo), company.logo).toBe(true);
      }
    }
  });

  it("keeps a text fallback for companies without a logo (Micron)", () => {
    const micron = COUNTRY_BANDS.flatMap((b): readonly CountryCompany[] => b.companies).find(
      (c) => c.name === "Micron"
    );
    expect(micron?.logo).toBeNull();
  });
});

describe("ECOSYSTEM_GROUPS", () => {
  it("covers the five roles once each", () => {
    expect(ECOSYSTEM_GROUPS.map((g) => g.id)).toEqual([
      "equipment",
      "foundries",
      "idm",
      "fabless",
      "osat",
    ]);
  });

  it("only references logo files that exist", () => {
    for (const group of ECOSYSTEM_GROUPS)
      for (const item of group.items)
        if (item.logo) expect(publicFile(item.logo), item.logo).toBe(true);
  });
});
