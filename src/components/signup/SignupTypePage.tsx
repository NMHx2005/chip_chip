import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { SignupForm } from "@/components/signup/SignupForm";
import type { SignupType } from "@/components/signup/signup-kind";
import { Link } from "@/i18n/navigation";

/**
 * One sign-up page: the type is fixed by the route, and the visitor picked it on
 * /dang-ky. The four pages share this body; each has its own `page.tsx` for the
 * metadata.
 */
export async function SignupTypePage({ type }: { type: SignupType }) {
  const t = await getTranslations("signup");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t(`types.${type}`)} description={t(`typeHint.${type}`)} />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
          <div className="rounded-3xl border border-border bg-surface p-6 md:p-8">
            <SignupForm type={type} />
          </div>

          <Link
            href="/dang-ky"
            className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-accent underline underline-offset-4 transition-colors duration-fast ease-standard [@media(hover:hover)]:hover:text-black"
          >
            {t("back")}
          </Link>
        </div>
      </section>
    </>
  );
}
