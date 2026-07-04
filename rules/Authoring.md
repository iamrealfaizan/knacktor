# Authoring — Knacktor Problem Template (D9 / D13)

> **Status:** v1.0 — the canonical, fixed template the team (assisted by Claude) fills for every
> new problem. **This is the scaling surface of the platform.** If a problem conforms to this
> template and passes ingest validation, it renders correctly with zero UI changes (D2).
> **Companions:** [Schema.md](Schema.md) (the contracts these files become), [SimulationRules.md](SimulationRules.md) (the visual grammar mappings must honor), [Rules.md](Rules.md) §4/§6.

## 0. The golden rule

**Authors never write step arrays.** You write the *real Python solution* plus a few declarative
spec files. The **Python tracer** executes the solution and produces every step — so the code, the
variables, the highlighted line, and the animation can never drift out of sync. Your job is to
write correct Python and describe (a) how its variables map to a visual and (b) what to say at each
line.

## 1. Bundle layout

One directory per problem under `seeds/problems/<slug>/`:

```
seeds/problems/<slug>/
  problem.json                 # metadata + statement + refs (BY SLUG) + flags + inputConstraints
  presets.json                 # >=3 presets PER APPROACH incl >=1 edge case + expectedOutput
  approaches/<approachId>/
      solution.py              # REAL Python, executed verbatim (line numbers are load-bearing)
      approach.json            # id,name,kind,summary,complexity,entrypoint,explanations,resultSpec
      mapping.json             # VisualMappingSpec — how real vars become the VisualState
      narration.json           # NarrationSpec — what to say per line/phase
      mapping.py               # OPTIONAL — only when mapping.json primitive == "custom"
```

A pre-stubbed skeleton lives in `tracer/template/`. Copy it, fill it, run ingest.

## 2. `problem.json`

```jsonc
{
  "schemaVersion": "1.0",
  "slug": "container-with-most-water",      // URL identity; unique
  "number": 11,                              // LeetCode number
  "title": "Container With Most Water",
  "difficulty": "medium",                    // slug → difficulties._id (must exist)
  "topics": ["array", "two-pointers", "greedy"],   // slugs → topics._id (must all exist)
  "patterns": ["two-pointers"],              // slugs → patterns._id (must all exist)
  "statement": "Markdown of the FULL exact problem statement…",  // shown in the statement Sheet
  "hasVisualization": true,
  "isPremium": false,
  "supportsCustomInput": true,               // honored only when CUSTOM_INPUT_ENABLED (D12)
  "supportsCompare": true,                   // requires >= 2 approaches
  "recommendedApproachId": "two-pointers",
  "inputConstraints": {                      // bounds for (future) custom input + step cap
    "fields": [
      { "name": "height", "type": "int[]", "label": "Heights",
        "placeholder": "1,8,6,2,5,4,8,3,7", "min": 0, "max": 10000, "minLen": 2, "maxLen": 24 }
    ],
    "maxSteps": 1000
  }
}
```

Unknown topic/pattern/difficulty slugs are a **hard ingest failure** — seed them first.

## 3. `presets.json`

Shared across approaches (the tracer runs each approach against every preset). **≥3 presets,
≥1 edge case, each with `expectedOutput`.** Source them from LeetCode examples + edge cases.

**Presets are teaching artifacts (Rules.md §6.1 — hard requirement, every problem).** They are the
inputs the learner actually watches animate, so the set MUST cover the problem's meaningful scenario
space — never just generic/simple inputs. As applicable to *this* problem, span: the canonical case;
the instructive **boundary** cases (empty, single element, min/max in-scope size); and every case that
**changes the visual narrative** — found-early vs. not-found, match vs. no-match, duplicates/all-equal,
sorted vs. reverse-sorted, negative/zero values, hashmap collision vs. clean insert, cycle vs. no-cycle,
deepest-recursion/full-backtrack, the branch that triggers an `error`/`rejected` state. Rule of thumb
before adding a preset: *"what does the learner see here they can't see in the others?"* — if "nothing",
replace it. Two inputs that trace the same visual story count as one. This is stronger than the
No-Line-Left-Behind coverage gate: line coverage proves code ran; this requires the *scenarios a learner
needs* are all visible, and it is checked at Gate 2 (FidelityReview.md).

