/**
 * Turns a Vietnamese or English title into a URL slug.
 *
 * Kept in its own module because both the admin Server Actions and the editor
 * (a client component) need it — importing it from a `"use server"` file would
 * pull server-only exports into the browser bundle.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
