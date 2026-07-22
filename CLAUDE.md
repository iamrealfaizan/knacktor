# Knacktor — Agent Context

Knacktor is a **desktop-first, visual-learning DSA platform**. Its flagship is a no-scroll **Problem Page**
where a learner watches an algorithm *solve itself* — real Python highlighting line-by-line, a cinematic
animation, and live variables/complexity, controlled like a media player. **The simulation is the USP.**

---

## How this CLAUDE.md system works

This root file loads for **every task**. Subdirectory CLAUDE.md files load automatically when Claude works
on files in those directories — read them before editing anything in that directory.

| Directory | Auto-loaded CLAUDE.md | Covers |
|---|---|---|
| `components/problem/` | `components/problem/CLAUDE.md` | All 10 renderers, simulation behaviors, design tokens, D17 decision rule, per-structure/pattern choreography, stage dispatch, CombinedVisualState |
| `lib/tracer/` | `lib/tracer/CLAUDE.md` | Mapping DSL, expression grammar (allowed/forbidden), phase rules, narration spec, No-Line-Left-Behind, validation pipeline |
| `seeds/problems/` | `seeds/problems/CLAUDE.md` | Bundle format, authoring guide, taxonomy slugs, Gate 1/2 checklists, renderer confirmation rule |

The `rules/` docs are the **canonical authority** — subdirectory CLAUDE.md files are structured summaries.
When in doubt, read the rule doc and cite the section (e.g. "per SimulationRules §B-1").

---

## MANDATORY: Hard engineering rules (never violate without a Tracker.md exception)

- **Stack**: Next.js App Router + TypeScript + Tailwind + ESLint.
- **UI components**: `shadcn/ui` only — `npx shadcn@latest add <component>`. Never build custom when shadcn exists.
- **Icons**: `lucide-react` only, unless explicitly exempted.
- **Colors**: design tokens only — never inline hexes in components. All tokens in `app/globals.css`.
- **Content**: no problem page hardcodes content inside UI components — all content is structured data by slug.
- **Data contracts**: versioned (Schema.md); no unversioned breaking change to renderer-facing structures.
- **Simulations**: every simulation MUST conform to SimulationRules.md. The 4 mandated behaviors (creation pop-in, population flash, smooth movement, path-tracing) are non-negotiable.
- **Authoring**: traces produced ONLY by the Python tracer (D9). Never hand-write step arrays.
- **Ingest**: validator-first — fails the whole run on ANY contract violation. Nothing partial is written.
- **No Line Left Behind (D8)**: every executable line in the displayed Python code MUST emit at least one Step. This includes while-condition on final-false-evaluation, every assignment, every branch. Only blank lines, `class`, and bare `def` headers are exempt.

---

## Stack and architecture

**Tech stack:**
- Next.js App Router, TypeScript, Tailwind, ESLint
- shadcn/ui + lucide-react (hard requirements)
- MongoDB Atlas (cloud) via `MONGODB_URI` in `.env.local` — never commit
- Python tracer (`sys.settrace`) for all trace generation
- Next.js API routes at `app/api/` (FastAPI deferred per D16)

**Content operating model (D1 — DB-canonical, file-seeded):**
```
seeds/problems/<slug>/  →  npm run import-problem  →  npm run ingest  →  MongoDB  →  Content Service  →  Pages/Engine
```
- Authored files are reviewable, version-controlled source of truth for writing
- Ingest validates, traces all presets, and **upserts** — idempotent, re-runnable
- `lib/content-service.ts` is the single application-facing boundary; pages never touch raw file layout or query shape

---

## MongoDB collections (D10 — `_id` relationships, slug is routing-only)

