import { getTranslations } from "next-intl/server";
import { PillButton } from "@/components/ui/PillButton";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-500">
        404
      </p>
      <h1 className="mt-4 text-balance text-[28px] font-extrabold tracking-[-0.02em] text-text md:text-[38px]">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-text-muted">
        {t("notFoundDescription")}
      </p>
      <div className="mt-8">
        <PillButton href="/" size="lg">
          {t("backHome")}
        </PillButton>
      </div>
    </section>
  );
}
