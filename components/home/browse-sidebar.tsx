"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { FilterOption } from "./home-data";
import {
  DIFFICULTY_FILTERS,
  PATTERN_FILTERS,
  SHEET_FILTERS,
  STATUS_FILTERS,
  TOPIC_FILTERS,
} from "./home-data";

/**
 * Sidebar sections collapse/expand for real (local state); the filter options
 * inside are visual placeholders — client filtering arrives with real data.
 */

function Section({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-b border-kn-border-0 last:border-b-0 px-4 py-3.5"
    >
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className="flex items-center justify-between w-full bg-transparent cursor-pointer"
          />
        }
      >
        <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-ink-2">
          {title}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold text-kn-current">{summary}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-kn-ink-2 transition-transform", !open && "-rotate-90")}
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* Constrain the *viewport* (base-ui's scroll container) so each list
            scrolls independently instead of overflowing into the next section. */}
        <ScrollArea className="mt-2.5 [&_[data-slot=scroll-area-viewport]]:max-h-[210px]">
          {children}
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** A full-width filter row: label (+ optional dot) on the left, count on the right. */
function OptionRow({ opt }: { opt: FilterOption }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-auto w-full justify-between gap-2 py-2 px-2.5 rounded-[9px] text-[13.5px] font-medium border",
        opt.active
          ? "border-kn-current bg-kn-accent-soft text-kn-ink-0 hover:bg-kn-accent-soft"
          : "border-transparent text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
      )}
    >
      <span className={cn("truncate", opt.dot && `font-semibold ${opt.dot}`)}>{opt.label}</span>
      {opt.count != null && (
        <span className="font-mono text-[11px] font-semibold text-kn-ink-2">{opt.count}</span>
      )}
    </Button>
  );
}

export function BrowseSidebar() {
  return (
    <aside className="sticky top-[76px] flex flex-col border border-kn-border-0 rounded-[14px] bg-kn-surface-0 overflow-hidden">
      <Section title="STATUS" summary="All" defaultOpen>
        <div className="flex flex-col gap-1.5 pr-1">
          {STATUS_FILTERS.map((o) => (
            <OptionRow key={o.label} opt={o} />
          ))}
        </div>
      </Section>

      <Section title="DIFFICULTY" summary="All" defaultOpen>
        <div className="flex flex-col gap-1.5 pr-1">
          {DIFFICULTY_FILTERS.map((o) => (
            <OptionRow key={o.label} opt={o} />
          ))}
        </div>
      </Section>

      <Section title="TOPICS" summary="All" defaultOpen>
        <div className="flex flex-col gap-1 pr-1">
          {TOPIC_FILTERS.map((o) => (
            <OptionRow key={o.label} opt={o} />
          ))}
        </div>
      </Section>

      <Section title="PATTERNS" summary="All">
        <div className="flex flex-wrap gap-1.5 pr-1">
          {PATTERN_FILTERS.map((o) => (
            <Button
              key={o.label}
              type="button"
              variant="outline"
              className={cn(
                "h-auto py-1.5 px-2.5 rounded-full text-xs font-medium",
                o.active
                  ? "border-kn-current bg-kn-accent-soft text-kn-current"
                  : "border-kn-border-0 bg-kn-surface-0 text-kn-ink-1 hover:bg-kn-surface-2"
              )}
            >
              {o.label}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="STUDY SHEETS" summary="None">
        <div className="flex flex-col gap-1.5 pr-1">
          {SHEET_FILTERS.map((o) => (
            <Button
              key={o.label}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between gap-2 py-2 px-2.5 rounded-[9px] text-[13.5px] font-medium border border-transparent text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
            >
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[13px]" aria-hidden>
                  {o.icon}
                </span>
                {o.label}
              </span>
              <span className="font-mono text-[10px] font-semibold text-kn-ink-2">{o.count}</span>
            </Button>
          ))}
        </div>
      </Section>
    </aside>
  );
}
