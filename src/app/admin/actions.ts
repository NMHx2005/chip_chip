"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lookUpStaff } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { slugify } from "@/lib/post-slug";
import { articleToPlainText } from "@/lib/tiptap/render";
import {
  buildSharedFieldsPatch,
  isUuid,
  validateNewPostFields,
  type SharedFieldsInput,
} from "@/lib/shared-fields";
import type { Difficulty, PostKind } from "@/lib/types";
import type { TopicId } from "@/lib/constants";

export type ActionResult = {
  ok: boolean;
  error?: string;
  /** The staff session is gone; the component should send them to log in. */
  unauthorized?: boolean;
};

function fail(error: string): ActionResult {
  return { ok: false, error };
}

/**
 * What every action returns instead of redirecting when the session has ended.
 *
 * `requireStaff()` answers with a redirect, and a redirect out of a Server
 * Action never reaches the browser as a navigation: the promise resolves with
 * `undefined`, so the caller either crashed on `result.ok` (the admin error
 * boundary then blamed the Supabase connection) or silently did nothing while
 * the reader believed the save had gone through. A value the caller can read
 * is the only thing that works here.
 */
const SESSION_ENDED: ActionResult = {
  ok: false,
  unauthorized: true,
  error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

/** Long enough for any real article; the search index ranks body text lowest anyway. */
const PLAIN_TEXT_LIMIT = 20000;

/** Drop every cached rendering of a post so the edit shows up immediately. */
async function revalidatePost(slug: string, kind: PostKind, topic: TopicId | null) {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/bai-hoc`);
    if (kind === "lesson" && topic) revalidatePath(`/${locale}/bai-hoc/${topic}`);
  }
  if (kind === "forum") {
    for (const locale of routing.locales) {
      revalidatePath(`/${locale}/blog/${slug}`);
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
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

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
      plain_text: articleToPlainText(input.content, PLAIN_TEXT_LIMIT),
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
  difficulty: Difficulty | null;
  title: string;
  slug: string;
}): Promise<{ ok: boolean; error?: string; unauthorized?: boolean; id?: string; translationId?: string }> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const staff = lookup.staff;
  const supabase = createClient();

  const title = args.title.trim();
  if (!title) return fail("Tiêu đề không được để trống.");

  const baseSlug = slugify(args.slug || title);
  if (!baseSlug) return fail("Không tạo được đường dẫn từ tiêu đề.");

  const fields = validateNewPostFields(args.kind, args.topic, args.difficulty);
  if (!fields.ok) return fail(fields.error);

  const translationId = crypto.randomUUID();

  const { data, error } = await supabase
    .from("posts")
    .insert([
      {
        translation_id: translationId,
        locale: "vi",
        kind: args.kind,
        topic: fields.topic,
        difficulty: fields.difficulty,
        title,
        slug: baseSlug,
        author_id: staff.id,
      },
      {
        translation_id: translationId,
        locale: "en",
        kind: args.kind,
        topic: fields.topic,
        difficulty: fields.difficulty,
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
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

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
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();

  const { error } = await supabase.rpc("unpublish_translation", {
    p_translation_id: translationId,
  });

  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/bai-hoc`);
  }
  return { ok: true };
}

export async function deleteTranslation(
  translationId: string
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/bai-hoc`);
  }
  return { ok: true };
}

export async function setCommentHidden(
  commentId: string,
  hidden: boolean
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();

  const { error } = await supabase
    .from("comments")
    .update({ is_hidden: hidden })
    .eq("id", commentId);

  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/blog`);
  }
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return fail(error.message);

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/blog`);
  }
  return { ok: true };
}

/**
 * Writes the fields the VI and EN rows share, in one statement over the whole
 * translation group, so the two rows cannot drift apart.
 */
export async function saveSharedFields(
  translationId: string,
  input: SharedFieldsInput
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  if (!isUuid(translationId)) return fail("Mã bài viết không hợp lệ.");

  const supabase = createClient();

  const { data: group } = await supabase
    .from("posts")
    .select("kind, slug, status")
    .eq("translation_id", translationId)
    .limit(1)
    .maybeSingle();

  if (!group) return fail("Không tìm thấy bài viết.");

  const kind = group.kind as PostKind;
  const published = group.status === "published";
  const built = buildSharedFieldsPatch(kind, input, published);
  if (!built.ok) return fail(built.error);

  const { error } = await supabase
    .from("posts")
    .update(built.patch)
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  await revalidatePost(group.slug as string, kind, built.patch.topic);
  return { ok: true };
}

/**
 * Recomputes `plain_text` for every post.
 *
 * `savePost` keeps it current from now on; this covers articles written
 * before the column existed and any row edited by hand in the database.
 * Only rows whose text actually changed are written.
 */
export async function rebuildSearchText(): Promise<ActionResult & { updated?: number }> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const supabase = createClient();
  const { data, error } = await supabase.from("posts").select("id, content, plain_text");
  if (error) return fail(error.message);

  let updated = 0;
  for (const row of data ?? []) {
    const text = articleToPlainText(row.content, PLAIN_TEXT_LIMIT);
    if (text === row.plain_text) continue;
    const { error: writeError } = await supabase
      .from("posts")
      .update({ plain_text: text })
      .eq("id", row.id);
    if (writeError) return fail(writeError.message);
    updated += 1;
  }

  return { ok: true, updated };
}

export async function setMessageHandled(
  messageId: string,
  handled: boolean
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(messageId)) return fail("Mã tin nhắn không hợp lệ.");

  const { error } = await createClient()
    .from("messages")
    .update({ is_handled: handled })
    .eq("id", messageId);

  if (error) return fail(error.message);
  revalidatePath("/admin/tin-nhan");
  return { ok: true };
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(messageId)) return fail("Mã tin nhắn không hợp lệ.");

  const { error } = await createClient().from("messages").delete().eq("id", messageId);
  if (error) return fail(error.message);
  revalidatePath("/admin/tin-nhan");
  return { ok: true };
}

/** Signs out and returns to the login screen. */
export async function signOutAndRedirect() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/dang-nhap");
}