| Collection | Key fields |
|---|---|
| `difficulties` | `_id`, `slug` (`easy`\|`medium`\|`hard`), `name`, `rank`, `color` |
| `topics` | `_id`, `slug` (unique), `name`, `description` |
| `patterns` | `_id`, `slug` (unique), `name`, `description`, `mustKnow` |
| `problems` | `_id`, `slug`, `number`, `title`, `difficultyId`→difficulties, `topicIds[]`→topics, `patternIds[]`→patterns, `approaches[]` (embedded), `presetInputs[]` (embedded), `recommendedApproachId`, `supportsCompare`, `supportsCustomInput` |
| `traces` | `_id`, `problemId`→problems, `approachId`, `inputId`, `stepsCompressed` (BinData, gzip), `stepCount`, `finalResult`, `keyEventIndices[]` |
| `sheets` | `_id`, `slug`, `name`, `entries[]` (`{ problemId, order, reason? }`) |
| `userProblemProgress` | `_id`, `userId`→users, `problemId`→problems, `status` (`todo`\|`attempted`\|`solved`), `bookmarked`, `note`, `firstAttemptedAt`, `solvedAt`, `lastActivityAt` |
| `userDailyActivity` | `_id`, `userId`→users, `date` (`YYYY-MM-DD` local tz), `solves`, `attempts` |
| `userStreak` | `_id`, `userId`→users, `currentStreak`, `longestStreak`, `lastSolveDate`, `timezone`, `freezesAvailable`, `freezeWeekAnchor` |

Rules:
- `slug` is route-facing identity only — **never a foreign key between collections**
- **UserProgress (`user*`) collections are written ONLY via Server Actions → `lib/progress-service.ts`** — the `/api` layer stays read-only (D16). Streak day-boundaries use the user's local timezone + 1 free freeze/week; QOTD stores nothing (date-hash over the catalog).
- Approaches and presets are **embedded** in the problem doc (1:1 ownership; never queried independently)
- One trace doc per `(problemId, approachId, inputId)`, gzip-compressed into `stepsCompressed` BinData (D11); GridFS only for >~12 MB
- Authoring bundles reference topics/patterns/difficulty **by slug**; ingest resolves slug→`_id` — unresolved slug = hard failure

---

## API layer (D16 — read-only, Next.js routes)

All routes return `{ data: T, error?: string }` with standard HTTP codes. No write routes.

| Route | Filter params |
|---|---|
| `GET /api/problems` | `difficulty`, `topic`, `pattern`, full-text `search` |
| `GET /api/problems/:slug` | — |
| `GET /api/problems/:slug/traces` | `approachId` (required), `inputId` (optional) |
| `GET /api/topics` | — |
| `GET /api/patterns` | — |
| `GET /api/difficulties` | — |

---

## Locked decisions (D1–D19)

- **D1** DB-canonical, file-seeded. MongoDB is the served source of truth; authored files → traced → ingested.
- **D2** Build the engine + visual-primitive library once; problems are pure data. A new structure = one-time engine task. Bespoke per-problem rendering is a sparing escape hatch (D17).
- **D3** Warm-paper aesthetic is canonical — match the prototype's exact hexes + fonts.
- **D4** Custom input was in M1; superseded by D12.
- **D5–D7** One canonical SimulationRules.md; full DS+pattern taxonomy; dsaPRD Part II archived.
- **D8** Every executed source line emits a step + line explanation (loops re-emit; key events get scrubber markers).
- **D9** Hybrid trace model: Python tracer (sys.settrace) produces step skeleton (every executed line + real var snapshot + counters). Visual-mapping layer transforms each step's real state into VisualState. Authors never hand-write step arrays.
- **D10** `_id` relationships. Cross-collection refs use Mongo `_id`. `slug` kept only for routing. Approaches & presets embedded.
- **D11** One trace doc per `(problemId, approachId, inputId)`, gzip-compressed BinData. GridFS only as overflow.
- **D12** Custom input deferred behind `CUSTOM_INPUT_ENABLED` build flag; Pyodide vs server-side sandbox decided later.
- **D13** Authoring template + loud validation. Ingest fails the whole run on ANY violation — nothing partial written.
- **D14** Mobile: below `lg` (1024px) panels stack vertically; ControlDock pinned to bottom.
- **D15** Two mandatory gates: Gate 1 (ingest — mechanical correctness) + Gate 2 (fidelity review — semantic: does the animation truly represent the algorithm?). Passing ingest is necessary but NOT sufficient. If primitives can't represent the algorithm's unit of work, DEFER the problem — never ship a misleading visual.
- **D16** API layer: Next.js API routes now; FastAPI deferred until mobile app or external integration requires it.
- **D17** Visualization strategy: generic-first + custom escape hatch. Custom only when ≥2 of: (a) 2+ primitives must coordinate simultaneously, (b) spatial layout is itself the teaching point, (c) animation logic cannot be expressed via the DSL.
- **D18** Problem-addition workflow: parse+split → ALWAYS pause for renderer analysis + user confirmation → tracer → custom component if needed → ingest → confirm at `/problems/<slug>`.
- **D19** Multi-structure visualization: `CombinedVisualState` wraps primary + aux primitives. `auxMappings[]` in `mapping.json` drives rendering without per-problem custom components. Auto-layout: horizontal primary + vertical aux → side-by-side; other combos → stacked below.

