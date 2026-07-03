# Knacktor — Product Strategy: Scaling the Simulation Engine to 1,000 Problems

> Founder-level strategy report. Scope: **authoring pipeline + visual quality only** (monetization/growth deliberately excluded).
> Operating assumption: **solo founder + AI agents**, target **~1,000 problems in ~6 months**.
> Grounded against `rules/Tracker.md`, `.claude/skills/add-problem-staged/SKILL.md`, and the validator/npm-script surface as of 2026-07-02.

---

## 1. Executive summary

Knacktor's differentiator — algorithm simulations that are *provably faithful to real code execution* — is already engineered better than any competitor's (VisuAlgo animates idealized pseudocode; LeetCode/NeetCode have no execution-coupled visuals at all). The tracer→DSL→validator pipeline guarantees three things nobody else has: every animation is derived from a real Python run, every executable line is represented (D8), and nothing misleading can ship (D15 + D21 liveness gate).

**The bottleneck to 1,000 problems is not infrastructure.** The stack holds to ~1,000 problems; ingest is idempotent; validation is deterministic. The bottleneck is:

1. **S4 authoring cost** — writing `mapping.json` + `narration.json` per approach is the dominant creative cost, done from scratch each time against a strict DSL.
2. **Human-gate throughput** — 3 human checkpoints per approach × ~10 approaches/day required = an unsustainable review load for one person.
3. **Unproven renderer surface** — 5 of 10 renderers (tree, grid, graph, queue, recursion) have never been exercised by a real problem. Scaling into unexplored renderer territory at fleet speed is how misleading visuals slip through.

**The strategy in one line:** *convert S4 from authorship into instantiation* (pattern-family archetypes), *convert review from interactive gates into daily batches* (filmstrip queue), and *de-risk the renderer surface first* — then let AI fleets run the pipeline while the founder's time is spent only where human judgment is irreplaceable: fidelity review.

The three highest-leverage moves, in order:

| # | Lever | Effect |
|---|---|---|
| 1 | **Archetype library** (~25–30 mapping/narration templates by pattern family) | Cuts S4 from hours to minutes; raises first-try `dry-run` pass rate; makes fleet authoring reliable |
| 2 | **Batch review queue** (multi-problem filmstrips, GREEN/REVISE/DEFER) | Collapses 3 interactive gates into ~30–45 min/day of focused review |
| 3 | **Renderer-gap closure** (1 flagship problem per unexercised renderer, weeks 1–4) | Completes M1.8; surfaces DSL gaps *before* fleet-scale, when they're cheap to fix |

Honest assessment of the 6-month target: **achievable only if Phase A (weeks 1–4) proves the archetype leverage.** If instantiating a sliding-window problem from an archetype still takes half a day, the realistic ceiling is ~300–400 problems in 6 months — which, done well, is still a category-winning catalog (full Blind 75 + NeetCode 150 + patterns coverage). Build the ramp, measure, then commit to the number.

---

## 2. Where we are (current state)

| Dimension | State |
|---|---|
| Problems seeded | **7** (13 approaches): two-sum, 4sum, container-with-most-water, reverse-linked-list, remove-linked-list-elements, merge-two-sorted-lists, valid-parentheses |
| Engine | Complete: 10 generic renderers, stage dispatch, CombinedRenderer (D19 aux structures), 1 custom visualizer, Compare mode ✅ (M1.5R) |
| Renderers proven by a real problem | array✅ hashmap✅ linkedList✅ stack✅ bar-container✅ custom✅ — **tree❌ grid❌ graph❌ queue❌ recursion❌** |
| Authoring flow | Staged S0–S5 skill; work in `authoring/<slug>/`; freeze code → trace → author animation last |
| Deterministic gates | `trace-approach` → `lint-dsl` → `dry-run` (buildTrace + validateTrace + No-Line-Left-Behind + liveness) → `review-sheet` → `import-problem` → `ingest` (all-or-nothing) |
| Human gates | 3 per approach: Gate 1 (frozen code), Gate 2-light (primitive sanity), Gate 3 (real-frame filmstrip sign-off) |
| Fidelity guarantee | Preview renders the **same VisualStates ingest stores** — what the human approves is exactly what ships |
| Dominant cost | **S4**: hand-authoring `mapping.json` + `narration.json` against the strict DSL |
| Deferred | Custom input (D12), auth/progress, FastAPI (D16), admin UI, extra primitives (DP table, trie, heap, union-find) |
| Debt | M1.7 hardening (SEO/a11y/reduced-motion audits) not started; Valid Parentheses Gate 2 pending; Tracker↔seeds naming drift (`brute-stack` vs `brute-force`) |
| Infra headroom | Next.js + MongoDB holds to ~1,000 problems; Atlas M10 needed at 50+ |

