// Custom renderer for Implement Queue using Stacks (two-stacks approach).
//
// Why generic rendering was insufficient (D17 — 2 of 3 criteria met):
// (a) Two stack primitives must coordinate simultaneously. The transfer only
//     teaches anything if you can watch an element LEAVE the inbox and ARRIVE on
//     the outbox in the same beat; two independent renderers cannot show that.
// (b) The spatial layout IS the teaching point. `auxMappings` auto-layout stacks a
//     vertical primary ABOVE a vertical aux, which hides the left→right reversal
//     that converts LIFO into FIFO — the single idea this problem exists to teach.
//     Side-by-side, with a labelled transfer arrow between them, is the only
//     honest presentation.
//
// Honors the SimulationRules cell-state vocabulary and B-5 stack rules (grows
// upward, all motion at the top) plus the Design.md token palette.

"use client";

import type { CustomVisualState } from "@/lib/trace";

// ── Types ────────────────────────────────────────────────────────────────────

type ResultValue = number | boolean | null;

interface QueueViaStacksVisual extends CustomVisualState {
  componentKey: "implement-queue-using-stacks";
  inStack: number[] | null;
  outStack: number[] | null;
  results: ResultValue[] | null;
  operations: string[] | null;
  values: number[] | null;
  opIndex: number | null;
  currentOp: string | null;
  moved: number | null;
  phase: string | null;
}

type ColorKey = "idle" | "current" | "result" | "compared" | "dimmed" | "special";

const COLORS: Record<ColorKey, { border: string; bg: string; text: string }> = {
  idle: { border: "var(--kn-border-0)", bg: "var(--kn-surface-0)", text: "var(--kn-ink-0)" },
  current: { border: "var(--kn-current)", bg: "var(--kn-current-subtle)", text: "var(--kn-current)" },
  result: { border: "var(--kn-result)", bg: "var(--kn-result-subtle)", text: "var(--kn-result)" },
  compared: { border: "var(--kn-compared)", bg: "var(--kn-blue-soft)", text: "var(--kn-compared)" },
  dimmed: { border: "var(--kn-border-0)", bg: "var(--kn-surface-0)", text: "var(--kn-ink-2)" },
  special: { border: "var(--kn-special)", bg: "var(--kn-special-subtle)", text: "var(--kn-special)" },
};

// Per Design.md: stack cell 88x40, 4px gap, radius 6, container 2px.
const CELL_W = 88;
const CELL_H = 40;
const CELL_GAP = 4;

// ── Atoms ────────────────────────────────────────────────────────────────────