---

## ADD-PROBLEM WORKFLOW (D18) — read this every time a problem is added

When the user pastes a filled problem template and says "add this problem":

**Step 1 — Parse & validate structure** (run automatically)
- Parse the JSON; check all required fields against `rules/Authoring.md`
- Run `npm run import-problem <file>` to split into `seeds/problems/<slug>/`

**Step 2 — Analyze visualization needs** (ALWAYS PAUSE — mandatory user confirmation before proceeding)

For **every** approach, produce a structured renderer analysis and **stop**. Do NOT proceed to Step 3 until the user explicitly confirms. Cover ALL of the following for each approach:

**A. Recommended renderer**
State which renderer you recommend (`array`, `bar-container`, `hashmap`, `linkedList`, `tree`, `stack`, `queue`, `grid`, `graph`, `recursion`, or `custom`). Name the algorithm's **unit of work** (the smallest thing the algorithm repeatedly does) and confirm the renderer's unit of work matches it.

**B. Why the existing renderer CAN work** (if recommending one)
Describe concretely how the DSL fields (`valuesFrom`, `pointers`, `cellStateRules`, `auxMappings`, etc.) map to the algorithm's state at each phase. Walk through 1–2 pivotal steps (e.g. "when i advances, the pointer pill glides right; when a match is found, the cell flips to `result` state"). Note any DSL limitations and workarounds (no `in` operator — use a flag; slices forbidden in DSL — rephrase the condition using a boolean flag).

**C. Why a custom renderer might be needed** (cover this even if not recommending custom)
State explicitly whether ≥2 of the D17 escape-hatch criteria apply:
1. 2+ primitives must coordinate simultaneously
2. Spatial layout is itself the teaching point
3. Animation logic cannot be expressed via the DSL
If custom IS recommended: describe the bespoke component's layout, what it shows, and why no generic renderer could honestly represent the unit of work.

**D. Risk / fidelity call-out**
Flag any step where the visual might mislead (e.g. a renderer that shows the right data but obscures the real operation). If there is any doubt about Gate 2 fidelity, say so now — it is cheaper to reconsider the renderer here than after tracing.

**E. ASCII mockup + walk-through (required — do not skip)**
Draw the stage at exactly 3 moments using actual values from preset `example-1`:
1. **Init** — what does the learner see when the animation first loads?
2. **One key algorithmic step** — the "unit of work": the comparison, the swap, the splice, the push/pop.
3. **Return** — what does the finished result look like?

For each moment, write one sentence: *"The learner sees ___ and understands ___."*

