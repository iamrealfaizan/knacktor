# seeds/problems/ — Problem Authoring Guide

> Auto-loaded when Claude works on any file in this directory.
> **Canonical authority:** [rules/Authoring.md](../../rules/Authoring.md) (full template reference) and [rules/FidelityReview.md](../../rules/FidelityReview.md) (Gate 2 criteria).
> When in doubt, read the canonical doc and cite the section.

---

## Renderer Confirmation Rule (§5.1 of Rules.md — scaling rule)

**Before touching any seed file for a new problem**, the agent MUST:
1. Present a full renderer analysis to the user (see root CLAUDE.md Step 2 for the 5-part format: recommended renderer + unit-of-work match, DSL wiring walkthrough, D17 escape-hatch check, fidelity risk call-out, explicit question to user)
2. Wait for the user's explicit confirmation of the renderer choice
3. Only then proceed with authoring, tracing, and ingesting

This rule is non-negotiable. The renderer decision is the highest-leverage call in problem authoring — a wrong choice passes Gate 1 but fails Gate 2, wasting the full trace + narration effort. 30 seconds of confirmation upfront prevents hours of rework.

---

## Bundle Layout

One directory per problem under `seeds/problems/<slug>/`:

```
seeds/problems/<slug>/
  problem.json                   # metadata + statement + refs (BY SLUG) + flags + inputConstraints
  presets.json                   # ≥3 presets per approach, ≥1 edge case, each with expectedOutput
  approaches/<approachId>/
      solution.py                # REAL Python, executed verbatim (line numbers are load-bearing)
      approach.json              # id, name, kind, complexity, entrypoint, explanations, resultSpec
      mapping.json               # VisualMappingSpec — how real vars become the VisualState each step
      narration.json             # NarrationSpec — what to say per line/phase
      mapping.py                 # OPTIONAL — only when mapping.json primitive == "custom"
```

A pre-stubbed skeleton lives in `tracer/template/`. Copy it, fill it, run ingest.

Ingest is run via `npm run ingest`. It is **idempotent** (upsert by slug, skips unchanged bundles via `sourceContentHash`) and **aborts the whole run on any contract violation** — nothing partial is written.

---

## Allowed Taxonomy — pick ONLY from these exact slugs (never invent)

Inventing a slug makes ingest abort with a reference-resolution failure.

**difficulty** (exactly one):
`easy` · `medium` · `hard`

**topics** (1+):
`array` · `string` · `hash-map` · `hash-set` · `two-pointers` · `sorting` · `binary-search` · `sliding-window` · `linked-list` · `stack` · `queue` · `deque` · `heap` · `tree` · `binary-tree` · `bst` · `trie` · `graph` · `union-find` · `dynamic-programming` · `backtracking` · `greedy` · `bit-manipulation` · `math` · `interval` · `matrix`

**patterns** (1+):
`two-pointers` · `sliding-window` · `fast-slow-pointers` · `merge-intervals` · `cyclic-sort` · `in-place-reversal` · `bfs` · `dfs` · `two-heaps` · `subsets` · `modified-binary-search` · `top-k` · `k-way-merge` · `topological-sort` · `dynamic-programming` · `prefix-sum` · `monotonic-stack` · `sorting` · `hash-map` · `kadane` · `dutch-flag` · `expand-palindrome` · `floyd-cycle` · `dijkstra` · `greedy`

If no pattern fits well, pick the single closest one. Do NOT invent (e.g. never write `string-scanning`).

---

## problem.json

```jsonc
{
  "schemaVersion": "1.0",
  "slug": "container-with-most-water",      // URL identity; unique; kebab-case of title
  "number": 11,                              // LeetCode problem number
  "title": "Container With Most Water",
  "difficulty": "medium",                    // slug → difficulties._id (must exist)
  "topics": ["array", "two-pointers", "greedy"],   // slugs → topics._id (must ALL exist)
  "patterns": ["two-pointers"],              // slugs → patterns._id (must ALL exist)
  "statement": "Markdown of the FULL exact problem statement…",
  "hasVisualization": true,
  "isPremium": false,
  "supportsCustomInput": true,               // set false for string inputs (CUSTOM_INPUT_ENABLED deferred D12)
  "supportsCompare": true,                   // requires ≥2 approaches
  "recommendedApproachId": "two-pointers",
  "inputConstraints": {
    "fields": [
      { "name": "height", "type": "int[]", "label": "Heights",
        "placeholder": "1,8,6,2,5,4,8,3,7", "min": 0, "max": 10000, "minLen": 2, "maxLen": 24 }
    ],
    "maxSteps": 1000
  }
}
```

