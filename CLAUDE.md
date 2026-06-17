# Knacktor — Agent Context

Knacktor is a **desktop-first, visual-learning DSA platform**. Its flagship is a no-scroll **Problem Page**
where a learner watches an algorithm *solve itself* — real Python highlighting line-by-line, a cinematic
animation, and live variables/complexity, controlled like a media player. **The simulation is the USP.**

## Canonical docs — ALWAYS obey these (in `./rules/`)
| Doc | Authority |
|---|---|
| [rules/Rules.md](rules/Rules.md) | **HARD constraints.** Never violate without a recorded exception in Tracker. |
| [rules/SimulationRules.md](rules/SimulationRules.md) | **Canonical for ALL simulation visuals & motion** — shapes, tokens, per-data-structure (Part B) and per-pattern (Part C) choreography. |
| [rules/Schema.md](rules/Schema.md) | Data contracts: `Problem`, `Approach`, `PresetInput`, `Trace`, `Step`, `VisualState`; Mongo collections. |
| [rules/Design.md](rules/Design.md) | Page layout + exact tokens (Inter, JetBrains Mono, warm-paper palette). |
| [rules/TechSpec.md](rules/TechSpec.md) | Architecture (engine, Content Service, tracer, Mongo). |
| [rules/Implementation.md](rules/Implementation.md) | Phase/milestone order (M1.1 → M1.7) — **what to build next**. |
| [rules/PRD.md](rules/PRD.md) | Product requirements & acceptance criteria. |
| [rules/AppFlow.md](rules/AppFlow.md) | User & author flows. |
| [rules/Security.md](rules/Security.md) | Execution/abuse safety for the sandboxed custom-input tracer. |
| [rules/Tracker.md](rules/Tracker.md) | Living roadmap + decision log (D1–D8). **Update it as work progresses.** |

**Reference only (not authority):** [rules/4Sum Visualizer.html](rules/4Sum%20Visualizer.html) is the
**final, locked** UI/UX reference — match it exactly. [rules/dsaPRD.md](rules/dsaPRD.md) Part II is
**archived** (superseded by SimulationRules.md). `MainScreenDesign.md`, `PlanningPromptAndQuestions.md`,
`Requirements.txt` are background.

## Locked decisions (D1–D8 — see Tracker for detail)
- **D1** Content is **DB-canonical, file-seeded**: problems authored as files → traced → ingested into MongoDB → served by slug.
- **D2** Build the **engine + visual-primitive library ONCE**; problems are pure data. A new structure = one-time primitive; bespoke per-problem rendering only as a sparing escape hatch.
- **D3** **Warm-paper aesthetic is canonical** — match the prototype's exact hexes + fonts.
- **D4** **Live, sandboxed custom input is in M1.**
- **D5–D7** One canonical SimulationRules.md; full DS+pattern taxonomy specified; dsaPRD Part II archived.
- **D8** **Every executed source line emits a step + line explanation** (loops re-emit; key events get scrubber markers).

## Hard engineering rules (from Rules.md)
- Stack: **Next.js App Router + TypeScript + Tailwind + ESLint** (this app).
- UI: **shadcn/ui** components only; icons: **lucide-react** only — unless explicitly exempted.
- **All colors are design tokens** — never inline hexes in components.
- **All simulations MUST conform to SimulationRules.md**; each renderer matches its §B/§C entry.
- The **four mandated simulation behaviors** are non-negotiable: ① creation pop-in (new var appears empty/`∅`), ② population flash, ③ smooth movement (glide, never teleport), ④ path-tracing (draw the route as it's covered).
- Visualizer-first; no-scroll desktop teaching loop; exactly one `current` element; ≤6 simultaneous semantic colors.

## Database
- Dev DB = **MongoDB Atlas (cloud)** via `MONGODB_URI` in `.env.local` (never commit secrets).

## Working agreement
- Consult the relevant doc before building each piece; cite it (e.g. "Array renderer per SimulationRules §B-1").
- Follow Implementation.md phase order; keep Tracker.md current as milestones/decisions change.
