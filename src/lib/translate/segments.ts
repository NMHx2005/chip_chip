/**
 * Turns an article into plain strings a translation model can work on, and
 * puts its answers back into the article's own structure.
 *
 * The model never sees Tiptap JSON. Each text block becomes one segment whose
 * formatting is spelled as placeholder tags — `<b>…</b>`, `<a1>…</a1>` for the
 * first link, `<m1/>` for the first inline formula, `<br/>` — and the link
 * targets and formulas themselves stay here, on the server. A translation is
 * accepted only if it gives back exactly the same sequence of tags; otherwise
 * that block keeps its Vietnamese text and is counted as untranslated, so a
 * model that drops a link or mangles a formula can never corrupt the article.
 *
 * Code blocks and formulas are never sent. Pure: no network, no DOM.
 */

export type JsonMark = { type: string; attrs?: Record<string, unknown> };
export type JsonNode = {
  type?: string;
  text?: string;
  marks?: JsonMark[];
  attrs?: Record<string, unknown>;
  content?: JsonNode[];
};

export type DraftText = { title: string; excerpt: string; content: unknown };

type Target =
  | { kind: "field"; field: "title" | "excerpt" }
  | { kind: "inline"; path: number[]; links: JsonMark[]; formulas: JsonNode[]; tags: string[] }
  | { kind: "attr"; path: number[]; attr: "alt" | "caption" | "reviewers" };

export type Segment = { id: string; text: string; target: Target };
export type Translation = { id: string; text: string };

/**
 * The schema's own mark order — Link has priority 1000, the rest keep
 * StarterKit's order, Highlight is registered last — so a rebuilt text node
 * lists its marks exactly as the editor would.
 */
const MARK_ORDER: readonly string[] = [
  "link",
  "bold",
  "code",
  "italic",
  "strike",
  "underline",
  "highlight",
];

const MARK_TAG: Record<string, string> = {
  bold: "b",
  code: "code",
  italic: "i",
  strike: "s",
  underline: "u",
  highlight: "mark",
};

const TAG_MARK: Record<string, string> = {
  b: "bold",
  code: "code",
  i: "italic",
  s: "strike",
  u: "underline",
  mark: "highlight",
};

