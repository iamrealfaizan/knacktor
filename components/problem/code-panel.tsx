"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tokenizeLine, SYNTAX_CLASS } from "@/lib/python-tokenize";
import type { Approach } from "@/lib/trace";

export function CodePanel({
  approach,
  approaches,
  onSelectApproach,
  currentLine,
  collapsed,
  onToggleCollapse,
}: {
  approach: Approach;
  approaches: Approach[];
  onSelectApproach: (id: string) => void;
  currentLine: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const lines = approach.source.split("\n");
  const [hover, setHover] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const activeRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll the active line into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentLine]);

  function copy() {
    navigator.clipboard.writeText(approach.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (collapsed) {
    return (
      <div className="h-full w-12 flex-none border-r border-kn-border-0 bg-kn-surface-1 flex flex-col items-center pt-2">
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="h-8 w-8 text-kn-ink-2" title="Expand code">
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
        <span className="mt-3 font-mono text-[10px] font-bold tracking-widest text-kn-ink-2 [writing-mode:vertical-rl] rotate-180">
          SOLUTION.PY
        </span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-kn-surface-0 min-w-0">
      {/* header strip */}
      <div className="flex-none flex items-center gap-2 px-3 py-2.5 border-b border-kn-border-0 bg-kn-surface-1">
        <span className="w-1.5 h-1.5 rounded-full bg-kn-result" />
        <span className="font-mono text-[10px] font-semibold tracking-widest text-kn-ink-2">SOLUTION.PY</span>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={copy} className="h-6 px-1.5 font-mono text-[11px] text-kn-ink-2 gap-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "copied" : "copy"}
          </Button>
          <Button size="icon" variant="outline" onClick={onToggleCollapse} className="h-6 w-6 border-kn-border-0" title="Collapse code">
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* approach tabs */}
      {approaches.length > 1 && (
        <div className="flex-none flex items-center h-9 border-b border-kn-border-0 bg-kn-surface-1">
          {approaches.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectApproach(a.id)}
              className={cn(
                "h-full px-3 text-xs border-r border-kn-border-0 transition-colors",
                a.id === approach.id
                  ? "bg-kn-current text-white font-semibold"
                  : "text-kn-ink-2 hover:text-kn-ink-0"
              )}
            >
              {a.name}
              {a.kind === "optimal" && <span className="ml-1 text-[10px] opacity-85">★</span>}
            </button>
          ))}
          <span className="ml-auto pr-3 font-mono text-[9px] font-bold tracking-widest text-kn-ink-2">APPROACH</span>
        </div>
      )}

      {/* code body */}
      <div className="flex-1 overflow-auto cs-scroll py-2.5">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const active = lineNo === currentLine;
          const tokens = tokenizeLine(line);
          return (
            <div
              key={lineNo}
              ref={active ? activeRef : undefined}
              onMouseEnter={() => setHover(lineNo)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "flex gap-2.5 items-baseline pr-3 py-px relative cursor-default",
                active && "bg-kn-accent-soft shadow-[inset_3px_0_0_var(--kn-current)]"
              )}
            >
              <span
                className={cn(
                  "w-9 flex-none text-right font-mono text-[11px] select-none",
                  active ? "font-bold text-kn-current" : "text-kn-ink-2 opacity-70"
                )}
              >
                {lineNo}
              </span>
              <code className="whitespace-pre font-mono text-[12.5px] leading-[1.7]">
                {tokens.map((t, j) => (
                  <span key={j} className={SYNTAX_CLASS[t.c]}>{t.t}</span>
                ))}
              </code>
            </div>
          );
        })}

        {/* hover-line explainer */}
        {hover !== null && approach.lineExplanations[hover] && (
          <div className="mx-2.5 mt-2.5 rounded-lg border border-kn-compared bg-kn-blue-soft px-3 py-2.5">
            <p className="font-mono text-[8.5px] font-bold tracking-widest text-kn-compared mb-1">
              ⌕ LINE {hover} · EXPLAIN
            </p>
            <p className="text-[12.5px] leading-snug text-kn-ink-1">
              {approach.lineExplanations[hover]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
