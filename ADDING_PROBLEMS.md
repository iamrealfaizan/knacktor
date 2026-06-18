# Adding a New Problem to Knacktor — Step-by-Step Guide

> **Audience:** anyone adding a problem (your team, with Claude's help).
> **Companion:** [`rules/Authoring.md`](rules/Authoring.md) is the canonical spec; this file is the
> practical walkthrough. The live reference implementation is the **4Sum gold bundle** at
> [`seeds/problems/4sum/`](seeds/problems/4sum/) — copy its shape.

---

## 0. The one thing to understand first

**You never write the animation steps by hand.** You write the *real Python solution* plus a few
small JSON files that describe (a) how the solution's variables map to a picture and (b) what to say
at each line. A **Python tracer runs your solution and records every executed line + the real
variables**, then your JSON specs turn that into the simulation. This makes the code, the variables,
the highlighted line, and the animation **impossible to desync**.

If your problem reuses a structure that already has a renderer (**array** or **bar-container**
today), adding it is pure data — no app code. If it needs a brand-new structure (linked list, tree,
graph, …), that renderer is a one-time engineering task first (ping the engine owner).

---

## 1. Prerequisites (once)

- **Python 3** on PATH (`python --version` → 3.10+). Used at ingest time only.
- **Node deps installed** (`npm install`).
- **`.env.local`** has `MONGODB_URI`.
- Verify the toolchain works end-to-end before you start: `npm run ingest` should succeed.

---

## 2. The bundle layout you will create

One folder per problem under `seeds/problems/<slug>/`:

```
seeds/problems/<slug>/
  problem.json                         # metadata + statement + taxonomy + flags
  presets.json                         # >=3 examples per problem, >=1 edge case
  approaches/<approachId>/
      solution.py                      # the REAL Python solution (executed verbatim)
      approach.json                    # complexity, line explanations, resultSpec, colors
      mapping.json                     # how variables become the picture
      narration.json                   # what to say at each line
```

**Fastest start:** copy the stub at [`tracer/template/`](tracer/template/) **or** copy the real
[`seeds/problems/4sum/`](seeds/problems/4sum/) and edit it.

```bash
cp -r seeds/problems/4sum seeds/problems/<your-slug>
```

---

## 3. Step-by-step

### Step 1 — `problem.json` (metadata)

```jsonc
{
  "schemaVersion": "2.0",
  "slug": "two-sum",                      // URL id, unique, kebab-case
  "number": 1,                            // LeetCode number
  "title": "Two Sum",
  "difficulty": "easy",                   // must be a seeded slug: easy | medium | hard
  "topics": ["array", "hash-map"],        // must all exist in seeds/topics.json
  "patterns": ["two-pointers"],           // must all exist in seeds/patterns.json
  "statement": "Full exact problem text…\n\nNewlines are preserved.",
  "hasVisualization": true,
  "isPremium": false,
  "supportsCustomInput": true,            // honored later (custom input is OFF for now)
  "supportsCompare": true,                // auto-forced true only if >=2 approaches
  "recommendedApproachId": "optimal",     // must match an approach folder name
  "inputConstraints": {
    "fields": [
      { "name": "nums", "type": "int[]", "label": "Array", "placeholder": "2, 7, 11, 15",
        "min": -1000, "max": 1000, "minLen": 2, "maxLen": 24 },
      { "name": "target", "type": "int", "label": "Target", "placeholder": "9",
        "min": -2000, "max": 2000 }
    ],
    "maxSteps": 2000                      // tracer aborts if a run exceeds this
  }
}
```

> ⚠️ Every topic/pattern/difficulty **slug must already be seeded** (`seeds/topics.json`,
> `seeds/patterns.json`, `seeds/difficulties.json`). An unknown slug aborts ingest. Add the seed
> first if needed.

### Step 2 — `presets.json` (the examples)

**Rules (enforced at ingest):** ≥3 presets, ≥1 with `"isEdgeCase": true`, every preset has
`expectedOutput`. Source them from LeetCode examples + edge cases. The `value` object is passed as
keyword args to your entrypoint.

```jsonc
[
  { "id": "example-1", "label": "Basic", "value": { "nums": [2,7,11,15], "target": 9 },
    "isEdgeCase": false, "expectedOutput": [0,1] },
  { "id": "example-2", "label": "Negatives", "value": { "nums": [-3,4,3,90], "target": 0 },
    "isEdgeCase": false, "expectedOutput": [0,2] },
  { "id": "edge-tied", "label": "Duplicate values", "value": { "nums": [3,3], "target": 6 },
    "isEdgeCase": true, "expectedOutput": [0,1] }
]
```

> 💡 **Coverage:** "No Line Left Behind" is checked across **all presets combined**. Make sure your
> presets *together* exercise every branch (a match AND a no-match, both `if` and `else`, etc.).
> A single preset need not hit every line.
>
> 💡 `expectedOutput` is compared **order-insensitively for lists** (the tracer's real return value
> must equal it as a set). If it mismatches, either your solution or your expected value is wrong.

### Step 3 — `approaches/<id>/solution.py` (the real code)

```python
class Solution:
    def twoSum(self, nums, target):
        seen = {}                            # line 3
        for i in range(len(nums)):           # line 4
            need = target - nums[i]          # line 5
            if need in seen:                 # line 6
                return [seen[need], i]       # line 7
            seen[nums[i]] = i                # line 8
        return []                            # line 9
```

**Rules:**
- One `class Solution` with the method named in `approach.json`'s `entrypoint` (e.g.
  `"Solution.twoSum"`). The tracer calls it as `Solution().twoSum(**preset.value)`.
