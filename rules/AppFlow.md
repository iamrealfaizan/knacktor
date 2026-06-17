# App Flow — Knacktor

> **Status:** v1.0. Companion to [PRD.md](PRD.md) (requirements), [TechSpec.md](TechSpec.md) (architecture), [Design.md](Design.md) (UI/UX). Problem-page behavior follows [`4Sum Visualizer.html`](4Sum%20Visualizer.html).

## Summary
Three user-flow families — **discovery**, **guided learning**, and **deep problem understanding** — plus the **content-author** flow that feeds the platform.

## 1. Discovery flow
1. User lands on the homepage.
2. Sees featured interview sheets + direct discovery, with **search visible immediately** (primary CTA).
3. Chooses: search · browse catalog · topic page · pattern page · interview sheet.
4. Drills into a problem page.

## 2. Homepage flow
- **Blocks:** search (primary) · featured interview sheets · featured topics/patterns · entry into broader discovery.
- **Paths:** search a known problem/concept · enter a sheet for guided prep · open a topic page · open a pattern page · open the catalog.

## 3. Catalog flow (`/problems`)
1. Open `/problems`.
2. Filter by `difficulty`, `topic`, `pattern`.
3. Optionally apply a simple sort.
4. Scan medium-density results.
5. Open a problem page.

## 4. Topic-page flow (`/topics/[slug]`)
1. Arrive from homepage, search, or catalog.
2. Read a concise explanation: what it is · when it's used · which patterns connect.
3. Browse topic-relevant problems → open a problem page.

## 5. Pattern-page flow (`/patterns/[slug]`)
1. Arrive on a pattern page.
2. Read the solving strategy: recognition signals · invariants · typical move sequence.
3. Browse matched problems → open a problem page.

## 6. Interview-sheet flow (`/sheets/[slug]`)
1. Open a sheet.
2. See ordered problems with compact rationale per entry.
3. Use it as navigation (no tracked checklist in MVP) → open a chosen problem.

## 7. Problem-page flow (`/problems/[slug]`)

### Default entry
1. Open the problem page; it **SSRs** statement+metadata then **hydrates** the player.
2. Loads in **visualizer-first** mode; full statement content available via overlay/drawer.

### Learn mode (default)
1. Stay in Learn; watch synchronized code, stage, narration, variables, complexity.
2. Change approach, speed, or input as needed.

### Focus mode
1. Switch to Focus; peripheral panels collapse to icon rails; the stage dominates.

### Compare mode
1. Available only when the problem supports meaningful comparison (otherwise hidden).
2. App selects a **smart-default** approach pair; user may override.
3. Two approaches play on one input with independent playheads + live counters.

### Statement overlay
1. Open the overlay/drawer; read statement, constraints, metadata, examples.
2. Close and return to the active teaching state.

## 8. Search flow
1. Search from homepage or catalog.
2. Resolve matching problems, topics, patterns, and sheets (via `content_index`).
3. Select the best result → enter the destination page.

## 9. Custom-input flow (live in M1, sandboxed)
1. User opens a problem where `supportsCustomInput` is true.
2. Enters input; the system **validates and normalizes** it against the problem's constraints (clear inline errors; size-capped).
3. The validated input is traced **on demand in the sandboxed runner** (hard time/memory/recursion/output limits, rate-limited, no fs/network for user code — see [Security.md](Security.md)).
4. The player loads and replays the returned trace with a clear loading state.
5. If the problem doesn't support custom input, the control is hidden/unavailable by contract.

## 10. Content-author flow (file → tracer → ingest → serve)
1. Author creates a problem package under `problems/<slug>/`: `solution.py` (+ light annotations: meaningful-line `codeKey`s, primitive + variable→role mapping), `meta.yaml`, `narration.md`, `presets.yaml`.
2. Run the **tracer** → executes the solution against each preset → emits deterministic trace JSON.
3. Run **ingest** → validates against the [Schema.md](Schema.md) contracts and **upserts** problem + traces + discovery docs into **MongoDB**.
4. Author **reviews the live animation** on the page and tunes annotations/narration for clarity.
5. The problem becomes publishable only when the **full teaching package** passes the content bar.
6. Adding a problem on an **existing primitive** requires **no UI code**. A brand-new structure requires building its primitive renderer **once** (then that family is data-only).
