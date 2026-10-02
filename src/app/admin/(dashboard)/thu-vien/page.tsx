import { requireStaff } from "@/lib/auth";
import { listMedia } from "@/lib/queries/media";
import { MediaLibrary } from "@/components/admin/MediaGrid";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireStaff();
  const objects = await listMedia(60);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text">Thư viện ảnh</h1>
        <p className="mt-1.5 text-sm text-text-muted">
          {objects.length} ảnh gần đây trong bucket <code className="font-mono">post-images</code>. Ảnh tải
          lên ở đây dùng lại được cho ảnh bìa và trong bài viết.
        </p>
      </div>

      <MediaLibrary objects={objects} />
    </div>
  );
}
