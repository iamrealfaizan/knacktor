# Tracker — Knacktor

> **Role:** living **roadmap + decision log** (both). The AI agent and team update this to keep the whole picture in mind. Major planning decisions are recorded **here only** (single source, no duplication).

## Current status
- Project state: **documentation locked**, app implementation not started.
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
- `M0` Documentation lock — **done**
- `M1.1` Platform foundation
- `M1.2` Content schema + ingest pipeline
- `M1.3` Discovery surfaces
- `M1.4` Problem-page engine (+ simulation pipeline)
- `M1.5` Trace pipeline (preset + sandboxed custom input)
- `M1.6` Pilot problems (`4Sum`, recommended `Reverse Linked List`)
- `M1.7` Hardening (SEO / a11y / motion / sandbox abuse)

## Immediate next tasks
- Initialize the Next.js app + design tokens + route skeletons.
- Stand up MongoDB + Content Service + ingest pipeline.
- Convert prototype behavior into the reusable engine + MVP primitives.
- Confirm the second pilot problem.

## Open questions
- Finalize the sandbox execution technology (container/microVM vs hardened subprocess vs managed service).
- Confirm the second pilot problem (recommended: `Reverse Linked List`).
- How much of `content_index` to populate vs derive at query time in the first build.
- **Resolved:** dev database = **MongoDB Atlas (cloud)** via `MONGODB_URI` env var.
- First acceptable custom-input support surface beyond the pilots.

## Risks
- Overbuilding the platform before the player is proven.
- Losing prototype fidelity during systemization.
- Content contracts drifting across docs and implementation.
- Underestimating tracer + execution-sandbox complexity (now in M1 — watch latency and abuse).

## Deferred items
- Auth, progress, subscriptions, monetization, analytics expansion.
- Admin/CMS UI, content-automation tooling.
- Additional primitives (hashmap, stack/queue, trees, graphs, grid, DP).
- Multi-language user-visible code tabs.
