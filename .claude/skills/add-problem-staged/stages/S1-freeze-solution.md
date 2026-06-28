# S1 — Freeze the solution (per approach) → `solution.py` + `approach.json` stub

**Input:** the user's vetted, correct Python for THIS approach.
**Output:** `authoring/<slug>/approaches/<id>/solution.py` (FROZEN) + a minimal `approach.json` stub.
**Gate:** Python compiles. **🟦 Human Gate 1** (frozen-code review) — every downstream line number
depends on this.

## Your job: REFORMAT, not rewrite

The algorithm is given and correct. You only normalize it so the tracer emits one clean step per action.
**Do not change the logic.** If you believe the solution is wrong, STOP and ask the user — never silently "fix" it.

Reformatting rules (from `rules/Authoring.md` §5):
- One `class Solution` with the method named in the entrypoint. The tracer calls `Solution().<method>(**preset.value)`.
- **One statement per line.** No `a; b`. No list/dict/set comprehensions (expand to explicit loops). No
  multi-line expressions. No dense one-liners. Introduce named intermediate variables so each loop-relevant
  value has a name the mapping can later point at.
- Pure & deterministic: no `print`/`input`, no file/network, no randomness, no `time`.
- **Line numbers are load-bearing and start at 1**: `class Solution:` = 1, `def …` = 2, first body
  statement = 3, … Everything in S4 keys off these.
- Keep it readable and standard — this code is shown to the learner.

## approach.json stub (extended later in S3/S4a)

```jsonc
{
  "id": "optimal",                 // kebab; "brute-force" / "optimal" / "<algo>-<variant>"
  "kind": "optimal",               // brute | optimal | alternative
  "name": "<short human name, e.g. Hash Map of Seen Values>",
  "summary": "<one-line strategy>",
  "language": "python",
  "entrypoint": "Solution.<method>",
  "complexity": { "time": "O(...)", "space": "O(...)" }
}
```

## Gate

- `python -c "compile(open(r'<path>/solution.py').read(), 'solution.py', 'exec')"` exits 0.
- Quick self-check: no `;`, no comprehensions, one statement per line.

## 🟦 Human Gate 1 — STOP and show the user

1. The numbered `solution.py` (show real line numbers).
2. A semantics-preserving diff vs. their pasted original — confirm you only reformatted (no logic change).
3. The `entrypoint` and the parameter names (these must match preset `value` keys in S2).

Ask: **"Is this the exact code to freeze? Everything downstream keys off these line numbers."** Wait for
explicit approval. On approval: record `frozenHash` (sha256 of solution.py) + `entrypoint` in state.json,
set the approach `stage = "S2"`, mark `humanGates.frozenCode.<id> = "approved"`.
