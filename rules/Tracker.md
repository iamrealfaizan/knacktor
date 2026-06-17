# Tracker — Knacktor

> **Role:** living **roadmap + decision log** (both). The AI agent and team update this to keep the whole picture in mind. Major planning decisions are recorded **here only** (single source, no duplication).

## Current status
- Project state: **M1.1–M1.4 fully implemented; M1.5–M1.7 remaining.**
- Canonical build docs: finalized (PRD, TechSpec, AppFlow, Design, Schema, Implementation, Rules, Security, **SimulationRules**).
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
| `M1.5` | Trace pipeline (preset + sandboxed custom input) | ⏳ In progress — UI stub only |
| `M1.6` | Pilot problems (`4Sum` ✅, `Reverse Linked List` ❌) | ⏳ Partial (1 of 2) |
| `M1.7` | Hardening (SEO / a11y / motion / sandbox abuse) | ❌ Not started |

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

### M1.6 — Pilot problems ⏳ (1 of 2)
- **4Sum** ✅ — `lib/fixtures/4sum.ts`: 118+ steps, full pointer/cell/window/sum-chip states, narration, complexity counters, key events; presets: Example 1
- **Reverse Linked List** ❌ — not started; also needs linked-list renderer

## Immediate next tasks
1. **M1.5**: Design Python tracer approach (pyodide in-browser vs. sandboxed API route) — resolve open question
2. **M1.6**: Build `Reverse Linked List` problem — requires linked-list renderer first
3. **M1.7**: SEO (metadata, sitemap, OG), a11y audit, sandbox abuse protection

## Open questions
- **Sandbox tech** (blocker for M1.5): pyodide (WASM, in-browser, no server cost) vs. sandboxed subprocess API route vs. managed service. Pyodide is the lowest-friction path for MVP.
- **Reverse Linked List confirmed** as second pilot (recommended); no blocker other than linked-list renderer work.
- `content_index` population strategy: currently derived at query time; revisit if query latency becomes a problem.
- First custom-input support surface beyond the two pilots.

## Risks
- Tracer + sandbox complexity is the hardest remaining unknown (M1.5 blocker).
- Losing prototype fidelity when adding the linked-list renderer (M1.6).
- Content contracts drifting across docs and implementation as more problems are added.

## Deferred items
- Auth, progress, subscriptions, monetization, analytics expansion.
- Admin/CMS UI, content-automation tooling.
- Additional primitives (hashmap, stack/queue, trees, graphs, grid, DP).
- Multi-language user-visible code tabs.
- Sheets population (currently empty seed).
