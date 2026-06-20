# lib/tracer/ — Mapping DSL, Tracer Pipeline & Validation Rules

> Auto-loaded when Claude works on any file in this directory.
> **Canonical authority:** [rules/Authoring.md](../../rules/Authoring.md) (full DSL reference) and [rules/Schema.md](../../rules/Schema.md) (VisualState shapes).
> When in doubt, read the canonical doc and cite the section.

---

## What the tracer does (D9 — Hybrid Trace Model)

The Python tracer (`tracer/run.py`, using `sys.settrace`) executes the author's **real solution** for each preset input and produces the step skeleton:
- Every executed source line → one `Step` with the **real variable snapshot** (`capturedVars`), `changedVars`, counters, and the current `lineNo`
- Loops **re-emit**: each iteration of a line produces its own step
- The visual-mapping layer (`lib/tracer/mapping.ts`) then evaluates the author's `mapping.json` DSL against that real per-step state to produce `VisualState`
- The narration layer (`lib/tracer/narration.ts`) evaluates `narration.json` templates against the real state to produce `Step.narration.*`

**The tracer never reads from hand-authored step arrays.** Animation cannot drift from the code because both derive from the same real captured state.

---

## The VisualMappingSpec (mapping.json)

All fields in `mapping.json`:

### Required fields

| Field | Type | Description |
|---|---|---|
| `primitive` | string | One of the 10 allowed values (see Renderer table). Never invent a new one. |

### Primitive-specific required fields

**`array`:**
```jsonc
{ "primitive": "array", "valuesFrom": "nums" }
```
- `valuesFrom`: variable name holding the list to draw (numbers or strings)

**`bar-container`:**
```jsonc
{ "primitive": "bar-container", "valuesFrom": "height",
  "derived": { "container": { "left": "lp", "right": "rp", "width": "rp-lp",
    "waterHeight": "min(values[lp], values[rp])", "area": "(rp-lp)*min(values[lp],values[rp])" } } }
```

**`hashmap`:**
```jsonc
{ "primitive": "hashmap", "keysFrom": "seen", "valuesFrom": "seen",
  "highlightRules": [{ "state": "current", "whenKey": "k == nums[i]" }, { "state": "result", "whenKey": "k == complement" }] }
```
- `keysFrom`/`valuesFrom`: variable name of the dict/map being visualized
- `highlightRules`: ordered, first match wins per entry; `whenKey` uses `k` as the key being evaluated

**`stack`:**
```jsonc
{ "primitive": "stack", "itemsFrom": "stack", "topVar": "top",
  "cellStateRules": [{ "state": "current", "when": "idx == top" }, { "state": "idle", "when": "true" }] }
```
- `itemsFrom`: variable name of the list used as a stack; `topVar`: variable holding top index

**`queue`:**
```jsonc
{ "primitive": "queue", "itemsFrom": "queue", "frontVar": "front", "backVar": "back",
  "cellStateRules": [{ "state": "current", "when": "idx==front || idx==back" }, { "state": "idle", "when": "true" }] }
```

**`tree`:**
```jsonc
{ "primitive": "tree", "nodesFrom": "nodes", "edgesFrom": "edges",
  "nodeStateRules": [{ "state": "current", "when": "node_id == curr" }, { "state": "visited", "when": "node_id in visited" }],
  "pointers": [{ "name": "root", "var": "root" }, { "name": "curr", "var": "curr" }] }
```
- `node_id`: special scope variable (the ID of the node currently being evaluated in nodeStateRules)

**`linkedList`:**
```jsonc
{ "primitive": "linkedList", "nodesFrom": "nodes", "linksFrom": "links",
  "pointers": [{ "name": "curr", "var": "curr" }, { "name": "prev", "var": "prev" }],
  "changedLinksFrom": "changed_links" }
```
- Flat-array format also supported: `nodes=[val0,val1,...]`, `links=[next0,next1,...]` where -1=none

**`grid`:**
```jsonc
{ "primitive": "grid", "gridFrom": "grid",
  "cellStateRules": [{ "state": "current", "when": "r==row && c==col" }, { "state": "visited", "when": "grid[r][c]=='0'" }, { "state": "idle", "when": "true" }],
  "pointers": [{ "name": "r", "rowVar": "row", "colVar": "col" }] }
```
- `r`, `c`: scope vars for the row/col currently being evaluated in cellStateRules

**`recursion`:**
```jsonc
{ "primitive": "recursion", "framesFrom": "call_stack", "treeEdgesFrom": "tree_edges", "currentFrameVar": "frame_id" }
```
- The Python tracer automatically tracks `call_stack` when `primitive` is `recursion`

