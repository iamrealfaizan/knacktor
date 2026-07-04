# Rules — Knacktor

> **Status:** v1.0 — **hard constraints**. These are mandatory; an implementation must not violate them without an explicit, recorded exception in [Tracker.md](Tracker.md). Most strict about **content + UX consistency**.

## 1. UI/UX authority
- [`4Sum Visualizer.html`](4Sum%20Visualizer.html) is the **final, locked** UI/UX reference. The flagship problem page must match it exactly in layout, behavior, palette (warm-paper), typography (Inter + JetBrains Mono), control model, and motion.
- If written docs and the prototype disagree on UI/UX, **the prototype wins** unless explicitly overridden in [Tracker.md](Tracker.md).
- The product is **visualizer-first**, not article-first. Desktop is the canonical problem-page experience.
- The **warm-paper palette is canonical** (D3): match the prototype's exact surfaces/strokes/fonts (Inter + JetBrains Mono). The canonical token + state palette lives in [SimulationRules.md](SimulationRules.md) §A-2 (page chrome in [Design.md](Design.md)); dsaPRD Part II is archived.
- Homepage, catalog, topic pages, pattern pages, and sheets are **distinct surfaces** and must not collapse into one generic template without an explicit decision.

## 2. Content architecture (D1 — DB-canonical, file-seeded)
- **MongoDB is the canonical served source of truth.** Problems are authored as structured files, validated, traced, and **ingested into MongoDB**; the app serves dynamically by slug.
- No problem page hardcodes content inside UI components. All content is structured data consumed by slug.
- UI consumes data only through the unified **Content Service**; pages never depend on raw file paths or query shape.
- `slug` is the primary route-facing identifier.
- Content contracts ([Schema.md](Schema.md)) are **versioned**; no unversioned breaking change to renderer-facing structures.

## 3. Engine & primitives (D2 — both)
- Build a **reusable engine and visual-primitive library once**, never one-off per-problem pages.
- A problem that reuses an **existing primitive** must be added by **authoring data + tracing + ingest, with no UI code change**.
- A brand-new structure's primitive renderer is a **one-time engine task**; afterwards that family is data-only.
- **Bespoke per-problem rendering is allowed only as an escape hatch** when a visual genuinely needs it — never the default — and must still honor the [Design.md](Design.md) color/motion grammar.

