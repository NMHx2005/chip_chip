import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostCard } from "@/components/forum/PostCard";
import { listForumPosts } from "@/lib/queries/posts";
import { localeAlternates } from "@/lib/seo";
import { PAGE_SIZE } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "forum" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/dien-dan", locale as Locale),
  };
}

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: { page?: string };
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("forum");
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);

  const { posts, total } = await listForumPosts(locale as Locale, {
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content">
        <header className="max-w-2xl">
          <h1 className="text-balance text-[32px] font-extrabold leading-tight tracking-[-0.03em] text-text md:text-[44px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-text-muted">
            {t("description")}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-center gap-2"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <a
                key={n}
                href={`?page=${n}`}
                aria-current={n === page ? "page" : undefined}
                className={
                  n === page
                    ? "flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white"
                    : "flex size-9 items-center justify-center rounded-lg border border-border text-sm text-text-nav transition-colors hover:border-border"
                }
              >
                {n}
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
