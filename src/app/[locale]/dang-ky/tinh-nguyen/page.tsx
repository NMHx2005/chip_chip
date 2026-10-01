import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignupTypePage } from "@/components/signup/SignupTypePage";
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
    title: t("types.volunteer"),
    description: t("typeHint.volunteer"),
    alternates: localeAlternates("/dang-ky/tinh-nguyen", locale as Locale),
  };
}

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignupTypePage type="volunteer" />;
}
