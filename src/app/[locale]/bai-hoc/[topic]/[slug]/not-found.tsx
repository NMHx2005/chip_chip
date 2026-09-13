import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

/** Rendered when a lesson slug does not resolve to a published post. */
export default async function LessonNotFound() {
  const t = await getTranslations("lessons");

  return (
    <section className="px-5 py-24 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          404
        </p>
        <h1 className="mt-4 text-balance text-[26px] font-extrabold tracking-[-0.02em] text-text md:text-[34px]">
          {t("notFound")}
        </h1>

        <Link
          href="/bai-hoc"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
          {t("backToLessons")}
        </Link>
      </div>
    </section>
  );
}
