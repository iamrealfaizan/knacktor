import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblemFull, getPresetTraces, getProblems } from "@/lib/content-service";
import { ProblemEngine } from "@/components/problem/problem-engine";

interface Props {
  params: { slug: string };
}

// Static-first: every problem page is prerendered and revalidated hourly.
// Content changes only at ingest (which can later call revalidatePath).
export const revalidate = 3600;

export async function generateStaticParams() {
  const problems = await getProblems();
  return problems.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const problem = await getProblemFull(params.slug);
  return { title: problem?.title ?? params.slug };
}

export default async function ProblemPage({ params }: Props) {
  const problem = await getProblemFull(params.slug);
  if (!problem) notFound();

  // Ship ONLY the recommended approach's traces in the initial payload.
  // Other approaches are fetched on demand by the engine from
  // /api/problems/[slug]/traces?approachId=… (they're rarely opened, and
  // eagerly inlining every approach × preset made the page multi-hundred-KB).
  const recommended = await getPresetTraces(params.slug, problem.recommendedApproachId);
  if (Object.keys(recommended).length === 0) notFound();

  return (
    <ProblemEngine
      problem={problem}
      approachTraces={{ [problem.recommendedApproachId]: recommended }}
    />
  );
}
