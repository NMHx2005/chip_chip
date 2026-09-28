import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { PostEditor, type Draft } from "@/components/admin/PostEditor";
import { SharedFieldsPanel, type LessonOption } from "@/components/admin/SharedFieldsPanel";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { routing, type Locale } from "@/i18n/routing";
import type { TopicId } from "@/lib/constants";
import type { Difficulty, VideoSource } from "@/lib/types";
import { watchUrl, type VideoPlatform } from "@/lib/video";

export const dynamic = "force-dynamic";
// "Dịch nháp bằng AI" runs as a Server Action of this page and may send
// several sequential requests to DeepSeek (see translateDraft).
export const maxDuration = 120;

type Row = {
  id: string;
  translation_id: string;
  locale: Locale;
  kind: "lesson" | "forum" | "video";
  topic: TopicId | null;
  difficulty: Difficulty | null;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content: JSONContent;
  status: "draft" | "published";
  video_platform: VideoPlatform | null;
  video_external_id: string | null;
  video_source: VideoSource | null;
  channel_name: string | null;
  related_lesson_translation_id: string | null;
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
      "id, translation_id, locale, kind, topic, difficulty, title, slug, excerpt, cover_image_url, content, status, video_platform, video_external_id, video_source, channel_name, related_lesson_translation_id"
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

  // Rebuilt from the stored (platform, id) pair rather than read back as a
  // URL — see src/lib/video.ts. The watch link is what staff would paste, and
  // parseVideoUrl reads it back to the same pair.
  const videoUrl =
    primary.video_platform && primary.video_external_id
      ? watchUrl({ platform: primary.video_platform, externalId: primary.video_external_id })
      : "";

  // A video can point at one lesson; staff pick it by its Vietnamese title.
  let lessonOptions: LessonOption[] = [];
  if (primary.kind === "video") {
    // Lessons list is larger by design than comments/tin-nhan (.limit(200));
    // still bounded so this query can't grow unbounded with the catalog.
    const { data: lessons } = await supabase
      .from("posts")
      .select("translation_id, title")
      .eq("kind", "lesson")
      .eq("locale", "vi")
      .order("title")
      .limit(500);
    lessonOptions = (lessons ?? []).map((lesson) => ({
      translationId: lesson.translation_id as string,
      title: (lesson.title as string) || "(chưa có tiêu đề)",
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
          {primary.title || "(chưa có tiêu đề)"}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {{ lesson: "Bài học", forum: "Blog", video: "Video" }[primary.kind]}
          {primary.topic ? ` · ${primary.topic}` : ""} ·{" "}
          {primary.status === "published" ? "Đã đăng" : "Bản nháp"}
        </p>
      </div>

      {missingLocale && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Bài này thiếu một trong hai bản ngôn ngữ trong cơ sở dữ liệu. Bạn vẫn
          có thể chỉnh sửa bản còn lại bên dưới, nhưng cần tạo lại bài để có đủ
          bản Việt và Anh.
        </p>
      )}

      {(primary.kind === "lesson" || primary.kind === "video") && (
        <SharedFieldsPanel
          translationId={anchor.translation_id as string}
          kind={primary.kind}
          initialTopic={primary.topic}
          initialDifficulty={primary.difficulty}
          videoUrl={videoUrl}
          videoSource={primary.video_source}
          channelName={primary.channel_name ?? ""}
          relatedLessonTranslationId={primary.related_lesson_translation_id}
          lessonOptions={lessonOptions}
        />
      )}

      <PostEditor
        translationId={anchor.translation_id as string}
        initialDrafts={drafts}
        status={primary.status}
        translateEnabled={Boolean(process.env.DEEPSEEK_API_KEY)}
      />
    </div>
  );
}
