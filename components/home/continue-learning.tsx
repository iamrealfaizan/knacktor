import Link from "next/link";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTINUE, DIFFICULTY_STYLE } from "./home-data";

export function ContinueLearning() {
  const d = DIFFICULTY_STYLE[CONTINUE.diff];
  const up = DIFFICULTY_STYLE[CONTINUE.upNext.diff];

  return (
    <Card className="flex flex-col gap-0 rounded-2xl border border-kn-border-0 bg-kn-surface-0 ring-0 p-[22px]">
      <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-current">
        ▸ CONTINUE LEARNING
      </div>

      <div className="flex items-center gap-3 mt-3.5">
        <span className="font-mono text-[13px] font-semibold text-kn-ink-2">#{CONTINUE.num}</span>
        <span className="text-xl font-bold text-kn-ink-0">{CONTINUE.title}</span>
        <Badge className={`rounded-full font-mono text-[9px] tracking-[0.08em] px-2 ${d.bg} ${d.ink}`}>
          {CONTINUE.diff.toUpperCase()}
        </Badge>
      </div>

      <div className="flex gap-1.5 mt-2.5">
        <Badge
          variant="outline"
          className="rounded-full font-mono text-[11px] border-kn-border-0 text-kn-ink-2 px-2.5"
        >
          {CONTINUE.topic}
        </Badge>
        <Badge className="rounded-full font-mono text-[11px] bg-kn-accent-soft text-kn-current px-2.5">
          {CONTINUE.pattern}
        </Badge>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-kn-ink-1">{CONTINUE.blurb}</p>

      <div className="mt-auto pt-4">
        <div className="font-mono text-[9px] font-bold tracking-[0.13em] text-kn-ink-2 mb-2">
          UP NEXT
        </div>
        <div className="flex items-center gap-2.5 py-2.5 px-3 border border-kn-border-0 rounded-[10px] mb-3.5">
          <span className="font-mono text-xs font-semibold text-kn-ink-2">#{CONTINUE.upNext.num}</span>
          <span className="text-sm font-semibold text-kn-ink-0">{CONTINUE.upNext.title}</span>
          <Badge
            className={`ml-auto rounded-full font-mono text-[9px] tracking-[0.08em] px-2 ${up.bg} ${up.ink}`}
          >
            {CONTINUE.upNext.diff.toUpperCase()}
          </Badge>
        </div>

        <Button
          render={
            <Link href={CONTINUE.href}>
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