## 4. Simulation legibility (the USP — hard requirement)
- **All simulations MUST conform to [SimulationRules.md](SimulationRules.md)** — the canonical authority for shapes, tokens, motion, and per-structure/per-pattern choreography. It supersedes dsaPRD Part II.
- The **four mandated behaviors** are hard requirements on every structure and pattern:
  1. **Creation pop-in** — a newly created variable/structure/node visibly appears; a new variable chip enters empty/`∅`.
  2. **Population** — a chip/cell flashes and fills when assigned.
  3. **Smooth movement** — any value/pointer relocation glides along a visible path — **never an instant jump**.
  4. **Path-tracing** — traversals/searches draw the covered path progressively (e.g. a tree search lights the route as it's covered).
- **Every executed source line emits its own step + line explanation** (D8); loops re-emit per iteration; key events get scrubber markers.
- **Each data structure must be visually distinguishable** by silhouette (arrays = square cells, linked list = split value+pointer boxes, trees/graphs = circles+edges, stack = vertical container, etc. — see [SimulationRules.md](SimulationRules.md) §A-7).
- Exactly **one `current`** element is spotlighted at a time; ≤ 6 simultaneous semantic colors; never rely on hue alone.
- Code line, narration, and animation must describe the same step at all times.

## 4.1 Simulation fidelity (D15 — TWO mandatory gates)
- **A problem is accepted only after passing BOTH gates. Passing `npm run ingest` is necessary but NOT sufficient.**
  - **Gate 1 — Ingest (mechanical).** No-Line-Left-Behind, narration completeness, expected-output match, DSL/visual validity. Proves the trace is *structurally* sound — **not** that it teaches the algorithm.
  - **Gate 2 — Fidelity review (semantic, human/Claude-judged).** The animation must faithfully represent the algorithm's **actual operations and state**: the visual's **unit of work must match the algorithm's unit of work** (compare characters → show characters; compare elements → show elements; shrink a window → show the window shrink). Pointers, cell-states, and readouts must correspond to what the code is genuinely doing at each step. Motion must *explain the real operation*, never decorate. See [FidelityReview.md](FidelityReview.md) for the criteria.
- **If the available primitives cannot represent the algorithm's true unit of work, the problem is DEFERRED** until the right renderer is built (a one-time engine task). **Never ship a structurally-valid but misleading visual** (e.g. drawing whole strings as cells when the algorithm compares characters column-by-column). A wrong-but-passing simulation is worse than no simulation — it breaks the learner's trust, which is the product.

## 5. Taxonomy
- Canonical discovery axes: `difficulty`, `topic`, `pattern`. Difficulty = `Easy` / `Medium` / `Hard`.
- Topic pages and pattern pages are separate concepts on separate routes.
- Interview sheets are classic prep-style collections, **not** progress systems in MVP.

## 5.1 Renderer choice — mandatory user confirmation (scaling rule)
- **Every new problem addition must pause at the renderer-selection step and present a full renderer analysis to the user before proceeding.** This is non-negotiable, even when an existing renderer is the obvious fit.
- The analysis must cover: (a) recommended renderer + unit-of-work match, (b) exactly how the DSL wires up to the algorithm's state (concrete field-level mapping, pivotal step walkthrough), (c) whether the D17 custom-escape-hatch criteria apply (≥2 of 3), (d) any fidelity risk or DSL limitation.
- The agent must wait for explicit user confirmation of the renderer choice before running the tracer or ingesting.
- **Rationale:** the renderer decision is the highest-leverage call in problem authoring — a wrong choice passes Gate 1 but fails Gate 2, wasting the full trace + narration effort. Confirming with the user upfront costs 30 seconds and prevents hours of rework.

## 6. Content authoring
- No MVP problem is publishable without a **full teaching package** (statement, metadata, ≥1 traced Python approach, line explanations, narration, presets, validated visual behavior).
- Traces are generated from **executed code** as the primary source of truth; preset traces are precomputed and versioned.
- `supportsCustomInput` is **explicit per problem**.
- Multiple approaches are strongly preferred but not mandatory.
- Compare mode is **hidden** for problems without meaningful comparison.

## 6.1 Preset test cases — pedagogical scenario coverage (hard requirement, ALL problems, no exceptions)
- **Preset inputs are teaching artifacts, not just correctness checks.** They are the cases a learner actually watches animate, so every problem's preset set MUST be curated to teach the algorithm — never a bag of generic, simple, or near-duplicate inputs.
- **Each preset must reveal a distinct behavior the learner cannot see in the others.** Before a preset earns its place, answer: *"what does the learner see here that no other preset shows?"* If the answer is "nothing", the preset is replaced — two inputs that trace the same visual story count as one.
- **The set must span the problem's meaningful scenario space**, not just the happy path. As applicable to the specific problem, include: the canonical/typical case; the instructive **boundary/edge** cases (empty, single element, minimum size, maximum-in-scope size); and every case that **changes the visual narrative** — e.g. target found early vs. not found at all, match vs. no match, duplicates / all-equal, already-sorted vs. reverse-sorted, negative/zero values, hashmap collision vs. clean insert, cycle vs. no cycle, deepest-recursion / full-backtrack, the branch that triggers the `error`/`rejected` state. A learner stepping through the full preset set should come away having seen the algorithm succeed, hit its edges, and fail/short-circuit where it can.
- **Forbidden:** a preset set that only exercises trivial "generic simple" inputs, or that never shows an edge/failure/alternate-branch scenario. This is distinct from — and stronger than — the mechanical No-Line-Left-Behind coverage gate (§4.1 Gate 1): line coverage proves *code ran*; this rule requires the *scenarios a learner needs to build intuition* are all visible.
- This is a **Gate 2 fidelity concern** — a problem with structurally-valid but pedagogically-thin presets does not pass fidelity review. See [Authoring.md](Authoring.md) §3 for the operational spec and naming.

## 7. Engineering
- `shadcn/ui` components for everything unless explicitly exempted.
- `lucide-react` icons for everything unless explicitly exempted.
- All colors are **design tokens**; never inline hexes in components.
- Custom-input execution is **sandboxed** with hard resource limits and no fs/network for user code (see [Security.md](Security.md)).
- Keep MVP architecture compatible with future auth, monetization, and progress without forcing them into the first build.

## 8. UX
- Search is a **primary** interaction on the homepage.
- The problem page defaults to the visualizer; statement content lives in an overlay/drawer.
- The **no-scroll desktop teaching loop** is a hard requirement for the problem page.
- Approach comparison summary is visible **before** playback starts.
- Motion must explain, not decorate.

## 9. Quality
- Do not trade prototype fidelity for implementation convenience on the flagship page.
- Do not broaden content count at the cost of teaching quality.
- Do not introduce progress-tracking behavior implicitly into MVP sheets or problem pages.
