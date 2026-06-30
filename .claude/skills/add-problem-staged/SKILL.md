---
name: add-problem-staged
description: Add a new Knacktor problem through the staged, gated authoring pipeline (S0-S5) ending live in MongoDB at /problems/<slug>. Use when the user pastes a LeetCode problem plus their own vetted Python solution and wants it added to the platform, or wants to add a second approach to an existing problem. Orchestrates the deterministic gates (trace-approach, lint-dsl, dry-run, import, ingest) and pauses at three human review checkpoints. Replaces pasting the 32KB ADDING_PROBLEMS.md monolith.
---

# Add a Knacktor problem — staged pipeline

You (Claude Code) are the **orchestrator AND the author**. You run the deterministic gates, author each
artifact, pause at the human gates, and track progress in `authoring/<slug>/state.json`. The user
supplies a **vetted, correct** Python solution — you never have to invent the algorithm, only reformat,
trace, choose the visual, and write the explanations.

## Why staged (read once)

The old flow asked one LLM pass to produce a 32KB combined JSON whose line numbers, `expectedOutput`,
executable-line coverage, and per-step variable values were all **mentally simulated** — then `ingest`
checked the homework and aborted late on any error. The fix: **freeze the code, then TRACE it** so those
facts are computed by the real interpreter, and gate every stage before the next. Nothing keyed to line
numbers (lineExplanations, syntaxExplanations, mapping line refs, phaseRules, keyEvents, narration.byLine)
is authored until **after** the solution is frozen and traced (S2 is the pivot).

## The deterministic gates (built; run from `knacktor/`)

| Gate | Command | Proves |
|---|---|---|
| **A** trace-only | `npm run trace-approach -- <bundleDir> [approachId] [presetId]` | real executable lines, per-step vars, finalResult, coverage gap (no mapping/narration needed) |
| **B** DSL lint | `npm run lint-dsl -- <bundleDir> [approachId]` | every DSL expr/template/`…From` field parses + references only real trace vars |
| **C** dry-run | `npm run dry-run -- <bundleDir> [approachId]` | full buildTrace + validateTrace + No-Line-Left-Behind + **liveness** (fidelity), **no Mongo** |
| **D** review-sheet | `npm run review-sheet -- <bundleDir> [approachId]` | renders the REAL frames into `review.html` (the human preview) — no Mongo |
| ingest | `npm run import-problem -- <combined.json> [--force]` then `npm run ingest` | splits to seeds/, then traces + validates + writes Mongo |

A green `dry-run` means `ingest`'s gates will pass — it runs the exact same `dryRunApproach` (incl. the
liveness fidelity gate). The liveness gate blocks static/boring animations; a reviewed legacy exemption
lives in `seeds/liveness-exempt.json` (new problems are never auto-exempted).

## Working directory (git-ignored)

All in-progress work lives in `authoring/<slug>/`, which **mirrors the seed bundle layout** so the gate
commands point straight at it. The final bundle still lands in `seeds/problems/<slug>/` via the normal
import → ingest path. See [reference/state-schema.md](reference/state-schema.md) for the layout and the
`state.json` schema. Read/write `state.json` after every stage so the run is resumable across sessions.

```
authoring/<slug>/
  state.json
  problem.json
  presets.json
  approaches/<id>/{ solution.py, approach.json, mapping.json, narration.json }
  combined.json            # assembled at S5
```

## The stages

Each stage = author the artifact (follow its stage file), then **run its gate**, then update `state.json`.
S0–S2 are problem-level / line-number-free; S3–S4 run per approach. Read each stage file before doing it.

**Author the ANIMATION last.** Everything non-visual (metadata, frozen code, presets, line + syntax
explanations) is authored and gated *first*, so when you finally build the simulation you have every
detail in front of you and miss nothing. The mapping+narration are the last creative act, then the human
reviews a **real-frame preview** and gives GREEN or asks for changes — *before* anything is ingested.

