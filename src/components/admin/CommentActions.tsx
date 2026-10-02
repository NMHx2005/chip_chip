"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteComment, setCommentHidden } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { ConfirmDialog } from "@/components/admin/Dialog";

export function CommentActions({
  commentId,
  hidden,
}: {
  commentId: string;
  hidden: boolean;
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

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={pending}
          title={hidden ? "Hiện bình luận" : "Ẩn bình luận"}
          aria-label={hidden ? "Hiện bình luận" : "Ẩn bình luận"}
          onClick={() => run(() => setCommentHidden(commentId, !hidden))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-accent disabled:opacity-50"
        >
          {hidden ? (
            <Eye className="size-4" strokeWidth={2} />
          ) : (
            <EyeOff className="size-4" strokeWidth={2} />
          )}
        </button>

        <button
          type="button"
          title="Xoá vĩnh viễn"
          aria-label="Xoá vĩnh viễn"
          onClick={() => setConfirming(true)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </button>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <ConfirmDialog
        open={confirming}
        title="Xoá bình luận này?"
        description="Bình luận biến mất khỏi bài viết và không khôi phục được. Muốn tạm giấu thì dùng nút ẩn."
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
