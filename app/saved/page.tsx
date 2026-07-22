import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Bookmark } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBookmarkedIds } from "@/lib/progress-service";
import { getProblemsByIds } from "@/lib/content-service";
import { ProblemList } from "@/components/problem-list";

export const metadata: Metadata = { title: "Saved Problems" };

// User-specific — always render per request.
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  // Middleware gates this route; defensive fallback for the anon path.
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ids = await getBookmarkedIds(session.user.id);
  const problems = (await getProblemsByIds(ids)).sort((a, b) => a.number - b.number);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm text-kn-ink-2 hover:text-kn-ink-0 transition-colors mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-kn-amber" />
        <h1 className="text-2xl font-semibold text-kn-ink-0">Saved</h1>
        <span className="text-sm text-kn-ink-2">
          {problems.length} problem{problems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {problems.length === 0 ? (
        <div className="py-20 text-center text-kn-ink-2 text-sm">
          No saved problems yet. Tap the bookmark icon on any problem to save it here.
        </div>
      ) : (
        <ProblemList problems={problems} />
      )}
    </main>
  );
}
