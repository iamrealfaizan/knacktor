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
| **Adding a problem** (any format) | `rules/Authoring.md` · `ADDING_PROBLEMS.md` · `rules/FidelityReview.md` |
| Updating **Tracker.md** is required after any decision or milestone change | `rules/Tracker.md` |

**Reference only (read when you need the visual ground truth):** `rules/4Sum Visualizer.html` is the final locked UI/UX prototype — match it exactly for any layout or animation question. `rules/dsaPRD.md` is archived. `rules/MainScreenDesign.md` and `rules/PlanningPromptAndQuestions.md` are background only.

After reading, cite the section you relied on (e.g. "per SimulationRules §B-1").

---

## ADD-PROBLEM WORKFLOW (D18)

When the user pastes a filled problem template and says "add this problem":

**Step 1 — Parse & validate structure** (run automatically)
- Parse the JSON; check all required fields against the schema in `rules/Authoring.md`
- Run `npm run import-problem <file>` to split into `seeds/problems/<slug>/`

**Step 2 — Analyze visualization needs** (ALWAYS PAUSE — mandatory user confirmation before proceeding)

For **every** approach, produce a structured renderer analysis and stop. Do NOT proceed to Step 3 until the user explicitly confirms.

The analysis must cover all of the following for each approach:

**A. Recommended renderer**
- State which renderer you recommend (`array`, `bar-container`, `hashmap`, `linkedList`, `tree`, `stack`, `queue`, `grid`, `graph`, `recursion`, or `custom`).
- Name the algorithm's **unit of work** (the smallest thing the algorithm repeatedly does).
- Confirm the recommended renderer's unit of work matches.

**B. Why the existing renderer CAN work** (if recommending one)
- Describe concretely how the DSL fields (`valuesFrom`, `pointers`, `cellStateRules`, `auxMappings`, etc.) map to the algorithm's state at each phase.
- Walk through 1–2 pivotal steps (e.g. "when i advances, the pointer pill glides right; when a match is found, the cell flips to `result` state").
- Note any tricky DSL limitations and how to work around them (e.g. no `in` operator — use a flag; slices forbidden — rephrase the condition).

**C. Why a custom renderer might be needed** (even if not recommending one)
- State explicitly whether ≥2 of the D17 escape-hatch criteria apply:
  1. 2+ primitives must coordinate simultaneously
  2. Spatial layout is itself the teaching point
  3. Animation logic cannot be expressed via the DSL
- If custom IS recommended: describe the bespoke component's layout, what it shows, and why none of the generic renderers could honestly represent the unit of work.

**D. Risk / fidelity call-out**
- Flag any step where the visual might mislead (e.g. a renderer that shows the right data but obscures the real operation).
- If there is any doubt about Gate 2 fidelity, say so now — it is cheaper to reconsider the renderer here than after tracing.

**E. Explicit question to the user**
End with:
> "Proceed with [renderer name] for [approach name]? Or would you like a different renderer or a custom visualization?"

Wait for the user's answer before moving to Step 3.

**Step 3 — Run tracer + build trace** (run automatically)
- Run Python tracer for each (approach, preset) pair via `npm run ingest` or tracer directly
- Validate via ingest gates (Gate 1: mechanical correctness)

**Step 4 — Build custom component if needed**
- Write `components/problem/custom/<slug>-visualizer.tsx`
- Register it in `components/problem/stage.tsx` via dynamic import

**Step 5 — Ingest to MongoDB** (run automatically)
- Run `npm run ingest` to store everything
- Confirm the problem appears at `/problems/<slug>`

**Step 6 — Gate 2 reminder**
- Output a summary: steps generated, key events, any validation warnings
- Remind that Gate 2 (`rules/FidelityReview.md`) is required before the problem is production-ready

---

## VISUALIZATION DECISION RULE (D17)

