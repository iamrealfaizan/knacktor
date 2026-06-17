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

## 5. Taxonomy
- Canonical discovery axes: `difficulty`, `topic`, `pattern`. Difficulty = `Easy` / `Medium` / `Hard`.
- Topic pages and pattern pages are separate concepts on separate routes.
- Interview sheets are classic prep-style collections, **not** progress systems in MVP.

## 6. Content authoring
- No MVP problem is publishable without a **full teaching package** (statement, metadata, ≥1 traced Python approach, line explanations, narration, presets, validated visual behavior).
- Traces are generated from **executed code** as the primary source of truth; preset traces are precomputed and versioned.
- `supportsCustomInput` is **explicit per problem**.
- Multiple approaches are strongly preferred but not mandatory.
- Compare mode is **hidden** for problems without meaningful comparison.

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
