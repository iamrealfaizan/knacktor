import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUserDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-4 w-20" />

      <div className="mt-4 rounded-xl border border-kn-border-0 bg-kn-surface-0 p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3.5 w-28" />
            <Skeleton className="mt-1.5 h-3.5 w-52" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-kn-border-0 bg-kn-surface-0 p-4 sm:p-5">
        <Skeleton className="h-4 w-20" />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-5 h-2 rounded-full" />
        <div className="mt-5 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-1.5 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
