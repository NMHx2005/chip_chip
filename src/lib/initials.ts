/**
 * Up to two capital letters for an avatar placeholder: the first letter of the
 * first and of the last word. Brackets and digits are skipped, so the
 * placeholder name "[Tên tác giả]" still gives "TG".
 */
export function initials(name: string): string {
  const [first, ...rest] = name.normalize("NFC").match(/\p{L}[\p{L}\p{M}]*/gu) ?? [];
  if (!first) return "?";
  const last = rest.at(-1);
  const letter = (word: string) => Array.from(word)[0] ?? "";
  return `${letter(first)}${last ? letter(last) : ""}`.toLocaleUpperCase("vi");
}
