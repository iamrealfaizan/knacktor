import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <Skeleton className="h-4 w-56" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
