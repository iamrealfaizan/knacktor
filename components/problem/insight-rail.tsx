"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Step, ResultSpec } from "@/lib/trace";
import { getMyNoteAction, saveNoteAction } from "@/app/actions/progress";

// Stable categorical palette built from existing design tokens (no inline hexes).
// A variable's color is its index in the per-trace ordered registry, so it stays
// constant for the whole run and never leaves a variable uncolored.
const PALETTE = [
  "var(--kn-ptr-i)",
  "var(--kn-ptr-j)",
  "var(--kn-ptr-lo)",
  "var(--kn-ptr-hi)",
  "var(--kn-special)",
  "var(--kn-result)",
  "var(--kn-amber)",
  "var(--kn-compared)",
  "var(--kn-current)",
];

function isPrimitive(v: unknown): boolean {
  return (
    v === null ||
    v === undefined ||
    typeof v === "number" ||
    typeof v === "string" ||
    typeof v === "boolean"
  );
}

function fmt(v: unknown): string {
  return v === null || v === undefined ? "∅" : String(v);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Exported sections — the desktop InsightRail composes them in its canonical
 * order; the mobile stacked layout (D14) recomposes them in the reference
 * order (variables → result → call stack → … → complexity → notes).
 * ──────────────────────────────────────────────────────────────────────────── */

export function VariablesSection({
  step,
  prevVars,
  idx,
  varOrder,
  varColors,
}: {
  step: Step;
  prevVars: Record<string, unknown>;
  idx: number;
  varOrder?: string[];
  varColors?: Record<string, string>;
}) {
  // Ordered, generic variable list: prefer the per-trace registry, fall back to
  // this step's own keys. Only scalar (primitive) vars render as chips — arrays /
  // objects belong to the RESULT panel or the stage, not the scalar row.
  const order = varOrder ?? Object.keys(step.vars);
  const seen = new Set<string>();
  const visibleVars = order.filter((name) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return name in step.vars && isPrimitive(step.vars[name]);
  });
  const colorFor = (name: string): string => {
    const pin = varColors?.[name];
    if (pin) return `var(--kn-${pin})`;
    const i = visibleVars.indexOf(name);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  };

  return (
    <Section title="VARIABLES" suffix="· flash on change">
      <div className="flex gap-1.5 flex-wrap">
        {visibleVars.length === 0 && (
          <span className="px-2 py-1 rounded-lg font-mono text-[12px] text-kn-ink-2 border border-dashed border-kn-border-1">…</span>
        )}
        {visibleVars.map((name) => {
          const changed = step.changedVars.includes(name);
          const born = !(name in prevVars); // creation pop-in vs population flash
          const color = colorFor(name);
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
              <b style={{ color }}>{fmt(val)}</b>
            </span>
          );
        })}
      </div>
    </Section>
  );
}

