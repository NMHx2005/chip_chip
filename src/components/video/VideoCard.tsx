import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, Bookmark, Cpu, Play } from "lucide-react";
import { DifficultyMark } from "@/components/ui/DifficultyMark";
import { TopicChip } from "@/components/ui/TopicChip";
import { Link } from "@/i18n/navigation";
import { TOPIC_TONE } from "@/lib/constants";
import { postHref } from "@/lib/paths";
import { topicNumber } from "@/lib/post-display";
import type { PostSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, thumbnailUrl, videoRefFrom } from "@/lib/video";

// Hover styling is for a real pointer only; every variant is written out in
// full because a class built from `${...}` is never generated (see
// tailwind-classes.test.ts). Same look as PostCard, so the lists read as one.
const CARD =
  "group grid h-full grid-cols-[132px_minmax(0,1fr)] gap-x-3 gap-y-2.5 rounded-2xl border border-border bg-surface p-3 transition-[border-color,box-shadow,transform] duration-card ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100 sm:flex sm:flex-col sm:gap-3 sm:p-4";

/**
 * A video in a grid: a 16:9 cover with the platform and a play disc, the topic,
 * the title, where it comes from, and difficulty and date. Under 640px it folds
 * into a compact layout with the cover on the left. `compact` is the smaller card
 * of the "related videos" row on a lesson page.
 *
 * A video with no thumbnail (TikTok) gets a plate in its topic tone with the
 * topic number as a watermark; without a topic the plate is plain grey.
 */
export async function VideoCard({ post, compact = false }: { post: PostSummary; compact?: boolean }) {
  const href = postHref(post);
  if (!href) return null;

  const [format, t, tTopics, tDifficulty] = await Promise.all([
    getFormatter(),
    getTranslations("videos"),
    getTranslations("topics"),
    getTranslations("difficulty"),
  ]);

  const ref = videoRefFrom(post.videoPlatform, post.videoExternalId);
  const thumbnail = ref ? thumbnailUrl(ref) : null;
  const topic = post.topic;
  const plate = topic ? TOPIC_TONE[topic].soft : null;
  const source =
    post.videoSource === "own"
      ? t("sourceOwn")
      : post.videoSource === "curated"
        ? post.channelName
          ? t("sourceCuratedBy", { channel: post.channelName })
          : t("sourceCurated")
        : null;

  const date = post.publishedAt
    ? format.dateTime(new Date(post.publishedAt), { year: "numeric", month: "short", day: "numeric" })
    : null;

  return (
    <Link href={href} className={CARD}>
      <div
        className={cn(
          "relative col-start-1 row-span-2 aspect-video w-[132px] overflow-hidden rounded-xl sm:w-full",
          !plate && "bg-surface-muted"
        )}
        style={plate && !thumbnail ? { background: plate } : undefined}
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes={
              compact
                ? "(max-width: 639px) 132px, 50vw"
                : "(max-width: 639px) 132px, (max-width: 1024px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-base ease-standard motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:[@media(hover:hover)]:group-hover:scale-100"
          />
        ) : (
          topic && (
            <span
              aria-hidden
              className="absolute -bottom-3 right-3 text-[56px] font-extrabold leading-none tracking-[-0.04em] text-black/[0.09] sm:text-[96px]"
            >
              {topicNumber(topic)}
            </span>
          )
        )}

        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/55 text-white sm:size-12"
        >
          <Play className="size-3.5 translate-x-px fill-current sm:size-5" strokeWidth={2} />
        </span>

        {ref && (
          <span aria-hidden className="absolute left-1.5 top-1.5 rounded-full bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-white sm:left-2 sm:top-2 sm:px-2.5 sm:py-1 sm:text-xs">
            {PLATFORM_LABEL[ref.platform]}
          </span>
        )}
      </div>

      {topic && (
        <TopicChip
          topic={topic}
          label={tTopics(`${topic}.title`)}
          className="col-start-2 sm:col-start-auto"
        />
      )}

      <h3
        className={cn(
          "col-start-2 line-clamp-3 text-balance font-bold leading-[1.3] tracking-[-0.01em] text-text sm:col-start-auto sm:min-h-[47px]",
          compact ? "text-base" : "text-base sm:text-lg"
        )}
      >
        {post.title}
      </h3>

      {source && (
        <p className="col-span-2 flex min-w-0 items-center gap-1.5 text-[13px] text-text-muted sm:col-span-1">
          {post.videoSource === "own" ? (
            <Cpu aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
          ) : (
            <Bookmark aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
          )}
          <span className="truncate">{source}</span>
        </p>
      )}

      <div className="col-span-2 mt-auto flex items-center gap-2 border-t border-hairline pt-3 text-[13px] text-text-muted sm:col-span-1">
        {post.difficulty && (
          <DifficultyMark difficulty={post.difficulty} label={tDifficulty(post.difficulty)} />
        )}
        {date && (
          <time
            dateTime={post.publishedAt ?? undefined}
            className={cn(post.difficulty && "before:mr-2 before:content-['·']")}
          >
            {date}
          </time>
        )}
        <span
          aria-hidden
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-text transition-colors duration-card ease-standard [@media(hover:hover)]:group-hover:bg-primary [@media(hover:hover)]:group-hover:text-white"
        >
          <ArrowRight
            className="size-4 transition-transform duration-card ease-standard motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5 motion-reduce:[@media(hover:hover)]:group-hover:translate-x-0"
            strokeWidth={2}
          />
        </span>
      </div>
    </Link>
  );
}
