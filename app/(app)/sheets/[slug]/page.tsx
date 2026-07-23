import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getSheetBySlug, getProblemsByIds } from "@/lib/content-service";
import { buildProblemRows } from "@/lib/concept-rows";
import { PageHeader } from "@/components/concept/page-header";
import { ProblemTable } from "@/components/home/problem-table";
import type { Problem as DbProblem } from "@/lib/types";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sheet = await getSheetBySlug(params.slug);
  return { title: sheet ? `${sheet.name} — Sheet` : "Sheet" };
}

export default async function SheetPage({ params }: Props) {
  const session = await auth();
  const userId = session?.user?.id || null;

  const sheet = await getSheetBySlug(params.slug);
  if (!sheet) notFound();

  // Sheet order is authoritative. getProblemsByIds does NOT guarantee order, so
  // resolve then re-map by id to restore the entry order (dropping any deleted ids).
  const ordered = [...sheet.entries].sort((a, b) => a.order - b.order);
  const orderedIds = ordered.map((e) => e.problemId);
  const resolved = await getProblemsByIds(orderedIds);
  const byId = new Map(resolved.map((p) => [p._id, p]));
  const problems = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is DbProblem => Boolean(p));

  const rows = await buildProblemRows(problems, userId);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <PageHeader
        backHref="/sheets"
        backLabel="All sheets"
        name={sheet.name}
        description={sheet.description}
        count={ordered.length}
      />
      <ProblemTable rows={rows} emptyLabel="No problems in this sheet yet." />
    </main>
  );
}
