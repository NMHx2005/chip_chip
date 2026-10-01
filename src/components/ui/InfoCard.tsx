import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** A static card: a round icon, a title and a line of body. Row on phones, column from `sm`. */
export function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-col sm:gap-2.5">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full border border-black/[0.08] bg-surface-muted text-accent"
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold leading-snug text-text">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-text-muted">{children}</div>
      </div>
    </div>
  );
}
