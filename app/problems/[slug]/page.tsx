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

  const presetTraces = await getPresetTraces(
    params.slug,
    problem.recommendedApproachId
  );
  if (Object.keys(presetTraces).length === 0) notFound();

  return <ProblemEngine problem={problem} presetTraces={presetTraces} />;
}
