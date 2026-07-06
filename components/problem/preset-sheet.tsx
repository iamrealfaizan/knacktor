"use client";

import { Pencil } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PresetInput } from "@/lib/trace";
import { formatInputPairs } from "./control-dock";

/**
 * Mobile input-example picker (D14): a bottom sheet listing the problem's
 * preset inputs, opened from the ControlDock's example chip. Replaces the
 * desktop preset dropdown below `lg`. Custom input stays visible as a
 * disabled "soon" row while CUSTOM_INPUT_ENABLED is off (D12).
 */
export function PresetSheet({
  open,
  onOpenChange,
  presets,
  activeInputId,
  customInputAvailable,
  customInputEnabled,
  onSelectPreset,
  onOpenCustom,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: PresetInput[];
  activeInputId: string;
  /** problem declares inputConstraints (custom input is conceptually possible) */
  customInputAvailable: boolean;
  /** D12 build flag — row is disabled ("soon") when false */
  customInputEnabled: boolean;
  onSelectPreset: (id: string) => void;
  onOpenCustom: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 p-0 pt-2">
        {/* grab handle */}
        <div className="flex justify-center py-1.5">
          <span className="w-9 h-1 rounded-full bg-kn-border-0" />
        </div>

        <SheetTitle className="px-4 pb-2 text-[10px] tracking-widest text-kn-ink-2">
          INPUT EXAMPLES
        </SheetTitle>

        {presets.map((p) => {
          const active = p.id === activeInputId;
          return (
            <button
              key={p.id}
              onClick={() => { onOpenChange(false); onSelectPreset(p.id); }}
              className={cn(
                "w-full min-h-11 text-left px-4 py-2.5 flex items-center gap-3 transition-colors touch-manipulation",
                active ? "bg-kn-current/10" : "hover:bg-kn-surface-1"
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 flex-none rounded-full border-2",
                  active
                    ? "border-kn-current bg-kn-current shadow-[inset_0_0_0_2.5px_var(--kn-surface-0)]"
                    : "border-kn-border-1"
                )}
              />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[13.5px] font-semibold", active ? "text-kn-current" : "text-kn-ink-0")}>
                  {p.label}
                </span>
                <span className="block font-mono text-[11px] text-kn-ink-2 truncate mt-0.5">
                  {formatInputPairs(p.value)}
                </span>
              </span>
              {p.isEdgeCase && (
                <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wide text-kn-amber border border-kn-amber/40 rounded px-1">
                  edge
                </span>
              )}
            </button>
          );
        })}

        {customInputAvailable && (
          <>
            <div className="h-px bg-kn-border-0 mx-4 my-1.5" />
            <button
              disabled={!customInputEnabled}
              onClick={() => {
                if (!customInputEnabled) return;
                onOpenChange(false);
                onOpenCustom();
              }}
              className={cn(
                "w-full min-h-11 text-left px-4 py-2.5 mb-1 flex items-center gap-3 transition-colors touch-manipulation",
                customInputEnabled ? "text-kn-ink-1 hover:bg-kn-surface-1" : "cursor-not-allowed"
              )}
            >
              <span className="w-6 h-6 flex-none rounded-md border border-dashed border-kn-border-1 grid place-items-center text-kn-ink-2">
                <Pencil className="h-3 w-3" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-kn-ink-1">Custom input</span>
                <span className="block font-mono text-[11px] text-kn-ink-2 mt-0.5">
                  enter your own values
                </span>
              </span>
              {!customInputEnabled && (
                <span className="ml-auto shrink-0 font-mono text-[9px] font-bold tracking-widest text-kn-ink-2 border border-kn-border-0 rounded px-1.5 py-0.5">
                  SOON
                </span>
              )}
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
