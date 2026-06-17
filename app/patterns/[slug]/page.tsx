import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPatternBySlug, getProblemsByPattern } from "@/lib/content-service";
import { ProblemList } from "@/components/problem-list";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pattern = await getPatternBySlug(params.slug);
  return { title: pattern ? `${pattern.name} Problems` : "Pattern" };
}

export default async function PatternPage({ params }: Props) {
  const [pattern, problems] = await Promise.all([
    getPatternBySlug(params.slug),
    getProblemsByPattern(params.slug),
  ]);

  if (!pattern) notFound();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <Link
        href="/patterns"
        className="inline-flex items-center gap-1 text-sm text-kn-ink-2 hover:text-kn-ink-0 transition-colors mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All patterns
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-kn-ink-0">{pattern.name}</h1>
          {pattern.mustKnow && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-kn-amber-subtle text-kn-amber border border-kn-amber-border">
              Must-know ★
            </span>
          )}
        </div>
        {pattern.description && (
          <p className="mt-2 text-sm text-kn-ink-2 max-w-2xl">{pattern.description}</p>
        )}
        <p className="mt-1 text-sm text-kn-ink-2">
          {problems.length} problem{problems.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ProblemList problems={problems} />
    </main>
  );
}