- **Line numbers are load-bearing** — `mapping.json`, `narration.json`, and `approach.json` all key
  off them. Don't renumber casually.
- Write normal, correct Python. Whatever it returns becomes `finalResult` (must match
  `expectedOutput`).

> 🔎 **Discover your exact line numbers + coverage** by running the tracer directly:
> ```bash
> python tracer/run.py seeds/problems/<slug> <approachId> <presetId>
> ```
> It prints `executableLines` (the lines you must narrate/map) and the per-step `lineNo`s. Lines
> with no bytecode (blank, comment, `class`/`def` headers, bare `else:`) are **not** in the set and
> don't need narration.

### Step 4 — `approaches/<id>/approach.json` (approach metadata)

```jsonc
{
  "id": "optimal",                         // must equal the folder name
  "name": "Hash Map",
  "kind": "optimal",                       // brute | optimal | alternative
  "summary": "One pass, remembering complements in a hash map.",
  "complexity": { "time": "O(n)", "space": "O(n)" },
  "language": "python",
  "entrypoint": "Solution.twoSum",
  "primaryPrimitive": "array",             // which renderer the stage uses
  "auxStructures": ["hash-map"],
  "resultSpec": { "varName": "res", "label": "RESULT", "render": "scalar" },
  "varColors": { "i": "ptr-i" },           // optional: pin rail colors to stage pointers
  "lineExplanations": {                    // shown in the narration LINE EXPLANATION panel
    "3": "Create an empty map from value → index.",
    "4": "Scan each index once."
  },
  "syntaxExplanations": {                  // optional beginner hover tips in the code panel
    "3": "{} is an empty dict (hash map)."
  }
}
```

**`resultSpec.render`** controls the RESULT panel:
| render | use for | example |
|---|---|---|
| `scalar` | one value | `mx`, a count |
| `string` | a string answer | |
| `boolean` | true/false | |
| `list` | array of primitives | `[0, 1]` |
| `tuple-list` | array of arrays | 4Sum quadruplets on `res` |

**`varColors`** values are **design-token keys** (no `#hex`). Available:
`ptr-i, ptr-j, ptr-lo, ptr-hi, special, result, amber, compared, current, error, gold`.

### Step 5 — `approaches/<id>/mapping.json` (variables → picture)

This is the heart. It's evaluated **per step against the real captured variables**. See the full
DSL reference in §4 below. Minimal array example:

```jsonc
{
  "primitive": "array",
  "valuesFrom": "nums",                    // var holding the array → the cells
  "pointers": [ { "name": "i", "var": "i" } ],
  "flags": { "found": "need in_seen" },    // (named booleans; see DSL notes)
  "cellStateRules": [                      // ordered, FIRST match wins per cell
    { "state": "current", "when": "idx == i" },
    { "state": "visited", "when": "idx < i" },
    { "state": "idle",    "when": "true" }
  ],
  "readout": { "when": "phase != 'return'", "expr": "need = target − nums[i] = {need}" },
  "counters": [ { "name": "lookups", "onLines": [6] } ],
  "phaseRules": [
    { "phase": "init",   "lines": [3] },
    { "phase": "loop",   "lines": [4] },
    { "phase": "check",  "lines": [5, 6] },
    { "phase": "update", "lines": [8] },
    { "phase": "return", "lines": [7, 9] }
  ],
  "keyEvents": [
    { "line": 7, "label": "Pair found", "kind": "match" },
    { "line": 9, "label": "Scan complete", "kind": "return" }
  ]
}
```

### Step 6 — `approaches/<id>/narration.json` (what to say)

Every executable line must resolve to a **non-empty, meaningful** `happening`/`why`/`invariant`
(empty or generic text aborts ingest). Use `{placeholders}` — anything in braces is an expression
evaluated against the step's variables (so `{nums[i]}`, `{len(res)}`, `{target - need}` all work).

