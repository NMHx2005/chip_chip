import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { StaffManager, type StaffRow } from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const staff = await requireStaff();

  // The nav hides this for editors; reaching the URL directly gets an
  // explanation rather than a 404 (the page exists, they just may not use it).
  if (staff.role !== "admin") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Nhân sự</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Chỉ quản trị viên xem và sửa được mục này. Tài khoản của bạn là biên tập viên.
        </p>
      </div>
    );
  }

  // Emails live in auth.users, which no client role can read; the function is
  // the gate as well as the query.
  const { data, error } = await createClient().rpc("admin_list_staff");
  const rows = (data ?? []) as StaffRow[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Nhân sự</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {rows.length} tài khoản. Chỉ tài khoản đang hoạt động mới vào được trang quản trị.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700">
          Không đọc được danh sách nhân sự. Thử tải lại trang.
        </p>
      ) : (
        <StaffManager rows={rows} currentUserId={staff.id} />
      )}
    </div>
  );
}
