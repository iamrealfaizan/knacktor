import { getSheets } from "@/lib/content-service";

export const metadata = { title: "Sheets" };

export default async function SheetsPage() {
  const sheets = await getSheets();

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-kn-ink-0">Sheets</h1>
        <p className="mt-1 text-sm text-kn-ink-2">
          Curated problem sets — Blind 75, NeetCode 150, and more.
        </p>
      </div>

      {sheets.length === 0 ? (
        <div className="py-20 text-center text-kn-ink-2 text-sm border border-kn-border-0 rounded-lg bg-kn-surface-0">
          Sheets coming soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sheets.map((sheet) => (
            <div key={sheet.slug} className="p-4 rounded-lg border border-kn-border-0 bg-kn-surface-0">
              <p className="font-medium text-sm text-kn-ink-0">{sheet.name}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
