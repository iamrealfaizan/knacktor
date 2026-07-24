# S1 — Freeze the solution (per approach) → `solution.py` + `approach.json` stub

**Input:** the user's vetted, correct Python for THIS approach.
**Output:** `authoring/<slug>/approaches/<id>/solution.py` (FROZEN) + a minimal `approach.json` stub.
**Gate:** Python compiles. **🟦 Human Gate 1** (frozen-code review) — every downstream line number
depends on this.

## Your job: REFORMAT (or AUTHOR), not rewrite

- **If the user gave the solution:** you only normalize it so the tracer emits one clean step per action.
  **Do not change the logic.** If you believe it's wrong, STOP and ask — never silently "fix" it.
- **If the user gave only the question/test cases:** author the **standard interview solution** for this
  approach (brute for the brute lane, optimal for the optimal lane). Correctness is now *your*
  responsibility — it will be verified at Gate A / S2 against the known answers, and flagged at Gate 1 as
  not-user-vetted.

Do this for **both** approaches (brute + optimal) — never freeze only one (D23; single-approach needs the
user's recorded Gate-1 approval).

Reformatting rules (from `rules/Authoring.md` §5 + §0.1-A):
- One `class Solution` with the method named in the entrypoint. The tracer calls `Solution().<method>(**preset.value)`.
- 🔴 **LeetCode-runnable & verbatim signature.** Use LeetCode's exact method name, parameter names/order,
  and return shape, so the copied code runs on LeetCode as-is. LeetCode-injected APIs (`isBadVersion`,
  `guess`, `read4`, provided `ListNode`/`TreeNode`/`Node`) come from the tracer run-harness — **never add
  a parameter for them.** If the traced form can't keep the verbatim signature (multi-call design class),
  author a copy-safe `leetcodeSource` (dual code) and note it for the copy button.
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

Show this for **both approaches** (brute + optimal):

1. The numbered `solution.py` (show real line numbers).
2. Either a semantics-preserving diff vs. their pasted original (**solution-provided** — confirm you only
   reformatted), **or** a clear **"Claude-authored — not user-vetted"** banner (**question-only**).
3. **LeetCode-compat check:** the exact `class Solution` signature LeetCode expects; no undefined
   references (injected APIs come from the harness); `leetcodeSource` shown if dual code was needed.
4. **Per-test verification:** every preset (incl. edge cases) traced, with each `finalResult` shown beside
   its **known expected answer** (from LeetCode's examples) — all must match. (Do NOT rely on S2's
   auto-fill for author-written code; the expected answer must be the *independently known* one.)
5. The `entrypoint` and the parameter names (these must match preset `value` keys in S2).

**Two-approach gate:** if only one approach exists, STOP — ask the user to let you author the other, or to
explicitly approve a single-approach exception. Record the choice in `state.json`
(`humanGates.singleApproachException = { approved, reason }`). Never proceed optimal-only without it.

Ask: **"Is this the exact code to freeze — both approaches, LeetCode-runnable, all tests matching?
Everything downstream keys off these line numbers."** Wait for explicit approval. On approval: record
`frozenHash` (sha256 of solution.py) + `entrypoint` per approach in state.json, set the approach
`stage = "S2"`, mark `humanGates.frozenCode.<id> = "approved"`.
