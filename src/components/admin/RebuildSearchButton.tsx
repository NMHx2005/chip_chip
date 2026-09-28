"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rebuildSearchText } from "@/app/admin/actions";
import { readActionResult, sessionExpired } from "@/components/admin/actionResult";

/** One-off after the search migration; harmless to press again later. */
export function RebuildSearchButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () => {
    setMessage(null);
    startTransition(async () => {
      const result = readActionResult(await rebuildSearchText());
      if (!result) return;
      if (sessionExpired(result)) {
        router.replace("/admin/dang-nhap");
        return;
      }
      setMessage(
        result.ok
          ? `Đã cập nhật chỉ mục tìm kiếm cho ${result.updated ?? 0} bản.`
          : result.error ?? "Không cập nhật được."
      );
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-5 text-sm font-medium text-text-nav transition-colors hover:border-black/20 hover:text-accent disabled:opacity-60"
      >
        {pending ? "Đang cập nhật…" : "Cập nhật chỉ mục tìm kiếm"}
      </button>
      {message && (
        <p role="status" className="text-sm text-text-muted">
          {message}
        </p>
      )}
    </div>
  );
}
