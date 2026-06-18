# Knacktor — Agent Context

Knacktor is a **desktop-first, visual-learning DSA platform**. Its flagship is a no-scroll **Problem Page**
where a learner watches an algorithm *solve itself* — real Python highlighting line-by-line, a cinematic
animation, and live variables/complexity, controlled like a media player. **The simulation is the USP.**

## MANDATORY: Read these rules before acting — scoped by task type

Always read **rules/Rules.md** first for any code change — it contains hard constraints that override everything.

Then read the additional docs that match the task:

| Task type | Must read before starting |
|---|---|
| Writing or editing a **tracer** | `rules/SimulationRules.md` · `rules/Schema.md` |
| Writing or editing a **renderer / visual component** | `rules/SimulationRules.md` · `rules/Design.md` |
| Writing or editing any **UI component or layout** | `rules/Design.md` |
| Working with **Trace / Step / VisualState data** | `rules/Schema.md` |
| Working with the **engine, API routes, or Content Service** | `rules/TechSpec.md` · `rules/Schema.md` |
| Working with **custom input or sandboxed execution** | `rules/Security.md` |
| Starting a **new feature or milestone** | `rules/Implementation.md` · `rules/Tracker.md` |
| Making a **product or UX decision** | `rules/PRD.md` · `rules/AppFlow.md` |
| Updating **Tracker.md** is required after any decision or milestone change | `rules/Tracker.md` |

**Reference only (read when you need the visual ground truth):** `rules/4Sum Visualizer.html` is the final locked UI/UX prototype — match it exactly for any layout or animation question. `rules/dsaPRD.md` is archived. `rules/MainScreenDesign.md` and `rules/PlanningPromptAndQuestions.md` are background only.

After reading, cite the section you relied on (e.g. "per SimulationRules §B-1").



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
- **No Line Left Behind**: Every executable line in the displayed Python code MUST emit at least one `Step`. This includes: the `while` condition on entry AND on the final FALSE evaluation (so the learner sees why the loop exits), every variable assignment, both the `if` branch AND the `else` branch (the `else:` keyword gets its own step when entered), and every `return`. Only blank lines, `class`, and `def` declarations are exempt. A highlight that jumps over a line is a bug — this is a learning tool where the code trace IS the lesson. Everything shown in the code panel, the insight rail, the stage, and the narration must be in sync at every step: the highlighted line, the variable values, the visual state, and the narration must all describe the same moment in the algorithm's execution.

## Database
- Dev DB = **MongoDB Atlas (cloud)** via `MONGODB_URI` in `.env.local` (never commit secrets).

## Working agreement
- Consult the relevant doc before building each piece; cite it (e.g. "Array renderer per SimulationRules §B-1").
- Follow Implementation.md phase order; keep Tracker.md current as milestones/decisions change.