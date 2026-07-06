import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getProblemsPage,
  getProblemFacets,
  getProblemCountsByPattern,
  getTopics,
  getPatterns,
  getSheets,
} from "@/lib/content-service";
import type { DifficultySlug } from "@/lib/types";
import { HOME_PAGE_SIZE, parseState } from "@/lib/home-url";
import { HomeHeader } from "@/components/home/home-header";
import { Greeting } from "@/components/home/greeting";
import { ContinueLearning } from "@/components/home/continue-learning";
import { StreakCard } from "@/components/home/streak-card";
import { ProgressCard } from "@/components/home/progress-card";
import { BrowsePanel } from "@/components/home/browse-panel";
import type { Difficulty, FacetOption, FilterOption } from "@/components/home/home-data";
import { DIFFICULTY_STYLE, toHomeRow } from "@/components/home/home-data";

const DIFF_DISPLAY: Record<DifficultySlug, Difficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
const VALID_DIFF: DifficultySlug[] = ["easy", "medium", "hard"];

export default async function HomeDashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Middleware already gates /home; this is a defensive fallback.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "there",
    username: session.user.username,
    email: session.user.email ?? "",
  };

  // Initial browse state comes from the URL so a shared link renders correctly (SSR).
  const initialState = parseState(searchParams);

  const [{ items, total }, facets, patternCounts, topics, patterns, sheets] =
    await Promise.all([
      getProblemsPage({
        search: initialState.q || undefined,
        difficulties: initialState.difficulties as DifficultySlug[],
        topicSlugs: initialState.topics,
        patternSlugs: initialState.patterns,
        sort: initialState.sort,
        order: initialState.order,
        page: initialState.page,
        limit: HOME_PAGE_SIZE,
      }),
      getProblemFacets(),
      getProblemCountsByPattern(),
      getTopics(),
      getPatterns(),
      getSheets(),
    ]);

  const topicName: Record<string, string> = Object.fromEntries(
    topics.map((t) => [t.slug, t.name])
  );
  const patternName: Record<string, string> = Object.fromEntries(
    patterns.map((p) => [p.slug, p.name])
  );

  const initialRows = items.map((p) => toHomeRow(p, topicName, patternName));

  // Sidebar facet counts reflect the WHOLE catalog, independent of active filters.
  const catalogTotal = Object.values(facets.difficulty).reduce((a, b) => a + b, 0);

  const difficultyOptions: FacetOption[] = VALID_DIFF.map((slug) => ({
    value: slug,
    label: DIFF_DISPLAY[slug],
    count: facets.difficulty[slug] ?? 0,
    dot: DIFFICULTY_STYLE[DIFF_DISPLAY[slug]].dot,
  }));

  const topicOptions: FacetOption[] = topics
    .filter((t) => facets.topics[t.slug])
    .map((t) => ({ value: t.slug, label: t.name, count: facets.topics[t.slug] }));

  const patternOptions: FacetOption[] = patterns
    .filter((p) => patternCounts[p.slug])
    .map((p) => ({ value: p.slug, label: p.name, count: patternCounts[p.slug] }));

  const statusOptions: FilterOption[] = [
    { label: "All problems", count: catalogTotal, active: true },
    { label: "Solved", count: 0 },
    { label: "Attempted", count: 0 },
    { label: "To do", count: catalogTotal },
  ];

  const sheetFilters = sheets.map((s) => ({
    label: s.name,
    icon: "📘",
    count: s.entries.length,
  }));

  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      <HomeHeader user={user} />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-[26px] pb-16">
        <Greeting name={user.name} />

        {/* dashboard band */}
        <div className="grid gap-4 mb-7 lg:grid-cols-[1.02fr_1.55fr_1.05fr]">
          <ContinueLearning />
          <StreakCard />
          <ProgressCard />
        </div>

        {/* browse: sidebar + table (self-contained client island) */}
        <BrowsePanel
          initialRows={initialRows}
          initialTotal={total}
          initialState={initialState}
          topicName={topicName}
          patternName={patternName}
          status={statusOptions}
          difficulties={difficultyOptions}
          topics={topicOptions}
          patterns={patternOptions}
          sheets={sheetFilters}
        />
      </main>
    </div>
  );
}
