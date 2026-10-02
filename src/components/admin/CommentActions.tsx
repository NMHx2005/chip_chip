"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { deleteComment, setCommentStatus } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { ConfirmDialog } from "@/components/admin/Dialog";
import type { CommentStatus } from "@/lib/comment-status";

/**
 * Moderation for one comment: approve it (which is what makes it public), hide
 * it (which takes it down again), or delete it for good.
 *
 * The primary button follows the comment's state, so the action a moderator
 * wants is always the one on the left: a pending or hidden comment offers
 * "Duyệt", an approved one offers "Ẩn".
 */
export function CommentActions({
  commentId,
  status,
}: {
  commentId: string;
  status: CommentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = readActionResult(await fn());
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      if (!result.ok) {
        setError(result.error ?? "Thao tác thất bại.");
        return;
      }
      router.refresh();
    });
  };

  const statusButton = (next: CommentStatus, label: string, icon: ReactNode) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => run(() => setCommentStatus(commentId, next))}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-nav transition-colors hover:border-black/20 hover:text-accent disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {status === "approved"
          ? statusButton("hidden", "Ẩn", <EyeOff className="size-3.5" strokeWidth={2.2} />)
          : statusButton("approved", "Duyệt", <Check className="size-3.5" strokeWidth={2.6} />)}

        <button
          type="button"
          title="Xoá vĩnh viễn"
          aria-label="Xoá vĩnh viễn"
          disabled={pending}
          onClick={() => setConfirming(true)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </button>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ConfirmDialog
        open={confirming}
        title="Xoá bình luận này?"
        description="Bình luận biến mất khỏi bài viết và không khôi phục được. Muốn tạm giấu thì dùng nút Ẩn."
        confirmLabel="Xoá thật"
        tone="danger"
        pending={pending}
        onConfirm={() => {
          setConfirming(false);
          run(() => deleteComment(commentId));
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
