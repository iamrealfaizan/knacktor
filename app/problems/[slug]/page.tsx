import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblemFull, getPresetTraces } from "@/lib/content-service";
import { ProblemEngine } from "@/components/problem/problem-engine";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const problem = await getProblemFull(params.slug);
  return { title: problem?.title ?? params.slug };
}

export default async function ProblemPage({ params }: Props) {
  const problem = await getProblemFull(params.slug);
  if (!problem) notFound();

  // Load precomputed traces for EVERY approach (so approach-switching and Compare
  // mode read real, DB-stored Python traces — never a client-side recompute).
  const approachTraces: Record<string, Awaited<ReturnType<typeof getPresetTraces>>> = {};
  await Promise.all(
    problem.approaches.map(async (a) => {
      approachTraces[a.id] = await getPresetTraces(params.slug, a.id);
    })
  );
  const recommended = approachTraces[problem.recommendedApproachId] ?? {};
  if (Object.keys(recommended).length === 0) notFound();

  return <ProblemEngine problem={problem} approachTraces={approachTraces} />;
}
