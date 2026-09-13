import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { CommentActions } from "@/components/admin/CommentActions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string | null;
  body: string;
  is_post_author: boolean;
  is_hidden: boolean;
  created_at: string;
};

export default async function AdminCommentsPage() {
  await requireStaff();
  const supabase = createClient();

  // `author_email` is granted to no PostgREST role, so it is readable only
  // through the service role. `requireStaff` above is what authorises this;
  // comments cannot exist at all without the service role, since /api/comments
  // is the only writer.
  const { data } = await createAdminClient()
    .from("comments")
    .select(
      "id, post_id, author_name, author_email, body, is_post_author, is_hidden, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  // Post titles for context. Staff can read every post, drafts included.
  const postIds = Array.from(new Set(rows.map((r) => r.post_id)));
  const titles = new Map<string, string>();
  if (postIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, slug, locale")
      .in("id", postIds);
    for (const post of posts ?? []) {
      titles.set(post.id, `${post.title || "(chưa có tiêu đề)"} · ${post.locale.toUpperCase()}`);
    }
  }

  const visible = rows.filter((r) => !r.is_hidden).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
          Bình luận
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {rows.length} bình luận · {visible} đang hiển thị ·{" "}
          {rows.length - visible} đang ẩn
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          Chưa có bình luận nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className={
                row.is_hidden
                  ? "flex gap-4 rounded-2xl border border-border bg-surface-muted p-5 opacity-70"
                  : "flex gap-4 rounded-2xl border border-border bg-surface p-5"
              }
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text">
                    {row.author_name}
                  </span>

                  {row.is_post_author && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
                      Tác giả
                    </span>
                  )}

                  {row.is_hidden && (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                      Đang ẩn
                    </span>
                  )}

                  <time
                    dateTime={row.created_at}
                    className="text-xs text-text-muted"
                  >
                    {new Date(row.created_at).toLocaleString("vi-VN")}
                  </time>
                </div>

                {/* Email is shown here and nowhere else — it never reaches the public site. */}
                {row.author_email && (
                  <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                    {row.author_email}
                  </p>
                )}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-nav">
                  {row.body}
                </p>

                <p className="mt-2 text-xs text-text-muted">
                  Trong bài:{" "}
                  <span className="text-text-nav">
                    {titles.get(row.post_id) ?? "(không rõ)"}
                  </span>
                </p>
              </div>

              <CommentActions commentId={row.id} hidden={row.is_hidden} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
