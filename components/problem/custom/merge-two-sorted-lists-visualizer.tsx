// Custom renderer for Merge Two Sorted Lists (optimal-iterative approach).
// The generic linkedList renderer flattens all nodes into one horizontal chain —
// it cannot show three separate chains simultaneously, which is the core teaching
// point of this algorithm: list1 remaining (top-left), list2 remaining (top-right),
// and the growing merged result (bottom-center).
// A directional CSS entrance animation on each newly-spliced result node implies
// that the node flew in from its source chain.
// D17 criteria met: (a) 3 structures coordinate simultaneously, (b) spatial layout
// IS the teaching point — you must SEE which list a node comes from,
// (c) cross-chain node-fly arc animation cannot be expressed in the DSL.

"use client";

import type { CustomVisualState } from "@/lib/trace";

// ── Types ────────────────────────────────────────────────────────────────────

interface MergeSortedListsVisual extends CustomVisualState {
  componentKey: "merge-two-sorted-lists";
  list1Rem: number[] | null;
  list2Rem: number[] | null;
  result: number[] | null;
  spliceSource: string | null;
  spliceVal: number | null;
  phase: string | null;
}

// ── Color palette (SimulationRules.md CellState vocabulary) ──────────────────

const COLORS = {
  idle:     { border: "var(--kn-border-0)",  bg: "var(--kn-surface-0)", text: "var(--kn-ink)" },
  compared: { border: "#2E72C4",             bg: "#EEF4FC",             text: "#2E72C4" },
  current:  { border: "#C2603F",             bg: "#FBEFD3",             text: "#C2603F" },
  result:   { border: "#2F9E73",             bg: "#EBF7F2",             text: "#2F9E73" },
  visited:  { border: "#5B8DB8",             bg: "#EEF4FC",             text: "#566D8C" },
} as const;

type ColorKey = keyof typeof COLORS;

// ── Primitive components ─────────────────────────────────────────────────────

function NodeBox({
  val,
  colorKey,
  enterFrom,
}: {
  val: number;
  colorKey: ColorKey;
  enterFrom?: "list1" | "list2" | null;
}) {
  const c = COLORS[colorKey];
  const animName =
    enterFrom === "list1" ? "mts-enter-left"
    : enterFrom === "list2" ? "mts-enter-right"
    : enterFrom != null ? "mts-enter-pop"
    : undefined;

  return (
    <div
      className="flex items-center justify-center font-mono font-bold text-sm select-none"
      style={{
        width: 48,
        height: 40,
        borderRadius: 8,
        border: `2px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
        animation: animName ? `${animName} 350ms cubic-bezier(.16,1,.3,1) both` : undefined,
      }}
    >
      {val}
    </div>
  );
}

function Arrow() {
  return (
    <span
      className="text-kn-ink-2 select-none"
      style={{ fontSize: 16, margin: "0 4px", lineHeight: "40px", fontFamily: "monospace" }}
    >
      →
    </span>
  );
}

function NullPill() {
  return (
    <div
      className="flex items-center justify-center font-mono text-xs select-none"
      style={{
        width: 32,
        height: 40,
        borderRadius: 8,
        border: "1.5px solid var(--kn-border-0)",
        background: "var(--kn-surface-0)",
        color: "var(--kn-ink-2)",
        opacity: 0.45,
      }}
    >
      ∅
    </div>
  );
}

function ChainLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] font-bold tracking-widest uppercase text-kn-ink-2 mb-2 block"
    >
      {children}
    </span>
  );
}

// ── Chain rendering ───────────────────────────────────────────────────────────

function SourceChain({
  label,
  values,
  headColorKey,
}: {
  label: string;
  values: number[];
  headColorKey: ColorKey;
}) {
  return (
    <div className="flex flex-col items-start">
      <ChainLabel>{label}</ChainLabel>
      <div className="flex items-center">
        {values.map((val, idx) => (
          <span key={idx} className="flex items-center">
            <NodeBox val={val} colorKey={idx === 0 ? headColorKey : "idle"} />
            <Arrow />
          </span>
        ))}
        <NullPill />
      </div>
    </div>
  );
}

function ResultChain({
  values,
  spliceSource,
}: {
  values: number[];
  spliceSource: string | null;
}) {
  const src = spliceSource as "list1" | "list2" | null;

  return (
    <div className="flex flex-col items-center">
      <ChainLabel>result</ChainLabel>
      <div className="flex items-center">
        {/* dummy sentinel head */}
        <NullPill />
        {values.map((val, idx) => {
          const isLast = idx === values.length - 1;
          return (
            <span key={idx} className="flex items-center">
              <Arrow />
              <NodeBox
                val={val}
                colorKey={isLast ? "current" : "visited"}
                enterFrom={isLast ? src : null}
              />
            </span>
          );
        })}
        {values.length > 0 && (
          <>
            <Arrow />
            <NullPill />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MergeTwoSortedListsVisualizer({
  visual,
}: {
  visual: MergeSortedListsVisual;
}) {
  const list1 = visual.list1Rem ?? [];
  const list2 = visual.list2Rem ?? [];
  const result = visual.result ?? [];
  const phase = visual.phase ?? "";
  const spliceSource = visual.spliceSource;

  // During the comparison step (line 9), both heads flash compared-blue
  const headColorKey: ColorKey = phase === "check" ? "compared" : "idle";

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl px-8 py-4">
      {/* CSS keyframes for node entry animations */}
      <style>{`
        @keyframes mts-enter-left {
          from { opacity: 0; transform: translate(-50px, -28px) scale(0.6); }
          to   { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        @keyframes mts-enter-right {
          from { opacity: 0; transform: translate(50px, -28px) scale(0.6); }
          to   { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        @keyframes mts-enter-pop {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Top row: list1 (left) and list2 (right) */}
      <div className="flex items-start justify-around w-full gap-8">
        <SourceChain
          label="list1"
          values={list1}
          headColorKey={headColorKey}
        />
        <SourceChain
          label="list2"
          values={list2}
          headColorKey={headColorKey}
        />
      </div>

      {/* Divider */}
      <div className="w-full" style={{ borderTop: "1px solid var(--kn-border-0)", opacity: 0.5 }} />

      {/* Bottom: result chain */}
      <ResultChain values={result} spliceSource={spliceSource} />
    </div>
  );
}