Example format:
```
Init:    list1: [1]→[2]→[4]   list2: [1]→[3]→[4]   result: [∅]
         Learner sees: two separate source chains and an empty result.

Step 3:  list1: [2]→[4]   list2: [1]→[3]→[4]   result: [∅]→[1]
         Learner sees: [1] has left list1 and arrived in result; list1 shrank.

Return:  list1: []   list2: []   result: [∅]→[1]→[1]→[2]→[3]→[4]→[4]
         Learner sees: both source chains empty, result is the complete sorted merge.
```

**F. Variable population verification (required — do not skip)**
For EACH variable referenced in the proposed `mapping.json` (`nodesFrom`, `linksFrom`, `valuesFrom`, `pointers`, `customVars` entries, `cellStateRules` expressions), state:
- (a) which line of `solution.py` first **writes** it (not just initializes as empty)
- (b) what value it holds at step 5 of `example-1`

If any variable is initialized as `[]` or `None` and only populated later, explicitly note which steps show an empty/null structure and whether that is the intended learner experience.

**Example answer:** "`nodes = []` initialized at line 5, first populated at line 8 (loop body). Steps 1–4 (init phase) show an empty linkedList chain. This is intentional — the learner watches nodes being added."

**G. Explicit question to the user**
End with: *"Proceed with [renderer name] for [approach name]? Or would you like a different renderer or a custom visualization?"* — then **wait for the user's answer** before moving to Step 3.

**Step 3 — Run tracer + build trace** (run automatically after user confirms renderer)
- Run Python tracer for each (approach, preset) pair: `npm run ingest` or tracer directly
- Validate via ingest (Gate 1: mechanical correctness — No-Line-Left-Behind, narration, expected-output match, DSL validity)

**Step 4 — Build custom component if needed**
- Write `components/problem/custom/<slug>-visualizer.tsx`
- Register in `components/problem/stage.tsx` via dynamic import
- Must accept `{ visual: CustomVisualState, step: Step }` props; honor the semantic color/motion grammar

**Step 5 — Ingest to MongoDB** (run automatically)
- Run `npm run ingest` to store everything
- Confirm the problem appears at `/problems/<slug>`

**Step 6 — Gate 2 reminder**
- Output a summary: approaches traced, step counts, key events, any validation warnings
- Remind that Gate 2 (`rules/FidelityReview.md`) is required before the problem is production-ready

---

## Reference docs (canonical authority)

| Doc | Authority |
|---|---|
| [rules/Rules.md](rules/Rules.md) | Hard constraints. Never violate without a recorded Tracker exception. |
| [rules/SimulationRules.md](rules/SimulationRules.md) | Canonical for ALL simulation visuals & motion — shapes, tokens, per-DS (Part B) and per-pattern (Part C) choreography. |
| [rules/Schema.md](rules/Schema.md) | Data contracts: Problem, Approach, Trace, Step, VisualState; Mongo collections. |
| [rules/Design.md](rules/Design.md) | Page layout + exact design tokens (Inter, JetBrains Mono, warm-paper palette). |
| [rules/TechSpec.md](rules/TechSpec.md) | Architecture (engine, Content Service, tracer, Mongo, API). |
| [rules/Implementation.md](rules/Implementation.md) | Phase/milestone order (M1.1→M1.10) — what to build next. |
| [rules/PRD.md](rules/PRD.md) | Product requirements & acceptance criteria. |
| [rules/AppFlow.md](rules/AppFlow.md) | User & author flows. |
| [rules/Security.md](rules/Security.md) | Execution/abuse safety for the sandboxed custom-input tracer. |
| [rules/Authoring.md](rules/Authoring.md) | Canonical authoring template + visual-mapping DSL + validation rules. |
| [rules/FidelityReview.md](rules/FidelityReview.md) | Gate 2 (D15): simulation-fidelity review criteria + process. |
| [rules/CompareAndResponsive.md](rules/CompareAndResponsive.md) | Compare-mode spec (dual players, scrubber) + mobile stacked-layout spec. |
| [rules/Tracker.md](rules/Tracker.md) | Living roadmap + decision log (D1–D19). **Update it as work progresses.** |
| [rules/4Sum Visualizer.html](rules/4Sum%20Visualizer.html) | **Final locked** UI/UX prototype — match it exactly for any layout or animation question. |

