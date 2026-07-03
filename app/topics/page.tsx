import Link from "next/link";
import { getTopics, getProblemCountsByTopic } from "@/lib/content-service";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Topics" };

// ISR: content changes only at ingest — rebuild at most hourly instead of
// freezing at deploy time (or querying per request).
export const revalidate = 3600;

export default async function TopicsPage() {
  // Counts come from a single $unwind/$group aggregation — never fetch the
  // full problem list just to count it.
  const [topics, countByTopic] = await Promise.all([
    getTopics(),
    getProblemCountsByTopic(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-kn-ink-0">Topics</h1>
        <p className="mt-1 text-sm text-kn-ink-2">
          Browse problems by data structure or concept.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {topics.map((topic) => {
          const count = countByTopic[topic.slug] ?? 0;
          return (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="group flex flex-col gap-2 p-4 rounded-lg border border-kn-border-0 bg-kn-surface-0 hover:border-kn-border-1 hover:bg-kn-surface-1 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="font-medium text-sm text-kn-ink-0 group-hover:text-kn-current transition-colors">
                  {topic.name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-kn-ink-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              </div>
              {topic.description && (
                <p className="text-xs text-kn-ink-2 line-clamp-2 leading-relaxed">
                  {topic.description}
                </p>
              )}
              <p className="text-xs text-kn-ink-2 mt-auto">
                {count} problem{count !== 1 ? "s" : ""}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
