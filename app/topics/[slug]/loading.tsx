import { PageHeaderSkeleton, ListSkeleton } from "@/components/skeletons";

export default function TopicLoading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <PageHeaderSkeleton />
      <ListSkeleton rows={8} />
    </main>
  );
}
