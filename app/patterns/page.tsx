import Link from "next/link";
import { getPatterns, getProblems } from "@/lib/content-service";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Patterns" };

export default async function PatternsPage() {
  const [patterns, problems] = await Promise.all([getPatterns(), getProblems()]);

  const countByPattern = problems.reduce<Record<string, number>>((acc, p) => {
    p.patterns.forEach((pat) => { acc[pat] = (acc[pat] ?? 0) + 1; });
    return acc;
  }, {});

  const mustKnow  = patterns.filter((p) => p.mustKnow);
  const supporting = patterns.filter((p) => !p.mustKnow);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-kn-ink-0">Patterns</h1>
        <p className="mt-1 text-sm text-kn-ink-2">
          Algorithm patterns — from two pointers to dynamic programming.
        </p>
      </div>

      {/* Must-know */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-kn-ink-0">Must-know</h2>
          <span className="text-kn-amber text-sm">★</span>
          <span className="text-xs text-kn-ink-2">{mustKnow.length} patterns</span>
        </div>
        <PatternGrid patterns={mustKnow} countByPattern={countByPattern} />
      </section>

      {/* Supporting */}
      <section>
        <h2 className="text-sm font-semibold text-kn-ink-0 mb-4">Supporting patterns</h2>
        <PatternGrid patterns={supporting} countByPattern={countByPattern} />
      </section>
    </main>
  );
}

function PatternGrid({
  patterns,
  countByPattern,
}: {
  patterns: Awaited<ReturnType<typeof getPatterns>>;
  countByPattern: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {patterns.map((pattern) => {
        const count = countByPattern[pattern.slug] ?? 0;
        return (
          <Link
            key={pattern.slug}
            href={`/patterns/${pattern.slug}`}
            className="group flex flex-col gap-2 p-4 rounded-lg border border-kn-border-0 bg-kn-surface-0 hover:border-kn-border-1 hover:bg-kn-surface-1 transition-colors"
          >
            <div className="flex items-start justify-between">
              <span className="font-medium text-sm text-kn-ink-0 group-hover:text-kn-current transition-colors">
                {pattern.name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {pattern.mustKnow && (
                  <span className="text-kn-amber text-xs">★</span>
                )}
                <ArrowRight className="h-3.5 w-3.5 text-kn-ink-2 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              </div>
            </div>
            {pattern.description && (
              <p className="text-xs text-kn-ink-2 line-clamp-2 leading-relaxed">
                {pattern.description}
              </p>
            )}
            <p className="text-xs text-kn-ink-2 mt-auto">
              {count} problem{count !== 1 ? "s" : ""}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
