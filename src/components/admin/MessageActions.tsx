"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { deleteMessage, setMessageHandled } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";
import { ConfirmDialog } from "@/components/admin/Dialog";

export function MessageActions({
  messageId,
  handled,
}: {
  messageId: string;
  handled: boolean;
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
          title={handled ? "Đánh dấu chưa xử lý" : "Đánh dấu đã xử lý"}
          aria-label={handled ? "Đánh dấu chưa xử lý" : "Đánh dấu đã xử lý"}
          onClick={() => run(() => setMessageHandled(messageId, !handled))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-accent disabled:opacity-50"
        >
          {handled ? (
            <RotateCcw className="size-4" strokeWidth={2} />
          ) : (
            <Check className="size-4" strokeWidth={2} />
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
        title="Xoá tin nhắn này?"
        description="Tin nhắn biến mất khỏi hộp thư và không khôi phục được."
        confirmLabel="Xoá thật"
        tone="danger"
        pending={pending}
        onConfirm={() => {
          setConfirming(false);
          run(() => deleteMessage(messageId));
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
