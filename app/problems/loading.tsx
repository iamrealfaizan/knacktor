import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/skeletons";

export default function ProblemsLoading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-28" />
      </div>
      <div className="flex gap-8 items-start">
        {/* Filters sidebar */}
        <div className="hidden md:flex w-48 shrink-0 flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-7 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <ListSkeleton rows={10} />
        </div>
      </div>
    </main>
  );
}
