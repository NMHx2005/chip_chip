import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/motion";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { MotionGrid } from "@/components/sections/MotionGrid";
import { PostCard } from "@/components/forum/PostCard";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/types";

export async function LatestPosts({ posts }: { posts: PostSummary[] }) {
  const t = await getTranslations("home.latestPosts");

  return (
    <AnimatedSection
      id="latest-posts"
      className="cv-auto px-5 py-16 md:px-8 md:py-24"
    >
      <div className="mx-auto w-full max-w-content">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            namespace="home.latestPosts"
            titleKey="headline"
            descriptionKey="description"
          />

          <Link
            href="/dien-dan"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-black"
          >
            {t("viewAll")}
            <ArrowRight className="size-4" strokeWidth={2.2} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
            {t("empty")}
          </p>
        ) : (
          <MotionGrid className="mt-10">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </MotionGrid>
        )}
      </div>
    </AnimatedSection>
  );
}
