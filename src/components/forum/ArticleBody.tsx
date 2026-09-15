import { getTranslations } from "next-intl/server";
import { renderArticle } from "@/lib/tiptap/render";

/**
 * Renders an article body.
 *
 * `renderArticle` runs server-side: it converts the stored Tiptap JSON to HTML
 * and sanitises the result. By the time it reaches `dangerouslySetInnerHTML`
 * the markup has already been through the tag allow-list.
 */
export async function ArticleBody({ content }: { content: unknown }) {
  const html = renderArticle(content);

  if (!html) {
    const t = await getTranslations("forum");
    return (
      <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-text-muted">
        {t("emptyArticle")}
      </p>
    );
  }

  return (
    <div className="chip-prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
