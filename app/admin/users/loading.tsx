import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-4 w-24" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 min-w-[220px] flex-1 rounded-lg sm:max-w-xs" />
        <Skeleton className="h-9 w-[130px] rounded-lg" />
        <Skeleton className="h-9 w-[140px] rounded-lg" />
        <Skeleton className="h-9 w-[150px] rounded-lg" />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-kn-border-0 bg-kn-surface-0">
        <div className="h-11 border-b border-kn-border-0 bg-kn-surface-1" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-kn-border-0 px-4 py-3 last:border-0"
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="mt-1.5 h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