**ADDING_PROBLEMS.md** — self-contained LLM authoring prompt. Paste it + `tracer/template/problem.combined.json` + the LeetCode problem into any LLM → get a working combined JSON → `npm run import-problem <file>` → `npm run ingest`.

---

## Problem-Page Engine — components (built once, reused for all problems)

| Component | File | What it does |
|---|---|---|
| `CodePanel` | `components/problem/code-panel.tsx` | Real Python source; per-step line highlight (internal auto-scroll); hover-line explanations (`syntaxExplanations`, desktop) + always-on current-line explainer box (mobile); copy |
| `Stage` + renderers | `components/problem/stage.tsx` + `*-renderer.tsx` | SVG canvas; dispatches to the correct renderer based on `visual.type`; pointer pan + wheel/pinch zoom; dot-grid background; caption + pointer legend |
| `Narration` | `components/problem/narration.tsx` | 2×2 grid: what's happening / why / line explanation / invariant; collapsible (desktop); always open (mobile) |
| `InsightRail` | `components/problem/insight-rail.tsx` | Live variables (pop-in + change-flash); complexity counters; result set (pop-in); call stack; notes (localStorage). Sections exported individually for the mobile scroll body |
| `ControlDock` | `components/problem/control-dock.tsx` | Scrubber with amber key-event diamond markers (seekable, touch-sized on mobile); transport (first/prev/play/pause/next/last); preset selector (dropdown desktop / bottom sheet mobile); speed; step counter; safe-area padding |
| `usePlayer` | `components/problem/use-player.ts` | Keyboard (space/←/→); autoplay; speed; seek; key-event jump |
| `ProblemEngine` | `components/problem/problem-engine.tsx` | Mode system (Learn/Focus/Compare); desktop 3-column vs mobile stacked-1a branch (D14); draggable panel resizing (desktop); approach switching |
| Mobile shells | `components/problem/mobile-overflow-sheet.tsx`, `preset-sheet.tsx` | D14 mobile-only wrappers: ⋮ overflow bottom sheet (difficulty/topics/statement/approach/strategy/**mode**/theme; statement opens a nested sheet with a back button that returns to it); preset picker bottom sheet. Mode switching is overflow-sheet-only on mobile — no on-screen tab row |

The engine derives motion by **diffing consecutive snapshots**: variable birth (name present in `vars[i]` but not `vars[i-1]`) → chip enters empty; `changedVars` → chip flashes; `ghosts`/pointer/`changedLinks` changes → value/marker glides. Every transition is **interruptible** — seeking cancels and snaps to target step with no queue buildup.

---

## Security constraints (custom-input tracer — D12)

Custom input is currently deferred behind the `CUSTOM_INPUT_ENABLED` build-time flag. When it is re-enabled:
- Validate and normalize every custom input against `inputConstraints` (type, size, value ranges) **before** it reaches execution.
- Execution runs in an **isolated environment** (container/microVM worker or hardened subprocess with `seccomp` + `rlimits`) with hard limits: wall-clock time, memory, recursion depth, output size, step count.
- User-controlled code has **no filesystem and no network** access.
- Endpoints are **rate-limited** per IP/session; large inputs are rejected at the boundary.
- Preset and Compare playback read stored traces only — the exec path is never hit for the common case.
See [rules/Security.md](rules/Security.md) for the full control-level spec.

---

## Working agreement
- Read the subdirectory CLAUDE.md before editing files in that directory.
- Read the relevant canonical doc before building each piece; cite the section (e.g. "per SimulationRules §B-1").
- Follow Implementation.md phase order; keep Tracker.md current as milestones/decisions change.
- After any decision or milestone change, update Tracker.md.
