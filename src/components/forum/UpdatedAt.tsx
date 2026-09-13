import { getFormatter, getTranslations } from "next-intl/server";
import { RefreshCw } from "lucide-react";

const SIGNIFICANT_EDIT_MS = 24 * 60 * 60 * 1000;

/**
 * "Updated …" line for an article.
 *
 * `posts.updated_at` is bumped by a trigger on every write, so it always
 * differs from `published_at` by a few milliseconds at publish time. Only a
 * gap of more than a day is a real edit worth telling the reader about.
 */
export async function UpdatedAt({
  publishedAt,
  updatedAt,
  className,
}: {
  publishedAt: string | null;
  updatedAt: string;
  className?: string;
}) {
  const t = await getTranslations("forum");
  const format = await getFormatter();

  if (!publishedAt || !updatedAt) return null;

  const published = new Date(publishedAt).getTime();
  const updated = new Date(updatedAt).getTime();

  if (!Number.isFinite(published) || !Number.isFinite(updated)) return null;
  if (updated - published < SIGNIFICANT_EDIT_MS) return null;

  return (
    <span className={className}>
      <RefreshCw
        className="mr-1.5 inline size-3.5 align-[-2px]"
        strokeWidth={2}
        aria-hidden
      />
      {t("updatedOn", {
        date: format.dateTime(new Date(updatedAt), { dateStyle: "long" }),
      })}
    </span>
  );
}
