import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { sanitizeArticleHtml } from "@/lib/tiptap/sanitize";

/**
 * The article renderer used to call isomorphic-dompurify, which pulls jsdom.
 * On Vercel that chain `require()`s ESM `@exodus/bytes` and every article
 * page 500s. These tests pin a sanitiser that does the same allow-list job
 * without a DOM.
 */
describe("sanitizeArticleHtml", () => {
  it("keeps the tags the editor emits", () => {
    const html = sanitizeArticleHtml(
      '<h2 id="dien-tu">Điện tử</h2><p><strong>đậm</strong></p><ul><li><p>một</p></li></ul>'
    );

    expect(html).toContain('<h2 id="dien-tu">Điện tử</h2>');
    expect(html).toContain("<strong>đậm</strong>");
    expect(html).toContain("<li><p>một</p></li>");
  });

  it("drops a script tag and a javascript: href", () => {
    const html = sanitizeArticleHtml(
      '<p><a href="javascript:alert(1)">bấm vào đây</a></p><script>alert(1)</script>'
    );

    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script");
    expect(html).toContain("bấm vào đây");
  });

  it("strips event-handler attributes from otherwise allowed tags", () => {
    const html = sanitizeArticleHtml('<img src="/x.png" alt="chip" onerror="alert(1)">');

    expect(html).toContain("<img");
    expect(html).toContain('src="/x.png"');
    expect(html).not.toContain("onerror");
  });
});

describe("render.ts module graph", () => {
  it("does not import isomorphic-dompurify", () => {
    const src = readFileSync(
      fileURLToPath(new URL("./render.ts", import.meta.url)),
      "utf8"
    );
    expect(src).not.toContain("isomorphic-dompurify");
  });
});
