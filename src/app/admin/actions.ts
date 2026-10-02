"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { lookUpStaff } from "@/lib/auth";
import { tempPassword } from "@/lib/staff";
import type { Locale } from "@/i18n/routing";
import { isCommentStatus, type CommentStatus } from "@/lib/comment-status";
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
import type { Difficulty, PostKind, PostStatus } from "@/lib/types";
import type { TopicId } from "@/lib/constants";
import {
  REVISION_KEEP,
  revisionChanged,
  type RevisionSnapshot,
} from "@/lib/revisions";
import { MEDIA_BUCKET, isMediaPath, mediaPublicUrl, postsUsingUrl } from "@/lib/media";

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
 * Logs the database error and answers the screen with generic copy.
 *
 * PostgREST's `message` (and `details`/`hint`) name tables, columns and
 * constraints — useful in the server log, not on a page a writer is looking
 * at. Errors that must reach the writer (a duplicate slug, a publish-gate
 * rejection) are mapped to their own friendly text before this is reached.
 */
function dbFail(
  context: string,
  error: { message: string; code?: string }
): ActionResult {
  console.error(`[admin:${context}]`, error.code ?? "", error.message);
  return fail("Không thực hiện được thao tác. Vui lòng thử lại.");
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

  const excerpt = input.excerpt.trim() || null;

  // Read the row first: the snapshot has to hold what the article looked like
  // *before* this save, and only a write that changes something is worth one.
  const { data: before } = await supabase
    .from("posts")
    .select(REVISION_COLUMNS)
    .eq("id", input.id)
    .maybeSingle<RevisionRow>();

  const changed =
    before !== null &&
    revisionChanged(toSnapshot(before), {
      title,
      slug,
      excerpt,
      coverImageUrl: input.coverImageUrl,
      content: input.content,
      status: before.status as PostStatus,
    });

  const { data, error } = await supabase
    .from("posts")
    .update({
      title,
      slug,
      excerpt,
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
    return dbFail("savePost", error);
  }

  // Snapshotted after the write succeeded, holding the values read before it: a
  // rejected save must not leave a revision of a state that was never replaced.
  if (changed && before) await snapshotPost(supabase, before, lookup.staff.id);

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
    return dbFail("createPost", error);
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

  // Read before publishing: only these rows know the state to snapshot and the
  // URLs to revalidate, and both are the readers' before the change.
  const { data: before } = await supabase
    .from("posts")
    .select(`${REVISION_COLUMNS}, locale, kind, topic`)
    .eq("translation_id", translationId);

  const { error } = await supabase.rpc("publish_translation", {
    p_translation_id: translationId,
  });

  // The publish gate raises its own Vietnamese guidance under SQLSTATE 23514
  // (missing translation, empty body, difficulty missing) — that text is for
  // the writer. Anything else is an unexpected database failure.
  if (error) {
    if (error.code === "23514") return fail(error.message);
    return dbFail("publishTranslation", error);
  }

  // Written after the gate accepted, so a refused publish leaves no snapshot.
  for (const row of (before ?? []) as RevisionRow[]) {
    await snapshotPost(supabase, row, lookup.staff.id);
  }

  await revalidatePost(postRowsFrom(before));

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
    .select(`${REVISION_COLUMNS}, locale, kind, topic`)
    .eq("translation_id", translationId);

  const { error } = await supabase.rpc("unpublish_translation", {
    p_translation_id: translationId,
  });

  if (error) return dbFail("unpublishTranslation", error);

  // Taking a live article down is exactly the kind of change someone wants to
  // look back at, so it is snapshotted like an edit.
  for (const row of (rows ?? []) as RevisionRow[]) {
    await snapshotPost(supabase, row, lookup.staff.id);
  }

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

  if (error) return dbFail("deleteTranslation", error);

  await revalidatePost(postRowsFrom(rows));
  return { ok: true };
}

/**
 * Refreshes every page a comment appears on.
 *
 * Comments are rendered on blog *and* video detail pages, not only in the blog
 * listing — moderating one used to leave a hidden comment visible on a video
 * page until that page happened to rebuild. The comment's own post is looked up
 * so the article's URL is revalidated along with the listings.
 */
async function revalidateCommentPost(postId: string | null): Promise<void> {
  if (!postId) return;
  const supabase = createClient();
  const { data } = await supabase
    .from("posts")
    .select("locale, slug, kind, topic")
    .eq("id", postId)
    .maybeSingle();

  await revalidatePost(postRowsFrom(data ? [data] : []));
}

/** The two values `staff_role` allows. */
export type StaffRole = "admin" | "editor";

function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "editor";
}

