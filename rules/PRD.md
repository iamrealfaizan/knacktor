# Product Requirements Document — Knacktor

> **Working name:** Knacktor (placeholder until branding is finalized).
> **Document type:** Canonical product requirements for the full platform, with the Problem Page as the flagship surface inside it.
> **Audience:** Product + Engineering (usable directly by both).
> **Status:** v1.0 — implementation-ready.
> **Authority:** [`4Sum Visualizer.html`](4Sum%20Visualizer.html) is the source of truth for problem-page UI/UX. [dsaPRD.md](dsaPRD.md) (page spec + canonical visual design system) and [MainScreenDesign.md](MainScreenDesign.md) (layout exploration) are **referenced inputs**. Data contracts live in [Schema.md](Schema.md); architecture in [TechSpec.md](TechSpec.md).

---

## 1. Summary

Knacktor is a **desktop-first DSA learning platform** that helps people *understand* algorithms visually, not just read about them. It pairs a **LeetCode-familiar catalog** (so users transition with zero friction) with a flagship **Problem Page** where the learner watches an algorithm *solve itself* — real Python highlighting line-by-line, a cinematic animation in the center, and every variable, counter, and complexity meter updating live, all controlled like a media player.

The product is **free at launch** but architected so monetization, accounts, progress, and analytics can be added later without rework. The first milestone proves the **engine + platform** with **1–2 fully polished pilot problems**, not a large low-quality catalog.

## 2. Vision & USP

### 2.1 The product in one sentence
A no-scroll web page where a learner presses play and an algorithm becomes visually obvious in minutes — the code shows *what* runs, the animation shows *how* data moves, the narration explains *why*, and live meters quantify the *cost*.

### 2.2 The USP — the simulation
The **simulation is the product's single most important asset**. It must be the cleanest, smoothest, most understandable algorithm animation available anywhere. The simulation is held to these explicit, non-negotiable legibility requirements:

- **Variable birth is visible.** When the code creates a new variable, a chip for it visibly *appears* in the variables view, shown empty / `∅` — the learner sees "a new variable now exists, and it's empty."
- **Population is visible.** When a variable receives a value, its chip flashes and fills with the value.
- **Movement is visible.** When a value moves from one place to another (array → result set, node → stack, child → parent), it **glides smoothly along a path** so the learner sees exactly *where* the value went — never an instant jump.
- **Focus is directed.** The element(s) acted on this step are spotlighted; everything else dims.
- **Line sync is exact.** The highlighted code line, the narration, and the animation always describe the same step.

Every other surface on the page exists to support the simulation.

### 2.3 Design north stars
1. **Show, don't tell** — the visual carries the understanding; text supports it.
2. **Calm, not cluttered** — dense with information, but ordered and never noisy.
3. **Real, not fake** — the animation is generated from the *actual executed code*, so it can never lie.
4. **Beginner-first** — someone who has never seen the algorithm should "get it" on the first play.
5. **One format, every problem** — arrays, linked lists, trees, graphs, hashing, DP all use the same page.

## 3. Target Users

| Persona | Description | Primary job |
|---|---|---|
| **Visual learner / beginner** *(primary)* | New to DSA; struggles with text-only or generic resources. | "Help me *see* how this algorithm works, from zero." |
| **Interview candidate** | Knows basics; revising patterns. | "Refresh this pattern fast and see the optimal approach + its cost." |
| **Educator / explainer** | Teaching a student or audience. | "Step to an exact moment and explain what's happening." |

Every ambiguity is resolved in favor of the **visual learner / beginner**.

## 4. Business Context
- **Free at launch.** No paywalls, no billing in MVP.
- **Monetization-ready.** Architecture leaves clean boundaries for future accounts, subscriptions, progress, and analytics (see [TechSpec.md](TechSpec.md) and [Security.md](Security.md)).

## 5. Product Goals
- Help beginners and visual learners understand algorithms faster than static articles or generic code editors (**primary success metric: understanding speed**).
- Provide a LeetCode-familiar discovery experience (categories, topics, patterns, difficulty naming) so users transition easily.
- Make the Problem Page the strongest teaching surface anywhere.
- Ship a **reusable engine fed by problem data** so new problems are added without writing page code (see §9).
- Launch the engine + platform with **1–2** fully polished pilot problems.

