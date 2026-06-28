# S4b — `mapping.json` (variables → picture)

**Input:** frozen numbered solution + S2 trace (vars + per-step values + executableLines) + approved
primitive/intent from S3.
**Output:** `authoring/<slug>/approaches/<id>/mapping.json`.
**Gate:** `npm run lint-dsl -- authoring/<slug> <approachId>` is clean.

**Read [../reference/dsl-grammar.md](../reference/dsl-grammar.md) first.** Author every expression to that
grammar — `lint-dsl` rejects slices, `and/or/not`, `.method()`, `in`, and any variable not in the trace.

## Build the spec for the chosen primitive only

Use the primitive-specific fields from `rules/Authoring.md` §3 (or `lib/tracer/CLAUDE.md`). Common shape:

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
    { "phase": "init",   "lines": [3,4] },
    { "phase": "loop",   "lines": [5] },
    { "phase": "update", "lines": [6,7,9,11] },
    { "phase": "check",  "lines": [8] },
    { "phase": "return", "lines": [10] }
  ],
  "keyEvents": [{ "line": 9, "label": "Complement found", "kind": "match" },
                { "line": 10, "label": "Final answer", "kind": "return" }],
  "auxMappings": [ /* secondary structures (D19); omit pipeline fields here */ ]
}
```

## Load-bearing rules

- `cellStateRules` / `nodeStateRules` / `highlightRules` are ordered, first-match-wins, and MUST end with
  an `idle` catch-all (`"when"/"whenKey": "true"`) so every cell/node resolves.
- `pointers[].var` (and `resultSpec.varName`) must be REAL trace variables holding an integer index. Never
  invent a variable — `lint-dsl` flags it.
- `idx` is the cell index in `cellStateRules`, NOT the loop var `i` — write `idx == i` to color cell `i`.
- **phaseRules covers every executable line.** `init` only for lines that run once before the first loop;
  a line after any loop header that resets state → `update`, that advances a second-pass pointer → `move`.
  (`lint-dsl` won't catch a phase-boundary error, but `dry-run` at S4c will.)
- `keyEvents`: mark only meaningful moments (a match / new-best + the return), not every step.
- Add an `auxMappings` entry for any real secondary structure (stack/queue/hashmap/result array) — don't
  fake it with a `readout` text chip.

## Gate

`npm run lint-dsl -- authoring/<slug> <approachId>` → fix each reported `slot :: expr :: reason` until
clean. Then proceed to S4c. (phaseRules-coverage, idle catch-all reachability, and null-var surprises are
confirmed by `dry-run` at S4c.)
