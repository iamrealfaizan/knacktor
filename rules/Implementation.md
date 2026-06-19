# Implementation Plan — Knacktor

> **Status:** v1.0 — phases + milestones with explicit gates.
> **Goal of the first build:** prove the **reusable engine + platform** fed by problem data, not maximize catalog size. Companions: [PRD.md](PRD.md), [TechSpec.md](TechSpec.md), [Schema.md](Schema.md), [Security.md](Security.md).

## Phase 0 — Documentation lock (M0)
- Finalize the full document set; resolve naming, taxonomy, routes.
- Freeze prototype-authoritative UI rules and the locked decisions D1–D4 (see [Tracker.md](Tracker.md)).
- **Exit gate:** all nine docs present, internally consistent, no surviving contradictions (DB-canonical, prototype palette, live custom input in M1, primitive policy).

## Phase 1 — Platform foundation (M1.1)
- Initialize the Next.js (App Router) app.
- Establish the shared UI system: `shadcn/ui` + `lucide-react`, design tokens (warm-paper palette, light/dark) from [Design.md](Design.md).
- Global layout, theme system, route skeletons (`/`, `/problems`, `/problems/[slug]`, `/topics/[slug]`, `/patterns/[slug]`, `/sheets/[slug]`).
- Stand up **MongoDB** and the **Content Service** boundary.
- **Exit gate:** app shell, routing, theme, and content-loading foundations stable; Content Service resolves by slug.

## Phase 2 — Content schema + ingest pipeline (M1.2)
- Implement the [Schema.md](Schema.md) collections, contracts, indexes, and versioning.
- Build the **authoring file format** (`problems/<slug>/`) and the **idempotent ingest pipeline** (validate → trace presets → upsert into MongoDB + `content_index`).
- **Exit gate:** a sample problem package ingests cleanly and is served by slug through the Content Service.

## Phase 3 — Discovery surfaces (M1.3)
- Homepage shell (search primary + curated interview-sheet surfaces + featured topics/patterns).
- Catalog (medium-density browse, `difficulty + topic + pattern` filters, simple sorts).
- Topic-page and pattern-page templates (distinct surfaces).
- Sheet-page template (navigational, compact guidance).
- **Exit gate:** users navigate homepage → discovery surfaces → problem routes on real ingested content; surfaces SSR + are SEO-aware.

## Phase 4 — Problem-page engine (M1.4)
- Canonical layout (top bar, code panel, stage + narration, insight rail, pinned dock) matching the prototype.
- **Learn / Focus / Compare** modes (Compare: smart-default pair + override; hidden when unsupported).
- CodePanel (line highlight, hover-line explainers, approach tabs, copy), Narration (4-part), InsightRail (variables/complexity/DS-state/call-stack), ControlDock (transport/speed/scrubber/key-event jumps/input selector).
- **Stage + primitive renderers** for MVP primitives: **array/string + pointers/window, linked list, recursion/call-stack** — data-driven (D2).
- **Simulation pipeline:** snapshot-diff animation for variable **birth / population / movement**, spotlight, ghosting, change-flash (the USP).
- **Exit gate:** the player drives synchronized code/stage/narration/insights from trace steps; transport/seek/speed/key-events work; modes behave like the prototype.

## Phase 5 — Trace pipeline (M1.5)
- Python `sys.settrace` tracer: execute solution, snapshot vars/structures/call stack **per executed line** (D8; loops re-emit), derive `VisualState`, count operations, mark key events, attach narration → versioned JSON ([Schema.md](Schema.md), [SimulationRules.md](SimulationRules.md) §A-6).
- **Preset traces** precomputed during ingest (instant playback).
- **Live custom input (in M1):** validated/normalized input → on-demand trace in the **sandboxed runner** (time/memory/recursion/output caps, rate limits, no fs/network — see [Security.md](Security.md)).
- **Exit gate:** a structured package drives the player end-to-end for presets **and** validated custom input within bounded latency.

## Phase 6 — Pilot problems (M1.6)
- **`4Sum`** first (array + two-pointers; prototype parity).
- **`Reverse Linked List`** (recommended 2nd pilot — proves linked-list + recursion primitives); confirm final pick in [Tracker.md](Tracker.md).
- Both meet the **full teaching package** bar.
- **Exit gate:** 1–2 fully polished problems prove the model and that a second primitive family renders with no page redesign.

## Phase 7 — Hardening (M1.7)
- SEO verification across discovery surfaces; accessibility verification (contrast, keyboard, reduced-motion); interaction + motion polish; custom-input boundary validation; sandbox abuse testing.
- **Exit gate:** MVP ready for controlled release / further content expansion.

