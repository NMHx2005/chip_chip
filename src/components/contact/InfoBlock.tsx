import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** One card in the contact page's aside: a round icon, a heading and its content. */
export function InfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-5">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-text">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-accent"
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
