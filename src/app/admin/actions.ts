"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lookUpStaff } from "@/lib/auth";
import { routing, type Locale } from "@/i18n/routing";
import { slugify } from "@/lib/post-slug";
import { articleToPlainText } from "@/lib/tiptap/render";
import {
  buildSharedFieldsPatch,
  isUuid,
  validateNewPostFields,
  type SharedFieldsInput,
} from "@/lib/shared-fields";
import { postRowsFrom, revalidatePostRows, type PostRow } from "@/lib/revalidate-paths";
import { TranslateError, translateSegments } from "@/lib/translate/deepseek";
import {
  applyTranslations,
  prepareTranslation,
  type DraftText,
} from "@/lib/translate/segments";
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

/**
 * Drop every cached rendering of the given post rows so an edit shows up
 * immediately — the listings, and (per row, since each locale has its own
 * slug and, for a lesson, its own topic at the time it was fetched) the
 * lesson topic/detail pages or the blog detail page.
 */
async function revalidatePost(rows: PostRow[]) {
  for (const path of revalidatePostRows(rows)) {
    revalidatePath(path);
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

  await revalidatePost([
    {
      locale: data.locale as Locale,
      slug: data.slug,
      kind: data.kind as PostKind,
      topic: data.topic as TopicId | null,
    },
  ]);
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
    .select("locale, slug, kind, topic")
    .eq("translation_id", translationId);

  await revalidatePost(
    (data ?? []).map((row) => ({
      locale: row.locale as Locale,
      slug: row.slug as string,
      kind: row.kind as PostKind,
      topic: row.topic as TopicId | null,
    }))
  );

  return { ok: true };
}

export async function unpublishTranslation(
  translationId: string
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(translationId)) return fail("Mã bài viết không hợp lệ.");

  const supabase = createClient();

  // Read first: the group's own detail and topic pages are cached too, and
  // only the rows know their slugs and topic.
  const { data: rows } = await supabase
    .from("posts")
    .select("locale, slug, kind, topic")
    .eq("translation_id", translationId);

  const { error } = await supabase.rpc("unpublish_translation", {
    p_translation_id: translationId,
  });

  if (error) return fail(error.message);

  await revalidatePost(postRowsFrom(rows));
  return { ok: true };
}

export async function deleteTranslation(
  translationId: string
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(translationId)) return fail("Mã bài viết không hợp lệ.");

  const supabase = createClient();

  // After the delete there is nothing left to read the slugs from.
  const { data: rows } = await supabase
    .from("posts")
    .select("locale, slug, kind, topic")
    .eq("translation_id", translationId);

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  await revalidatePost(postRowsFrom(rows));
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

  const { data: rows } = await supabase
    .from("posts")
    .select("locale, slug, kind, topic, status")
    .eq("translation_id", translationId);

  if (!rows || rows.length === 0) return fail("Không tìm thấy bài viết.");

  const kind = rows[0].kind as PostKind;
  const published = rows[0].status === "published";
  const built = buildSharedFieldsPatch(kind, input, published);
  if (!built.ok) return fail(built.error);

  const { error } = await supabase
    .from("posts")
    .update(built.patch)
    .eq("translation_id", translationId);

  if (error) return fail(error.message);

  // Revalidate both the rows' old shape and their new one, so a topic change
  // clears the old topic page too, not just the new one.
  const oldRows: PostRow[] = rows.map((row) => ({
    locale: row.locale as Locale,
    slug: row.slug as string,
    kind,
    topic: row.topic as TopicId | null,
  }));
  const newRows: PostRow[] = rows.map((row) => ({
    locale: row.locale as Locale,
    slug: row.slug as string,
    kind,
    topic: built.patch.topic,
  }));
  await revalidatePost([...oldRows, ...newRows]);
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

/** Leaves room under the edit page's `maxDuration` (120 s) for the DB read and the reply. */
const TRANSLATE_BUDGET_MS = 100_000;

export type TranslateDraftResult = ActionResult & {
  draft?: DraftText;
  /** Segments kept in Vietnamese because the model's answer did not fit. */
  untranslated?: number;
  total?: number;
};

/**
 * Drafts the English version of a group from its saved Vietnamese row.
 *
 * Writes nothing: the editor loads the result into the EN tab as unsaved
 * changes, and the writer saves through `savePost` after reading it. Only the
 * article's own text goes to DeepSeek.
 */
export async function translateDraft(translationId: string): Promise<TranslateDraftResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(translationId)) return fail("Mã bài viết không hợp lệ.");

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fail("Chưa cấu hình DEEPSEEK_API_KEY nên chưa dịch bằng AI được.");

  const startedAt = Date.now();
  const { data: vi } = await createClient()
    .from("posts")
    .select("title, excerpt, content")
    .eq("translation_id", translationId)
    .eq("locale", "vi")
    .maybeSingle();

  if (!vi) return fail("Không tìm thấy bản tiếng Việt của bài này.");

  const source: DraftText = {
    title: vi.title ?? "",
    excerpt: vi.excerpt ?? "",
    content: vi.content ?? { type: "doc", content: [] },
  };

  const prepared = prepareTranslation(source);
  if (!prepared.ok) return fail(prepared.error);

  try {
    const translations = await translateSegments(
      prepared.segments.map(({ id, text }) => ({ id, text })),
      {
        apiKey,
        model: process.env.DEEPSEEK_MODEL || undefined,
        deadline: startedAt + TRANSLATE_BUDGET_MS,
      }
    );
    const { draft, untranslated } = applyTranslations(source, prepared.segments, translations);
    return { ok: true, draft, untranslated, total: prepared.segments.length };
  } catch (error) {
    if (error instanceof TranslateError) return fail(error.message);
    return fail("Không dịch được lúc này. Thử lại sau.");
  }
}

/** Signs out and returns to the login screen. */
export async function signOutAndRedirect() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/dang-nhap");
}
