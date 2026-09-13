import { getTranslations } from "next-intl/server";
import { extractHeadings } from "@/lib/tiptap/headings";

/**
 * Table of contents built from the article's own headings.
 *
 * Renders nothing below two headings — a single-entry contents list is noise.
 * Anchors work without JavaScript; `scroll-padding-top` on `html` keeps the
 * target clear of the fixed navbar.
 */
export async function ArticleToc({ content }: { content: unknown }) {
  const t = await getTranslations("forum");
  const headings = extractHeadings(content).filter((h) => h.text);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label={t("tableOfContents")}
      className="my-8 rounded-2xl border border-border bg-surface p-5 md:p-6"
    >
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
        {t("tableOfContents")}
      </h2>

      <ol className="mt-4 flex flex-col gap-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level === 3 ? "pl-4" : undefined}
          >
            <a
              href={`#${heading.id}`}
              className="text-sm leading-relaxed text-text-nav transition-colors hover:text-accent"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
