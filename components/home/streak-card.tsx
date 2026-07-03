import Link from "next/link";
import { Card } from "@/components/ui/card";
import { HEAT_LEVELS, HEAT_MIX, HEAT_MONTHS, POTD, STREAK_DAYS } from "./home-data";

/** Translucent tint of --kn-current for a given activity level (level 0 → track). */
function levelStyle(level: number): React.CSSProperties {
  const mix = HEAT_MIX[level];
  return {
    backgroundColor:
      mix == null ? "var(--kn-track)" : `color-mix(in srgb, var(--kn-current) ${mix}%, transparent)`,
  };
}

export function StreakCard() {
  return (
    <Card className="flex flex-col justify-between gap-0 rounded-2xl border border-kn-border-0 bg-kn-surface-0 ring-0 p-[22px]">
      {/* header: streak count + legend */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-ink-2">STREAK</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[26px] font-extrabold text-kn-ink-0">{STREAK_DAYS}</span>
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
          {HEAT_MONTHS.map((m, i) => (
            <div
              key={i}
              className="flex-1 font-mono text-[9px] font-semibold text-kn-ink-2 whitespace-nowrap overflow-visible"
            >
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {HEAT_LEVELS.map((week, w) => (
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
        href={POTD.href}
        className="flex items-center gap-2.5 border border-dashed border-kn-current rounded-xl bg-kn-accent-soft py-3 px-3.5 mt-4 transition-opacity hover:opacity-90"
      >
        <span className="text-lg" aria-hidden>🎯</span>
        <div>
          <div className="font-mono text-[10px] font-bold tracking-[0.1em] text-kn-current">
            PROBLEM OF THE DAY
          </div>
          <div className="text-sm font-semibold text-kn-ink-0 mt-0.5">{POTD.title}</div>
        </div>
      </Link>
    </Card>
  );
}