## 6. How content is created and served (the core operating model)

This section answers the central product question: *how do we keep adding new problems, solutions, and visualizations without coding each one?*

```
AUTHORING (files, reviewable)        INGEST            SERVE (dynamic)         RENDER (built once)
problems/<slug>/                                       MongoDB                 Reusable Engine
  solution.py (+annotations)  ─tracer─▶ trace.json ─▶  problems / traces  ─▶   CodePanel · Stage+Primitives
  meta.yaml                                            topics/patterns/sheets  Narration · InsightRail · Dock
  narration.md · presets.yaml                          (served by slug)
```

- **The Engine is written once.** Adding a problem that **reuses an existing visual primitive** (array, linked list, recursion/call-stack at MVP) = author the data + run the tracer + ingest. **No UI code.**
- **A brand-new structure is a one-time engine task.** The first time a new data structure appears (e.g. the first graph problem), its primitive renderer is built **once**; every later problem of that family is then **data-only**.
- **A bespoke escape hatch exists.** A problem may ship custom rendering when a visual genuinely needs it — used sparingly, never as the default.
- **Content is DB-canonical, file-seeded.** Problems are authored as structured files (reviewable), run through the tracer, and **ingested into MongoDB**, which the app serves dynamically by slug. (See [Schema.md](Schema.md), [TechSpec.md](TechSpec.md).)
- **Traces come from real executed Python**, so the animation can never drift from the code. Presets are precomputed for instant playback; custom input is traced on demand in a sandbox (§11, [Security.md](Security.md)).

## 7. Scope

### 7.1 In scope for the first implementation milestone (M1)
- Homepage with **equal emphasis** on curated discovery and search; search is a primary CTA.
- Problem **catalog** with medium-density browse, search, and `difficulty + topic + pattern` filters and simple practical sorts.
- **Topic pages** (teach the concept, then lead into discovery) — distinct from pattern pages.
- **Pattern pages** (solving strategy, signals, invariants, then matched problems).
- **Interview sheets** — classic prep-style, purely navigational, compact guidance per entry.
- The flagship **Problem Page** with **Learn / Focus / Compare** modes.
- **Python-first** traced solutions, single visible language.
- **Curated presets + live custom input** (sandboxed) where the problem contract supports it.
- **MongoDB ingest pipeline** and **content service**.
- Full authored **teaching package** for each pilot problem.

### 7.2 Explicitly out of scope for MVP
- User accounts, login, cloud-synced progress.
- Paid features / monetization surfaces.
- Heavy analytics or telemetry.
- Broad content-automation tooling as a delivery blocker.
- Multi-language user-visible code tabs (data model leaves room).
- Public admin UI / CMS (authoring is a developer/author workflow).

## 8. Surface Requirements

### 8.1 Homepage
- First screen balances curated content and discovery; **search is a primary CTA**.
- Curated collections lead with **classic interview-sheet** framing; may also feature topics/patterns.
- Server-rendered and SEO-friendly.

### 8.2 Catalog (`/problems`)
- Search + filters for `difficulty`, `topic`, `pattern`; simple practical sorts (default, difficulty, title/recency).
- Medium-density rows/cards showing at least: title, difficulty, topic, pattern, short teaching value/placement cue, approach count.

### 8.3 Topic pages (`/topics/[slug]`) — distinct surface
- Explain what the topic is, when it's used, how it connects to solving — then lead into relevant problems.

### 8.4 Pattern pages (`/patterns/[slug]`) — distinct surface
- Focus on reusable solving strategy, recognition signals, invariants, typical move sequence — then list matched problems.

### 8.5 Interview sheets (`/sheets/[slug]`)
- Familiar prep-sheet feel; **purely navigational** (no productized progress in MVP); each entry shows compact guidance (title, difficulty, topic/pattern, short reason it belongs).

