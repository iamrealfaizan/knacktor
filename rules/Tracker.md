# Tracker — Knacktor

> **Role:** living **roadmap + decision log** (both). The AI agent and team update this to keep the whole picture in mind. Major planning decisions are recorded **here only** (single source, no duplication).

## Current status
- Project state: **RENDERER EXPANSION + CONTENT SCALING (2026-06).** Re-architecture (D9–D15) is complete. M1.5R is fully done (Compare dual-lane ✅ 2026-06-22). Gate 2 fidelity reviews complete for Two Sum, Reverse Linked List, and Merge Two Sorted Lists. M1.8 exit gate partially satisfied — hashmap ✅ (Two Sum), linkedList ✅ (Reverse Linked List), custom ✅ (Merge Two Sorted Lists), stack ✅ (Valid Parentheses, 2026-06-30), **grid ✅ (Number of Islands, 2026-07-05)**; 4 renderers still need a real problem (recursion, tree, queue, graph). Authoring pipeline now hardened by a mechanical **liveness fidelity gate** + a **real-frame preview review** (D21, 2026-06-30). Next focus: M1.8 exit gate completion + M1.7 hardening. FastAPI backend deferred. See D16–D21.
- **Custom renderer infrastructure + Merge Two Sorted Lists (D20, 2026-06-21):** `CustomVisualState` type + `customVars` DSL + `primitive:"custom"` branch in `mapLeaf()` + dynamic dispatch in `stage.tsx` + validator fix in `isValidLeaf()`. Merge Two Sorted Lists optimal-iterative completely redesigned (array-based solution, 3-chain custom visualizer with directional CSS entrance animations). Gate 1 ✅ (38 steps on example-1). Process rules strengthened: `ADDING_PROBLEMS.md` §X Simulation Reasoning checklist + self-check item 17; `FidelityReview.md` per-renderer structural checks; CLAUDE.md D18 Step 2 requires ASCII mockup + variable-population verification before renderer confirmation.
- **Multi-structure visualization (D19, 2026-06-20):** `CombinedVisualState` + `auxMappings[]` DSL field landed. Fully data-driven — no per-problem custom components. First use: Reverse Linked List brute-stack (LinkedList + Stack aux). `ADDING_PROBLEMS.md` updated with `auxMappings` docs in §8 and a new §10 self-check.
- **Ingest quality improvement (2026-06):** Narration byLine coverage check added to `lib/validators/validate-trace.ts` — ingest now aborts if any executed line has no specific `byLine` entry (i.e., would fall back to generic `byPhase`). Phase classification guide and two new mandatory self-checks (items 13 & 14) added to `ADDING_PROBLEMS.md`. Reverse Linked List phase classification bugs (optimal lines 23/24, brute-stack lines 33/34) are now fixed.
- Canonical build docs: finalized (PRD, TechSpec, AppFlow, Design, Schema, Implementation, Rules, Security, **SimulationRules**, **Authoring**, **CompareAndResponsive**).
- Simulation rulebook: [SimulationRules.md](SimulationRules.md) — canonical for all simulation visuals/motion (full DS + pattern taxonomy).
- Visual reference baseline: [`4Sum Visualizer.html`](4Sum%20Visualizer.html) (**final, locked**). [dsaPRD.md](dsaPRD.md) Part II is **archived** (superseded by SimulationRules).

## Locked decisions

### Session decisions (D1–D8)
- **D1 — DB-canonical, file-seeded.** MongoDB is the served source of truth; problems authored as files → traced → ingested. *(Overrides earlier "repo-files canonical" wording.)*
- **D2 — Primitive library + bespoke escape hatch ("both").** Data-driven primitives by default; new structure = one-time engine task; bespoke rendering allowed sparingly.
- **D3 — Prototype warm-paper aesthetic is canonical.** Match the prototype's exact hexes/fonts (Inter + JetBrains Mono).
- **D4 — Live custom input in M1.** Sandboxed on-demand tracer is in the first milestone, not deferred.
- **D5 — One canonical [SimulationRules.md](SimulationRules.md).** Single source of truth for simulation look + motion (foundations + per-DS + per-pattern).
- **D6 — Full taxonomy specified now.** All 16 data-structure families + all listed patterns have rules immediately, even where renderers ship later.
- **D7 — dsaPRD Part II superseded, re-mapped to exact 4Sum tokens.** [dsaPRD.md](dsaPRD.md) is now an **archived reference**.
- **D8 — Every executed line emits a step + explanation** (loops re-emit). Supersedes the "annotate meaningful lines only" model.

