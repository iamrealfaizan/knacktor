"use client";

import { ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProblemSort, SortOrder } from "@/lib/types";
import { SORT_OPTIONS, type FacetOption, type FilterOption } from "./home-data";
import {
  BrowseSidebar,
  type FilterGroup,
  type Selected,
  type SheetFilter,
} from "./browse-sidebar";

/**
 * Mobile filter + sort bottom sheet (< lg). Reuses the exact desktop filter
 * sections (`BrowseSidebar bare`) plus a Sort control that's desktop-only in
 * the toolbar. All toggles apply live via the parent island's handlers, so the
 * "Show results" button just dismisses the sheet.
 */
export function MobileFilterSheet({
  open,
  onOpenChange,
  status,
  difficulties,
  topics,
  patterns,
  sheets,
  selected,
  activeCount,
  onToggle,
  onClearAll,
  sort,
  order,
  onSortChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: FilterOption[];
  difficulties: FacetOption[];
  topics: FacetOption[];
  patterns: FacetOption[];
  sheets: SheetFilter[];
  selected: Selected;
  activeCount: number;
  onToggle: (group: FilterGroup, value: string | null) => void;
  onClearAll: () => void;
  sort: ProblemSort;
  order: SortOrder;
  onSortChange: (sort: ProblemSort) => void;
}) {
  const descending = order === "desc";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 p-0 pt-2">
        {/* grab handle */}
        <div className="flex justify-center py-1.5">
          <span className="w-9 h-1 rounded-full bg-kn-border-0" />
        </div>

        {/* header */}
        <div className="flex items-center gap-2 px-4 pb-3 border-b border-kn-border-0">
          <SheetTitle className="text-[13px]">
            FILTERS{activeCount > 0 && <span className="text-kn-current"> · {activeCount}</span>}
          </SheetTitle>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="ml-auto h-8 gap-1.5 text-kn-ink-2 hover:text-kn-ink-0 touch-manipulation"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </Button>
          )}
        </div>

        {/* scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto cs-scroll">
          {/* Sort — mirrors the desktop toolbar's segmented control */}
          <div className="px-4 py-3 border-b border-kn-border-0">
            <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-ink-2 mb-2.5">
              SORT
            </p>
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
                      "flex-1 h-auto py-2 px-2 rounded-md text-xs font-semibold gap-1 touch-manipulation",
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

          {/* Filter sections (identical to the desktop sidebar) */}
          <BrowseSidebar
            bare
            status={status}
            difficulties={difficulties}
            topics={topics}
            patterns={patterns}
            sheets={sheets}
            selected={selected}
            onToggle={onToggle}
            onClearAll={onClearAll}
          />
        </div>

        {/* footer */}
        <div className="px-4 pt-3 border-t border-kn-border-0">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-11 bg-kn-current text-white hover:bg-kn-current/90 font-semibold touch-manipulation"
          >
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
