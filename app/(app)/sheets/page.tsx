import { getSheets } from "@/lib/content-service";
import { SectionHeader } from "@/components/concept/section-header";
import { ConceptGrid } from "@/components/concept/concept-grid";
import { ConceptCard } from "@/components/concept/concept-card";
import { conceptVisual } from "@/lib/concept-visuals";

export const metadata = { title: "Sheets" };

export default async function SheetsPage() {
  const sheets = await getSheets();

  return (
    <main className="max-w-[1240px] mx-auto px-5 sm:px-7 py-10">
      <SectionHeader
        eyebrow="CURATED TRACKS"
        title="Sheets"
        subcopy="Curated interview tracks — work through a goal-focused problem set, in order."
      />

      {sheets.length === 0 ? (
        <p className="text-center text-sm text-kn-ink-2 py-14">
          No sheets yet — check back soon.
        </p>
      ) : (
        <ConceptGrid cols={4}>
          {sheets.map((sheet) => {
            const { icon, tone } = conceptVisual(sheet.slug);
            return (
              <ConceptCard
                key={sheet.slug}
                href={`/sheets/${sheet.slug}`}
                icon={icon}
                tone={tone}
                name={sheet.name}
                description={sheet.description}
                count={sheet.entries.length}
              />
            );
          })}
        </ConceptGrid>
      )}
    </main>
  );
}
