import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth";
import { CommentActions } from "@/components/admin/CommentActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  ADMIN_PAGE_SIZE,
  adminListHref,
  adminOffset,
  adminPageCount,
} from "@/lib/admin-listing";
import { parsePageParam } from "@/lib/listing-params";
import { COMMENT_STATUSES, type CommentStatus } from "@/lib/comment-status";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string | null;
  body: string;
  is_post_author: boolean;
  status: CommentStatus;
  created_at: string;
};

const TABS = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "hidden", label: "Đang ẩn" },
  { key: "all", label: "Tất cả" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_LABEL: Record<CommentStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  hidden: "Đang ẩn",
};

function isTabKey(value: string | undefined): value is TabKey {
  return TABS.some((tab) => tab.key === value);
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: { filter?: string; page?: string };
}) {
  await requireStaff();

  // The queue is what needs doing, so it is the tab the page opens on. The tab
  // travels as `?filter=`, the same parameter the message inbox uses.
  const active: TabKey = isTabKey(searchParams.filter) ? searchParams.filter : "pending";
  const path = "/admin/comments";
  const hrefFor = (target: number) =>
    adminListHref(path, { filter: active === "pending" ? undefined : active, page: target });

  // `author_email` is granted to no PostgREST role, so it is readable only
  // through the service role. `requireStaff` above is what authorises this;
  // comments cannot exist at all without the service role, since /api/comments
  // is the only writer.
  const admin = createAdminClient();

  const countResults = await Promise.all(
    COMMENT_STATUSES.map((status) =>
      admin.from("comments").select("id", { count: "exact", head: true }).eq("status", status)
    )
  );
  const countError = countResults.find((result) => result.error)?.error ?? null;
  const byStatus = Object.fromEntries(
    COMMENT_STATUSES.map((status, index) => [status, countResults[index].count ?? 0])
  ) as Record<CommentStatus, number>;
  const total = COMMENT_STATUSES.reduce((sum, status) => sum + byStatus[status], 0);

  const totalForTab = active === "all" ? total : byStatus[active];
  // A stale `?page=` past the end would otherwise render a bar with no current
  // page; pull it back into range instead.
  const page = Math.min(parsePageParam(searchParams.page), adminPageCount(totalForTab));
  const from = adminOffset(page);

  let query = admin
    .from("comments")
    .select("id, post_id, author_name, author_email, body, is_post_author, status, created_at")
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  if (active !== "all") query = query.eq("status", active);

  const { data, error } = await query;
  const rows = (data ?? []) as Row[];

  // Post titles for context. Staff can read every post, drafts included.
  const postIds = Array.from(new Set(rows.map((row) => row.post_id)));
  const titles = new Map<string, string>();
  if (postIds.length > 0) {
    const { data: posts } = await admin
      .from("posts")
      .select("id, title, locale")
      .in("id", postIds);
    for (const post of posts ?? []) {
      titles.set(post.id, `${post.title || "(chưa có tiêu đề)"} · ${post.locale.toUpperCase()}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Bình luận</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Bình luận của người đọc chỉ hiện sau khi được duyệt.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const count = tab.key === "all" ? total : byStatus[tab.key];
          return (
            <Link
              key={tab.key}
              href={adminListHref(path, { filter: tab.key === "pending" ? undefined : tab.key })}
              aria-current={active === tab.key ? "page" : undefined}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium tabular-nums transition-colors",
                active === tab.key
                  ? "border-border bg-surface-muted text-accent"
                  : "border-border bg-surface text-text-nav hover:border-black/20"
              )}
            >
              {tab.label} ({count})
            </Link>
          );
        })}
      </nav>

      {error || countError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
          Không đọc được bình luận. Thử tải lại trang.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          {active === "pending" ? "Không có bình luận nào chờ duyệt." : "Không có bình luận nào."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border border-border p-5 sm:flex-row",
                row.status === "approved" ? "bg-surface" : "bg-surface-muted"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text">{row.author_name}</span>

                  {row.is_post_author && (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-accent">
                      Tác giả
                    </span>
                  )}

                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                      row.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : row.status === "hidden"
                          ? "bg-surface px-2 text-text-muted"
                          : "bg-green-100 text-green-800"
                    )}
                  >
                    {STATUS_LABEL[row.status]}
                  </span>

                  <time dateTime={row.created_at} className="text-xs text-text-muted">
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
                  <span className="text-text-nav">{titles.get(row.post_id) ?? "(không rõ)"}</span>
                </p>
              </div>

              <CommentActions commentId={row.id} status={row.status} />
            </li>
          ))}
        </ul>
      )}

      <AdminPagination page={page} totalPages={adminPageCount(totalForTab)} hrefFor={hrefFor} />
    </div>
  );
}
