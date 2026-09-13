"use client";

import { useEffect } from "react";

/**
 * Error boundary for the admin area.
 *
 * Plain Vietnamese rather than next-intl: the admin is deliberately outside
 * the locale routing, and this must still render if the failure is in the
 * translation layer.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-6">
      <div>
        <h1 className="text-lg font-bold text-red-800">
          Đã có lỗi xảy ra
        </h1>
        <p className="mt-1.5 text-sm text-red-700">
          Thao tác không hoàn tất. Thử lại, và nếu vẫn lỗi thì kiểm tra kết nối
          tới Supabase.
        </p>
      </div>

      {error.digest && (
        <p className="font-mono text-xs text-red-600">
          Mã lỗi: {error.digest}
        </p>
      )}

      <button
        type="button"
        onClick={reset}
        className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        Thử lại
      </button>
    </div>
  );
}
