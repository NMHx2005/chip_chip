import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const shell = readFileSync(join(process.cwd(), "src/components/forum/ArticleShell.tsx"), "utf8");

describe("ArticleShell entrance", () => {
  it("uses the CSS-only .hero-in so the title is visible without JavaScript", () => {
    // A framer-motion `initial={{ opacity: 0 }}` is written into the server HTML,
    // so the title would stay invisible until hydration (and forever without JS).
    expect(shell).toContain("hero-in");
    expect(shell).not.toMatch(/framer-motion|ArticleHeader/);
  });
});