```jsonc
[
  { "id": "example-1", "label": "Example 1", "value": { "height": [1,8,6,2,5,4,8,3,7] }, "isEdgeCase": false, "expectedOutput": 49 },
  { "id": "edge-min",  "label": "Minimum length", "value": { "height": [1,1] },          "isEdgeCase": true,  "expectedOutput": 1 },
  { "id": "edge-flat", "label": "All equal",       "value": { "height": [4,4,4,4] },      "isEdgeCase": true,  "expectedOutput": 12 }
]
```

`expectedOutput` is deep-compared to the traced `finalResult` — a mismatch aborts ingest (it means
the solution or the expected value is wrong). This is how the template self-validates correctness.

**Label and ID naming convention (enforced for all problems):**
- LeetCode examples → `id: "example-1"`, `"example-2"`, … and `label: "Example 1"`, `"Example 2"`, …
  Never: `"LeetCode Example 1"`, `"Test Case 1"`, `"Basic case"`, `"Example One"`.
- Edge cases → `id: "edge-<descriptor>"` (kebab-case, e.g. `edge-all-duplicates`) and `label` is a 2–4 word descriptive title in Title Case that describes what makes it interesting (e.g. `"All duplicates"`, `"Single element"`, `"Negative values"`, `"Sorted descending"`).
  Never: `"Edge case 1"`, `"Edge 1"`, `"My test"`.
- The `label` is shown live in the UI as the current input's identity — make it informative at a glance.

## 4. `approaches/<id>/solution.py`

The real solution, executed verbatim. **Line numbers are load-bearing** — `lineExplanations`,
`mapping.json`, and `narration.json` key off them. Keep one `class Solution` with the `entrypoint`
method; the tracer calls `entrypoint(**preset.value)`.

```python
class Solution:
    def maxArea(self, height):
        lp = 0                                   # line 3
        rp = len(height) - 1                     # line 4
        mx = 0                                   # line 5
        while lp < rp:                           # line 6
            h = min(height[lp], height[rp])      # line 7
            width = rp - lp                      # line 8
            area = h * width                     # line 9
            mx = max(mx, area)                   # line 10
            if height[lp] < height[rp]:          # line 11
                lp += 1                          # line 12
            else:                                # line 13
                rp -= 1                          # line 14
        return mx                                # line 15
```

**No Line Left Behind:** every executable line (excluding blanks/comments/`class`/`def` headers;
**including** `while`/`if`/`elif`/`else` headers) must execute under at least one preset, or ingest
fails naming the uncovered line. Add a preset that covers it.

## 5. `approaches/<id>/approach.json`

```jsonc
{
  "id": "two-pointers",
  "name": "Two Pointers",
  "kind": "optimal",                         // brute | optimal | alternative
  "summary": "Shrink from the wider side; the limiting wall is always the shorter one.",
  "complexity": { "time": "O(n)", "space": "O(1)" },
  "language": "python",
  "entrypoint": "Solution.maxArea",
  "primaryPrimitive": "bar-container",
  "auxStructures": [],
  "lineExplanations": {                      // narration LINE EXPLANATION panel
    "3": "Start a pointer at the leftmost wall.",
    "6": "Keep going while the two walls haven't met."
  },
  "syntaxExplanations": {                    // hover tooltip in the code panel (beginner syntax)
    "3": "lp is shorthand for 'left pointer'."
  },
  "visualizationIntent": "init: show the bar-container with lp at index 0, rp at last index. loop: highlight lp and rp bars as walls, show water fill between them. update: flash bars green when a new max area is found. return: show the final best area.",
                                            // Human-readable intent for what should be shown
                                            // at each phase. Used by Claude during add-problem
                                            // workflow (D18) to validate mapping.json.
                                            // Not rendered to users.
  "resultSpec": {                            // drives the RESULT panel generically
    "varName": "mx", "label": "BEST AREA", "suffix": "· max water", "render": "scalar"
  },
  "varColors": { "lp": "ptr-lo", "rp": "ptr-hi" }   // optional: pin rail colors to stage lanes
}
```

`resultSpec.render`: `scalar` (one value, e.g. `mx`), `string`, `boolean`, `list` (chip per
primitive), `tuple-list` (each item is `number[]`, e.g. 4Sum quadruplets on var `res`).

