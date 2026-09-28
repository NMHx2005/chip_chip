import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionGalleryClient } from "./MotionGalleryClient";

// Never indexed — see MotionGalleryClient.tsx for what this page is for.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Split from the client component so this file can stay a Server Component:
 * `notFound()` and `metadata` both need that, and a "use client" file can do
 * neither.
 */
export default function MotionGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MotionGalleryClient />;
}
