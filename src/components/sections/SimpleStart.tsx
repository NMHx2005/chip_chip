import { SectionHeading } from "@/components/sections/SectionHeading";

export function SimpleStart() {
  return (
    <section className="px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto w-full max-w-content">
        <div className="relative rounded-3xl border border-border bg-surface px-6 py-12 md:px-14 md:py-16">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-brand-gradient md:inset-y-0 md:left-0 md:right-auto md:h-full md:w-1"
          />

          <SectionHeading
            namespace="home.simpleStart"
            titleKey="headline"
            descriptionKey="description"
          />
        </div>
      </div>
    </section>
  );
}
