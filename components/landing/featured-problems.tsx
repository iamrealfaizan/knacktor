import Link from "next/link";
import { CheckCircle2, CircleDot, Circle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURED, type Difficulty, type Status } from "./data";

const DIFF_PILL: Record<Difficulty, string> = {
  Easy: "bg-kn-result-subtle text-kn-result",
  Medium: "bg-kn-med-bg text-kn-med-ink",
  Hard: "bg-kn-error-subtle text-kn-error",
};

function StatusIcon({ status }: { status: Status }) {
  if (status === "solved") return <CheckCircle2 className="h-3.5 w-3.5 text-kn-result" />;
  if (status === "attempted") return <CircleDot className="h-3.5 w-3.5 text-kn-amber" />;
  return <Circle className="h-3.5 w-3.5 text-kn-ink-2" />;
}

export function FeaturedProblems() {
  return (
    <section className="px-5 sm:px-7 pt-2 pb-[78px]">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-end justify-between mb-5 gap-4">
          <div>
            <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kn-ink-2">FEATURED</span>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-kn-ink-0">
              Problems you already know — finally clear
            </h2>
          </div>
          <Link href="/problems" className="font-semibold text-sm text-kn-current whitespace-nowrap shrink-0">
            View all 480 →
          </Link>
        </div>

        <div className="border border-kn-border-0 rounded-2xl bg-kn-surface-0 overflow-hidden">
          {FEATURED.map((f) => (
            <Link
              key={f.num + f.title}
              href={f.href}
              className="flex items-center gap-4 px-5 py-3.5 border-b border-kn-border-0 last:border-b-0 hover:bg-kn-surface-2 transition-colors"
            >
              <span className="font-mono text-[13px] font-semibold text-kn-ink-2 w-9 shrink-0">{f.num}</span>
              <span className="w-5 shrink-0 grid place-items-center">
                <StatusIcon status={f.status} />
              </span>
              <span className="font-semibold text-[15.5px] text-kn-ink-0 shrink-0 min-w-[160px] sm:min-w-[190px]">
                {f.title}
              </span>
              <span className="hidden md:flex gap-1.5 flex-wrap">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[11px] font-medium tracking-[0.04em] text-kn-ink-2 border border-kn-border-0 rounded-full px-2.5 py-[3px]"
                  >
                    {t}
                  </span>
                ))}
              </span>
              <span
                className={cn(
                  "ml-auto font-mono text-[10px] font-semibold tracking-[0.08em] px-2.5 py-1 rounded-full uppercase",
                  DIFF_PILL[f.diff]
                )}
              >
                {f.diff}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[13px] text-kn-current whitespace-nowrap">
                <Play className="h-3 w-3" /> Visualize
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
