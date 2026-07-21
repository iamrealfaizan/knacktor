/**
 * Renderer test harness for the custom (D17) visualizers.
 *
 * Generic renderers are exercised by every problem that uses them; a custom
 * component is used by exactly one problem, so nothing else catches a regression
 * in it. This script builds the REAL trace for every preset, then renders the
 * component at EVERY step and asserts structural invariants on the output.
 *
 *   npm run test-renderers            # all registered custom renderers
 *   npm run test-renderers <slug>     # just one
 *
 * Exits non-zero on the first failing assertion.
 */
import path from "path";
import fs from "fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildTrace } from "../lib/tracer/pipeline";
import type { Step, CustomVisualState } from "../lib/trace";

import MiddleOfTheLinkedListVisualizer from "../components/problem/custom/middle-of-the-linked-list-visualizer";
import ImplementQueueUsingStacksVisualizer from "../components/problem/custom/implement-queue-using-stacks-visualizer";
import MergeTwoSortedListsVisualizer from "../components/problem/custom/merge-two-sorted-lists-visualizer";

// ── Harness types ────────────────────────────────────────────────────────────

type Preset = { id: string; label: string; value: Record<string, unknown>; expectedOutput: unknown };

interface Case {
  slug: string;
  approachId: string;
  Component: React.ComponentType<{ visual: never }>;
  /** Per-step invariants. Throw (or return a string) to fail. */
  check: (ctx: {
    visual: Record<string, unknown>;
    markup: string;
    step: Step;
    stepIndex: number;
    lastStep: boolean;
    preset: Preset;
  }) => string | void;
}

// ── Assertion helpers ────────────────────────────────────────────────────────

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

const isIntArray = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((x) => typeof x === "number");

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ── Case definitions ─────────────────────────────────────────────────────────