/** The guard codes `admin_set_staff` raises, in the writer's language. */
const STAFF_GUARD_MESSAGE: Record<string, string> = {
  self_change: "Không tự đổi quyền của chính mình được — nhờ một quản trị viên khác.",
  not_found: "Không tìm thấy người này.",
};

/** Activates or deactivates a staff member, or moves them between roles. */
export async function setStaffAccess(
  targetId: string,
  isActive: boolean,
  role: StaffRole
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (lookup.staff.role !== "admin") return fail("Chỉ quản trị viên mới đổi được quyền.");
  if (!isUuid(targetId)) return fail("Không tìm thấy người này.");
  if (!isStaffRole(role)) return fail("Vai trò không hợp lệ.");

  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_staff", {
    p_target: targetId,
    p_is_active: isActive,
    p_role: role,
  });

  if (error) {
    // The guards raise 23514 with a short detail code (like the publish gate).
    if (error.code === "23514") {
      return fail(
        STAFF_GUARD_MESSAGE[error.details ?? ""] ?? "Không đổi được quyền của người này."
      );
    }
    return dbFail("setStaffAccess", error);
  }

  revalidatePath("/admin/nguoi-dung");
  return { ok: true };
}

/**
 * Creates a staff account with a temporary password.
 *
 * Signing up is open, but an account is not staff until it is activated, and
 * the Admin API is the only way to create one whose email is already confirmed
 * — someone being let into the CMS should not have to walk through the public
 * signup first.
 */
export async function createStaffAccount(input: {
  email: string;
  displayName: string;
  role: StaffRole;
  isActive: boolean;
}): Promise<ActionResult & { password?: string }> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (lookup.staff.role !== "admin") return fail("Chỉ quản trị viên mới tạo được tài khoản.");
  if (!isSupabaseAdminConfigured) return fail("Chưa cấu hình khoá service role trên server.");

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Email không hợp lệ.");
  if (!isStaffRole(input.role)) return fail("Vai trò không hợp lệ.");

  const displayName = input.displayName.trim();
  const password = tempPassword();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    // The address is vouched for by an admin who is creating the account; a
    // confirmation round-trip would only get in the way.
    email_confirm: true,
    user_metadata: { display_name: displayName || email.split("@")[0] },
  });

  if (error) {
    // 422 + email_exists is GoTrue's answer for a taken address; the wording of
    // its message is not a contract, so the code is checked first.
    const taken = error.status === 422 || error.code === "email_exists";
    if (taken || /already|exists/i.test(error.message)) {
      return fail("Email này đã có tài khoản.");
    }
    console.error("[admin:createStaffAccount]", error.message);
    return fail("Không tạo được tài khoản. Vui lòng thử lại.");
  }

  const userId = data?.user?.id;
  if (!userId) {
    console.error("[admin:createStaffAccount] the Admin API returned no user");
    return fail("Không tạo được tài khoản. Vui lòng thử lại.");
  }

  // The signup trigger creates every profile as an inactive editor, so the
  // role and state the admin chose have to be applied on top of it.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: input.role, is_active: input.isActive })
    .eq("id", userId);

  if (profileError) {
    // The account exists but is unusable, and its password was never shown —
    // and the address is now taken, so retrying the form would only fail. Take
    // the half-made account out and let the admin start again cleanly.
    console.error("[admin:createStaffAccount:profile]", profileError.code, profileError.message);
    const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
    if (cleanupError) {
      console.error("[admin:createStaffAccount:cleanup]", cleanupError.message);
      return fail("Tạo tài khoản lỗi giữa chừng. Xoá tài khoản này trong Supabase rồi thử lại.");
    }
    return fail("Không tạo được tài khoản. Vui lòng thử lại.");
  }

  revalidatePath("/admin/nguoi-dung");
  // Handed back once, to pass on to the person; never stored or logged.
  return { ok: true, password };
}

/**
 * Removes one image from the media bucket.
 *
 * Refused while an article still points at it: the cover and the body document
 * both hold plain URLs, so deleting one out from under a live page would leave
 * a broken image with nothing to explain it.
 */
