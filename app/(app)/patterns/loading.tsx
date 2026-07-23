import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeaderSkeleton, ConceptGridSkeleton } from "@/components/skeletons";

export default function PatternsLoading() {
  return (
    <main className="max-w-[1240px] mx-auto px-5 sm:px-7 py-10">
      <SectionHeaderSkeleton />
      {[6, 6].map((count, i) => (
        <section key={i} className="mb-11 last:mb-0">
          <div className="mb-4 flex items-baseline gap-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <ConceptGridSkeleton count={count} cols={3} />
        </section>
      ))}
    </main>
  );
}