**`graph`:**
```jsonc
{ "primitive": "graph", "nodesFrom": "nodes", "edgesFrom": "edges", "directed": true,
  "nodeStateRules": [{ "state": "current", "when": "node_id == curr" }, { "state": "visited", "when": "node_id in visited" }],
  "pointers": [{ "name": "curr", "var": "curr" }] }
```

### Optional fields (all primitives)

**`pointers`** (array, bar-container, linkedList, tree, graph):
```jsonc
"pointers": [{ "name": "i", "var": "i" }, { "name": "j", "var": "j" }]
```
- 🔴 `var` MUST be a real variable in the solution that holds an **array index** (an integer). Never invent a variable name. A pointer renders only when its value is a valid index `0..len-1`. Lanes/colors auto-assign by order.

**`cellStateRules`** (array, bar-container, stack, queue, grid):
```jsonc
"cellStateRules": [
  { "state": "result", "when": "idx==i || idx==j", "onlyWhen": "isMatch" },
  { "state": "current", "when": "idx==i || idx==j" },
  { "state": "dimmed", "when": "idx < lo || idx > hi" },
  { "state": "idle", "when": "true" }
]
```
- Ordered; **first match wins per cell index**. MUST end with `{ "state": "idle", "when": "true" }` so every cell always resolves.
- `state` must be in the canonical CellState vocabulary: `idle, current, compared, frontier, visited, result, path, special, error, dimmed, left, right`
- 🔴 `idx` is the **cell index** (0..len-1), NOT the solution's loop variable `i`. To color the cell where pointer `i` sits, write `"idx == i"`.

**`flags`**: named booleans evaluated once per step (cannot use `idx`):
```jsonc
"flags": { "isMatch": "area > mx_prev", "isNewMax": "mx != mx_prev" }
```
Reuse flags in any `when` expression. Flags run before cells.

**`window`** (array only):
```jsonc
"window": { "from": "lo", "to": "hi" }
```
Translucent tray behind cells. Omit if the algorithm has no finite window.

**`ghosts`**:
```jsonc
"ghosts": { "track": ["lp", "rp"] }
```
Glides a pointer when its index changes between steps (before→after). Include whenever a pointer or value moves.

**`readout`**:
```jsonc
"readout": { "expr": "area = {width} × {h} = {area}", "relation": "best {mx}", "relationColor": "result", "when": "phase != 'return'" }
```
The chip above the stage. `expr`/`relation` are `{...}` templates; `relationColor` is a token key (never hex). Gate with `when` to avoid stale chip on the final step.

**`counters`**:
```jsonc
"counters": [{ "name": "comparisons", "onLines": [7, 11], "when": "true" }]
```
Increment per matching step. Drives the complexity meters in the insight rail.

**`phaseRules`**:
```jsonc
"phaseRules": [
  { "phase": "init",   "lines": [3, 4, 5] },
  { "phase": "loop",   "lines": [6] },
  { "phase": "check",  "lines": [11] },
  { "phase": "update", "lines": [7, 8, 9, 10] },
  { "phase": "move",   "lines": [12, 14] },
  { "phase": "return", "lines": [15] }
]
```
First match by line. Every executable line MUST have a phaseRules entry.

**`keyEvents`**:
```jsonc
"keyEvents": [
  { "when": "isNewMax", "label": "New best area", "kind": "best" },
  { "line": 15, "label": "Final answer", "kind": "return" }
]
```
Conditions are ANDed; provide at least one of `line`/`when`. `kind` ∈ `match, best, result, boundary, return`.
Mark only meaningful moments (a match / new-best + the return), not every step.

**`auxMappings`** (D19):
```jsonc
"auxMappings": [
  { "label": "Stack", "primitive": "stack", "itemsFrom": "stack",
    "cellStateRules": [{ "state": "current", "when": "idx == len(stack)-1" }, { "state": "idle", "when": "true" }] }
]
```
Pipeline fields (`phaseRules`, `counters`, `keyEvents`, `readout`, `flags`) belong to the primary only. Omit from aux entries.

---

## Phase Meanings — use the right one or the UI labels the wrong moment

