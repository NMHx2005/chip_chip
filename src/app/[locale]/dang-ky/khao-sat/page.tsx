import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SignupTypePage } from "@/components/signup/SignupTypePage";
import { signupTypeMetadata } from "@/lib/signup-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return signupTypeMetadata(locale, "survey");
}

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignupTypePage type="survey" />;
}
