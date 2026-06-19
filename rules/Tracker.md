# Tracker — Knacktor

> **Role:** living **roadmap + decision log** (both). The AI agent and team update this to keep the whole picture in mind. Major planning decisions are recorded **here only** (single source, no duplication).

## Current status
- Project state: **RENDERER EXPANSION + CONTENT SCALING (2026-06).** Re-architecture (D9–D15) is complete. New phase: building the generic renderer library (M1.8), adding the API layer (M1.9), and extending the problem-addition framework (M1.10) to support all data-structure types. Database stays MongoDB (no PostgreSQL migration). FastAPI backend deferred. See D16–D18.
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
- **D18 — Problem-addition workflow.** When a filled template is pasted: agent parses+splits, analyzes viz needs (D17 rule), runs tracer, builds custom component if needed (one checkpoint before writing custom code), ingests, confirms at `/problems/<slug>`. Full flow in CLAUDE.md § ADD-PROBLEM WORKFLOW. Gate 2 (FidelityReview.md) still required.

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
| `M1.5R` | **Re-architecture** (D9–D14): hybrid Python tracer ✅, `_id` DB ✅, generic engine ✅, authoring template + trace validation ✅; Compare dual-lane ❌ | ⏳ In progress |
| `M1.5` | Custom-input runtime sandbox (deferred per D12) | ⏸ Deferred |
| `M1.6` | Pilot problems — `4Sum` ✅ + `Container` ✅ on Python tracer | ✅ Done |
| `M1.7` | Hardening (SEO / a11y / motion / sandbox abuse) | ❌ Not started |
| `M1.8` | **Generic renderer library** — hashmap, recursion/call-stack, tree, linkedList, stack, queue, grid, graph (in priority order). Each: new VisualState type + renderer component + Stage dispatch + mapping DSL extension + ADDING_PROBLEMS.md update | ❌ Not started |
| `M1.9` | **API layer** — read-only Next.js API routes at `app/api/` wrapping Content Service. Routes: `/problems`, `/problems/[slug]`, `/problems/[slug]/traces`, `/topics`, `/patterns`, `/difficulties` | ❌ Not started |
| `M1.10` | **Problem-addition framework** — extended ADDING_PROBLEMS.md (all primitives + visualizationIntent), add-problem workflow in CLAUDE.md, `visualizationIntent` field in approach.json | ❌ Not started |
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

## Immediate next tasks
1. **Delete dead legacy code** — both pilots are bundles and the engine now reads DB traces for all approaches via `approachTraces` (page loads them per approach; `TRACERS`/`validateCustomInput` removed from the engine). Now removable: `lib/tracers/*`, `lib/fixtures/4sum.ts`, the `TRACERS` registry, and `ingestProblem`/`ProblemSource`/the fixture imports + legacy block in `scripts/ingest.ts`.
2. **Compare mode dual-lane UI** (WS6b) — both pilots now have `supportsCompare:true` + 2 Python-traced approaches, ready to wire.
3. **`validate-problem.ts`** (bundle shape / reference / ≥3-preset checks) to complete D13.
4. New structure renderers (linked list, tree, …) as each new problem needs one.

## Open questions
- **Custom-input sandbox tech** (deferred per D12): pyodide (WASM, in-browser, no server cost) vs. sandboxed subprocess API route. Decide when re-enabling custom input.
- **Reverse Linked List** as third problem — needs the linked-list renderer (out of scope for the current slice).
- `content_index` dropped; `problems` text index covers MVP search. Revisit if search needs ranking.

## Risks
- Tracer + sandbox complexity is the hardest remaining unknown (M1.5 blocker).
- Losing prototype fidelity when adding the linked-list renderer (M1.6).
- Content contracts drifting across docs and implementation as more problems are added.

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