**What is genuinely excellent and must not be diluted while scaling:**
- The two-gate philosophy (D15): mechanical correctness ≠ semantic fidelity; "defer honestly, never ship misleading."
- No-Line-Left-Behind (D8) and the tracer-only rule (D9): animations cannot drift from code.
- The liveness gate (D21): static/boring animations are mechanically blocked, not left to taste.

---

## 3. Improving the visuals (the USP)

### 3.1 Close the renderer gap first (weeks 1–4 — prerequisite to everything)

Ship **one flagship problem per unexercised renderer**, chosen to stress the renderer's hardest choreography:

| Renderer | Flagship candidate | What it stress-tests |
|---|---|---|
| tree | Validate BST or Max Depth | tidy-tree layout, cursor-ring glide, visited-edge persistence |
| queue | Binary Tree Level Order (tree + aux queue) | D19 aux sync, BFS level stagger (≥30 ms) |
| grid | Number of Islands | wavefront stagger by discovery order, glyph+color dual channel |
| graph | Course Schedule (Kahn's) | frozen layout, in-degree badges, ready-queue rail |
| recursion | Climbing Stairs or Subsets | incremental tree unfold, return-value chips sliding up edges |

Each one will surface DSL gaps (these renderers' `nodesFrom`/`gridFrom`/`framesFrom` paths have never met real trace data). Finding those gaps now — with full attention, one at a time — is 10× cheaper than finding them mid-fleet. This also completes the **M1.8 exit gate**.

### 3.2 Engine-level pedagogy upgrades (compound across all 1,000 problems, zero per-problem cost)

Ranked by learning impact ÷ build cost:

1. **Predict-the-next-step** — before a key event, pause and ask "what happens next?" (2–3 choices derived mechanically from the trace: which pointer moves / what gets pushed). Active recall is the single strongest learning intervention, and the trace already contains the answer. Build once in `control-dock.tsx`/`use-player.ts`; works for every problem ever ingested.
2. **Invariant spotlight** — narration already carries an invariant quadrant; add a mode where the invariant is visually anchored on the stage (e.g., the sorted-region tray, the window's "no duplicates" badge) and *flashes when it's about to be maintained*. Makes the "why it works" visible, not just readable.
3. **Step-back checkpoints** — at each `keyEvent`, an optional one-line "pause and reflect" card ("Why did `hi` move and not `lo`?") generated from the existing `narration.why`. Cheap: it's re-presentation of data already authored.
4. **Pattern intro reels** — a 30–60s standalone animation per pattern family (sliding window, two pointers…) shown on `/patterns/<slug>` and before the first problem of that pattern. ~25 reels total; each reuses the existing renderers with a hand-picked trace. This is also marketing gold (shareable clips).
5. **Adaptive narration density** — Learn mode shows all 4 narration quadrants; a "Revise" toggle collapses to what+why only. Trivial UI change, big for the interview-prep persona.

### 3.3 Mechanical quality ratchets (extend the D21 philosophy)

Every quality property that can be checked mechanically should be — taste doesn't scale, validators do. Add to `dry-run`:

- **Pointer-coverage check** — every pointer declared in `mapping.json` must move at least once and be visible in ≥N% of steps (catches decorative pointers).
- **Color-grammar audit** — ≤6 simultaneous semantic colors per frame; exactly one `current` per step (already a rule in SimulationRules §A-8 — make it a validator, not a convention).
- **Caption-before-motion ordering** — key events must have narration on the step *before* the visual change ("motion must explain" as a lint).
- **Golden filmstrip snapshots** — store the `review-sheet` SVG frames per (problem, approach, preset) in the repo; any engine/renderer change that alters a shipped animation fails CI until re-approved. This is what lets you refactor renderers at 1,000-problem scale without silently breaking 990 of them.

### 3.4 DSL ergonomics (unblock future problems)

Ranked by (problems unblocked) ÷ (validator complexity):

1. **`in` operator** (membership) — already a logged open question. Blocks natural expression of hashset/visited checks across dozens of problems; the current flag workaround pollutes solutions. Medium validator cost (needs safe containment semantics on lists/dicts/sets in snapshots).
2. **Safe slice reads** (`a[i:j]` in *display* expressions only, not conditions) — subarray/substring problems (Kadane windows, prefix displays) currently need ghost vars. Low-medium cost if restricted to readouts/labels.
3. **`sum`/`count` helpers** — same restricted-to-display rule.
4. **Named sub-expressions** in `mapping.json` (a `defs:` block) — dedupes the repeated `idx >= lo && idx <= hi` clauses that make cellStateRules unreadable and error-prone. Pure preprocessor; near-zero risk.

Do these *during* Phase A while renderer-gap problems expose exactly which constructs hurt most — don't speculatively extend the DSL.

---

## 4. Scaling to 1,000 problems

### 4.1 The throughput math (face it explicitly)

- 1,000 problems × ~1.7 approaches avg ≈ **~1,700 approaches**
- 6 months ≈ 180 days → **~9–10 approaches/day, every day**
- Today's flow per approach: S0–S3 (mechanical, fast) + **S4 (hours)** + 3 interactive human gates + repair loops

At 10/day with 3 interactive gates each, the founder does **30 review interruptions daily** while also running the fleet. That fails in week two — not on engineering, on attention. Every recommendation below exists to fix one of the two multiplicands: *per-approach cost* or *human minutes per approach*.

### 4.2 Lever 1 — Pattern-family archetypes (the biggest lever)

**Insight:** the 1,000-problem catalog is not 1,000 unique animations. It's ~25–30 *choreographies* (SimulationRules Part C already enumerates them) instantiated with different data. A sliding-window `mapping.json` for Longest Substring and one for Min Window Substring differ in variable names, window predicates, and narration nouns — not in structure.

**Build:** `seeds/archetypes/<pattern-slug>/` — a parameterized skeleton per pattern family:
- `mapping.template.json` — the proven choreography with `{{window_lo}}`-style slots and per-slot notes on what trace var to bind
- `narration.template.json` — phase-by-phase narration scaffolding with slot guidance
- `notes.md` — the pattern's mandatory beats (from SimulationRules Part C), known DSL traps, and 1–2 solved examples to imitate

Seed the library by **distilling, not designing**: after the renderer-gap problems + the first ~30 catalog problems, extract each mapping into its archetype. Add a `new-problem --from-archetype <pattern>` scaffold flag.

**Effect on S4:** from "author against a strict DSL from a blank file" to "bind ~8–15 slots and tune." Expected: hours → minutes, and a much higher first-try `lint-dsl`/`dry-run` pass rate because the structure is pre-validated. **This is the make-or-break metric for the 6-month target** — measure it in Phase A (see §4.6).

Coverage estimate: ~85–90% of a 1,000-problem catalog falls into the ~30 families. The remainder is either D17 custom-renderer territory (budget ~15–25 custom visualizers across the catalog, they're expensive and each must earn it) or honest **DEFER**s.

### 4.3 Lever 2 — Batch review (redesign the human gates for throughput, not per-problem ceremony)

Keep three human judgments; change *when and how* they happen:

- **Consolidate Gates 1 + 2-light into one "pre-flight sheet"** per problem: frozen code diff + entrypoint + chosen primitive + unit-of-work statement on a single screen, reviewed in seconds. These are sanity checks, not deliberation.
- **Batch Gate 3**: extend `review-sheet` to emit a **multi-problem review queue** — one HTML page with N filmstrips, keyboard-driven GREEN / REVISE(+note) / DEFER per approach, decisions written to a JSON the pipeline consumes. The founder reviews **once or twice a day, 10–20 filmstrips per sitting (~30–45 min)** instead of being interrupted 30 times.
- **Tighten what a filmstrip shows**: current frames + auto-flagged moments (liveness advisories, key events, densest frame) so a REVISE verdict lands on the exact step.
- **REVISE feedback loop**: notes go back into the authoring agent's context for the repair pass; ≤3 repair cycles then auto-DEFER (already the skill's budget — keep it).

Founder time at steady state: **~45–60 min/day of review, total.** That is the entire sustainable human budget, and this design fits inside it.

### 4.4 Lever 3 — AI fleet authoring (parallelize S0–S4 behind the deterministic gates)

The staged skill is already agent-shaped: deterministic gates are the trust boundary, and a green `dry-run` guarantees ingest passes. Scale it horizontally:

- **Batch intake**: a queue file (`authoring/queue.json`) of (problem, vetted solution(s), pattern tags). Curating *which* problems and *which* canonical solutions enter the queue stays a founder task — it's taste, and it's fast (~an hour to queue a week of work).
- **Parallel agent runs**: N agents each take one problem through S0→S4 (from-archetype), stopping at the pre-flight and filmstrip artifacts. Agents never touch MongoDB; only the post-GREEN step runs `import-problem` + `ingest`.
- **Isolation**: per-problem `authoring/<slug>/` dirs already prevent collisions; run agents in worktrees if they ever touch shared files.
- **Auto-triage**: an agent that can't reach green `dry-run` in 3 repair cycles marks the problem DEFER-candidate with a structured reason (DSL gap / primitive mismatch / trace anomaly). Deferred reasons are gold — they're the backlog for DSL ergonomics and new primitives.
- **Daily rhythm**: morning — founder queues problems + reviews yesterday's filmstrip batch; day — fleet authors; evening — GREEN problems auto-ingest, REVISE notes recycle.

### 4.5 Lever 4 — Tiered quality (an explicit product decision, not an accident)

Full Gate 2 fidelity review (the deep "does this animation truly teach the unit of work?" analysis) on 1,700 approaches is impossible solo. Make the tiering deliberate:

- **Flagship tier (~150 problems)**: Blind 75, NeetCode 150 core, 1–2 exemplars per pattern. Full Gate 2 ceremony, custom polish where warranted, these are the problems that define the brand and appear in marketing.
- **Standard tier (rest of catalog)**: full mechanical gates + archetype instantiation + batched filmstrip GREEN. Because archetypes *are* Gate-2-reviewed choreographies, a standard-tier problem inherits reviewed fidelity structurally — the filmstrip check confirms the instantiation, not the choreography.
- **Never-ship tier**: anything the primitives can't honestly represent → public DEFER list. Holding the D15 line under scale pressure is a brand asset ("every visual is faithful") — the moment one misleading animation ships, the differentiator inverts into a liability.

### 4.6 Sequencing (phased, with a kill-switch on the math)

**Phase A — De-risk (weeks 1–4).** Renderer-gap flagships (5 problems, full ceremony) + DSL ergonomics from what they expose + distill first archetypes + build pre-flight sheet + batch review queue. Target: ~15–20 problems total, and **measure**: median S4 time from-archetype, first-try dry-run pass rate, filmstrips/hour reviewed.
- **Checkpoint:** if from-archetype S4 < ~30 min and first-try pass > ~60%, the 6-month/1,000 math holds → Phase C as planned. If not, re-anchor the target at 300–400 and fix the pipeline before scaling volume.

**Phase B — Prove volume (months 2–3).** Blind 75 + NeetCode 150 coverage at ~3 problems/day with the fleet running S0–S4 and daily batch review. Archetype library grows to full ~25–30 families. Atlas → M10. Golden-filmstrip CI lands (before the catalog is too big to re-approve).

**Phase C — Fleet scale (months 4–6).** ~8–10 approaches/day sustained. Founder's day: queue curation + 2 batch reviews. New primitives (DP table, heap, trie, union-find) built as Deferred-reason data justifies them, each proven by one flagship before its family scales.

**Deliberately NOT doing while scaling:** custom input (stays behind flag per D12), auth/progress wiring, admin UI, FastAPI. Every one is a distraction from the two levers that matter.

### 4.7 What must be built (the tooling backlog this report implies)

| Build item | Size | Phase |
|---|---|---|
| `seeds/archetypes/` library + `--from-archetype` scaffold | M (distillation is ongoing) | A→B |
| Pre-flight sheet (Gate 1+2 consolidation) | S | A |
| Batch review queue (multi-filmstrip HTML + verdict JSON + pipeline consumption) | M | A |
| Fleet queue + parallel-run orchestration + auto-triage/DEFER reasons | M | B |
| Validator ratchets (pointer coverage, color grammar, caption-before-motion) | S each | A–B |
| Golden-filmstrip CI snapshots | M | B |
| DSL: `defs:` block, `in`, display-only slices/helpers | S/M/M | A–B |
| Pedagogy: predict-next-step, invariant spotlight, checkpoints, pattern reels | M each | B–C (parallel track) |
| Contributor docs (when humans join later): archetype how-to + review rubric | S | C |

---

## 5. Risks & open decisions

| Risk | Mitigation |
|---|---|
| **Archetype leverage doesn't materialize** (S4 stays slow) | Phase A checkpoint with explicit re-anchor to 300–400 problems; quality-first fallback is still a winning catalog |
| **Quality dilution at fleet speed** | Tiering is explicit; archetypes carry reviewed choreography; liveness + new ratchets are mechanical; filmstrip GREEN stays mandatory for every approach |
| **DSL expressiveness ceiling** | Deferred-reason telemetry decides extensions; D17 custom budget (~15–25) for the truly bespoke; public DEFER list preserves honesty |
| **Review fatigue / rubber-stamping** | Hard cap ~60 min/day; auto-flagged moments focus attention; REVISE-rate KPI detects drift (too low = rubber-stamping, too high = archetype problem) |
| **Engine refactors breaking shipped animations** | Golden-filmstrip CI before catalog passes ~100 problems |
| **Doc/seed drift** (already visible: Tracker vs `reverse-linked-list` approach naming) | Make Tracker updates part of the pipeline's post-ingest step, not a manual habit |
| **Infra** | Atlas M10 at 50+ problems; trace-size guard already exists (GridFS overflow per D11) |

**Open decisions for the founder:**
1. Accept the two-tier quality model publicly? (Recommended: yes, framed as "flagship" visuals — it's honest and it protects the brand.)
2. Commit to 1,000/6mo now, or set the Phase A checkpoint as the formal decision point? (Recommended: the checkpoint.)
3. Which 5 flagship problems for the renderer gap? (Candidates in §3.1 — pick ones that are also catalog must-haves so the work compounds.)

---

## 6. Scorecard (measure weekly)

| KPI | Phase A target | Phase C target |
|---|---|---|
| Approaches ingested / week | 8–10 | 55–70 |
| Median S4 time (from-archetype) | < 30 min | < 20 min |
| First-try `dry-run` pass rate | > 60% | > 80% |
| Gate 3 REVISE rate | 20–40% (healthy scrutiny) | 10–25% |
| DEFER rate (honesty signal) | any, with reasons logged | < 8%, reasons feeding DSL/primitive backlog |
| Renderer coverage (real problems) | 10 / 10 | 10 / 10 + new primitives proven before family scale |
| Archetype reuse rate (problems from-archetype) | > 50% | > 85% |
| Founder review time / day | < 60 min | < 60 min |

---

*This document is strategy, not contract — Tracker.md remains the decision log. When a recommendation here is adopted, record it as a D-decision in Tracker.md.*