## 6. `approaches/<id>/mapping.json` — Visual-Mapping DSL

Describes how the tracer's **real captured variables** become the bespoke `VisualState` for each
step. The mapping is evaluated per step against that step's real state, so the animation cannot
drift from the code.

```jsonc
{
  "primitive": "bar-container",              // → VisualState.type (array | bar-container | custom | …)
  "valuesFrom": "height",                    // var name → visual.values
  "pointers": [                              // → visual.pointers (lanes assigned in this order)
    { "name": "lp", "var": "lp" },
    { "name": "rp", "var": "rp" }
  ],
  "cellStateRules": [                        // ordered; FIRST match wins per index i
    { "state": "result",  "when": "i==lp || i==rp", "onlyWhen": "isNewMax" },
    { "state": "current", "when": "i==lp || i==rp" },
    { "state": "dimmed",  "when": "i<lp || i>rp" },
    { "state": "idle",    "when": "true" }
  ],
  "derived": {                               // computed objects on the VisualState
    "container": {
      "left": "lp", "right": "rp", "width": "rp-lp",
      "waterHeight": "min(values[lp], values[rp])",
      "area": "(rp-lp) * min(values[lp], values[rp])"
    }
  },
  "window": { "from": "lp", "to": "rp" },    // optional translucent tray
  "ghosts": { "track": ["lp", "rp"] },       // glide these when they move (before→after)
  "readout": {                               // the stage chip; expr is a template
    "expr": "area = {width} × {h} = {area}",
    "relation": "best {mx}", "relationColor": "result"
  },
  "phaseRules": [                            // map lines → Step.phase
    { "phase": "init",   "lines": [3,4,5] },
    { "phase": "loop",   "lines": [6] },
    { "phase": "update", "lines": [7,8,9,10] },
    { "phase": "move",   "lines": [11,12,13,14] },
    { "phase": "return", "lines": [15] }
  ],
  "keyEvents": [                             // → isKeyEvent + Step.keyEvent {label,kind}
    { "when": "isNewMax", "label": "New best area", "kind": "best" },
    { "line": 15, "label": "Final answer", "kind": "return" }
  ]
}
```

### 6.1 The expression DSL (safe, statically checked)
- Expressions are restricted, sandboxed evaluations over a **whitelisted namespace**: the step's
  captured variables, plus `i` (cell index), `values` (the `valuesFrom` array), `phase`, and the
  helpers `min`, `max`, `len`, `abs`. Any other name is a static error at ingest.
- Author-defined booleans (e.g. `isNewMax`) are declared in an optional `flags` block:
  `"flags": { "isNewMax": "area > mx_prev" }` — evaluated with access to the previous step's vars
  via `*_prev`. (Use sparingly; prefer expressing key events by line where possible.)
- `cellStateRules` are ordered and first-match-wins; `state` must be in the canonical `CellState`
  vocabulary ([SimulationRules.md](SimulationRules.md) §A-2.3).

### 6.2 Available primitives (M1.8 renderer library)
`primitive` may be any of these values. Each maps to a generic renderer component built in M1.8:

| `primitive` | Renderer | Use for |
|---|---|---|
| `array` | ArrayRenderer | Arrays, strings, any 1-D index-walking algorithm |
| `bar-container` | BarContainerRenderer | Height/area problems with water fill |
| `hashmap` | HashMapRenderer | Hash map / set problems (Two Sum, Group Anagrams) |
| `recursion` | RecursionRenderer | Recursive algorithms + call stack visualization |
| `tree` | TreeRenderer | Binary tree, BST, traversal problems |
| `linkedList` | LinkedListRenderer | Linked list traversal, reversal, cycle detection |
| `stack` | StackRenderer | Stack-based algorithms (valid parentheses, monotonic stack) |
| `queue` | QueueRenderer | BFS, sliding window queue variants |
| `grid` | GridRenderer | 2D matrix problems (islands, paths, flood fill) |
| `graph` | GraphRenderer | Graph traversal (DFS, BFS, Dijkstra, topological sort) |
| `custom` | custom per-problem component (see §6.3) | Problems where no generic renderer suffices |

See [Schema.md](Schema.md) §2.6 for the VisualState shapes for each type.

