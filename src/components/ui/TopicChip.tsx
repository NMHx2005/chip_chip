import { TOPIC_TONE, type TopicId } from "@/lib/constants";
import { topicNumber } from "@/lib/post-display";
import { cn } from "@/lib/utils";

/**
 * A topic as a number in a disc plus its name. The four topics used to differ
 * only by a shade of grey; the number tells them apart without relying on
 * colour. A long name (English) is cut to one line with an ellipsis.
 */
export function TopicChip({
  topic,
  label,
  className,
}: {
  topic: TopicId;
  label: string;
  className?: string;
}) {
  const tone = TOPIC_TONE[topic];

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 self-start justify-self-start rounded-full border border-black/[0.08] py-[3px] pl-[3px] pr-2.5 text-xs font-semibold leading-4 text-[#262626]",
        className
      )}
      style={{ background: tone.soft }}
    >
      <b
        aria-hidden
        className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-[11px] font-extrabold"
      >
        {topicNumber(topic)}
      </b>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
