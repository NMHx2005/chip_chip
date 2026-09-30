import { getTranslations } from "next-intl/server";
import { ChevronDown, Flag } from "lucide-react";
import { MessageForm } from "@/components/contact/MessageForm";

/**
 * "Report a mistake" under an article.
 *
 * A native `<details>`: opening and closing needs no JavaScript and works with
 * keyboard and screen readers as is. Only the form inside is a client
 * component. Closed by default; nothing ever needs to force it open, so the
 * DA3 caveat about CSS and closed `<details>` does not apply here.
 */
export async function ReportMistake({ postId }: { postId: string }) {
  const t = await getTranslations("contact.report");

  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-text-nav transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
        <Flag className="size-4" strokeWidth={2} aria-hidden />
        {t("toggle")}
        <ChevronDown
          className="ml-auto size-4 transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
          strokeWidth={2.2}
          aria-hidden
        />
      </summary>

      <div className="border-t border-border px-5 pb-6 pt-5">
        <p className="mb-5 text-sm leading-relaxed text-text-muted">{t("intro")}</p>
        <MessageForm variant="report" postId={postId} />
      </div>
    </details>
  );
}
