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

describe("sanitizeArticleHtml — attribute values", () => {
  it("does not double-escape an ampersand generateHTML already escaped", () => {
    expect(
      sanitizeArticleHtml('<p><a href="https://x.test/?a=1&amp;b=2">link</a></p>')
    ).toBe('<p><a href="https://x.test/?a=1&amp;b=2">link</a></p>');
  });

  it("reads a quoted '>' as part of the value, not the end of the tag", () => {
    expect(sanitizeArticleHtml('<img src="https://x.test/a.png" alt="V > 5 <h2>"><p>sau</p>')).toBe(
      '<img src="https://x.test/a.png" alt="V &gt; 5 &lt;h2&gt;"><p>sau</p>'
    );
  });

  it("blocks a javascript: URL hidden behind entities or control characters", () => {
    const html = sanitizeArticleHtml(
      '<p><a href="&#106;avascript:alert(1)">a</a><a href="java&#9;script:alert(1)">b</a><a href=" JAVASCRIPT:alert(1)">c</a></p>'
    );
    expect(html).toBe("<p><a>a</a><a>b</a><a>c</a></p>");
  });

  it("drops an unterminated script together with everything after it", () => {
    expect(sanitizeArticleHtml("<p>a</p><script>alert(1)")).toBe("<p>a</p>");
  });

  it("keeps a stray '<' in text as text", () => {
    expect(sanitizeArticleHtml("<p>a < b</p>")).toBe("<p>a &lt; b</p>");
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