| Phase | Meaning | Lines that belong here |
|---|---|---|
| `init` | One-time setup that runs **before the first loop**. If a line appears after any `while`/`for` in your solution, it is NOT `init`. | Variable declarations, copy-input, initialize sentinels — all before the first loop header |
| `loop` | The loop header itself (every iteration, including the final false check). | `while …:`, `for … in …:` |
| `check` | A branch condition that doesn't change state. | `if …:` lines, condition-only evaluations |
| `update` | Any state change — including cleanup or reset lines between two loops (e.g. `changed_links = []`). | Assignments, `.append`, link rewrites, counter increments |
| `move` | Advancing a traversal pointer — including setting the start of a second pass (e.g. `current = new_head`). | `i += 1`, `current = nxt`, `head = head.next` |
| `recurse` | A recursive call. | The line containing the self-call |
| `return` | The `return` statement. | `return result` |
| `done` | Post-loop teardown not covered by the above. | Rarely used |

🔴 **The most common phase bug:** labelling post-loop cleanup or second-pass setup as `"init"`. If you wrote `"init"` for any line whose line number is **greater than the first loop header line number**, stop and reclassify: reset/cleanup → `"update"`, pointer advance to second pass → `"move"`.

---

## The Expression DSL — strict; this is where mistakes happen

Every `when` / `onlyWhen` / `derived` / `flags` / `keyEvents.when` / `phaseRules.when` value, and every `{…}` placeholder inside `readout` or `narration`, is a **mini-expression**.

### ALLOWED (and nothing else):
- Literals: numbers, `'single-quoted strings'`, `true`, `false`, `null`
- Operators: `+ - * / %`, `== != < <= > >=`, `&& || !`, ternary `? :`, parentheses
- Single-element indexing / member access: `values[idx]`, `nums[i]`, `strs[j][i]`, `obj.field`
- Functions — **only**: `min`, `max`, `len`, `abs`

### 🔴 FORBIDDEN (will crash ingest or silently misbehave):
- ❌ **Slicing of any kind**: `s[:k]`, `a[i:j]`, `prefix[:-1]` — the parser has no `:` slice. Slicing inside the *Python solution* is fine; never put a slice inside a DSL expression. Rephrase using a boolean flag, a precomputed variable, or a different condition.
- ❌ Python keywords `and` / `or` / `not` — use `&&`, `||`, `!` instead.
- ❌ Method calls: `s.startswith(...)`, `.append`, `.length`, `.upper()` — none of these work.
- ❌ Comprehensions, lambdas, function calls other than `min/max/len/abs`.
- ❌ The `in` operator: `x in seen` — not supported. Use `len(seen) > 0` as proxy, or a phase-based guard.
- ❌ Referencing a variable that doesn't exist in the solution at that step — it reads as `null`, causing silent wrong state.

### Scope available in each expression:
| Name | Meaning |
|---|---|
| Any solution variable | Its **real** value this step (`i`, `lo`, `s`, `nums`, `res`, …) |
| `<name>_prev` | That variable's value on the **previous step** (e.g. `area > mx_prev`) |
| `idx` | The current **cell index** while evaluating `cellStateRules` (0..len-1) |
| `values` | The array chosen by `valuesFrom` |
| `phase` | This step's phase string |
| `k` | The key being evaluated in `highlightRules.whenKey` (hashmap only) |
| `node_id` | The node being evaluated in `nodeStateRules` (tree/graph only) |
| `r`, `c` | Row/col being evaluated in grid `cellStateRules` |
| Your `flags` | The booleans you defined in `flags` |

⚠️ **Null-safety:** a variable absent this step reads as `null`; comparisons with it are `false`; `x != null` is `true` only when `x` has a value — use it to gate a rule until a variable exists.

---

## No-Line-Left-Behind (D8 / D13)

Every executable line in the displayed Python code **MUST emit at least one Step**. This includes:
- The `while` / `for` condition on entry AND on the final FALSE evaluation (so the learner sees why the loop exits)
- Every variable assignment
- Both the `if` branch body AND the `else` branch body (the `else:` keyword itself is exempt — it has no bytecode)
- Every `return`

Only exempt: blank lines, comment lines, bare `class` header, bare `def` header.

A highlight that jumps over a line is a **bug** — this is a learning tool where the code trace IS the lesson.

The ingest validator checks this via `dis.findlinestarts` and fails loudly if any executable line has no matching step across all preset traces.

---

## Narration Spec (narration.json)

Templates with `{var}` placeholders filled from the step's **real** captured vars.

