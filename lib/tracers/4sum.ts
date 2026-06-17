/**
 * 4Sum tracer — executes the Sort + Two Pointers algorithm in TypeScript and
 * emits one Step per executed source line (D8), exactly as the real Python
 * tracer will.  Imported by:
 *   • scripts/ingest.ts  — to pre-compute preset traces stored in MongoDB
 *   • components/problem/problem-engine.tsx — to run custom input in-browser
 */
import type { Step, CellState, ArrayVisualState } from "@/lib/trace";

/** Hard cap: prevents Vercel timeout and huge JSON responses. */
export const MAX_STEPS = 2000;

/** Max array length exposed through inputConstraints. */
export const MAX_ARRAY_LEN = 8;

export interface FourSumInput {
  nums: number[];
  target: number;
}

type Quad = [number, number, number, number];

export function buildTrace(input: FourSumInput): {
  steps: Step[];
  finalResult: Quad[];
} {
  const { nums, target } = input;
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length;
  const res: Quad[] = [];
  const steps: Step[] = [];

  let comparisons = 0;
  let moves = 0;
  let iP = -1, jP = -1, loP = -1, hiP = -1, sVal: number | null = null;

  const counters = () => ({ comparisons, moves, timeOps: comparisons + moves, spaceUnits: 1 });

  function cellStates(matched: number[] = []): Record<string, CellState> {
    const cs: Record<string, CellState> = {};
    for (let k = 0; k < n; k++) cs[k] = "idle";
    if (jP >= 0 && loP >= 0 && hiP >= 0) {
      for (let k = jP + 1; k < n; k++) {
        if (k < loP || k > hiP) cs[k] = "dimmed";
      }
    }
    if (iP >= 0) cs[iP] = "special";
    if (jP >= 0) cs[jP] = "special";
    if (loP >= 0 && loP < n) cs[loP] = "compared";
    if (hiP >= 0 && hiP < n) cs[hiP] = "compared";
    for (const m of matched) cs[m] = "result";
    return cs;
  }

  function pointers() {
    const p: { name: string; at: number }[] = [];
    if (iP >= 0) p.push({ name: "i", at: iP });
    if (jP >= 0) p.push({ name: "j", at: jP });
    if (loP >= 0 && loP < n) p.push({ name: "lo", at: loP });
    if (hiP >= 0 && hiP < n) p.push({ name: "hi", at: hiP });
    return p;
  }

  function vars(): Record<string, unknown> {
    const v: Record<string, unknown> = { target, n };
    v.res = res.map((q) => [...q]);
    if (iP >= 0) v.i = iP;
    if (jP >= 0) v.j = jP;
    if (loP >= 0) v.lo = loP;
    if (hiP >= 0) v.hi = hiP;
    if (sVal !== null) v.s = sVal;
    return v;
  }

  function push(
    codeKey: number,
    phase: Step["phase"],
    changedVars: string[],
    narration: Step["narration"],
    extra: {
      op?: string;
      isKeyEvent?: boolean;
      matched?: number[];
      window?: { from: number; to: number };
      ghosts?: ArrayVisualState["ghosts"];
    } = {}
  ) {
    if (steps.length >= MAX_STEPS) {
      throw new Error(
        `Input too large — would exceed ${MAX_STEPS} steps. Use a shorter or simpler array.`
      );
    }
    const visual: ArrayVisualState = {
      type: "array",
      values: a,
      cellStates: cellStates(extra.matched),
      pointers: pointers(),
      window: extra.window,
      ghosts: extra.ghosts,
    };
    steps.push({
      i: steps.length,
      codeKey,
      phase,
      narration,
      vars: vars(),
      changedVars,
      counters: counters(),
      visual,
      op: extra.op,
      isKeyEvent: extra.isKeyEvent,
    });
  }

  // ── execute ────────────────────────────────────────────────────────────────

  push(2, "init", [], {
    happening: "The array is sorted ascending.",
    why: "Sorting lets two pointers converge correctly from both ends.",
    invariant: "From here on, nums is non-decreasing.",
  }, { op: "nums.sort()" });

  push(3, "init", ["n"], {
    happening: `n is set to ${n}.`,
    why: "We cache the length to bound the loops.",
    invariant: "n = len(nums).",
  }, { op: `n = ${n}` });

  push(4, "init", ["res"], {
    happening: "res is created, empty.",
    why: "It will collect every quadruplet that sums to the target.",
    invariant: "res holds all answers found so far.",
  }, { op: "res = []" });

  for (iP = 0; iP < n - 3; iP++) {
    push(5, "loop", ["i"], {
      happening: `Fix the first number nums[${iP}] = ${a[iP]}.`,
      why: "Every quadruplet must include exactly one first element.",
      invariant: `i is fixed at ${iP}.`,
    }, { op: `i = ${iP}` });

    for (jP = iP + 1; jP < n - 2; jP++) {
      push(6, "loop", ["j"], {
        happening: `Fix the second number nums[${jP}] = ${a[jP]}.`,
        why: "With i and j fixed, two pointers find the remaining pair.",
        invariant: `j is fixed at ${jP}, after i.`,
      }, { op: `j = ${jP}` });

      loP = jP + 1;
      hiP = n - 1;
      push(7, "update", ["lo", "hi"], {
        happening: `Set lo = ${loP} and hi = ${hiP}.`,
        why: "lo starts just after j; hi starts at the end.",
        invariant: "The answer pair, if any, lies between lo and hi.",
      }, { window: { from: loP, to: hiP } });

      while (loP < hiP) {
        push(8, "loop", [], {
          happening: `lo (${loP}) < hi (${hiP}) — keep searching.`,
          why: "The pointers haven't crossed, so a pair is still possible.",
          invariant: "The bright band between lo and hi is the live search space.",
        }, { window: { from: loP, to: hiP } });

        comparisons++;
        sVal = a[iP] + a[jP] + a[loP] + a[hiP];
        push(9, "check", ["s"], {
          happening: `sum = ${a[iP]} + ${a[jP]} + ${a[loP]} + ${a[hiP]} = ${sVal}.`,
          why: "Compare this sum against the target to decide the next move.",
          invariant: "s is the sum of the four currently selected numbers.",
        }, { op: `s = ${sVal}`, window: { from: loP, to: hiP } });

        if (sVal === target) {
          push(10, "check", [], {
            happening: `s (${sVal}) == target (${target}).`,
            why: "A match — record this quadruplet.",
            invariant: "Equality means these four numbers are an answer.",
          }, { isKeyEvent: true, window: { from: loP, to: hiP } });

          const quad: Quad = [a[iP], a[jP], a[loP], a[hiP]];
          res.push(quad);
          push(11, "update", ["res"], {
            happening: `Append [${quad.join(", ")}] to res.`,
            why: "This quadruplet sums to the target.",
            invariant: `res now has ${res.length} answer(s).`,
          }, {
            op: "res.append(...)",
            isKeyEvent: true,
            matched: [iP, jP, loP, hiP],
            window: { from: loP, to: hiP },
          });

          moves++;
          const fromLo = loP; loP++;
          push(12, "update", ["lo"], {
            happening: `Move lo inward: ${fromLo} → ${loP}.`,
            why: "Advance past this matched pair to find new ones.",
            invariant: "lo only ever moves right.",
          }, { op: "lo += 1", ghosts: [{ name: "lo", from: fromLo, to: loP }], window: { from: loP, to: hiP } });

          moves++;
          const fromHi = hiP; hiP--;
          push(13, "update", ["hi"], {
            happening: `Move hi inward: ${fromHi} → ${hiP}.`,
            why: "Shrink the window from the top too.",
            invariant: "hi only ever moves left.",
          }, { op: "hi -= 1", ghosts: [{ name: "hi", from: fromHi, to: hiP }], window: { from: loP, to: hiP } });
        } else if (sVal < target) {
          push(14, "check", [], {
            happening: `s (${sVal}) < target (${target}).`,
            why: "The sum is too small — we need a larger number.",
            invariant: "Sorted order means moving lo right increases the sum.",
          }, { window: { from: loP, to: hiP } });

          moves++;
          const fromLo = loP; loP++;
          push(15, "update", ["lo"], {
            happening: `Move lo right: ${fromLo} → ${loP}.`,
            why: "A larger lo value raises the sum toward the target.",
            invariant: "Excluded cells dim out — never deleted.",
          }, { op: "lo += 1", ghosts: [{ name: "lo", from: fromLo, to: loP }], window: { from: loP, to: hiP } });
        } else {
          push(16, "check", [], {
            happening: `s (${sVal}) > target (${target}).`,
            why: "The sum is too big — we need a smaller number.",
            invariant: "Moving hi left decreases the sum.",
          }, { window: { from: loP, to: hiP } });

          moves++;
          const fromHi = hiP; hiP--;
          push(17, "update", ["hi"], {
            happening: `Move hi left: ${fromHi} → ${hiP}.`,
            why: "A smaller hi value lowers the sum toward the target.",
            invariant: "Excluded cells dim out — never deleted.",
          }, { op: "hi -= 1", ghosts: [{ name: "hi", from: fromHi, to: hiP }], window: { from: loP, to: hiP } });
        }
      }
      sVal = null;
    }
    jP = -1; loP = -1; hiP = -1;
  }
  iP = -1;

  push(18, "done", [], {
    happening: `Return ${res.length} quadruplet(s).`,
    why: "Every i/j pair has been checked with converging pointers.",
    invariant: "res contains all unique-by-position answers.",
  }, { op: "return res" });

  return { steps, finalResult: res };
}

