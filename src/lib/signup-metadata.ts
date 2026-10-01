import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SIGNUP_TYPE_PATHS, type SignupType } from "@/components/signup/signup-kind";
import type { Locale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

/**
 * Title, description and hreflang for one sign-up page, so the four thin
 * `page.tsx` files differ only by their type. The page body is `SignupTypePage`.
 */
export async function signupTypeMetadata(locale: string, type: SignupType): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "signup" });

  return {
    title: t(`types.${type}`),
    description: t(`typeHint.${type}`),
    alternates: localeAlternates(SIGNUP_TYPE_PATHS[type], locale as Locale),
  };
}
