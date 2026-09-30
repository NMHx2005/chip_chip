import { getTranslations } from "next-intl/server";
import { ListTree } from "lucide-react";
import { TocRail } from "@/components/forum/TocRail";
import { extractHeadings } from "@/lib/tiptap/headings";

async function entriesOf(content: unknown) {
  const headings = extractHeadings(content).filter((h) => h.text);
  // A single-entry contents list is noise.
  return headings.length < 2 ? [] : headings;
}

/**
 * Desktop rail (from 1024px): a label over a sticky contents card. Rendered by
 * `ArticleShell` in the right-hand column, which stays reserved (empty) when the
 * article has fewer than two headings, so the text never shifts between posts.
 */
export async function ArticleTocRail({ content }: { content: unknown }) {
  const entries = await entriesOf(content);
  if (entries.length === 0) return null;
  const t = await getTranslations("forum");

  return (
    <aside className="sticky top-24 hidden self-start pt-16 lg:block">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-text-nav">
        {t("tableOfContents")}
      </p>
      <TocRail label={t("tableOfContents")} entries={entries} />
    </aside>
  );
}

/** Phones and tablets: a closed `details` above the body. */
export async function ArticleTocDetails({ content }: { content: unknown }) {
  const entries = await entriesOf(content);
  if (entries.length === 0) return null;
  const t = await getTranslations("forum");

  return (
    <details className="group mt-6 rounded-2xl border border-border bg-surface lg:hidden">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2.5 px-4 text-sm font-bold text-text [&::-webkit-details-marker]:hidden">
        <ListTree aria-hidden className="size-[18px] text-text-nav" strokeWidth={2} />
        {t("tableOfContents")}
      </summary>
      <nav aria-label={t("tableOfContents")} className="flex flex-col gap-0.5 px-2 pb-2">
        {entries.map((entry) => (
          <a
            key={entry.id}
            href={`#${entry.id}`}
            className={
              entry.level === 3
                ? "flex min-h-12 items-center rounded-xl py-1.5 pl-7 pr-3 text-[13px] font-medium leading-[1.35] text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
                : "flex min-h-12 items-center rounded-xl px-3 py-1.5 text-sm font-medium leading-[1.35] text-text-nav [@media(hover:hover)]:hover:bg-surface-muted"
            }
          >
            {entry.text}
          </a>
        ))}
      </nav>
    </details>
  );
}
