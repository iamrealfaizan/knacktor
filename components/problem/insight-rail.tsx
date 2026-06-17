"use client";

import { useEffect, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Step } from "@/lib/trace";

const VAR_COLOR: Record<string, string> = {
  i: "var(--kn-ptr-i)",
  j: "var(--kn-ptr-j)",
  lo: "var(--kn-ptr-lo)",
  hi: "var(--kn-ptr-hi)",
  s: "var(--kn-current)",
};
const SCALAR_ORDER = ["target", "n", "i", "j", "lo", "hi", "s"];

export function InsightRail({
  step,
  prevVars,
  idx,
  complexity,
  slug,
  collapsed,
  onToggleCollapse,
}: {
  step: Step;
  prevVars: Record<string, unknown>;
  idx: number;
  complexity: { time: string; space: string };
  slug: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  if (collapsed) {
    return (
      <div className="h-full w-12 flex-none bg-kn-surface-1 flex flex-col items-center pt-2">
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="h-8 w-8 text-kn-ink-2" title="Expand rail">
          <PanelRightOpen className="h-4 w-4" />
        </Button>
        <span className="mt-3 font-mono text-[10px] font-bold tracking-widest text-kn-ink-2 [writing-mode:vertical-rl] rotate-180">
          INSIGHT RAIL
        </span>
      </div>
    );
  }

  const results = (step.vars.res as unknown[]) ?? [];

  const n = (step.vars.n as number) || 1;

  // Derive theoretical budget from complexity notation + n
  function theoreticalBudget(notation: string): number {
    if (notation === "O(1)") return 1;
    if (/n[⁴^]?4|n⁴/.test(notation)) return Math.pow(n, 4);
    if (/n[³^]?3|n³/.test(notation)) return Math.pow(n, 3);
    if (/n[²^]?2|n²/.test(notation)) return Math.pow(n, 2);
    if (/n\s*log/.test(notation)) return Math.ceil(n * Math.log2(Math.max(n, 2)));
    if (/O\(n\)/.test(notation)) return n;
    return n;
  }

  // TIME: fall back to comparisons+moves for preset traces without timeOps
  const timeOps = step.counters.timeOps
    ?? ((step.counters.comparisons ?? 0) + (step.counters.moves ?? 0));
  const timeBudget = theoreticalBudget(complexity.time);
  const timePct = Math.min(100, (timeOps / timeBudget) * 100);

  const spaceUnits = step.counters.spaceUnits ?? 1;
  const spaceBudget = theoreticalBudget(complexity.space);
  const spacePct = Math.min(100, (spaceUnits / spaceBudget) * 100);

  return (
    <div className="h-full flex flex-col bg-kn-surface-0 overflow-y-auto cs-scroll">
      {/* header */}
      <div className="flex-none sticky top-0 z-10 flex items-center px-3 py-2.5 bg-kn-surface-1 border-b border-kn-border-0">
        <span className="font-mono text-[10px] font-bold tracking-widest text-kn-ink-2">INSIGHT RAIL</span>
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="ml-auto h-6 w-6 text-kn-ink-2" title="Collapse rail">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Variables */}
      <Section title="VARIABLES" suffix="· flash on change">
        <div className="flex gap-1.5 flex-wrap">
          {SCALAR_ORDER.filter((name) => name in step.vars).map((name) => {
            const changed = step.changedVars.includes(name);
            const born = !(name in prevVars); // creation pop-in vs population flash
            const color = VAR_COLOR[name] ?? "var(--kn-border-0)";
            const val = step.vars[name];
            return (
              <span
                key={`${name}-${changed || born ? idx : "x"}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-lg border bg-kn-surface-0 font-mono text-[13px] font-semibold text-kn-ink-0",
                  born ? "kn-anim-pop-in" : changed && "kn-anim-chip-flash"
                )}
                style={{ borderColor: color, borderWidth: 1.5 }}
              >
                {name}
                <b style={{ color }}>{val === null || val === undefined ? "∅" : String(val)}</b>
              </span>
            );
          })}
        </div>
      </Section>

      {/* Complexity */}
      <Section title="COMPLEXITY">
        <div className="flex flex-col gap-3.5">
          {/* TIME */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold tracking-widest text-kn-ink-2">TIME</span>
                <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border border-kn-border-0 bg-kn-inset text-kn-ink-0">
                  {complexity.time}
                </span>
              </div>
              <span className="font-mono text-[12px] text-kn-ink-1">
                {timeOps} / {timeBudget.toLocaleString()} ops
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-kn-track overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${timePct}%`, background: "var(--kn-current)" }}
              />
            </div>
          </div>

          {/* SPACE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-bold tracking-widest text-kn-ink-2">SPACE</span>
                <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border border-kn-border-0 bg-kn-inset text-kn-ink-0">
                  {complexity.space}
                </span>
              </div>
              <span className="font-mono text-[12px] text-kn-ink-1">
                {spaceUnits} / {spaceBudget.toLocaleString()} unit{spaceBudget !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-kn-track overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${spacePct}%`, background: "var(--kn-result)" }}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Result set */}
      <Section title="RESULT SET" suffix="· quadruplets found">
        <div className="flex gap-1.5 flex-wrap">
          {results.map((q, k) => (
            <span
              key={k}
              className="kn-anim-pop-in px-2 py-1 rounded-lg font-mono text-[12px] font-semibold text-kn-ink-0"
              style={{ border: "1.5px solid var(--kn-result)", background: "var(--kn-result-subtle)" }}
            >
              [{(q as number[]).join(",")}]
            </span>
          ))}
          {results.length === 0 && (
            <span className="px-2 py-1 rounded-lg font-mono text-[12px] text-kn-ink-2 border border-dashed border-kn-border-1">…</span>
          )}
        </div>
      </Section>

      {/* Call stack — only shown for recursive problems */}
      {step.callStack && step.callStack.length > 0 && (
        <Section title="CALL STACK">
          <div className="flex flex-col gap-1">
            {step.callStack.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "px-2 py-1 rounded-md font-mono text-[12px] border",
                  f.isCurrent ? "border-kn-current text-kn-ink-0 bg-kn-current-subtle" : "border-kn-border-0 text-kn-ink-1"
                )}
              >
                {f.label}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      <Section title="NOTES" suffix="· local" grow>
        <NotesArea slug={slug} />
      </Section>
    </div>
  );
}

function Section({
  title,
  suffix,
  children,
  grow,
}: {
  title: string;
  suffix?: string;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <section className={cn("px-3 py-3 border-b border-kn-border-0 last:border-b-0", grow && "flex-1 flex flex-col")}>
      <p className="font-mono text-[9px] font-bold tracking-widest text-kn-ink-2 mb-2">
        {title}
        {suffix && <span className="font-normal tracking-normal normal-case"> {suffix}</span>}
      </p>
      {children}
    </section>
  );
}

function NotesArea({ slug }: { slug: string }) {
  const key = `kn_notes_${slug}`;
  const [value, setValue] = useState("");
  useEffect(() => { setValue(localStorage.getItem(key) ?? ""); }, [key]);
  return (
    <Textarea
      value={value}
      onChange={(e) => { setValue(e.target.value); localStorage.setItem(key, e.target.value); }}
      placeholder="Jot your own intuition…"
      className="flex-1 min-h-24 resize-none bg-kn-inset border-kn-border-0 text-[13px] cs-scroll"
    />
  );
}
