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
| [rules/Authoring.md](rules/Authoring.md) | **Canonical authoring template** + visual-mapping DSL + validation rules. The fixed bundle the team (with Claude) fills for every new problem. |
| [ADDING_PROBLEMS.md](ADDING_PROBLEMS.md) | **Step-by-step "how to add a problem" guide** (practical walkthrough of Authoring.md, with the full DSL reference, validator-error fixes, and a ready Claude prompt). Start here to add content. |
| [rules/CompareAndResponsive.md](rules/CompareAndResponsive.md) | Compare-mode spec (default brute-vs-optimal, dual players, independent playback) + mobile stacked-layout spec. |
| [rules/Tracker.md](rules/Tracker.md) | Living roadmap + decision log (D1–D14). **Update it as work progresses.** |

**Reference only (not authority):** [rules/4Sum Visualizer.html](rules/4Sum%20Visualizer.html) is the
**final, locked** UI/UX reference — match it exactly. [rules/dsaPRD.md](rules/dsaPRD.md) Part II is
**archived** (superseded by SimulationRules.md). `MainScreenDesign.md`, `PlanningPromptAndQuestions.md`,
`Requirements.txt` are background.

## Locked decisions (D1–D14 — see Tracker for detail)
- **D1** Content is **DB-canonical, file-seeded**: problems authored as files → traced → ingested into MongoDB → served by slug.
- **D2** Build the **engine + visual-primitive library ONCE**; problems are pure data. A new structure = one-time primitive; bespoke per-problem rendering only as a sparing escape hatch.
- **D3** **Warm-paper aesthetic is canonical** — match the prototype's exact hexes + fonts.
- **D4** **Live, sandboxed custom input is in M1.** *(Superseded by D12 — deferred.)*
- **D5–D7** One canonical SimulationRules.md; full DS+pattern taxonomy specified; dsaPRD Part II archived.
- **D8** **Every executed source line emits a step + line explanation** (loops re-emit; key events get scrubber markers).
- **D9 Hybrid trace model.** A **Python tracer** (`sys.settrace`) executes the author's real solution and produces the step *skeleton* — every executed line → one step with the real variable snapshot + counters, so code↔vars↔step sync is mechanical and cannot drift. An authored **visual-mapping layer** turns each step's real captured state into the bespoke `VisualState`; because the animation is derived from the tracer's real per-step state, it cannot drift from the code either. **Authors never hand-write step arrays.**
- **D10 `_id` relationships.** `problems`, `topics`, `difficulties`, `patterns`, `sheets` are separate collections referencing each other by Mongo `_id`. `slug` is kept only for routing. **Approaches & presets stay embedded** in the problem doc (1:1 ownership). DB is wiped and re-seeded clean.
- **D11 Trace storage.** One document per `(problemId, approachId, inputId)`, full per-step snapshots, gzip-compressed in a `BinData` field; GridFS only as an overflow valve (>~12 MB).
- **D12 Custom input deferred.** Commented out everywhere behind a single build-time flag (`CUSTOM_INPUT_ENABLED`); the wrong-approach bug is fixed in the disabled path. Runtime sandbox (Pyodide vs server) decided later.
- **D13 Authoring template + loud validation.** A fixed, Claude-fillable per-problem bundle (see Authoring.md); ingest validates No-Line-Left-Behind, narration completeness, ≥3 examples/approach incl. an edge case, expected-output match, visual-state validity, and `_id` reference resolution — **failing the whole ingest on any violation.**
- **D14 Mobile.** Desktop stays the canonical no-scroll 5-panel layout; below `lg` (1024px) panels stack vertically: top bar → code → simulation → narration → insight → controller pinned to bottom.

## Hard engineering rules (from Rules.md)
- Stack: **Next.js App Router + TypeScript + Tailwind + ESLint** (this app).
- UI: **shadcn/ui** components only; icons: **lucide-react** only — unless explicitly exempted.
- **All colors are design tokens** — never inline hexes in components.
- **All simulations MUST conform to SimulationRules.md**; each renderer matches its §B/§C entry.
- The **four mandated simulation behaviors** are non-negotiable: ① creation pop-in (new var appears empty/`∅`), ② population flash, ③ smooth movement (glide, never teleport), ④ path-tracing (draw the route as it's covered).
- Visualizer-first; no-scroll desktop teaching loop; exactly one `current` element; ≤6 simultaneous semantic colors.
- **No Line Left Behind**: Every executable line in the displayed Python code MUST emit at least one `Step`. This includes: the `while` condition on entry AND on the final FALSE evaluation (so the learner sees why the loop exits), every variable assignment, both the `if` branch AND the `else` branch (the `else:` keyword gets its own step when entered), and every `return`. Only blank lines, `class`, and `def` declarations are exempt. A highlight that jumps over a line is a bug — this is a learning tool where the code trace IS the lesson. Everything shown in the code panel, the insight rail, the stage, and the narration must be in sync at every step: the highlighted line, the variable values, the visual state, and the narration must all describe the same moment in the algorithm's execution.

## Database (D10)
- Dev DB = **MongoDB Atlas (cloud)** via `MONGODB_URI` in `.env.local` (never commit secrets).
- Collections `problems`, `topics`, `difficulties`, `patterns`, `sheets` reference each other by **Mongo `_id`** (primary/foreign keys); `slug` is kept **only** for routing. Approaches & presets are **embedded** in the problem doc. Traces live in `traces`, gzip-compressed per `(problemId, approachId, inputId)` (D11).
- **Traces are produced ONLY by the Python tracer** (D9). Never hand-author step arrays. Ingest is validator-first and **fails the whole run on any contract violation** (D13).

## Working agreement
- Consult the relevant doc before building each piece; cite it (e.g. "Array renderer per SimulationRules §B-1").
- Follow Implementation.md phase order; keep Tracker.md current as milestones/decisions change.