"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepNarration } from "@/lib/trace";

export function Narration({
  narration,
  lineExplanation,
  open,
  onToggle,
}: {
  narration: StepNarration;
  lineExplanation: string;
  open: boolean;
  onToggle: () => void;
}) {
  if (!open) {
    return (
      <div className="flex-none border-t border-kn-border-0 bg-kn-surface-0 px-4 py-2.5 flex items-center gap-3">
        <span className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-kn-current text-white">
          ▸ HAPPENING
        </span>
        <span className="text-[13px] text-kn-ink-0 truncate flex-1">{narration.happening}</span>
        <Button size="icon" variant="ghost" onClick={onToggle} className="h-6 w-6 text-kn-ink-2 ml-auto" title="Expand narration">
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-none h-auto lg:h-[150px] border-t border-kn-border-0 bg-kn-surface-0 px-4 py-3 relative">
      {/* collapse is a desktop affordance — mobile keeps narration always open */}
      <Button size="icon" variant="ghost" onClick={onToggle} className="max-lg:hidden absolute top-2 right-3 h-6 w-6 text-kn-ink-2 z-10" title="Collapse narration">
        <ChevronDown className="h-4 w-4" />
      </Button>
      <div className="grid grid-cols-2 gap-x-4 lg:gap-x-7 gap-y-2.5 h-full">
        <Block label="▸ WHAT'S HAPPENING" labelColor="text-kn-current" body={narration.happening} bodyClass="text-kn-ink-0" />
        <Block label="✦ WHY IT MATTERS" labelColor="text-kn-result" body={narration.why} bodyClass="text-kn-ink-1" />
        <Block label="‹/› LINE EXPLANATION" labelColor="text-kn-compared" body={lineExplanation} bodyClass="text-kn-ink-1 font-mono text-[12.5px]" />
        <Block label="◎ INVARIANT" labelColor="text-kn-ink-2" body={narration.invariant} bodyClass="text-kn-ink-1" />
      </div>
    </div>
  );
}

function Block({
  label,
  labelColor,
  body,
  bodyClass,
}: {
  label: string;
  labelColor: string;
  body: string;
  bodyClass: string;
}) {
  return (
    <div className="min-w-0">
      <p className={`font-mono text-[9px] font-bold tracking-wider mb-1 ${labelColor}`}>{label}</p>
      <p className={`text-[13.5px] leading-snug ${bodyClass}`}>{body}</p>
    </div>
  );
}
