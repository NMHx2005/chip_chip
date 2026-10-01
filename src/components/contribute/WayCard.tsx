import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TOPIC_IDS, TOPIC_TONE } from "@/lib/constants";

/**
 * One way to help: a tone plate with the icon (and its faint watermark), the
 * title and body, then a pill that opens the contact form. On phones the plate
 * is a 64px square on the left of the text.
 */
export function WayCard({
  icon: Icon,
  title,
  body,
  ctaLabel,
  index,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  ctaLabel: string;
  /** Picks one of the four neutral tones, the same the topic cards use. */
  index: number;
}) {
  const tone = TOPIC_TONE[TOPIC_IDS[index % TOPIC_IDS.length]].soft;

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
        style={{ background: tone }}
      >
        <span className="absolute left-3 top-3 grid size-10 place-items-center rounded-xl border border-black/[0.06] bg-white text-accent sm:left-4 sm:top-4 sm:size-12">
          <Icon aria-hidden className="size-5" strokeWidth={2} />
        </span>
        <Icon
          aria-hidden
          strokeWidth={1.5}
          className="absolute -bottom-6 -right-4 hidden size-[136px] text-black/[0.09] sm:block"
        />
      </div>

      <h3 className="text-lg font-bold tracking-[-0.01em] text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{body}</p>

      <div className="mt-auto border-t border-hairline pt-3">
        <Button href="/lien-he" variant="secondary">
          {ctaLabel}
          <span className="sr-only">: {title}</span>
        </Button>
      </div>
    </div>
  );
}
