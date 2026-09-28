import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("topic page empty state", () => {
  it("uses the topic empty copy, not the video coming-soon string", () => {
    // The topic page renders the shared lessons listing; its empty state
    // lives there now.
    const src = readFileSync(
      fileURLToPath(new URL("../../../../components/lessons/LessonsListing.tsx", import.meta.url)),
      "utf8"
    );

    expect(src).not.toContain("videoComingSoon");
    expect(src).toContain('tTopics("empty")');
  });
});
