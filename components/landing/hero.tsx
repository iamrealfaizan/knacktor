"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const NUMS = [1, 2, 4, 6, 8, 11];
const TARGET = 10;

interface Step {
  lo: number;
  hi: number;
  note: string;
  match?: boolean;
}
const STEPS: Step[] = [
  { lo: 0, hi: 5, note: "Pointers at both ends. Sum 1 + 11 = 12 overshoots the target." },
  { lo: 0, hi: 4, note: "Too big, so pull hi inward. Now 1 + 8 = 9 — just under." },
  { lo: 1, hi: 4, note: "Too small, push lo right. 2 + 8 = 10 — a matching pair!", match: true },
  { lo: 2, hi: 3, note: "Keep converging. 4 + 6 = 10 — a second pair found!", match: true },
  { lo: -1, hi: -1, note: "Pointers crossed. Every pair checked in a single linear sweep." },
];

const DOT_GRID: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

export function Hero() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIdx((s) => (s + 1) % STEPS.length), 1900);
    return () => clearInterval(id);
  }, [playing]);

  const step = STEPS[idx];
  const hasPair = step.lo >= 0 && step.hi >= 0;
  const sum = hasPair ? NUMS[step.lo] + NUMS[step.hi] : null;
  const sumText = hasPair ? `${NUMS[step.lo]} + ${NUMS[step.hi]} = ${sum}` : "search complete";
  const rel =
    sum === null ? "→ done" : sum === TARGET ? `= target ${TARGET}` : sum < TARGET ? `< target ${TARGET}` : `> target ${TARGET}`;
  const relColor =
    sum === null || sum === TARGET ? "text-kn-result" : sum < TARGET ? "text-kn-compared" : "text-kn-amber";

  return (
    <section className="relative overflow-hidden px-5 sm:px-7 pt-10 sm:pt-16 pb-12 sm:pb-14">
      <div className="max-w-[1240px] mx-auto grid lg:grid-cols-[1.04fr_1fr] gap-10 sm:gap-12 lg:gap-14 items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-kn-current bg-kn-current-subtle px-3 py-1.5 rounded-full">
            <Zap className="h-3.5 w-3.5" /> VISUAL DSA WORKSPACE
          </span>
          <h1 className="mt-5 text-5xl sm:text-6xl lg:text-[68px] font-extrabold leading-[1.02] tracking-tight text-kn-ink-0">
            DSA you
            <br />
            can{" "}
            <span className="relative text-kn-current">
              see
              <span className="absolute left-0 right-0 bottom-1.5 h-[11px] bg-kn-current-subtle -z-10 rounded-sm" />
            </span>
            .
          </h1>
          <p className="mt-5 max-w-[480px] text-lg leading-relaxed text-kn-ink-1">
            Stop imagining how code runs. Knacktor makes the algorithm{" "}
            <b className="font-semibold text-kn-ink-0">visibly execute</b> in front of you — real Python, animated
            data structures, live variables and complexity, all in sync.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-semibold text-white bg-kn-current px-6 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-[0_6px_20px_var(--kn-accent-soft)]"
            >
              <Play className="h-4 w-4" /> Get started free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-semibold text-kn-ink-0 bg-kn-surface-0 border border-kn-border-0 px-5 py-3.5 rounded-xl hover:bg-kn-surface-2 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-kn-ink-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-kn-result" /> Real execution, not fake animation
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-kn-compared" /> Beginner-first, interview-ready
            </span>
          </div>
        </div>

        {/* Live visualizer card */}
        <div className="relative">
          <div className="absolute -top-4 -left-4 right-7 bottom-7 rounded-2xl bg-kn-stage border border-kn-border-0 -rotate-2" />
          <div className="relative rounded-2xl bg-kn-surface-0 border border-kn-border-0 shadow-2xl overflow-hidden">
            {/* window chrome */}
            <div className="flex items-center gap-2 px-3.5 py-3 border-b border-kn-border-0 bg-kn-surface-1">
              <span className="w-1.5 h-1.5 rounded-full bg-kn-result" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.13em] text-kn-ink-2">
                TWO_SUM.PY · two pointers
              </span>
              <span className="ml-auto font-mono text-[9px] font-semibold tracking-[0.1em] text-kn-med-ink bg-kn-med-bg px-2 py-[3px] rounded-full">
                LIVE
              </span>
            </div>
            {/* stage */}
            <div className="relative overflow-x-hidden px-4 sm:px-5 pt-7 pb-5" style={DOT_GRID}>
              <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 mb-5">
                <span className="font-mono text-[13px] sm:text-sm font-semibold text-kn-ink-0 bg-kn-surface-0 border border-kn-border-0 rounded-lg px-3 py-1.5">
                  {sumText}
                </span>
                <span className={cn("font-mono text-[13px] sm:text-[15px] font-bold", relColor)}>{rel}</span>
              </div>
              <div className="flex justify-center gap-1.5 sm:gap-2.5">
                {NUMS.map((v, i) => {
                  const role = i === step.lo ? "lo" : i === step.hi ? "hi" : null;
                  const isMatch = !!step.match && role !== null;
                  const cellTone = isMatch
                    ? "border-kn-result bg-kn-result-subtle"
                    : role === "lo"
                      ? "border-kn-compared bg-kn-blue-soft"
                      : role === "hi"
                        ? "border-kn-amber bg-kn-amber-subtle"
                        : "border-kn-border-0 bg-kn-surface-0";
                  const pillTone = isMatch
                    ? "bg-kn-result"
                    : role === "lo"
                      ? "bg-kn-compared"
                      : "bg-kn-amber";
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "w-[clamp(34px,11vw,50px)] h-[clamp(34px,11vw,50px)] border-2 rounded-[10px] grid place-items-center font-mono text-base sm:text-lg font-semibold text-kn-ink-0 transition-all duration-300",
                          cellTone
                        )}
                        style={isMatch ? { animation: "kn-pulse 1s ease-out" } : undefined}
                      >
                        {v}
                      </div>
                      <div className="h-[22px]">
                        {role && (
                          <span className={cn("font-mono text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full", pillTone)}>
                            {role}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3.5 border border-kn-border-0 rounded-xl bg-kn-surface-1 px-3.5 py-3">
                <div className="font-mono text-[8.5px] font-bold tracking-[0.13em] text-kn-current">▸ WHAT&apos;S HAPPENING</div>
                <div className="text-[13.5px] leading-snug text-kn-ink-0 mt-1 min-h-[19px]">{step.note}</div>
              </div>
            </div>
            {/* mini dock */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 px-3 sm:px-4 py-3 border-t border-kn-border-0 bg-kn-surface-0">
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Play"}
                className="w-[34px] h-[34px] shrink-0 rounded-full bg-kn-current text-white grid place-items-center shadow-[0_3px_10px_var(--kn-accent-soft)] touch-manipulation"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <div className="flex-1 h-1.5 bg-kn-track rounded-full overflow-hidden">
                <div
                  className="h-full bg-kn-current transition-[width] duration-300"
                  style={{ width: `${Math.round((idx / (STEPS.length - 1)) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-[11px] sm:text-xs font-semibold text-kn-ink-0 whitespace-nowrap shrink-0">
                Step {idx + 1} / {STEPS.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
