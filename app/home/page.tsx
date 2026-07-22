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
  getHeatmap,
  getUserProgressSummary,
  getContinueLearningRaw,
  getProblemProgress,
  resolveStatusFilterIds,
} from "@/lib/progress-service";
import { getQotd } from "@/lib/qotd";
import type { DifficultySlug, ProgressStatus } from "@/lib/types";
import { HOME_PAGE_SIZE, parseState } from "@/lib/home-url";
import { HomeHeader } from "@/components/home/home-header";
import { Greeting } from "@/components/home/greeting";
import { ContinueLearning, type ContinueView } from "@/components/home/continue-learning";
import { StreakCard } from "@/components/home/streak-card";
import { ProgressCard } from "@/components/home/progress-card";
import { BrowsePanel } from "@/components/home/browse-panel";
import type { Difficulty, FacetOption, FilterOption } from "@/components/home/home-data";
import { DIFFICULTY_STYLE, toHomeRow } from "@/components/home/home-data";

const RING_CIRCUMFERENCE = 270;

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
  const userId = session.user.id || null;

  // Resolve the status filter into an _id constraint server-side, so a shared
  // link like /home?status=solved renders the correct filtered page on first paint.
  const statusIds =
    userId && initialState.status.length
      ? await resolveStatusFilterIds(userId, initialState.status as ProgressStatus[])
      : {};

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
        ...statusIds,
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

  // Real per-problem status for the current page + whole-catalog status counts.
  // /home is gated to signed-in users, but degrade gracefully if the id is
  // somehow absent (all "todo", zero counts) — never throw for the anon path.
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

  // Dashboard-band data (streak/heatmap/ring/continue). /home is gated, so a
  // signed-in user is the norm; anon falls back to empty visuals with no throw.
  const [streak, heatmap, summary, continueRaw] = userId
    ? await Promise.all([
        getStreak(userId),
        getHeatmap(userId),
        getUserProgressSummary(userId),
        getContinueLearningRaw(userId),
      ])
    : [null, null, null, null];

  // Global date-seeded QOTD + whether this user has already solved it.
  const qotd = await getQotd();
  const qotdSolved =
    qotd && userId
      ? (await getProblemProgress(userId, qotd.id))?.status === "solved"
      : false;
  const potd = qotd
    ? { title: qotd.title, href: qotd.href, solved: qotdSolved }
    : { title: "—", href: "/problems", solved: false };

  const heatLevels: number[][] = heatmap
    ? heatmap.weeks.map((week) => week.map((c) => c.level))
    : Array.from({ length: 26 }, () => Array(7).fill(0));
  const heatMonths: string[] = heatmap?.months ?? Array(26).fill("");

  const ring = {
    solved: summary?.solved ?? 0,
    total:
      summary?.total ??
      Object.values(facets.difficulty).reduce((a, b) => a + b, 0),
    circumference: RING_CIRCUMFERENCE,
  };
  const diffProgress = (summary?.byDifficulty ?? []).map((b) => ({
    label: DIFF_DISPLAY[b.label],
    text: `${b.solved} / ${b.total}`,
    pct: b.total > 0 ? Math.round((100 * b.solved) / b.total) : 0,
  }));

  const displayName = (map: Record<string, string>, slug?: string) =>
    slug ? map[slug] ?? slug : "";

  const continueData: ContinueView | null = continueRaw
    ? {
        num: String(continueRaw.problem.number),
        title: continueRaw.problem.title,
        diff: DIFF_DISPLAY[continueRaw.problem.difficulty],
        topic: displayName(topicName, continueRaw.problem.topics[0]),
        pattern: displayName(patternName, continueRaw.problem.patterns[0]),
        blurb: continueRaw.problem.patterns[0]
          ? `${displayName(patternName, continueRaw.problem.patterns[0])} — pick up where you left off.`
          : "Pick up where you left off.",
        href: `/problems/${continueRaw.problem.slug}`,
        upNext: continueRaw.upNext
          ? {
              num: String(continueRaw.upNext.number),
              title: continueRaw.upNext.title,
              diff: DIFF_DISPLAY[continueRaw.upNext.difficulty],
              href: `/problems/${continueRaw.upNext.slug}`,
            }
          : null,
      }
    : null;

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
        <Greeting name={user.name} />

        {/* dashboard band */}
        <div className="grid gap-4 mb-7 lg:grid-cols-[1.02fr_1.55fr_1.05fr]">
          <ContinueLearning data={continueData} />
          <StreakCard
            streakDays={streak?.currentStreak ?? 0}
            heatLevels={heatLevels}
            heatMonths={heatMonths}
            potd={potd}
          />
          <ProgressCard ring={ring} diffProgress={diffProgress} />
        </div>

        {/* Saved / bookmarked list (backed by the bookmarked flag) */}
        <div className="mb-3 flex justify-end">
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
