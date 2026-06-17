# Schema & Content Contracts — Knacktor

> **Status:** v1.0 — collections + content contracts.
> **Model:** **DB-canonical, file-seeded.** Problems are authored as structured files, validated, traced, and **ingested into MongoDB**, which is the served source of truth. Contracts are **versioned**.
> **Companions:** [TechSpec.md](TechSpec.md) (how it's served), [PRD.md](PRD.md) (why), [dsaPRD.md](dsaPRD.md) §14 (seed contract this expands).

## 1. MongoDB collections (canonical)

| Collection | Purpose (MVP) | Key fields |
|---|---|---|
| `problems` | Canonical problem documents served by slug. | `slug` (unique), `title`, `difficulty`, `topic`, `patterns[]`, `statement`, `constraints[]`, `tags[]`, `glossary[]`, `supportsCustomInput`, `presetInputs[]`, `approaches[]`, `recommendedApproachId`, `schemaVersion` |
| `traces` | Precomputed preset traces (one per approach+input). | `problemSlug`, `approachId`, `inputId`, `steps[]`, `keyEventIndices[]`, `finalResult`, `traceVersion` |
| `topics` | Topic-page content. | `slug`, `name`, `summary`, `whenToUse`, `problemRefs[]` |
| `patterns` | Pattern-page content. | `slug`, `name`, `summary`, `signals[]`, `invariants[]`, `problemRefs[]` |
| `sheets` | Interview-sheet definitions. | `slug`, `title`, `summary`, `entries[]` |
| `content_index` | Search/discovery mirror. | `type`, `slug`, `title`, `difficulty`, `topic`, `patterns[]`, `tags[]`, `searchText` |

**Indexes (MVP):** unique `problems.slug`, `topics.slug`, `patterns.slug`, `sheets.slug`; compound `traces.{problemSlug, approachId, inputId}`; text/compound index on `content_index.searchText` + filter fields.

**Reserved future collections (not built in MVP):** `users`, `progress`, `subscriptions`, `analytics_events`, `notes`.

## 2. Canonical content contracts

### 2.1 `Problem`
Required: `schemaVersion`, `id`, `slug`, `title`, `difficulty` (`Easy`|`Medium`|`Hard`), `topic`, `patterns[]`, `statement` (markdown), `constraints[]`, `tags[]`, `glossary[]` (`{term, definition}`), `supportsCustomInput` (bool), `presetInputs[]`, `approaches[]`, `recommendedApproachId`.

### 2.2 `Approach`
Required: `id`, `name`, `kind` (`brute`|`optimal`|`alternative`), `summary`, `complexity.time`, `complexity.space`, `complexityBudget` (`{label, fn}` for the live meter), `language` (`python`), `source` (real code), `lineExplanations` (`lineNo → text`), `primaryPrimitive` (which visual primitive the stage uses), `auxStructures[]` (drives the DS-state panel), `traceRefsByInput` (`inputId → trace ref`).

### 2.3 `PresetInput`
Required: `id`, `label`, `value` (problem-specific shape), `isEdgeCase` (bool).

### 2.4 `Trace`
Required: `approachId`, `inputId`, `steps[]`, `keyEventIndices[]`, `finalResult`, `traceVersion`. Traces are **deterministic** for a given (approach, input).

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
- `callStack[]` — `CallFrame[]` for the recursion/call-stack view.

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

New primitives (hashmap, stack/queue, tree, graph, grid, DP, …) add a variant here when first built (D2). Each new variant follows the same rule: states from [Design.md](Design.md)'s vocabulary; relocations carry ghost/changed fields.

## 3. Discovery content contracts
- **`Topic`** — `slug`, `name`, `summary`, `whenToUse`, `problemRefs[]`.
- **`Pattern`** — `slug`, `name`, `summary`, `signals[]`, `invariants[]`, `problemRefs[]`.
- **`InterviewSheet`** — `slug`, `title`, `summary`, `entries[]`; each entry `{ problemRef, order, reason }`.

## 4. Authoring file → DB ingest mapping
| Authoring file | Becomes |
|---|---|
| `problems/<slug>/meta.yaml` | `Problem` metadata fields |
| `problems/<slug>/solution.py` (+ annotations) | `Approach.source`, `lineExplanations`, `codeKey` map; executed by the tracer |
| `problems/<slug>/narration.md` | `Step.narration.*` keyed by `codeKey`/phase |
| `problems/<slug>/presets.yaml` | `PresetInput[]`; tracer runs each → `traces` docs |

Ingest is **idempotent** (upsert by slug), validates against these contracts, and fails loudly on contract violations.

## 5. Relationships
- A topic references many problems; a pattern references many problems; a sheet references ordered problems.
- A problem owns one or more approaches; an approach owns traces by preset input.

## 6. Contract rules
- `slug` is the route-facing identity; no page depends on raw file paths as identifiers.
- `supportsCustomInput` is explicit per problem.
- Compare-mode availability is **derived** from approach availability + product rules (hidden when no meaningful comparison).
- Multiple approaches are preferred, not required.
- Every `Step.codeKey` resolves to a real line/range; `vars`/`counters`/`visual` are complete per step.

## 7. Versioning
- Content contracts are `schemaVersion`-stamped; trace structures carry an independent `traceVersion`.
- Changes that affect renderer expectations must bump the relevant version — never ship an unversioned breaking change.
