"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tokenizeLine, SYNTAX_CLASS } from "@/lib/python-tokenize";
import type { Approach } from "@/lib/trace";

const TOOLTIP_W = 300;
const TOOLTIP_H = 90;

export function CodePanel({
  approach,
  currentLine,
  collapsed,
  onToggleCollapse,
  mobileExplanation,
}: {
  approach: Approach;
  currentLine: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** When set (mobile layout), a box below the code always shows the currently
   *  executing line's explanation — hover doesn't exist on touch. */
  mobileExplanation?: string;
}) {
  const lines = approach.source.split("\n");
  const [hover, setHover] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Track the active line by scrolling the internal code box only. scrollIntoView
  // would also scroll ancestor containers — on mobile that yanks the page's
  // scroll body every step, so we compute the delta against this box alone.
  useEffect(() => {
    const box = scrollRef.current;
    const row = activeRef.current;
    if (!box || !row) return;
    const boxRect = box.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const PAD = 8;
    let delta = 0;
    if (rowRect.top < boxRect.top + PAD) delta = rowRect.top - boxRect.top - PAD;
    else if (rowRect.bottom > boxRect.bottom - PAD) delta = rowRect.bottom - boxRect.bottom + PAD;
    if (delta !== 0) box.scrollTo({ top: box.scrollTop + delta, behavior: "smooth" });
  }, [currentLine]);

  function copy() {
    navigator.clipboard.writeText(approach.source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function handleLineMouseMove(e: React.MouseEvent, lineNo: number) {
    setHover(lineNo);
    setMousePos({ x: e.clientX, y: e.clientY });
  }

  function handleLineMouseLeave() {
    setHover(null);
    setMousePos(null);
  }

  // Compute tooltip position — flip left/up if near viewport edge
  const tooltipStyle = mousePos
    ? (() => {
        const x = mousePos.x + 18;
        const y = mousePos.y + 10;
        return {
          left: x + TOOLTIP_W > window.innerWidth ? mousePos.x - TOOLTIP_W - 10 : x,
          top: y + TOOLTIP_H > window.innerHeight ? mousePos.y - TOOLTIP_H - 10 : y,
        };
      })()
    : { left: 0, top: 0 };

  const showTooltip = hover !== null && !!(approach.syntaxExplanations?.[hover]) && mousePos !== null;

  if (collapsed) {
    return (
      <div className="h-full w-full bg-kn-surface-1 flex flex-col items-center pt-2">
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
          <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="h-6 w-6 text-kn-ink-2 max-lg:hidden" title="Collapse code">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* code body — capped on mobile so long files don't dominate the scroll body */}
      <div ref={scrollRef} className="flex-1 overflow-auto cs-scroll py-2.5 max-lg:max-h-[45dvh]">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const active = lineNo === currentLine;
          const tokens = tokenizeLine(line);
          return (
            <div
              key={lineNo}
              ref={active ? activeRef : undefined}
              onMouseMove={(e) => handleLineMouseMove(e, lineNo)}
              onMouseLeave={handleLineMouseLeave}
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
      </div>

      {/* mobile line explainer — always shows the executing line (no hover on touch) */}
      {mobileExplanation !== undefined && (
        <div className="lg:hidden flex-none mx-3 mb-3 rounded-lg border border-kn-border-0 bg-kn-surface-1 px-3 py-2.5">
          <p className="font-mono text-[8.5px] font-bold tracking-widest text-kn-current mb-1">
            ⌕ LINE {currentLine} · CURRENT
          </p>
          <p className="text-[12.5px] leading-snug text-kn-ink-1">{mobileExplanation}</p>
        </div>
      )}

      {/* floating line explainer — fixed to viewport, follows cursor (desktop hover only) */}
      {showTooltip && (
        <div
          className="max-lg:hidden fixed z-50 pointer-events-none rounded-lg border border-kn-compared bg-kn-surface-0 px-3 py-2.5 shadow-md"
          style={{ left: tooltipStyle.left, top: tooltipStyle.top, width: TOOLTIP_W }}
        >
          <p className="font-mono text-[8.5px] font-bold tracking-widest text-kn-compared mb-1">
            ⌕ LINE {hover} · SYNTAX
          </p>
          <p className="text-[12.5px] leading-snug text-kn-ink-1">
            {approach.syntaxExplanations?.[hover!]}
          </p>
        </div>
      )}
    </div>
  );
}
