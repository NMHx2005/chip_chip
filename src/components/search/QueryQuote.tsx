/** The raw query, quoted back to the reader in the "nothing found" state. */
export function QueryQuote({ query }: { query: string }) {
  return (
    <span className="line-clamp-4 block max-w-[520px] rounded-xl border border-border bg-surface px-4 py-2.5 text-left text-sm font-semibold leading-[1.5] text-text [overflow-wrap:anywhere]">
      {query}
    </span>
  );
}
