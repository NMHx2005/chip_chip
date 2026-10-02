import Link from "next/link";

/**
 * Admin 404.
 *
 * The admin lives outside `[locale]`, so the public not-found page (which is
 * localized through next-intl) cannot serve it — without this file a bad
 * article id fell through to Next's default English page.
 */
export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-[1.5px] border-dashed border-border bg-surface/70 px-8 py-16 text-center">
      <span
        aria-hidden
        className="grid size-14 place-items-center rounded-2xl bg-surface-muted text-lg font-bold text-text-muted"
      >
        404
      </span>
      <h1 className="text-xl font-bold tracking-[-0.02em] text-text">
        Không tìm thấy mục này
      </h1>
      <p className="max-w-[420px] text-sm leading-relaxed text-text-muted">
        Đường dẫn sai, hoặc mục này đã bị xoá. Kiểm tra lại danh sách bài viết xem còn ở đó không.
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/admin/bai-viet"
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-black/80"
        >
          Danh sách bài viết
        </Link>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-text-nav transition-colors hover:border-black/20"
        >
          Tổng quan
        </Link>
      </div>
    </div>
  );
}
