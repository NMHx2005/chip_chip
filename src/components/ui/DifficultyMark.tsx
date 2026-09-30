import type { Difficulty } from "@/lib/types";
import { difficultyLevel } from "@/lib/post-display";
import { cn } from "@/lib/utils";

const BAR_HEIGHTS = ["h-[5px]", "h-2", "h-3"] as const;

/**
 * Difficulty as three rising bars plus the word. The bars fill up to the level
 * so it reads at a glance and without colour; the word is what a screen reader
 * gets, so the bars are hidden from it.
 */
export function DifficultyMark({
  difficulty,
  label,
  className,
}: {
  difficulty: Difficulty;
  label: string;
  className?: string;
}) {
  const level = difficultyLevel(difficulty);

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold text-[#262626]", className)}>
      <span aria-hidden className="inline-flex h-3 items-end gap-0.5">
        {BAR_HEIGHTS.map((height, index) => (
          <i
            key={height}
            className={cn(
              "block w-[3px] rounded-[1px] bg-current",
              height,
              index < level ? "opacity-100" : "opacity-25"
            )}
          />
        ))}
      </span>
      {label}
    </span>
  );
}
