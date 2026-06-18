/**
 * Scaffold a new problem bundle so authoring is fill-in-the-blanks.
 *
 * Usage:
 *   npm run new-problem <slug> [approachId ...]
 * Examples:
 *   npm run new-problem two-sum                       # one "optimal" approach
 *   npm run new-problem two-sum brute-force optimal    # two approaches
 *
 * Creates seeds/problems/<slug>/ with every file pre-stubbed (problem.json,
 * presets.json, and per approach: solution.py, approach.json, mapping.json,
 * narration.json). Fill the REPLACE markers, then `npm run ingest`.
 * See ADDING_PROBLEMS.md §8 for the Definition-of-Done checklist (fill EVERY line).
 *
 * Refuses to overwrite an existing bundle.
 */
import fs from "fs";
import path from "path";

const [, , slug, ...approachArgs] = process.argv;
if (!slug) {
  console.error("usage: npm run new-problem <slug> [approachId ...]");
  process.exit(1);
}
const approaches = approachArgs.length ? approachArgs : ["optimal"];

const root = path.join(process.cwd(), "seeds", "problems", slug);
if (fs.existsSync(root)) {
  console.error(`✗ seeds/problems/${slug} already exists — pick a new slug or edit it directly.`);
  process.exit(1);
}

function write(rel: string, content: string) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log(`  + ${path.relative(process.cwd(), p)}`);
}

// ── problem.json ──────────────────────────────────────────────────────────────
write(
  "problem.json",
  JSON.stringify(
    {
      schemaVersion: "2.0",
      slug,
      number: 0,
      title: "REPLACE with the problem title",
      difficulty: "easy",
      topics: ["array"],
      patterns: ["two-pointers"],
      statement: "REPLACE with the FULL exact problem statement. Newlines are preserved.",
      hasVisualization: true,
      isPremium: false,
      supportsCustomInput: true,
      supportsCompare: approaches.length >= 2,
      recommendedApproachId: approaches[approaches.length - 1],
      inputConstraints: {
        fields: [
          { name: "nums", type: "int[]", label: "Array", placeholder: "1, 2, 3", min: -1000, max: 1000, minLen: 1, maxLen: 24 },
        ],
        maxSteps: 2000,
      },
    },
    null,
    2
  ) + "\n"
);

// ── presets.json (shared across approaches) ─────────────────────────────────────
write(
  "presets.json",
  JSON.stringify(
    [
      { id: "example-1", label: "Example 1", value: { nums: [1, 2, 3] }, isEdgeCase: false, expectedOutput: "REPLACE" },
      { id: "example-2", label: "Example 2", value: { nums: [3, 2, 1] }, isEdgeCase: false, expectedOutput: "REPLACE" },
      { id: "edge-1", label: "Edge case", value: { nums: [1] }, isEdgeCase: true, expectedOutput: "REPLACE" },
    ],
    null,
    2
  ) + "\n"
);

// ── per-approach files ──────────────────────────────────────────────────────────
const SOLUTION = `# The REAL Python solution — executed verbatim by the tracer.
# Line numbers are load-bearing: approach.json / mapping.json / narration.json key off them.
# Run \`python tracer/run.py seeds/problems/${slug} <approachId> example-1\` to see exact line numbers.
class Solution:
    def solve(self, nums):
        result = 0
        for x in nums:
            result += x
        return result
`;

const approachJson = (id: string, kind: string) =>
  JSON.stringify(
    {
      id,
      name: "REPLACE approach name",
      kind, // brute | optimal | alternative
      summary: "REPLACE one-line strategy description.",
      complexity: { time: "O(n)", space: "O(1)" },
      language: "python",
      entrypoint: "Solution.solve",
      primaryPrimitive: "array", // array | bar-container
      auxStructures: [],
      resultSpec: { varName: "result", label: "RESULT", render: "scalar" }, // scalar|list|tuple-list|boolean|string
      varColors: { x: "ptr-i" },
      // ⚠️ ONE entry PER LINE (algorithm meaning — shown in the narration LINE EXPLANATION panel):
      lineExplanations: {
        "5": "REPLACE — what this line does in the algorithm.",
        "6": "REPLACE",
        "7": "REPLACE",
        "8": "REPLACE",
      },
      // ⚠️ ONE entry PER CODE LINE 1..N (beginner syntax — shown on hover in the code panel):
      syntaxExplanations: {
        "1": "class Solution: the wrapper class.",
        "2": "def declares the method; self is the object, nums is the input.",
        "5": "REPLACE — explain the syntax of this line.",
        "6": "REPLACE",
        "7": "REPLACE",
        "8": "REPLACE",
      },
    },
    null,
    2
  ) + "\n";

const MAPPING = JSON.stringify(
  {
    primitive: "array",
    valuesFrom: "nums",
    pointers: [{ name: "x", var: "x" }],
    flags: {},
    cellStateRules: [
      { state: "current", when: "idx == x" },
      { state: "visited", when: "idx < x" },
      { state: "idle", when: "true" },
    ],
    readout: { when: "phase != 'return'", expr: "running total = {result}" },
    counters: [{ name: "ops", onLines: [8] }],
    phaseRules: [
      { phase: "init", lines: [5] },
      { phase: "loop", lines: [6] },
      { phase: "update", lines: [7] },
      { phase: "return", lines: [8] },
    ],
    keyEvents: [{ line: 8, label: "Final answer", kind: "return" }],
  },
  null,
  2
) + "\n";

const NARRATION = JSON.stringify(
  {
    byLine: {
      "5": { happening: "REPLACE — what just happened, with {placeholders}.", why: "REPLACE — why it matters.", invariant: "REPLACE — what is always true now." },
      "6": { happening: "REPLACE", why: "REPLACE", invariant: "REPLACE" },
      "7": { happening: "REPLACE", why: "REPLACE", invariant: "REPLACE" },
      "8": { happening: "REPLACE", why: "REPLACE", invariant: "REPLACE" },
    },
    byPhase: {
      init: { happening: "Set up.", why: "Prepare state.", invariant: "Setup." },
      loop: { happening: "Advance.", why: "Next element.", invariant: "Scanning." },
      update: { happening: "Update.", why: "Record progress.", invariant: "Changing." },
      return: { happening: "Return the result.", why: "Done.", invariant: "Complete." },
    },
  },
  null,
  2
) + "\n";

const kinds = approaches.length === 1 ? ["optimal"] : ["brute", ...Array(approaches.length - 1).fill("optimal")];
approaches.forEach((id, i) => {
  write(`approaches/${id}/solution.py`, SOLUTION);
  write(`approaches/${id}/approach.json`, approachJson(id, kinds[i] ?? "alternative"));
  write(`approaches/${id}/mapping.json`, MAPPING);
  write(`approaches/${id}/narration.json`, NARRATION);
});

console.log(`\n✓ Scaffolded seeds/problems/${slug} (${approaches.length} approach(es): ${approaches.join(", ")})`);
console.log("\nNext steps:");
console.log("  1. Fill every REPLACE in problem.json, presets.json, and each approach's 4 files.");
console.log("  2. Write the real solution.py; run `python tracer/run.py seeds/problems/" + slug + " " + approaches[0] + " example-1` to see line numbers.");
console.log("  3. Cover EVERY line in lineExplanations, syntaxExplanations, narration.byLine, and phaseRules (ADDING_PROBLEMS.md §8).");
console.log("  4. `npm run ingest`, fix any validator errors, then `npm run dev` and step through each approach.");
