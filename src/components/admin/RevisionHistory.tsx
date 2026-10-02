"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw } from "lucide-react";
import { restoreRevision } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { ConfirmDialog } from "@/components/admin/Dialog";

export type RevisionView = {
  id: string;
  locale: string;
  title: string;
  excerpt: string | null;
  status: "draft" | "published";
  savedByName: string | null;
  createdAt: string;
};

/** What a restore hands back for the editor to adopt. */
export type RestoredDraft = {
  locale: "vi" | "en";
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  content: unknown;
};

/**
 * The article's recent snapshots, newest first, with a way back.
 *
 * Only what identifies a version is shown — its title, excerpt, state, who
 * saved it and when. The article body is deliberately not loaded here: twenty
 * full documents on every editor open would cost more than the feature is
 * worth, and the title/excerpt pair is what tells versions apart in practice.
 *
 * A restore rewrites a row in the database, so the result has to be adopted by
 * whoever holds the text being edited — that is `onRestored`, and `dirty` is
 * what makes the confirmation honest about unsaved text.
 */
export function RevisionHistory({
  revisions,
  dirty,
  onRestored,
}: {
  revisions: RevisionView[];
  /** The editor holds unsaved changes a restore would replace. */
  dirty: boolean;
  onRestored: (restored: RestoredDraft) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<RevisionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  // `<details>` has no `defaultOpen` in React, and a bare `open` prop would
  // fight the browser; mirroring the DOM's own state keeps the panel open by
  // default while still letting the reader collapse it.
  const [open, setOpen] = useState(revisions.length > 0);

  const restore = (revision: RevisionView) => {
    setError(null);
    startTransition(async () => {
      const result = readActionResult(await restoreRevision(revision.id));
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok || !result.restored) {
        setError(result.error ?? "Không khôi phục được.");
        return;
      }
      onRestored(result.restored as RestoredDraft);
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-surface">
      <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
          <History className="size-4 shrink-0" strokeWidth={2.2} aria-hidden />
          Lịch sử phiên bản
          <span className="font-normal text-text-muted">
            ({revisions.length} bản gần nhất)
          </span>
        </summary>

        <div className="border-t border-border px-5 py-4">
          {revisions.length === 0 ? (
            <p className="text-sm text-text-muted">
              Chưa có bản lưu nào. Mỗi lần lưu hoặc đăng bài, bản cũ được giữ lại ở đây.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {revisions.map((revision) => (
                <li
                  key={revision.id}
                  className="flex flex-col gap-3 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                      <span className="uppercase">{revision.locale}</span>
                      <time dateTime={revision.createdAt}>
                        {new Date(revision.createdAt).toLocaleString("vi-VN")}
                      </time>
                      <span>· {revision.savedByName ?? "(không rõ)"}</span>
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-nav">
                        {revision.status === "published" ? "Đã đăng" : "Nháp"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-text">
                      {revision.title || "(chưa có tiêu đề)"}
                    </p>
                    {revision.excerpt && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                        {revision.excerpt}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setTarget(revision)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-nav transition-colors hover:border-black/20 hover:text-accent disabled:opacity-50"
                  >
                    <RotateCcw className="size-3.5" strokeWidth={2.2} aria-hidden />
                    Khôi phục
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

          <p className="mt-3 text-xs text-text-muted">
            Khôi phục trả lại tiêu đề, mô tả, ảnh bìa và nội dung. Đường dẫn và trạng thái đăng giữ nguyên.
          </p>
        </div>
      </details>

      <ConfirmDialog
        open={target !== null}
        title="Khôi phục bản này?"
        description={
          target
            ? [
                // The snapshot holds what was last saved, not what is on screen.
                "Bản đang lưu trong cơ sở dữ liệu sẽ được giữ lại thành một bản mới, rồi thay bằng bản " +
                  `${new Date(target.createdAt).toLocaleString("vi-VN")}.`,
                dirty
                  ? "Bài này đang có thay đổi chưa lưu ở trình soạn — khôi phục sẽ bỏ các thay đổi đó."
                  : null,
              ]
                .filter(Boolean)
                .join(" ")
            : undefined
        }
        confirmLabel="Khôi phục"
        pending={pending}
        onConfirm={() => {
          const revision = target;
          setTarget(null);
          if (revision) restore(revision);
        }}
        onCancel={() => setTarget(null)}
      />
    </section>
  );
}
