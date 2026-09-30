/**
 * Value for a control's `aria-describedby`: the hint first, then the error, and
 * only the ids that exist. Returns `undefined` so the attribute is omitted
 * instead of rendered empty.
 */
export function describedBy(ids: { hint?: string; error?: string }): string | undefined {
  const parts = [ids.hint, ids.error].filter((id): id is string => Boolean(id));
  return parts.length > 0 ? parts.join(" ") : undefined;
}
