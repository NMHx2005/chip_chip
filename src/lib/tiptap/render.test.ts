import { describe, expect, it } from "vitest";
import { extractHeadings } from "@/lib/tiptap/headings";
import { calloutVariant } from "@/lib/tiptap/nodes/callout";
import { isAllowedFigureSrc } from "@/lib/tiptap/nodes/figure";
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

const inlineMath = (latex: unknown) => ({ type: "inlineMath", attrs: { latex } });
const blockMath = (latex: unknown) => ({ type: "blockMath", attrs: { latex } });

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

describe("renderArticle — attribute values", () => {
  it("keeps heading anchors and link query strings intact around tricky alt text", () => {
    const html = renderArticle(
      doc(
        { type: "image", attrs: { src: "https://cdn.test/a.png", alt: "<h2>giả</h2>" } },
        { type: "heading", attrs: { level: 2 }, content: [text("Thật")] },
        paragraph(
          text("Sze", [{ type: "link", attrs: { href: "https://x.test/?a=1&b=2" } }])
        )
      )
    );

    expect(html).toBe(
      '<img loading="lazy" decoding="async" src="https://cdn.test/a.png" alt="&lt;h2&gt;giả&lt;/h2&gt;">' +
        '<h2 id="that">Thật</h2>' +
        '<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://x.test/?a=1&amp;b=2">Sze</a></p>'
    );
  });
});

describe("renderArticle — formulas", () => {
  it("typesets an inline formula with KaTeX on the server", () => {
    const html = renderArticle(doc(paragraph(text("Năng lượng "), inlineMath("E = hf"))));
    expect(html).toContain('<p>Năng lượng <span class="math-inline"><span class="katex">');
    expect(html).toContain('<annotation encoding="application/x-tex">E = hf</annotation>');
    expect(html).not.toContain("data-latex");
  });

  it("typesets a block formula in display mode", () => {
    const html = renderArticle(doc(blockMath("a > b")));
    expect(html.startsWith('<div class="math-block"><span class="katex-display">')).toBe(true);
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">');
    expect(html).toContain('<annotation encoding="application/x-tex">a &gt; b</annotation>');
  });

  it("renders nothing for an empty or non-string formula", () => {
    expect(renderArticle(doc(blockMath(""), paragraph(text("x"), inlineMath(42))))).toBe("<p>x</p>");
  });

  it("does not turn \\href into a link", () => {
    const html = renderArticle(doc(paragraph(inlineMath("\\href{javascript:alert(1)}{x}"))));
    // KaTeX output contains `<annotation`, so a bare "<a" check would pass by accident.
    expect(html).not.toMatch(/<a[\s>]/);
    expect(html).not.toContain('href="');
  });

  it("keeps markup inside LaTeX from escaping into the page", () => {
    const html = renderArticle(doc(paragraph(inlineMath('"><script>alert(1)</script>'))));
    expect(html).not.toContain("<script");
    expect(html).toContain('<span class="math-inline"><span class="katex">');
  });

  it("does not treat a placeholder typed as text as a formula", () => {
    const html = renderArticle(
      doc(paragraph(text('<span data-latex="0" data-type="inline-math"></span>')), blockMath("x"))
    );
    expect(html.startsWith('<p>&lt;span data-latex="0" data-type="inline-math"&gt;&lt;/span&gt;</p>')).toBe(true);
    expect(html.match(/class="katex"/g)).toHaveLength(1);
  });
});

describe("renderArticle — formula DoS bounds", () => {
  it("refuses to typeset a formula longer than 2000 characters", () => {
    const latex = "x+".repeat(250000); // 500,000 characters
    const start = performance.now();
    const html = renderArticle(doc(paragraph(inlineMath(latex))));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(html).toContain('<code class="math-error">');
    expect(html).toContain(`${latex.slice(0, 200)}…`);
  });

  it("renders a runaway macro expansion as an error quickly", () => {
    const start = performance.now();
    const html = renderArticle(doc(paragraph(inlineMath("\\def\\a{\\a\\a}\\a"))));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(html).toContain("katex-error");
  });

  it("bounds an oversized \\rule to maxSize instead of the requested size", () => {
    const start = performance.now();
    const html = renderArticle(doc(paragraph(inlineMath("\\rule{999999em}{999999em}"))));
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(200);
    expect(html).not.toMatch(/(width|height):999999em/);
    expect(html).toContain("border-right-width:20em");
  });

  it("still typesets a formula right at the 2000-character limit", () => {
    const latex = "x".repeat(2000);
    const html = renderArticle(doc(paragraph(inlineMath(latex))));

    expect(html).toContain('<span class="math-inline"><span class="katex">');
    expect(html).not.toContain('class="math-error"');
  });
});

