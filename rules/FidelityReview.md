# Simulation Fidelity Review — Gate 2 (D15)

> **Status:** canonical. This is the **second mandatory gate** for every problem. Gate 1 is
> `npm run ingest` (mechanical correctness). Gate 2 is this review — a **semantic judgment** that the
> animation truly represents the algorithm. **A problem ships only after passing BOTH.**
> **Passing ingest is necessary but NOT sufficient** (see [Rules.md](Rules.md) §4.1).

## Why this gate exists

Ingest can prove a trace is *structurally* sound — every line emits a step, narration is non-empty,
the traced output matches `expectedOutput`, the DSL parses. It **cannot** tell whether the picture the
learner sees actually *is* the algorithm. A trace can be 100% valid and still teach the wrong mental
model.

**Worked failure — Longest Common Prefix.** It passed ingest, but the mapping drew each *whole string*
(`"flower"`, `"flow"`, `"flight"`) as one array cell and moved pointers by *string index*. The
algorithm's real work — comparing the **character at column `i`** across strings, growing the prefix
one char at a time — was invisible. Structurally valid, pedagogically wrong. That is exactly what this
gate must catch.

## The core principle — "unit of work"

> **The visual's unit of work must equal the algorithm's unit of work.**

Identify the smallest thing the algorithm repeatedly *does*, and confirm the animation makes exactly
that thing visible and central:

| If the algorithm's core operation is… | the visual MUST show… |
|---|---|
| comparing two array elements | those two elements, highlighted, in the array |
| comparing characters at a column | the **characters** (a char row / grid), not whole strings |
| moving a pointer / shrinking a window | the pointer move / the window boundary changing |
| pushing/popping a stack | the stack growing/shrinking |
| visiting a node / edge | that node/edge lighting up in the structure |
| filling a DP cell from neighbors | the cell + the source cells it reads |

If the primitive on hand can't show that unit of work, the problem is **not authorable yet** — defer
it (see "Verdict: DEFER" below). Never approximate it with a misleading primitive.

## The review process (how Claude / a reviewer runs Gate 2)

The author brings the filled bundle (or combined JSON). The reviewer:
1. **Reads the `solution.py`** and states, in one sentence, the algorithm's unit of work.
2. **Mentally executes** a representative preset (and an edge case) line by line.
3. For ~3–4 pivotal steps (a comparison, a pointer move, the key event, the result), checks the
   produced **`visual` + `narration` + highlighted line** against the criteria below.
4. Returns a **verdict** (PASS / REVISE / DEFER) with specific, actionable findings.

## Fidelity criteria (every one must hold)

1. **Right primitive.** The chosen `primitive` matches the structure the algorithm actually
   manipulates, and its cells represent the algorithm's unit of work (see the table above).
2. **Operations are visible.** Each meaningful step produces a visible change that depicts that step's
   operation — the comparison, move, write, or decision is *shown*, not merely narrated.
3. **Pointers are real cursors.** Every pointer corresponds to an actual algorithm cursor and sits
   where the code's index variable points; it moves when (and only when) the code moves it.
4. **Cell-states are semantically honest.** `current`/`compared`/`result`/`visited`/`dimmed`/… mark the
   right elements at the right moments (e.g. `result` only on confirmed answers, `dimmed` only on
   genuinely-excluded regions). No element is colored for decoration.
5. **Readout & result reflect true state.** Any stage readout/result panel shows the algorithm's real
   running values at that step (not a stale or cosmetic value).
6. **Narration matches the moment.** `happening`/`why`/`invariant` describe the *same* operation the
   highlighted line and the visual show — including the before-the-line-runs timing (a write shows on
   the next step).
7. **Motion explains.** Glides/ghosts/flashes correspond to real value/pointer movement; nothing moves
   that didn't change.
8. **Key events are meaningful.** Diamonds land on real algorithmic milestones (a match, a new best,
   the boundary that ends the search, the return) — not arbitrary steps.
9. **Both approaches are faithful** (brute and optimal), each on its own terms.
10. **An edge case still reads correctly** (empty/single/no-solution doesn't produce a confusing or
    empty-looking stage).

## Verdicts

- **PASS** — all criteria hold; accept the problem.
- **REVISE** — the primitive is right but the mapping/narration misrepresents something; return the
  specific findings (which step, which field, what's wrong, the fix). Author edits and re-submits both
  gates.
- **DEFER** — the algorithm's unit of work cannot be shown by the existing primitives
  (`array`, `bar-container`). Do **not** ship. Record what renderer is needed (e.g. char-grid, linked
  list, tree, graph, DP table) so it can be built as a one-time engine task; the problem is authored
  after that.

## Reviewer output format

```
FIDELITY REVIEW — <slug>
Unit of work: <one sentence>
Verdict: PASS | REVISE | DEFER
Findings:
  - [approach/step/field] <what's wrong> → <fix>
  - …
(If DEFER) Needed renderer: <name> — <why the current primitives can't represent the unit of work>
```

## Standing consequence

Any problem already in the DB that fails this gate must be **removed or rebuilt** before launch — a
green ingest does not grandfather a misleading visual. (As of D15: **Longest Common Prefix** is a known
DEFER — its character-column comparison needs a char-grid renderer; the current array-of-strings bundle
should not ship as-is.)
