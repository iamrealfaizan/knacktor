import { HomeHeader } from "@/components/home/home-header";
import { Greeting } from "@/components/home/greeting";
import { ContinueLearning } from "@/components/home/continue-learning";
import { StreakCard } from "@/components/home/streak-card";
import { ProgressCard } from "@/components/home/progress-card";
import { BrowseSidebar } from "@/components/home/browse-sidebar";
import { ProblemTable } from "@/components/home/problem-table";

export default function HomeDashboardPage() {
  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0">
      <HomeHeader />
      <main className="max-w-[1280px] mx-auto px-6 pt-[26px] pb-16">
        <Greeting />

        {/* dashboard band */}
        <div className="grid gap-4 mb-7 lg:grid-cols-[1.02fr_1.55fr_1.05fr]">
          <ContinueLearning />
          <StreakCard />
          <ProgressCard />
        </div>

        {/* browse: sidebar + table */}
        <div className="grid gap-5 items-start lg:grid-cols-[236px_1fr]">
          <div className="hidden lg:block">
            <BrowseSidebar />
          </div>
          <ProblemTable />
        </div>
      </main>
    </div>
  );
}
