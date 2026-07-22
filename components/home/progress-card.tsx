import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Difficulty } from "./home-data";
import { DIFFICULTY_STYLE, NEXT_BADGE } from "./home-data";

/**
 * The radial completion ring is a bespoke SVG — no shadcn/library primitive
 * renders a single-value donut, and the ring is itself the teaching visual.
 * The per-difficulty bars use the shadcn <Progress> primitive.
 */

// Literal indicator-color classes per difficulty (kept literal so Tailwind's JIT emits them).
const BAR_INDICATOR: Record<Difficulty, string> = {
  Easy: "[&_[data-slot=progress-indicator]]:bg-kn-result",
  Medium: "[&_[data-slot=progress-indicator]]:bg-kn-med-ink",
  Hard: "[&_[data-slot=progress-indicator]]:bg-kn-error",
};
const BAR_TRACK = "[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-kn-track";

export interface ProgressCardProps {
  /** completion ring: solved count of total, with the SVG dash circumference */
  ring: { solved: number; total: number; circumference: number };
  /** per-difficulty bars: pre-formatted "solved / total" text + percentage */
  diffProgress: { label: Difficulty; text: string; pct: number }[];
}

export function ProgressCard({ ring, diffProgress }: ProgressCardProps) {
  const dashOffset = ring.total > 0 ? ring.circumference * (1 - ring.solved / ring.total) : ring.circumference;

  return (
    <Card className="flex flex-col gap-0 rounded-2xl border border-kn-border-0 bg-kn-surface-0 ring-0 p-[22px]">
      <div className="font-mono text-[10px] font-bold tracking-[0.14em] text-kn-ink-2">
        YOUR PROGRESS
      </div>

      {/* completion ring */}
      <div className="flex justify-center mt-4">
        <div className="relative h-[126px] w-[126px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-[126px] w-[126px] -rotate-90">
            <circle cx="50" cy="50" r="43" fill="none" stroke="var(--kn-track)" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="none"
              stroke="var(--kn-current)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={ring.circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[34px] font-extrabold leading-none text-kn-ink-0">
              {ring.solved}
            </span>
            <span className="font-mono text-[10px] font-semibold text-kn-ink-2 mt-0.5">
              of {ring.total}
            </span>
          </div>
        </div>
      </div>

      {/* per-difficulty bars */}
      <div className="flex flex-col gap-[11px] mt-5">
        {diffProgress.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-xs text-kn-ink-1 mb-1">
              <span className={`font-semibold ${DIFFICULTY_STYLE[d.label].dot}`}>{d.label}</span>
              <span className="font-mono text-[11px]">{d.text}</span>
            </div>
            <Progress value={d.pct} className={`${BAR_TRACK} ${BAR_INDICATOR[d.label]}`} />
          </div>
        ))}
      </div>

      {/* next badge */}
      <div className="mt-auto pt-4 border-t border-kn-border-0 flex items-center gap-2.5">
        <span className="text-base" aria-hidden>🏅</span>
        <span className="text-[13px] leading-snug text-kn-ink-1">
          <b className="text-kn-ink-0 font-bold">{NEXT_BADGE.remaining}</b> to go until your next
          badge — <b className="text-kn-current font-semibold">{NEXT_BADGE.name}</b>
        </span>
      </div>
    </Card>
  );
}
