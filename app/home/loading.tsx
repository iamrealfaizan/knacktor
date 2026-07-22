import { Skeleton } from "@/components/ui/skeleton";
import { BrowseTableSkeleton } from "@/components/skeletons";

/**
 * High-fidelity /home skeleton. The page owns its header (HomeHeader) and the
 * global Nav is hidden here, so this mirrors the full dashboard chrome to avoid
 * a header flash + layout shift while the server component fetches.
 */
function DashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-kn-border-0 bg-kn-surface-0 p-[22px] ${className ?? ""}`}>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="mt-4 h-6 w-40" />
      <div className="mt-5 flex flex-col gap-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="mt-6 h-9 w-40 rounded-[10px]" />
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      {/* Header bar (matches HomeHeader: sticky, 60px, bordered) */}
      <header className="sticky top-0 z-50 flex items-center gap-3 sm:gap-5 h-[60px] px-4 sm:px-6 border-b border-kn-border-0 bg-kn-bg/85 backdrop-blur-xl">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="hidden md:block h-4 w-20" />
        <div className="hidden md:flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="ml-auto h-9 w-40 rounded-lg" />
        <Skeleton className="h-9 w-14 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-[26px] pb-16">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-[18px]">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-72" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Dashboard band — 3 cards */}
        <div className="grid gap-4 mb-7 lg:grid-cols-[1.02fr_1.55fr_1.05fr]">
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
          <DashboardCardSkeleton />
        </div>

        {/* Saved link */}
        <div className="mb-3 flex justify-end">
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Browse: sidebar + table */}
        <div className="grid gap-5 items-start lg:grid-cols-[236px_1fr]">
          <div className="hidden lg:flex flex-col gap-4 border border-kn-border-0 rounded-[14px] bg-kn-surface-0 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div>
            {/* Toolbar */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 mb-3.5">
              <Skeleton className="hidden sm:block h-4 w-20" />
              <Skeleton className="h-[38px] flex-1 rounded-lg" />
              <Skeleton className="hidden lg:block h-[38px] w-40 rounded-lg" />
            </div>
            <BrowseTableSkeleton rows={10} />
          </div>
        </div>
      </main>
    </div>
  );
}
