import { SectionHeading } from "@/components/sections/SectionHeading";

/**
 * Opening statement of the lower half of the page.
 *
 * This block used to be a large white box holding two lines of copy, with
 * enough empty padding around them that it read as a container still waiting
 * for content. Three changes give it structure instead: the card is tighter,
 * the copy is set as a two-column statement (title left, description right)
 * rather than stacked in the middle of the width, and a marker-and-rule strip
 * runs along the top of the text.
 *
 * The wording is the owner's own and is deliberately left alone.
 */
export function SimpleStart() {
  return (
    <section className="px-5 py-14 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-content">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-10 md:px-12 md:py-12">
          {/* Brand rail. Clipped by the card's own radius, which is why the
              card carries `overflow-hidden`. */}
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1 bg-brand-gradient"
          />

          {/* Marker + hairline: a neutral strip the two lines of copy can sit
              against, so the block has a visual entry point. */}
          <div aria-hidden className="mb-7 flex items-center gap-3 md:mb-8">
            <span className="size-1.5 shrink-0 bg-primary" />
            <span className="h-px flex-1 bg-border" />
          </div>

          <SectionHeading
            namespace="home.simpleStart"
            titleKey="headline"
            descriptionKey="description"
            variant="statement"
          />
        </div>
      </div>
    </section>
  );
}
