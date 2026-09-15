/**
 * Allow-list sanitiser for Tiptap HTML.
 *
 * isomorphic-dompurify pulls jsdom, and on Vercel that chain `require()`s the
 * ESM package `@exodus/bytes` — every article page then 500s with
 * ERR_REQUIRE_ESM. This walker keeps the same tag/attribute allow-list without
 * a DOM.
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

const VOID_TAGS = new Set(["br", "hr", "img"]);

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

const FORBIDDEN_WITH_BODY = /<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi;
const FORBIDDEN_EMPTY = /<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi;

function isSafeUrl(name: string, value: string): boolean {
  if (name !== "href" && name !== "src") return true;
  const lower = value.trim().toLowerCase();
  return !(
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
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
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!isSafeUrl(name, value)) continue;
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
    out.push(`${name}="${escaped}"`);
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

export function sanitizeArticleHtml(html: string): string {
  const stripped = html
    .replace(FORBIDDEN_WITH_BODY, "")
    .replace(FORBIDDEN_EMPTY, "");

  return stripped.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)\/?>/g,
    (match, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      if (match.startsWith("</")) return `</${name}>`;
      const safeAttrs = sanitizeAttrs(attrs);
      if (VOID_TAGS.has(name) || match.endsWith("/>")) {
        return `<${name}${safeAttrs}>`;
      }
      return `<${name}${safeAttrs}>`;
    }
  );
}