function StackCell({
  value,
  colorKey,
  entering,
}: {
  value: number;
  colorKey: ColorKey;
  entering?: "from-left" | "pop-in" | null;
}) {
  const c = COLORS[colorKey];
  const animName =
    entering === "from-left" ? "iqus-slide-across" : entering === "pop-in" ? "iqus-drop-in" : undefined;

  return (
    <div
      className="flex items-center justify-center font-mono font-bold select-none"
      style={{
        width: CELL_W,
        height: CELL_H,
        borderRadius: 6,
        border: `2px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        fontSize: 16,
        fontVariantNumeric: "tabular-nums",
        opacity: colorKey === "dimmed" ? 0.45 : 1,
        transition: "border-color 150ms ease, background 150ms ease, color 150ms ease",
        animation: animName ? `${animName} 320ms cubic-bezier(.16,1,.3,1) both` : undefined,
      }}
    >
      {value}
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      className="flex items-center justify-center font-mono select-none"
      style={{
        width: CELL_W,
        height: CELL_H,
        borderRadius: 6,
        border: "1.5px dashed var(--kn-border-1)",
        color: "var(--kn-ink-2)",
        fontSize: 12,
        opacity: 0.55,
      }}
    >
      empty
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono uppercase block text-center"
      style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "var(--kn-ink-2)" }}
    >
      {children}
    </span>
  );
}

// ── Stack column (grows upward, per SimulationRules B-5) ─────────────────────

function StackColumn({
  label,
  sublabel,
  items,
  topColorKey,
  markTop,
  enterAnim,
}: {
  label: string;
  sublabel: string;
  items: number[];
  topColorKey: ColorKey;
  markTop: string | null;
  enterAnim: "from-left" | "pop-in";
}) {
  // items[last] is the TOP of the stack; render top-most first so it grows up.
  const topFirst = [...items].reverse();

  return (
    <div className="flex flex-col items-center" style={{ minWidth: CELL_W + 32 }}>
      <Caption>{label}</Caption>
      <div style={{ height: 6 }} />

      {/* top marker rail — reserves height so the columns never jump */}
      <div style={{ height: 18 }} className="flex items-end justify-center">
        {markTop && (
          <span
            className="font-mono"
            style={{ fontSize: 10, fontWeight: 700, color: "var(--kn-result)", letterSpacing: 0.5 }}
          >
            ▼ {markTop}
          </span>
        )}
      </div>

      {/* container: open top, closed sides + bottom */}
      <div
        className="flex flex-col items-center justify-end"
        style={{
          gap: CELL_GAP,
          padding: 8,
          paddingTop: 10,
          minHeight: CELL_H + 20,
          borderLeft: "2px solid var(--kn-border-1)",
          borderRight: "2px solid var(--kn-border-1)",
          borderBottom: "2px solid var(--kn-border-1)",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          background: "var(--kn-surface-1)",
        }}
      >
        {topFirst.length === 0 ? (
          <EmptySlot />
        ) : (
          topFirst.map((val, i) => {
            // i === 0 is the stack's top
            const isTop = i === 0;
            const key = `${items.length - 1 - i}`;
            return (
              <StackCell
                key={key}
                value={val}
                colorKey={isTop ? topColorKey : "idle"}
                entering={isTop ? enterAnim : null}
              />
            );
          })
        )}
      </div>

      <div style={{ height: 6 }} />
      <Caption>{sublabel}</Caption>
    </div>
  );
}

// ── Transfer arrow ───────────────────────────────────────────────────────────

function TransferArrow({ active, moved }: { active: boolean; moved: number }) {
  const color = active ? "var(--kn-amber)" : "var(--kn-border-1)";
  const ink = active ? "var(--kn-amber)" : "var(--kn-ink-2)";

  return (
    <div className="flex flex-col items-center justify-center" style={{ minWidth: 132, gap: 6 }}>
      <span
        className="font-mono uppercase text-center"
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: ink,
          opacity: active ? 1 : 0.6,
          transition: "color 150ms ease, opacity 150ms ease",
        }}
      >
        transfer
      </span>

      <svg width={120} height={26} viewBox="0 0 120 26" aria-hidden>
        <defs>
          <marker id="iqus-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={color} />
          </marker>
        </defs>
        <line
          x1={6}
          y1={13}
          x2={104}
          y2={13}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={active ? undefined : "5 4"}
          markerEnd="url(#iqus-arrow)"
          style={{ transition: "stroke 150ms ease" }}
        />
      </svg>

      <span
        className="font-mono text-center"
        style={{
          fontSize: 10,
          color: ink,
          opacity: active ? 1 : 0.6,
          lineHeight: 1.35,
          transition: "color 150ms ease, opacity 150ms ease",
        }}
      >
        reverses order
        <br />
        <span style={{ color: "var(--kn-ink-2)" }}>{moved} moved so far</span>
      </span>
    </div>
  );
}

// ── Operation tape ───────────────────────────────────────────────────────────

function OperationTape({
  operations,
  values,
  opIndex,
}: {
  operations: string[];
  values: number[];
  opIndex: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center" style={{ gap: 6 }}>
      {operations.map((op, i) => {
        const done = i < opIndex;
        const active = i === opIndex;
        const arg = op === "push" ? `(${values[i] ?? ""})` : "()";
        return (
          <div
            key={i}
            className="font-mono select-none"
            style={{
              padding: "4px 9px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              border: `1.5px solid ${active ? "var(--kn-current)" : "var(--kn-border-0)"}`,
              background: active ? "var(--kn-current-subtle)" : "var(--kn-surface-0)",
              color: active ? "var(--kn-current)" : done ? "var(--kn-ink-2)" : "var(--kn-ink-1)",
              opacity: done ? 0.5 : 1,
              transition: "all 150ms ease",
            }}
          >
            {op}
            {arg}
          </div>
        );
      })}
    </div>
  );
}

// ── Results rail ─────────────────────────────────────────────────────────────

function renderResult(v: ResultValue): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function ResultsRail({ results }: { results: ResultValue[] }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 6 }}>
      <Caption>results</Caption>
      <div className="flex flex-wrap items-center justify-center" style={{ gap: 5, minHeight: 26 }}>
        {results.length === 0 ? (
          <span className="font-mono" style={{ fontSize: 11, color: "var(--kn-ink-2)", opacity: 0.6 }}>
            nothing returned yet
          </span>
        ) : (
          results.map((v, i) => {
            const isNull = v === null || v === undefined;
            const isLast = i === results.length - 1;
            return (
              <div
                key={i}
                className="font-mono select-none"
                style={{
                  padding: "3px 8px",
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: isLast ? 700 : 500,
                  border: `1.5px solid ${isLast ? "var(--kn-result)" : "var(--kn-border-0)"}`,
                  background: isLast ? "var(--kn-result-subtle)" : "var(--kn-surface-0)",
                  color: isLast
                    ? "var(--kn-result)"
                    : isNull
                      ? "var(--kn-ink-2)"
                      : "var(--kn-ink-0)",
                  opacity: isNull && !isLast ? 0.55 : 1,
                  animation: isLast ? "iqus-drop-in 300ms cubic-bezier(.16,1,.3,1) both" : undefined,
                }}
              >
                {renderResult(v)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function ImplementQueueUsingStacksVisualizer({
  visual,
}: {
  visual: QueueViaStacksVisual;
}) {
  const inStack = visual.inStack ?? [];
  const outStack = visual.outStack ?? [];
  const results = visual.results ?? [];
  const operations = visual.operations ?? [];
  const values = visual.values ?? [];
  const opIndex = visual.opIndex ?? 0;
  const currentOp = visual.currentOp ?? "";
  const moved = visual.moved ?? 0;

  const needsFront = currentOp === "pop" || currentOp === "peek";
  // A transfer is genuinely in flight only while the inbox still has elements
  // to give AND the current operation is one that needs the front.
  const transferring = needsFront && inStack.length > 0;

  const inTopColor: ColorKey = currentOp === "push" ? "current" : transferring ? "compared" : "idle";
  const outTopColor: ColorKey = needsFront && outStack.length > 0 ? "result" : "idle";

  return (
    <div className="flex flex-col items-center w-full max-w-4xl px-6 py-4" style={{ gap: 18 }}>
      <style>{`
        @keyframes iqus-slide-across {
          from { opacity: 0; transform: translateX(-64px) scale(0.7); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes iqus-drop-in {
          from { opacity: 0; transform: translateY(-22px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <OperationTape operations={operations} values={values} opIndex={opIndex} />

      <div
        className="w-full"
        style={{ borderTop: "1px solid var(--kn-border-0)", opacity: 0.6 }}
      />

      {/* The two stacks, side by side — the reversal must read left → right. */}
      <div className="flex items-end justify-center w-full" style={{ gap: 4 }}>
        <StackColumn
          label="in · back of queue"
          sublabel="newest on top"
          items={inStack}
          topColorKey={inTopColor}
          markTop={null}
          enterAnim="pop-in"
        />

        <div style={{ paddingBottom: 34 }}>
          <TransferArrow active={transferring} moved={moved} />
        </div>

        <StackColumn
          label="out · front of queue"
          sublabel="oldest on top"
          items={outStack}
          topColorKey={outTopColor}
          markTop={outStack.length > 0 ? "front" : null}
          enterAnim="from-left"
        />
      </div>

      <div
        className="w-full"
        style={{ borderTop: "1px solid var(--kn-border-0)", opacity: 0.6 }}
      />

      <ResultsRail results={results} />
    </div>
  );
}
