/**
 * Admin loading state.
 *
 * Sits inside the dashboard layout, so the header and nav stay put while a
 * page's data resolves.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Đang tải…</span>

      <div className="flex flex-col gap-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-4 w-72 animate-pulse rounded-full bg-surface-muted" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-surface-muted"
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-surface-muted"
          />
        ))}
      </div>
    </div>
  );
}
