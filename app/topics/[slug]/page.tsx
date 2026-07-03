import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTopicBySlug, getProblemsByTopic, getTopics } from "@/lib/content-service";
import { ProblemList } from "@/components/problem-list";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: { slug: string };
}

// Static-first + hourly ISR; content changes only at ingest.
export const revalidate = 3600;

export async function generateStaticParams() {
  const topics = await getTopics();
  return topics.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopicBySlug(params.slug);
  return { title: topic ? `${topic.name} Problems` : "Topic" };
}

export default async function TopicPage({ params }: Props) {
  const [topic, problems] = await Promise.all([
    getTopicBySlug(params.slug),
    getProblemsByTopic(params.slug),
  ]);

  if (!topic) notFound();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-kn-ink-2 hover:text-kn-ink-0 transition-colors mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All topics
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-kn-ink-0">{topic.name}</h1>
        {topic.description && (
          <p className="mt-1 text-sm text-kn-ink-2">{topic.description}</p>
        )}
        <p className="mt-1 text-sm text-kn-ink-2">
          {problems.length} problem{problems.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ProblemList problems={problems} />
    </main>
  );
}
