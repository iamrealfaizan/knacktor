import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared loading-skeleton kit (token-styled, no layout shift). Used by both
 * route-level `loading.tsx` files (Layer 1) and in-component pending states
 * (Layer 2). All blocks are pure presentational — safe in server components.
 */

/* ── Home browse table ─────────────────────────────────────────────────────── */
// Mirrors components/home/problem-table.tsx GRID so rows don't jump on load.
const BROWSE_GRID =
  "grid grid-cols-[36px_40px_1fr_auto] lg:grid-cols-[44px_52px_1fr_96px] gap-2.5 lg:gap-3.5 items-center";

/** One home browse-table row skeleton (status · # · title+chips · level). */
export function ProblemRowSkeleton() {
  return (
    <div className={cn(BROWSE_GRID, "py-3 px-[18px] border-b border-kn-border-0 last:border-b-0")}>
      <Skeleton className="h-[18px] w-[18px] rounded-full" />
      <Skeleton className="h-3.5 w-6" />
      <div className="min-w-0">
        <Skeleton className="h-4 w-1/2" />
        <div className="hidden lg:flex gap-1.5 mt-2">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/** Full home browse table skeleton (container + header + N rows). */
export function BrowseTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="border border-kn-border-0 rounded-[14px] bg-kn-surface-0 overflow-hidden" aria-busy>
      <div className={cn(BROWSE_GRID, "py-2.5 px-[18px] border-b border-kn-border-0 bg-kn-surface-1")}>
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-2.5 w-4" />
        <Skeleton className="h-2.5 w-20" />
        <div className="flex justify-end"><Skeleton className="h-2.5 w-12" /></div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <ProblemRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ── Generic list (ProblemList-style detail/index pages) ───────────────────── */

/** Light generic bordered list skeleton (# · title · difficulty · topics · viz). */
export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="border border-kn-border-0 rounded-lg overflow-hidden bg-kn-surface-0" aria-busy>
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-kn-border-0 bg-kn-surface-1">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-24 flex-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-4 px-4 py-3",
            i > 0 && "border-t border-kn-border-0"
          )}
        >
          <Skeleton className="h-4 w-8 shrink-0" />
          <Skeleton className="h-4 flex-1 max-w-[40%]" />
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          <div className="w-48 shrink-0 hidden md:flex gap-1">
            <Skeleton className="h-4 w-14 rounded" />
            <Skeleton className="h-4 w-14 rounded" />
          </div>
          <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Page header skeleton for detail routes (back link + title + subtitle). */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-4 w-24 mb-6" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-32 mt-2" />
    </div>
  );
}