// ── Brute Force tracer (O(n⁴) — 4 nested loops) ──────────────────────────────

type BruteQuad = [number, number, number, number];

export function buildBruteForceTrace(input: FourSumInput): {
  steps: Step[];
  finalResult: BruteQuad[];
} {
  const { nums, target } = input;
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length;
  const res: BruteQuad[] = [];
  const steps: Step[] = [];
  let comparisons = 0;

  let iP = -1, jP = -1, kP = -1, lP = -1;

  function cellStates(matched: number[] = []): Record<string, CellState> {
    const cs: Record<string, CellState> = {};
    for (let idx = 0; idx < n; idx++) cs[idx] = "idle";
    if (iP >= 0) cs[iP] = "special";
    if (jP >= 0) cs[jP] = "special";
    if (kP >= 0 && kP < n) cs[kP] = "compared";
    if (lP >= 0 && lP < n) cs[lP] = "compared";
    for (const m of matched) cs[m] = "result";
    return cs;
  }

  function ptrs() {
    const p: { name: string; at: number }[] = [];
    if (iP >= 0) p.push({ name: "i", at: iP });
    if (jP >= 0) p.push({ name: "j", at: jP });
    if (kP >= 0 && kP < n) p.push({ name: "lo", at: kP });
    if (lP >= 0 && lP < n) p.push({ name: "hi", at: lP });
    return p;
  }

  function vars(): Record<string, unknown> {
    const v: Record<string, unknown> = { target, n };
    v.res = res.map((q) => [...q]);
    if (iP >= 0) v.i = iP;
    if (jP >= 0) v.j = jP;
    if (kP >= 0) v.lo = kP;
    if (lP >= 0) v.hi = lP;
    return v;
  }

  function push(
    codeKey: number,
    phase: Step["phase"],
    changedVars: string[],
    narration: Step["narration"],
    extra: { op?: string; isKeyEvent?: boolean; matched?: number[] } = {}
  ) {
    if (steps.length >= MAX_STEPS) {
      throw new Error(`Input too large — would exceed ${MAX_STEPS} steps.`);
    }
    const visual: ArrayVisualState = {
      type: "array",
      values: a,
      cellStates: cellStates(extra.matched),
      pointers: ptrs(),
    };
    steps.push({
      i: steps.length,
      codeKey,
      phase,
      narration,
      vars: vars(),
      changedVars,
      counters: { comparisons, timeOps: comparisons, spaceUnits: 1 },
      visual,
      op: extra.op,
      isKeyEvent: extra.isKeyEvent,
    });
  }

  // ── execute ────────────────────────────────────────────────────────────────

  push(2, "init", [], {
    happening: "Sort the array ascending.",
    why: "Sorted order helps skip duplicates later and makes the logic predictable.",
    invariant: "nums is non-decreasing from here on.",
  }, { op: "nums.sort()" });

  push(3, "init", ["n"], {
    happening: `n is set to ${n}.`,
    why: "Cache the length so the loop bounds are easy to read.",
    invariant: "n = len(nums).",
  }, { op: `n = ${n}` });

  push(4, "init", ["res"], {
    happening: "res created, empty.",
    why: "This list will collect every matching quadruplet.",
    invariant: "res holds all answers found so far.",
  }, { op: "res = []" });

  for (iP = 0; iP < n - 3; iP++) {
    push(5, "loop", ["i"], {
      happening: `i = ${iP}, nums[i] = ${a[iP]}.`,
      why: "Fix the first element of the quadruplet.",
      invariant: `i anchors the leftmost element.`,
    }, { op: `i = ${iP}` });

    for (jP = iP + 1; jP < n - 2; jP++) {
      push(6, "loop", ["j"], {
        happening: `j = ${jP}, nums[j] = ${a[jP]}.`,
        why: "Fix the second element, always after i.",
        invariant: `i < j at all times.`,
      }, { op: `j = ${jP}` });

      for (kP = jP + 1; kP < n - 1; kP++) {
        push(7, "loop", ["lo"], {
          happening: `k = ${kP}, nums[k] = ${a[kP]}.`,
          why: "Fix the third element, always after j.",
          invariant: `i < j < k at all times.`,
        }, { op: `k = ${kP}` });

        for (lP = kP + 1; lP < n; lP++) {
          push(8, "loop", ["hi"], {
            happening: `l = ${lP}, nums[l] = ${a[lP]}.`,
            why: "Try the fourth element — all combinations are checked.",
            invariant: `i < j < k < l at all times.`,
          }, { op: `l = ${lP}` });

          const s = a[iP] + a[jP] + a[kP] + a[lP];
          comparisons++;
          if (s === target) {
            push(9, "check", [], {
              happening: `${a[iP]}+${a[jP]}+${a[kP]}+${a[lP]} = ${s} == target.`,
              why: "All four sum to the target — this is a valid quadruplet.",
              invariant: "Equality means these four numbers are an answer.",
            }, { isKeyEvent: true, matched: [iP, jP, kP, lP] });

            const quad: BruteQuad = [a[iP], a[jP], a[kP], a[lP]];
            res.push(quad);
            push(10, "update", ["res"], {
              happening: `Append [${quad.join(", ")}] to res.`,
              why: "Record this quadruplet.",
              invariant: `res now has ${res.length} answer(s).`,
            }, { op: "res.append(...)", isKeyEvent: true, matched: [iP, jP, kP, lP] });
          } else {
            push(9, "check", [], {
              happening: `${a[iP]}+${a[jP]}+${a[kP]}+${a[lP]} = ${s} ≠ target (${target}).`,
              why: "No match — move on to the next combination.",
              invariant: "Only sums equal to target are recorded.",
            });
          }
        }
        lP = -1;
      }
      kP = -1;
    }
    jP = -1;
  }
  iP = -1;

  push(11, "done", [], {
    happening: `Return ${res.length} quadruplet(s).`,
    why: "Every combination of 4 indices has been checked.",
    invariant: "res contains all answers.",
  }, { op: "return res" });

  return { steps, finalResult: res };
}
