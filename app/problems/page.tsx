import { getProblems, getTopics, getPatterns } from "@/lib/content-service";
import { ProblemList } from "@/components/problem-list";
import { ProblemFilters } from "@/components/problem-filters";
import type { Difficulty } from "@/lib/types";

export const metadata = { title: "Problems" };

interface Props {
  searchParams: { difficulty?: string; topic?: string; pattern?: string };
}

export default async function ProblemsPage({ searchParams }: Props) {
  const difficulty = searchParams.difficulty as Difficulty | undefined;
  const topicSlug  = searchParams.topic;
  const patternSlug = searchParams.pattern;

  const [problems, topics, patterns] = await Promise.all([
    getProblems({ difficulty, topicSlug, patternSlug }),
    getTopics(),
    getPatterns(),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-kn-ink-0">Problems</h1>
        <p className="mt-1 text-sm text-kn-ink-2">
          {problems.length} problem{problems.length !== 1 ? "s" : ""}
          {difficulty || topicSlug || patternSlug ? " match your filters" : ""}
        </p>
      </div>

      <div className="flex gap-8 items-start">
        <ProblemFilters
          topics={topics}
          patterns={patterns}
          current={{ difficulty, topic: topicSlug, pattern: patternSlug }}
        />
        <div className="flex-1 min-w-0">
          <ProblemList problems={problems} />
        </div>
      </div>
    </main>
  );
}