| Stage | Do | Stage file | Gate | Human gate |
|---|---|---|---|---|
| **S0** | metadata + taxonomy → `problem.json` | [stages/S0-intake.md](stages/S0-intake.md) | taxonomy slugs valid (check `seeds/{difficulties,topics,patterns}.json`) | — |
| **S1** | reformat vetted code to one-stmt-per-line → `solution.py` + `approach.json` stub | [stages/S1-freeze-solution.md](stages/S1-freeze-solution.md) | `python -c "compile"` ok | 🟦 **Gate 1** |
| **S2** | ≥3 presets (≥1 edge) → `presets.json`; **auto-fill expectedOutput from the trace** | [stages/S2-presets.md](stages/S2-presets.md) | `trace-approach` → 0 coverage gap; fill expectedOutput from reported finalResult | — |
| **S3** | pick the primitive (+resultSpec, varColors, visualizationIntent) → extend `approach.json` | [stages/S3-primitive.md](stages/S3-primitive.md) | vars exist in trace; primitive ∈ 10; tokens not hex | 🟦 **Gate 2 (light)** |
| **S4a** | lineExplanations + syntaxExplanations → extend `approach.json` | [stages/S4a-explanations.md](stages/S4a-explanations.md) | completeness (every exec line / every line 1..N) | — |
| **S4** | the SIMULATION, authored LAST: `mapping.json` + `narration.json` together | [stages/S4-simulation.md](stages/S4-simulation.md) | `lint-dsl` clean → `dry-run` clean (validates mapping+narration+explanations AND the **liveness** fidelity gate) | — |
| **S5** | render the preview, human signs off, then assemble + import + ingest | [stages/S5-preview-review.md](stages/S5-preview-review.md) | `review-sheet` → human GREEN → `import-problem` + `ingest` | 🟦 **Gate 3 (preview)** |

> S2 freezes the line numbers and the variable universe. Do not start S4 (the animation) until S3's
> primitive is approved AND S4a explanations are done — a wrong primitive or missing content wastes the
> animation work. The `dry-run` gate at S4 includes the **liveness** check, so a static/boring animation
> is blocked here, before the human ever sees the preview.

## S5 — Preview review, then assemble + import + ingest

The simulation is built but NOTHING is ingested yet. First the human signs off on the real animation;
only then do we write to Mongo. Because the preview renders from the SAME `VisualState`s ingest will
store, **the preview is exactly what ships** — no live/preview drift.

1. **Render the preview:** `npm run review-sheet -- authoring/<slug>` → writes `authoring/<slug>/review.html`,
   a self-contained filmstrip of the real rendered frames + code line + narration + liveness report +
   the FidelityReview checklist.
