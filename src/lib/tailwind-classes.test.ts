import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

const files = sourceFiles(join(process.cwd(), "src")).map((path) => ({
  path,
  text: readFileSync(path, "utf8"),
}));

// Tailwind reads class names as plain text. A class assembled from an
// interpolation (`${HOVER}:shadow-card-hover`) is never seen, so its CSS is
// never generated and the style silently does nothing.
describe("Tailwind class names are written out in full", () => {
  it("never builds a variant or utility by interpolating into a class string", () => {
    const offenders = files.flatMap(({ path, text }) =>
      text
        .split("\n")
        .map((line, index) => ({ line, at: `${path}:${index + 1}` }))
        .filter(({ line }) => /\$\{[^}]+\}:[a-z[-]/.test(line))
        .map(({ at }) => at)
    );
    expect(offenders).toEqual([]);
  });

  it("only uses named duration classes that the config defines", () => {
    const defined = Object.keys(
      (config.theme!.extend!.transitionDuration ?? {}) as Record<string, string>
    );
    const used = new Set(
      files.flatMap(({ text }) =>
        [...text.matchAll(/\bduration-([a-z][a-z-]*)\b/g)].map((match) => match[1])
      )
    );
    const missing = [...used].filter((name) => !defined.includes(name));
    expect(missing).toEqual([]);
  });
});
