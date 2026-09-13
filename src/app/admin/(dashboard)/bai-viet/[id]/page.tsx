import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { PostEditor, type Draft } from "@/components/admin/PostEditor";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { routing, type Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  translation_id: string;
  locale: Locale;
  kind: "lesson" | "forum";
  topic: TopicId | null;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content: JSONContent;
  status: "draft" | "published";
};

const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const supabase = createClient();

  const { data: anchor } = await supabase
    .from("posts")
    .select("translation_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!anchor) notFound();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, translation_id, locale, kind, topic, title, slug, excerpt, cover_image_url, content, status"
    )
    .eq("translation_id", anchor.translation_id);

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) notFound();

  // Every translation group is created with both locales, but stay defensive:
  // a row removed by hand should not crash the editor.
  const drafts = {} as Record<Locale, Draft>;
  for (const locale of routing.locales) {
    const row = rows.find((r) => r.locale === locale);
    drafts[locale] = {
      id: row?.id ?? "",
      locale,
      title: row?.title ?? "",
      slug: row?.slug ?? "",
      excerpt: row?.excerpt ?? "",
      coverImageUrl: row?.cover_image_url ?? null,
      content: row?.content ?? EMPTY_DOC,
    };
  }

  const primary = rows.find((r) => r.id === params.id) ?? rows[0];
  const missingLocale = routing.locales.some((locale) => !drafts[locale].id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
          {primary.title || "(chưa có tiêu đề)"}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {primary.kind === "lesson" ? "Bài học" : "Diễn đàn"}
          {primary.topic ? ` · ${primary.topic}` : ""} ·{" "}
          {primary.status === "published" ? "Đã đăng" : "Bản nháp"}
        </p>
      </div>

      {missingLocale ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Bài này thiếu một trong hai bản ngôn ngữ trong cơ sở dữ liệu. Hãy tạo
          lại bài để có đủ bản Việt và Anh.
        </p>
      ) : (
        <PostEditor
          translationId={anchor.translation_id as string}
          initialDrafts={drafts}
          status={primary.status}
        />
      )}
    </div>
  );
}
