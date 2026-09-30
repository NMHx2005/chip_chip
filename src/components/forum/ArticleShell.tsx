import type { ComponentProps, CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ReportMistake } from "@/components/contact/ReportMistake";
import { ArticleBody } from "@/components/forum/ArticleBody";
import { ArticleTocDetails, ArticleTocRail } from "@/components/forum/ArticleToc";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * The page frame shared by the blog post and the lesson: back button, title,
 * meta row, cover, contents, body and the report-a-mistake block.
 *
 * From 1024px it is a 768px text column plus a 272px right column that holds the
 * sticky contents. The right column is reserved even when a post has no
 * contents, so the text sits in the same place from post to post. Below 1024px
 * it is one column and the contents become a closed `details` above the body.
 * The head rises in with the CSS-only `.hero-in` (BL8): visible without JavaScript
 * and switched off under reduced motion. `children` (comments) and `footer` (related items) render after the report block.
 */
export function ArticleShell({
  back,
  headerExtra,
  title,
  meta,
  coverImageUrl,
  content,
  locale,
  postId,
  footer,
  children,
}: {
  back: { href: ComponentProps<typeof Link>["href"]; label: string };
  /** Sits above the title, e.g. the lesson's topic chip. */
  headerExtra?: ReactNode;
  title: string;
  meta: ReactNode;
  coverImageUrl: string | null;
  content: unknown;
  locale: Locale;
  postId: string;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="px-5 pb-14 pt-6 md:px-8 lg:pb-24 lg:pt-10">
      <div className="mx-auto w-full max-w-[1088px] lg:grid lg:grid-cols-[minmax(0,768px)_272px] lg:gap-12">
        <div className="min-w-0">
          <div className="hero-in" style={{ "--i": 0 } as CSSProperties}>
            <Link
              href={back.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text transition-colors duration-fast ease-standard motion-reduce:transition-none [@media(hover:hover)]:hover:border-black/25"
            >
              <ArrowLeft aria-hidden className="size-4" strokeWidth={2.2} />
              {back.label}
            </Link>

            {headerExtra && <div className="mt-6">{headerExtra}</div>}

            <h1 className="mt-4 text-balance text-[34px] font-extrabold leading-[1.1] tracking-[-0.03em] text-text [overflow-wrap:anywhere] lg:mt-5 lg:text-[46px]">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-nav lg:mt-5">
              {meta}
            </div>
          </div>

          {coverImageUrl && (
            <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-surface-muted lg:mt-8">
              <Image
                src={coverImageUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          <ArticleTocDetails content={content} />

          <div className="mt-8 lg:mt-10">
            <ArticleBody content={content} locale={locale} />
          </div>

          <div className="mt-10 lg:mt-12">
            <ReportMistake postId={postId} />
          </div>

          {footer}
          {children}
        </div>

        <ArticleTocRail content={content} />
      </div>
    </article>
  );
}
