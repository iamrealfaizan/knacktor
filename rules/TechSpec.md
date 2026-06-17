# Technical Requirements — Knacktor

> **Status:** v1.0 — implementation-level.
> **Companion docs:** product requirements in [PRD.md](PRD.md); data contracts in [Schema.md](Schema.md); design tokens/motion in [Design.md](Design.md); execution safety in [Security.md](Security.md); UI/UX authority is [`4Sum Visualizer.html`](4Sum%20Visualizer.html).

## 1. Summary
The first build produces a **reusable platform and visualizer engine fed by problem data** — not a collection of hardcoded pages. Stack: **Next.js (App Router)** with a shared **Content Service**, a reusable **Engine** (renderer + playback controller + visual-primitive library), a **MongoDB** canonical store served by slug, and a **Python trace-generation pipeline** (precomputed for presets, sandboxed on-demand for custom input).

## 2. Stack
- **Frontend framework:** Next.js, App Router.
- **UI system:** `shadcn/ui` components only, unless explicitly exempted (hard requirement).
- **Icons:** `lucide-react` only, unless explicitly exempted (hard requirement).
- **Styling:** design-token system matching the prototype exactly (see [Design.md](Design.md)).
- **Visualized code language:** Python first (single visible language; model leaves room for more).
- **Canonical data store:** **MongoDB** (served dynamically by slug).
- **Animation:** SVG primitives driven by a motion library (Motion One / GSAP / Framer Motion), with HTML overlays for labels/pointer chips. Renderer-agnostic data contract (see [Schema.md](Schema.md) §VisualState).
- **Tracer:** Python, `sys.settrace`-based.

## 3. Architecture

### 3.1 Core principles
- No problem page hardcodes content inside UI components.
- The visualizer **Engine is shared** across all problems.
- UI consumes data only through the unified **Content Service**.
- **MongoDB is the canonical served source of truth**; authored files are the reviewable authoring/seed format ingested into it (DB-canonical, file-seeded).
- The product stays SEO-friendly while supporting a heavy interactive player (SSR + hydrate).

### 3.2 Content operating model (DB-canonical, file-seeded)
```
problems/<slug>/                 ingest pipeline            MongoDB (canonical)         Content Service        Pages/Engine
  solution.py (+annotations) ─tracer─▶ trace docs   ─upsert─▶ problems              ─▶  resolveProbl(slug) ─▶ SSR + hydrate
  meta.yaml                                                   traces                                        (player mounts on data)
  narration.md                                               topics/patterns/sheets
  presets.yaml                                               content_index (search)
```
- **Authoring (files):** reviewable, version-controlled per problem package.
- **Ingest:** validates content against the contracts ([Schema.md](Schema.md)), runs the tracer on presets, and **upserts** problem + trace + discovery docs into MongoDB. Idempotent and re-runnable.
- **Serving:** the Content Service reads MongoDB by slug. Pages never touch file layout or raw query shape.

### 3.3 Main subsystems
- App shell & routing
- Content Service (single data boundary)
- Catalog & discovery layer
- Problem-page **Engine**: player, visual-primitive renderer, playback controller
- Python trace pipeline (preset build-time + sandboxed on-demand)
- Content validation + ingest pipeline
- MongoDB canonical store + search index

## 4. The Engine (built once, fed by data)

### 4.1 Components (reusable across all problems)
- **CodePanel** — real source, per-step line highlight (auto-scroll into view), hover-line explanations, copy, approach tabs.
- **Stage + Primitive renderers** — a library of visual primitives. Each problem **declares** which primitive(s) it uses; the renderer reads the primitive-specific `VisualState` per step. MVP primitives: **array/string + pointers/window, linked list, recursion/call-stack**.
- **Narration** — four synchronized readouts per step: what's happening / why / line explanation / invariant.
- **InsightRail** — live variables (flash on change), live complexity meters (ops vs budget), data-structure state, call stack.
- **ControlDock** — transport (first/prev/play-pause/next/last), speed, draggable scrubber (step X / N), jump-to-key-event markers, input selector + custom-input entry.

### 4.2 Primitive policy (D2 — "both")
- **Default:** problems are pure data declaring an existing primitive + per-step states. **No per-problem rendering code.**
- **New structure:** building its primitive renderer is a **one-time Engine task**; afterwards the whole family is data-only.
- **Escape hatch:** a problem may register **bespoke rendering** when a visual genuinely needs it. Used sparingly; must still honor the semantic color/motion grammar in [Design.md](Design.md).

