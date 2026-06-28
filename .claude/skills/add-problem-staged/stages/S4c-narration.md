# S4c — `narration.json` + the S4 gate (`dry-run`)

**Input:** frozen numbered solution + S2 trace + the phase assignments from S4b's `mapping.json`.
**Output:** `authoring/<slug>/approaches/<id>/narration.json`.
**Gate:** `npm run dry-run -- authoring/<slug> <approachId>` is clean. This validates S4a + S4b + S4c
together (it builds the real trace, applies mapping + narration, and runs every contract check).

**Read [../reference/dsl-grammar.md](../reference/dsl-grammar.md)** — `when` guards and `{…}` placeholders
obey the same grammar.

## Author the narration

```jsonc
{
  "byLine": {
    "7": { "happening": "We compute complement as target - num ({target} - {num}).",
           "why": "If an earlier number equals complement, it plus num reaches target.",
           "invariant": "A valid pair ending at i must use complement from an earlier index." },
    "8": [   // branch line → array of variants; FIRST matching `when` wins; LAST has no `when`
      { "when": "len(result) > 0",
        "happening": "complement ({complement}) is in the map — the pair is found.",
        "why": "An O(1) lookup confirms an earlier number completes the pair.", "invariant": "…" },
      { "happening": "complement ({complement}) is not in the map yet.",
        "why": "No earlier number completes the pair; we'll store num and continue.", "invariant": "…" }
    ]
  },
  "byPhase": {
    "init":   { "happening": "…", "why": "…", "invariant": "…" },
    "loop":   { "happening": "…", "why": "…", "invariant": "…" },
    "update": { "happening": "…", "why": "…", "invariant": "…" },
    "check":  { "happening": "…", "why": "…", "invariant": "…" },
    "return": { "happening": "…", "why": "…", "invariant": "…" }
  }
}
```

## Rules

- `byLine`: one entry per **executable line** — `{ happening, why, invariant }`, all three non-empty,
  specific, meaningful. Never blank / `TODO` / `…` / `step N` (ingest rejects those). A missing executable
  line falls back to the generic `byPhase` and fails the gate.
- **Branch lines** (`if`/`while` headers, or any line whose meaning depends on a condition): use an array
  of variants; first whose `when` passes wins; the **last variant must have no `when`** (fallback).
- `byPhase`: one entry for **every phase** used in `mapping.json` — the safety net.
- `{…}` placeholders are DSL expressions (`{nums[i]}`, `{target - num}`, `{len(result)}`) — keep valid.
- **Timing:** line events fire BEFORE the line runs — on `x = f()`, `x` still holds its OLD value; phrase
  as "about to…" where it matters (a write shows on the next step).

## Gate — the full S4 validation

`npm run dry-run -- authoring/<slug> <approachId>`. It throws (with a precise location) on: a missing
`byLine` line, a banned/blank narration field, an invalid VisualState, an unreached `idle` catch-all, a
null-var surprise, a phase-boundary error (init after a loop), or No-Line-Left-Behind. Map the error to the
owning artifact (see the SKILL repair table) and fix only that slice; re-run until green.

When green for all approaches, set `state.stage = "S5"` and proceed to assemble + ingest.