export function ComplexitySection({ complexity }: { complexity: { time: string; space: string } }) {
  return (
    <Section title="COMPLEXITY">
      <div className="flex flex-col gap-3.5">
        {/* TIME */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold tracking-widest text-kn-ink-2">TIME</span>
          <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border border-kn-border-0 bg-kn-inset text-kn-ink-0">
            {complexity.time}
          </span>
        </div>

        {/* SPACE */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold tracking-widest text-kn-ink-2">SPACE</span>
          <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border border-kn-border-0 bg-kn-inset text-kn-ink-0">
            {complexity.space}
          </span>
        </div>
      </div>
    </Section>
  );
}

/** Data-driven RESULT panel — renders nothing when the approach has no resultSpec. */
export function ResultSection({ step, resultSpec }: { step: Step; resultSpec?: ResultSpec }) {
  if (!resultSpec) return null;
  return (
    <Section title={resultSpec.label} suffix={resultSpec.suffix}>
      <ResultView value={step.vars[resultSpec.varName]} spec={resultSpec} />
    </Section>
  );
}

/** Call stack — renders nothing for non-recursive problems. */
export function CallStackSection({ step }: { step: Step }) {
  if (!step.callStack || step.callStack.length === 0) return null;
  return (
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
  );
}

export function NotesSection({
  slug,
  problemId,
  grow = true,
}: {
  slug: string;
  /** DB `_id` hex; when present (and signed in) notes persist to the account */
  problemId?: string;
  grow?: boolean;
}) {
  return (
    <Section title="NOTES" grow={grow}>
      <NotesArea slug={slug} problemId={problemId} />
    </Section>
  );
}

export function InsightRail({
  step,
  prevVars,
  idx,
  complexity,
  slug,
  problemId,
  collapsed,
  onToggleCollapse,
  varOrder,
  varColors,
  resultSpec,
}: {
  step: Step;
  prevVars: Record<string, unknown>;
  idx: number;
  complexity: { time: string; space: string };
  slug: string;
  /** DB `_id` hex; enables account-backed notes when signed in */
  problemId?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** per-trace ordered variable registry (first-seen order across all steps) */
  varOrder?: string[];
  /** optional varName -> token-key pin (e.g. { lp: "ptr-lo" }) */
  varColors?: Record<string, string>;
  /** data-driven RESULT panel spec for the active approach */
  resultSpec?: ResultSpec;
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

  return (
    <div className="h-full flex flex-col bg-kn-surface-0 overflow-y-auto cs-scroll">
      {/* header */}
      <div className="flex-none sticky top-0 z-10 flex items-center px-3 py-2.5 bg-kn-surface-1 border-b border-kn-border-0">
        <span className="font-mono text-[10px] font-bold tracking-widest text-kn-ink-2">INSIGHT RAIL</span>
        <Button size="icon" variant="ghost" onClick={onToggleCollapse} className="ml-auto h-6 w-6 text-kn-ink-2" title="Collapse rail">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <VariablesSection step={step} prevVars={prevVars} idx={idx} varOrder={varOrder} varColors={varColors} />
      <ComplexitySection complexity={complexity} />
      <ResultSection step={step} resultSpec={resultSpec} />
      <CallStackSection step={step} />
      <NotesSection slug={slug} problemId={problemId} />
    </div>
  );
}

function ResultView({ value, spec }: { value: unknown; spec: ResultSpec }) {
  const empty = (
    <span className="px-2 py-1 rounded-lg font-mono text-[12px] text-kn-ink-2 border border-dashed border-kn-border-1">
      {spec.emptyText ?? "…"}
    </span>
  );
  const chip = (key: string | number, text: string) => (
    <span
      key={key}
      className="kn-anim-pop-in px-2 py-1 rounded-lg font-mono text-[12px] font-semibold text-kn-ink-0"
      style={{ border: "1.5px solid var(--kn-result)", background: "var(--kn-result-subtle)" }}
    >
      {text}
    </span>
  );

  if (spec.render === "scalar" || spec.render === "string" || spec.render === "boolean") {
    if (value === null || value === undefined) return <div className="flex gap-1.5 flex-wrap">{empty}</div>;
    return <div className="flex gap-1.5 flex-wrap">{chip("v", String(value))}</div>;
  }

  const arr = Array.isArray(value) ? value : [];
  if (arr.length === 0) return <div className="flex gap-1.5 flex-wrap">{empty}</div>;

  return (
    <div className="flex gap-1.5 flex-wrap">
      {arr.map((item, k) =>
        spec.render === "tuple-list"
          ? chip(k, `[${(item as unknown[]).join(",")}]`)
          : chip(k, String(item))
      )}
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

/**
 * Notes are account-backed when signed in: the initial value hydrates from the
 * user's stored note (client-side, so the problem page stays static), writes are
 * debounced to a Server Action, and any pre-existing local note is migrated once
 * then the local key is cleared. Anonymous users keep the localStorage behavior.
 */
function NotesArea({ slug, problemId }: { slug: string; problemId?: string }) {
  const key = `kn_notes_${slug}`;
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs so the unmount/blur flush always sees the latest values (no stale closure).
  const anonRef = useRef(true);
  const latestRef = useRef("");
  const savedRef = useRef(""); // last value known to be persisted
  const loadedRef = useRef(false);

  // Persist the pending value immediately (used on blur + unmount + debounce).
  // Fire-and-forget: on SPA navigation the JS context survives, so the write
  // completes even after this component unmounts.
  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (anonRef.current || !problemId) return;
    if (latestRef.current === savedRef.current) return; // nothing new
    const toSave = latestRef.current;
    savedRef.current = toSave;
    void saveNoteAction(problemId, toSave);
  }, [problemId]);

  useEffect(() => {
    let alive = true;
    const local =
      typeof localStorage !== "undefined" ? localStorage.getItem(key) ?? "" : "";

    const apply = (v: string) => {
      if (!alive) return;
      setValue(v);
      latestRef.current = v;
      savedRef.current = v;
      loadedRef.current = true;
      setLoaded(true);
    };

    if (!problemId) {
      anonRef.current = true;
      apply(local);
      return;
    }

    getMyNoteAction(problemId)
      .then((res) => {
        if (!alive) return;
        anonRef.current = res.anon;
        if (res.anon) {
          apply(local);
        } else if (res.note) {
          apply(res.note);
        } else if (local) {
          // One-time migration: local note → account, then clear the local key.
          apply(local);
          savedRef.current = ""; // force the migration write below
          void saveNoteAction(problemId, local).then((r) => {
            if (r.ok) {
              savedRef.current = local;
              if (typeof localStorage !== "undefined") localStorage.removeItem(key);
            }
          });
        } else {
          apply("");
        }
      })
      .catch(() => apply(local));

    return () => {
      alive = false;
    };
  }, [key, problemId]);

  // Flush any pending edit when the notes panel unmounts (e.g. navigating away).
  useEffect(() => () => flush(), [flush]);

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setValue(v);
    latestRef.current = v;
    if (anonRef.current || !problemId) {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, v);
      savedRef.current = v;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }

  if (!loaded) {
    return <Skeleton className="flex-1 min-h-24 w-full rounded-md" />;
  }

  return (
    <Textarea
      value={value}
      onChange={onChange}
      onBlur={flush}
      placeholder="Jot your own intuition…"
      className="flex-1 min-h-24 resize-none bg-kn-inset border-kn-border-0 text-[13px] cs-scroll"
    />
  );
}