```jsonc
{
  "byLine": {
    "3": { "happening": "Start an empty map of value → index.", "why": "It lets us find a complement in O(1).", "invariant": "seen holds every value scanned so far." },
    "4": { "happening": "Look at index {i} (value {nums[i]}).", "why": "Each element is visited once.", "invariant": "Indices before {i} are already in seen." },
    "5": { "happening": "We need {need} to reach the target.", "why": "{target} − {nums[i]} = {need}.", "invariant": "need is the missing partner for nums[{i}]." },
    "6": [
      { "when": "need in_seen", "happening": "{need} is already in the map — found a pair!", "why": "Its earlier index plus {i} sum to the target.", "invariant": "Answer located." },
      { "happening": "{need} is not in the map yet.", "why": "We haven't seen the partner; keep scanning.", "invariant": "Still searching." }
    ],
    "7": { "happening": "Return the two indices.", "why": "These two values sum to the target.", "invariant": "Done." },
    "8": { "happening": "Remember nums[{i}] = {nums[i]} at index {i}.", "why": "A future element may need it as a complement.", "invariant": "seen now includes index {i}." },
    "9": { "happening": "No pair summed to the target.", "why": "The whole array was scanned.", "invariant": "Return empty." }
  },
  "byPhase": {
    "init":   { "happening": "Set up.",   "why": "Prepare state.",       "invariant": "Setup." },
    "loop":   { "happening": "Advance.",  "why": "Next element.",        "invariant": "Scanning." },
    "check":  { "happening": "Compare.",  "why": "Test the condition.",  "invariant": "Deciding." },
    "update": { "happening": "Update.",   "why": "Record progress.",     "invariant": "Changing." },
    "return": { "happening": "Finish.",   "why": "Done.",                "invariant": "Complete." }
  }
}
```

> ✅ **Always provide a full `byPhase` fallback** (one entry per phase you use). `byLine` wins when
> present; `byPhase` is the safety net so no step is ever blank.

### Step 7 — Ingest (and read the validator output)

```bash
npm run ingest
```

Ingest validates **everything** and **aborts the whole run on any failure**, naming the exact
problem. Common failures and fixes:

| Error message contains | Cause | Fix |
|---|---|---|
| `unknown topic/pattern/difficulties slug "…"` | taxonomy slug not seeded | add it to the matching `seeds/*.json` |
| `No Line Left Behind — line(s) no preset ever executes: …` | a branch never runs under any preset | add a preset that reaches it |
| `narration.<field> is empty/generic` | missing/placeholder narration | write real text for that line/phase |
| `traced result … ≠ expectedOutput …` | wrong solution or wrong expected value | fix `solution.py` or `presets.json` |
| `cellState "…" not in vocabulary` | typo in a `state` | use a valid CellState (§4) |
| `step cap exceeded (N)` | input too big / infinite loop | shrink the preset or raise `maxSteps` |
| `unknown function '…' in expr` | used a non-whitelisted function | only `min, max, len, abs` are allowed |

Re-run until it says `✓ Ingest complete`.

### Step 8 — Verify in the app

```bash
npm run dev
```
Open `http://localhost:3000/problems/<slug>` and step through **each approach**:
- The highlighted code line, the variables, the result, the narration (all four readouts), and the
  picture all describe the **same moment** — every step.
- No line is skipped (the validator already guaranteed it).
- Diamonds sit on real key events with meaningful tooltips.
- Switch approaches; (Compare mode side-by-side lands in a later release).

Commit the new `seeds/problems/<slug>/` folder. Done.

---

## 4. The mapping DSL — complete reference

### Expression language
Used in every `when` / `onlyWhen` / `derived` / `flags` / `keyEvents.when` / `phaseRules.when` and
inside `{…}` placeholders. Supported:
- literals: numbers, `'strings'`, `true`, `false`, `null`
- operators: `+ - * / %`, `== != < <= > >=`, `&& || !`, `? :` (ternary), parentheses
- indexing/members: `values[idx]`, `nums[i]`, `obj.field`
- functions (only these): `min`, `max`, `len`, `abs`

### The scope each expression sees
| Name | Meaning |
|---|---|
| any variable from the solution | its **real value at this step** (e.g. `i`, `lo`, `s`, `nums`, `res`) |
| `<name>_prev` | that variable's value on the **previous** step (e.g. `mx_prev`) — for "did it change / improve" logic |
| `idx` | the **current cell index** while evaluating `cellStateRules` (0 … len-1) |
| `values` | the array chosen by `valuesFrom` |
| `phase` | this step's phase string |
| `flags` | any boolean you defined in `flags` (usable in `cellStateRules`, `readout.when`, etc.) |

