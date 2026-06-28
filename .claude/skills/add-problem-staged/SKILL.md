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
| **C** dry-run | `npm run dry-run -- <bundleDir> [approachId]` | full buildTrace + validateTrace + No-Line-Left-Behind, **no Mongo** |
| Gate 1 | `npm run import-problem -- <combined.json> [--force]` then `npm run ingest` | splits to seeds/, then traces + validates + writes Mongo |

A green `dry-run` means `ingest`'s Gate 1 will pass — it runs the exact same `dryRunApproach`.

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

| Stage | Do | Stage file | Gate | Human gate |
|---|---|---|---|---|
| **S0** | metadata + taxonomy → `problem.json` | [stages/S0-intake.md](stages/S0-intake.md) | taxonomy slugs valid (check `seeds/{difficulties,topics,patterns}.json`) | — |
| **S1** | reformat vetted code to one-stmt-per-line → `solution.py` + `approach.json` stub | [stages/S1-freeze-solution.md](stages/S1-freeze-solution.md) | `python -c "compile"` ok | 🟦 **Gate 1** |
| **S2** | ≥3 presets (≥1 edge) → `presets.json`; **auto-fill expectedOutput from the trace** | [stages/S2-presets.md](stages/S2-presets.md) | `trace-approach` → 0 coverage gap; fill expectedOutput from reported finalResult | — |
| **S3** | pick primitive, resultSpec, varColors, visualizationIntent → extend `approach.json` | [stages/S3-primitive.md](stages/S3-primitive.md) | vars exist in trace; primitive ∈ 10; tokens not hex | 🟦 **Gate 2** |
| **S4a** | lineExplanations + syntaxExplanations → extend `approach.json` | [stages/S4a-explanations.md](stages/S4a-explanations.md) | completeness (every exec line / every line 1..N) | — |
| **S4b** | `mapping.json` | [stages/S4b-mapping.md](stages/S4b-mapping.md) | `lint-dsl` clean | — |
| **S4c** | `narration.json` | [stages/S4c-narration.md](stages/S4c-narration.md) | `dry-run` clean (this validates 4a+4b+4c together) | — |
| **S5** | assemble `combined.json`; import + ingest | (below) | `import-problem` + `ingest` | 🟦 **Gate 3** |

> S2 freezes the line numbers and the variable universe. Do not start S4 until S3's primitive is
> approved — a wrong primitive wastes the entire S4 fan-out.

## S5 — Assemble + import + ingest

The `authoring/<slug>/` dir already mirrors the bundle, but the trusted path is to assemble a single
`combined.json` and reuse the existing importer (it shape-checks and produces a portable, re-pasteable
artifact). Build `combined.json` mechanically — no new content:

- **Top level** ← all `problem.json` fields, plus `"presets"` ← the `presets.json` array. (Omit
  `hasVisualization`/`supportsCompare`; `import-problem` derives them.)
- **`approaches`** ← for each `approaches/<id>/`: every field of `approach.json`, plus
  `"solution"` = the text of `solution.py`, `"mapping"` = `mapping.json`, `"narration"` = `narration.json`.

Then:
```bash
npm run import-problem -- authoring/<slug>/combined.json        # add --force if the slug already exists (2nd approach)
npm run ingest                                                  # Gate 1: traces + validates + writes Mongo
```
`import-problem` requires each approach to have a `solution` string containing `class Solution`, an
`entrypoint`, a `mapping`, and a `narration`; ≥3 presets; a real `slug`. Since `dry-run` already passed,
ingest's Gate 1 will pass. On success, the bundle is in `seeds/problems/<slug>/` (the version-controlled
source of truth) and the problem is in MongoDB. Then run **Gate 3**.

## The three human gates — STOP and wait for the user

**🟦 Gate 1 — Frozen code (after S1).** Every downstream line number depends on this. Show:
- the numbered `solution.py` (line 1 = `class Solution:`, line 2 = `def …`, first body = line 3),
- a semantics-preserving diff vs. the pasted original (you only reformatted; you changed no logic),
- the entrypoint (`Solution.<method>`).
Ask: *"Is this the exact code to freeze? Everything downstream keys off these line numbers."* Wait.

**🟦 Gate 2 — Primitive / fidelity (after S3).** The one genuinely subjective call, made when you can see
REAL traced values but before any expensive fan-out. Produce the packet from
[stages/S3-primitive.md](stages/S3-primitive.md) (this is the D18-Step-2 / `rules/FidelityReview.md`
packet): unit of work; recommended primitive + why its cells == that unit; DSL-wiring walkthrough on
real traced values at 1–2 pivotal steps; D17 escape-hatch check; ASCII mockup at init / key step / return
using `example-1` traced values; fidelity risk call-out; then ask *"Proceed with `<primitive>`? Different
primitive, or DEFER?"* Wait. On DEFER, record `{unsupported, neededRenderer}` in state.json and STOP.

**🟦 Gate 3 — Live render (after S5 ingest).** Run `npm run dev`, open `/problems/<slug>`. Present the
ingest summary (approaches, step counts, key events) and walk the user through every approach + an edge
case. Capture the verdict in `rules/FidelityReview.md`'s reviewer output format. PASS ships; REVISE →
targeted S4 repair → re-ingest; DEFER → stop.

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
| `lint-dsl` syntax / unknown var | S4b (or S4c if narration slot) | only that expression |
| `dry-run` missing byLine line N | S4c | only `narration.byLine[N]` |
| `dry-run` invalid VisualState / no idle catch-all / null var | S4b | the rule reading that var / the catch-all |
| `dry-run` phase boundary (init after loop) | S4b | only those phaseRules entries |
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
- The shared DSL grammar is in [reference/dsl-grammar.md](reference/dsl-grammar.md) — read it before S4b/S4c.
