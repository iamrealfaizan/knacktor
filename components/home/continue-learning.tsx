import Link from "next/link";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Difficulty } from "./home-data";
import { DIFFICULTY_STYLE } from "./home-data";

/** Display shape for the continue-learning card (home page maps DB → this). */
export interface ContinueView {
  num: string;
  title: string;
  diff: Difficulty;
  topic: string;
  pattern: string;
  blurb: string;
  href: string;
  upNext: { num: string; title: string; diff: Difficulty; href: string } | null;
}

export function ContinueLearning({ data }: { data: ContinueView | null }) {
  if (!data) {
    return (
      <Card className="flex flex-col gap-0 rounded-2xl border border-kn-border-0 bg-kn-surface-0 ring-0 p-[22px]">
        <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-current">
          ▸ CONTINUE LEARNING
        </div>
        <div className="flex flex-1 flex-col items-start justify-center gap-3 py-6">
          <p className="text-[13.5px] leading-relaxed text-kn-ink-1">
            No problem in progress yet. Open one and start solving — it&apos;ll show up here.
          </p>
          <Button
            render={
              <Link href="/problems">
                <Play className="h-4 w-4 fill-current" />
                Browse problems
              </Link>
            }
            className="bg-kn-current text-white hover:opacity-90 shadow-[0_4px_14px_var(--kn-accent-soft)] h-10 px-[18px] rounded-[10px] text-sm font-semibold"
          />
        </div>
      </Card>
    );
  }

  const d = DIFFICULTY_STYLE[data.diff];
  const up = data.upNext ? DIFFICULTY_STYLE[data.upNext.diff] : null;

  return (
    <Card className="flex flex-col gap-0 rounded-2xl border border-kn-border-0 bg-kn-surface-0 ring-0 p-[22px]">
      <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-current">
        ▸ CONTINUE LEARNING
      </div>

      <div className="flex items-center gap-3 mt-3.5">
        <span className="font-mono text-[13px] font-semibold text-kn-ink-2">#{data.num}</span>
        <span className="text-xl font-bold text-kn-ink-0">{data.title}</span>
        <Badge className={`rounded-full font-mono text-[9px] tracking-[0.08em] px-2 ${d.bg} ${d.ink}`}>
          {data.diff.toUpperCase()}
        </Badge>
      </div>

      <div className="flex gap-1.5 mt-2.5">
        <Badge
          variant="outline"
          className="rounded-full font-mono text-[11px] border-kn-border-0 text-kn-ink-2 px-2.5"
        >
          {data.topic}
        </Badge>
        <Badge className="rounded-full font-mono text-[11px] bg-kn-accent-soft text-kn-current px-2.5">
          {data.pattern}
        </Badge>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-kn-ink-1">{data.blurb}</p>

      <div className="mt-auto pt-4">
        {data.upNext && up ? (
          <>
            <div className="font-mono text-[9px] font-bold tracking-[0.13em] text-kn-ink-2 mb-2">
              UP NEXT
            </div>
            <div className="flex items-center gap-2.5 py-2.5 px-3 border border-kn-border-0 rounded-[10px] mb-3.5">
              <span className="font-mono text-xs font-semibold text-kn-ink-2">#{data.upNext.num}</span>
              <span className="text-sm font-semibold text-kn-ink-0">{data.upNext.title}</span>
              <Badge
                className={`ml-auto rounded-full font-mono text-[9px] tracking-[0.08em] px-2 ${up.bg} ${up.ink}`}
              >
                {data.upNext.diff.toUpperCase()}
              </Badge>
            </div>
          </>
        ) : null}

        <Button
          render={
            <Link href={data.href}>
              <Play className="h-4 w-4 fill-current" />
              Resume visualizer
            </Link>
          }
          className="bg-kn-current text-white hover:opacity-90 shadow-[0_4px_14px_var(--kn-accent-soft)] h-10 px-[18px] rounded-[10px] text-sm font-semibold"
        />
      </div>
    </Card>
  );
}