const CASES: Case[] = [
  {
    slug: "middle-of-the-linked-list",
    approachId: "fast-slow-pointers",
    Component: MiddleOfTheLinkedListVisualizer as React.ComponentType<{ visual: never }>,
    check: ({ visual, markup, step, lastStep, preset }) => {
      const values = visual.values as number[] | null;
      const links = visual.links as number[] | null;
      const slow = visual.slow as number | null;
      const fast = visual.fast as number | null;
      const hops = (visual.hops as number | null) ?? 0;
      const n = (values ?? []).length;

      if (!markup.includes("<svg")) return "no <svg> root rendered";
      if (n === 0) return "values array is empty — the chain would render blank";

      // Every node must be drawn at every step (no empty-chain frames).
      const nodeCount = occurrences(markup, 'font-size="18"');
      if (nodeCount !== n) return `expected ${n} node value labels, found ${nodeCount}`;

      // Cursor bounds.
      if (slow !== null && (slow < 0 || slow >= n)) return `slow out of bounds: ${slow}`;
      if (fast !== null && fast !== -1 && (fast < 0 || fast >= n))
        return `fast out of bounds: ${fast}`;

      // Fast must never fall behind slow (it moves at 2x from the same start).
      if (slow !== null && fast !== null && fast >= 0 && fast < slow)
        return `fast (${fast}) is behind slow (${slow})`;

      // The 1:2 speed relationship is the whole algorithm. It holds exactly at
      // every ROUND BOUNDARY (the loop header, line 15); mid-round fast has
      // already moved while the counter has not, so only assert it there.
      if (step.lineNo === 15 && slow !== null && fast !== null && fast >= 0) {
        if (slow !== hops) return `slow travelled ${slow} but completed ${hops} rounds`;
        if (fast !== hops * 2) return `fast travelled ${fast} but should be ${hops * 2}`;
      }

      // Links must be a valid chain by the time traversal starts. (Between the
      // wiring loop ending and line 8 running, the tail still points at n —
      // that transient step is legitimate, so only assert once slow exists.)
      if (links && links.length === n && n > 0 && slow !== null) {
        if (links[n - 1] !== -1) return `tail link is ${links[n - 1]}, expected -1`;
        for (let k = 0; k < n - 1; k++) {
          if (links[k] !== k + 1) return `link[${k}] is ${links[k]}, expected ${k + 1}`;
        }
      }

      // Once the chain is wired the ∅ terminal must be on screen, so the tail's
      // next-arrow never dangles.
      if (links && links.length === n && n > 0 && !markup.includes("∅"))
        return "chain is wired but the null terminal is not rendered";

      // Arcs are revealed progressively: one per hop actually completed. Recompute
      // the expected count independently from the trace state and require the
      // markup to match exactly. This is the invariant the generic renderer
      // cannot satisfy and the whole reason this component exists.
      if (links && slow !== null && fast !== null) {
        const NONE = -2;
        const linkAt = (k: number | null) =>
          k !== null && k >= 0 && k < links.length ? links[k] : NONE;
        const fastFrom = visual.fastFrom as number | null;
        const slowFrom = visual.slowFrom as number | null;

        const fh1 = linkAt(fastFrom);
        const fh2 = fh1 >= 0 ? linkAt(fh1) : NONE;
        const expectFast = fast === fh2 ? 2 : fast === fh1 ? 1 : 0;
        const expectSlow = slow === linkAt(slowFrom) ? 1 : 0;

        const fastArcs = occurrences(markup, "url(#motl-fast-head)");
        const slowArcs = occurrences(markup, "url(#motl-slow-head)");
        if (fastArcs !== expectFast)
          return `expected ${expectFast} fast arc(s), found ${fastArcs}`;
        if (slowArcs !== expectSlow)
          return `expected ${expectSlow} slow arc(s), found ${slowArcs}`;

        // Whenever any arc is drawn, both lane captions must orient the learner.
        if (expectFast + expectSlow > 0) {
          if (!markup.includes("FAST · 2 HOPS")) return "fast lane caption missing";
          if (!markup.includes("SLOW · 1 HOP")) return "slow lane caption missing";
        }
      }

      // Across a full round, fast must complete exactly 2 hops to slow's 1.
      if (step.lineNo === 15 && hops > 0 && slow !== null) {
        if (!markup.includes("url(#motl-fast-head)")) return "no fast arc at a round boundary";
      }

      if (lastStep) {
        const result = visual.result as unknown;
        if (!deepEqual(result, preset.expectedOutput))
          return `final result ${JSON.stringify(result)} != expected ${JSON.stringify(preset.expectedOutput)}`;
        // The answer tail must be painted result-green.
        if (!markup.includes("var(--kn-result)")) return "no result-state node on the return step";
      }
    },
  },
  {
    slug: "implement-queue-using-stacks",
    approachId: "two-stacks",
    Component: ImplementQueueUsingStacksVisualizer as React.ComponentType<{ visual: never }>,
    check: ({ visual, markup, lastStep, preset }) => {
      const inStack = visual.inStack as number[] | null;
      const outStack = visual.outStack as number[] | null;
      const results = visual.results as unknown[] | null;
      const operations = visual.operations as string[] | null;
      const opIndex = (visual.opIndex as number | null) ?? 0;

      if (inStack !== null && !isIntArray(inStack)) return "inStack is not an int array";
      if (outStack !== null && !isIntArray(outStack)) return "outStack is not an int array";

      // Both stacks must always be on screen, even when empty (D19 rule).
      if (!markup.includes("in · back of queue")) return "IN stack column missing";
      if (!markup.includes("out · front of queue")) return "OUT stack column missing";
      if (!markup.includes("transfer")) return "transfer arrow missing";

      // Empty stacks must render an explicit placeholder, not collapse.
      if ((inStack ?? []).length === 0 && (outStack ?? []).length === 0) {
        if (occurrences(markup, ">empty<") < 2) return "empty stacks did not render placeholders";
      }

      // results can never outrun the operations consumed.
      if (results && operations) {
        if (results.length > operations.length)
          return `results (${results.length}) exceeds operations (${operations.length})`;
        if (opIndex > operations.length) return `opIndex ${opIndex} past end of tape`;
      }

      // The front of the queue is the TOP of out_stack — it must be marked.
      if ((outStack ?? []).length > 0 && !markup.includes("front"))
        return "loaded outbox is missing its front marker";

      if (lastStep) {
        if (!deepEqual(results, preset.expectedOutput))
          return `final results ${JSON.stringify(results)} != expected ${JSON.stringify(preset.expectedOutput)}`;
      }
    },
  },
  {
    slug: "merge-two-sorted-lists",
    approachId: "optimal-iterative",
    Component: MergeTwoSortedListsVisualizer as React.ComponentType<{ visual: never }>,
    check: ({ markup, visual, lastStep, preset }) => {
      if (!markup.includes("list1")) return "list1 chain missing";
      if (!markup.includes("list2")) return "list2 chain missing";
      if (!markup.includes("result")) return "result chain missing";
      if (lastStep) {
        const result = visual.result as unknown;
        if (!deepEqual(result, preset.expectedOutput))
          return `final result ${JSON.stringify(result)} != expected ${JSON.stringify(preset.expectedOutput)}`;
      }
    },
  },
];