export async function deleteMediaObject(path: string): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  // The path comes from the browser; only shapes the uploader writes may reach
  // Storage (see isMediaPath).
  if (!isMediaPath(path)) return fail("Đường dẫn ảnh không hợp lệ.");

  const supabase = createClient();
  const url = mediaPublicUrl(path);

  const { data: posts, error: readError } = await supabase
    .from("posts")
    .select("id, title, content, cover_image_url");

  if (readError) return dbFail("deleteMediaObject:read", readError);

  const used = postsUsingUrl(
    (posts ?? []).map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      coverImageUrl: post.cover_image_url,
    })),
    url
  );

  if (used.length > 0) {
    const names = used.slice(0, 3).map((post) => `“${post.title}”`).join(", ");
    return fail(
      used.length > 3
        ? `Ảnh đang được dùng trong ${used.length} bài (${names}…). Gỡ khỏi các bài đó trước.`
        : `Ảnh đang được dùng trong ${names}. Gỡ khỏi bài đó trước.`
    );
  }

  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) return dbFail("deleteMediaObject", error);

  revalidatePath("/admin/thu-vien");
  return { ok: true };
}

/**
 * Saves the values the settings screen owns.
 *
 * Only these four are writable; everything else about the site is code. The
 * values are validated here because they end up in an emailed `mailto:`, in
 * anchors, and in a `<time>` attribute on public pages.
 */
export async function saveSiteSettings(input: {
  contactEmail: string;
  facebook: string;
  tiktok: string;
  responseVi: string;
  responseEn: string;
  privacyUpdated: string;
}): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;

  const contactEmail = input.contactEmail.trim();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return fail("Email liên hệ không hợp lệ.");
  }

  const socialLinks = [
    { key: "facebook", href: input.facebook.trim() },
    { key: "tiktok", href: input.tiktok.trim() },
  ];
  for (const link of socialLinks) {
    // `https://` only: these become anchors with target="_blank".
    if (link.href && !/^https:\/\//i.test(link.href)) {
      return fail("Liên kết mạng xã hội phải bắt đầu bằng https://");
    }
  }

  const privacyUpdated = input.privacyUpdated.trim();
  if (privacyUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(privacyUpdated)) {
    return fail("Ngày cập nhật chính sách phải theo dạng NĂM-THÁNG-NGÀY.");
  }

  // An empty note falls back to the message copy, so blank is not stored.
  const responseTime: Record<string, string> = {};
  if (input.responseVi.trim()) responseTime.vi = input.responseVi.trim();
  if (input.responseEn.trim()) responseTime.en = input.responseEn.trim();

  const stamp = new Date().toISOString();
  const rows = [
    { key: "contact_email", value: contactEmail },
    { key: "social_links", value: socialLinks },
    { key: "response_time", value: responseTime },
    { key: "privacy_updated", value: privacyUpdated },
  ].map((row) => ({ ...row, updated_at: stamp, updated_by: lookup.staff.id }));

  const { error } = await createClient()
    .from("site_settings")
    .upsert(rows, { onConflict: "key" });

  if (error) return dbFail("saveSiteSettings", error);

  // These reach every page (the footer, the contact page), so the whole app.
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Every column a snapshot keeps, read back as a row. */
const REVISION_COLUMNS = "id, title, slug, excerpt, cover_image_url, content, status";

type RevisionRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content: unknown;
  status: string;
};

function toSnapshot(row: RevisionRow): RevisionSnapshot {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    content: row.content,
    status: row.status as PostStatus,
  };
}

/**
 * Records a post's current state before a write replaces it, then trims the
 * history to the newest `REVISION_KEEP`.
 *
 * History is a safety net, not part of the write: a failure here is logged and
 * the save goes ahead, because refusing to save would be worse than losing the
 * snapshot.
 */
async function snapshotPost(
  supabase: ReturnType<typeof createClient>,
  row: RevisionRow,
  savedBy: string
): Promise<void> {
  const { error } = await supabase.from("post_revisions").insert({
    post_id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    cover_image_url: row.cover_image_url,
    content: row.content,
    status: row.status,
    saved_by: savedBy,
  });

  if (error) {
    console.error("[admin:snapshotPost]", error.code, error.message);
    return;
  }

  const { error: pruneError } = await supabase.rpc("prune_post_revisions", {
    p_post_id: row.id,
    p_keep: REVISION_KEEP,
  });
  if (pruneError) {
    console.error("[admin:prunePostRevisions]", pruneError.code, pruneError.message);
  }
}

