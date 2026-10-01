import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type Section = "lesson" | "post" | "video";

const TITLE = { lesson: "titleLesson", post: "titlePost", video: "titleVideo" } as const;
const DESCRIPTION = { lesson: "descLesson", post: "descPost", video: "descVideo" } as const;
const BACK_NAMESPACE = { lesson: "lessons", post: "forum", video: "videos" } as const;
const BACK_KEY = { lesson: "backToLessons", post: "backToForum", video: "backToVideos" } as const;
const BACK_HREF = { lesson: "/bai-hoc", post: "/blog", video: "/video" } as const;

/**
 * The one 404 for a detail route that did not resolve: a lesson, a blog post or
 * a video. It keeps the shared chrome and offers the way back to that listing,
 * plus the search page. The nav item is not highlighted — the shell has no idea
 * which section the missing slug belonged to.
 */
export async function ArticleNotFound({ section }: { section: Section }) {
  const [t, tBack] = await Promise.all([
    getTranslations("errors"),
    getTranslations(BACK_NAMESPACE[section]),
  ]);

  return (
    <section className="px-5 py-14 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-content">
        <EmptyState
          eyebrow={t("eyebrow404")}
          headingLevel="h1"
          chip="notFound"
          tone="error"
          title={t(TITLE[section])}
          description={t(DESCRIPTION[section])}
          className="min-h-0 sm:min-h-[520px]"
          actions={
            <>
              <Button href={BACK_HREF[section]}>{tBack(BACK_KEY[section])}</Button>
              <Button href="/tim-kiem" variant="secondary">
                {t("search")}
              </Button>
            </>
          }
        />
      </div>
    </section>
  );
}
