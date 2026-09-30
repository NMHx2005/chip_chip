import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Every `@media (prefers-reduced-motion: reduce) { ... }` block, one level deep. */
function reducedMotionBlocks(source: string): string[] {
  const blocks: string[] = [];
  const marker = "@media (prefers-reduced-motion: reduce)";
  let from = 0;
  for (;;) {
    const start = source.indexOf(marker, from);
    if (start === -1) return blocks;
    const open = source.indexOf("{", start);
    let depth = 0;
    let i = open;
    for (; i < source.length; i++) {
      if (source[i] === "{") depth++;
      if (source[i] === "}" && --depth === 0) break;
    }
    blocks.push(source.slice(open + 1, i));
    from = i;
  }
}

describe("staggered entrance under prefers-reduced-motion", () => {
  it("switches .hero-in off instead of only shortening it", () => {
    // The global reduce rule shortens durations but keeps animation-delay, so a
    // delayed item would sit at opacity 0 before appearing. Turning the
    // animation off shows the final state immediately.
    const rule = reducedMotionBlocks(css).find((block) => block.includes(".hero-in"));
    expect(rule, "a reduced-motion block that mentions .hero-in").toBeDefined();
    expect(rule).toMatch(/\.hero-in\s*\{[^}]*animation:\s*none/);
  });
});