### 6.3 Custom component escape hatch (`primitive: "custom"`, D17)
When a problem genuinely needs bespoke rendering and ≥2 of these criteria apply: (a) 2+ primitives must coordinate simultaneously, (b) spatial layout is itself the teaching point, (c) animation logic cannot be expressed via the DSL — set `"primitive": "custom"`.

For `mapping.json` approach, provide `mapping.py` as the custom mapper:
```python
def map_step(captured_vars, ctx):
    # ctx: { "i_step", "phase", "prev_vars", "values_of"(name) }
    return { "type": "custom", "componentKey": "my-slug", ...any-shape... }
```

Claude Code also generates `components/problem/custom/<slug>-visualizer.tsx` — a React component registered via dynamic import in `stage.tsx`. The component must:
- Accept `{ visual: CustomVisualState, step: Step }` props
- Include a top-of-file comment explaining why generic rendering was insufficient
- Honor the semantic color/motion grammar from [Design.md](Design.md)

The returned `VisualState` is still validated for `CellState` vocabulary compliance. Use the hatch sparingly (D2/D17) — generic renderers are always preferred for scale.

## 7. `approaches/<id>/narration.json`

Templates with `{var}` placeholders filled from the step's captured vars. **Every executed line
must resolve to non-empty `happening`, `why`, and `invariant`** — empty fields or banned generic
sentinels (`TODO`, `…`, `step N`) abort ingest.

```jsonc
{
  "byLine": {
    "9":  { "happening": "Area between walls = {width} × {h} = {area}.",
            "why": "This is the water these two walls would trap.",
            "invariant": "Best area so far is {mx}." },
    "11": { "happening": "Compare the two wall heights.",
            "why": "Moving the shorter wall is the only move that can ever increase the area.",
            "invariant": "We never revisit a discarded wall." }
  },
  "byPhase": {                                // fallback when a line has no byLine entry
    "init":   { "happening": "Set up pointers and the running best.", "why": "…", "invariant": "…" },
    "return": { "happening": "Return the largest area found: {mx}.", "why": "…", "invariant": "Search space is empty." }
  }
}
```
Resolution order per step: `byLine[lineNo]` → `byPhase[phase]`. The LINE EXPLANATION readout in the
narration panel comes from `approach.json`'s `lineExplanations`, not here.

## 8. Validation pipeline (ingest aborts on ANY failure — D13)

In order, with the exact failure surfaced:
1. **Bundle shape** (zod) — all files present, parse, schema-valid, `solution.py` non-empty.
2. **Reference resolution** — every topic/pattern/difficulty slug and sheet `problemId` resolves.
3. **Preset coverage** — ≥3 presets, ≥1 `isEdgeCase`, every preset has `expectedOutput`.
4. **Mapping DSL static check** — every expression parses; every referenced var/placeholder exists;
   `primitive` known (or `custom` with `mapping.py` present); `cellStateRules.state` in vocabulary.
5. **Trace gen + No-Line-Left-Behind** — every executable line emits ≥1 step across the preset set.
6. **codeKey integrity** — every step `codeKey`/`lineNo` is a real executable line.
7. **Narration completeness** — every step has non-empty `happening`/`why`/`invariant`, no sentinels.
8. **VisualState validity** — every `visual` passes the discriminated-union shape + `CellState` vocabulary.
9. **Expected-output match** — traced `finalResult` deep-equals each preset's `expectedOutput`.
10. **Step cap** — `stepCount <= inputConstraints.maxSteps`.

TS checks live in `lib/validators/validate-problem.ts`; Python checks (5,7, source-side 6/8) live in
the tracer runner. Nothing partial is written on failure.

## 9. Author checklist (for the Claude prompt that fills the template)
- [ ] Correct, runnable `solution.py` per approach; `entrypoint` matches.
- [ ] ≥3 presets incl. ≥1 edge case; `expectedOutput` correct for each.
- [ ] `lineExplanations` cover the meaningful lines; `syntaxExplanations` help beginners.
- [ ] `mapping.json` references only real variables; `cellStateRules` cover every index (end with `when:"true"`).
- [ ] `narration.json` resolves a meaningful, specific line/phase entry for every executed line.
- [ ] `resultSpec` points at the variable that holds the answer.
- [ ] `supportsCompare` only if ≥2 approaches with distinct `kind`.
