import Link from "next/link";
import { Bookmark } from "lucide-react";
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
import {
  getProblemStatuses,
  getProblemStatusCounts,
  getStreak,
  resolveStatusFilterIds,
} from "@/lib/progress-service";
import type { DifficultySlug, ProgressStatus } from "@/lib/types";
import { HOME_PAGE_SIZE, parseState } from "@/lib/home-url";
import { HomeHeader } from "@/components/home/home-header";
import { BrowsePanel } from "@/components/home/browse-panel";
import type { Difficulty, FacetOption, FilterOption } from "@/components/home/home-data";
import { DIFFICULTY_STYLE, toHomeRow } from "@/components/home/home-data";

export const metadata = { title: "Problems" };

const DIFF_DISPLAY: Record<DifficultySlug, Difficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};
const VALID_DIFF: DifficultySlug[] = ["easy", "medium", "hard"];

/**
 * /problems — the dedicated catalog browser. Shares the exact browse experience
 * from /home (HomeHeader chrome + BrowsePanel: sidebar filters, search, sort,
 * paginated table with live per-user status) but drops the personal dashboard
 * band (greeting / streak / progress) which stays unique to /home.
 *
 * Like /home, this page renders HomeHeader itself and does its own auth check
 * rather than living under the (app) route group — the group would collide with
 * the public, ungated /problems/[slug] detail route (which has its own TopBar).
 */
export default async function ProblemsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Middleware already gates /problems; this is a defensive fallback.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "there",
    username: session.user.username,
    email: session.user.email ?? "",
  };

  // Initial browse state comes from the URL so a shared link renders correctly (SSR).
  const initialState = parseState(searchParams);
  const userId = session.user.id || null;

  // Resolve the status filter into an _id constraint server-side, so a shared
  // link like /problems?status=solved renders the correct filtered page on first paint.
  const statusIds =
    userId && initialState.status.length
      ? await resolveStatusFilterIds(userId, initialState.status as ProgressStatus[])
      : {};

  const [{ items, total }, facets, patternCounts, topics, patterns, sheets, streak] =
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
        ...statusIds,
      }),
      getProblemFacets(),
      getProblemCountsByPattern(),
      getTopics(),
      getPatterns(),
      getSheets(),
      userId ? getStreak(userId) : Promise.resolve(null),
    ]);

  const topicName: Record<string, string> = Object.fromEntries(
    topics.map((t) => [t.slug, t.name])
  );
  const patternName: Record<string, string> = Object.fromEntries(
    patterns.map((p) => [p.slug, p.name])
  );

  // Real per-problem status for the current page + whole-catalog status counts.
  const pageProblemIds = items
    .map((p) => p._id)
    .filter((id): id is string => Boolean(id));

  const [statuses, statusCounts] = userId
    ? await Promise.all([
        getProblemStatuses(userId, pageProblemIds),
        getProblemStatusCounts(userId),
      ])
    : [
        {} as Record<string, ProgressStatus>,
        { solved: 0, attempted: 0, bookmarked: 0 },
      ];

  const initialRows = items.map((p) =>
    toHomeRow(p, topicName, patternName, statuses[p._id ?? ""] ?? "todo")
  );

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

  // "To do" is derived: untouched problems are not stored (progress-service).
  const todoCount = Math.max(
    0,
    catalogTotal - statusCounts.solved - statusCounts.attempted
  );
  const statusOptions: FilterOption[] = [
    { label: "All problems", count: catalogTotal },
    { label: "Solved", value: "solved", count: statusCounts.solved },
    { label: "Attempted", value: "attempted", count: statusCounts.attempted },
    { label: "To do", value: "todo", count: todoCount },
  ];

  const sheetFilters = sheets.map((s) => ({
    label: s.name,
    icon: "📘",
    count: s.entries.length,
  }));

  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      <HomeHeader user={user} streakDays={streak?.currentStreak ?? 0} />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-[26px] pb-16">
        {/* Page heading */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-kn-ink-2">
              Catalog
            </div>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-kn-ink-0">
              Problems
            </h1>
            <p className="mt-1.5 text-sm text-kn-ink-2">
              Browse the full catalog — filter by difficulty, topic, pattern, or status.
            </p>
          </div>
          <Link
            href="/saved"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-kn-ink-2 hover:text-kn-ink-0 transition-colors"
          >
            <Bookmark className="h-4 w-4 text-kn-amber" />
            Saved{statusCounts.bookmarked ? ` (${statusCounts.bookmarked})` : ""}
          </Link>
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
