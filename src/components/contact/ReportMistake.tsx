import { getTranslations } from "next-intl/server";
import { Flag } from "lucide-react";
import { MessageForm } from "@/components/contact/MessageForm";
import { Disclosure } from "@/components/ui/Disclosure";

/**
 * "Report a mistake" under an article.
 *
 * The shared `Disclosure` (native `<details>`) inside a bordered card, so this
 * is the same open/close pattern as the rest of the site and needs no
 * JavaScript. Only the form inside is a client component.
 */
export async function ReportMistake({ postId }: { postId: string }) {
  const t = await getTranslations("contact.report");

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Disclosure
        size="sm"
        bodyClassName="border-t border-border pr-5"
        summary={
          <span className="flex items-center gap-2">
            <Flag aria-hidden className="size-4 shrink-0" strokeWidth={2} />
            {t("toggle")}
          </span>
        }
      >
        <p className="mb-5 leading-relaxed">{t("intro")}</p>
        <MessageForm variant="report" postId={postId} />
        <p className="mt-4 text-[13px] leading-relaxed">{t("limitNote")}</p>
      </Disclosure>
    </div>
  );
}
