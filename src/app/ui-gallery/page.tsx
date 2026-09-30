import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import messages from "@/messages/vi.json";
import { PostCardSamples } from "./PostCardSamples";
import { UiGalleryClient } from "./UiGalleryClient";

// Never indexed: a dev-only page for looking at the shared components.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Split from the client component so this file can stay a Server Component:
 * `notFound()` and `metadata` both need that. Same pattern as motion-gallery.
 */
export default function UiGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // The gallery lives outside [locale], so there is no ambient intl context.
  // Components that render a localized <Link> (Button with href) need one.
  // Server components on this page (PostCard) read the locale from the request.
  setRequestLocale("vi");

  return (
    <NextIntlClientProvider locale="vi" messages={messages}>
      <UiGalleryClient />
      <div className="pb-24">
        <PostCardSamples />
      </div>
    </NextIntlClientProvider>
  );
}
