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
]);

/** Dropped together with everything up to their closing tag. */
const FORBIDDEN_WITH_BODY = new Set(["script", "style", "iframe", "object", "embed", "form"]);

// A quoted value may contain `>`; `[^>]*` would end the tag inside it.
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

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
  let out = "";
  let last = 0;
  let skipping: string | null = null;

  for (const match of html.matchAll(TAG)) {
    const [raw, closing, tag, attrs] = match;
    const name = tag.toLowerCase();
    const text = html.slice(last, match.index);
    last = match.index + raw.length;

    if (skipping) {
      if (closing && name === skipping) skipping = null;
      continue;
    }

    // Text between tags is already escaped by generateHTML; a bare `<` here
    // can only come from hand-written HTML and is kept as text.
    out += text.replace(/</g, "&lt;");

    if (FORBIDDEN_WITH_BODY.has(name)) {
      if (!closing && !raw.endsWith("/>")) skipping = name;
      continue;
    }
    if (!ALLOWED_TAGS.has(name)) continue;
    out += closing ? `</${name}>` : `<${name}${sanitizeAttrs(attrs)}>`;
  }

  if (!skipping) out += html.slice(last).replace(/</g, "&lt;");
  return out;
}