### 4.3 The simulation / animation pipeline (USP)
Each `Step` is a **complete snapshot** (no diffs to apply), so seeking to any step is O(1) to render. The Engine derives motion by **diffing consecutive snapshots**:
- **Variable birth:** a name present in `vars[i]` but absent in `vars[i-1]` → its chip **enters** the variables view, rendered empty / `∅`.
- **Population / change:** names in `changedVars` → chip **flashes** and updates to the new value.
- **Movement:** `ghosts` and primitive `pointers`/`cellStates`/`changedLinks` describe before→after positions → the value/marker **glides** along a path (no instant jump).
- **Focus:** the `current` element is spotlighted; others dim.
- **Counters:** `counters` fill the complexity meters against `complexityBudget`.

Shapes, tokens, motion timing/easing, the four mandated behaviors (creation pop-in, population, smooth movement, path-tracing), and all per-structure/per-pattern choreography are governed by the canonical [SimulationRules.md](SimulationRules.md) (page-layout tokens in [Design.md](Design.md)). Transitions are **interruptible**: seeking/stepping mid-transition cancels and snaps cleanly to the target step.

### 4.4 Modes
- **Learn** (default), **Focus** (stage dominant, side panels collapse to icon rails), **Compare** (top-level; two approaches on one input with independent playheads; smart-default pair + user override; **hidden** when no meaningful comparison).

## 5. Content Service
The single application-facing boundary for content. It resolves problems by slug, topic/pattern/sheet metadata, and traces; exposes `supportsCustomInput`; and **hides** whether a value came from the canonical collection, the search index, or a cache. Pages and the Engine depend only on the contracts in [Schema.md](Schema.md).

## 6. Runtime delivery
- Homepage, catalog, topic, pattern, sheet, and problem pages **SSR meaningful content**.
- The Problem Page **SSRs** statement + metadata, then **hydrates** the interactive player, which mounts against data loaded by the Content Service.

## 7. Trace pipeline

### 7.1 Source of truth
- Traces are generated from **executed Python**, not hand-invented. Light author annotations declare the primitive + which variables map to pointers/structures, and attach per-line/per-phase narration.
- **One step per executed line (D8):** the tracer emits a `Step` for **every executed source line**, re-emitting per loop iteration, so every line is walked and explained ([SimulationRules.md](SimulationRules.md) §A-6, [Schema.md](Schema.md) §2.5). **Perf/volume note:** step counts grow with execution length — cap traced input sizes (legibility + frame budget), store steps compactly, and rely on the snapshot model for O(1) seek. **Key events** (swap, match, push/pop, return, answer appended) are flagged to drive scrubber markers.

### 7.2 Preset traces
- Precomputed during ingest, stored in MongoDB (`traces`), versioned. **Instant playback.**

### 7.3 Custom input (M1 scope)
- Supported only where the problem contract permits. Input is **validated and normalized** against constraints, then traced **on demand** through the **sandboxed runner**.
- The runner is **isolated** with hard limits (time, memory, recursion depth, output size) and **no filesystem/network** access for user code. Endpoints are **rate-limited**. Full controls in [Security.md](Security.md).
- **Recommended execution model (control-level, not a mandate):** an isolated container or microVM worker, or a hardened subprocess using `seccomp` + `rlimits` + a restricted interpreter, invoked from a Next.js route handler / server action. Alternatives (e.g. a managed code-execution service, or future in-browser Pyodide) are acceptable if they meet the same control bar.

## 8. Data contracts
The implementation formalizes `Problem`, `Approach`, `PresetInput`, `Trace`, `Step`, primitive-specific `VisualState`, plus `Topic`, `Pattern`, and `InterviewSheet`. Contracts are **versioned**. Canonical definitions: [Schema.md](Schema.md).

## 9. Routing (readable learning URLs)
- `/`, `/problems`, `/problems/[slug]`, `/topics/[slug]`, `/patterns/[slug]`, `/sheets/[slug]`.
- Internal numeric ids, if any, stay **secondary** to slug routes.

## 10. Non-functional requirements
- **Desktop is canonical**; tablet/mobile degrade gracefully.
- Public content must be usable and indexable without client-only rendering.
- **60fps target** for stage motion at default input sizes; seek is O(1) to render (snapshot model).
- Player stays resilient to seeking and mode changes mid-playback.
- Custom-input trace latency is bounded with a clear loading state.
- Bundle discipline: the page stays light; the heavy tracer lives server-side.
- MVP runs without auth, progress, or paid-gating; those boundaries are reserved, not built.

## 11. Exclusions for the first build
- Public admin panel / broad CMS workflow.
- Cloud progress sync.
- Multi-language user-visible code tabs.
- Large-scale analytics system.