/**
 * Puts an old snapshot's content back.
 *
 * The slug and the published state are deliberately left alone: restoring a
 * slug would break the article's public URL (and could collide with another
 * article), and publishing is a gated action, not a side effect of restoring.
 */
export async function restoreRevision(revisionId: string): Promise<
  ActionResult & {
    /** The restored row, so the editor can adopt it without a page reload. */
    restored?: {
      locale: Locale;
      title: string;
      excerpt: string;
      coverImageUrl: string | null;
      content: unknown;
    };
  }
> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(revisionId)) return fail("Không tìm thấy bản lưu.");

  const supabase = createClient();

  const { data: revision } = await supabase
    .from("post_revisions")
    .select("id, post_id, title, excerpt, cover_image_url, content")
    .eq("id", revisionId)
    .maybeSingle();

  if (!revision) return fail("Không tìm thấy bản lưu.");

  const { data: current } = await supabase
    .from("posts")
    .select(REVISION_COLUMNS)
    .eq("id", revision.post_id)
    .maybeSingle<RevisionRow>();

  if (!current) return fail("Bài viết không còn tồn tại.");

  const { data: updated, error } = await supabase
    .from("posts")
    .update({
      title: revision.title,
      excerpt: revision.excerpt,
      cover_image_url: revision.cover_image_url,
      content: revision.content,
      plain_text: articleToPlainText(revision.content, PLAIN_TEXT_LIMIT),
    })
    .eq("id", revision.post_id)
    .select("locale, slug, kind, topic")
    .single();

  if (error) return dbFail("restoreRevision", error);

  // Snapshot what was there before the restore — after the write succeeded, so
  // a failed restore does not leave a revision behind. Restoring is therefore
  // itself undoable.
  await snapshotPost(supabase, current, lookup.staff.id);

  await revalidatePost([
    {
      locale: updated.locale as Locale,
      slug: updated.slug,
      kind: updated.kind as PostKind,
      topic: updated.topic as TopicId | null,
    },
  ]);

  return {
    ok: true,
    restored: {
      locale: updated.locale as Locale,
      title: revision.title,
      excerpt: revision.excerpt ?? "",
      coverImageUrl: revision.cover_image_url,
      content: revision.content,
    },
  };
}

/**
 * Moves a comment between moderation states: approving it publishes it, hiding
 * it takes it down again.
 */
export async function setCommentStatus(
  commentId: string,
  status: CommentStatus
): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(commentId)) return fail("Không tìm thấy bình luận.");
  if (!isCommentStatus(status)) return fail("Trạng thái không hợp lệ.");

  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", commentId)
    .select("post_id")
    .maybeSingle();

  if (error) return dbFail("setCommentStatus", error);
  // No row means the comment is already gone (or a policy dropped it); saying
  // "ok" would leave the list looking unchanged for no stated reason.
  if (!data) return fail("Không tìm thấy bình luận.");

  await revalidateCommentPost(data.post_id);
  return { ok: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(commentId)) return fail("Không tìm thấy bình luận.");

  const supabase = createClient();

  // Read the post first: after the delete there is nothing left to look up.
  const { data: existing } = await supabase
    .from("comments")
    .select("post_id")
    .eq("id", commentId)
    .maybeSingle();

  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return dbFail("deleteComment", error);

  await revalidateCommentPost(existing?.post_id ?? null);
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

  if (error) return dbFail("saveSharedFields", error);

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
  if (error) return dbFail("rebuildSearchText:read", error);

  let updated = 0;
  for (const row of data ?? []) {
    const text = articleToPlainText(row.content, PLAIN_TEXT_LIMIT);
    if (text === row.plain_text) continue;
    const { error: writeError } = await supabase
      .from("posts")
      .update({ plain_text: text })
      .eq("id", row.id);
    if (writeError) return dbFail("rebuildSearchText:write", writeError);
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

  if (error) return dbFail("setMessageHandled", error);
  revalidatePath("/admin/tin-nhan");
  return { ok: true };
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  const lookup = await lookUpStaff();
  if (lookup.status !== "ok") return SESSION_ENDED;
  if (!isUuid(messageId)) return fail("Mã tin nhắn không hợp lệ.");

  const { error } = await createClient().from("messages").delete().eq("id", messageId);
  if (error) return dbFail("deleteMessage", error);
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
