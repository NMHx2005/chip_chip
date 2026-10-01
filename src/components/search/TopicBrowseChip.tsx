import { Link } from "@/i18n/navigation";
import { TOPIC_TONE, type TopicId } from "@/lib/constants";
import { topicNumber } from "@/lib/post-display";

/** A topic with its number disc and lesson count, for the search page's "browse by topic". */
export function TopicBrowseChip({
  topic,
  label,
  count,
}: {
  topic: TopicId;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={{ pathname: "/bai-hoc/[topic]", params: { topic } }}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-border bg-surface pl-2 pr-3.5 text-sm font-medium text-text-nav transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:border-black/25"
    >
      <span
        aria-hidden
        className="grid size-7 shrink-0 place-items-center rounded-full border border-black/10 text-xs font-extrabold text-[#262626]"
        style={{ background: TOPIC_TONE[topic].soft }}
      >
        {topicNumber(topic)}
      </span>
      <span className="min-w-0 truncate">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="shrink-0 rounded-full bg-surface-muted px-[7px] py-[2px] text-xs font-semibold tabular-nums text-text-muted">
          {count}
        </span>
      )}
    </Link>
  );
}