### Re-architecture decisions (D9–D14, 2026-06)
- **D9 — Hybrid trace model.** A **Python tracer** (`sys.settrace`) executes the author's real solution → step skeleton (every executed line → one step + real var snapshot + counters). Sync is mechanical, drift impossible. An authored **visual-mapping layer** transforms each step's real captured state into the bespoke `VisualState`; animation is derived from the same per-step state, so it cannot drift from code. **Authors never hand-write step arrays.** Replaces the TS tracers in `lib/tracers/*` and the `TRACERS` registry. See [Authoring.md](Authoring.md).
- **D10 — `_id` relationships.** `problems`, `topics`, `difficulties`, `patterns`, `sheets` are separate collections referencing each other by Mongo `_id`. `slug` kept only for routing. Approaches & presets **embedded** in the problem doc (1:1 ownership, never queried alone). DB wiped + re-seeded. Supersedes the earlier slug-string relationship model.
- **D11 — Trace storage.** One doc per `(problemId, approachId, inputId)`, full per-step snapshots, gzip-compressed `BinData`; GridFS only as overflow (>~12 MB). Decompressed at the content-service boundary; player/renderer unchanged.
- **D12 — Custom input deferred.** Commented out behind build-time flag `CUSTOM_INPUT_ENABLED`; wrong-approach bug fixed in the disabled path. *Supersedes D4* — sandbox runtime (Pyodide vs server) decided in a later milestone.
- **D13 — Authoring template + loud validation.** Fixed per-problem bundle (Authoring.md). Validator-first ingest checks: No-Line-Left-Behind, narration completeness, ≥3 examples/approach incl. an edge case, expected-output match, visual-state validity, `_id` reference resolution — **aborts the whole ingest on any violation, nothing partial written.**
- **D14 — Mobile.** Desktop = canonical no-scroll 5-panel layout. Below `lg` (1024px): vertical stack top bar → code → simulation → narration → insight → controller (pinned to bottom). See [CompareAndResponsive.md](CompareAndResponsive.md).
- **D15 — Simulation-fidelity gate.** Two mandatory gates: **(1) ingest** (mechanical correctness) and **(2) fidelity review** (semantic — does the animation truly represent the algorithm's operations/unit of work?). Ingest passing is **necessary but not sufficient**; every problem also passes a human/Claude fidelity review before acceptance. If the primitives can't represent the algorithm's unit of work, defer the problem until the renderer exists — never ship a misleading visual. *(Prompted by Longest Common Prefix passing ingest while its array-of-strings view failed to show the character-column comparison.)* See [FidelityReview.md](FidelityReview.md).

### Phase 2 decisions (D16–D18, 2026-06)
- **D16 — API layer: Next.js API routes now, FastAPI deferred.** A read-only JSON API at `app/api/` wraps the Content Service. Response shape: `{ data, error? }`, standard HTTP codes. No write routes. FastAPI migration deferred until a mobile app or external integration requires it.
- **D17 — Visualization strategy: Hybrid (generic-first + custom escape hatch).** Generic renderers (array, bar-container + 8 new: hashmap, linkedList, tree, stack, queue, grid, graph, recursion) are the default — problems are pure data, O(1) bundle growth per problem. Custom per-problem component (`components/problem/custom/<slug>-visualizer.tsx`) only when ≥2 of: (a) 2+ primitives must coordinate simultaneously, (b) spatial layout is itself the teaching point, (c) animation cannot be expressed via the DSL. Decision rule enforced in CLAUDE.md § VISUALIZATION DECISION RULE.
- **D18 — Problem-addition workflow.** When a filled template is pasted: agent parses+splits, analyzes viz needs (D17 rule), runs tracer, builds custom component if needed (one checkpoint before writing custom code), ingests, confirms at `/problems/<slug>`. Full flow in CLAUDE.md § ADD-PROBLEM WORKFLOW. Gate 2 (FidelityReview.md) still required. **Strengthened 2026-06-21:** Step 2 now requires an ASCII mockup (3 moments, actual example-1 values) and variable-population verification before renderer confirmation.

### D19 — Multi-structure visualization
**Date:** 2026-06-20
**Decision:** A `CombinedVisualState` wraps a primary + one or more aux structures. Each aux is a full animated primitive rendered alongside the primary in the stage SVG. Authored via `auxMappings[]` in `mapping.json`. No per-problem custom components needed — fully data-driven. Auto-layout: horizontal primary + vertical aux → side-by-side; all other combos → stacked.
**Files changed:** `lib/trace.ts` (LeafVisualState, CombinedVisualState), `lib/tracer/types.ts` (AuxMappingSpec, auxMappings on VisualMappingSpec), `lib/tracer/mapping.ts` (mapLeaf/mapAux/mapVisual), `components/problem/stage.tsx` (CombinedRenderer, computeCombinedLayout), `lib/validators/validate-trace.ts` (combined branch in isValidVisual), `components/problem/renderer-utils.ts` (fitTextSize), `array-renderer.tsx` / `stack-renderer.tsx` / `queue-renderer.tsx` (fitTextSize applied).
**First use:** `reverse-linked-list/brute-stack/mapping.json` — LinkedList primary + Stack aux.

### D20 — Custom renderer infrastructure + Merge Two Sorted Lists redesign
**Date:** 2026-06-21
**Decision:** Implement the custom renderer escape hatch end-to-end so problems meeting the D17 criteria can actually ship. Add `CustomVisualState` type (`type: "custom"`, `componentKey`, arbitrary payload) to `LeafVisualState`. Add `customVars` DSL field to `VisualMappingSpec` — a pure TS passthrough that projects captured Python vars into the custom visual without a Python bridge. Handle `primitive: "custom"` at the top of `mapLeaf()`. Dispatch custom components in `stage.tsx` via a module-level `CUSTOM_RENDERERS` map + Next.js `dynamic()` import; return early before SVG canvas setup (custom components are HTML/Tailwind, not SVG). Extend `isValidLeaf()` to accept `type: "custom"`. Custom components live in `components/problem/custom/<slug>-visualizer.tsx`.
**First use:** Merge Two Sorted Lists optimal-iterative. Original approach used linked-list node objects → generic `linkedList` renderer → one flat chain with no way to distinguish list1, list2, and the growing result. Redesigned with array-based solution (`l1_rem`/`l2_rem`/`result`/`splice_source`/`splice_val`) and a 3-chain custom visualizer (list1 top-left, list2 top-right, result bottom-center) with directional CSS `@keyframes` entrance animations on each spliced node. Gate 1 ✅ (38 steps example-1, 5 presets).
**Process rule improvements:** (a) `ADDING_PROBLEMS.md` §X Simulation Reasoning checklist (mental trace, variable-write timing, empty-init guard, ASCII mockup, unit-of-work check, linkedList per-step population) + self-check item 17; (b) `FidelityReview.md` per-renderer structural checks section for linkedList, array/bar-container, and custom; (c) CLAUDE.md D18 Step 2 requires ASCII mockup + variable-population verification before renderer confirmation.
**Files changed:** `lib/trace.ts`, `lib/tracer/types.ts`, `lib/tracer/mapping.ts`, `components/problem/stage.tsx`, `lib/validators/validate-trace.ts`, `seeds/problems/merge-two-sorted-lists/approaches/optimal-iterative/` (solution.py, mapping.json, approach.json, narration.json), `components/problem/custom/merge-two-sorted-lists-visualizer.tsx` (NEW), `ADDING_PROBLEMS.md`, `rules/FidelityReview.md`, `knacktor/CLAUDE.md`.

### D21 — Liveness fidelity gate + real-frame preview review (Gate 3)
**Date:** 2026-06-30
**Decision:** The simulation is the USP, so a structurally-valid trace whose picture barely moves is a product failure. Add a **mechanical liveness gate** that blocks static/boring animations, plus a **human preview-review** step before ingest. The liveness analyzer (`lib/validators/liveness.ts`) inspects each built trace's per-step `VisualState` and throws on *unambiguous* deadness only (too few distinct frames over a long run, a long frozen consecutive-frame run, empty aux across all steps, a pointer motionless across every preset); static-% is biased against long traces so it is **advisory only**, and traces below `MIN_STEPS` are exempt. It runs inside `dryRunApproach`, so **both `npm run dry-run` (authoring gate) and `npm run ingest`** enforce it. Reviewed legacy exemptions live in `seeds/liveness-exempt.json` keyed by `(slug, approachId)` and are logged loudly — new problems are never auto-exempted. The preview (`npm run review-sheet`) renders the REAL per-step frames into a self-contained `review.html` filmstrip (pivotal frames beside code line + 2×2 narration, topped with the liveness report + FidelityReview checklist); because it renders the same `VisualState`s ingest stores, **what the human approves is exactly what ships** — no preview/live drift. Published as a claude.ai Artifact for sign-off.
**Process rule:** `add-problem-staged` skill restructured to author the **animation LAST** — all non-visual content (metadata, frozen code, presets, line/syntax explanations) is authored and gated first, so the simulation is built with every detail in front of you. `S4b-mapping` + `S4c-narration` merged into `S4-simulation` (gated lint-dsl → dry-run incl. liveness); new `S5-preview-review` is Gate 3 (human signs off on the real animation before anything reaches Mongo).
**Files changed:** `lib/validators/liveness.ts` (NEW), `lib/render/render-stage-svg.tsx` (NEW), `scripts/review-sheet.ts` (NEW), `seeds/liveness-exempt.json` (NEW), `lib/validators/dry-run.ts` (liveness wired into `dryRunApproach`), `scripts/dry-run-approach.ts`, `components/problem/stage.tsx`, `package.json` (`review-sheet` script); skill: `.claude/skills/add-problem-staged/SKILL.md`, `stages/S4-simulation.md` (NEW), `stages/S5-preview-review.md` (NEW), `stages/S4b-mapping.md` + `stages/S4c-narration.md` (DELETED), `stages/S3-primitive.md`, `reference/state-schema.md`.

### Standing decisions (from planning)
- Full platform; first milestone = engine + **1–2** pilot problems.
- Next.js App Router; `shadcn/ui` + `lucide-react` (hard requirement).
- Unified Content Service hides storage details.
- Visualizer-first; no-scroll desktop teaching loop; Learn/Focus/Compare modes (Compare top-level, hidden when unsupported).
- Python-first, single visible language.
- Accounts/progress/monetization future-ready but out of MVP; analytics minimal.
- SEO + accessibility high priority; SSR content + hydrated player; readable learning URLs.
- Taxonomy: `difficulty` (Easy/Medium/Hard) + `topic` + `pattern`; interview sheets are classic, navigational only.

## Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| `M0` | Documentation lock | ✅ Done |
| `M1.1` | Platform foundation (Next.js + design tokens + route skeletons) | ✅ Done |
| `M1.2` | Content schema + ingest pipeline | ✅ Done |
| `M1.3` | Discovery surfaces (problems, topics, patterns pages) | ✅ Done |
| `M1.4` | Problem-page engine + simulation player | ✅ Done |
| `M1.5R` | **Re-architecture** (D9–D14): hybrid Python tracer ✅, `_id` DB ✅, generic engine ✅, authoring template + trace validation ✅, Compare dual-lane ✅ | ✅ Done |
| `M1.5` | Custom-input runtime sandbox (deferred per D12) | ⏸ Deferred |
| `M1.6` | Pilot problems — `4Sum` ✅ + `Container` ✅ on Python tracer; `Two Sum` ✅ (hashmap) + `Reverse Linked List` ✅ (linkedList) added via M1.10 workflow | ✅ Done |
| `M1.7` | Hardening (SEO / a11y / motion / sandbox abuse) | ❌ Not started |
| `M1.8` | **Generic renderer library** — all 8 renderer components ✅, all VisualState types ✅, stage.tsx dispatch ✅, SimulationRules audit ✅, mapping DSL (`types.ts` + `mapping.ts`) ✅; **exit gate** hashmap ✅ (Two Sum), linkedList ✅ (Reverse Linked List), custom ✅ (Merge Two Sorted Lists), stack ✅ (Valid Parentheses), grid ✅ (Number of Islands); 4 renderers still need real problems (recursion, tree, queue, graph) | ⏳ Engine done, 5 renderer exit gates met |
| `M1.9` | **API layer** — all 6 routes live at `app/api/`, clean build ✅ | ✅ Done |
| `M1.10` | **Problem-addition framework** — ADDING_PROBLEMS.md ✅, `visualizationIntent` in template + import script ✅, CLAUDE.md workflow ✅; exit gate (Two Sum + Reverse Linked List both through full workflow, Gate 1 ✅) ✅ | ✅ Done |
| `M2` | Content scale — 50 problems in DB, all passing Gate 2 | ❌ Future |

## What is built (as of last audit)

### M1.1 — Platform foundation ✅
- Next.js 14.2.31 App Router, TypeScript, Tailwind, ESLint
- Full warm-paper design token system in `app/globals.css` (26+ CSS vars, light + dark modes, pointer hues, syntax colors, 4 animation keyframes)
- Route skeletons: `/`, `/problems`, `/problems/[slug]`, `/topics`, `/topics/[slug]`, `/patterns`, `/patterns/[slug]`, `/sheets`, `/sheets/[slug]`
- MongoDB connection via `lib/mongodb.ts`; `MONGODB_URI` in `.env.local`
- shadcn/ui + lucide-react installed and configured

### M1.2 — Content schema + ingest pipeline ✅
- `lib/types.ts`: `Problem`, `Topic`, `Pattern`, `Sheet` interfaces
- `lib/trace.ts`: `Trace`, `Step`, `VisualState` (discriminated union), `Approach`, `PresetInput` interfaces — full Schema.md compliance
- `lib/content-service.ts`: `getProblemFull()`, `getTrace()`, `getProblems()`, `getTopicsBySlug()`, `getProblemsByTopic()`, etc.; safe MongoDB serialization
- `scripts/ingest.ts`: idempotent upsert (`npm run ingest`), sets up indexes (difficulty, topics, patterns, sheets, full-text)
- Seeds: `topics.json` (26 topics), `patterns.json` (25 patterns, 16 must-know), `problems.json` (4Sum), `sheets.json` (empty)

### M1.3 — Discovery surfaces ✅
- `/problems`: server-fetched table with difficulty/topic/pattern filter sidebar; eye icon for viz problems
- `/topics`: grid of topic cards with problem counts → `/topics/[slug]`
- `/patterns`: two sections (must-know / supporting), star badge → `/patterns/[slug]`
- `/sheets`: stub ("coming soon")
- Topic + pattern detail pages: breadcrumb, description, filtered problem list

### M1.4 — Problem-page engine ✅
- **5-panel layout**: code panel (left) | stage (center) | insight rail (right) | narration (bottom of stage) | control dock (bottom)
- **Code panel** (`components/problem/code-panel.tsx`): Python syntax highlighting, current-line bold+accent, auto-scroll, line-explanation hover, copy button, collapsible
- **Stage** (`components/problem/stage.tsx`): SVG canvas, zoom/pan, grid dot background, caption + pointer legend
- **Array renderer** (`components/problem/array-renderer.tsx`): Layer-1 semantic cell states (idle/current/compared/frontier/visited/result/path/special/error/dimmed), pointer pills on 4 lanes (i/j/lo/hi) with smooth glide (0.28s cubic-bezier), window tray, sum chip, reduced-motion safe
- **Narration** (`components/problem/narration.tsx`): 2×2 grid (happening / why / line-explanation / invariant), collapsible
- **Insight rail** (`components/problem/insight-rail.tsx`): variables (pop-in + change-flash), complexity counters (progress bars), result set (pop-in), call stack, notes (localStorage)
- **Control dock** (`components/problem/control-dock.tsx`): scrubber with key-event diamond markers (seekable), transport (first/prev/play/pause/next/last), preset selector, speed (0.5×/1×/2×), step counter
- **Player hook** (`components/problem/use-player.ts`): keyboard (space/←/→), autoplay, speed, seek, key-event jump
- **Problem engine** (`components/problem/problem-engine.tsx`): mode system (Learn/Focus/Compare), draggable panel resizing, theme toggle, approach switching

### M1.5 — Trace pipeline ⏳ (UI stub only)
- Custom input button visible in ControlDock but non-functional
- `supportsCustomInput: true` on ProblemFull; schema ready
- **Missing**: Python tracer, sandboxed execution engine, API route for custom-input trace generation

### M1.6 — Pilot problems ✅ (2 of 2, on the Python tracer)
- **4Sum** ✅ — `seeds/problems/4sum/` bundle, both approaches (sort-two-pointers + brute-force), traced by the Python pipeline; per-line narration + explanations; 3 presets.
- **Container With Most Water** ✅ — `seeds/problems/container-with-most-water/` bundle, both approaches (two-pointers + brute-force), bar-container primitive; 3 presets.
- **Reverse Linked List** ❌ — not started; needs the linked-list renderer (one-time engine task).

## Done in M1.5R so far
1. **WS1** ✅ D9–D14 + Authoring.md + CompareAndResponsive.md.
2. **WS2–3** ✅ `_id` DB (+ `difficulties`), gzip trace storage, content-service id→slug + decompression.
3. **WS4** ✅ **Hybrid Python tracer pipeline** — `tracer/run.py` (sys.settrace capture), `lib/tracer/*` (safe expr DSL, mapping, narration, pipeline, python bridge), `lib/validators/validate-trace.ts`. 4Sum re-authored as the gold bundle (`seeds/problems/4sum/`, both approaches), traced + validated + reseeded. Author template at `tracer/template/`.
4. **WS6a** ✅ generic insight rail, player/seekbar/diamonds/speed, statement Sheet, mobile, custom-input flag + bug fix, generic array pointer lanes + data-driven readout.
5. **Docs + tooling** ✅ [ADDING_PROBLEMS.md](../ADDING_PROBLEMS.md) is now a **self-contained LLM authoring prompt** (embeds seeded slugs, the DSL grammar + forbidden list, all caveats, a 10-point self-validation). Team flow: paste the prompt + `tracer/template/problem.combined.json` + the LeetCode problem into any LLM → save the returned combined JSON → `npm run import-problem <file.json>` → `npm run ingest` (the real gate). Also `npm run new-problem <slug>` (in-repo scaffold) and `npm run drop-db`. **`npm run build` passes clean.**
6. **Both pilots migrated to bundles** ✅ — 4Sum + Container fully on the Python tracer; engine loads all approaches' DB traces (`approachTraces`), legacy `TRACERS` removed from the engine; per-line `syntaxExplanations`/`lineExplanations` filled for every line.

## Done in M1.8 / M1.9 / M1.10 (2026-06)
7. **Dead code cleanup** ✅ — `lib/tracers/4sum.ts`, `lib/tracers/container-with-most-water.ts`, `lib/tracers/index.ts`, `lib/fixtures/4sum.ts` deleted. `scripts/ingest.ts` stripped of `ingestProblem`, `ProblemSource`, `TRACERS`, `FOURSUM_PROBLEM`, and the legacy sources loop.
8. **M1.8 renderer components** ✅ — All 8 new SVG renderers built and SimulationRules-audited: `hashmap-renderer.tsx`, `recursion-renderer.tsx` (rounded-rect nodes, `<path>` edges), `tree-renderer.tsx`, `linked-list-renderer.tsx`, `stack-renderer.tsx` (88×40 cells), `queue-renderer.tsx` (48×48, 4px gap), `grid-renderer.tsx` (28px cells, 1px gridlines), `graph-renderer.tsx` (`<path>` edges, arrowhead markers). All VisualState types added to `lib/trace.ts`. `stage.tsx` rewritten to dispatch all 10 types with correct viewBox per primitive.
9. **M1.8 tracer-side wiring** ✅ — `lib/tracer/types.ts`: `VisualMappingSpec.primitive` extended to all 10 types; new `HighlightRule` and `NodeStateRule` interfaces; 18 new optional DSL fields (`keysFrom`, `highlightRules`, `highlightKeyVar`, `itemsFrom`, `nodesFrom`, `edgesFrom`, `nodeStateRules`, `directed`, `linksFrom`, `changedLinksFrom`, `gridFrom`, `framesFrom`, `treeEdgesFrom`, `currentFrameVar`, `currentNodeVar`, extended `pointers` with `rowVar`/`colVar`). `lib/tracer/mapping.ts`: `mapVisual()` dispatches all 8 new primitives via dedicated helper functions; `coerceKey`, `resolveNodeState`, `firstMatchingCell` shared helpers.
10. **M1.9 API layer** ✅ — 6 read-only routes at `app/api/`: `/problems` (filters: difficulty, topic, pattern, search), `/problems/[slug]`, `/problems/[slug]/traces` (approachId required; inputId optional), `/topics`, `/patterns`, `/difficulties`. All return `{ data, error? }`. Build clean, all routes dynamic.
11. **M1.10 problem-addition framework** ✅ — `ADDING_PROBLEMS.md` fully rewritten: all 10 primitives documented with DSL quick-reference, `visualizationIntent` required field, 10-point self-validation. `tracer/template/problem.combined.json` updated: instructions mention all primitives, `visualizationIntent` field in approach template. `scripts/import-problem.ts` now writes `visualizationIntent` to `approach.json`. `CLAUDE.md` has the full ADD-PROBLEM WORKFLOW (D18).
12. **Two Sum added (hashmap)** ✅ — Full M1.10 workflow: import-problem → Python tracer → ingest → Gate 1 ✅. DSL fixes applied (no `in` operator; `len(result) > 0` as proxy). `isValidVisual` extended to accept all 10 VisualState types. Stale module-level cache bug in `content-service.ts` removed. `mapLinkedList` got flat-array format support (see item 13).
13. **Reverse Linked List added (linkedList)** ✅ Gate 1 — Two approaches (`brute-stack`, `optimal`), 4 presets each incl. 2 edge cases. Gate 1 ✅ (8 traces, No Line Left Behind on 36 + 27 lines). Key fix: `mapLinkedList()` in `lib/tracer/mapping.ts` updated to detect and handle flat-array format (`nodes=[val0,val1,...]`, `links=[next0,next1,...]` where -1=none, `changedLinks=[nodeId,...]`) as produced by Python solutions using array-based linked list simulation; now also supports the structured `{id,value}` / `{from,to}` format for future problems. Gate 2 pending. **⚠ Known bugs to fix before Gate 2:** (a) `optimal/mapping.json` lines 23 & 24 tagged `"init"` but execute after the reversal loop — reclassify 23 → `"update"`, 24 → `"move"`; (b) `brute-stack/mapping.json` lines 33 & 34 same issue — reclassify 33 → `"update"`, 34 → `"move"`. **⚠ Cosmetic polish still needed** — pointer lane colors for `new head` and `node` pointers in brute-stack approach use the generic palette fallback (no named color in `PTR_COLOR`); head/tail pills are hard-coded to the first and last array positions rather than following `new_head` and `tail` pointer vars; `changedLinks` with `to:"-1"` (link cleared to null) renders nothing, which is correct but an explicit null-terminator indicator on the node's pointer box would be clearer. Needs review during Gate 2.
14. **Ingest quality improvement** ✅ — `lib/validators/validate-trace.ts`: added `narrationByLineKeys: Set<number>` to `ValidateTraceArgs`; post-step-loop check asserts every executed line has a specific `byLine` entry, failing ingest if any line would silently fall back to `byPhase`. `lib/tracer/pipeline.ts`: extracts byLine keys from loaded narration and passes them. `ADDING_PROBLEMS.md`: added phase meanings table to §8 phaseRules entry; added self-check items 13 (phase boundary) and 14 (byLine completeness) to §10. Prompted by phase misclassification bugs found post-authoring in Reverse Linked List. Phase classification bugs subsequently fixed (optimal lines 23/24, brute-stack lines 33/34 reclassified).
15. **D19 — Multi-structure visualization** ✅ — `CombinedVisualState` wraps primary + aux primitives; `auxMappings[]` in `mapping.json` drives rendering without per-problem custom components. Auto-layout (side-by-side vs stacked) computed from primary/aux orientation. `isValidVisual` extended for combined branch. `fitTextSize` added to `renderer-utils.ts` and applied across array/stack/queue renderers. First use: `reverse-linked-list/brute-stack` (LinkedList + Stack aux). `ADDING_PROBLEMS.md` §8 and §10 updated with `auxMappings` documentation. See D19.
16. **D20 — Custom renderer infrastructure + Merge Two Sorted Lists redesign** ✅ — `CustomVisualState` type + `customVars` DSL + `primitive:"custom"` branch in `mapLeaf()` + stage.tsx dynamic dispatch + `isValidLeaf()` validator fix. Merge Two Sorted Lists optimal-iterative redesigned: array-based solution, 3-chain custom HTML visualizer with directional CSS entrance animations. Gate 1 ✅ (38 steps). Process: `ADDING_PROBLEMS.md` §X Simulation Reasoning + item 17; `FidelityReview.md` per-renderer structural checks; CLAUDE.md D18 Step 2 strengthened with ASCII mockup + variable-population verification. See D20.
18. **Valid Parentheses added (stack)** ✅ Gate 1 — First real problem for the `stack` renderer (M1.8 exit gate). Single optimal "Matching Stack" approach (O(n)/O(n)), 5 presets (3 LeetCode examples + 2 edges: unmatched closer, leftover openers). First **string-input** problem (`supportsCustomInput:false`) and first **boolean-return** problem — return value named `result` on every exit path so the boolean RESULT panel works (convention from remove-linked-list). New pattern slug `balanced-brackets` added to `seeds/patterns.json` (no seeded pattern fit plain bracket-matching). First problem authored end-to-end through the **D21 liveness gate + preview review** — note: depth-1 input `()` needed phase-aware top coloring (`compared` while matching a closer, `current` otherwise) to clear the distinct-frame floor. Gate 1 ✅ (14 lines, No Line Left Behind, 5 traces), Gate 3 preview GREEN. Gate 2 formal fidelity review still pending. Live at `/problems/valid-parentheses`.
17. **D21 — Liveness fidelity gate + real-frame preview review** ✅ — `lib/validators/liveness.ts` analyzes each built trace's per-step `VisualState` and blocks unambiguous static/boring animations (distinct-frame floor, frozen-run, empty-aux, motionless-pointer; static-% advisory; short traces exempt). Wired into `dryRunApproach`, so both `npm run dry-run` and `npm run ingest` enforce it; reviewed legacy exemptions in `seeds/liveness-exempt.json` (new problems never auto-exempted). `npm run review-sheet` (`scripts/review-sheet.ts` + `lib/render/render-stage-svg.tsx`) renders the REAL frames into a self-contained `review.html` filmstrip for human Gate-3 sign-off — same VisualStates as ingest, so the preview is what ships. `add-problem-staged` skill restructured to author the animation LAST (S4b+S4c merged → `S4-simulation`; new `S5-preview-review` = Gate 3 before Mongo). See D21.

20. **Number of Islands added (grid)** ✅ Gate 1 + Gate 3 — First real problem for the `grid` renderer (M1.8 exit gate, 2026-07-05). Two approaches: `dfs` (flood fill, explicit stack — recommended, O(m·n)/O(m·n)) + `bfs` (flood fill, explicit queue — alternative, O(m·n)/O(min(m,n))); `supportsCompare` auto-true. 5 presets (LeetCode Ex1/Ex2 + edges: All Water=0, Diagonal Land=5 which tests 4-directional connectivity, Single Cell=1), 0 coverage gap, 10 traces ingested. **Design choices:** grid kept immutable with a separate `state` matrix (0=unseen/1=frontier/2=done) so cells light up in place rather than land vanishing; active cell marked via `current` cellState (not a grid pointer) to avoid a stray −1 crosshair during the scan phase; DFS uses a `stack` aux, BFS a `queue` aux (dequeued cells `visited`-tinted via `idx < head`) per D19. Authored end-to-end through the staged `add-problem-staged` pipeline (S0–S5) — all gates green (lint-dsl, No-Line-Left-Behind 30/32 lines, validate, liveness PASS though score ~13–15/100 advisory-low, inherent to per-cell flood fill). Gate 3 preview approved by user. **Gate 2 formal fidelity review still pending.** Sudoku Solver (#37) remains DEFERRED (see Deferred problems). Live at `/problems/number-of-islands`.

19. **Prototype→Product hardening sweep (2026-07-03)** ✅ — three workstreams:
    - **D22 — Standardization foundation**: `lib/site.ts` is now the ONLY source of NAV_LINKS + catalog stats (killed 4 duplicate nav lists + hardcoded 480/24/18/9); `lib/difficulty.ts` is the ONLY difficulty type/label/style map (medium = `--kn-med-*` everywhere; fed into `difficulty-badge`, problem-filters, home, top-bar); shared `components/shared/logo.tsx` + `theme-toggle.tsx` used by all 4 headers; `ThemeProvider` context + pre-hydration `ThemeScript` in `app/layout.tsx` (no dark-mode FOUC); global Nav gained a theme toggle; hex violation in `custom/merge-two-sorted-lists-visualizer.tsx` fixed to tokens.
    - **D23 — Performance (cache-first, RSC kept)**: `idSlugMap` TTL-memoized (was 3N Mongo round-trips per list render — the "slow on Vercel" root cause); `generateStaticParams` + `revalidate=3600` on problems/topics/patterns `[slug]` + list pages; topics/patterns counts via `$unwind/$group` aggregation (`getProblemCountsByTopic/Pattern`); **lazy trace loading** — problem page ships ONLY the recommended approach, others fetched on demand from `/api/problems/[slug]/traces` (spinner in TopBar selector); async `gunzip`; Mongo global singleton + pool tuning (`maxPoolSize:10, minPoolSize:1, serverSelectionTimeoutMS:5000`); `s-maxage=3600, SWR` headers on all read APIs. **Measured (local prod, warm)**: `/problems/two-sum` TTFB 213ms→5ms, payload 192KB→116KB (−40%); `/problems/4sum` 268ms→7ms, 373KB→182KB (−51%); `/problems` 585ms→~120ms.
    - **D24 — Renderer shared primitives + motion pass**: new `components/problem/shared/` (`cell-state.ts` single CellState style map replacing 8 per-renderer switches; `motion.ts` grammar constants; `pointer-pill.tsx` shared pill + full identity palette — fixes tree/graph pills hardcoded to `--kn-ptr-i`; `ghost-trail.tsx` renders `visual.ghosts` (behavior #3 was previously NEVER rendered); `layout-tidy-tree.ts` deduping tree/recursion layouts; `edge-path.ts`; `atoms.tsx` PopIn/labels). All 10 renderers upgraded: creation PopIn everywhere, array write-pop + ghosts, linked-list re-link draw-in (stroke-dashoffset), stack push-entrance, queue occurrence-keyed glide + enqueue slide-in, hashmap key-chip flies to its slot + "➜ slot i" readout + key-identity rows, tree edge draw-in + keyed fragments (React warning fixed) + cursor-ring animation (class existed but keyframe was missing), grid BFS wavefront distance-stagger + backward gold traceback + wall styling, graph edge draw-in on activation, recursion measured panel offsets (no overlap) + rising return chips. `stage.tsx` measured auto-fit (grow-only getBBox, Reset refits) replacing magic-number viewBoxes; `kn-cell-pulse` 1.1s→0.6s per motion grammar; **reduced-motion now actually enforced** for inline SVG transitions via the `.kn-stage-root` guard in globals.css.
    - Verified: `tsc` + `next lint` clean, `next build` green (73 static pages), all routes 200, no hydration errors. **Gate 2/filmstrip caveat**: renderer visuals changed for all 7 shipped problems — re-run `npm run review-sheet` filmstrips and eyeball before/after at next authoring session.

## Immediate next tasks
1. ~~**Gate 2 fidelity review** for Two Sum (`/problems/two-sum`), Reverse Linked List (`/problems/reverse-linked-list`), and Merge Two Sorted Lists (`/problems/merge-two-sorted-lists`) — per `rules/FidelityReview.md`. Step through each approach in the browser.~~ ✅ Done (2026-06-22)
2. ~~**Reverse Linked List cosmetic polish** — fix pointer lane colors for `new head`/`node` pointers in brute-stack; make head/tail pills follow actual `new_head`/`tail` vars after reversal begins; consider null-terminator indicator on the pointer box when a link is cleared.~~ ✅ Done (2026-06-22)
3. ~~**Merge Two Sorted Lists browser verification** — open `/problems/merge-two-sorted-lists`, switch to optimal-iterative, step through example-1: verify 3 chains render correctly, entrance animations trigger on splice, source chains shrink, result grows, drain phase works.~~ ✅ Done (2026-06-22)
4. ~~**Compare mode dual-lane UI** (M1.5R WS6b) — both pilots have `supportsCompare: true` + 2 Python-traced approaches ready; only `problem-engine.tsx` wiring remains.~~ ✅ Done (2026-06-22)
5. **M1.8 exit gate completion** — need ≥1 real problem for each of the 4 remaining renderers (recursion, tree, queue, graph). Each needs Gate 1 + Gate 2. New problems now run through the D21 liveness gate + preview review. (stack ✅ Valid Parentheses, grid ✅ Number of Islands.)
5a. **Gate 2 fidelity review — Number of Islands** (`/problems/number-of-islands`) — step through both approaches per `rules/FidelityReview.md`; confirm the flood-fill reads correctly (esp. Diagonal Land = 5 islands, and the DFS stack vs BFS queue wavefront distinction).
6. **M1.7 Hardening** — SEO, a11y, reduced-motion, sandbox abuse testing. Nothing started.
7. **D21 follow-up** — run `npm run review-sheet` against the 3 existing problems to sanity-check the liveness gate against known-good traces; confirm none trip a false positive (Two Sum optimal is ~75% stage-static, a long linked-list traversal ~91% — both should pass). Backfill `seeds/liveness-exempt.json` only if a reviewed-good legacy approach fails.

## Open questions
- **Custom-input sandbox tech** (deferred per D12): pyodide (WASM, in-browser, no server cost) vs. sandboxed subprocess API route. Decide when re-enabling custom input.
- `content_index` dropped; `problems` text index covers MVP search. Revisit if search needs ranking.
- **DSL `in` operator** — not supported by the expression evaluator. Workaround: use `len(result) > 0` or phase-based guards. Document in ADDING_PROBLEMS.md.

## Risks
- Tracer + sandbox complexity is the hardest remaining unknown (M1.5 blocker).
- Losing prototype fidelity when adding the linked-list renderer (M1.6).
- Content contracts drifting across docs and implementation as more problems are added.

## Deferred problems
- **Sudoku Solver (LeetCode #37)** — DEFERRED 2026-07-05. Backtracking on the exact LeetCode example board (51 empty cells) generates **~318,870 tracer steps** (measured), vs. `maxSteps` 1000 — a ~300× overrun that produces a >12 MB trace doc and an unwatchable 300k-position scrubber, breaking the cinematic USP (violates D15). Its true unit of work is search (try digit → validate row/col/box → recurse → **undo**), needing grid + recursion coordination (≥2 D17 criteria) that no shipped renderer honestly represents. **Blocked on:** a search-tree/backtracking renderer + a step-budgeting strategy (e.g. collapse validity-scan inner loops into one step, or cap trials) that keeps traces watchable. Author only after that infra exists.

## Deferred items
- Auth, progress, subscriptions, monetization, analytics expansion.
- Admin/CMS UI (web-based). CLI + ingest workflow remains the authoring tool for now.
- FastAPI backend (deferred per D16; Next.js API routes cover MVP needs).
- Custom input sandbox (deferred per D12; Pyodide vs server-side sandbox to be decided).
- Multi-language user-visible code tabs.
- Sheets population (currently empty seed).
- Additional primitives not in M1.8 scope (DP tables, trie, heap, union-find).

## Scale notes (for reference)
- MongoDB Atlas M10 ($57/mo) needed at 50+ problems with full traces.
- Vercel Pro ($20/mo) needed at launch for serverless timeout + edge caching.
- Redis/Upstash (~$0–$10/mo) for `getProblems()` caching at 200+ problems.
- MongoDB Atlas M20 ($115/mo) sufficient through 1,000 problems (~9,000 trace docs, ~1.8 GB compressed).
- Stack stays identical (Next.js + MongoDB) through 1,000 problems — no new services required.