`inputConstraints.fields[].type` may only be `"int[]"` or `"int"`. If the input is not integer-based (e.g. strings), set `"supportsCustomInput": false`.

---

## presets.json

Shared across approaches — the tracer runs each approach against every preset.

```jsonc
[
  { "id": "example-1", "label": "Example 1",     "value": { "height": [1,8,6,2,5,4,8,3,7] }, "isEdgeCase": false, "expectedOutput": 49 },
  { "id": "edge-min",  "label": "Minimum length", "value": { "height": [1,1] },               "isEdgeCase": true,  "expectedOutput": 1 },
  { "id": "edge-flat", "label": "All equal",      "value": { "height": [4,4,4,4] },           "isEdgeCase": true,  "expectedOutput": 12 }
]
```

Rules:
- **≥3 presets** total; **≥1 with `isEdgeCase: true`** (the most instructive stress case for this algorithm — not a low-effort filler)
- **Source from LeetCode directly first.** Use the problem's own Example 1, Example 2, etc. verbatim. If LeetCode provides fewer than 3, extend with inputs of equivalent quality that a skilled interviewer would use.
- **Each preset must teach something different.** Before writing a preset ask: "what does the learner see in this simulation that they couldn't see in any other preset?" If the answer is "nothing new", replace it. A preset that exists only to satisfy the ≥3 count without exposing a distinct algorithm behavior is worse than nothing — it wastes the learner's time and dilutes quality.
- 🔴 **Do NOT invent low-effort fillers** such as `[1]`, `[1,2]`, `[]` unless those are genuinely the most instructive edge cases for *this specific* algorithm.
- `value` keys MUST exactly match the method parameter names in `solution.py`
- `expectedOutput` deep-compared to the traced `finalResult` — a mismatch aborts ingest (means the solution or the expected value is wrong)
- **Coverage:** the presets **together** must execute every line of every approach. For each branch, include at least one preset that takes the `if` and one that takes the `else`. Include a "found"/success case and a "not found"/empty case.
- `expectedOutput` for list answers is compared order-insensitively; for ordered answers keep the natural order.

---

## approaches/<id>/solution.py

The real solution, executed verbatim by the tracer. Line numbers are load-bearing.

```python
class Solution:                              # line 1
    def maxArea(self, height):               # line 2
        lp = 0                               # line 3
        rp = len(height) - 1                 # line 4
        mx = 0                               # line 5
        while lp < rp:                       # line 6
            h = min(height[lp], height[rp])  # line 7
            width = rp - lp                  # line 8
            area = h * width                 # line 9
            mx = max(mx, area)               # line 10
            if height[lp] < height[rp]:      # line 11
                lp += 1                      # line 12
            else:                            # line 13 (bare else: — no step emitted)
                rp -= 1                      # line 14
        return mx                            # line 15
```

Hard rules:
- One `class Solution` with the method named in `entrypoint` (`"Solution.<method>"`). The tracer calls `Solution().<method>(**preset.value)`.
- `preset.value` keys MUST exactly match the method parameter names.
- **One statement per line.** No `a; b`, no dense one-liners, no list/dict comprehensions that pack logic, no multi-line expressions. Use explicit loops and intermediate variables so each step is one clear action.
- Pure & deterministic: no `print`, no `input`, no file/network, no randomness, no time.
- Keep it readable and standard; assign loop-relevant values to named variables (so the mapping can reference them and pointers can point at them).
- **No Line Left Behind:** every executable line must execute under at least one preset. If a branch body never runs across all presets, add a preset that exercises it.

---

## approaches/<id>/approach.json

```jsonc
{
  "id": "two-pointers",
  "name": "Two Pointers",
  "kind": "optimal",                         // brute | optimal | alternative
  "summary": "Shrink from the wider side; the limiting wall is always the shorter one.",
  "complexity": { "time": "O(n)", "space": "O(1)" },
  "language": "python",
  "entrypoint": "Solution.maxArea",          // class.method; tracer calls this
  "primaryPrimitive": "bar-container",       // must match mapping.json primitive
  "auxStructures": [],
  "lineExplanations": {                      // LINE EXPLANATION narration panel — cover meaningful lines
    "3": "Start a pointer at the leftmost wall.",
    "6": "Keep going while the two walls haven't met.",
    "11": "The shorter wall limits the water; move it inward to search for a taller one."
  },
  "syntaxExplanations": {                    // hover tooltip in code panel for beginner syntax
    "1": "class Solution: defines a class — LeetCode's standard structure.",
    "2": "def maxArea(self, height): — self is the class instance; height is the input array.",
    "3": "lp = 0 — lp stands for 'left pointer', starting at the first element."
  },
  "visualizationIntent": "init: show the bar-container with lp at index 0, rp at last index. loop: highlight lp and rp bars as walls, show water fill between them. update: flash bars green when a new max area is found. return: show the final best area.",
  "resultSpec": {
    "varName": "mx", "label": "BEST AREA", "suffix": "· max water", "render": "scalar"
  },
  "varColors": { "lp": "ptr-lo", "rp": "ptr-hi" }   // pin rail colors to stage pointer lanes
}
```

