import { getPatterns, getProblemCountsByPattern } from "@/lib/content-service";
import { SectionHeader } from "@/components/concept/section-header";
import { ConceptGrid } from "@/components/concept/concept-grid";
import { ConceptCard } from "@/components/concept/concept-card";
import { conceptVisual } from "@/lib/concept-visuals";
import type { Pattern } from "@/lib/types";

export const metadata = { title: "Patterns" };

const MustKnowStar = () => (
  <span className="text-kn-amber text-sm" title="Must-know" aria-label="Must-know">
    ★
  </span>
);

function PatternSection({
  heading,
  patterns,
  countByPattern,
  mustKnow,
}: {
  heading: string;
  patterns: Pattern[];
  countByPattern: Record<string, number>;
  mustKnow?: boolean;
}) {
  if (patterns.length === 0) return null;
  const total = patterns.reduce((n, p) => n + (countByPattern[p.slug] ?? 0), 0);

  return (
    <section className="mb-11 last:mb-0">
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-kn-ink-0">
          {heading}
          {mustKnow && <MustKnowStar />}
        </h2>
        <span className="font-mono text-[11px] tracking-[0.14em] text-kn-ink-2">
          {patterns.length} patterns · {total} problems
        </span>
      </div>

      <ConceptGrid cols={3}>
        {patterns.map((p) => {
          const { icon, tone } = conceptVisual(p.slug);
          return (
            <ConceptCard
              key={p.slug}
              href={`/patterns/${p.slug}`}
              icon={icon}
              tone={tone}
              name={p.name}
              description={p.description}
              count={countByPattern[p.slug] ?? 0}
              badge={p.mustKnow ? <MustKnowStar /> : undefined}
            />
          );
        })}
      </ConceptGrid>
    </section>
  );
}

export default async function PatternsPage() {
  const [patterns, countByPattern] = await Promise.all([
    getPatterns(),
    getProblemCountsByPattern(),
  ]);

  const mustKnow = patterns.filter((p) => p.mustKnow);
  const supporting = patterns.filter((p) => !p.mustKnow);

  return (
    <main className="max-w-[1240px] mx-auto px-5 sm:px-7 py-10">
      <SectionHeader
        eyebrow="BY TECHNIQUE"
        title="Patterns"
        subcopy="Algorithm patterns — from two pointers to dynamic programming. Learn the must-know ones first."
      />

      <PatternSection
        heading="Must-know"
        patterns={mustKnow}
        countByPattern={countByPattern}
        mustKnow
      />
      <PatternSection
        heading="Supporting patterns"
        patterns={supporting}
        countByPattern={countByPattern}
      />
    </main>
  );
}
