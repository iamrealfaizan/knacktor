"use client";

import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Topic, Pattern, Difficulty } from "@/lib/types";

interface Props {
  topics: Topic[];
  patterns: Pattern[];
  current: {
    difficulty?: string;
    topic?: string;
    pattern?: string;
  };
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy",   label: "Easy"   },
  { value: "medium", label: "Medium" },
  { value: "hard",   label: "Hard"   },
];

const DIFFICULTY_STYLES: Record<Difficulty, { active: string; hover: string }> = {
  easy:   { active: "bg-kn-result-subtle  text-kn-result  border-kn-result-border",  hover: "hover:bg-kn-result-subtle  hover:text-kn-result"  },
  medium: { active: "bg-kn-amber-subtle   text-kn-amber   border-kn-amber-border",   hover: "hover:bg-kn-amber-subtle   hover:text-kn-amber"   },
  hard:   { active: "bg-kn-error-subtle   text-kn-error   border-kn-error-border",   hover: "hover:bg-kn-error-subtle   hover:text-kn-error"   },
};

export function ProblemFilters({ topics, patterns, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function buildUrl(key: string, value: string) {
    const params = new URLSearchParams();
    if (current.difficulty) params.set("difficulty", current.difficulty);
    if (current.topic)      params.set("topic",      current.topic);
    if (current.pattern)    params.set("pattern",    current.pattern);

    if (params.get(key) === value) params.delete(key);
    else params.set(key, value);

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function navigate(key: string, value: string) {
    router.push(buildUrl(key, value));
  }

  const hasFilters = current.difficulty || current.topic || current.pattern;

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-6">
      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 text-xs text-kn-ink-2 hover:text-kn-ink-0 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}

      {/* Difficulty */}
      <div>
        <p className="text-xs font-semibold text-kn-ink-2 uppercase tracking-wide mb-2">
          Difficulty
        </p>
        <div className="flex flex-col gap-1">
          {DIFFICULTIES.map(({ value, label }) => {
            const active = current.difficulty === value;
            const styles = DIFFICULTY_STYLES[value];
            return (
              <button
                key={value}
                onClick={() => navigate("difficulty", value)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm border transition-colors",
                  active
                    ? styles.active
                    : `border-transparent text-kn-ink-1 ${styles.hover}`
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics */}
      <div>
        <p className="text-xs font-semibold text-kn-ink-2 uppercase tracking-wide mb-2">
          Topic
        </p>
        <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
          {topics.map((t) => {
            const active = current.topic === t.slug;
            return (
              <button
                key={t.slug}
                onClick={() => navigate("topic", t.slug)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-kn-current-subtle text-kn-current font-medium"
                    : "text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
                )}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patterns */}
      <div>
        <p className="text-xs font-semibold text-kn-ink-2 uppercase tracking-wide mb-2">
          Pattern
        </p>
        <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
          {patterns.map((p) => {
            const active = current.pattern === p.slug;
            return (
              <button
                key={p.slug}
                onClick={() => navigate("pattern", p.slug)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between",
                  active
                    ? "bg-kn-current-subtle text-kn-current font-medium"
                    : "text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
                )}
              >
                <span>{p.name}</span>
                {p.mustKnow && (
                  <span className="text-kn-amber text-xs">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
