import { Skeleton } from "@/components/ui/skeleton";

/**
 * High-fidelity problem-page skeleton. Lives inside the no-scroll problem layout
 * (h-dvh, overflow-hidden), so it mirrors the flagship shell — top bar, the
 * code / stage / rail panels, and the bottom control dock — with no layout jump.
 */
export default function ProblemLoading() {
  return (
    <div className="h-full flex flex-col font-mono">
      {/* Top bar */}
      <header className="flex-none h-12 lg:h-14 flex items-center gap-3 px-2 lg:px-4 border-b border-kn-border-0 bg-kn-surface-0">
        <Skeleton className="h-7 w-7 rounded-lg" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="hidden lg:block h-7 w-24 rounded-md" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="hidden lg:block h-8 w-48 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </header>

      {/* Body: code | stage + narration | rail */}
      <div className="flex-1 min-h-0 flex">
        {/* Code panel (desktop) */}
        <div className="hidden lg:flex flex-col gap-2 w-[280px] border-r border-kn-border-0 bg-kn-surface-0 p-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-3" style={{ width: `${45 + ((i * 7) % 50)}%` }} />
          ))}
        </div>

        {/* Stage + narration */}
        <div className="flex-1 min-w-0 flex flex-col bg-kn-surface-stage">
          <div className="flex-1 min-h-0 grid place-items-center p-6">
            <Skeleton className="h-[60%] w-[70%] rounded-2xl" />
          </div>
          <div className="flex-none border-t border-kn-border-0 bg-kn-surface-0 p-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        </div>

        {/* Insight rail (desktop) */}
        <div className="hidden lg:flex flex-col gap-4 w-[320px] border-l border-kn-border-0 bg-kn-surface-0 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Control dock */}
      <div className="flex-none h-16 border-t border-kn-border-0 bg-kn-surface-0 flex items-center gap-3 px-4">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}
