import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { DifficultyMark } from "@/components/ui/DifficultyMark";
import { TopicChip } from "@/components/ui/TopicChip";
import { Link } from "@/i18n/navigation";
import { TOPIC_TONE } from "@/lib/constants";
import { topicNumber } from "@/lib/post-display";
import type { RelatedLesson } from "@/lib/related-lesson";

// The hover/press classes are PostCard's, written out in full: Tailwind reads
// class names as plain text, so a class assembled from a `${...}` is never
// generated (see tailwind-classes.test.ts).
const CARD =
  "group flex h-full flex-col gap-2.5 rounded-2xl border border-border bg-surface p-3 transition-[border-color,box-shadow,transform] duration-card ease-standard [@media(hover:hover)]:hover:border-black/20 [@media(hover:hover)]:hover:shadow-card-hover active:scale-[0.98] motion-reduce:active:scale-100";

/**
 * The compact lesson card under a video (design V13).
 *
 * No cover image: the lesson is shown in its topic tone with the topic number
 * as a faint watermark, exactly like an image-less `PostCard`. The whole card
 * is one link, so the arrow disc is decoration, not a control.
 */
export async function RelatedLessonCard({ lesson }: { lesson: RelatedLesson }) {
  const format = await getFormatter();
  const tTopics = await getTranslations("topics");
  const tDifficulty = await getTranslations("difficulty");

  const tone = TOPIC_TONE[lesson.topic];
  const date = lesson.publishedAt
    ? format.dateTime(new Date(lesson.publishedAt), {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link
      href={{
        pathname: "/bai-hoc/[topic]/[slug]",
        params: { topic: lesson.topic, slug: lesson.slug },
      }}
      className={CARD}
    >
      <div className="flex items-start gap-3">
        <div
          className="relative size-24 shrink-0 overflow-hidden rounded-xl"
          style={{ background: tone.soft }}
        >
          <span
            aria-hidden
            className="absolute -bottom-2 right-1.5 text-[64px] font-extrabold leading-none tracking-[-0.04em] text-black/[0.09]"
          >
            {topicNumber(lesson.topic)}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <TopicChip topic={lesson.topic} label={tTopics(`${lesson.topic}.title`)} />
          <h3 className="text-base font-bold leading-[1.3] tracking-[-0.01em] text-text [overflow-wrap:anywhere]">
            {lesson.title}
          </h3>
          {lesson.excerpt && (
            <p className="line-clamp-2 text-sm leading-[1.5] text-text-muted">{lesson.excerpt}</p>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-hairline pt-3 text-[13px] text-text-muted">
        {lesson.difficulty && (
          <DifficultyMark difficulty={lesson.difficulty} label={tDifficulty(lesson.difficulty)} />
        )}
        {date && (
          <time
            dateTime={lesson.publishedAt ?? undefined}
            className="before:mr-2 before:content-['·']"
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
