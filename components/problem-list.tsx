import Link from "next/link";
import { Eye } from "lucide-react";
import type { Problem } from "@/lib/types";
import { DifficultyBadge } from "./difficulty-badge";

export function ProblemList({ problems }: { problems: Problem[] }) {
  if (problems.length === 0) {
    return (
      <div className="py-20 text-center text-kn-ink-2 text-sm">
        No problems match these filters.
      </div>
    );
  }

  return (
    <div className="border border-kn-border-0 rounded-lg overflow-hidden bg-kn-surface-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-kn-border-0 bg-kn-surface-1">
        <span className="w-10 shrink-0 text-xs font-medium text-kn-ink-2 uppercase tracking-wide">#</span>
        <span className="flex-1 text-xs font-medium text-kn-ink-2 uppercase tracking-wide">Title</span>
        <span className="w-20 shrink-0 text-xs font-medium text-kn-ink-2 uppercase tracking-wide">Difficulty</span>
        <span className="w-48 shrink-0 text-xs font-medium text-kn-ink-2 uppercase tracking-wide hidden md:block">Topics</span>
        <span className="w-6 shrink-0" />
      </div>

      {/* Rows */}
      {problems.map((problem, i) => (
        <Link
          key={problem.slug}
          href={`/problems/${problem.slug}`}
          className={`flex items-center gap-4 px-4 py-3 hover:bg-kn-surface-1 transition-colors group ${
            i > 0 ? "border-t border-kn-border-0" : ""
          }`}
        >
          <span className="w-10 shrink-0 text-sm font-mono text-kn-ink-2">
            {problem.number}
          </span>
          <span className="flex-1 min-w-0 text-sm font-medium text-kn-ink-0 group-hover:text-kn-current transition-colors truncate">
            {problem.title}
          </span>
          <div className="w-20 shrink-0">
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <div className="w-48 shrink-0 hidden md:flex flex-wrap gap-1">
            {problem.topics.slice(0, 3).map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 text-xs rounded bg-kn-surface-2 text-kn-ink-1 border border-kn-border-0 capitalize"
              >
                {t.replace(/-/g, " ")}
              </span>
            ))}
            {problem.topics.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-kn-ink-2">
                +{problem.topics.length - 3}
              </span>
            )}
          </div>
          <div className="w-6 shrink-0 flex justify-center">
            {problem.hasVisualization && (
              <Eye className="h-3.5 w-3.5 text-kn-current opacity-50 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