## Phase 8 — Generic Renderer Library (M1.8) ⏳ Engine done, exit gate pending

**Engine: ✅ Complete.** All 8 renderer families built and SimulationRules-audited.

| Renderer | VisualState type | Component | Mapping DSL | Status |
|---|---|---|---|---|
| `HashMapRenderer` | `HashMapVisualState` | `hashmap-renderer.tsx` | `keysFrom`, `highlightRules`, `highlightKeyVar` | ✅ Built |
| `RecursionRenderer` | `RecursionVisualState` | `recursion-renderer.tsx` (rounded-rect nodes, `<path>` edges) | `framesFrom`, `treeEdgesFrom`, `currentFrameVar` | ✅ Built |
| `TreeRenderer` | `TreeVisualState` | `tree-renderer.tsx` | `nodesFrom`, `nodeStateRules`, `currentNodeVar` | ✅ Built |
| `LinkedListRenderer` | `LinkedListVisualState` | `linked-list-renderer.tsx` | `nodesFrom`, `linksFrom`, `changedLinksFrom` | ✅ Built |
| `StackRenderer` | `StackVisualState` | `stack-renderer.tsx` (88×40 cells) | `itemsFrom`, `topVar` | ✅ Built |
| `GridRenderer` | `GridVisualState` | `grid-renderer.tsx` (28px cells, 1px gridlines) | `gridFrom`, `pointers[rowVar/colVar]` | ✅ Built |
| `QueueRenderer` | `QueueVisualState` | `queue-renderer.tsx` (48×48, 4px gap) | `itemsFrom`, `frontVar`, `backVar` | ✅ Built |
| `GraphRenderer` | `GraphVisualState` | `graph-renderer.tsx` (`<path>` edges, arrowheads) | `nodesFrom`, `edgesFrom`, `nodeStateRules`, `directed` | ✅ Built |

`lib/trace.ts` has all 10 VisualState types. `stage.tsx` dispatches all 10 with correct per-primitive viewBox. `lib/tracer/types.ts` and `lib/tracer/mapping.ts` fully wired.

**Custom component escape hatch (D17):** `components/problem/custom/<slug>-visualizer.tsx`, registered in `stage.tsx` via dynamic import. Justified only when ≥2 D17 criteria apply.

- **Exit gate:** ❌ Each renderer needs ≥1 real problem end-to-end passing Gate 1 + Gate 2. Two Sum (hashmap) is the planned first.

## Phase 9 — API Layer (M1.9) ✅ Done

All 6 read-only routes live at `app/api/`, wrapping the Content Service (D16). Response shape: `{ data: T, error?: string }`, standard HTTP codes. Build clean.

| Route | Status |
|---|---|
| `GET /api/problems` (filters: difficulty, topic, pattern, search) | ✅ |
| `GET /api/problems/[slug]` | ✅ |
| `GET /api/problems/[slug]/traces?approachId=&inputId=` | ✅ |
| `GET /api/topics` | ✅ |
| `GET /api/patterns` | ✅ |
| `GET /api/difficulties` | ✅ |

- **Exit gate:** ✅ Met.

## Phase 10 — Problem-Addition Framework (M1.10) ⏳ Tooling done, exit gate pending

All tooling built:
- **`ADDING_PROBLEMS.md`** ✅ — fully rewritten; all 10 primitives documented with DSL quick-reference, `visualizationIntent` required field, 10-point self-validation.
- **`tracer/template/problem.combined.json`** ✅ — updated instructions name all primitives; `visualizationIntent` field in approach template.
- **`scripts/import-problem.ts`** ✅ — writes `visualizationIntent` to `approach.json`.
- **`CLAUDE.md` ADD-PROBLEM WORKFLOW** ✅ — full 6-step workflow (D18) documented.

- **Exit gate:** ❌ Paste a Two Sum combined JSON → `npm run import-problem` → Python tracer → `npm run ingest` → confirm `/problems/two-sum` renders correctly with the hashmap renderer.

## Deferred work (post-M1)
- Accounts/auth, progress tracking, monetization surfaces, heavy analytics.
- Public admin UI / CMS, content-automation tooling.
- FastAPI backend (deferred per D16).
- Additional primitives not in M1.8: DP tables, trie, heap, union-find.
- Multi-language user-visible code tabs.
- Custom-input sandbox (deferred per D12).

## Delivery priorities
1. Shared engine + player fidelity (incl. simulation legibility).
2. Content architecture correctness (DB-canonical, file-seeded ingest).
3. Discovery surfaces.
4. Pilot quality.
5. Scale-oriented tooling.