```jsonc
{
  "byLine": {
    "9": { "happening": "Area between walls = {width} × {h} = {area}.", "why": "This is the water these two walls would trap.", "invariant": "Best area so far is {mx}." },
    "11": [
      { "when": "height[lp] < height[rp]", "happening": "Left wall ({height[lp]}) is shorter — move it right.", "why": "Moving the shorter wall is the only move that can ever increase area.", "invariant": "We never revisit a discarded wall." },
      { "happening": "Right wall ({height[rp]}) is shorter — move it left.", "why": "…", "invariant": "…" }
    ]
  },
  "byPhase": {
    "init":   { "happening": "Set up pointers and the running best.", "why": "…", "invariant": "…" },
    "return": { "happening": "Return the largest area found: {mx}.", "why": "Search is complete.", "invariant": "Search space is empty." }
  }
}
```

Rules:
- `byLine`: map from line number (string) to ONE entry or an ARRAY of variants
- Entry shape: `{ "happening", "why", "invariant" }` — all three **non-empty and specific** (never blank, never `TODO`/`…`/`step N` — ingest rejects these)
- For branch lines (`if`/`while` headers): use an array of variants: `[{ "when": expr, ...}, { ...no when... }]` — first whose `when` passes wins; the **last variant must have no `when`** as the fallback
- `byPhase`: one entry per phase used — the safety net so no step ever falls back to a blank narration (but ingest now requires specific `byLine` for every executed line — `byPhase` alone is no longer sufficient)
- ⚠️ **Timing caveat**: line events fire **BEFORE the line runs**. On the step for `x = f()`, `x` still holds its OLD value. The new value appears on the NEXT step. Phrase narration as "about to…" where relevant.
- `byLine` `when` expressions obey the same DSL as `cellStateRules.when` (no slices, no `and/or/not`, etc.)

---

## Validation Pipeline (ingest — D13, aborts on ANY failure)

In order, with the exact failure surfaced:

1. **Bundle shape** — all files present, parse cleanly, schema-valid, `solution.py` non-empty.
2. **Reference resolution** — every topic/pattern/difficulty slug resolves to an existing `_id`. Unresolved slug = hard failure.
3. **Preset coverage** — ≥3 presets per approach, ≥1 `isEdgeCase`, every preset has `expectedOutput`.
4. **Mapping DSL static check** — every expression parses; every referenced var/placeholder exists in the solution; `primitive` is a known value (or `custom` with `mapping.py` present); `cellStateRules.state` is in the CellState vocabulary.
5. **Trace gen + No-Line-Left-Behind** — every executable line emits ≥1 step across the preset set. Missing line = abort naming the uncovered line.
6. **codeKey integrity** — every step `codeKey`/`lineNo` is a real executable line in the solution.
7. **Narration completeness** — every executed line has a specific `byLine` entry (not just a `byPhase` fallback). Empty fields or banned sentinels (`TODO`, `…`, `step N`) = abort.
8. **VisualState validity** — every `visual` passes the discriminated-union shape check + CellState vocabulary.
9. **Expected-output match** — traced `finalResult` deep-equals each preset's `expectedOutput`. Mismatch = abort (means the solution or expected value is wrong).
10. **Step cap** — `stepCount <= inputConstraints.maxSteps`.

TypeScript checks live in `lib/validators/validate-trace.ts` and `lib/validators/validate-problem.ts`. Python-side checks (steps 5/7/8 partial) live in the tracer runner. Nothing is partially written to MongoDB on failure.

---

## Common Authoring Pitfalls to Watch For

1. **Phase boundary bug**: any line tagged `"init"` whose line number exceeds the first `"loop"` line is a misclassification. `"init"` = lines that run *once, unconditionally, before any loop ever starts*. Reset/cleanup between loops → `"update"`. Second-pass pointer setup → `"move"`.
2. **`idx` vs `i`**: `idx` is the cell index in `cellStateRules`, not the solution's `i`. Write `"idx == i"` to color the cell where pointer `i` sits.
3. **Inventing variables**: pointer `var` and `resultSpec.varName` must be **real** variables in the solution at that step. If a variable doesn't exist at a step, the DSL reads it as `null`.
4. **Missing idle catch-all**: `cellStateRules` must end with `{ "state": "idle", "when": "true" }`. Omitting it leaves some cells in undefined state.
5. **Slices in DSL**: `nums[:i]` in a `when` expression crashes ingest. Use a precomputed variable or a flag instead.
6. **`byPhase` only is no longer sufficient**: ingest requires a specific `byLine` entry for every executed line. A missing `byLine` is a validation error, not a silent fallback.
7. **Line numbers**: `class Solution:` is line 1, `def method(self, ...)` is line 2, first body statement is line 3. Recount the `\n`s carefully — all DSL keys are load-bearing.
8. **Bare `else:` lines**: have no bytecode and never produce a step — do NOT give them narration/phase/explanation keys. The first statement inside the else block gets the step.
