import { describe, expect, it } from "vitest";
import { DEFAULT_LISTING } from "@/lib/listing-params";
import {
  activeFilterCount,
  activeScope,
  isFiltered,
  videoHeroStats,
  withHash,
} from "@/lib/video-listing";

const labels = {
  platform: (p: string) => `P:${p}`,
  source: (s: string) => `S:${s}`,
  topic: (t: string) => `T:${t}`,
  difficulty: (d: string) => `D:${d}`,
};

describe("activeFilterCount", () => {
  it("is 0 for the default listing", () => {
    expect(activeFilterCount(DEFAULT_LISTING)).toBe(0);
  });

  it("counts each of platform, source, topic and difficulty", () => {
    expect(
      activeFilterCount({
        ...DEFAULT_LISTING,
        platform: "youtube",
        source: "own",
        topic: "nguyen-ly",
        difficulty: "basic",
      })
    ).toBe(4);
  });

  it("does not count sort or page", () => {
    expect(activeFilterCount({ ...DEFAULT_LISTING, sort: "oldest", page: 3 })).toBe(0);
  });
});

describe("isFiltered", () => {
  it("is false by default and with only a page", () => {
    expect(isFiltered(DEFAULT_LISTING)).toBe(false);
    expect(isFiltered({ ...DEFAULT_LISTING, page: 2 })).toBe(false);
  });

  it("is true for a filter or a non-default sort", () => {
    expect(isFiltered({ ...DEFAULT_LISTING, platform: "tiktok" })).toBe(true);
    expect(isFiltered({ ...DEFAULT_LISTING, sort: "hardest" })).toBe(true);
  });
});

describe("activeScope", () => {
  it("is empty without filters", () => {
    expect(activeScope(DEFAULT_LISTING, labels)).toEqual([]);
  });

  it("lists active filters in the order platform, source, topic, difficulty", () => {
    expect(
      activeScope(
        { ...DEFAULT_LISTING, difficulty: "advanced", platform: "youtube", topic: "lich-su", source: "own" },
        labels
      )
    ).toEqual(["P:youtube", "S:own", "T:lich-su", "D:advanced"]);
  });

  it("skips filters that are not set", () => {
    expect(activeScope({ ...DEFAULT_LISTING, topic: "ung-dung" }, labels)).toEqual(["T:ung-dung"]);
  });
});

describe("videoHeroStats", () => {
  it("shows the real total, the two platforms and the four topics", () => {
    expect(videoHeroStats({ total: 34 })).toEqual([
      { key: "videos", value: 34 },
      { key: "platforms", value: 2 },
      { key: "topics", value: 4 },
    ]);
  });

  it("keeps a zero total", () => {
    expect(videoHeroStats({ total: 0 })[0]).toEqual({ key: "videos", value: 0 });
  });
});

describe("withHash", () => {
  it("adds the hash to an object href", () => {
    expect(withHash({ pathname: "/video", query: { page: "2" } }, "danh-sach")).toEqual({
      pathname: "/video",
      query: { page: "2" },
      hash: "danh-sach",
    });
  });

  it("leaves a string href alone", () => {
    expect(withHash("/video", "danh-sach")).toBe("/video");
  });
});
