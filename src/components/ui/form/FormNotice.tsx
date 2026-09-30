import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "success" | "note";

const TONES: Record<Tone, { box: string; icon: typeof Info; role: "alert" | "status" }> = {
  error: {
    box: "border-err-border bg-err-soft text-err-ink",
    icon: CircleAlert,
    role: "alert",
  },
  // Success reuses the site accent; red is kept for errors only.
  success: { box: "border-accent bg-ok-soft text-accent", icon: CircleCheck, role: "status" },
  note: { box: "border-border bg-surface-muted text-[#262626]", icon: Info, role: "status" },
};

/** A message under or above a form. The icon means it never relies on colour alone. */
export function FormNotice({
  tone,
  title,
  className,
  children,
}: {
  tone: Tone;
  title?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { box, icon: Icon, role } = TONES[tone];

  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm leading-[1.5] motion-safe:animate-notice-in",
        box,
        className
      )}
    >
      <Icon aria-hidden className="mt-px size-5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
