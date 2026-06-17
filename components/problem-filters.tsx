"use client";

import { useRouter, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Topic, Pattern, Difficulty } from "@/lib/types";

interface Props {
  topics: Topic[];
  patterns: Pattern[];
  current: { difficulty?: string; topic?: string; pattern?: string };
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy",   label: "Easy"   },
  { value: "medium", label: "Medium" },
  { value: "hard",   label: "Hard"   },
];

const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  easy:   "bg-kn-result-subtle  text-kn-result  border-kn-result-border",
  medium: "bg-kn-amber-subtle   text-kn-amber   border-kn-amber-border",
  hard:   "bg-kn-error-subtle   text-kn-error   border-kn-error-border",
};

export function ProblemFilters({ topics, patterns, current }: Props) {
  const router   = useRouter();
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

  const hasFilters = current.difficulty || current.topic || current.pattern;

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-6">
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(pathname)}
          className="justify-start gap-1.5 text-kn-ink-2 hover:text-kn-ink-0 px-2"
        >
          <X className="h-3 w-3" />
          Clear filters
        </Button>
      )}

      {/* Difficulty */}
      <div>
        <p className="text-xs font-semibold text-kn-ink-2 uppercase tracking-wide mb-2">
          Difficulty
        </p>
        <div className="flex flex-col gap-1">
          {DIFFICULTIES.map(({ value, label }) => {
            const active = current.difficulty === value;
            return (
              <Button
                key={value}
                variant={active ? "outline" : "ghost"}
                size="sm"
                onClick={() => router.push(buildUrl("difficulty", value))}
                className={cn(
                  "justify-start",
                  active
                    ? DIFFICULTY_ACTIVE[value]
                    : "text-kn-ink-1 hover:text-kn-ink-0 hover:bg-kn-surface-2"
                )}
              >
                {label}
              </Button>
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
              <Button
                key={t.slug}
                variant="ghost"
                size="sm"
                onClick={() => router.push(buildUrl("topic", t.slug))}
                className={cn(
                  "justify-start font-normal",
                  active
                    ? "bg-kn-current-subtle text-kn-current font-medium"
                    : "text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
                )}
              >
                {t.name}
              </Button>
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
              <Button
                key={p.slug}
                variant="ghost"
                size="sm"
                onClick={() => router.push(buildUrl("pattern", p.slug))}
                className={cn(
                  "justify-start font-normal",
                  active
                    ? "bg-kn-current-subtle text-kn-current font-medium"
                    : "text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
                )}
              >
                <span className="flex-1 text-left truncate">{p.name}</span>
                {p.mustKnow && <span className="text-kn-amber text-xs ml-1">★</span>}
              </Button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
