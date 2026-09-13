import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/types";
import { TOPIC_TONE } from "@/lib/constants";

export async function PostCard({
  post,
  showTopic = false,
}: {
  post: PostSummary;
  showTopic?: boolean;
}) {
  const format = await getFormatter();
  const t = await getTranslations("forum");
  const tTopics = await getTranslations("topics");
  const tone = post.topic ? TOPIC_TONE[post.topic] : null;

  const isLesson = post.kind === "lesson";
  const href = isLesson
    ? ({
        pathname: "/bai-hoc/[topic]/[slug]",
        params: { topic: post.topic ?? "", slug: post.slug },
      } as const)
    : ({
        pathname: "/dien-dan/[slug]",
        params: { slug: post.slug },
      } as const);

  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:border-border hover:shadow-card-hover"
    >
      {post.coverImageUrl && (
        <div className="relative mb-1 aspect-video w-full overflow-hidden rounded-xl">
          <Image
            src={post.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {showTopic && post.topic && tone && (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: tone.soft, color: tone.text }}
          >
            {tTopics(`${post.topic}.title`)}
          </span>
        )}
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="text-xs text-text-muted"
          >
            {format.dateTime(new Date(post.publishedAt), {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      <h3 className="text-balance text-lg font-bold leading-snug tracking-[-0.01em] text-text">
        {post.title}
      </h3>

      {post.excerpt && (
        <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">
          {post.excerpt}
        </p>
      )}

      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-accent transition-transform duration-300 group-hover:translate-x-0.5">
        {t("readMore")}
        <ArrowRight className="size-4" strokeWidth={2.2} />
      </span>
    </Link>
  );
}
