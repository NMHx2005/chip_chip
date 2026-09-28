/**
 * Allow-list sanitiser for Tiptap HTML.
 *
 * isomorphic-dompurify pulls jsdom, and on Vercel that chain `require()`s the
 * ESM package `@exodus/bytes` — every article page then 500s with
 * ERR_REQUIRE_ESM. This walker keeps the same tag/attribute allow-list without
 * a DOM.
 *
 * `generateHTML` (zeed-dom) escapes `&` and `"` inside attribute values but
 * leaves `<` and `>` as they are, so an alt text such as `V > 5` is legal
 * input. Tags are therefore matched quote-aware, and attribute values are
 * decoded before being re-escaped — otherwise `?a=1&amp;b=2` would come out
 * as `?a=1&amp;amp;b=2` and every link with a query string would break.
 *
 * Tag boundaries are found with a single left-to-right scan (`parseTag`)
 * rather than a regex: a regex that back-searches for a closing `>` across
 * an unbounded run of non-`>` characters retries at every `<` it fails on,
 * which is quadratic on malformed input such as `"<a b".repeat(50000)`
 * (200 KB with no `>` at all).
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "mark",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  // Formula placeholders; math.ts swaps them for KaTeX after sanitising.
  "span",
  "div",
  "figure",
  "figcaption",
]);

const ALLOWED_ATTR = new Set([
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "loading",
  "decoding",
  "class",
  "style",
  "id",
  "colspan",
  "rowspan",
  "data-type",
  "data-latex",
]);

/** Dropped together with everything up to their closing tag. */
const FORBIDDEN_WITH_BODY = new Set(["script", "style", "iframe", "object", "embed", "form"]);

const NAME_START = /[a-zA-Z]/;
const NAME_CHAR = /[a-zA-Z0-9]/;
const WHITESPACE = /\s/;

interface ParsedTag {
  closing: boolean;
  name: string;
  attrs: string;
  /** Index of the character right after the tag's closing `>`. */
  end: number;
}

/**
 * Parses one tag starting at `html[start]` (must be `<`).
 *
 * Returns `null` when `<` is not followed by a valid tag name — it is then
 * a literal character, and the caller resumes scanning at `start + 1`.
 * Returns `"unterminated"` when a valid tag name has no closing `>`
 * anywhere in the rest of the string; the caller then treats everything
 * from `start` to the end of the input as text in one step. Both outcomes
 * keep the scan linear: a name check is O(1), and an unterminated tag is
 * detected by a single forward pass that ends the whole scan, rather than
 * one attempt per `<`.
 */
function parseTag(html: string, start: number): ParsedTag | null | "unterminated" {
  const len = html.length;
  let i = start + 1;
  let closing = false;
  if (html[i] === "/") {
    closing = true;
    i++;
  }

  const nameStart = i;
  if (i >= len || !NAME_START.test(html[i])) return null;
  i++;
  while (i < len && NAME_CHAR.test(html[i])) i++;
  const name = html.slice(nameStart, i).toLowerCase();

  const attrsStart = i;
  let quote: string | null = null;
  while (i < len) {
    const c = html[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ">") {
      break;
    }
    i++;
  }
  if (i >= len) return "unterminated";

  let attrs = html.slice(attrsStart, i);
  // A `/` right before `>` is only a self-closing solidus — not the tail of
  // an unquoted value — when it directly follows the tag name, whitespace,
  // or a closing quote, mirroring the HTML tokenizer's before-attribute-name
  // state. `<img src=x/>` keeps the slash in the value; `<img src=x />`
  // (whitespace before the slash) does not.
  if (attrs.endsWith("/")) {
    const before = attrs.length > 1 ? attrs[attrs.length - 2] : "";
    if (before === "" || WHITESPACE.test(before) || before === '"' || before === "'") {
      attrs = attrs.slice(0, -1);
    }
  }

  return { closing, name, attrs, end: i + 1 };
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] !== "#") return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
    const code =
      body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isSafeUrl(name: string, value: string): boolean {
  if (name !== "href" && name !== "src") return true;
  // Browsers ignore control characters and whitespace inside a scheme, so
  // `java\tscript:` must be read as `javascript:`.
  const scheme = value.replace(/[\u0000- \u007f-\u009f]/g, "").toLowerCase();
  return !(
    scheme.startsWith("javascript:") ||
    scheme.startsWith("vbscript:") ||
    scheme.startsWith("data:")
  );
}

function sanitizeAttrs(raw: string): string {
  const out: string[] = [];
  const re =
    /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const name = match[1].toLowerCase();
    if (name.startsWith("on")) continue;
    if (!ALLOWED_ATTR.has(name)) continue;
    const value = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
    if (!isSafeUrl(name, value)) continue;
    out.push(`${name}="${escapeAttr(value)}"`);
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

export function sanitizeArticleHtml(html: string): string {
  const len = html.length;
  let out = "";
  let textStart = 0;
  let skipping: string | null = null;
  let i = 0;

  while (i < len) {
    if (html.charCodeAt(i) !== 60 /* '<' */) {
      i++;
      continue;
    }

    const tag = parseTag(html, i);

    if (tag === "unterminated") break; // everything from here on is text
    if (tag === null) {
      // '<' not followed by a tag name — a literal character, not a tag.
      i++;
      continue;
    }

    // Text between tags is already escaped by generateHTML; a bare `<` here
    // can only come from hand-written HTML and is kept as text.
    if (!skipping) out += html.slice(textStart, i).replace(/</g, "&lt;");

    if (skipping) {
      if (tag.closing && tag.name === skipping) skipping = null;
    } else if (FORBIDDEN_WITH_BODY.has(tag.name)) {
      // Browsers never treat a non-void, non-foreign element such as
      // <script> as self-closing, no matter what precedes its final `/>` —
      // an opening tag here always starts a skip until the matching close
      // tag (or EOF), so its body can never leak as text.
      if (!tag.closing) skipping = tag.name;
    } else if (ALLOWED_TAGS.has(tag.name)) {
      out += tag.closing ? `</${tag.name}>` : `<${tag.name}${sanitizeAttrs(tag.attrs)}>`;
    }

    i = tag.end;
    textStart = i;
  }

  if (!skipping) out += html.slice(textStart).replace(/</g, "&lt;");
  return out;
}
