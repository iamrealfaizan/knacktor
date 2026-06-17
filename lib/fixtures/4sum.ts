/**
 * 4Sum pilot fixture (M1.4).
 *
 * The PLAYER consumes Trace/Step data. Until the M1.5 Python tracer exists, this
 * module generates a fully schema-correct trace by EXECUTING the sorted
 * two-pointer algorithm in TypeScript and emitting one Step per executed source
 * line (D8). Because the steps ARE the execution, they are internally
 * consistent by construction — a preview of what the real tracer will produce.
 *
 * When M1.5/M1.6 land, this is replaced by a MongoDB `traces` document; the
 * page code does not change.
 */
import type {
  Step,
  Trace,
  Approach,
  ProblemFull,
  CellState,
  ArrayVisualState,
} from "@/lib/trace";

const SOURCE = `def four_sum(nums, target):
    nums.sort()
    n = len(nums)
    res = []
    for i in range(n - 3):
        for j in range(i + 1, n - 2):
            lo, hi = j + 1, n - 1
            while lo < hi:
                s = nums[i] + nums[j] + nums[lo] + nums[hi]
                if s == target:
                    res.append([nums[i], nums[j], nums[lo], nums[hi]])
                    lo += 1
                    hi -= 1
                elif s < target:
                    lo += 1
                else:
                    hi -= 1
    return res`;

const LINE_EXPLANATIONS: Record<number, string> = {
  1: "Define the function taking the array and the target sum.",
  2: "Sort the array so converging pointers become valid.",
  3: "Cache the length n for the loop bounds.",
  4: "Create the result list — it starts empty (∅).",
  5: "Fix the first number with index i.",
  6: "Fix the second number with index j, after i.",
  7: "Place lo just after j and hi at the end — the converging pair.",
  8: "While the two inner pointers haven't crossed, keep searching.",
  9: "Compute the sum of the four currently selected numbers.",
  10: "Compare the sum against the target.",
  11: "Equal → record this quadruplet as an answer.",
  12: "Move lo inward to look for the next pair.",
  13: "Move hi inward as well.",
  14: "Sum too small → we need a bigger number.",
  15: "Move lo right to increase the sum.",
  16: "Otherwise the sum is too big.",
  17: "Move hi left to decrease the sum.",
  18: "Return every quadruplet found.",
};

type Quad = [number, number, number, number];

function buildTrace(nums: number[], target: number): {
  steps: Step[];
  finalResult: Quad[];
} {
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length;
  const res: Quad[] = [];
  const steps: Step[] = [];

  let comparisons = 0;
  let moves = 0;

  // mutable pointer positions for ghost tracking
  let iP = -1, jP = -1, loP = -1, hiP = -1, sVal: number | null = null;

  const counters = () => ({ comparisons, moves });

  function cellStates(opts: {
    matched?: number[];
  } = {}): Record<string, CellState> {
    const cs: Record<string, CellState> = {};
    for (let k = 0; k < n; k++) cs[k] = "idle";
    // dim the excluded inner search space (outside lo..hi, within j+1..n-1)
    if (jP >= 0 && loP >= 0 && hiP >= 0) {
      for (let k = jP + 1; k < n; k++) {
        if (k < loP || k > hiP) cs[k] = "dimmed";
      }
    }
    if (iP >= 0) cs[iP] = "special";
    if (jP >= 0) cs[jP] = "special";
    if (loP >= 0 && loP < n) cs[loP] = "compared";
    if (hiP >= 0 && hiP < n) cs[hiP] = "compared";
    for (const m of opts.matched ?? []) cs[m] = "result";
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
    const v: Record<string, unknown> = { target };
    if (n >= 0) v.n = n;
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
    const visual: ArrayVisualState = {
      type: "array",
      values: a,
      cellStates: cellStates({ matched: extra.matched }),
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

  // ── execute ───────────────────────────────────────────────────────────────
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
    jP = -1;
    loP = -1;
    hiP = -1;
  }
  iP = -1;

  push(18, "done", [], {
    happening: `Return ${res.length} quadruplet(s).`,
    why: "Every i/j pair has been checked with converging pointers.",
    invariant: "res contains all unique-by-position answers.",
  }, { op: "return res" });

  return { steps, finalResult: res };
}

const NUMS = [-2, -1, 0, 0, 1, 2];
const TARGET = 0;
const { steps, finalResult } = buildTrace(NUMS, TARGET);

export const FOURSUM_APPROACH: Approach = {
  id: "sort-two-pointers",
  name: "Sort + Two Pointers",
  kind: "optimal",
  summary: "Sort, fix two indices, then converge a pair from both ends — O(n³).",
  complexity: { time: "O(n³)", space: "O(1)" },
  complexityBudget: [
    { counter: "comparisons", label: "comparisons / n³" },
    { counter: "moves", label: "pointer moves / n²" },
  ],
  language: "python",
  source: SOURCE,
  lineExplanations: LINE_EXPLANATIONS,
  primaryPrimitive: "array",
  auxStructures: [],
};

export const FOURSUM_TRACE: Trace = {
  problemSlug: "4sum",
  approachId: FOURSUM_APPROACH.id,
  inputId: "example-1",
  steps,
  keyEventIndices: steps.filter((s) => s.isKeyEvent).map((s) => s.i),
  finalResult,
  traceVersion: "0.1.0",
};

export const FOURSUM_PROBLEM: ProblemFull = {
  slug: "4sum",
  number: 18,
  title: "4Sum",
  difficulty: "medium",
  topics: ["array", "two-pointers", "sorting"],
  patterns: ["two-pointers", "sorting"],
  statement:
    "Given an array nums of n integers and a target, return all unique quadruplets [a, b, c, d] such that they sum to target.",
  supportsCustomInput: true,
  presetInputs: [
    {
      id: "example-1",
      label: "Example 1 — has duplicates",
      value: { nums: NUMS, target: TARGET },
      isEdgeCase: false,
    },
  ],
  approaches: [FOURSUM_APPROACH],
  recommendedApproachId: FOURSUM_APPROACH.id,
  supportsCompare: false,
};