### 8.6 Problem Page (`/problems/[slug]`) — flagship
- **Visualizer-first** default state. Statement, constraints, examples live in an **overlay/drawer**, not a competing full page.
- Preserves the **no-scroll desktop teaching loop** from the prototype (code + animation + variables + complexity + controls all visible at once).
- Must support: real code display, synchronized line highlighting, animation stage, four-part narration (what / why / line / invariant), variables + live complexity rail, data-structure state + call-stack views, playback controls (transport, speed, scrubber, jump-to-key-event), preset inputs, **live constrained custom input where supported**, light/dark themes, inline glossary help, and an **always-visible cross-approach complexity summary**.
- **Modes:** Learn (default, balanced), Focus (stage dominant), Compare (top-level mode; smart-default approach pair with user override; **hidden** when the problem has no meaningful comparison).
- Matches [`4Sum Visualizer.html`](4Sum%20Visualizer.html) on layout, behavior, palette, typography, and motion (see [Design.md](Design.md)).

## 9. Content Requirements
- Every published MVP problem ships a **full teaching package**: statement, metadata, ≥1 traced Python approach, line explanations, narration (happening/why/invariant), preset inputs (incl. edge cases), and validated visual behavior.
- Multiple approaches are **strongly preferred but not mandatory**.
- `supportsCustomInput` is **explicit per problem**, never implied platform-wide.
- Inline glossary help across statements and teaching content.

## 10. Teaching & Narrative Requirements
- Narration tone: **mixed beginner-clear + interview-concise**.
- Strong beginner code support: per-line explanations + syntax-aware, theme-aware highlighting.
- Cross-approach comparison is visible **before** playback starts.
- Teach intuition and invariants, not only mechanics.

## 11. Input System
- **Presets:** hand-picked examples including edge cases (empty, single, duplicates, negatives, max-for-clarity); precomputed traces → instant playback.
- **Custom input:** validated against the problem's constraints with clear inline errors; size-capped for legibility; **traced on demand in a sandbox** (M1 scope — see [Security.md](Security.md)). Hidden/disabled by contract where unsupported.

## 12. SEO & Accessibility
- Catalog, topic, pattern, sheet, and problem pages are first-class discoverable surfaces. **High priority everywhere.**
- Problem pages **SSR** statement + metadata, then **hydrate** the interactive player.
- Readable, hierarchy-friendly learning URLs.
- Accessibility is **high-bar from the start**: semantic structure, strong contrast in both themes, keyboard-aware controls, reduced-motion support, overlay/tooltip behavior that doesn't exclude keyboard users.

## 13. Acceptance Criteria (feature-level)
1. A user can reach a problem via homepage, search, catalog, topic page, pattern page, or sheet.
2. The Problem Page opens **visualizer-first** on desktop with **code + animation + variables + complexity + controls visible without scrolling** in Learn mode.
3. Pressing play animates the active approach smoothly with **variable birth, population, and movement** all visible; line highlight and narration stay in sync at every step.
4. Transport / step / first / last / seek / speed all work; **jump-to-key-event** markers navigate to the right moments.
5. Switching **approach tabs** updates code, animation, variables, complexity, and narration coherently.
6. **Compare** mode runs two approaches on one input with independent playheads and live counters; it is hidden when no meaningful comparison exists.
7. Selecting a **preset** re-renders instantly; entering **custom input** validates and produces a correct animation via the sandboxed tracer.
8. **Variables flash on change**, **complexity meters fill against budget**, DS-state and call-stack update where applicable.
9. Inline glossary, hover-line explanations, dark/light themes, and copy-code all work.
10. The same page renders a problem from a **different primitive family** (e.g. linked list) from its data with **no page redesign** — proving the format generalizes.
11. A new problem reusing an existing primitive can be added by **authoring data + tracing + ingest, with no UI code change**.

## 14. Pilot Problem Strategy
- **Prototype continuity first.** Pilot set is small (1–2).
- **Pilot 1: `4Sum`** (array + two-pointers; matches the prototype exactly).
- **Pilot 2 (recommended): `Reverse Linked List`** — proves a second primitive family (linked list + recursion/call-stack) and validates that the engine generalizes. Final confirmation tracked in [Tracker.md](Tracker.md).

## 15. Roadmap (summary; details in [Implementation.md](Implementation.md))
- **M1 (launch):** platform foundation, discovery surfaces, problem-page engine, primitives (array/pointers, linked list, recursion/call-stack), preset + **sandboxed custom-input** tracer, MongoDB ingest, 1–2 pilots, SEO/a11y/motion hardening.
- **Later:** more primitives (hashmap, stack/queue, trees, graphs, grid, DP), authoring/automation tooling, accounts/progress/monetization, multi-language code tabs.
