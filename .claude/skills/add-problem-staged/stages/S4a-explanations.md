# S4a — Per-line explanations → extend `approach.json`

**Input:** frozen numbered solution + `executableLines` from the S2 trace.
**Output:** `lineExplanations` + `syntaxExplanations` added to `approach.json`.
**Gate:** completeness (checked again by `dry-run` at S4c).

This is the natural fan-out: line numbers are frozen, so every line's text can be written independently.

## lineExplanations — one entry per EXECUTABLE line

The algorithm-level "what this line does", shown in the narration panel. Cover **every executable line**
(the lines in `executableLines` from the trace). Exclude blank/comment lines, the bare `class`/`def`
headers, and bare `else:` (no bytecode). A missing executable line = blank readout.

```jsonc
"lineExplanations": {
  "3": "Create an empty hash map that will store each seen number and its index.",
  "7": "Compute the value needed from an earlier index to reach the target with the current number."
}
```

## syntaxExplanations — one entry for EVERY line `1..N`

The beginner syntax hover in the code panel — including line 1 (`class…`) and line 2 (`def…`). Cover
every source line `1..sourceLineCount` (from the trace). A missing line shows no tip.

```jsonc
"syntaxExplanations": {
  "1": "class Solution: defines the class wrapper the platform expects.",
  "2": "def twoSum(self, nums, target): defines the method receiving the array and the target.",
  "3": "num_map = {} creates an empty Python dictionary."
}
```

## Rules

- Write for a beginner seeing this algorithm for the first time. Specific, never generic, never `TODO`/`…`.
- `lineExplanations` is "what it does in the algorithm"; `syntaxExplanations` is "what this Python syntax
  means" — different jobs, fill both.
- Keys are strings of the real line numbers. Recount against the trace; do not guess.

## Gate

- Every line in `executableLines` has a `lineExplanations` key.
- Every line `1..sourceLineCount` has a `syntaxExplanations` key.

(The `dry-run` gate at S4c re-checks line-keyed completeness end-to-end.) Then proceed to S4b.