// ── Runner ───────────────────────────────────────────────────────────────────

function runCase(c: Case): { pass: boolean; lines: string[] } {
  const bundleDir = path.join("seeds", "problems", c.slug);
  const lines: string[] = [];

  if (!fs.existsSync(bundleDir)) {
    return { pass: false, lines: [`  ✗ bundle not found: ${bundleDir}`] };
  }

  const presets: Preset[] = JSON.parse(
    fs.readFileSync(path.join(bundleDir, "presets.json"), "utf-8")
  );

  let allPass = true;
  let totalSteps = 0;

  for (const preset of presets) {
    let built;
    try {
      built = buildTrace(bundleDir, c.approachId, preset.id, preset.expectedOutput);
    } catch (e) {
      allPass = false;
      lines.push(`  ✗ ${preset.id}: trace failed — ${(e as Error).message}`);
      continue;
    }

    let presetPass = true;
    for (let i = 0; i < built.steps.length; i++) {
      const step = built.steps[i];
      const visual = step.visual as CustomVisualState;
      const lastStep = i === built.steps.length - 1;

      let markup = "";
      try {
        markup = renderToStaticMarkup(
          React.createElement(c.Component, { visual: visual as never })
        );
      } catch (e) {
        allPass = false;
        presetPass = false;
        lines.push(`  ✗ ${preset.id} step ${i} (line ${step.lineNo}): RENDER THREW — ${(e as Error).message}`);
        break;
      }

      if (markup.trim().length === 0) {
        allPass = false;
        presetPass = false;
        lines.push(`  ✗ ${preset.id} step ${i} (line ${step.lineNo}): rendered empty markup`);
        break;
      }

      let problem: string | void;
      try {
        problem = c.check({
          visual: visual as unknown as Record<string, unknown>,
          markup,
          step,
          stepIndex: i,
          lastStep,
          preset,
        });
      } catch (e) {
        problem = `check threw — ${(e as Error).message}`;
      }

      if (problem) {
        allPass = false;
        presetPass = false;
        lines.push(`  ✗ ${preset.id} step ${i} (line ${step.lineNo}): ${problem}`);
        break;
      }
      totalSteps++;
    }

    if (presetPass) {
      lines.push(`  ✓ ${preset.id.padEnd(30)} ${built.steps.length} steps rendered clean`);
    }
  }

  if (allPass) lines.push(`  → ${totalSteps} total step renders, all invariants held`);
  return { pass: allPass, lines };
}

function main(): number {
  const only = process.argv[2];
  const cases = only ? CASES.filter((c) => c.slug === only) : CASES;

  if (cases.length === 0) {
    console.error(`No custom renderer registered for "${only}".`);
    console.error(`Known: ${CASES.map((c) => c.slug).join(", ")}`);
    return 1;
  }

  let failed = 0;
  for (const c of cases) {
    console.log(`\n━━━ ${c.slug} (${c.approachId}) ━━━`);
    const { pass, lines } = runCase(c);
    lines.forEach((l) => console.log(l));
    if (!pass) failed++;
  }

  console.log("");
  if (failed > 0) {
    console.log(`✗ ${failed} custom renderer(s) failed`);
    return 1;
  }
  console.log(`✓ all ${cases.length} custom renderer(s) passed`);
  return 0;
}

process.exit(main());
