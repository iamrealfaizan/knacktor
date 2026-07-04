"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProblemSort, SortOrder } from "@/lib/types";
import { SORT_OPTIONS } from "./home-data";

/**
 * Controlled home-list toolbar. Search is debounced (300ms) and reported up via
 * onSearchChange; sort clicks report via onSortChange (toggling asc/desc on the
 * active option). No routing here — the parent island owns state + fetching.
 */
export function ProblemToolbar({
  total,
  q,
  sort,
  order,
  onSearchChange,
  onSortChange,
}: {
  total: number;
  q: string;
  sort: ProblemSort;
  order: SortOrder;
  onSearchChange: (q: string) => void;
  onSortChange: (sort: ProblemSort) => void;
}) {
  const [input, setInput] = useState(q);
  const lastEmitted = useRef(q);

  // Debounce typed input → onSearchChange. Only fires when the value actually changed.
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== lastEmitted.current) {
        lastEmitted.current = input;
        onSearchChange(input);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [input, onSearchChange]);

  // Reflect external resets (e.g. "clear all") back into the input.
  useEffect(() => {
    if (q !== lastEmitted.current) {
      lastEmitted.current = q;
      setInput(q);
    }
  }, [q]);

  const descending = order === "desc";

  return (
    <div className="flex items-center gap-3.5 mb-3.5">
      <div className="text-sm text-kn-ink-1 whitespace-nowrap">
        <b className="text-kn-ink-0 font-bold">{total}</b> problems
      </div>
      <div className="flex-1 flex items-center gap-2 h-[38px] px-3 border border-kn-border-0 rounded-lg bg-kn-surface-0 focus-within:border-kn-current">
        <Search className="h-4 w-4 text-kn-ink-2 shrink-0" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Search problems"
          placeholder="Search by number or name…"
          className="h-auto flex-1 border-0 bg-transparent p-0 text-sm text-kn-ink-0 placeholder:text-kn-ink-2 focus-visible:ring-0"
        />
      </div>
      <div className="hidden sm:flex items-center gap-2.5">
        <span className="text-xs text-kn-ink-2">Sort</span>
        <div className="flex gap-0.5 bg-kn-inset border border-kn-border-0 rounded-lg p-[3px]">
          {SORT_OPTIONS.map(({ label, value }) => {
            const active = sort === value;
            return (
              <Button
                key={value}
                type="button"
                variant="ghost"
                onClick={() => onSortChange(value)}
                className={cn(
                  "h-auto py-1.5 px-3 rounded-md text-xs font-semibold gap-1",
                  active
                    ? "bg-kn-surface-0 text-kn-ink-0 shadow-sm hover:bg-kn-surface-0"
                    : "text-kn-ink-2 hover:bg-kn-surface-2 hover:text-kn-ink-0"
                )}
              >
                {label}
                {active &&
                  (descending ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  ))}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
