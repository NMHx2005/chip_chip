import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { PlayCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { postHref } from "@/lib/paths";
import type { PostSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, thumbnailUrl, videoRefFrom } from "@/lib/video";

/**
 * A video in a grid: thumbnail, source, difficulty and date.
 *
 * `compact` is the smaller card of the "related videos" row on a lesson page.
 */
export async function VideoCard({ post, compact = false }: { post: PostSummary; compact?: boolean }) {
  const href = postHref(post);
  if (!href) return null;

  const [format, t, tDifficulty] = await Promise.all([
    getFormatter(),
    getTranslations("videos"),
    getTranslations("difficulty"),
  ]);

  const ref = videoRefFrom(post.videoPlatform, post.videoExternalId);
  const thumbnail = ref ? thumbnailUrl(ref) : null;
  const source =
    post.videoSource === "own"
      ? t("sourceOwn")
      : post.videoSource === "curated"
        ? post.channelName
          ? t("sourceCuratedBy", { channel: post.channelName })
          : t("sourceCurated")
        : null;

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface transition-all duration-300 hover:border-black/20 hover:shadow-card-hover",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes={compact ? "(max-width: 640px) 100vw, 33vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            className="object-cover"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center text-text-muted">
            <PlayCircle className="size-10" strokeWidth={1.4} />
          </div>
        )}
        {ref && (
          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white">
            {PLATFORM_LABEL[ref.platform]}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        {source && (
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-text-nav">{source}</span>
        )}
        {post.difficulty && (
          <span className="rounded-full border border-border px-2.5 py-1 text-text-muted">
            {tDifficulty(post.difficulty)}
          </span>
        )}
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="font-normal text-text-muted">
            {format.dateTime(new Date(post.publishedAt), { year: "numeric", month: "short", day: "numeric" })}
          </time>
        )}
      </div>

      <h3
        className={cn(
          "text-balance font-bold leading-snug tracking-[-0.01em] text-text",
          compact ? "text-base" : "text-lg"
        )}
      >
        {post.title}
      </h3>
    </Link>
  );
}