2. **Publish + present (Gate 3):** publish `review.html` as a claude.ai Artifact (via the Artifact tool;
   it's a self-contained fragment) and give the user the link. **STOP — wait for GREEN or REVISE.**
3. **On GREEN → assemble + ingest.** Build `combined.json` mechanically — no new content:
   - **Top level** ← all `problem.json` fields + `"presets"` ← the `presets.json` array (omit
     `hasVisualization`/`supportsCompare`; `import-problem` derives them).
   - **`approaches`** ← for each `approaches/<id>/`: every field of `approach.json`, plus
     `"solution"` = `solution.py` text, `"mapping"` = `mapping.json`, `"narration"` = `narration.json`.
   ```bash
   npm run import-problem -- authoring/<slug>/combined.json   # add --force if the slug already exists (2nd approach)
   npm run ingest                                             # traces + validates + writes Mongo
   ```
   Since `dry-run` (incl. liveness) already passed, ingest's gates pass. Bundle lands in
   `seeds/problems/<slug>/`; the problem is live at `/problems/<slug>` — and matches the approved preview.
   A quick `npm run dev` smoke (the page loads) is enough; the visual sign-off already happened.
4. **On REVISE →** edit only `mapping.json`/`narration.json` per the user's notes, re-run `dry-run`, then
   `review-sheet`, and re-present. Loop until GREEN.

## The three human gates — STOP and wait for the user

**🟦 Gate 1 — Frozen code (after S1).** Every downstream line number depends on this. Show:
- the numbered `solution.py` (line 1 = `class Solution:`, line 2 = `def …`, first body = line 3),
- a semantics-preserving diff vs. the pasted original (you only reformatted; you changed no logic),
- the entrypoint (`Solution.<method>`).
Ask: *"Is this the exact code to freeze? Everything downstream keys off these line numbers."* Wait.

**🟦 Gate 2 — Primitive pre-check (after S3, LIGHT).** A quick sanity check before building the animation —
the *real* frames come at Gate 3, so this is short, not the full ASCII packet. State: the algorithm's
**unit of work** (one sentence), the **recommended primitive**, and a one-line why-its-cells-match. Flag
if `custom`/DEFER may apply. Ask *"Proceed with `<primitive>`? Different, or DEFER?"* Wait. On DEFER,
record `{unsupported, neededRenderer}` in state.json and STOP. (Catching a wrong primitive here avoids
authoring a whole mapping on it.)

**🟦 Gate 3 — Animation preview (after S4, BEFORE ingest).** The authoritative visual sign-off. Render the
real-frame review sheet (`review-sheet`), publish it as an Artifact, and present the link. The human
reviews the actual rendered animation against the FidelityReview checklist and returns a verdict in
`rules/FidelityReview.md`'s format: **GREEN** (PASS) → assemble + ingest; **REVISE** → edit
mapping/narration, re-`dry-run`, re-`review-sheet`, re-present; **DEFER** → stop, record needed renderer.
This replaces the old post-ingest live review — because the preview renders the same VisualStates ingest
stores, approving the preview approves what ships.

## Repair loop (when a gate fails)

Gates print a precise, machine-readable location. Map it to the owning artifact and re-do ONLY that
slice — never re-author the whole problem. Re-run the SAME gate until green. Budget ~3 targeted retries,
then surface to the user with the error + diff. Because line numbers freeze at S2, an S4 repair never
shifts them (no cascade); only re-freezing the code at S1 can, which invalidates downstream S3/S4 — mark
them stale in state.json and redo (rare, gated by the user at Gate 1).

| Gate failure | Re-do | Scope |
|---|---|---|
| taxonomy slug unknown | S0 | the one field |
| python won't compile / multi-stmt line | S1 | that line (re-approve Gate 1) |
| `trace-approach` coverage gap | S2 | add a preset that reaches the named line/branch |
| `lint-dsl` syntax / unknown var | S4 | only that expression (mapping or narration slot) |
| `dry-run` missing byLine line N | S4 | only `narration.byLine[N]` |
| `dry-run` invalid VisualState / no idle catch-all / null var | S4 | the mapping rule reading that var / the catch-all |
| `dry-run` phase boundary (init after loop) | S4 | only those phaseRules entries |
| `dry-run` **liveness** (dead/static/empty-aux/motionless pointer) | S4 | make the work visible — add cellStateRules, move pointers, fix the empty `…From` var (the message names which) |
| Gate 3 **REVISE** (human asks for changes) | S4 | edit mapping/narration per notes → re-`dry-run` → re-`review-sheet` |
| `ingest` expected-output mismatch | should be impossible (S2 auto-fills from trace) → re-run S2 | — |

## Adding a 2nd approach later (optimal-first is the default)

Re-open `authoring/<slug>/` (or copy the shipped bundle back from `seeds/problems/<slug>/`). Add
`approaches/<newId>/` and run S1→S4 for ONLY the new approach. `problem.json` already exists; S2's
coverage gate re-runs for the new approach and may **append** presets (never replace existing ones —
both approaches must pass coverage on the shared preset set). At S5, assemble `combined.json` with BOTH
approaches and run `npm run import-problem -- <file> --force` (the slug exists) then `npm run ingest`;
`supportsCompare` flips to true automatically. The first approach's artifacts are reused byte-for-byte.

## Hard rules (never violate)

- The user's pasted solution is the source of truth — **reformat, never rewrite the algorithm**. If you
  think it's wrong, stop and ask; don't silently "fix" it.
- **Freeze before trace** — do not author anything line-keyed until S2's trace exists.
- Never hand-write a trace / step array (D9). Traces come only from the Python tracer.
- **Never ship a misleading visual** (D15). A structurally-valid but pedagogically-wrong animation is
  worse than none — DEFER at Gate 2 or Gate 3.
- Don't author straight into `seeds/problems/` — that's where `ingest` globs; keep work in `authoring/`
  until S5.
- Canonical authority: `rules/Authoring.md` (DSL), `rules/FidelityReview.md` (Gate 2), `rules/Schema.md`
  (data contracts), `lib/tracer/CLAUDE.md` (DSL grammar). Cite sections when in doubt.
- The shared DSL grammar is in [reference/dsl-grammar.md](reference/dsl-grammar.md) — read it before S4.
- **Author the animation last** — never build `mapping.json`/`narration.json` until S0–S3 + S4a are done
  and gated. The liveness gate (in `dry-run`) blocks dead/static animations before the human preview.
