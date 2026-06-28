# DSL grammar (shared mini-include for S4b / S4c)

Every `when` / `onlyWhen` / `flags` / `keyEvents.when` / `phaseRules.when` / `derived` / `window` value,
and every `{…}` placeholder in `readout` and `narration`, is one of these mini-expressions. The
`lint-dsl` gate rejects anything outside this grammar, so author to it exactly.

## ALLOWED — and nothing else

- literals: numbers, `'single-quoted strings'`, `true`, `false`, `null`
- operators: `+ - * / %`, `== != < <= > >=`, `&& || !`, ternary `? :`, parentheses
- single-element indexing / member access: `values[idx]`, `nums[i]`, `strs[j][i]`, `obj.field`
- functions — ONLY: `min`, `max`, `len`, `abs`

## FORBIDDEN (lint-dsl will flag, with the slot + reason)

- ❌ slices of any kind: `s[:k]`, `a[i:j]`, `prefix[:-1]` — no `:` slice exists. (Slicing in the Python
  *solution* is fine; never in a DSL expression. Rephrase via a flag or a precomputed variable.)
- ❌ Python keywords `and` / `or` / `not` — use `&&`, `||`, `!`.
- ❌ method calls / attributes: `.append(...)`, `.startswith(...)`, `.length`, `.upper()`.
- ❌ comprehensions, lambdas, any function other than `min/max/len/abs`.
- ❌ the `in` operator (`x in seen`) — use `len(seen) > 0` as a proxy, or a phase guard.
- ❌ referencing a variable that is not a real solution variable at that step (reads as `null` → silent
  wrong state). `lint-dsl` knows the real variable universe from the trace and flags invented names.

## Scope each expression sees

| Name | Meaning |
|---|---|
| any solution variable | its REAL value this step (from the trace) |
| `<name>_prev` | that variable's value on the PREVIOUS step (e.g. `area > mx_prev`) |
| `idx` | current **cell index** in `cellStateRules` (0..len-1) — NOT the loop var `i`. To color the cell where `i` sits, write `idx == i`. |
| `values` | the array chosen by `valuesFrom` |
| `phase` | this step's phase string |
| `k` | the key being evaluated in hashmap `highlightRules.whenKey` |
| `node_id` / `node_idx` | the node being evaluated in tree/graph `nodeStateRules.when` |
| `r`, `c` | row/col being evaluated in grid `cellStateRules` |
| your `flags` | the booleans you defined (flags run before cells, so flags can't use `idx`) |

## Vocabularies

- **CellState** (the only allowed `state`/`whenKey` state values): `idle, current, compared, frontier,
  visited, result, path, special, error, dimmed, left, right`. `cellStateRules` / `nodeStateRules` /
  `highlightRules` MUST end with an `{ "state": "idle", "when": "true" }` (or `"whenKey": "true"`) catch-all.
- **varColors** token keys (never hex): `ptr-i, ptr-j, ptr-lo, ptr-hi, special, result, amber, compared,
  current, error, gold`.
- **phase** ∈ `init, loop, check, update, move, recurse, return, done`. `init` = runs ONCE before the
  first loop; any line after a loop header is never `init` (reset → `update`, second-pass pointer → `move`).
- **keyEvent kind** ∈ `match, best, result, boundary, return`.

## Timing caveat

Line events fire **before** the line runs. On the step for `x = f()`, `x` still holds its OLD value; the
new value appears on the NEXT step. Phrase narration as "about to…" where relevant.
