/**
 * 4Sum pilot fixture (M1.4 / M1.5).
 *
 * Delegates trace generation to lib/tracers/4sum.ts (the canonical source).
 * This file only owns the problem definition (ProblemFull) and the pre-built
 * exports that the content-service uses as a fallback when MongoDB is not yet
 * seeded (local dev before first `npm run ingest`).
 */
import type { Trace, Approach, ProblemFull, InputConstraints } from "@/lib/trace";
import { buildTrace, MAX_ARRAY_LEN } from "@/lib/tracers/4sum";

// Re-export the tracer so callers can import from either location.
export { buildTrace } from "@/lib/tracers/4sum";

const NUMS = [-2, -1, 0, 0, 1, 2];
const TARGET = 0;

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

const FOURSUM_CONSTRAINTS: InputConstraints = {
  fields: [
    {
      name: "nums",
      type: "int[]",
      label: "Array (nums)",
      placeholder: "e.g. -2, -1, 0, 1, 2",
      min: -300,
      max: 300,
      minLen: 4,
      maxLen: MAX_ARRAY_LEN,
    },
    {
      name: "target",
      type: "int",
      label: "Target",
      placeholder: "e.g. 0",
      min: -1200,
      max: 1200,
    },
  ],
  maxSteps: 2000,
};

const { steps, finalResult } = buildTrace({ nums: NUMS, target: TARGET });

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
  inputConstraints: FOURSUM_CONSTRAINTS,
  presetInputs: [
    {
      id: "example-1",
      label: "Has duplicates",
      value: { nums: NUMS, target: TARGET },
      isEdgeCase: false,
    },
    {
      id: "example-2",
      label: "No solution",
      value: { nums: [1, 2, 3, 4], target: 100 },
      isEdgeCase: false,
    },
    {
      id: "example-3",
      label: "All zeros",
      value: { nums: [0, 0, 0, 0], target: 0 },
      isEdgeCase: true,
    },
  ],
  approaches: [FOURSUM_APPROACH],
  recommendedApproachId: FOURSUM_APPROACH.id,
  supportsCompare: false,
};
