import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getTopicBySlug, getProblemsByTopic } from "@/lib/content-service";
import { buildProblemRows } from "@/lib/concept-rows";
import { PageHeader } from "@/components/concept/page-header";
import { ProblemTable } from "@/components/home/problem-table";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopicBySlug(params.slug);
  return { title: topic ? `${topic.name} Problems` : "Topic" };
}

export default async function TopicPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const [topic, problems] = await Promise.all([
    getTopicBySlug(params.slug),
    getProblemsByTopic(params.slug),
  ]);

  if (!topic) notFound();

  const rows = await buildProblemRows(problems, userId);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <PageHeader
        backHref="/topics"
        backLabel="All topics"
        name={topic.name}
        description={topic.description}
        count={problems.length}
      />
      <ProblemTable rows={rows} emptyLabel="No problems in this topic yet." />
    </main>
  );
}
