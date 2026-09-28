import { describe, expect, it } from "vitest";
import {
  applyTranslations,
  prepareTranslation,
  extractSegments,
  type DraftText,
  type Translation,
} from "@/lib/translate/segments";

const doc = (...content: unknown[]) => ({ type: "doc", content });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const text = (value: string, marks?: unknown[]) => ({
  type: "text",
  text: value,
  ...(marks ? { marks } : {}),
});
const link = (href: string) => ({
  type: "link",
  attrs: { href, target: "_blank", rel: "noopener noreferrer nofollow", class: null },
});
const math = (latex: string) => ({ type: "inlineMath", attrs: { latex } });

const richDraft: DraftText = {
  title: "Chất bán dẫn",
  excerpt: "Vùng cấm & pha tạp",
  content: doc(
    { type: "heading", attrs: { level: 2, textAlign: null }, content: [text("Định nghĩa")] },
    p(
      text("Năng lượng "),
      math("E = hf"),
      text(" của "),
      text("photon", [{ type: "bold" }]),
      text(" xem "),
      text("Sze", [link("https://a.test/?x=1&y=2"), { type: "italic" }]),
      text(" và "),
      text("Kittel", [link("https://b.test")]),
      { type: "hardBreak" },
      text("V < 5 V", [{ type: "code" }])
    ),
    { type: "codeBlock", attrs: { language: null }, content: [text("int x = 1;")] },
    { type: "blockMath", attrs: { latex: "\\frac{1}{2}" } },
    {
      type: "callout",
      attrs: { variant: "tip" },
      content: [p(text("Mẹo nhớ", [{ type: "bold" }, { type: "italic" }]), text(" nhanh"))],
    },
    { type: "figure", attrs: { src: "https://c.test/w.png", alt: "Tấm wafer", caption: "Hình wafer" } },
    {
      type: "references",
      attrs: { reviewers: "TS. Nguyễn A" },
      content: [
        {
          type: "orderedList",
          attrs: { start: 1, type: null },
          content: [{ type: "listItem", content: [p(text("Sze, Physics"))] }],
        },
      ],
    },
    p(math("x")),
    p()
  ),
};

const identity = (segments: { id: string; text: string }[]): Translation[] =>
  segments.map(({ id, text: value }) => ({ id, text: value }));

describe("extractSegments", () => {
  it("encodes marks, links, formulas and line breaks as placeholder tags", () => {
    const segments = extractSegments(richDraft);
    expect(segments.map(({ id, text: value }) => ({ id, text: value }))).toEqual([
      { id: "s1", text: "Chất bán dẫn" },
      { id: "s2", text: "Vùng cấm &amp; pha tạp" },
      { id: "s3", text: "Định nghĩa" },
      {
        id: "s4",
        text: "Năng lượng <m1/> của <b>photon</b> xem <a1><i>Sze</i></a1> và <a2>Kittel</a2><br/><code>V &lt; 5 V</code>",
      },
      { id: "s5", text: "<b><i>Mẹo nhớ</i></b> nhanh" },
      { id: "s6", text: "Tấm wafer" },
      { id: "s7", text: "Hình wafer" },
      { id: "s8", text: "Sze, Physics" },
    ]);
  });

  it("never extracts reviewer names as a segment", () => {
    const segments = extractSegments(richDraft);
    expect(segments.map((segment) => segment.text)).not.toContain("TS. Nguyễn A");
    expect(segments.some((segment) => segment.target.kind === "attr")).toBe(true); // alt/caption still are
  });

  it("never sends code blocks, formulas or link targets", () => {
    const sent = extractSegments(richDraft).map((segment) => segment.text).join("\n");
    expect(sent).not.toContain("int x");
    expect(sent).not.toContain("frac");
    expect(sent).not.toContain("E = hf");
    expect(sent).not.toContain("a.test");
  });

  it("skips node types it does not know, even ones named like object properties", () => {
    const segments = extractSegments({
      title: "",
      excerpt: "",
      content: doc({ type: "constructor", attrs: {} }, { type: "toString" }, p(text("x"))),
    });
    expect(segments.map((segment) => segment.text)).toEqual(["x"]);
  });

  it("skips empty title, excerpt and blocks without words", () => {
    const segments = extractSegments({ title: " ", excerpt: "", content: doc(p(), p(math("x"))) });
    expect(segments).toEqual([]);
  });
});

