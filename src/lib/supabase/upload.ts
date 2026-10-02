"use client";

import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/media";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export class UploadError extends Error {}

/**
 * Uploads an image for use inside an article body.
 *
 * Runs in the browser with the staff member's session, so the storage RLS
 * policy (`is_staff()`) is what actually authorises the write — there is no
 * server route to protect here.
 */
export async function uploadPostImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new UploadError("Chỉ nhận ảnh JPG, PNG, WebP, AVIF hoặc GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("Ảnh tối đa 5MB.");
  }

  const supabase = createClient();
  // Whatever the file was called, the path has to be one the app recognises
  // (see isMediaPath): strip anything that is not a plain extension, and fall
  // back to the MIME type when the name carries nothing usable.
  const extension =
    (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) ||
    file.type.split("/").pop()?.replace(/[^a-z0-9]/g, "").slice(0, 5) ||
    "jpg";
  const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new UploadError(`Không tải được ảnh lên: ${error.message}`);
  }

  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
