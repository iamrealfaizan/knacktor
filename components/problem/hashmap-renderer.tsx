"use client";

// HashMap / HashSet renderer — per SimulationRules B-3 + C-3.
// Shape: a vertical column of M numbered bucket slots.
//        Each slot shows key:value (map) or just key (set).
// The hero animation is the key→bucket arc (drawn by CSS transition on the flying chip).
// Covers: Two Sum, group anagrams, frequency count, prefix sum + map, LRU cache.

import type { HashMapVisualState, CellState } from "@/lib/trace";

const BUCKET_W = 160;   // wider than A-3's 56px minimum to accommodate key:value text
const BUCKET_H = 40;    // per SimulationRules A-3: "Hash bucket | 56×40"
const BUCKET_GAP = 4;   // per SimulationRules A-3: "Hash bucket | 4px gap"
const BUCKET_R = 6;     // per SimulationRules A-3: "Hash bucket | 6px radius"
const NUM_W = 28;
const CONTENT_W = BUCKET_W - NUM_W - 8;

function bucketStyle(state: CellState): { fill: string; stroke: string; strokeWidth: number; opacity: number } {
  switch (state) {
    case "current":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-current)", strokeWidth: 2.5, opacity: 1 };
    case "compared":
      return { fill: "var(--kn-blue-soft)", stroke: "var(--kn-compared)", strokeWidth: 2, opacity: 1 };
    case "result":
      return { fill: "var(--kn-result-subtle)", stroke: "var(--kn-result)", strokeWidth: 2.5, opacity: 1 };
    case "special":
      return { fill: "var(--kn-current-subtle)", stroke: "var(--kn-special)", strokeWidth: 2.5, opacity: 1 };
    case "error":
      return { fill: "var(--kn-error-subtle)", stroke: "var(--kn-error)", strokeWidth: 2, opacity: 1 };
    case "visited":
      return { fill: "var(--kn-surface-1)", stroke: "var(--kn-border-0)", strokeWidth: 1.5, opacity: 0.75 };
    case "dimmed":
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-0)", strokeWidth: 1, opacity: 0.35 };
    case "idle":
    default:
      return { fill: "var(--kn-surface-0)", stroke: "var(--kn-border-1)", strokeWidth: 1.5, opacity: 1 };
  }
}

function truncate(s: string, max = 18): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function HashMapRenderer({ visual }: { visual: HashMapVisualState }) {
  const { entries, highlightedKey, label } = visual;
  const n = entries.length;
  const totalH = n * BUCKET_H + Math.max(0, n - 1) * BUCKET_GAP;

  return (
    <g transform={`translate(0, ${-totalH / 2})`}>
      {/* Header label */}
      <text
        x={BUCKET_W / 2}
        y={-22}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fontWeight={700}
        letterSpacing={1.5}
        fill="var(--kn-ink-2)"
      >
        {(label ?? "MAP").toUpperCase()}
      </text>

      {/* Flying key chip (highlighted key being inserted/looked up) */}
      {highlightedKey !== undefined && highlightedKey !== null && (
        <g
          transform={`translate(-80, ${-BUCKET_H - 8})`}
          style={{ transition: "transform 0.4s cubic-bezier(.34,1.2,.4,1)" }}
        >
          <rect
            x={-32}
            y={-14}
            width={64}
            height={28}
            rx={14}
            fill="var(--kn-special)"
            opacity={0.18}
            stroke="var(--kn-special)"
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono)"
            fontSize={13}
            fontWeight={700}
            fill="var(--kn-special)"
          >
            {truncate(String(highlightedKey), 10)}
          </text>
        </g>
      )}

      {n === 0 && (
        <text
          x={BUCKET_W / 2}
          y={BUCKET_H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
          fontSize={13}
          fill="var(--kn-ink-2)"
        >
          (empty)
        </text>
      )}

      {/* Buckets */}
      {entries.map((entry, i) => {
        const s = bucketStyle(entry.state);
        const y = i * (BUCKET_H + BUCKET_GAP);
        const isHighlighted = entry.key === highlightedKey;
        const keyStr = truncate(String(entry.key), 12);
        const valStr = entry.value !== null && entry.value !== undefined
          ? truncate(String(entry.value), 10)
          : null;

        return (
          <g
            key={i}
            transform={`translate(0, ${y})`}
            style={{ transition: "transform 0.3s ease", opacity: s.opacity }}
          >
            {/* Bucket row */}
            <rect
              x={0}
              y={0}
              width={BUCKET_W}
              height={BUCKET_H}
              rx={BUCKET_R}
              fill={s.fill}
              stroke={s.stroke}
              strokeWidth={s.strokeWidth}
              style={{ transition: "fill 0.18s ease, stroke 0.18s ease" }}
            />

            {/* Key highlight ring */}
            {isHighlighted && (
              <rect
                x={NUM_W}
                y={2}
                width={BUCKET_W - NUM_W - 2}
                height={BUCKET_H - 4}
                rx={BUCKET_R - 2}
                fill="none"
                stroke="var(--kn-special)"
                strokeWidth={1.5}
                opacity={0.5}
              />
            )}

            {/* Divider: number col | content col */}
            <line
              x1={NUM_W}
              y1={4}
              x2={NUM_W}
              y2={BUCKET_H - 4}
              stroke={s.stroke}
              strokeWidth={1}
              opacity={0.4}
            />

            {/* Row number */}
            <text
              x={NUM_W / 2}
              y={BUCKET_H / 2 + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--kn-ink-2)"
            >
              {i}
            </text>

            {/* Key */}
            <text
              x={NUM_W + 8}
              y={BUCKET_H / 2 + 1}
              dominantBaseline="middle"
              fontFamily="var(--font-mono)"
              fontSize={13}
              fontWeight={600}
              fill={isHighlighted ? "var(--kn-special)" : "var(--kn-ink-0)"}
            >
              {keyStr}
            </text>

            {/* Value (if map, not set) */}
            {valStr !== null && (
              <>
                <text
                  x={NUM_W + CONTENT_W / 2 + 10}
                  y={BUCKET_H / 2 + 1}
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={11}
                  fill="var(--kn-ink-2)"
                >
                  :
                </text>
                <text
                  x={NUM_W + CONTENT_W / 2 + 18}
                  y={BUCKET_H / 2 + 1}
                  dominantBaseline="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={13}
                  fontWeight={600}
                  fill="var(--kn-result)"
                >
                  {valStr}
                </text>
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
