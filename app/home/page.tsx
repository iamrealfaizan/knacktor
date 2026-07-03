import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getProblems,
  getTopics,
  getPatterns,
  getSheets,
} from "@/lib/content-service";
import type { DifficultySlug } from "@/lib/types";
import { HomeHeader } from "@/components/home/home-header";
import { Greeting } from "@/components/home/greeting";
import { ContinueLearning } from "@/components/home/continue-learning";
import { StreakCard } from "@/components/home/streak-card";
import { ProgressCard } from "@/components/home/progress-card";
import {
  BrowseSidebar,
  type BrowseFilters,
} from "@/components/home/browse-sidebar";
import { ProblemTable } from "@/components/home/problem-table";
import type { Difficulty, Problem } from "@/components/home/home-data";
import { DIFFICULTY_STYLE } from "@/components/home/home-data";

const DIFF_DISPLAY: Record<DifficultySlug, Difficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export default async function HomeDashboardPage() {
  // Middleware already gates /home; this is a defensive fallback.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? "there",
    username: session.user.username,
    email: session.user.email ?? "",
  };

  const [dbProblems, topics, patterns, sheets] = await Promise.all([
    getProblems(),
    getTopics(),
    getPatterns(),
    getSheets(),
  ]);

  const topicName = new Map(topics.map((t) => [t.slug, t.name]));
  const patternName = new Map(patterns.map((p) => [p.slug, p.name]));

  // Per-problem status stays "todo" until a UserProgress backend exists.
  const problems: Problem[] = dbProblems.map((p) => ({
    num: p.number,
    title: p.title,
    diff: DIFF_DISPLAY[p.difficulty],
    topics: p.topics.map((s) => topicName.get(s) ?? s),
    patterns: p.patterns.map((s) => patternName.get(s) ?? s),
    status: "todo",
    viz: p.hasVisualization,
    href: `/problems/${p.slug}`,
  }));

  const total = problems.length;
  const countDiff = (d: Difficulty) =>
    problems.filter((p) => p.diff === d).length;
  const countTag = (list: "topics" | "patterns", name: string) =>
    problems.filter((p) => p[list].includes(name)).length;

  const topicsInCatalog = [...new Set(problems.flatMap((p) => p.topics))].sort();
  const patternsInCatalog = [
    ...new Set(problems.flatMap((p) => p.patterns)),
  ].sort();

  const filters: BrowseFilters = {
    status: [
      { label: "All problems", count: total, active: true },
      { label: "Solved", count: 0 },
      { label: "Attempted", count: 0 },
      { label: "To do", count: total },
    ],
    difficulty: [
      { label: "All", count: total, active: true, dot: "text-kn-ink-2" },
      { label: "Easy", count: countDiff("Easy"), dot: DIFFICULTY_STYLE.Easy.dot },
      { label: "Medium", count: countDiff("Medium"), dot: DIFFICULTY_STYLE.Medium.dot },
      { label: "Hard", count: countDiff("Hard"), dot: DIFFICULTY_STYLE.Hard.dot },
    ],
    topics: [
      { label: "All topics", count: total, active: true },
      ...topicsInCatalog.map((t) => ({ label: t, count: countTag("topics", t) })),
    ],
    patterns: [
      { label: "All", active: true },
      ...patternsInCatalog.map((t) => ({ label: t })),
    ],
    sheets: sheets.map((s) => ({
      label: s.name,
      icon: "📘",
      count: s.entries.length,
    })),
  };

  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      <HomeHeader user={user} />
      <main className="max-w-[1280px] mx-auto px-6 pt-[26px] pb-16">
        <Greeting name={user.name} />

        {/* dashboard band */}
        <div className="grid gap-4 mb-7 lg:grid-cols-[1.02fr_1.55fr_1.05fr]">
          <ContinueLearning />
          <StreakCard />
          <ProgressCard />
        </div>

        {/* browse: sidebar + table */}
        <div className="grid gap-5 items-start lg:grid-cols-[236px_1fr]">
          <div className="hidden lg:block">
            <BrowseSidebar filters={filters} />
          </div>
          <ProblemTable problems={problems} />
        </div>
      </main>
    </div>
  );
}
