# Working directory + `state.json`

In-progress authoring lives in `authoring/<slug>/` (git-ignored). It mirrors the seed bundle layout so
the gate commands run against it directly. The final bundle lands in `seeds/problems/<slug>/` only at S5
(via `import-problem`).

```
authoring/<slug>/
  state.json                       # the pipeline state machine (below)
  problem.json                     # S0
  presets.json                     # S2 (expectedOutput auto-filled from the trace)
  approaches/<id>/
    solution.py                    # S1 (frozen)
    approach.json                  # built up across S1 → S3 → S4a
    mapping.json                   # S4b
    narration.json                 # S4c
  combined.json                    # assembled at S5 (transient)
```

## `state.json`

Write it after every stage and every gate so a new session can resume at `stage`. Convert any relative
dates to absolute when noting them.

```jsonc
{
  "slug": "two-sum",
  "number": 1,
  "stage": "S4b",                         // current problem-level stage
  "humanGates": {
    "frozenCode": { "optimal": "approved" },   // Gate 1 — pending | approved | rejected, per approach
    "primitive":  { "optimal": "approved" },   // Gate 2 (light primitive pre-check)
    "preview":    "pending"                    // Gate 3 — review-sheet GREEN | revise | defer
  },
  "approaches": {
    "optimal": {
      "kind": "optimal",
      "stage": "S4b",
      "frozenHash": "<sha256 of solution.py>",  // detects an S1 re-freeze → marks S3/S4 stale
      "entrypoint": "Solution.twoSum",
      "executableLines": [3,4,5,6,7,8,9,10,11], // from S2 trace; frozen
      "primitive": "hashmap",
      "gates": { "trace": "pass", "lint": "pass", "dryRun": "pass", "liveness": "pass" }
    }
  },
  "presetsTracedAt": "<sha256 of presets.json + all solution.py>",  // invalidate trace cache on change
  "deferred": null                         // or { "neededRenderer": "...", "reason": "..." } if Gate 2 DEFER
}
```

Rules:
- `frozenHash` mismatch (the code changed after freeze) ⇒ the line numbers may have moved ⇒ mark that
  approach's `S3`/`S4*` artifacts stale and redo them. This only happens on an explicit S1 re-freeze.
- A second approach added later gets its own entry under `approaches`; `problem.json`/`presets.json` are
  shared. S2 coverage re-runs for the new approach and may append presets.
- On Gate 2 DEFER, set `deferred` and stop — the problem is authored after the needed renderer is built.
