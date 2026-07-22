import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HEAT_MIX } from "./home-data";

/** Translucent tint of --kn-current for a given activity level (level 0 → track). */
function levelStyle(level: number): React.CSSProperties {
  const mix = HEAT_MIX[level];
  return {
    backgroundColor:
      mix == null ? "var(--kn-track)" : `color-mix(in srgb, var(--kn-current) ${mix}%, transparent)`,
  };
}

export interface StreakCardProps {
  /** effective current streak in days */
  streakDays: number;
  /** 26×7 grid of activity levels (0–4), chronological */
  heatLevels: number[][];
  /** one month label per week column ("" = same month as the column to its left) */
  heatMonths: string[];
  /** question-of-the-day tile */
  potd: { title: string; href: string; solved?: boolean };
}

export function StreakCard({ streakDays, heatLevels, heatMonths, potd }: StreakCardProps) {
  return (
    <Card className="flex flex-col justify-between gap-0 rounded-2xl border border-kn-border-0 bg-kn-surface-0 ring-0 p-[22px]">
      {/* header: streak count + legend */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-ink-2">STREAK</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-extrabold text-kn-ink-0">{streakDays}</span>
            <span className="text-[13px] text-kn-ink-1">day streak 🔥</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-kn-ink-2">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="h-[11px] w-[11px] rounded-[3px]" style={levelStyle(l)} />
          ))}
          More
        </div>
      </div>

      {/* heatmap */}
      <div className="mt-4">
        <div className="flex gap-1 mb-1.5">
          {heatMonths.map((m, i) => (
            <div
              key={i}
              className="flex-1 font-mono text-[9px] font-semibold text-kn-ink-2 whitespace-nowrap overflow-visible"
            >
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {heatLevels.map((week, w) => (
            <div key={w} className="flex-1 flex flex-col gap-1">
              {week.map((level, d) => (
                <div key={d} className="w-full aspect-square rounded-[3px]" style={levelStyle(level)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* problem of the day */}
      <Link
        href={potd.href}
        className="flex items-center gap-2.5 border border-dashed border-kn-current rounded-xl bg-kn-accent-soft py-3 px-3.5 mt-4 transition-opacity hover:opacity-90"
      >
        <span className="text-lg" aria-hidden>🎯</span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-bold tracking-[0.1em] text-kn-current">
            PROBLEM OF THE DAY
          </div>
          <div className="text-sm font-semibold text-kn-ink-0 mt-0.5 truncate">{potd.title}</div>
        </div>
        {potd.solved ? (
          <span className="ml-auto flex items-center gap-1 font-mono text-[10px] font-bold text-kn-result">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            DONE
          </span>
        ) : null}
      </Link>
    </Card>
  );
}
