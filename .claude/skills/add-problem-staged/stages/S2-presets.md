# S2 — Presets → `presets.json` (the pivot: freezes line numbers)

**Input:** the frozen `solution.py` (all frozen approaches) + the statement.
**Output:** `authoring/<slug>/presets.json` with `expectedOutput` **filled from the trace, not by hand**.
**Gate:** `trace-approach` reports **0 coverage gap** for every approach; step counts ≤ maxSteps.

## Author the preset inputs (quality matters — see `rules/Authoring.md` §6.0)

- **At least 3**, at least one with `"isEdgeCase": true`.
- **Source LeetCode examples verbatim first** (Example 1, Example 2, …) — learners recognize them.
- **Each preset must teach something different**: a different branch taken, a different termination, a
  boundary. Before adding one, ask "what does the learner see here they couldn't in the others?" If
  "nothing", replace it.
- Do NOT add low-effort fillers (`[1]`, `[]`) unless that IS the instructive edge case for this problem.
- 🔴 Each preset's `value` keys MUST exactly match the solution method's parameter names.
- **Naming:** standard presets `id: "example-1"`, `label: "Example 1"`. Edge presets `id: "edge-<descriptor>"`,
  `label` a 2–4 word Title Case description (e.g. `"All duplicates"`, `"Negative values"`). Never `"Edge 1"`.

```jsonc
[
  { "id": "example-1", "label": "Example 1", "value": { "nums": [2,7,11,15], "target": 9 },
    "isEdgeCase": false, "expectedOutput": null },   // ← leave null; the gate fills it
  { "id": "edge-duplicates", "label": "Duplicate values", "value": { "nums": [3,3], "target": 6 },
    "isEdgeCase": true, "expectedOutput": null }
]
```

## Gate — run the tracer, then fill expectedOutput from reality

1. `npm run trace-approach -- authoring/<slug> <approachId>` for each approach.
2. For each preset, set `expectedOutput` to the reported **finalResult**.
   - ⚠️ **Author-written code (question-only mode) — verify, don't self-certify (D23).** Auto-filling
     `expectedOutput` from the trace makes a *wrong* solution certify itself. So for any solution **you**
     wrote, first compare the reported `finalResult` against the **independently known answer** (the
     LeetCode example's stated output, or the answer you compute by hand). They MUST match; if they
     don't, your solution is wrong — fix it (re-freeze at S1, re-approve Gate 1) before filling.
   - Both approaches must produce the **same** result for every shared preset (they're equivalent
     solutions to the same problem).
3. Read the **coverage verdict**: if it reports a gap (`line(s) no preset executes: …`), the presets don't
   exercise some branch — add/modify a preset that reaches that line, re-run. Repeat until 0 gap **for
   every approach** (a single preset need not hit every line; the union must).
4. Confirm each preset's step count ≤ `inputConstraints.maxSteps`.

> The `trace-approach` output also lists the exact **executable lines** and the **variable names** seen.
> Record `executableLines` per approach in state.json and keep the var list — S3/S4 author against these.

After 0-gap: set affected approaches `stage = "S3"`, save `presetsTracedAt` hash. **Line numbers are now
frozen** — S4 may proceed only after S3's primitive is approved.