describe("applyTranslations", () => {
  it("rebuilds exactly the original draft when every segment comes back unchanged", () => {
    const segments = extractSegments(richDraft);
    const result = applyTranslations(richDraft, segments, identity(segments));
    expect(result.untranslated).toBe(0);
    expect(result.draft).toEqual(richDraft);
  });

  it("keeps marks, link targets and formulas while replacing the words", () => {
    const segments = extractSegments(richDraft);
    const translations = identity(segments).map((t) =>
      t.id === "s4"
        ? {
            id: "s4",
            text: "The energy <m1/> of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V &lt; 5 V</code>",
          }
        : t
    );
    const { draft } = applyTranslations(richDraft, segments, translations);
    const paragraph = (draft.content as { content: { content: unknown[] }[] }).content[1];
    expect(paragraph.content).toEqual([
      text("The energy "),
      math("E = hf"),
      text(" of a "),
      text("photon", [{ type: "bold" }]),
      text(", see "),
      text("Sze", [link("https://a.test/?x=1&y=2"), { type: "italic" }]),
      text(" and "),
      text("Kittel", [link("https://b.test")]),
      { type: "hardBreak" },
      text("V < 5 V", [{ type: "code" }]),
    ]);
  });

  it("translates title, excerpt, caption and alt as plain text", () => {
    const segments = extractSegments(richDraft);
    const english: Record<string, string> = {
      s1: "Semiconductors",
      s2: "Band gap &amp; doping",
      s6: "A wafer",
      s7: "Wafer figure",
    };
    const translations = identity(segments).map((t) => ({ id: t.id, text: english[t.id] ?? t.text }));
    const { draft } = applyTranslations(richDraft, segments, translations);
    const blocks = (draft.content as { content: { attrs?: Record<string, unknown> }[] }).content;
    expect(draft.title).toBe("Semiconductors");
    expect(draft.excerpt).toBe("Band gap & doping");
    expect(blocks[5].attrs).toEqual({ src: "https://c.test/w.png", alt: "A wafer", caption: "Wafer figure" });
  });

  it("keeps the reviewers attribute copied verbatim into the EN draft", () => {
    const segments = extractSegments(richDraft);
    const translations = identity(segments).map((t) => ({ id: t.id, text: t.id === "s3" ? "Definition" : t.text }));
    const { draft } = applyTranslations(richDraft, segments, translations);
    const blocks = (draft.content as { content: { attrs?: Record<string, unknown> }[] }).content;
    expect(blocks[6].attrs).toEqual({ reviewers: "TS. Nguyễn A" });
  });

  it.each([
    ["a missing tag", "The energy of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V</code>"],
    ["an extra tag", "The <b>energy</b> <m1/> of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V</code>"],
    ["swapped links", "The energy <m1/> of a <b>photon</b>, see <a2>Kittel</a2> and <a1><i>Sze</i></a1><br/><code>V</code>"],
    ["an unknown formula", "The energy <m2/> of a <b>photon</b>, see <a1><i>Sze</i></a1> and <a2>Kittel</a2><br/><code>V</code>"],
    ["an empty answer", "   "],
  ])("keeps the Vietnamese block and counts it when the answer has %s", (_label, answer) => {
    const segments = extractSegments(richDraft);
    const translations = identity(segments).map((t) => (t.id === "s4" ? { id: "s4", text: answer } : t));
    const { draft, untranslated } = applyTranslations(richDraft, segments, translations);
    expect(untranslated).toBe(1);
    expect(draft.content).toEqual(richDraft.content);
  });

  it("counts missing ids and ignores unknown or duplicate ones", () => {
    const segments = extractSegments(richDraft);
    const translations = [
      ...identity(segments).filter((t) => t.id !== "s3" && t.id !== "s8"),
      { id: "s99", text: "stray" },
      { id: "s1", text: "Second answer for s1" },
    ];
    const { draft, untranslated } = applyTranslations(richDraft, segments, translations);
    expect(untranslated).toBe(2);
    expect(draft.title).toBe("Chất bán dẫn");
  });

  it("does not modify the Vietnamese draft it was given", () => {
    const before = structuredClone(richDraft);
    const segments = extractSegments(richDraft);
    applyTranslations(
      richDraft,
      segments,
      segments.map(({ id }) => ({ id, text: id === "s3" ? "Definition" : "x" }))
    );
    expect(richDraft).toEqual(before);
  });
});

describe("prepareTranslation", () => {
  it("returns the segments of an ordinary article", () => {
    const result = prepareTranslation(richDraft);
    expect(result.ok && result.segments.length).toBe(8);
  });

  it("refuses an article with nothing to translate", () => {
    expect(prepareTranslation({ title: "", excerpt: "", content: doc(p(math("x"))) })).toEqual({
      ok: false,
      error: "Bản tiếng Việt chưa có chữ để dịch.",
    });
  });

  it("refuses more than 60 000 characters and says how many there are", () => {
    const long = { title: "", excerpt: "", content: doc(p(text("a".repeat(30_000))), p(text("b".repeat(30_001)))) };
    expect(prepareTranslation(long)).toEqual({
      ok: false,
      error: "Bài quá dài để dịch một lần: 60001 ký tự, tối đa 60000. Hãy tách bài hoặc dịch tay phần còn lại.",
    });
  });

  it("does not count code blocks, which are never sent", () => {
    const content = doc(p(text("Xin chào")), {
      type: "codeBlock",
      content: [text("x".repeat(70_000))],
    });
    expect(prepareTranslation({ title: "", excerpt: "", content }).ok).toBe(true);
  });
});
