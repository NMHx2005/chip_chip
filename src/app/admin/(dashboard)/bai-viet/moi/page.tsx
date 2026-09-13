import { NewPostForm } from "@/components/admin/NewPostForm";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireStaff();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">
          Viết bài mới
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Chọn loại bài và chủ đề, sau đó soạn nội dung.
        </p>
      </div>

      <NewPostForm />
    </div>
  );
}
