import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, FileText } from "lucide-react";
import { ExpandingCardLink } from "@/components/forum/ExpandingCardLink";
import { DifficultyMark } from "@/components/ui/DifficultyMark";
import { TopicChip } from "@/components/ui/TopicChip";
import { Link } from "@/i18n/navigation";
import type { PostSummary } from "@/lib/types";
import { TOPIC_TONE } from "@/lib/constants";
import { postHref } from "@/lib/paths";
import { topicNumber } from "@/lib/post-display";
import { cn } from "@/lib/utils";

// Hover styling is for a real pointer only: on touch a "hover" sticks after a
// tap, so it is scoped with [@media(hover:hover)]. Tailwind reads class names as
// plain text, so every variant below is written out in full: a class assembled
// from a `${...}` is never generated (see tailwind-classes.test.ts).
const CARD =
  "group grid h-full grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2.5 rounded-2xl border border-border bg-surface p-3 transition-[border-color,box-shadow,transform] duration-card ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100 sm:flex sm:flex-col sm:gap-3 sm:p-4";

const ROW =
  "group flex h-full flex-col gap-2 rounded-2xl border border-border bg-surface p-5 transition-[border-color,box-shadow] duration-card ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:shadow-card-hover";

/**
 * One card for every post list.
 *
 * `card` (default) is a 16:9 image, chips, title, excerpt and a footer; under
 * 640px it folds into a compact layout with a square thumbnail on the left.
 * `row` is the search-result form: no image, one meta line, title, excerpt.
 * The whole card is one link, so the arrow disc is decoration, not a control.
 */
export async function PostCard({
  post,
  showTopic = false,
  expand = false,
  variant = "card",
}: {
  post: PostSummary;
  showTopic?: boolean;
  /** Grow the card to full screen before opening the post (blog listings). */
  expand?: boolean;
  variant?: "card" | "row";
}) {
  const format = await getFormatter();
  const tTopics = await getTranslations("topics");
  const tDifficulty = await getTranslations("difficulty");

  const href = postHref(post);
  // Only a lesson that lost its topic has no page; a card pointing at a 404
  // would be worse than no card.
  if (!href) return null;

  const topic = post.topic;
  const date = post.publishedAt
    ? format.dateTime(new Date(post.publishedAt), {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const topicChip =
    showTopic && topic ? (
      <TopicChip
        topic={topic}
        label={tTopics(`${topic}.title`)}
        className="col-start-2 sm:col-start-auto"
      />
    ) : null;

  const difficulty = post.difficulty ? (
    <DifficultyMark difficulty={post.difficulty} label={tDifficulty(post.difficulty)} />
  ) : null;

  const dateEl = date ? (
    <time
      dateTime={post.publishedAt ?? undefined}
      className={cn(difficulty && "before:mr-2 before:content-['·']")}
    >
      {date}
    </time>
  ) : null;

  const wrap = (className: string, body: React.ReactNode) =>
    expand ? (
      <ExpandingCardLink href={href} className={className}>
        {body}
      </ExpandingCardLink>
    ) : (
      <Link href={href} className={className}>
        {body}
      </Link>
    );

  if (variant === "row") {
    return wrap(
      ROW,
      <>
        <div className="flex flex-wrap items-center gap-2.5 text-[13px] text-text-muted">
          {topicChip && <span className="[&>span]:col-start-auto">{topicChip}</span>}
          {difficulty}
          {dateEl}
        </div>
        <h3 className="text-balance text-lg font-bold leading-[1.3] tracking-[-0.01em] text-text">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-2 text-sm leading-[1.55] text-text-muted">{post.excerpt}</p>
        )}
      </>
    );
  }

  // No cover: a lesson gets a plate in its topic tone with the topic number as
  // a faint watermark, so an image-less library still reads as designed. A post
  // without a topic (Blog) gets a neutral plate with a document icon.
  const plate = topic ? TOPIC_TONE[topic].soft : null;

  return wrap(
    CARD,
    <>
      <div
        className={cn(
          "relative col-start-1 row-span-2 aspect-square w-24 overflow-hidden rounded-xl sm:aspect-video sm:w-full",
          !plate && "bg-surface-muted"
        )}
        style={plate ? { background: plate } : undefined}
      >
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 96px, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-base ease-standard motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:[@media(hover:hover)]:group-hover:scale-100"
          />
        ) : (
          <>
            {topic ? (
              <span
                aria-hidden
                className="absolute -bottom-3.5 right-3.5 text-[64px] font-extrabold leading-none tracking-[-0.04em] text-black/[0.09] sm:text-[96px]"
              >
                {topicNumber(topic)}
              </span>
            ) : (
              <FileText
                aria-hidden
                className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-black/25 sm:size-10"
                strokeWidth={1.5}
              />
            )}
          </>
        )}
      </div>

      {topicChip}

      {/* The title reserves two lines and clamps at three; the excerpt below
          reserves three. A short title or excerpt still lines up with its
          neighbours. */}
      <h3 className="col-start-2 line-clamp-3 text-balance text-base font-bold leading-[1.3] tracking-[-0.01em] text-text sm:col-start-auto sm:min-h-[47px] sm:text-lg">
        {post.title}
      </h3>

      <div className="col-span-2 sm:col-span-1 sm:min-h-[65px]">
        {post.excerpt && (
          <p className="line-clamp-2 text-sm leading-[1.55] text-text-muted sm:line-clamp-3">
            {post.excerpt}
          </p>
        )}
      </div>

      <div className="col-span-2 mt-auto flex items-center gap-2 border-t border-hairline pt-3 text-[13px] text-text-muted sm:col-span-1">
        {difficulty}
        {dateEl}
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
    </>
  );
}
