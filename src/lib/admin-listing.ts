import { firstParam } from "@/lib/listing-params";

/** Rows shown per page in the admin lists. */
export const ADMIN_PAGE_SIZE = 20;

/**
 * The search box value from the URL: trimmed, and capped so a pasted essay
 * cannot travel into a query. An empty result means "no filter".
 */
export function parseAdminSearch(value: string | string[] | undefined): string {
  return (firstParam(value) ?? "").trim().slice(0, 80);
}

/** Pages a list has, never fewer than one so the bar never says "0 trang". */
export function adminPageCount(total: number, size = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size));
}

/** Rows to skip for a 1-based page. */
export function adminOffset(page: number, size = ADMIN_PAGE_SIZE): number {
  return (page - 1) * size;
}

/**
 * An admin list URL, with the defaults left out so each view has exactly one
 * address. `page` is dropped at 1, and a `null` `filter` removes it.
 */
export function adminListHref(
  path: string,
  params: { q?: string; page?: number; filter?: string } = {}
): string {
  const query = new URLSearchParams();
  if (params.filter) query.set("filter", params.filter);
  if (params.q) query.set("q", params.q);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