> ⚠️ **Name clash gotcha:** the cell index is `idx`, **not** `i` — because many solutions already use
> a variable named `i`. Inside `cellStateRules`, write `idx == i` to mean "this cell is where pointer
> `i` is". (`flags` are evaluated once per step *before* cells, so they cannot use `idx`.)
>
> ⚠️ **Null-safety:** a variable not yet in scope this step reads as `null`/`undefined`; comparisons
> against it are false. `x != null` is true only when `x` actually has a value — handy to gate rules
> on "this var exists yet".
>
> ⚠️ **Line events fire *before* the line runs.** On the step for `res.append(...)`, `res` is still
> the *old* value; it updates on the next step. Phrase narration as "about to…" where relevant; the
> glide/ghost animates the change across the two steps.

### `mapping.json` fields
| Field | What it does |
|---|---|
| `primitive` | `"array"` or `"bar-container"` (others need a renderer first) |
| `valuesFrom` | variable name whose array becomes the cells |
| `pointers` | `[{name, var}]` — a gutter marker per pointer; only drawn when the var is a valid index. Lane & color follow list order (named `i/j/lo/hi` keep fixed hues). |
| `flags` | `{ name: expr }` — named booleans reused in any `when` |
| `cellStateRules` | ordered `[{state, when, onlyWhen?}]`; **first match wins** per cell; end with `{ "state":"idle", "when":"true" }` |
| `window` | `{from, to}` expressions → translucent tray (omitted if not finite) |
| `ghosts` | `{ track: [varNames] }` → smooth glide when a tracked pointer moves |
| `readout` | `{expr, relation?, relationColor?, when?}` → the chip above the stage; `expr`/`relation` are `{…}` templates; `relationColor` is a token key |
| `counters` | `[{name, when?, onLines?}]` → complexity meters; `timeOps` auto-sums; `spaceUnits` defaults 1 |
| `phaseRules` | `[{phase, lines, when?}]` → first match by line (optional guard); default `update` |
| `keyEvents` | `[{line?, when?, label, kind?}]` → scrubber diamonds; conditions are ANDed; `kind` ∈ `match·best·result·boundary·return` |

### CellState vocabulary (the only allowed `state` values)
`idle · current · compared · frontier · visited · result · path · special · error · dimmed · left · right`

### Phases
`init · loop · check · update · move · recurse · return · done`

---

## 5. Two complete worked examples to copy

- **Array + two pointers + brute:** [`seeds/problems/4sum/`](seeds/problems/4sum/) — the gold
  reference. Read both `approaches/sort-two-pointers/` and `approaches/brute-force/` to see how the
  same problem maps two different algorithms.
- **Bar-container (bespoke geometry):** the container-with-most-water mapping shows `derived.container`
  (water-fill geometry). *(Currently still on the legacy tracer; being converted to a bundle.)*

---

## 6. What needs an engineering task first

| You can author today (data only) | Needs a one-time renderer first |
|---|---|
| Arrays, strings (array primitive) | Linked lists, trees / BST, tries |
| Bar/height problems (bar-container) | Graphs, grids, heaps, hash-map view |
| Any pattern on the above (two pointers, sliding window, binary search, …) | Recursion tree / call-stack view, DP table |

If your problem needs a structure in the right column, flag it before authoring — the renderer is
built once, then that whole family becomes data-only like the array.

---

## 7. Authoring with Claude — a ready prompt

Paste this to Claude, filling the blanks:

> You are authoring a Knacktor problem bundle. Read `rules/Authoring.md` and `ADDING_PROBLEMS.md`
> and the reference bundle `seeds/problems/4sum/`. Create `seeds/problems/<slug>/` for **LeetCode
> #\<n> "\<title>"** with approaches: \<brute / optimal / …>. For each approach write a correct
> `solution.py` (class Solution, entrypoint `Solution.<method>`), then `approach.json`,
> `mapping.json`, and `narration.json` keyed to the real line numbers, plus a shared `presets.json`
> with ≥3 examples incl. ≥1 edge case and correct `expectedOutput`. Use only the array/bar-container
> primitives, the CellState vocabulary, and the expression DSL (cell index is `idx`, not `i`; only
> `min/max/len/abs`). After writing, run `python tracer/run.py …` to confirm line coverage, then
> `npm run ingest` and fix any validator errors until it passes.

---

## 8. Quick checklist before you commit

- [ ] `python tracer/run.py seeds/problems/<slug> <approach> <preset>` runs clean for each approach.
- [ ] `npm run ingest` ends with `✓ Ingest complete` (no validator aborts).
- [ ] Presets: ≥3, ≥1 edge case, correct `expectedOutput`; together they cover every branch.
- [ ] Every executable line has meaningful `byLine` narration; `byPhase` fallback present.
- [ ] `resultSpec.varName` points at the variable holding the answer.
- [ ] `mapping.json` references only real variables; `cellStateRules` ends with `when:"true"`.
- [ ] Stepped through every approach in `npm run dev` — code, vars, result, narration, picture in sync.
