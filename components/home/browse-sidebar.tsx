"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { FilterOption, FacetOption } from "./home-data";

/**
 * Browse sidebar. Difficulty / topic / pattern are controlled multi-select
 * filters (single click toggles a value; the "All" row clears the group).
 * Status/study-sheet rows stay inert placeholders until a UserProgress backend
 * lands. All state is owned by the parent island — this only reports toggles.
 */

export interface SheetFilter {
  label: string;
  icon: string;
  count: number;
}

export type FilterGroup = "difficulties" | "topics" | "patterns";

export interface Selected {
  difficulties: string[];
  topics: string[];
  patterns: string[];
}

interface BrowseSidebarProps {
  status: FilterOption[];
  difficulties: FacetOption[];
  topics: FacetOption[];
  patterns: FacetOption[];
  sheets: SheetFilter[];
  selected: Selected;
  onToggle: (group: FilterGroup, value: string | null) => void;
  onClearAll: () => void;
}

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
function OptionRow({
  label,
  count,
  active,
  dot,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  dot?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-full justify-between gap-2 py-2 px-2.5 rounded-[9px] text-[13.5px] font-medium border",
        active
          ? "border-kn-current bg-kn-accent-soft text-kn-ink-0 hover:bg-kn-accent-soft"
          : "border-transparent text-kn-ink-1 hover:bg-kn-surface-2 hover:text-kn-ink-0"
      )}
    >
      <span className={cn("truncate", dot && `font-semibold ${dot}`)}>{label}</span>
      {count != null && (
        <span className="font-mono text-[11px] font-semibold text-kn-ink-2">{count}</span>
      )}
    </Button>
  );
}

/** Renders an "All" reset row + one toggle row per facet option. */
function FacetSection({
  options,
  selected,
  allLabel,
  allCount,
  onToggle,
  onClear,
}: {
  options: FacetOption[];
  selected: string[];
  allLabel: string;
  allCount: number;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 pr-1">
      <OptionRow
        label={allLabel}
        count={allCount}
        active={selected.length === 0}
        onClick={onClear}
      />
      {options.map((o) => (
        <OptionRow
          key={o.value}
          label={o.label}
          count={o.count}
          dot={o.dot}
          active={selected.includes(o.value)}
          onClick={() => onToggle(o.value)}
        />
      ))}
    </div>
  );
}

export function BrowseSidebar({
  status,
  difficulties,
  topics,
  patterns,
  sheets,
  selected,
  onToggle,
  onClearAll,
}: BrowseSidebarProps) {
  const catalogTotal = status[0]?.count ?? 0;
  const summary = (n: number) => (n > 0 ? `${n} selected` : "All");
  const anyActive =
    selected.difficulties.length + selected.topics.length + selected.patterns.length > 0;

  return (
    <aside className="sticky top-[76px] flex flex-col border border-kn-border-0 rounded-[14px] bg-kn-surface-0 overflow-hidden">
      {anyActive && (
        <div className="px-4 pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="w-full justify-start gap-1.5 text-kn-ink-2 hover:text-kn-ink-0 px-2"
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}

      <Section title="STATUS" summary="All" defaultOpen>
        <div className="flex flex-col gap-1.5 pr-1">
          {status.map((o) => (
            <OptionRow
              key={o.label}
              label={o.label}
              count={o.count}
              active={Boolean(o.active)}
            />
          ))}
        </div>
      </Section>

      <Section title="DIFFICULTY" summary={summary(selected.difficulties.length)} defaultOpen>
        <FacetSection
          options={difficulties}
          selected={selected.difficulties}
          allLabel="All"
          allCount={catalogTotal}
          onToggle={(v) => onToggle("difficulties", v)}
          onClear={() => onToggle("difficulties", null)}
        />
      </Section>

      <Section title="TOPICS" summary={summary(selected.topics.length)} defaultOpen>
        <FacetSection
          options={topics}
          selected={selected.topics}
          allLabel="All topics"
          allCount={catalogTotal}
          onToggle={(v) => onToggle("topics", v)}
          onClear={() => onToggle("topics", null)}
        />
      </Section>

      <Section title="PATTERNS" summary={summary(selected.patterns.length)}>
        <div className="flex flex-wrap gap-1.5 pr-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onToggle("patterns", null)}
            className={cn(
              "h-auto py-1.5 px-2.5 rounded-full text-xs font-medium",
              selected.patterns.length === 0
                ? "border-kn-current bg-kn-accent-soft text-kn-current"
                : "border-kn-border-0 bg-kn-surface-0 text-kn-ink-1 hover:bg-kn-surface-2"
            )}
          >
            All
          </Button>
          {patterns.map((o) => (
            <Button
              key={o.value}
              type="button"
              variant="outline"
              onClick={() => onToggle("patterns", o.value)}
              className={cn(
                "h-auto py-1.5 px-2.5 rounded-full text-xs font-medium",
                selected.patterns.includes(o.value)
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
          {sheets.map((o) => (
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
