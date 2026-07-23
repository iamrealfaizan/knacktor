import { PageHeaderSkeleton, BrowseTableSkeleton } from "@/components/skeletons";

export default function PatternDetailLoading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <PageHeaderSkeleton />
      <BrowseTableSkeleton rows={8} />
    </main>
  );
}
