"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { slugify } from "@/lib/post-slug";
import type { PostKind } from "@/lib/types";
import type { TopicId } from "@/lib/constants";

export type ActionResult = { ok: boolean; error?: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

/** Drop every cached rendering of a post so the edit shows up immediately. */
async function revalidatePost(slug: string, kind: PostKind, topic: TopicId | null) {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/dien-dan`);
    revalidatePath(`/${locale}/bai-hoc`);
    if (kind === "lesson" && topic) revalidatePath(`/${locale}/bai-hoc/${topic}`);
  }
  if (kind === "forum") {
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/dien-dan/${slug}`);
    }
  }
}

export type SavePostInput = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  content: unknown;
};

/**
 * The editor is the only writer, but the action is a public HTTP endpoint —
 * anything reaching the `content` column has to look like a Tiptap document
 * before it is stored, or the renderer has to cope with it forever.
 */
function isTiptapDoc(value: unknown): value is { type: "doc" } {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "doc" &&
    Array.isArray((value as { content?: unknown }).content)
  );
}

export async function savePost(input: SavePostInput): Promise<ActionResult> {
  await requireStaff();
  const supabase = createClient();

  const title = input.title.trim();
  if (!title) return fail("Tiêu đề không được để trống.");

  if (!isTiptapDoc(input.content)) {
    return fail("Nội dung bài viết không hợp lệ.");
  }

  const slug = slugify(input.slug || input.title);
  if (!slug) return fail("Không tạo được đường dẫn từ tiêu đề.");

  const { data, error } = await supabase
    .from("posts")
    .update({
      title,
      slug,
      excerpt: input.excerpt.trim() || null,
      cover_image_url: input.coverImageUrl,
      content: input.content,
    })
    .eq("id", input.id)
    .select("slug, kind, topic, locale, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return fail("Đường dẫn này đã được dùng cho một bài khác cùng ngôn ngữ.");
    }
    return fail(error.message);
  }

  await revalidatePost(data.slug, data.kind as PostKind, data.topic as TopicId | null);
  return { ok: true };
}

/**
 * Creates a new article, with both locale rows present from the start.
 *
 * The translator fills in the English row second — but the row exists
 * immediately so publishing can require it (see `publishTranslation`).
 */
export async function createPost(args: {
  kind: PostKind;
  topic: TopicId | null;
  title: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string; id?: string; translationId?: string }> {
  const staff = await requireStaff();
  const supabase = createClient();

  const title = args.title.trim();
  if (!title) return fail("Tiêu đề không được để trống.");

  const baseSlug = slugify(args.slug || title);
  if (!baseSlug) return fail("Không tạo được đường dẫn từ tiêu đề.");

  const translationId = crypto.randomUUID();

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        translation_id: translationId,
        locale: "vi",
        kind: args.kind,
        topic: args.kind === "lesson" ? args.topic : null,
        title,
        slug: baseSlug,
        author_id: staff.id,
      },
      {
        translation_id: translationId,
        locale: "en",
        kind: args.kind,
        topic: args.kind === "lesson" ? args.topic : null,
        title: "",
        slug: `${baseSlug}-en`,
        author_id: staff.id,
      },
    ])
    .select("id, locale");

  if (error) {
    if (error.code === "23505") {
      return fail("Đường dẫn này đã tồn tại. Chọn tiêu đề hoặc đường dẫn khác.");
    }
    return fail(error.message);
  }

  const viRow = data?.find((row) => row.locale === "vi");
  if (!viRow) return fail("Không tạo được bài viết.");

  return { ok: true, id: viRow.id, translationId };
}

/** Publishes both locales at once. The gate itself lives in Postgres. */
export async function publishTranslation(
  translationId: string
): Promise<ActionResult> {
  await requireStaff();
  const supabase = createClient();

  const { error } = await supabase.rpc("publish_translation", {
    p_translation_id: translationId,
  });

  if (error) return fail(error.message);

  const { data } = await supabase
    .from("posts")
    .select("slug, kind, topic")
    .eq("translation_id", translationId);

  for (const row of data ?? []) {
    await revalidatePost(
      row.slug as string,
      row.kind as PostKind,
      row.topic as TopicId | null
    );
  }

  return { ok: true };
}

export async function unpublishTranslation(
  translationId: string
): Promise<ActionResult> {
  await requireStaff();
  const supabase = createClient();

  const { error } = await supabase.rpc("unpublish_translation", {
    p_translation_id: translationId,
  });

  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dien-dan`);
    revalidatePath(`/${locale}/bai-hoc`);
  }
  return { ok: true };
}

export async function deleteTranslation(
  translationId: string
): Promise<ActionResult> {
  await requireStaff();
  const supabase = createClient();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dien-dan`);
    revalidatePath(`/${locale}/bai-hoc`);
  }
  return { ok: true };
}

export async function setCommentHidden(
  commentId: string,
  hidden: boolean
): Promise<ActionResult> {
  await requireStaff();
  const supabase = createClient();

  const { error } = await supabase
    .from("comments")
    .update({ is_hidden: hidden })
    .eq("id", commentId);

  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dien-dan`);
  }
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = createClient();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dien-dan`);
  }
  return { ok: true };
}

/** Signs out and returns to the login screen. */
export async function signOutAndRedirect() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/dang-nhap");
}
