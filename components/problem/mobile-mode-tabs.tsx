"use client";

import { cn } from "@/lib/utils";
import type { Mode } from "./problem-engine";

const MODES: Mode[] = ["Learn", "Focus", "Compare"];

/**
 * Slim mobile Learn/Focus/Compare segmented row (D14) — one-tap mode switching
 * below the top bar. The overflow sheet duplicates this control; both drive the
 * same engine state.
 */
export function MobileModeTabs({
  mode,
  setMode,
  supportsCompare,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  supportsCompare: boolean;
}) {
  return (
    <div className="flex-none px-3 py-1.5 border-b border-kn-border-0 bg-kn-surface-0">
      <div className="flex gap-0.5 bg-kn-inset border border-kn-border-0 rounded-lg p-0.5">
        {MODES.map((m) => {
          const disabled = m === "Compare" && !supportsCompare;
          const active = mode === m;
          return (
            <button
              key={m}
              disabled={disabled}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 min-h-9 rounded-md font-mono text-[11.5px] font-semibold transition-colors touch-manipulation select-none",
                active ? "bg-kn-ink-0 text-kn-surface-0" : "text-kn-ink-2",
                disabled && "opacity-30"
              )}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}
