import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

async function countRows(
  table: "posts" | "comments",
  filters: Record<string, string | boolean> = {}
) {
  const supabase = createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboard() {
  const staff = await requireStaff();

  const [publishedVi, publishedEn, drafts, hiddenComments, pendingEn] =
    await Promise.all([
      countRows("posts", { status: "published", locale: "vi" }),
      countRows("posts", { status: "published", locale: "en" }),
      countRows("posts", { status: "draft" }),
      countRows("comments", { is_hidden: true }),
      countRows("posts", { status: "draft", locale: "en" }),
    ]);

  const stats = [
    { label: "Bài đã đăng (VI)", value: publishedVi },
    { label: "Bài đã đăng (EN)", value: publishedEn },
    { label: "Bản nháp", value: drafts },
    { label: "Chờ dịch sang EN", value: pendingEn },
    { label: "Bình luận đang ẩn", value: hiddenComments },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
          Xin chào, {staff.displayName}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Tổng quan nội dung của Project Chíp Chíp.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <dt className="text-xs font-medium text-text-muted">{stat.label}</dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-[-0.02em] text-text">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {pendingEn > 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Có <strong>{pendingEn}</strong> bài chưa có bản tiếng Anh. Bài chỉ đăng
          được khi cả hai ngôn ngữ đã có tiêu đề và nội dung.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/bai-viet/moi"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Viết bài mới
          <ArrowRight className="size-4" strokeWidth={2.2} />
        </Link>
        <Link
          href="/admin/bai-viet"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium text-text-nav transition-colors hover:border-brand-300 hover:text-brand-600"
        >
          Xem tất cả bài viết
        </Link>
      </div>
    </div>
  );
}
