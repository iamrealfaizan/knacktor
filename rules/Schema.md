# Schema & Content Contracts — Knacktor

> **Status:** v2.0 — `_id`-relational collections + hybrid-tracer contracts (D9–D14).
> **Model:** **DB-canonical, file-seeded.** Problems are authored as structured files, **traced by the Python tracer** (D9), validated, and **ingested into MongoDB**, which is the served source of truth. Contracts are **versioned**.
> **Companions:** [TechSpec.md](TechSpec.md) (how it's served), [Authoring.md](Authoring.md) (the authoring bundle + mapping/narration DSL), [PRD.md](PRD.md) (why).

## 1. MongoDB collections (canonical — `_id` relationships, D10)

Cross-collection references use native Mongo **`ObjectId`** (serialized to hex strings by the
Content Service boundary). **`slug` is kept only for routing**; it is never a foreign key.
**Approaches and presets are embedded** in the problem document (1:1 ownership; never queried
independently).

| Collection | Purpose (MVP) | Key fields |
|---|---|---|
| `difficulties` | Difficulty entity (replaces the inline enum). | `_id`, `slug` (unique: `easy`\|`medium`\|`hard`), `name`, `rank`, `color` (token key, not hex) |
| `topics` | Topic-page content. | `_id`, `slug` (unique), `name`, `description` |
| `patterns` | Pattern-page content. | `_id`, `slug` (unique), `name`, `description`, `mustKnow` |
| `problems` | Canonical problem documents (merges old `problems` + `problemsFull`). | `_id`, `slug` (unique), `number`, `title`, `difficultyId`→`difficulties`, `topicIds[]`→`topics`, `patternIds[]`→`patterns`, `statement`, `hasVisualization`, `isPremium`, `supportsCustomInput`, `supportsCompare`, `recommendedApproachId`, `approaches[]` (embedded), `presetInputs[]` (embedded), `inputConstraints`, `sourceContentHash`, `schemaVersion` |
| `traces` | Precomputed preset traces (gzip-compressed, D11). | `_id`, `problemId`→`problems`, `problemSlug` (denormalized), `approachId`, `inputId`, `traceVersion`, `stepCount`, `keyEventIndices[]`, `finalResult`, `compression`, `stepsCompressed?` (`BinData`), `gridfsId?`, `byteSize` |
| `sheets` | Interview-sheet definitions. | `_id`, `slug` (unique), `name`, `description`, `entries[]` (`{ problemId→problems, order, reason? }`) |

**Indexes:** unique `slug` on `difficulties`/`topics`/`patterns`/`problems`/`sheets`; on `problems`:
`difficultyId`, multikey `topicIds`/`patternIds`, `number`, text on `title`+`statement`; on `traces`:
unique compound `{problemId, approachId, inputId}` + non-unique `{problemSlug, approachId}` (hot read
path); `sheets.entries.problemId`.

**Dropped:** `content_index` (the `problems` text index covers MVP search).
**Reserved future collections (not built in MVP):** `users`, `progress`, `subscriptions`, `analytics_events`, `notes`.

**Slug↔`_id` coexistence:** authoring bundles reference topics/patterns/difficulty **by slug**
(human-friendly). Ingest resolves slug→`_id` and stores only the `_id` (an unresolved slug is a
loud failure). Routes resolve by the entity's own `slug`, then resolve its `_id` refs for display.

## 2. Canonical content contracts

### 2.1 `Problem`
Required: `schemaVersion`, `_id`, `slug`, `number`, `title`, `difficultyId` (→`difficulties`), `topicIds[]` (→`topics`), `patternIds[]` (→`patterns`), `statement` (markdown), `supportsCustomInput` (bool), `supportsCompare` (bool), `presetInputs[]`, `approaches[]`, `recommendedApproachId`, `inputConstraints`, `sourceContentHash`. Read-time the service may attach resolved views (`difficulty`, `topics[]`, `patterns[]`).

### 2.2 `Approach`
Required: `id` (stable local string, not a Mongo ref), `name`, `kind` (`brute`|`optimal`|`alternative`), `summary`, `complexity.time`, `complexity.space`, `language` (`python`), `source` (real code, executed verbatim by the tracer), `entrypoint` (function the tracer calls, e.g. `Solution.maxArea`), `lineExplanations` (`lineNo → text`, narration panel), `syntaxExplanations?` (`lineNo → text`, hover tooltip), `primaryPrimitive` (which visual primitive the stage uses), `auxStructures[]`.
- `resultSpec?` — **how the RESULT panel renders** (data-driven, replaces 4Sum hardcoding): `{ varName, label, suffix?, render: "scalar"|"list"|"tuple-list"|"boolean"|"string", emptyText? }`.
- `varColors?` — optional `varName → token-key` pin so rail variable colors match the stage pointer lanes.
- Per-approach authored artifacts (ingested, not stored on the doc verbatim): `mappingSpec` (visual-mapping DSL) and `narrationSpec` (narration templates). See [Authoring.md](Authoring.md).

### 2.3 `PresetInput`
Required: `id`, `label`, `value` (problem-specific shape), `isEdgeCase` (bool), `expectedOutput` (validated against the traced `finalResult`). **≥3 presets per approach, incl. ≥1 edge case** (sourced from LeetCode / equivalent), enforced at ingest (D13).

### 2.4 `Trace`
Required: `problemId` (→`problems`), `problemSlug` (denormalized), `approachId`, `inputId`, `steps[]`, `keyEventIndices[]`, `finalResult`, `traceVersion`. Traces are **deterministic** for a given (approach, input) and are **produced ONLY by the Python tracer** (D9) — never hand-authored.

**Storage (D11):** persisted one doc per `(problemId, approachId, inputId)`; `steps[]` are gzip-compressed into a `stepsCompressed` `BinData` field (with `compression`, `stepCount`, `byteSize`), or offloaded to GridFS (`gridfsId`) when compressed size exceeds ~12 MB. The Content Service decompresses at its boundary and returns the plain `Trace` shape — player and renderer are unchanged.

### 2.5 `Step` — the core unit (one frame of the simulation)
Each step is a **complete snapshot** so the player can seek anywhere instantly. The only diff-style fields exist purely to drive motion.

**One step per executed line (D8).** The tracer emits a `Step` for **every executed source line**, and loops **re-emit** the line per iteration — so the learner watches literally every line run, each with its own line explanation. Trivial lines still produce a step (with a terse explanation); meaningful "key event" steps are additionally flagged (`isKeyEvent` / `keyEventIndices`) to drive scrubber markers. See [SimulationRules.md](SimulationRules.md) §A-6.

Required:
- `i` — step index.
- `codeKey` — resolves to the executed source line/range for highlight (must exist in the approach's source).
- `phase` — `init`|`loop`|`check`|`update`|`recurse`|`return`|`done`.
- `narration.happening` / `narration.why` / `narration.invariant`.
- `vars` — **complete** variable snapshot at this step (`name → value`; `null`/empty rendered as `∅`).
- `changedVars[]` — names that changed this step → **drives change-flash and population**.
- `counters` — running real-operation counts → **drives complexity meters**.
- `visual` — primitive-specific `VisualState` (§3).

Optional:
- `op` — terse operation readout (e.g. `p += 1`).
- `isKeyEvent` — flags a highlight moment (also surfaced via `keyEventIndices`).
- `keyEvent` — `{ label, kind? }` semantic descriptor for the scrubber diamond (`kind` ∈ `match`|`best`|`result`|`boundary`|`return`); drives the diamond tooltip + tint. Present whenever `isKeyEvent` is set.
- `callStack[]` — `CallFrame[]` for the recursion/call-stack view.
- `capturedVars` — the raw Python locals snapshot from the tracer (source of truth; `vars` is the curated display view, defaulting to `capturedVars`).
- `lineNo` — the real executed source line (makes No-Line-Left-Behind checkable; `codeKey` = `lineNo` for single lines).

**Simulation legibility fields (how the USP is driven):**
- **Variable birth** — a name in `vars[i]` but not `vars[i-1]` → the Engine renders its chip entering, empty.
- **Population/change** — `changedVars` → flash + fill.
- **Movement** — `visual.ghosts` (before→after) and primitive pointer/cell/link changes → smooth glide. Authors/tracer must emit these whenever a value or marker relocates, so movement is never an instant jump.

### 2.6 `VisualState` (primitive-specific; renderer reads this)
A discriminated union keyed by `type`. **MVP variants:** `array`, `linkedList`, `recursion`. Each variant enumerates its element states using the **canonical Layer-1 state vocabulary** in [SimulationRules.md](SimulationRules.md) §A-2.3 (e.g. `idle`, `current`, `compared`, `visited`, `result`, `dimmed`, `special`, `error`). Hex values are theme tokens, never inline. Per-structure shapes and per-step motion are governed by [SimulationRules.md](SimulationRules.md) Parts B/C.

```jsonc
// array + pointers/window
{ "type":"array", "values":[-2,-1,0,0,1,2],
  "cellStates": { "0":"visited", "3":"current", "5":"compared" },
  "pointers": [ {"name":"i","at":0}, {"name":"p","at":3}, {"name":"q","at":5} ],
  "window": { "from":3, "to":5 },
  "ghosts": [ {"name":"p","from":2,"to":3} ] }            // before→after → glide

// linkedList
{ "type":"linkedList",
  "nodes":[ {"id":"n1","value":1}, {"id":"n2","value":2} ],
  "links":[ {"from":"n2","to":"n1"} ],                     // current next-pointers
  "pointers":[ {"name":"prev","at":"n1"}, {"name":"curr","at":"n2"}, {"name":"next","at":null} ],
  "changedLinks":[ {"from":"n2","to":"n1"} ] }             // drives re-link animation

// recursion / call stack
{ "type":"recursion",
  "frames":[ {"id":"f0","label":"solve(0,5)","returnValue":null,"isCurrent":true} ],
  "treeEdges":[ {"from":"f0","to":"f1"} ] }
```

**Stage readout (replaces the hardcoded 4Sum sum chip / container area chip).** The `array` and
`bar-container` variants may carry `readout?: { expr, relation?, relationColor? }` — the chip text is
**computed by the tracer** from the real captured state (`relationColor` is a token key, never a
hex). The renderer just draws whatever `readout` is present; it knows nothing about specific
variable names. The `bar-container` variant keeps its `container` geometry object for the water fill.

New primitives (hashmap, stack/queue, tree, graph, grid, DP, …) add a variant here when first built (D2). Each new variant follows the same rule: states from [Design.md](Design.md)'s vocabulary; relocations carry ghost/changed fields. `stage.tsx` dispatches via a table (`type → renderer`); an unregistered `type` renders a token-styled "Renderer not implemented" placeholder (loud, not an empty stage).

## 3. Discovery content contracts
- **`Topic`** — `slug`, `name`, `summary`, `whenToUse`, `problemRefs[]`.
- **`Pattern`** — `slug`, `name`, `summary`, `signals[]`, `invariants[]`, `problemRefs[]`.
- **`InterviewSheet`** — `slug`, `title`, `summary`, `entries[]`; each entry `{ problemRef, order, reason }`.

## 4. Authoring file → DB ingest mapping (D9/D13 — see [Authoring.md](Authoring.md) for the full template)
Per-problem bundle at `seeds/problems/<slug>/`:

| Authoring file | Becomes |
|---|---|
| `problem.json` | `Problem` metadata + statement + refs **by slug** + flags + `inputConstraints` |
| `presets.json` | `PresetInput[]` (≥3/approach, ≥1 edge, each with `expectedOutput`); tracer runs each → `traces` docs |
| `approaches/<id>/solution.py` | `Approach.source` (executed verbatim; line numbers are load-bearing) |
| `approaches/<id>/approach.json` | `Approach` metadata, `lineExplanations`, `syntaxExplanations`, `resultSpec`, `varColors?` |
| `approaches/<id>/mapping.json` | `VisualMappingSpec` → each step's `visual` (`VisualState`) |
| `approaches/<id>/narration.json` | `Step.narration.*` templates keyed by line/phase |
| `approaches/<id>/mapping.py` (optional) | custom-primitive escape hatch `(capturedVars, ctx) → VisualState` |

The **Python tracer** executes `solution.py` per preset, emits the step skeleton (every line + real
var snapshot + counters), applies the mapping + narration specs, and outputs the `Trace`. This
**replaces** the old TS tracers (`lib/tracers/*`, the `TRACERS` registry) and any hand-written
`steps[]`. Ingest is **idempotent** (upsert by slug, skips unchanged bundles via `sourceContentHash`),
**validator-first**, and **aborts the whole run on any contract violation** (D13).

## 5. Relationships (D10 — by `_id`)
- `problems.difficultyId/topicIds[]/patternIds[]` reference `difficulties`/`topics`/`patterns` by `_id`.
- `sheets.entries[].problemId` references `problems` by `_id` (ordered membership).
- `traces.problemId` references `problems` by `_id` (+ denormalized `problemSlug` for the hot read path).
- A problem **owns** its approaches & presets (embedded); each (approach, input) owns one trace doc.

## 6. Contract rules
- `slug` is the route-facing identity; no page depends on raw file paths as identifiers.
- `supportsCustomInput` is explicit per problem.
- Compare-mode availability is **derived** from approach availability + product rules (hidden when no meaningful comparison).
- Multiple approaches are preferred, not required.
- Every `Step.codeKey` resolves to a real line/range; `vars`/`counters`/`visual` are complete per step.

## 7. Versioning
- Content contracts are `schemaVersion`-stamped; trace structures carry an independent `traceVersion`.
- Changes that affect renderer expectations must bump the relevant version — never ship an unversioned breaking change.
