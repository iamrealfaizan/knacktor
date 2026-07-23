import { SectionHeaderSkeleton, ConceptGridSkeleton } from "@/components/skeletons";

export default function SheetsLoading() {
  return (
    <main className="max-w-[1240px] mx-auto px-5 sm:px-7 py-10">
      <SectionHeaderSkeleton />
      <ConceptGridSkeleton count={8} cols={4} />
    </main>
  );
}
