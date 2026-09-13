import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { PostRowActions } from "@/components/admin/PostRowActions";

// Admin data must never be cached or prerendered.
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  translation_id: string;
  locale: "vi" | "en";
  kind: "lesson" | "forum";
  topic: string | null;
  title: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
};

const KIND_LABEL = { lesson: "Bài học", forum: "Diễn đàn" } as const;

function isReady(rows: Row[]) {
  const locales = new Set(rows.map((r) => r.locale));
  return (
    locales.has("vi") &&
    locales.has("en") &&
    rows.every((r) => r.title.trim().length > 0)
  );
}

export default async function AdminPostsPage() {
  await requireStaff();
  const supabase = createClient();

  const { data } = await supabase
    .from("posts")
    .select(
      "id, translation_id, locale, kind, topic, title, slug, status, updated_at"
    )
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  // One entry per translation group, with the VI row (or EN as fallback) shown.
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const list = groups.get(row.translation_id) ?? [];
    list.push(row);
    groups.set(row.translation_id, list);
  }

  const items = Array.from(groups.entries()).map(([translationId, group]) => {
    const vi = group.find((r) => r.locale === "vi");
    const en = group.find((r) => r.locale === "en");
    const primary = vi ?? en!;
    return { translationId, group, primary, vi, en };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
            Bài viết
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {items.length} bài. Mỗi bài cần đủ bản Việt và Anh mới đăng được.
          </p>
        </div>

        <Link
          href="/admin/bai-viet/moi"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="size-4" strokeWidth={2.4} />
          Viết bài mới
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-text-muted">
          Chưa có bài viết nào. Bắt đầu bằng nút “Viết bài mới”.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ translationId, group, primary, vi, en }) => {
            const ready = isReady(group);
            const published = primary.status === "published";

            return (
              <li
                key={translationId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-nav">
                      {KIND_LABEL[primary.kind]}
                    </span>
                    {primary.topic && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">
                        {primary.topic}
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
                      <span
                        className={
                          vi?.title
                            ? "text-green-700"
                            : "text-text-muted"
                        }
                      >
                        VI {vi?.title ? "✓" : "—"}
                      </span>
                      <span
                        className={
                          en?.title ? "text-green-700" : "text-amber-700"
                        }
                      >
                        EN {en?.title ? "✓" : "thiếu"}
                      </span>
                    </span>
                  </div>

                  <Link
                    href={`/admin/bai-viet/${primary.id}`}
                    className="mt-2.5 block truncate text-base font-semibold text-text transition-colors hover:text-brand-600"
                  >
                    {primary.title || "(chưa có tiêu đề)"}
                  </Link>
                </div>

                <PostRowActions
                  translationId={translationId}
                  status={primary.status}
                  ready={ready}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
