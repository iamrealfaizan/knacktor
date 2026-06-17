import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProblemFull, getTrace } from "@/lib/content-service";
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

  const trace = await getTrace(
    params.slug,
    problem.recommendedApproachId,
    problem.presetInputs[0].id
  );
  if (!trace) notFound();

  return <ProblemEngine problem={problem} trace={trace} />;
}
