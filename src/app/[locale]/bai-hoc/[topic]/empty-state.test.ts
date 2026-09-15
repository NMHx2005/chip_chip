import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("topic page empty state", () => {
  it("uses the topic empty copy, not the video coming-soon string", () => {
    const src = readFileSync(fileURLToPath(new URL("./page.tsx", import.meta.url)), "utf8");

    expect(src).not.toContain("videoComingSoon");
    expect(src).toContain('t("empty")');
  });
});
