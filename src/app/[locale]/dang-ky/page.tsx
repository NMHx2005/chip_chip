import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { SignupForm } from "@/components/signup/SignupForm";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "signup" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates("/dang-ky", locale as Locale),
  };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("signup");

  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto w-full max-w-[720px] rounded-3xl border border-border bg-surface p-6 md:p-8">
          <SignupForm />
        </div>
      </section>
    </>
  );
}