Field rules:
- `kind`: provide **two approaches** (brute + optimal) by default; only one if the problem is genuinely single-solution. `recommendedApproachId` = the optimal one. Both must return the correct `expectedOutput` for every preset.
- `lineExplanations`: one entry for every **meaningful** executable line (the algorithm-level "what this line does" shown in the narration panel). A missing line shows a blank readout.
- `syntaxExplanations`: one entry for **every code line 1..N**, including line 1 (`class…`) and line 2 (`def…`). A missing line shows no hover tip.
- `visualizationIntent`: required. Plain-English description of what the visualization should show at each phase, written as `<phase>: <description>` segments. Used by Claude Code during add-problem workflow (D18) to validate the mapping.json matches the intent. Not rendered to users.
- `resultSpec.render`: `scalar` (one value), `string`, `boolean`, `list` (chip per primitive), `tuple-list` (each item is `number[]`). `varName` must be a real variable holding the answer.
- `varColors` values are design-token keys only (never hex): `ptr-i`, `ptr-j`, `ptr-lo`, `ptr-hi`, `special`, `result`, `amber`, `compared`, `current`, `error`, `gold`.

---

## approaches/<id>/mapping.json — Visual-Mapping DSL

See `lib/tracer/CLAUDE.md` for the full DSL reference (all fields, expression grammar, phase rules, forbidden expressions, common pitfalls).

