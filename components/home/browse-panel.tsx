"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Problem as DbProblem, ProblemSort } from "@/lib/types";
import {
  HOME_PAGE_SIZE,
  stateToQuery,
  type BrowseState,
} from "@/lib/home-url";
import { BrowseSidebar, type FilterGroup, type SheetFilter } from "./browse-sidebar";
import { MobileFilterSheet } from "./mobile-filter-sheet";
import { ProblemToolbar } from "./problem-toolbar";
import { ProblemTable } from "./problem-table";
import { PaginationBar } from "./pagination-bar";
import { toHomeRow, type FacetOption, type FilterOption, type Problem } from "./home-data";

interface BrowsePanelProps {
  initialRows: Problem[];
  initialTotal: number;
  initialState: BrowseState;
  /** slug → display name maps, so client-side row mapping needs no DB access */
  topicName: Record<string, string>;
  patternName: Record<string, string>;
  status: FilterOption[];
  difficulties: FacetOption[];
  topics: FacetOption[];
  patterns: FacetOption[];
  sheets: SheetFilter[];
}

/**
 * The self-contained browse island: owns all filter/search/sort/page state,
 * fetches ONLY the problem list from /api/problems on change (so the rest of the
 * dashboard never re-renders and scroll is preserved), and mirrors state into the
 * address bar via the History API for shareable links. Initial render uses the
 * server-provided rows, so there's no fetch-on-mount flash.
 */
export function BrowsePanel({
  initialRows,
  initialTotal,
  initialState,
  topicName,
  patternName,
  status,
  difficulties,
  topics,
  patterns,
  sheets,
}: BrowsePanelProps) {
  const pathname = usePathname();
  const [state, setState] = useState<BrowseState>(initialState);
  const [rows, setRows] = useState<Problem[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [pending, setPending] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const firstRender = useRef(true);

  // Active facet filters (status/sheets are inert placeholders — not counted).
  const activeFilterCount =
    state.difficulties.length + state.topics.length + state.patterns.length;

  useEffect(() => {
    // Initial state already matches the server-rendered rows — skip that fetch.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const qs = stateToQuery(state);
    // Update the address bar WITHOUT a Next navigation → no server re-render, no scroll jump.
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);

    // Always send limit so the API uses its paginated branch (returns { data, total }),
    // even when the display query is empty (all filters cleared).
    const apiQs = qs ? `${qs}&limit=${HOME_PAGE_SIZE}` : `limit=${HOME_PAGE_SIZE}`;
    const controller = new AbortController();
    setPending(true);
    fetch(`/api/problems?${apiQs}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json: { data: DbProblem[]; total: number }) => {
        setRows((json.data ?? []).map((p) => toHomeRow(p, topicName, patternName)));
        setTotal(json.total ?? 0);
        setPending(false);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setPending(false);
      });

    return () => controller.abort();
    // topicName/patternName are stable props; re-fetch only when state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const onToggle = useCallback((group: FilterGroup, value: string | null) => {
    setState((s) => {
      if (value === null) return { ...s, [group]: [], page: 1 };
      const cur = s[group];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...s, [group]: next, page: 1 };
    });
  }, []);

  const onClearAll = useCallback(
    () =>
      setState((s) => ({
        ...s,
        q: "",
        difficulties: [],
        topics: [],
        patterns: [],
        page: 1,
      })),
    []
  );

  const onSearchChange = useCallback(
    (q: string) => setState((s) => ({ ...s, q, page: 1 })),
    []
  );

  const onSortChange = useCallback(
    (sort: ProblemSort) =>
      setState((s) => ({
        ...s,
        sort,
        order: s.sort === sort ? (s.order === "asc" ? "desc" : "asc") : "asc",
        page: 1,
      })),
    []
  );

  const onPageChange = useCallback(
    (page: number) => setState((s) => ({ ...s, page })),
    []
  );

  return (
    <div className="grid gap-5 items-start lg:grid-cols-[236px_1fr]">
      <div className="hidden lg:block">
        <BrowseSidebar
          status={status}
          difficulties={difficulties}
          topics={topics}
          patterns={patterns}
          sheets={sheets}
          selected={{
            difficulties: state.difficulties,
            topics: state.topics,
            patterns: state.patterns,
          }}
          onToggle={onToggle}
          onClearAll={onClearAll}
        />
      </div>
      <div>
        <ProblemToolbar
          total={total}
          q={state.q}
          sort={state.sort}
          order={state.order}
          onSearchChange={onSearchChange}
          onSortChange={onSortChange}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={activeFilterCount}
        />
        <ProblemTable rows={rows} pending={pending} />
        <PaginationBar
          total={total}
          page={state.page}
          pageSize={HOME_PAGE_SIZE}
          onPageChange={onPageChange}
        />
      </div>

      {/* Mobile (< lg) filter + sort bottom sheet */}
      <MobileFilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        status={status}
        difficulties={difficulties}
        topics={topics}
        patterns={patterns}
        sheets={sheets}
        selected={{
          difficulties: state.difficulties,
          topics: state.topics,
          patterns: state.patterns,
        }}
        activeCount={activeFilterCount}
        onToggle={onToggle}
        onClearAll={onClearAll}
        sort={state.sort}
        order={state.order}
        onSortChange={onSortChange}
      />
    </div>
  );
}
