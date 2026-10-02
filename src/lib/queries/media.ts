import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireSupabase } from "@/lib/supabase/config";
import {
  MEDIA_BUCKET,
  mediaPublicUrl,
  sortMediaNewestFirst,
  type MediaObject,
} from "@/lib/media";

/** How many month folders to walk, and how many objects to read from each. */
const MAX_FOLDERS = 12;
const MAX_PER_FOLDER = 60;

/** The folder naming the uploader writes (see isMediaPath). */
const MONTH = /^\d{4}-\d{2}$/;

/**
 * The newest images in the bucket.
 *
 * Objects are stored as `YYYY-MM/<uuid>.<ext>`, and Storage cannot list
 * recursively, so the root is listed for its month folders and each is then
 * read in parallel. Walking the newest handful of folders is enough for a
 * library the admin browses by eye; the alternative is a database table
 * shadowing the bucket, which would be one more thing to keep in step.
 */
export async function listMedia(limit = MAX_PER_FOLDER): Promise<MediaObject[]> {
  if (!requireSupabase("listMedia")) return [];

  const storage = createClient().storage.from(MEDIA_BUCKET);

  const { data: root, error } = await storage.list("", {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });

  if (error) {
    console.error("[media:list]", error.message);
    return [];
  }

  // Folders have no id; their names are `YYYY-MM`, so descending is newest
  // first. Only month folders are read: anything else could not be deleted
  // through the library anyway (see isMediaPath).
  const folders = (root ?? [])
    .filter((entry) => entry.id === null && MONTH.test(entry.name))
    .map((entry) => entry.name)
    .slice(0, MAX_FOLDERS);

  const listings = await Promise.all(
    folders.map((folder) =>
      // Newest first inside a folder too — storage-js sorts by name otherwise,
      // which would hand back an arbitrary slice of a busy month.
      storage.list(folder, { limit: MAX_PER_FOLDER, sortBy: { column: "created_at", order: "desc" } })
    )
  );

  const objects: MediaObject[] = [];
  listings.forEach((listing, index) => {
    if (listing.error) {
      console.error("[media:list]", folders[index], listing.error.message);
      return;
    }

    for (const entry of listing.data ?? []) {
      // A nested folder would have no metadata; ignore rather than crash.
      if (entry.id === null || !entry.name) continue;
      const path = `${folders[index]}/${entry.name}`;
      objects.push({
        path,
        name: entry.name,
        folder: folders[index],
        url: mediaPublicUrl(path),
        size: entry.metadata?.size ?? 0,
        createdAt: entry.created_at ?? null,
      });
    }
  });

  return sortMediaNewestFirst(objects).slice(0, limit);
}
