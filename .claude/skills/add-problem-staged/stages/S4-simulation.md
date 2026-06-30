# S4 — The simulation (authored LAST): `mapping.json` + `narration.json`

**Author this only after S0–S3 + S4a are done and gated** — metadata, frozen code, presets, line & syntax
explanations all exist, so you build the animation with every detail in front of you. mapping + narration
are authored together because they're coupled: `narration.byPhase` must cover exactly the phases
`mapping.phaseRules` defines.

**Input:** frozen numbered solution + the S2 trace (vars + per-step values + executableLines) + the
approved primitive/intent from S3 + the line explanations from S4a.
**Output:** `authoring/<slug>/approaches/<id>/mapping.json` and `narration.json`.
**Gate:** `npm run lint-dsl -- authoring/<slug> <id>` clean → `npm run dry-run -- authoring/<slug> <id>`
clean. The dry-run validates mapping + narration + explanations together AND runs the **liveness**
fidelity gate (a static/boring animation is blocked here, before the human preview).

**Read [../reference/dsl-grammar.md](../reference/dsl-grammar.md) first.** Every expression must obey it —
`lint-dsl` rejects slices, `and/or/not`, `.method()`, `in`, and any variable not in the trace.

## 4a (recap) — explanations are already done

By now `approach.json` has `lineExplanations` (every executable line) + `syntaxExplanations` (every line
1..N). If not, finish [S4a-explanations.md](S4a-explanations.md) before the animation.

## 4b — `mapping.json` (variables → picture)

Use the primitive-specific fields from `rules/Authoring.md` §3 (or `lib/tracer/CLAUDE.md`). Shape:

```jsonc
{
  "primitive": "hashmap",
  "keysFrom": "num_map", "valuesFrom": "num_map",
  "highlightRules": [
    { "state": "result",  "whenKey": "k == complement && foundComplement" },
    { "state": "current", "whenKey": "k == num" },
    { "state": "idle",    "whenKey": "true" }            // ← catch-all required
  ],
  "flags": { "foundComplement": "len(result) > 0" },
  "pointers": [{ "name": "i", "var": "i" }],             // var must hold an integer index, real in trace
  "readout": { "when": "phase != 'return'", "expr": "need complement = {complement}" },
  "counters": [{ "name": "lookups", "onLines": [8] }],
  "phaseRules": [
    { "phase": "init", "lines": [3,4] }, { "phase": "loop", "lines": [5] },
    { "phase": "update", "lines": [6,7,9,11] }, { "phase": "check", "lines": [8] },
    { "phase": "return", "lines": [10] }
  ],
  "keyEvents": [{ "line": 9, "label": "Complement found", "kind": "match" },
                { "line": 10, "label": "Final answer", "kind": "return" }],
  "auxMappings": [ /* secondary structures (D19); omit pipeline fields here */ ]
}
```

Load-bearing rules:
- `cellStateRules`/`nodeStateRules`/`highlightRules` are ordered, first-match-wins, and MUST end with an
  `idle` catch-all (`"when"/"whenKey": "true"`).
- `pointers[].var` and `resultSpec.varName` must be REAL trace variables; pointer vars hold integer indices.
- `idx` is the cell index in `cellStateRules`, NOT the loop var — write `idx == i` to color cell `i`.
- `phaseRules` covers every executable line; `init` only for lines before the first loop (reset → `update`,
  second-pass pointer → `move`).
- Add an `auxMappings` entry for any real secondary structure — don't fake it with a `readout` chip.
- **Make the work visible (liveness).** The stage must move: a pointer that advances, a cell that changes
  state, a structure that grows. A mapping where nothing ever leaves `idle` and no value changes is a dead
  animation — the liveness gate blocks it. Make the algorithm's unit of work the thing that animates.

## 4c — `narration.json`

```jsonc
{
  "byLine": {
    "7": { "happening": "We compute complement as target - num ({target} - {num}).",
           "why": "If an earlier number equals complement, it plus num reaches target.",
           "invariant": "A valid pair ending at i uses complement from an earlier index." },
    "8": [   // branch line → variants; first matching `when` wins; LAST has no `when`
      { "when": "len(result) > 0", "happening": "complement ({complement}) is in the map — pair found.",
        "why": "An O(1) lookup confirms an earlier number completes the pair.", "invariant": "…" },
      { "happening": "complement ({complement}) is not in the map yet.",
        "why": "No earlier number completes the pair; we store num and continue.", "invariant": "…" }
    ]
  },
  "byPhase": { "init": {…}, "loop": {…}, "update": {…}, "check": {…}, "return": {…} }
}
```
- `byLine`: one `{ happening, why, invariant }` per executable line — all non-empty, specific. Never
  blank / `TODO` / `…` / `step N`. Branch lines use a variants array; the last variant has no `when`.
- `byPhase`: one entry per phase used in `mapping.json`.
- `{…}` placeholders are DSL expressions; keep valid. Timing: events fire BEFORE the line runs (on
  `x = f()`, `x` still holds the OLD value) — phrase as "about to…" where it matters.

## Gate

1. `npm run lint-dsl -- authoring/<slug> <id>` → fix each `slot :: expr :: reason` until clean.
2. `npm run dry-run -- authoring/<slug> <id>` → fix any thrown error (missing byLine line, invalid
   VisualState, unreached catch-all, phase boundary, **liveness**) — see the SKILL repair table. The
   liveness failure message names the cause (dead stage / empty `…From` var / motionless pointer).

When green for all approaches, set `state.stage = "S5"` and proceed to the preview review.
