import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getPatternBySlug, getProblemsByPattern } from "@/lib/content-service";
import { buildProblemRows } from "@/lib/concept-rows";
import { PageHeader } from "@/components/concept/page-header";
import { ProblemTable } from "@/components/home/problem-table";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pattern = await getPatternBySlug(params.slug);
  return { title: pattern ? `${pattern.name} Problems` : "Pattern" };
}

export default async function PatternPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const [pattern, problems] = await Promise.all([
    getPatternBySlug(params.slug),
    getProblemsByPattern(params.slug),
  ]);

  if (!pattern) notFound();

  const rows = await buildProblemRows(problems, userId);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <PageHeader
        backHref="/patterns"
        backLabel="All patterns"
        name={pattern.name}
        description={pattern.description}
        count={problems.length}
        badge={
          pattern.mustKnow ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-kn-amber-subtle text-kn-amber border border-kn-amber-border">
              Must-know ★
            </span>
          ) : undefined
        }
      />
      <ProblemTable rows={rows} emptyLabel="No problems for this pattern yet." />
    </main>
  );
}