A **custom per-problem component** (`components/problem/custom/<slug>-visualizer.tsx`) is justified ONLY if ≥2 of the following are true:
1. The problem requires coordinating 2+ primitives simultaneously (e.g., array + call stack side by side)
2. The spatial layout of the visualization is itself the teaching point (not just what's shown, but *where*)
3. The animation logic cannot be expressed through the existing cellState / pointer / phase / counter DSL

In all other cases, use an existing generic renderer (array, bar-container, hashmap, tree, linkedList, stack, queue, grid, graph, recursion). Generic renderers are data-driven and add zero bundle cost per new problem.

Custom components must: accept `{ visual: CustomVisualState, step: Step }` props; be registered in `stage.tsx` via dynamic import; include a top-of-file comment explaining why generic rendering was insufficient.



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
| [ADDING_PROBLEMS.md](ADDING_PROBLEMS.md) | **Self-contained LLM authoring prompt.** Paste it + `tracer/template/problem.combined.json` + the LeetCode problem into any LLM → get a working combined JSON → `npm run import-problem` + `npm run ingest`. Embeds the seeded slugs, the DSL grammar + forbidden list, all caveats, and a mandatory self-validation pass. Start here to add content. |
| [rules/FidelityReview.md](rules/FidelityReview.md) | **Gate 2 (D15): the simulation-fidelity review.** Criteria + process for judging whether an authored bundle's animation actually represents the algorithm — beyond what ingest can check. Every problem must pass this before acceptance. |
| [rules/CompareAndResponsive.md](rules/CompareAndResponsive.md) | Compare-mode spec (default brute-vs-optimal, dual players, independent playback) + mobile stacked-layout spec. |
| [rules/Tracker.md](rules/Tracker.md) | Living roadmap + decision log (D1–D14). **Update it as work progresses.** |

**Reference only (not authority):** [rules/4Sum Visualizer.html](rules/4Sum%20Visualizer.html) is the
**final, locked** UI/UX reference — match it exactly. [rules/dsaPRD.md](rules/dsaPRD.md) Part II is
**archived** (superseded by SimulationRules.md). `MainScreenDesign.md`, `PlanningPromptAndQuestions.md`,
`Requirements.txt` are background.

## Locked decisions (D1–D18 — see Tracker for detail)
- **D1** Content is **DB-canonical, file-seeded**: problems authored as files → traced → ingested into MongoDB → served by slug.
- **D2** Build the **engine + visual-primitive library ONCE**; problems are pure data. A new structure = one-time primitive; bespoke per-problem rendering only as a sparing escape hatch (see D17 for the escape-hatch rule).
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
- **D15 Simulation-fidelity gate (TWO gates, both mandatory).** A problem is accepted ONLY if it passes BOTH: **Gate 1 — ingest validation** (mechanical: No-Line-Left-Behind, narration completeness, expected-output match, DSL/visual validity) AND **Gate 2 — fidelity review** (semantic, human/Claude-judged: the animation faithfully represents the algorithm's *actual* operations and state; the chosen primitive shows the algorithm's true **unit of work**; pointers/cell-states/readouts correspond to what the code really does each step). **Passing ingest is necessary but NOT sufficient.** If the available primitives can't represent the algorithm's unit of work (e.g. character-column comparison on a string array), the problem is **deferred until the right renderer exists** — never ship a misleading visual. See [rules/FidelityReview.md](rules/FidelityReview.md).
- **D16 API layer — Next.js API routes.** A read-only JSON API lives at `app/api/` wrapping the Content Service. All routes return `{ data, error? }` with standard HTTP codes. No write routes (content is authored via CLI + ingest). A FastAPI Python backend is **deferred** until a mobile app or external integration requires it.
- **D17 Visualization strategy — Hybrid (generic-first + escape hatch).** Generic renderers (array, bar-container, hashmap, linkedList, tree, stack, queue, grid, graph, recursion) are the default — problems are pure data, bundle cost is O(1) per problem. A per-problem custom component (`components/problem/custom/<slug>-visualizer.tsx`) is justified ONLY if ≥2 of: (1) 2+ primitives must coordinate simultaneously, (2) spatial layout is itself the teaching point, (3) animation logic cannot be expressed via the DSL. See the VISUALIZATION DECISION RULE section above.
- **D18 Problem-addition workflow.** When a filled template is pasted, the agent: parses + splits it, analyzes visualization needs, runs tracer, builds custom component if needed (one checkpoint), ingests to MongoDB, confirms the page renders. See the ADD-PROBLEM WORKFLOW section above.

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