const TEXT_BLOCKS = new Set(["paragraph", "heading"]);
const ATTR_SEGMENTS = new Map<string, readonly ("alt" | "caption" | "reviewers")[]>([
  ["image", ["alt"]],
  ["figure", ["alt", "caption"]],
  ["references", ["reviewers"]],
]);

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unescapeText(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function rank(mark: JsonMark): number {
  return MARK_ORDER.indexOf(mark.type);
}

function sameMark(a: JsonMark, b: JsonMark): boolean {
  return a.type === b.type && JSON.stringify(a.attrs ?? null) === JSON.stringify(b.attrs ?? null);
}

/** Encodes a text block's inline content, or returns null if it holds anything unknown. */
function encodeInline(
  content: JsonNode[]
): { text: string; links: JsonMark[]; formulas: JsonNode[]; tags: string[] } | null {
  const links: JsonMark[] = [];
  const formulas: JsonNode[] = [];
  const tags: string[] = [];
  const open: { mark: JsonMark; tag: string }[] = [];
  let text = "";

  const openTag = (mark: JsonMark): string => {
    if (mark.type !== "link") return MARK_TAG[mark.type];
    links.push(mark);
    return `a${links.length}`;
  };

  const closeTo = (depth: number) => {
    while (open.length > depth) {
      const { tag } = open[open.length - 1];
      open.pop();
      text += `</${tag}>`;
      tags.push(`/${tag}`);
    }
  };

  for (const node of content) {
    const isText = node.type === "text" && typeof node.text === "string";
    if (!isText && node.type !== "hardBreak" && node.type !== "inlineMath") return null;

    // Line breaks and formulas can carry marks too (a formula inside a link),
    // so every inline node goes through the same open/close bookkeeping.
    const marks = [...(node.marks ?? [])];
    if (marks.some((mark) => rank(mark) < 0)) return null;
    marks.sort((a, b) => rank(a) - rank(b));

    let common = 0;
    while (
      common < open.length &&
      common < marks.length &&
      sameMark(open[common].mark, marks[common])
    ) {
      common += 1;
    }
    closeTo(common);
    for (const mark of marks.slice(common)) {
      const tag = openTag(mark);
      open.push({ mark, tag });
      text += `<${tag}>`;
      tags.push(tag);
    }

    if (node.type === "hardBreak") {
      text += "<br/>";
      tags.push("br/");
    } else if (node.type === "inlineMath") {
      formulas.push(node);
      text += `<m${formulas.length}/>`;
      tags.push(`m${formulas.length}/`);
    } else {
      text += escapeText(node.text ?? "");
    }
  }
  closeTo(0);
  return { text, links, formulas, tags };
}

const TOKEN = /<(\/?)(b|i|u|s|code|mark|a\d+)>|<(br|m\d+)\/>/g;

function tagSequence(text: string): string[] {
  const tags: string[] = [];
  for (const match of text.matchAll(TOKEN)) {
    tags.push(match[3] ? `${match[3]}/` : `${match[1]}${match[2]}`);
  }
  return tags;
}

/** Rebuilds inline nodes from a translated string whose tag sequence was already checked. */
function decodeInline(text: string, links: JsonMark[], formulas: JsonNode[]): JsonNode[] {
  const nodes: JsonNode[] = [];
  const open: JsonMark[] = [];
  let last = 0;

  const pushText = (raw: string) => {
    if (!raw) return;
    const value = unescapeText(raw);
    const marks = [...open].sort((a, b) => rank(a) - rank(b));
    nodes.push(marks.length ? { type: "text", text: value, marks } : { type: "text", text: value });
  };

  for (const match of text.matchAll(TOKEN)) {
    pushText(text.slice(last, match.index));
    last = match.index + match[0].length;

    const [, closing, tag, empty] = match;
    if (empty === "br") {
      const marks = [...open].sort((a, b) => rank(a) - rank(b));
      nodes.push(marks.length ? { type: "hardBreak", marks } : { type: "hardBreak" });
    } else if (empty) {
      nodes.push(formulas[Number(empty.slice(1)) - 1]);
    } else if (closing) {
      open.pop();
    } else if (tag.startsWith("a")) {
      open.push(links[Number(tag.slice(1)) - 1]);
    } else {
      open.push({ type: TAG_MARK[tag] });
    }
  }
  pushText(text.slice(last));
  return nodes;
}

function hasWords(encoded: string): boolean {
  return encoded.replace(TOKEN, "").trim().length > 0;
}

export function extractSegments(draft: DraftText): Segment[] {
  const segments: Segment[] = [];
  const add = (text: string, target: Target) => {
    segments.push({ id: `s${segments.length + 1}`, text, target });
  };

  if (draft.title.trim()) add(escapeText(draft.title), { kind: "field", field: "title" });
  if (draft.excerpt.trim()) add(escapeText(draft.excerpt), { kind: "field", field: "excerpt" });

  const visit = (node: JsonNode, path: number[]) => {
    if (!node || typeof node !== "object") return;

    if (node.type && TEXT_BLOCKS.has(node.type)) {
      const encoded = encodeInline(Array.isArray(node.content) ? node.content : []);
      if (encoded && hasWords(encoded.text)) {
        add(encoded.text, {
          kind: "inline",
          path,
          links: encoded.links,
          formulas: encoded.formulas,
          tags: encoded.tags,
        });
      }
      return;
    }

    for (const attr of ATTR_SEGMENTS.get(node.type ?? "") ?? []) {
      const value = node.attrs?.[attr];
      if (typeof value === "string" && value.trim()) {
        add(escapeText(value), { kind: "attr", path, attr });
      }
    }

    // codeBlock text and formulas are never translated.
    if (node.type === "codeBlock") return;
    if (Array.isArray(node.content)) {
      node.content.forEach((child, index) => visit(child, [...path, index]));
    }
  };

  visit(draft.content as JsonNode, []);
  return segments;
}

function nodeAt(root: JsonNode, path: number[]): JsonNode | undefined {
  let node: JsonNode | undefined = root;
  for (const index of path) node = node?.content?.[index];
  return node;
}

/**
 * Builds the English draft from the Vietnamese one. `translations` may be in
 * any order, contain unknown ids (ignored) or miss some (kept Vietnamese).
 */
export function applyTranslations(
  draft: DraftText,
  segments: Segment[],
  translations: Translation[]
): { draft: DraftText; untranslated: number } {
  const byId = new Map<string, string>();
  for (const { id, text } of translations) {
    if (typeof id === "string" && typeof text === "string" && !byId.has(id)) byId.set(id, text);
  }

  const content = structuredClone(draft.content) as JsonNode;
  const result: DraftText = { title: draft.title, excerpt: draft.excerpt, content };
  let untranslated = 0;

  for (const segment of segments) {
    const text = byId.get(segment.id);
    const { target } = segment;
    const expected = target.kind === "inline" ? target.tags : [];

    if (
      text === undefined ||
      !hasWords(text) ||
      tagSequence(text).join(",") !== expected.join(",")
    ) {
      untranslated += 1;
      continue;
    }

    if (target.kind === "field") {
      result[target.field] = unescapeText(text).trim();
      continue;
    }

    const node = nodeAt(content, target.path);
    if (!node) {
      untranslated += 1;
    } else if (target.kind === "attr") {
      node.attrs = { ...node.attrs, [target.attr]: unescapeText(text).trim() };
    } else {
      node.content = decodeInline(text, target.links, target.formulas);
    }
  }

  return { draft: result, untranslated };
}

/** Characters one click may send to the translation model. */
export const MAX_TRANSLATION_CHARS = 60_000;

/**
 * The segments to send for one "translate" click, or why there are none.
 * Counts only what would actually leave the server.
 */
export function prepareTranslation(
  draft: DraftText
): { ok: true; segments: Segment[] } | { ok: false; error: string } {
  const segments = extractSegments(draft);
  if (segments.length === 0) {
    return { ok: false, error: "Bản tiếng Việt chưa có chữ để dịch." };
  }
  const size = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  if (size > MAX_TRANSLATION_CHARS) {
    return {
      ok: false,
      error: `Bài quá dài để dịch một lần: ${size} ký tự, tối đa ${MAX_TRANSLATION_CHARS}. Hãy tách bài hoặc dịch tay phần còn lại.`,
    };
  }
  return { ok: true, segments };
}
