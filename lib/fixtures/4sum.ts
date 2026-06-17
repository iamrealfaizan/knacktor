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

const SYNTAX_EXPLANATIONS: Record<number, string> = {
  1:  "def defines a new function. The name is four_sum. It takes two inputs: nums (a list of numbers) and target (a single number).",
  2:  "nums.sort() sorts the list in-place — it rearranges the numbers from smallest to largest, modifying nums directly.",
  3:  "len(nums) counts how many items are in the list and returns that number. We store it in n so we don't call len() repeatedly.",
  4:  "[] creates an empty list. We store it in res — this is where we'll collect our answers as we find them.",
  5:  "range(n - 3) produces the numbers 0, 1, 2 … up to n-4. The for loop runs once for each value, assigning it to i.",
  6:  "range(i + 1, n - 2) starts just after i and stops before n-2. This prevents j from overlapping with i or the two right pointers.",
  7:  "This is tuple unpacking — Python lets you assign two variables at once. lo gets j+1 and hi gets n-1 in a single line.",
  8:  "while runs its block repeatedly as long as the condition is True. lo < hi means the two pointers haven't crossed yet.",
  9:  "The + operator adds numbers together. We chain four of them to get the total of the four chosen elements.",
  10: "== checks if two values are exactly equal. if then decides whether to run the indented block below.",
  11: "[nums[i], nums[j], nums[lo], nums[hi]] builds a new list of four elements using square brackets.",
  12: "res.append(...) adds the item in parentheses to the end of the res list, growing it by one.",
  13: "+= 1 is shorthand for lo = lo + 1. It increases lo by one, moving the pointer one step to the right.",
  14: "-= 1 is shorthand for hi = hi - 1. It decreases hi by one, moving the pointer one step to the left.",
  15: "elif means 'else if' — it only runs if the previous if was False. It checks a second condition.",
  16: "+= 1 on lo again moves the left pointer right to try a larger number.",
  17: "else catches everything not matched by if or elif — no condition needed, it just runs as the final fallback.",
  18: "-= 1 on hi moves the right pointer left to try a smaller number.",
  19: "return hands the result back to whoever called the function. The function ends here.",
};

// ── Brute Force approach ──────────────────────────────────────────────────────

const BRUTE_SOURCE = `def four_sum(nums, target):
    nums.sort()
    n = len(nums)
    res = []
    for i in range(n - 3):
        for j in range(i + 1, n - 2):
            for k in range(j + 1, n - 1):
                for l in range(k + 1, n):
                    if nums[i]+nums[j]+nums[k]+nums[l] == target:
                        res.append([nums[i], nums[j], nums[k], nums[l]])
    return res`;

const BRUTE_LINE_EXPLANATIONS: Record<number, string> = {
  1:  "Define the function — same signature as the optimal approach.",
  2:  "Sort the array so we work on a predictable, ordered sequence.",
  3:  "Cache the array length.",
  4:  "Create an empty list to collect answers.",
  5:  "Fix i as the first element of the quadruplet.",
  6:  "Fix j as the second element, always after i.",
  7:  "Fix k as the third element, always after j.",
  8:  "Try every l after k as the fourth element — all C(n,4) combos.",
  9:  "Check if the four elements sum to target.",
  10: "They do — record this quadruplet.",
  11: "Return all collected quadruplets.",
};

const BRUTE_SYNTAX_EXPLANATIONS: Record<number, string> = {
  1:  "def defines a new function named four_sum. It receives nums (a list) and target (a number).",
  2:  "nums.sort() rearranges the list in-place from smallest to largest.",
  3:  "len(nums) returns the number of items. We store it in n to avoid calling len() in every loop.",
  4:  "[] is an empty list literal. res will grow as we find answers.",
  5:  "range(n - 3) generates 0, 1 … n-4. The for loop assigns each value to i in turn.",
  6:  "range(i+1, n-2) starts one position after i, stopping before the last two spots.",
  7:  "range(j+1, n-1) starts one after j, leaving room for l to come after k.",
  8:  "range(k+1, n) starts one after k and goes to the end — every possible fourth element.",
  9:  "The + operator sums four numbers. == compares the result to target; if true the block below runs.",
  10: "[nums[i], nums[j], nums[k], nums[l]] builds a 4-element list. res.append(...) adds it to res.",
  11: "return sends the completed res list back to the caller. The function ends here.",
};

export const FOURSUM_BRUTE_APPROACH: Approach = {
  id: "brute-force",
  name: "Brute Force",
  kind: "brute",
  summary: "Check every combination of four elements with four nested loops — O(n⁴).",
  complexity: { time: "O(n⁴)", space: "O(1)" },
  language: "python",
  source: BRUTE_SOURCE,
  lineExplanations: BRUTE_LINE_EXPLANATIONS,
  syntaxExplanations: BRUTE_SYNTAX_EXPLANATIONS,
  primaryPrimitive: "array",
  auxStructures: [],
};

// ── Optimal approach ──────────────────────────────────────────────────────────

export const FOURSUM_APPROACH: Approach = {
  id: "sort-two-pointers",
  name: "Sort + Two Pointers",
  kind: "optimal",
  summary: "Sort, fix two indices, then converge a pair from both ends — O(n³).",
  complexity: { time: "O(n³)", space: "O(1)" },
  language: "python",
  source: SOURCE,
  lineExplanations: LINE_EXPLANATIONS,
  syntaxExplanations: SYNTAX_EXPLANATIONS,
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
  approaches: [FOURSUM_BRUTE_APPROACH, FOURSUM_APPROACH],
  recommendedApproachId: FOURSUM_APPROACH.id,
  supportsCompare: false,
};