describe("formulas elsewhere in the pipeline", () => {
  it("contributes raw LaTeX to the plain text", () => {
    expect(
      articleToPlainText(doc(paragraph(text("Năng lượng "), inlineMath("E = hf")), blockMath("a < b")), 500)
    ).toBe("Năng lượng E = hf a < b");
  });

  it("lists a heading's formula in the table of contents", () => {
    const content = doc({
      type: "heading",
      attrs: { level: 2 },
      content: [text("Định luật "), inlineMath("E = hf")],
    });
    expect(extractHeadings(content)).toEqual([
      { id: "dinh-luat-e-hf", text: "Định luật E = hf", level: 2 },
    ]);
    expect(renderArticle(content)).toContain(
      '<h2 id="dinh-luat-e-hf">Định luật <span class="math-inline">'
    );
  });
});

describe("renderArticle — figures", () => {
  it("renders an image with its caption", () => {
    expect(
      renderArticle(
        doc({ type: "figure", attrs: { src: "https://cdn.test/w.png", alt: "Tấm wafer", caption: "Tấm wafer 300 mm" } })
      )
    ).toBe(
      '<figure><img src="https://cdn.test/w.png" alt="Tấm wafer" loading="lazy" decoding="async"><figcaption>Tấm wafer 300 mm</figcaption></figure>'
    );
  });

  it("leaves out an empty caption and a source that is not https", () => {
    expect(
      renderArticle(doc({ type: "figure", attrs: { src: "javascript:alert(1)", alt: "x", caption: "" } }))
    ).toBe("<figure></figure>");
  });

  it("escapes markup in the caption and alt text", () => {
    const html = renderArticle(
      doc({ type: "figure", attrs: { src: "https://cdn.test/a.png", alt: 'a" onerror="x', caption: "<b>V</b> > 5" } })
    );
    expect(html).toBe(
      '<figure><img src="https://cdn.test/a.png" alt="a&quot; onerror=&quot;x" loading="lazy" decoding="async"><figcaption>&lt;b&gt;V&lt;/b&gt; &gt; 5</figcaption></figure>'
    );
  });

  it("puts the caption, not the alt text, into the plain text", () => {
    expect(
      articleToPlainText(
        doc(
          { type: "figure", attrs: { src: "https://cdn.test/a.png", alt: "ảnh", caption: "Tấm wafer" } },
          paragraph(text("sau"))
        ),
        500
      )
    ).toBe("Tấm wafer sau");
  });
});

describe("isAllowedFigureSrc", () => {
  it.each([
    ["https://cdn.test/a.png", undefined, true],
    ["http://127.0.0.1:54321/storage/v1/object/public/post-images/a.png", "http://127.0.0.1:54321", true],
    ["http://127.0.0.1:54321/storage/v1/object/private/a.png", "http://127.0.0.1:54321", false],
    ["http://evil.test/storage/v1/object/public/a.png", "http://127.0.0.1:54321", false],
    ["data:image/png;base64,AAAA", "http://127.0.0.1:54321", false],
    [null, "http://127.0.0.1:54321", false],
  ])("%s with project %s → %s", (src, project, expected) => {
    expect(isAllowedFigureSrc(src, project)).toBe(expected);
  });
});

describe("renderArticle — callouts", () => {
  it("renders each variant as a labelled aside", () => {
    expect(
      renderArticle(doc({ type: "callout", attrs: { variant: "warning" }, content: [paragraph(text("Cẩn thận"))] }))
    ).toBe('<aside class="callout callout-warning" data-variant="warning"><p>Cẩn thận</p></aside>');
  });

  it("falls back to a note for an unknown variant", () => {
    expect(
      renderArticle(
        doc({ type: "callout", attrs: { variant: 'x" onclick="alert(1)' }, content: [paragraph(text("Lạ"))] })
      )
    ).toBe('<aside class="callout callout-note" data-variant="note"><p>Lạ</p></aside>');
  });

  it("normalises variants the same way when parsing", () => {
    expect(calloutVariant("tip")).toBe("tip");
    expect(calloutVariant("TIP")).toBe("note");
    expect(calloutVariant(undefined)).toBe("note");
  });

  it("puts the callout's text into the plain text", () => {
    expect(
      articleToPlainText(doc({ type: "callout", attrs: { variant: "tip" }, content: [paragraph(text("Ghi nhớ"))] }))
    ).toBe("Ghi nhớ");
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
