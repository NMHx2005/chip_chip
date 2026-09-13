import { describe, expect, it } from "vitest";
import { articleToPlainText, renderArticle } from "@/lib/tiptap/render";

/**
 * The article body is the one place the site writes HTML it did not build
 * element by element. Only staff can author it, but a hand-edited row or a
 * future importer would reach the same renderer — these tests pin the
 * allow-list that stands between stored JSON and `dangerouslySetInnerHTML`.
 */
const doc = (...content: unknown[]) => ({ type: "doc", content });

const paragraph = (...content: unknown[]) => ({ type: "paragraph", content });

const text = (value: string, marks?: unknown[]) => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});

describe("renderArticle", () => {
  it("renders the formatting the editor can produce", () => {
    const html = renderArticle(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [text("Điện tử")] },
        paragraph(text("đậm", [{ type: "bold" }])),
        {
          type: "bulletList",
          content: [
            { type: "listItem", content: [paragraph(text("một"))] },
          ],
        }
      )
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<strong>đậm</strong>");
    expect(html).toContain("<li><p>một</p></li>");
  });

  it("gives headings ids the table of contents can link to", () => {
    const html = renderArticle(
      doc({
        type: "heading",
        attrs: { level: 2 },
        content: [text("Định nghĩa bán dẫn")],
      })
    );

    expect(html).toContain('id="dinh-nghia-ban-dan"');
  });

  it("strips a javascript: link", () => {
    const html = renderArticle(
      doc(
        paragraph(
          text("bấm vào đây", [
            { type: "link", attrs: { href: "javascript:alert(1)" } },
          ])
        )
      )
    );

    expect(html).not.toContain("javascript:");
    expect(html).toContain("bấm vào đây");
  });

  it("emits nothing at all when the JSON contains an unknown node", () => {
    const html = renderArticle(
      doc(
        { type: "script", content: [text("alert(1)")] },
        paragraph(text("nội dung thật"))
      )
    );

    // The schema has no `script` node, so `generateHTML` throws and the whole
    // document is dropped. Losing a valid sibling paragraph is the price of
    // failing closed, and it only happens for JSON the editor cannot produce.
    expect(html).toBe("");
  });

  it("escapes markup that arrives as text rather than building an element", () => {
    const html = renderArticle(
      doc(paragraph(text('<img src=x onerror="alert(1)">')))
    );

    // `onerror` survives as literal text — what matters is that there is no
    // element for it to be an attribute of.
    expect(html).not.toContain("<img");
    expect(html).toBe('<p>&lt;img src=x onerror="alert(1)"&gt;</p>');
  });

  it("returns an empty string rather than throwing on a malformed row", () => {
    expect(renderArticle(null)).toBe("");
    expect(renderArticle("not a document")).toBe("");
    expect(renderArticle({ type: "doc", content: "broken" })).toBe("");
  });
});

describe("articleToPlainText", () => {
  it("strips tags and truncates for a meta description", () => {
    const long = "a".repeat(300);
    const summary = articleToPlainText(doc(paragraph(text(long))), 50);

    expect(summary).toHaveLength(51); // 50 characters plus the ellipsis
    expect(summary.endsWith("…")).toBe(true);
    expect(summary).not.toContain("<");
  });
});
