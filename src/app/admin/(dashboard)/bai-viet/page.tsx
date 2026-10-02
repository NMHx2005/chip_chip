import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { AdminPagination } from "@/components/admin/AdminPagination";
import {
  ADMIN_PAGE_SIZE,
  adminListHref,
  adminOffset,
  adminPageCount,
  parseAdminSearch,
} from "@/lib/admin-listing";
import { parsePageParam } from "@/lib/listing-params";

// Admin data must never be cached or prerendered.
export const dynamic = "force-dynamic";

/** One row per translation group, as `admin_post_groups` returns it. */
type GroupRow = {
  translation_id: string;
  post_id: string;
  kind: "lesson" | "forum" | "video";
  topic: string | null;
  title: string;
  status: "draft" | "published";
  updated_at: string;
  vi_title: string | null;
  en_title: string | null;
  ready: boolean;
  total: number;
};

const KIND_LABEL = { lesson: "Bài học", forum: "Blog", video: "Video" } as const;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireStaff();
  const supabase = createClient();

  const q = parseAdminSearch(searchParams.q);
  const page = parsePageParam(searchParams.page);

  // Grouping and paging live in the database: an article is two rows sharing a
  // translation_id, so paging over raw rows would split one across two pages.
  const { data, error } = await supabase.rpc("admin_post_groups", {
    p_search: q || null,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: adminOffset(page),
  });

  const rows = (data ?? []) as GroupRow[];
  const total = rows[0]?.total ?? 0;
  const totalPages = adminPageCount(total);
  const hrefFor = (target: number) => adminListHref("/admin/bai-viet", { q, page: target });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
            Bài viết
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {total} bài. Mỗi bài cần đủ bản Việt và Anh mới đăng được.
          </p>
        </div>

        <Link
          href="/admin/bai-viet/moi"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          Viết bài mới
        </Link>
      </div>

      <form method="get" action="/admin/bai-viet" role="search" className="flex flex-wrap items-center gap-2">
        <label htmlFor="post-search" className="sr-only">
          Tìm bài viết
        </label>
        <input
          id="post-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Tìm theo tiêu đề hoặc slug…"
          className="h-10 w-full min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none sm:w-auto sm:max-w-[360px]"
        />
        <button
          type="submit"
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-text-nav transition-colors hover:border-black/20 hover:text-accent"
        >
          <Search className="size-4" strokeWidth={2.2} aria-hidden />
          Tìm
        </button>
        {q && (
          <Link href="/admin/bai-viet" className="text-xs text-text-muted underline">
            Xoá tìm kiếm
          </Link>
        )}
      </form>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
          Không đọc được danh sách bài. Thử tải lại trang.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          {q
            ? `Không có bài nào khớp “${q}”.`
            : page > 1
              ? "Trang này không có bài nào."
              : "Chưa có bài viết nào. Bắt đầu bằng nút “Viết bài mới”."}
          {page > 1 && (
            <>
              {" "}
              <Link href={hrefFor(1)} className="underline">
                Về trang đầu
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const published = row.status === "published";

            return (
              <li
                key={row.translation_id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-nav">
                      {KIND_LABEL[row.kind]}
                    </span>
                    {row.topic && (
                      <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-accent">
                        {row.topic}
                      </span>
                    )}
                    <span
                      className={
                        published
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800"
                          : "rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                      }
                    >
                      {published ? "Đã đăng" : "Nháp"}
                    </span>

                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className={row.vi_title ? "text-green-700" : "text-text-muted"}>
                        VI {row.vi_title ? "✓" : "—"}
                      </span>
                      <span className={row.en_title ? "text-green-700" : "text-amber-700"}>
                        EN {row.en_title ? "✓" : "thiếu"}
                      </span>
                    </span>
                  </div>

                  <Link
                    href={`/admin/bai-viet/${row.post_id}`}
                    className="mt-2.5 block truncate text-base font-semibold text-text transition-colors hover:text-accent"
                  >
                    {row.title || "(chưa có tiêu đề)"}
                  </Link>
                </div>

                <PostRowActions
                  translationId={row.translation_id}
                  status={row.status}
                  ready={row.ready}
                />
              </li>
            );
          })}
        </ul>
      )}

      <AdminPagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </div>
  );
}