Quick mandatory checklist for mapping.json:
- [ ] `primitive` is one of the 10 allowed values (never invented)
- [ ] Every pointer `var` is a **real** variable in the solution that holds an integer index
- [ ] `cellStateRules` / `nodeStateRules` / `highlightRules` end with an `idle` catch-all (`"when": "true"`)
- [ ] Every `state` value is in the CellState vocabulary
- [ ] `phaseRules` has an entry for every executable line
- [ ] `keyEvents` marks at least one meaningful moment (match / new-best / return)
- [ ] If a secondary structure is needed (stack, queue, hashmap, result array), add an `auxMappings` entry — don't represent it only via a `readout` text chip
- [ ] `idx` (not the solution's loop var `i`) is used for cell index in `cellStateRules`
- [ ] No DSL expressions contain slices (`a[i:j]`), `and`/`or`/`not`, `.method()` calls, or invented variable names
- [ ] All `flags` expressions do NOT use `idx` (flags run before cell evaluation)

---

## approaches/<id>/narration.json

See `lib/tracer/CLAUDE.md` for the full narration spec. Quick rules:

- Every executable line MUST have a specific `byLine` entry — a missing `byLine` is a validation error (ingest fails)
- All three fields (`happening`, `why`, `invariant`) must be non-empty and specific — no `TODO`, `…`, or `step N`
- For branch lines, use an array of variants: `[{ "when": expr, ... }, { ... }]` — last variant has no `when` (fallback)
- `byPhase` is the structural fallback but is no longer sufficient alone — ingest enforces `byLine` completeness
- `{var}` placeholders use the DSL — same restrictions as `cellStateRules.when`
- ⚠️ Timing: a step fires BEFORE the line runs. `x = f()` step still shows `x`'s OLD value. New value appears on next step. Write narration as "about to assign…" where relevant.

---

## Gate 1 — Ingest Validation Checklist

Run `npm run ingest` to trigger Gate 1. It aborts on the **first** failure and names the exact issue. Fix → re-run.

| Check | What it validates |
|---|---|
| Bundle shape | All files present, parse cleanly, schema-valid |
| Reference resolution | Every topic/pattern/difficulty slug resolves to an existing `_id` |
| Preset coverage | ≥3 presets, ≥1 isEdgeCase, every preset has expectedOutput |
| Mapping DSL | Every expression parses; no forbidden syntax; cellState vocabulary; primitive known |
| Trace gen + No-Line-Left-Behind | Every executable line emits ≥1 step across preset set |
| codeKey integrity | Every step lineNo is a real executable line |
| Narration completeness | Every executed line has a specific byLine entry; no empty/sentinel fields |
| VisualState validity | Every visual passes the discriminated-union shape + CellState vocabulary |
| Expected-output match | traced finalResult deep-equals each preset's expectedOutput |
| Step cap | stepCount ≤ inputConstraints.maxSteps |

**Passing Gate 1 is necessary but NOT sufficient.** Gate 2 (fidelity review) is also required.

---

## Gate 2 — Simulation Fidelity Review (rules/FidelityReview.md)

Gate 2 is a **semantic judgment** — does the animation truly represent the algorithm? Run after Gate 1 passes.

**Core principle — "unit of work":**
The visual's unit of work must equal the algorithm's unit of work — the smallest thing the algorithm repeatedly *does* must be the thing the animation makes visible and central.

| If the algorithm's core operation is… | the visual MUST show… |
|---|---|
| comparing two array elements | those two elements, highlighted, in the array |
| comparing characters at a column | the **characters** (char row / grid), not whole strings |
| moving a pointer / shrinking a window | the pointer move / the window boundary changing |
| pushing/popping a stack | the stack growing/shrinking |
| visiting a node / edge | that node/edge lighting up in the structure |
| filling a DP cell from neighbors | the cell + the source cells it reads |

**Fidelity criteria (ALL must hold for PASS):**
1. Right primitive: chosen `primitive` matches the structure the algorithm actually manipulates, and its cells represent the algorithm's unit of work
2. Operations are visible: each meaningful step produces a visible change depicting that step's operation
3. Pointers are real cursors: every pointer corresponds to an actual algorithm cursor; moves when (and only when) the code moves it
4. Cell-states are semantically honest: `current`/`compared`/`result`/`visited`/`dimmed`/… mark the right elements at the right moments; no element is colored for decoration
5. Readout & result reflect true state: stage readout/result panel shows the algorithm's real running values (not stale or cosmetic)
6. Narration matches the moment: `happening`/`why`/`invariant` describe the same operation the highlighted line and visual show
7. Motion explains: glides/ghosts/flashes correspond to real value/pointer movement; nothing moves that didn't change
8. Key events are meaningful: diamonds land on real algorithmic milestones (match, new best, boundary, return) — not arbitrary steps
9. Both approaches are faithful (brute and optimal, each on its own terms)
10. An edge case still reads correctly (empty/single/no-solution doesn't produce a confusing or empty-looking stage)

**Verdicts:**
- **PASS** — all criteria hold; accept the problem
- **REVISE** — the primitive is right but mapping/narration misrepresents something; return specific findings (which step, which field, what's wrong, the fix). Author edits and re-submits both gates.
- **DEFER** — the algorithm's unit of work cannot be shown by the existing primitives. Do NOT ship. Record what renderer is needed so it can be built as a one-time engine task. The problem is authored after that renderer exists.

**Reviewer output format:**
```
FIDELITY REVIEW — <slug>
Unit of work: <one sentence>
Verdict: PASS | REVISE | DEFER
Findings:
  - [approach/step/field] <what's wrong> → <fix>
  - …
(If DEFER) Needed renderer: <name> — <why the current primitives can't represent the unit of work>
```

---

## Author Checklist (before running ingest)

- [ ] Correct, runnable `solution.py` per approach; `entrypoint` matches the method name
- [ ] ≥3 presets including ≥1 edge case; `expectedOutput` is correct for each on BOTH approaches
- [ ] Every branch has a preset that takes the `if` side and one that takes the `else` side
- [ ] `lineExplanations` covers every meaningful line; `syntaxExplanations` covers every line 1..N
- [ ] `visualizationIntent` present and matches the `mapping.json` intent at each phase
- [ ] `mapping.json` references only real solution variables; `cellStateRules` end with `{ "state": "idle", "when": "true" }`
- [ ] `narration.json` has a specific `byLine` entry for every executable line; no `byPhase`-only lines
- [ ] `resultSpec` points at the variable that holds the final answer
- [ ] Phase boundary check: no line tagged `"init"` has a line number greater than the first `"loop"` line
- [ ] `supportsCompare` is only `true` if ≥2 approaches with distinct `kind`
- [ ] All DSL expressions scanned for: slices (`:` in expressions), `and`/`or`/`not`, `.method()` calls, `in` operator, invented variable names
- [ ] If a secondary structure is used, `auxMappings` entry added (not just a `readout` chip)
- [ ] Renderer confirmed with the user before authoring began (§5.1 scaling rule)
