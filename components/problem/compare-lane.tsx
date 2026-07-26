"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Stage } from "./stage";
import type { Approach, Step } from "@/lib/trace";

function approachLabel(a: Approach): string {
  if (a.kind === "brute") return "Brute Force";
  if (a.kind === "optimal") return "Optimal";
  return a.name;
}

/**
 * One Compare lane (CompareAndResponsive.md §1.4): a stacked column of
 *   lane header (approach picker + inline complexity)
 *   → Stage (the animation — the lane's focus)
 *   → compact readout strip (current-line text + changed-var chips).
 *
 * No full code panel / insight rail — the per-lane readout carries the
 * code↔animation sync so the no-scroll budget is preserved. The approach
 * chosen in the OTHER lane is disabled in this picker (no comparing an
 * approach with itself).
 */
export function CompareLane({
  approach,
  approaches,
  otherApproachId,
  onSelectApproach,
  loading,
  step,
  inputId,
  target,
  mobile = false,
}: {
  approach: Approach;
  approaches: Approach[];
  otherApproachId: string | null;
  onSelectApproach: (id: string) => void;
  loading: boolean;
  /** current step for this lane; null while the lane's trace is still loading */
  step: Step | null;
  inputId: string;
  target: number;
  mobile?: boolean;
}) {
  const changed = step ? step.changedVars.filter((n) => n in step.vars) : [];
  const lineExpl = step ? approach.lineExplanations[step.codeKey] ?? "" : "";

  return (
    // Desktop: fill the column (two lanes share height, no scroll).
    // Mobile: natural height (flex-none) so the two lanes stack and the scroll
    // body scrolls — flex-1 here would squeeze the lanes and make the
    // fixed-height stage overflow into the readout on shorter screens.
    <div className={cn("flex flex-col min-w-0", mobile ? "flex-none" : "flex-1 min-h-0")}>
      {/* Lane header — approach picker + inline complexity.
          min-w-0 + a truncating label let the picker shrink first so a long
          approach name never overflows or overlaps the complexity chips on
          narrow phones; the chips stay shrink-0 (they're short + fixed). */}
      <div className="flex-none flex items-center gap-2 px-3 py-2 border-b border-kn-border-0 bg-kn-surface-0 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={approaches.length <= 1}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 min-w-0 max-w-full font-mono text-[11px] font-semibold rounded-md border border-kn-border-0 bg-kn-inset text-kn-ink-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-kn-surface-1 transition-colors"
          >
            <span className="truncate">{approachLabel(approach)}</span>
            {loading ? (
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
            ) : (
              <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="font-mono text-[12px] min-w-[160px]">
            {approaches.map((a) => {
              const isOther = a.id === otherApproachId;
              return (
                <DropdownMenuItem
                  key={a.id}
                  disabled={isOther}
                  onClick={() => { if (!isOther) onSelectApproach(a.id); }}
                  className="gap-2 cursor-pointer"
                >
                  <Check
                    className={cn("h-3 w-3 shrink-0", a.id === approach.id ? "opacity-100" : "opacity-0")}
                  />
                  <span>{approachLabel(a)}</span>
                  {isOther && <span className="ml-auto text-kn-ink-2 text-[10px]">other lane</span>}
                  {!isOther && a.kind === "optimal" && <span className="ml-auto text-kn-ink-2 text-[10px]">★</span>}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {approach.complexity && (
          <div className="flex gap-1.5 font-mono text-[10px] ml-auto shrink-0">
            <span className="rounded border border-kn-border-0 bg-kn-inset px-1.5 py-0.5 text-kn-ink-2 whitespace-nowrap">
              T <span className="font-bold text-kn-ink-0">{approach.complexity.time}</span>
            </span>
            <span className="rounded border border-kn-border-0 bg-kn-inset px-1.5 py-0.5 text-kn-ink-2 whitespace-nowrap">
              S <span className="font-bold text-kn-ink-0">{approach.complexity.space}</span>
            </span>
          </div>
        )}
      </div>

      {/* Stage — fixed clamp height on mobile, fills available space on desktop */}
      <div className={mobile ? "flex-none h-[clamp(11rem,30dvh,18rem)] flex flex-col" : "flex-1 min-h-0 flex flex-col"}>
        {step ? (
          <Stage
            key={`${approach.id}:${inputId}`}
            visual={step.visual}
            vars={step.vars}
            target={target}
            caption={`${approachLabel(approach)} · ${approach.primaryPrimitive}`}
          />
        ) : (
          <div className="flex-1 grid place-items-center text-kn-ink-2 font-mono text-[12px] gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            loading trace…
          </div>
        )}
      </div>

      {/* Readout strip — current line + changed-var chips (carries code↔sim sync) */}
      <div className="flex-none border-t border-kn-border-0 bg-kn-surface-0 px-3 py-2 min-h-[3.25rem]">
        {lineExpl && (
          <p className="text-[11.5px] leading-snug text-kn-ink-1 line-clamp-2">{lineExpl}</p>
        )}
        {changed.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {changed.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 font-mono text-[10.5px] rounded border border-kn-current/40 bg-kn-current/10 px-1.5 py-0.5 text-kn-ink-0"
              >
                <span className="text-kn-ink-2">{name}</span>
                <span className="font-semibold">{formatVar(step!.vars[name])}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatVar(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (Array.isArray(v)) {
    const s = `[${v.join(", ")}]`;
    return s.length > 24 ? `${s.slice(0, 23)}…]` : s;
  }
  if (typeof v === "object") {
    const s = JSON.stringify(v);
    return s.length > 24 ? `${s.slice(0, 23)}…` : s;
  }
  return String(v);
}
