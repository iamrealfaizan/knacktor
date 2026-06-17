# Product Requirements Document — The Problem Page (DSA Visualizer)

> **Document type:** Detailed PRD for a single, self-contained product surface.
> **Scope of this PRD:** The "all-in-one Problem Page" and the data contract it consumes. The wider
> application (catalog, search, auth, accounts, routing, backend, marketing) is **out of scope** and will be
> built separately by the product owner.
> **Target stack:** The page will be implemented in **Next.js 14** (App Router). This PRD is written
> framework-agnostically at the requirements level; specific rendering technology is given as a
> *recommendation*, not a mandate.
> **Status:** v1.0 — ready for design & implementation.
> **Last updated:** 2026-06-15.

---

## 1. Overview & Vision

### 1.1 The product in one sentence
A single, no-scroll web page where a learner can **watch any data-structures-and-algorithms problem solve
itself, step by step**, with the real code highlighting line-by-line, a cinematic animation in the center,
and every variable, counter, and complexity meter updating live — controlled like a media player.

### 1.2 Why it exists
The fastest way to *truly* understand an algorithm is to **see it run**. Today, beginners stitch
understanding together from static blog posts, paywalled video courses, and pre-recorded lectures — slow,
passive, and easy to forget. This page replaces all of that for a single problem: a learner arrives, presses
play, and the concept becomes visually obvious in minutes.

### 1.3 The USP — the animation
The animation is the product's unique selling proposition. It must be the **cleanest, smoothest, and most
understandable algorithm animation available anywhere**. Everything else on the page exists to support the
animation: the code shows *what* is running, the narration explains *why*, the meters quantify the *cost*,
and the controls let the learner move through it at their own pace.

### 1.4 The "one glance" principle
Everything a learner needs must be visible **at a single glance, without scrolling**: code, animation,
variables, complexity, and controls are all on screen simultaneously. The learner should never have to scroll
to see the code while watching the animation, or scroll to find the play button. This is the page's defining
constraint and the bar every design decision is measured against.

### 1.5 Design north stars
1. **Show, don't tell** — the visual carries the understanding; text only supports it.
2. **Calm, not cluttered** — dense with information, but clean, ordered, and never noisy.
3. **Real, not fake** — the animation is generated from the *actual executed code*, so it can never lie.
4. **Beginner-first** — a person who has never seen the algorithm should "get it" on the first play.
5. **One format, every problem** — arrays, linked lists, trees, graphs, hashing, DP — all the same page.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Deliver one canonical page format usable for **every** DS and pattern in the catalog.
- Make the animation best-in-class: smooth motion, morphing, ghosting/trails, and spotlight focus.
- Auto-generate step traces from **real executed code** so animation and code are always in sync.
- Teach the *intuition* (the "why"), not just the mechanics.
- Support multiple approaches per problem (brute force, optimal, alternatives) with side-by-side comparison.
- Make complexity tangible via live operation counters, not just a Big-O label.
- Be usable by an absolute beginner with zero onboarding friction.

### 2.2 Non-Goals (explicitly out of scope for this PRD)
- The **problem catalog / browse / search** experience.
- **Authentication, accounts, cloud sync** of any kind.
- **Backend services / databases** beyond the trace-generation pipeline described in §15.
- **Global site navigation, routing, headers/footers** outside the page itself.
- **Monetization, quizzes, leaderboards, social features** (may come later; see §21).
- **Multi-language code** beyond Python at launch (data model leaves room; see §8).

---

## 3. Target Users & Jobs-To-Be-Done

| Persona | Description | Primary job |
|---|---|---|
| **The Absolute Beginner** | New to DSA; intimidated by code and Big-O. | "Help me *understand* how this algorithm works, visually, from zero." |
| **The Interview Reviser** | Knows basics; revising patterns under time pressure. | "Refresh this pattern fast and see the optimal approach + its cost." |
| **The Comparer** | Wants to know *why* the optimal beats the brute force. | "Show me both approaches racing so the trade-off is obvious." |
| **The Teacher / Explainer** | Teaching a friend, student, or audience. | "Step to an exact moment and explain what's happening." |

**Primary persona:** The Absolute Beginner. Every ambiguity is resolved in their favor.

---

## 4. Competitive Landscape & Differentiation

| Tool | Strengths | Gaps we beat |
|---|---|---|
| **Python Tutor** (pythontutor.com) | Real code traced via `sys.settrace`; step forward/back; shows variables, heap, stack. | Bland generic UI; no algorithm-specific visuals; no intuition/teaching narration; no complexity meters. |
| **VisuAlgo** | 40+ topics; custom input; quizzes; progress tracking. | Dated centered UI; shows **pseudocode**, not real code; limited per-step teaching narration. |
| **algorithm-visualizer.org** | Split-screen code+viz; multi-language; speed control; screenshot export. | No "why"/intuition narration; no live complexity meters; weaker beginner hand-holding. |

**Our wedge (the combination none of them have):**
> **Real executed code** + **cinematic motion/morphing/ghosting/spotlight animation** + **beginner-first
> "what / why / invariant / line" narration** + **multi-approach race** + **live complexity meters**, all in
> **one no-scroll, Figma/LeetCode-grade page**.

---

## 5. Information Architecture of the Page

Seven logical regions, all visible at once:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ (A) TOP BAR  — problem title · difficulty/topic badges · approach tabs ·       │
│               recommended badge · layout-preset switcher · theme toggle        │
├───────────────┬──────────────────────────────────────┬─────────────────────────┤
│ (B) CODE      │ (C) ANIMATION STAGE                   │ (E) INSIGHT RAIL        │
│   PANEL       │     (the central visualizer)          │   · Variables (flash)   │
│  · real code  │     · primitives render here          │   · Complexity meters   │
│  · line       │     · spotlight / ghosting / motion    │   · Data-structure state│
│    highlight  │     · color legend                     │   · Call stack / recur. │
│  · hover-line ├──────────────────────────────────────┤   · Notes panel (local) │
│    explainers │ (D) NARRATION                          │                         │
│  · copy code  │   · What's happening · Why · Line ·    │                         │
│               │     Invariant/Goal tracker             │                         │
├───────────────┴──────────────────────────────────────┴─────────────────────────┤
│ (F) CONTROL DOCK — ⏮ ◀ ▶ ⏭ play/pause · speed · scrubber (step X / N) ·          │
│                    jump-to-key-event markers · input selector                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **(A) Top bar** — identity + global page controls.
- **(B) Code panel** — the running code (§8).
- **(C) Animation stage** — the USP (§7).
- **(D) Narration** — per-step teaching text (§9). Sits beneath the stage so eyes stay center.
- **(E) Insight rail** — variables, complexity, DS state, call stack, notes (§10, §17).
- **(F) Control dock** — playback + input (§12, §13).

Panels (B), (C)/(D), (E) are **resizable and collapsible** (Figma-style); the dock (F) is pinned.

---

## 6. Layout & Responsive Spec

### 6.1 Layout model
- Base layout: **3-column + bottom dock**, modeled on the existing prototypes and on the
  LeetCode split-pane / Figma editor feel.
- Columns are **draggable to resize** and **individually collapsible**; collapsed panels become a thin rail
  with an icon to restore. Layout (sizes + collapsed state + preset) **persists locally** per user.

### 6.2 Layout presets (one-click)
| Preset | Code | Animation | Insight rail | Use |
|---|---|---|---|---|
| **Learn** (default) | ~27% | ~46% | ~27% | Balanced; everything visible. |
| **Focus** | collapsed/slim | dominant (~70%+) | slim/overlay | Maximize the animation USP. |
| **Compare** | shared | split into two playheads | shared | The ⚔ Race view (§11.4). |

### 6.3 Responsive behavior (desktop-first)
- **Desktop / laptop (≥1080px):** full 3-column + dock. The intended, optimized experience.
- **Tablet (≈820–1080px):** reflow to a 2×2 arrangement (code + animation on top, insights + narration
  below) with the dock pinned. Fully usable.
- **Mobile (<820px):** single-column stack, animation first, then controls, then collapsible code/insights.
  **Read-only-friendly** — playback works; rich resizing not required.
- The dense at-a-glance ideal is a **desktop guarantee**; small screens degrade gracefully, not equally.

### 6.4 No-scroll guarantee
At the default desktop layout and any supported preset, the core loop — **code + animation + variables +
complexity + controls** — fits within the viewport without vertical scrolling. Overflow within an individual
panel (e.g., long code) scrolls *inside that panel only*.

---

## 7. The Animation Engine (the USP) — Detailed Spec

### 7.1 Rendering technology (recommendation)
**Recommended:** render the stage with **SVG** primitives driven by a lightweight motion library
(e.g., Motion One / GSAP / Framer Motion in React), with **HTML overlays** for floating labels, pointer
chips, and badges.

Rationale:
- **SVG** is crisp at any zoom, trivially draws nodes/edges/arrows (essential for trees & graphs), and
  animates transforms smoothly.
- A **motion library** gives spring/eased tweens, morphing, and timeline control out of the box.
- **HTML overlays** keep text labels and tooltips accessible and easy to position.
- Canvas/WebGL is reserved for a future "huge input" mode; not needed for teaching-sized inputs.

This is a recommendation; the data contract (§14) is renderer-agnostic, so the owner may choose otherwise.

### 7.2 Visual primitive library
The engine is a set of **reusable visual primitives**. Each problem's trace declares which primitive(s) its
visual state maps to. Primitives are phased so launch is not blocked (see §21).

| Primitive | Renders | Key affordances | Phase |
|---|---|---|---|
| **Array / String** | Row of indexed cells | per-cell highlight, value change-flash, subarray/window band, range brackets | **P0** |
| **Pointers & Window** | Floating labeled markers over an array | named pointers (i/j/lo/hi/slow/fast), sliding-window shading, pointer motion along path | **P0** |
| **Linked List** | Nodes + directional connectors | animated pointer re-linking, null sentinel, prev/curr/next chips, reversed-vs-remaining chains | **P0** |
| **Recursion / Call Stack** | Stack of frames + optional recursion tree | push/pop animation, current frame highlight, return-value bubble-up | **P0** |
| **Hashmap / Set** | Key→value rows or buckets | insert/lookup/hit-miss highlight, collision/bucket view | **P1** |
| **Stack / Queue** | Vertical stack / horizontal queue | push/pop/enqueue/dequeue motion, top/front markers | **P1** |
| **Binary Tree / BST / Heap** | Node-edge layout | traversal highlight, insertion path, rotation/swap morph | **P1** |
| **Graph** | Node-edge (force/grid layout) | visited/frontier/processed states, edge relaxation, path trace | **P2** |
| **2D Grid / Matrix** | Cell grid | cell visit, direction arrows, flood/BFS wavefront | **P2** |
| **DP Table** | 2D/1D table | cell fill order, dependency arrows (which cells feed this one), final-path trace | **P2** |

Each primitive defines a fixed set of **cell/element states** that map to the global color semantics (§7.4).

### 7.3 Motion design (the "feel")
The three prioritized qualities, required on every primitive:
1. **Smooth motion & morphing** — elements *glide* to new positions/values; pointers slide along a path;
   linked-list arrows re-curve smoothly. **No instant jumps** between meaningful states.
2. **Ghosting / trails (before → after)** — when a value or position changes, the previous state is briefly
   shown as a fading ghost so the learner sees *what changed*, not just the end result.
3. **Focus / spotlight** — the element(s) being acted on this step are spotlighted; irrelevant elements dim.
   Attention is always directed to the right place.

Supporting requirements:
- **Change-flash:** any value/variable that changes this step flashes the "changed" accent briefly.
- **Speed-linked timing:** transition durations scale with the playback speed (§12) so fast playback stays
  smooth and slow playback is deliberate.
- **Interruptible:** stepping/seeking mid-transition cancels and snaps cleanly to the target step (no queue
  buildup).
- **Reduced-motion fallback** (future, §18): when enabled, replace tweens with instant state + a brief
  highlight so motion-sensitive users still follow along.

### 7.4 Color semantics & legend (baseline requirement)
A single, consistent color vocabulary is used **identically across every problem and primitive**, with an
always-available legend on the stage:

| Semantic | Meaning |
|---|---|
| **Active / current** | The element being acted on right now. |
| **Compared** | Elements being compared/read this step. |
| **Visited / done** | Already processed. |
| **Result / answer** | Part of the final answer. |
| **Invalid / discarded** | Excluded or pruned. |
| **Pointer roles** | Each named pointer gets a stable, distinct hue (i/j/lo/hi/slow/fast…). |

Colors are theme-aware (dark/light) and defined as design tokens (§18).

---

## 8. Code Panel

- Shows the **real solution code** for the active approach (Python at launch).
- **Per-step line highlighting:** the trace's `codeKey` maps to a source line (or line range); the active
  line is highlighted and auto-scrolled into view within the panel, in sync with the animation.
- **Hover-line explanation:** hovering any line shows a plain-language explanation of *that specific line*
  (preserving the behavior in the current prototypes). Used by beginners learning the language itself.
- **Syntax highlighting:** language-aware, theme-aware.
- **Copy code:** one-click copy of the current approach's code.
- **Multi-language ready (future):** the data model allows additional language variants per approach
  (Java/C++/JS) with their own `codeKey`→line maps; a language tab switcher can be added without reworking
  the page. Out of scope for launch.

---

## 9. Step Narration / Explanation

Beneath the animation stage, four synchronized teaching elements per step. All beginner-toned:

1. **What's happening now** — one clear, plain-language sentence describing the current action.
2. **Why this step matters** — the intuition / the "aha" behind the step; the reasoning, not the mechanics.
3. **Line-of-code explanation** — what the highlighted line does / its syntax purpose.
4. **Invariant / current goal** — a persistent statement of "what must stay true" (loop invariant) or "what
   we're trying to achieve right now," updated as the algorithm progresses.

Narration content comes from the trace data (§14), authored alongside the solution.

---

## 10. Insight Rail (all four are core)

1. **Live variables & state** — every variable in the active approach with its current value, color-coded by
   role, **flashing when it changes**. `∅`/`null` rendered explicitly. The beating heart of "tracing in your
   head," made external.
2. **Live complexity meters** — running counters of **real operations** (comparisons, swaps, reads, visits,
   recursive calls) shown as a number **and a bar against the theoretical budget** (e.g., `n`, `n log n`,
   `n²`). This turns Big-O from an abstract label into something the learner watches accumulate.
3. **Data-structure state panel** — a dedicated view of auxiliary structures used by the approach (hashmap
   contents, stack, queue, DP table), updating each step — separate from the main animation so the main
   stage stays focused on the primary structure.
4. **Call stack / recursion view** — for recursive approaches, the call stack / recursion tree grows and
   unwinds in sync with the animation, with the current frame highlighted and return values bubbling up.

Panels that don't apply to a given approach (e.g., no recursion) are hidden or collapsed automatically.

---

## 11. Approaches & Comparison

### 11.1 Approach tabs
Each problem can have multiple approaches (e.g., **Brute Force**, **Optimal**, **Alternative**). Tabs switch
the active approach; code, animation, variables, complexity, and narration all update together.

### 11.2 Recommended-approach badge
One approach is marked the **interview-optimal / recommended** one so beginners know what to learn first.

### 11.3 Complexity comparison summary
A compact table/cards summarizing **time & space across all approaches**, so the trade-off is visible at a
glance even before playing them.

### 11.4 ⚔ Race (side-by-side compare)
The **Compare** layout preset (§6.2) runs **two approaches simultaneously on the same input**, each with its
own mini-stage and playhead, surfacing the difference in steps and operation counts in real time. This is a
signature teaching moment ("watch O(n²) fall behind O(n)").

---

## 12. Playback Controls (Control Dock)

Core (required):
- **Transport:** play / pause, next step, previous step, first step, last step.
- **Speed control:** variable playback speed (slow → fast).
- **Scrubber:** draggable progress bar showing **step X of N**; click/drag to seek to any step.
- **Jump to key events ("breakpoints"):** markers on the scrubber for meaningful moments (each swap, each
  match found, each recursion return, each answer added) with buttons to jump between them — skipping
  micro-steps when the learner wants the highlights.

Enhancements (nice-to-have, not launch-blocking):
- **Keyboard shortcuts** (Space = play/pause, ←/→ = step).
- **Loop / auto-replay** for absorbing a pattern.

The dock is **always visible and pinned** (never scrolls away).

---

## 13. Input System

- **Curated presets:** each problem ships a small set of hand-picked example inputs, **including edge cases**
  (empty, single element, duplicates, negatives, max-size-for-clarity). Selectable from the dock.
- **Custom input:** learners can type their own input, **validated against the problem's constraints**
  (type, size limits, value ranges) with clear inline errors. Size is capped to keep the animation legible.
- **How custom input produces an animation:** presets are **pre-traced** at build time (instant playback).
  Custom input is traced **on demand** via a Next.js **server action / API route** that runs the same
  build-time tracer (§15) and returns trace JSON. This keeps the heavy tracer server-side and the page
  light. (A future option is in-browser tracing via Pyodide; not required for launch.)

---

## 14. Data Contract (the JSON the page consumes)

The page is a **player for trace JSON**. This contract is renderer- and framework-agnostic and is the
integration boundary between the build-time tracer (§15) and the Next.js page. All schemas are **versioned**.

### 14.1 `Problem` (one per problem)
```jsonc
{
  "schemaVersion": "1.0",
  "id": "049",                       // matches repo numbering (RULES.md)
  "slug": "4sum",
  "title": "4Sum",
  "topic": "Two-Pointers",
  "difficulty": "Medium",
  "statement": "…markdown…",
  "constraints": ["1 <= n <= 200", "…"],
  "tags": ["two-pointers", "sorting"],
  "glossary": [{ "term": "two-pointer", "definition": "…plain language…" }],
  "presetInputs": [ /* PresetInput[] */ ],
  "approaches": [ /* Approach[] */ ],
  "recommendedApproachId": "optimal"
}
```

### 14.2 `Approach`
```jsonc
{
  "id": "optimal",
  "name": "Sort + Two Pointers",
  "kind": "optimal",                 // "brute" | "optimal" | "alternative"
  "complexity": { "time": "O(n^3)", "space": "O(1)" },
  "languages": {                     // multi-language ready; Python required
    "python": {
      "source": "class Solution:\n    def fourSum(self, nums, target):\n …",
      "lineExplanations": { "3": "Sort so duplicates are adjacent …", "…": "…" }
    }
  },
  "primaryPrimitive": "array",       // which visual primitive the stage uses
  "auxStructures": ["set"],          // drives the data-structure state panel
  "complexityBudget": { "label": "n^3", "fn": "n*n*n" }, // for the live meter
  "tracesByInput": { "<presetInputId>": "<traceRef or inline Trace>" }
}
```

### 14.3 `PresetInput`
```jsonc
{
  "id": "ex1",
  "label": "Example 1 (has duplicates)",
  "value": { "nums": [1,0,-1,0,-2,2], "target": 0 },
  "isEdgeCase": false
}
```

### 14.4 `Trace`
```jsonc
{
  "approachId": "optimal",
  "inputId": "ex1",
  "steps": [ /* Step[] */ ],
  "keyEventIndices": [4, 11, 19],    // for jump-to-key-event markers
  "finalResult": [[ -1,0,0,1 ], [ -2,0,0,2 ]]
}
```

### 14.5 `Step` (the core unit — one frame of the animation)
```jsonc
{
  "i": 12,                           // step index
  "codeKey": "move_p",               // maps to a source line/range for highlight
  "phase": "loop",                   // semantic label: init|loop|check|update|recurse|return|done
  "narration": {
    "happening": "Move the left pointer right because the sum is too small.",
    "why": "A larger left value increases the sum toward the target.",
    "invariant": "p < q always; everything left of i is finalized."
  },
  "op": "p += 1",                    // optional terse operation readout
  "isKeyEvent": false,
  "vars": { "i":0, "j":1, "p":3, "q":5, "sum":-1 },  // variable snapshot (role colors applied by UI)
  "changedVars": ["p","sum"],        // drives change-flash
  "counters": { "comparisons": 14, "moves": 9 },     // drives complexity meters
  "visual": { /* VisualState — primitive-specific, see 14.6 */ },
  "callStack": [ /* optional CallFrame[] for recursion view */ ]
}
```

### 14.6 `VisualState` (primitive-specific; renderer reads this)
A discriminated union keyed by primitive `type`. Examples:

```jsonc
// Array + pointers
{
  "type": "array",
  "values": [-2,-1,0,0,1,2],
  "cellStates": { "0":"visited", "3":"active", "5":"active" },  // semantic states (§7.4)
  "pointers": [ {"name":"i","at":0}, {"name":"p","at":3}, {"name":"q","at":5} ],
  "window": { "from":3, "to":5 },
  "ghosts": [ {"name":"p","from":2,"to":3} ]                    // before→after for trails
}

// Linked list
{
  "type": "linkedList",
  "nodes": [ {"id":"n1","value":1}, {"id":"n2","value":2} ],
  "links": [ {"from":"n2","to":"n1"} ],     // current next-pointers (post-mutation)
  "pointers": [ {"name":"prev","at":"n1"}, {"name":"curr","at":"n2"}, {"name":"next","at":null} ],
  "changedLinks": [ {"from":"n2","to":"n1"} ]
}

// Recursion / call stack
{
  "type": "recursion",
  "frames": [ {"id":"f0","label":"solve(0,5)","returnValue":null,"isCurrent":true} ],
  "treeEdges": [ {"from":"f0","to":"f1"} ]
}
```
The owner defines a `VisualState` variant per primitive in §7.2; each variant enumerates its element states
using the §7.4 semantic vocabulary.

### 14.7 Contract guarantees
- Every `Step.codeKey` must resolve to a real line/range in every provided language's source.
- `vars`, `counters`, and `visual` are **complete snapshots** at that step (no diffs to apply) — the player
  can seek to any step instantly and render correctly.
- `changedVars` / `changedLinks` / `ghosts` are the *only* diff-style fields, used purely for motion/flash.
- Traces are deterministic for a given (approach, input).

---

## 15. Build-Time Tracer — Responsibilities & Authoring Workflow

### 15.1 What it is
A Python tool (run in the authoring/build pipeline, **not** in the browser) that executes a solution and
records a `Trace` (§14.4) per (approach, input). Recommended mechanism: **`sys.settrace`** (line-level trace
function), as used by Python Tutor and standard debuggers, optionally backed by `bdb`.

### 15.2 Responsibilities
1. **Execute** the real solution against each preset input (and on-demand custom input via the API route).
2. **Snapshot at each meaningful line:** capture local variables, the values of tracked auxiliary structures,
   and the current call stack.
3. **Map source line → `codeKey`:** via lightweight author annotations (e.g., a comment/decorator marking
   which lines are "meaningful" and their key) so the animation highlights the right line and isn't cluttered
   by trivial lines.
4. **Derive `VisualState`:** translate the tracked structures into the primitive-specific visual state
   (§14.6) — e.g., array + pointer positions, linked-list nodes/links, call frames.
5. **Count operations:** increment the relevant counters (comparisons/swaps/visits/calls) for the complexity
   meter, against the declared `complexityBudget`.
6. **Mark key events:** flag steps that are "highlights" (swap, match, push/pop, recursion return, answer
   appended) into `keyEventIndices`.
7. **Attach narration:** merge author-written `happening` / `why` / `invariant` text keyed by `codeKey`/phase.
8. **Emit deterministic JSON** conforming to §14, one trace per (approach, input), schema-versioned.

### 15.3 Author workflow to add a new problem
1. Write/curate the Python solution(s) following the repo's existing `RULES.md` (global numbering, topic,
   difficulty, complexity header).
2. **Annotate meaningful lines** with their `codeKey` and **declare the visual primitive** + which variables
   map to pointers/structures (a small per-problem config).
3. Write the **narration** (`happening`/`why`/`invariant`) and **per-line explanations** for the code panel.
4. Define **preset inputs** (typical + edge cases) and the **complexity budget**.
5. Run the tracer → produces trace JSON per input.
6. **Review** the generated animation in the page; tune annotations/narration for teaching clarity.
7. Publish the `Problem` bundle (JSON + code) as static data the page loads.

> Authoring effort is "write the solution once, annotate it, write the teaching text" — the trace itself is
> generated, so the animation can never drift from the real code.

---

## 16. Onboarding & Help

- **Hover glossary tooltips:** hovering any jargon term (e.g., "invariant", "two-pointer", "carry") shows a
  plain-language definition (sourced from `Problem.glossary`).
- **Per-line hover explanations:** hovering any code line explains that line (see §8) — preserving the
  current prototypes' behavior.
- **Guided first-run tour:** a short, dismissible interactive walkthrough of the panels and controls the
  first time a learner opens the page (state stored locally).

---

## 17. Notes Panel (local)

- A small **personal notes** area on the page where the learner can jot insights.
- **Stored locally** (e.g., `localStorage`), per problem. **No account / no backend.**
- Optional convenience (future): "pin this note to step N" so a note recalls the moment it refers to.

---

## 18. Theming

- **Dark + light themes** with a toggle (required). Default follows system preference.
- All colors — including the semantic animation palette (§7.4) — defined as **design tokens** so both themes
  and future palettes (colorblind-safe) derive from one source.
- **Future (not launch):** reduced-motion mode, colorblind-safe palette, full keyboard/screen-reader support
  (see §21).

---

## 19. Performance & Quality Bar

- **Instant playback** for presets (pre-built JSON; no runtime computation to start).
- **60fps target** for all stage motion at default input sizes.
- **Seek is O(1) to render:** because each step is a complete snapshot (§14.7), jumping to any step is
  immediate.
- **Input size guards:** validated caps keep animations legible and frame budgets safe; oversized inputs are
  rejected with guidance.
- **Custom-input tracing latency:** server action should return a trace within a small, bounded time;
  show a clear loading state.
- **Bundle discipline:** the page itself stays light; the heavy tracer lives server-side.

---

## 20. Acceptance Criteria (Definition of Done for the page)

1. On a desktop viewport, **code + animation + variables + complexity + controls are all visible without
   scrolling** in the default Learn preset.
2. Pressing **play** animates the active approach smoothly with motion, ghosting, and spotlight; line
   highlight and narration stay in sync at every step.
3. **Next/prev/first/last/seek/speed** all work, and **jump-to-key-event** markers navigate to the right
   moments.
4. Switching **approach tabs** updates code, animation, variables, complexity, and narration coherently.
5. The **⚔ Race** preset plays two approaches on one input with independent playheads and live counters.
6. Selecting a **preset input** re-renders instantly; entering **custom input** validates and (via the API
   route) produces a correct animation.
7. **Variables flash on change**, **complexity meters fill against budget**, **DS state** and **call stack**
   update per step where applicable.
8. **Hover-line explanations**, **glossary tooltips**, and the **first-run tour** work.
9. **Dark/light themes**, **copy code**, and **local notes** work.
10. The same page renders a non-prototyped pattern (e.g., a graph or DP problem) from its trace JSON **with
    no page redesign** — proving the format generalizes.

---

## 21. Phasing / Roadmap

**P0 — Launch (prove the format end-to-end):**
- Page shell, layout + presets, control dock, narration, insight rail, theming, onboarding.
- Primitives: **Array/String + Pointers/Window, Linked List, Recursion/Call Stack.**
- Build-time tracer + data contract + 3 reference problems (reuse `002`, `049`, `050` as the migration set).

**P1:**
- Primitives: **Hashmap/Set, Stack/Queue, Trees/BST/Heap.**
- On-demand custom-input tracing via server action; complexity comparison polish.

**P2:**
- Primitives: **Graphs, 2D Grid/Matrix, DP Table.**
- Race-mode polish for very different complexities.

**Future / backlog:**
- Multi-language code tabs; deep-link URL state (restore approach + input + step); GIF/video export;
  embeddable iframe; reduced-motion + colorblind-safe + full screen-reader a11y; keyboard shortcuts & loop;
  quizzes/checkpoints; Pyodide in-browser tracing.

---

## 22. Open Questions / Risks

- **Custom-input tracing cost:** running Python server-side per custom input — confirm latency, sandboxing,
  and abuse/size limits are acceptable for the chosen Next.js hosting.
- **Graph & large-input legibility:** automatic graph layout that stays clean and teachable is hard; may need
  per-problem layout hints in the trace.
- **Annotation burden:** mapping lines→`codeKey` and variables→visual roles must stay lightweight or
  authoring won't scale; consider sensible defaults/auto-detection.
- **Multi-language line mapping (future):** keeping `codeKey` highlight correct across languages needs a
  per-language map.
- **Race mode for wildly different step counts:** decide alignment strategy (by time vs by logical phase).

---

## 23. Appendices

### Appendix A — Candidate product names (placeholder until chosen)
Used as a placeholder in this doc: **"the Problem Page" / "DSA Problem Studio."** Candidates to consider:
- **AlgoLens** — "see through the algorithm."
- **StepWise** — emphasizes step-by-step learning.
- **AlgoStage** — the animation as a performance/stage.
- **TraceLab** — nods to the real-code tracer.
- **Algoria** / **Algowise** — brandable, learning-focused.
- **Cinema** (Cinematic Algorithms) — leans into the animation USP.

### Appendix B — Prior art in this repo (reference, not to be modified)
- `050_reverse_linked_list_visualizer.html` — linked-list reversal; iterative + recursive; Race view.
- `002_add_two_numbers_visualizer.html` — linked-list addition; optimal + brute; carry-flow state.
- `Two-Pointers/Medium/049_4sum_visualizer.html` — array two-pointer; optimal + brute; grid map.

These establish the proven 3-column + dock layout, the `steps[]` trace model, `codeKey`→line highlighting,
the approach registry, glossary tooltips, and the Race view that this PRD canonicalizes and elevates.

### Appendix C — Glossary seed (per-problem, extend as needed)
`invariant`, `two-pointer`, `sliding window`, `carry`, `recursion / base case`, `frontier`, `relaxation`,
`memoization`, `prefix/suffix`, `in-place`.

### Appendix D — Reference sources
- Python Tutor — code execution visualization: https://pythontutor.com/visualize.html
- VisuAlgo — DS/algorithm animations: https://visualgo.net/en
- Algorithm Visualizer — split code+viz: https://algorithm-visualizer.org/
- `sys.settrace` (tracing mechanism): https://docs.python.org/3/library/sys.html#sys.settrace

---

# PART II — Canonical Visual Design System & Per-Structure Animation Spec

> **Purpose & authority.** This part is the **single source of truth** for *how every data structure,
> algorithm, and pattern looks and animates*. Its goal is to eliminate inconsistency and "hallucination"
> when new problems are authored: when in doubt, the rules and tokens here win. Every structure reuses the
> **same foundational tokens** (§D-0) so a color, shape, or motion always means the same thing across the
> entire catalog. Grounded in the conventions of VisuAlgo, USFCA/Galles, algorithm-visualizer.org, Python
> Tutor, and the classic Pathfinding Visualizer, refined for clarity and colorblind safety.

## D-0. Foundations (apply to EVERY structure)

### D-0.1 Stage & coordinate model
- One `<svg>` per stage with a `viewBox` and a single root `<g class="camera">` that you translate/scale for
  auto-fit and pan/zoom. **Never hardcode pixel positions on elements.** Compute a layout into a coordinate
  map, bind elements to it, then *transition* elements to new coordinates when the structure changes.
- **Animate the element group's `transform`**, never the shape's raw `cx/cy/x/y`; text is a child so it
  glides for free.
- Draw **edges before nodes** in DOM order so nodes paint over edges. Edges are `<path>` (not `<line>`) so
  `stroke-dashoffset` "draw-in" and curving are possible.
- After layout, fit the content to ~85% of the stage; recompute + glide on every structural change.

### D-0.2 The canonical color-state palette (ONE palette, used everywhere)
Two separate layers that may share hues because they never occupy the same visual plane:

**Layer 1 — Element/cell semantic state** (owns the fill/border of cells, nodes, bars, table cells):

| Token | Meaning (identical across all structures) | Light fill | Accent/stroke |
|---|---|---|---|
| `idle` | resting / default | surface white · dark `#1E2530` | muted `#CBD5E1` 1.5px |
| `current` | **the one element being processed this step** | `#F3ECFD` | violet `#7C3AED` 2.5px **+ halo ring** |
| `compared` | being read/compared this step | `#E6F0FB` | blue `#0072B2` 2.5px |
| `changed` / `moving` / `swapping` | value/position changing mid-transition | `#FBE7E1` | vermillion `#D55E00` 2.5px |
| `frontier` / `in-queue` / `candidate` | discovered, not yet processed | `#FFF3D6` | gold `#FFC53D` 2px |
| `visited` / `done` / `closed` | already processed (kept on screen) | `#E0F7FB` | cyan `#00BEDA` 2px |
| `dimmed` / `out-of-scope` | excluded search space (NOT deleted) | — | `opacity .45`, grey |
| `result` / `found` / `sorted` / `committed` | final / correct | `#E4F5EC` | green `#009E73` 2.5px |
| `path` | reconstructed answer path | `#FFFBD6` | yellow `#FFE94D` 2.5px |
| `special` / `pivot` / `key` / `end-of-word` | distinguished role | `#F3E8FB` | purple `#CC79A7` 2.5px |
| `error` / `miss` / `conflict` / `rejected` | failed / pruned | `#FDECEC` | red `#DC2626` 2.5px (dashed if rejected-edge) |
| `wall` / `blocked` | impassable (grids) | dark slate `#0C3547` | — |

**Layer 2 — Pointer/marker identity** (owns the markers in the *gutters*, never the cell fill). Each named
pointer keeps a **fixed categorical hue for the whole animation**:
`i / lo / left / slow` = blue `#0072B2` · `j / hi / right / fast` = orange `#E69F00` · `mid` = purple
`#CC79A7` · additional pointers cycle an Okabe–Ito categorical ramp.

**Hard rules (anti-inconsistency):**
- Cells own Layer-1 colors; pointers own Layer-2 colors in the gutters — they may reuse hues because they're
  on different layers. **Never recolor a cell to indicate a pointer.**
- **Never rely on hue alone.** Always pair color with a second channel: border weight, a glyph (▶/◎/♛/∅), a
  label, or motion. (Colorblind-safe: the palette is Okabe–Ito / Wong-derived.)
- **≤ 6 simultaneous semantic colors** on screen. Beyond the current comparison set + the growing
  result/visited region, keep everything `idle`.
- `current` is unique: **exactly one element** wears violet+halo at a time, so the eye always knows the focus.

### D-0.3 Sizing tokens (defaults; scale down before wrapping/overflowing)

| Element | Size | Gap | Radius | Border |
|---|---|---|---|---|
| Array / string cell | 48×48 (min 32 when n large) | 8px | 6px | 1.5px |
| Index label | 11px, muted, **below** the cell | — | — | — |
| Value text | 16–18px, 600, tabular numerals | — | — | — |
| Pointer caret + label pill | ~14px caret, 11–12px label | — | pill 999 | — |
| Window / range "tray" | cells + 4px pad | — | 10px | 2px dashed |
| Linked-list node | 84×48 (108 doubly): value box + pointer box | 40px | 8px | 1.5px |
| Stack cell (vertical) | 88×40 | 4px | 6px | container 2px |
| Queue cell (horizontal) | 48×48 | 4px | 6px | — |
| Hash bucket (M = 7–13) | 56×40, vertical column | 4px | 6px | 1.5px |
| Sort bar | width `clamp(4, (W−(n−1)·gap)/n, 40)`, height ∝ value | `max(1, .15·width)` | 2px top only | — |
| Tree/graph node | circle r = 20–22 (trie r = 14–16) | level gap 70–80px | — | 2px |
| Recursion-tree / call-stack frame | rounded rect ~120×40 (stack ~full-width×64) | 4px | 8px | 2px |
| Grid / matrix cell | 25–28 (DP cell 44–56) | 1px gridline | 0 (grid) / 6 (DP) | 1px |

### D-0.4 Motion grammar (durations & easing; all scaled by the global speed multiplier)

| Transition | Duration | Easing |
|---|---|---|
| Flash / recolor | 120–180ms | linear/ease |
| Pointer hop (with 2px arc) | 200–300ms | ease-in-out |
| Element glide / swap (arc) | 300–450ms | spring `cubic-bezier(.34,1.2,.4,1)` |
| Enter (appear/settle) | 250–350ms | ease-out `cubic-bezier(.16,1,.3,1)` |
| Exit (leave) | 250–300ms | ease-in |
| Large reflow (tree re-layout, merge collapse, rehash) | 500–700ms | ease-in-out |
| Confirm pulse (found/locked) | ~600ms | keyframe pulse |
| Wavefront stagger | 12–30ms per element; **≥30ms between BFS levels** | — |

Rules: **one conceptual change per step**; nothing exceeds ~700ms in autoplay; stagger sibling animations
30–50ms; a step is interruptible (seeking cancels and snaps to target).

### D-0.5 The three signature motion qualities (required on every primitive)
1. **Smooth motion & morphing** — elements glide to new positions/values; pointers slide; arrows re-curve.
   **No instant jumps** between meaningful states.
2. **Ghosting / trails** — when a value/position changes, the previous state lingers ~200ms as a fading
   `changed`-colored ghost so the learner sees *what changed*.
3. **Spotlight / dim** — the `current` element(s) are spotlighted; irrelevant elements drop toward `dimmed`.
4. (+ baseline) **Change-flash** on any variable/cell that changes this step; **always-visible legend** of
   the active state colors on the stage.

### D-0.6 Global cross-cutting rules (the anti-hallucination contract)
1. **Animate state, not layout.** Freeze layout; only re-layout on a real structural change, then glide all
   elements to new tidy positions.
2. **One `current` at a time** (violet + halo).
3. **Stagger waves by discovery/level order**, never by scan/row-major order.
4. **Dim, don't delete** discarded search space (binary search, two-pointer, removed nodes show ghost-out).
5. **Color + a second channel**, always; ≤6 simultaneous semantic colors.
6. **Backward traceback** for every path reconstruction (grid path, DP, shortest path, BST successor).
7. **Motion must explain** — show the "why" caption (e.g., `sum 12 > target 9 → hi--`) *before* the move.
8. **Companion structure panel** (queue/stack/PQ/heap/adjacency) is visible and synchronized to the stage.
9. **One timeline** drives all synchronized views (e.g., recursion tree ↔ call stack; heap tree ↔ array).
10. **Respect `prefers-reduced-motion`**: replace glides with crossfade/snap; keep state colors (they carry
    meaning).

---

## D-1. Data-structure primitives

### D-1.1 Array / String
- **Shape/size:** square cells per tokens; value centered; **index label 11px muted below**. >24 elements →
  shrink cells to 32px before wrapping; never wrap a conceptual 1D array mid-algorithm (pointer geometry
  depends on a stable row). Fixed origin x so cells never reflow horizontally.
- **States:** `idle`, `compared`, `current`, `result/sorted`, `dimmed` for excluded ranges.
- **Animations:** read → border flash `compared` 150ms; write → scale-pop 1.0→1.08→1.0 (180ms) + green
  flash. **Range/subarray:** a rounded translucent "tray" rect *behind* the cells (4px padding, radius 10px)
  whose `x`/`width` animate to grow/shrink — never recolor every cell; optionally `[ ]` bracket caps.
- **Pitfalls:** don't put index inside the cell; don't reflow the row on a single change; don't mark a range
  by fill alone.

### D-1.2 Pointers & Sliding Window
- **Pointer marker:** small triangular caret (~14px) + a name pill in the pointer's Layer-2 color, placed in
  the **below gutter** (under index labels). Read/index pointers below; a single result pointer may go above.
  ≤2 pointers per side.
- **Pointer move:** horizontal glide to the new cell center (220ms) with a 2px vertical hop arc; destination
  cell flashes `current` on arrival. When two pointers meet, pulse both (scale 1.15, 150ms). **Never teleport
  a pointer.**
- **Sliding window:** translucent amber tray (radius 10px) spanning the window + a live badge above
  (`sum=23`, `len=4`). **Grow (right++):** animate tray `width` out (250ms ease-out), entering cell pops in.
  **Shrink (left++):** animate `x`+`width` in (250ms ease-in), leaving cell flashes `changed` then `dimmed`.
  Fixed window slides as a rigid translate. Expand and contract are **two distinct beats**.
- **Pitfalls:** don't stack pointers at the same x without vertical offset; keep the tray translucent.

### D-1.3 Linked List (singly / doubly / circular)
- **Node:** rounded rect split into **value box + next-pointer box** (~84×48; doubly adds a prev box ~108px),
  with a filled dot at the pointer origin. Horizontal chain, 40px gaps. `head`/`tail` as pills above.
  Circular: route the tail→head arrow as a curved path *under* the row (don't force a literal circle).
- **Arrows & null:** 2px path from pointer-dot to next node's left edge with an 8px arrowhead marker; doubly
  = two offset arrows. **Null** = a slashed `∅` / ground symbol / grey "null" pill in the pointer box — pick
  one, keep it.
- **Re-link animation (the crux, ordered):** (1) fade old arrow to 30% dashed; (2) new node enters from above
  (translateY −40→0, fade, 300ms); (3) **draw new arrow** via `stroke-dashoffset` (250ms); (4) snap old arrow
  out. Delete = redraw bypass arrow first, *then* drop+fade the removed node, *then* optionally reflow to
  close the gap (400ms). **Show the pointer rewire before the gap-closing reflow.**
- **Pitfalls:** don't reflow before rewiring; arrows originate from the pointer field, not node center.

### D-1.4 Stack (LIFO)
- **Shape/orientation:** vertical cells (88×40) in an open-top container with a solid base, **growing
  upward**, top = TOS; `top →` pill to the right of the top cell.
- **Push:** new cell enters from above (translateY −48→0 + fade, 280ms ease-out) with a 2px overshoot bounce.
  **Pop:** TOS flashes `current`, lifts up + fades (250ms ease-in), container height tweens down; if the
  return value matters, fly it to a "returned" slot.
- **Pitfalls:** never grow downward; all motion happens at the top.

### D-1.5 Queue / Deque (FIFO)
- **Shape/orientation:** horizontal cells (48×48), open both ends, **front on the left, rear on the right**;
  `front →` pill below-left, `← rear` below-right.
- **Enqueue:** cell slides in from the right (translateX +40→0 + fade, 280ms). **Dequeue:** front cell
  flashes, slides out left + fades, remaining cells glide left one slot (30ms stagger, 300ms). Front/rear
  pills glide to their new cells. Ring buffer: show wrap as a faint modulo arc, don't physically reorder.
- **Pitfalls:** be unambiguous and consistent about which end is front.

### D-1.6 Hashmap / Hash Set
- **Layout:** input **key chip** (purple `special`) on the left; a **vertical bucket array** of M numbered
  slots (M = 7–13). Set = single chips; map = `key : value` mini-rows. Separate chaining = each bucket grows
  a horizontal linked list to the right (reuse D-1.3 at ~70%); open addressing = flat array with probing.
- **States:** `special` key, `current` target bucket, `compared` probed/chain slots, `result` hit,
  `error` miss, `dimmed` probed-empty.
- **Animation — the hash is the hero:** (1) key chip pulses; show `h("cat") = 7 mod M = i` counting out;
  (2) key chip **flies along an arc** from input to bucket i (400ms) — the arc *is* the hash mapping;
  (3) insert into empty = drop + green pop; **collision (chaining)** = append as new node with the D-1.3
  arrow-draw; **collision (probing)** = step slot→slot (each flashes `compared` ~200ms, staggered) to the
  first empty (green); (4) lookup = same arc, walk chain/probe flashing `compared`, end on green `found`
  pulse or red `miss` **shake** (3px, 200ms).
- **Pitfalls:** ALWAYS animate the key→bucket arc and show the modulo math; distinguish hit/miss by motion
  (pulse vs shake), not color alone.

### D-1.7 Binary Tree / BST
- **Node:** circle r=20–22, value centered 700-weight; edges as `<path>`, 2px. Circles keep trees visually
  distinct from array/stack rectangles.
- **Layout: Reingold–Tilford "tidy tree" (NOT naive halving).** `y = depth · 70–80px`; two-pass x
  assignment (parent centered over children, sibling gap ~46px, resolve subtree overlap via mod accumulator).
  Guarantees no edge crossings and left/right symmetry. Auto-fit after layout.
- **Null children:** small dashed `∅` stub (r≈9, muted), toggleable — essential for teaching "walked left,
  hit null, insert here."
- **Animations:** a **pulsing cursor ring** (separate `<circle>`, slowly rotating dash) glides root→target
  along edges (~400ms/hop, 250ms pause to show `32<50 → left`); matched node flashes `result`. **Insert:** new
  node fades+scales in at the null slot, then **the whole tree re-runs layout and every node glides** to its
  tidy position. **Rotation (3 beats, ~900ms):** highlight pivot+child edge `changed` → rotate the subtree as
  a rigid group along an arc while the re-parenting subtree detaches and glides → re-layout glide + edges
  redraw; label it ("Right-Rotate(50)").
- **Pitfalls:** no naive-halving layout; **never teleport on rotation/insert** — the glide is the lesson;
  keep the cursor ring separate from node highlight.

### D-1.8 Heap (min/max) — dual tree + array view
- **Layout:** **tree on top, array strip below** (or side-by-side). Tree uses simple complete-binary-tree
  positioning (`x = (slotInLevel+0.5)/2^depth · width`). Array = squares (~44px) with index labels below.
  Persistent formula legend (pick one indexing and keep it): 1-based `parent=⌊i/2⌋, left=2i, right=2i+1`.
- **Cross-view sync (the whole point):** every op highlights the corresponding **tree node AND array cell
  simultaneously**; faint connectors tie cell i ↔ its node.
- **Sift-up:** value enters at last slot / bottom-right leaf; compare with parent (both `changed`); if
  violated, **swap = two simultaneous arcing glides** in the tree + slide-swap in the array (~450ms); repeat
  upward. **Sift-down:** at root, highlight both children, **flash the chosen child `current`** before
  swapping. Insert = append + sift-up; extract = root flashes `result`, lifts out, last element glides into
  root, sift-down.
- **Pitfalls:** never animate only one view; never skip the "choose larger/smaller child" beat; always show
  index labels.

### D-1.9 Trie (prefix tree)
- **Node:** small circle r=14–16; **the character label rides on the EDGE** (in a small chip at the edge
  midpoint), not in the node — nodes are junctions. Root labeled "•". m-ary tidy-tree layout, children sorted
  alphabetically, generous horizontal pan/auto-fit (tries get wide).
- **End-of-word marker:** a filled inner `result` dot / doubled ring.
- **Insert:** walk char by char; existing edge → glide cursor down it (brief `result` flash = shared prefix);
  missing edge → draw new edge (`stroke-dashoffset` 200ms) + fade-in node + re-layout; final char → pop in
  end-of-word dot. **Search:** same walk; full hit = `result` pulse (verify end-of-word dot, else `changed`
  "prefix only"); miss = `error` at first absent edge.
- **Pitfalls:** don't put characters in nodes; always surface prefix-vs-word distinction.

### D-1.10 Recursion Tree
- **Node:** rounded rect ~120×40 (two-line: `fib(5)` then `→ 5` on return). Top-down tidy tree, **built
  incrementally** as calls happen (DFS, left→right) so it *unfolds*.
- **States:** `current` (executing, brightest), on-stack = `current` border, `result` (returned, value
  filled), `special` (memo hit, no recurse), base case = solid `result` leaf.
- **Call (branch down):** parent spawns child that fades + slides down along a drawn edge (~350ms); child
  becomes `current`. **Return (bubble up):** box flashes `result`, **return-value chip slides up the edge** to
  the parent's pending slot (~400ms); deep returned subtrees may dim/collapse to stay compact.
- **Pitfalls:** don't pre-draw the whole tree; show returns *moving*; auto-collapse for exponential trees;
  keep DFS order honest.

### D-1.11 Call Stack
- **Frame:** full-width rounded rect ~64px tall, **newest on top**; shows function+args header (`current`
  text) + locals as `key→value` chips. Single column, 4px gaps; top frame distinct (brighter, slight scale,
  halo); lower frames dim to opacity .6.
- **Push (call):** frame slides in from top with a spring (~350ms), header flashes; old top dims. **Pop
  (return):** top flashes its return value, slides up + fades (~300ms); the frame beneath brightens and its
  pending local receives the value (flash). **Synchronized** with the recursion tree (D-1.10) via one
  timeline: step forward pushes a frame *and* branches the tree; step back pops *and* collapses.
- **Pitfalls:** never let frames appear/vanish without motion; truncate long locals (expand on hover); cap
  visible frames with a "…N more" collapse.

### D-1.12 Graph (directed / undirected, weighted / unweighted)
- **Node:** circle r=18–22, white fill, 2px state-colored stroke, centered label. **Edge:** 2px `<path>`;
  weight→thickness only as a *secondary* cue (always show the number). **Directed arrowhead** = SVG marker
  ~10×8 placed at the node *boundary* (back off r px along the edge vector so it kisses the rim).
- **Layout — be opinionated, avoid live force layouts:** compute once, **freeze**. Prefer: **circular** for
  small graphs (≤12 nodes; soft-cap teaching graphs ~12–15), **layered/Sugiyama** for DAGs/topo-sort,
  **grid-snap** for lattices. If force-directed is needed, run it to convergence offline then freeze — never
  leave the simulation running during playback. Min center-to-center 3·r (~60px). Edge weights in a small
  white rounded chip nudged ~10px perpendicular; mirror opposing directed edges as quadratic Béziers.
- **States:** node `idle/frontier/current/visited/path`; edge idle (muted) / tree-edge (cyan, thicker) /
  relaxing (`changed` pink flash) / path (yellow) / rejected (grey dashed).
- **Animations:** discovery = scale-pop 0.3→1.2→1 (400ms) + color; edge traversal = `stroke-dashoffset` draw
  (300ms); relax = pink flash + distance-label tween.
- **Pitfalls:** no live force jitter; arrowheads must not hide under circles; weights readable; don't animate
  node *positions* during an algorithm — only state.

### D-1.13 2D Grid / Matrix
- **Cell:** 25–28px square, 1px `#AFD8F8` gridlines, no rounded corners (must tile). Start/end carry a
  **glyph** (▶ / ◎) in addition to color. Board ≤ ~50×25 visible.
- **Visited wavefront (the star):** stagger newly-visited cells **by BFS level** (level d+1 begins ≥30ms
  after d) → the iconic expanding diamond ripple; per cell scale-pop 0.3→1.2→1, color settling to `visited`
  cyan. **Traceback:** animate the path **backward** end→start, one cell per ~40ms, popping to `path` yellow.
- **Pitfalls:** wavefront not too fast; order by discovery distance, not row/col; traceback goes backward;
  keep a 1px inner stroke so gridlines survive fills.

### D-1.14 DP Table (1D / 2D)
- **Cell:** 44–56px square; header row/column for indices and (sequence DP) the actual characters. 1D = a
  single labeled row. Fill in **true recurrence order**; current cell `current` violet.
- **Dependencies (what separates great from mediocre):** when computing `dp[i][j]`, flash the **source cells
  it reads** (`[i-1][j]`, `[i][j-1]`, `[i-1][j-1]`) `compared` and **draw thin arrows** from each into the
  current cell (diagonal = match-carry, up/left = inherit). Show the **instantiated recurrence** in a side
  panel: `dp[3][4] = 1 + dp[2][3] = 1 + 2 = 3`. Only show the current cell's dependencies (fade others).
- **Answer + traceback:** ring the answer cell; **follow stored arrows backward** to the origin in `path`
  yellow (diagonal steps reconstruct the LCS/alignment/items).
- **Pitfalls:** never fill without dependency arrows; never show all arrows at once; tie cells to the
  recurrence text; size cells for 2–3 digit numbers.

### D-1.15 Union-Find / Disjoint Set
- **Two synced views:** parent-pointer **forest** (arrows child→parent, roots ringed) + **set membership by
  color** (one categorical hue per component). Roots horizontally separated.
- **Find:** trace node→root, flashing each path node `current`. **Union:** highlight both roots; the
  smaller/lower-rank root's new parent edge **draws in** to the other root; then **both components recolor to
  one shared hue** (400ms blend). **Path compression:** traversed nodes' parent edges **re-point straight to
  the root** (each endpoint slides old-parent→root, ~300ms); show tree height shrinking.
- **Pitfalls:** recolor *both* sets on union; animate the re-pointing (don't compress silently); avoid
  too-similar component colors.

### D-1.16 Adjacency companion views (matrix / list)
- **Matrix:** n×n grid (DP-cell styling ~36px); `[i][j]` filled = edge/weight; **highlight `[i][j]` when edge
  (i,j) is examined** during traversal. **List:** each vertex = a row bucket with a horizontal chain of
  neighbor chips (→ connectors); highlight the chip being scanned. **Cross-highlight:** selecting a node in
  the graph lights its matrix row and list bucket and vice versa. This tri-view sync is the most teachable
  representation device — keep it available for all graph problems.

---

## D-2. Algorithm-pattern choreography
Each pattern reuses the primitives above; this section fixes *the motion that teaches the pattern*.

- **Two pointers — converging:** array + `lo`(blue)/`hi`(orange) below; the **excluded outer region dims to
  `dimmed`** as they march inward (the bright center *is* the live search space). Flash compared cells; match
  → `result`. **Same-direction:** `slow`/`fast` as two separate beats so the speed gap is felt; span wears the
  window tray. Always caption the *why* before moving.
- **Sliding window:** see D-1.2; running aggregate as a tweening badge; entering cell green-in, leaving cell
  vermillion-out each beat.
- **Binary search:** `lo/hi/mid` below; **the discarded half dims to `dimmed`** while the live half stays
  bright — the shrinking bright band is the halving. `mid` glides to the new midpoint; the dead half washes to
  opacity .45 (250ms). Show `mid=(lo+hi)>>1`. **Dim, don't delete.**
- **Sorting (bars):** states `compared` (amber) examine → `changed` (vermillion) change → `result` (green)
  placed. **Swap = arc-translate** of the two bars (one dips so they don't flicker, 350ms), keeping stable bar
  identity. **Merge sort:** split into stacked sub-rows (400ms) then **fly bars one at a time** into a sorted
  output row (compare two front candidates amber), collapse back up. **Quicksort:** pivot = `special` purple,
  `i/j` partition pointers below, ≤pivot gather left / >pivot gather right, pivot glides to final slot →
  `result`; shrink the active `[left..right]` bracket on recursion. **Heap sort:** dual bars+tree, sift in
  both views, extracted max flies to the growing `result` tail. **Counting sort:** second count-bucket row;
  tally → prefix-sum → place back. Cap animated n (~80), then "turbo" instant-recolor; always grow the green
  sorted region.
- **Prefix-sum / Kadane / monotonic stack:** prefix-sum = two index-aligned rows, fly ghosts of `A[i]` and
  `P[i-1]` into `P[i]`; range query lights `P[r]` & `P[l-1]` with a subtraction badge. Kadane = array +
  `current`/`best` badges that tween, reset cut-mark, green marker under the best index. Monotonic stack =
  array + vertical stack; violating elements **pop** (staggered 120ms) with a **resolve-arc** drawn from the
  popped index to the triggering `A[i]` (the arc is the answer pair) — then push `A[i]`.
- **Tree traversals:** BST layout + cursor ring + a **result strip** that fills on visit. DFS pre/in/post
  differ only in **when** the node flashes `result` and drops to the strip relative to descending — annotate
  that beat ("preorder: emit before children"); show the implicit stack as a side column. **Level-order/BFS:**
  explicit horizontal **queue** strip; dequeue (slide-left) → node `result` → strip; enqueue children
  (slide-in right); faint band marks the current level.
- **BST operations:** insert/search = path-walk + insert glide. **Delete — three visually distinct cases:**
  leaf (flash `error`, shrink out, edge→null stub); one child (child subtree glides up); **two children**
  (highlight `error` → cursor walks to in-order successor flashing each hop → successor value **flies up** into
  the deleted slot → delete successor's old spot → re-layout glide). Slow the two-child case down; name the
  successor.
- **Backtracking (N-Queens / subsets / permutations / sudoku):** **two synchronized views** — a decision tree
  (D-1.10) + the board/grid. **Try:** piece fades in `changed` + a tree branch grows. **Validate:** attacked
  row/col/diagonal flash a translucent `error` wash on conflict. **Fail/prune:** the tree branch flashes
  `error` then **collapses/greys** (pruning made visible). **Undo (the signature):** the piece **plucks off** —
  scales up, becomes an `error` dashed **ghost**, and fades out moving back toward its parent as the tree
  branch retracts. **Solution:** board flashes `result`, the path to the leaf lights gold. Board ↔ tree always
  move together; undo must visibly *reverse* the place.
- **Divide & conquer (merge sort detail):** one recursion-tree-of-arrays; the active array **breaks into two
  groups that slide down**; recurse to singletons (`result` base case); merge ascends the *same* tree with
  two-color (left/right origin) coding + two `changed` pointers lifting the smaller element up into the parent
  slot; merged array `result` rises to occupy the parent. Use the same tree for split and merge.
- **Heap sort / priority queue:** build-heap = sift-down from last internal node up (region tints `result`);
  extract loop = root↔last swap (arc in tree + slide in array), last cell locks `result` and detaches into a
  shrinking-heap / growing-sorted-tail split, then sift-down on the reduced heap; PQ push/pop = D-1.8 insert/
  extract in both views. Make the heap-vs-sorted boundary explicit (divider line / dim the sorted tail).
- **BFS (graph & grid):** explicit FIFO queue strip (enqueue slides in right, dequeue slides out left →
  `current`); frontier amber, level wave with ≥30ms level stagger; immutable `dist` label stamped on
  discovery.
- **DFS (graph & grid):** LIFO stack / call-stack panel; **one active deep tendril** (not a wave); on
  backtrack the returning edge dims to a finished tree edge; optional **edge classification** (tree=cyan,
  back=red dashed, forward=blue, cross=grey) with `d/f` discovery/finish labels.
- **Dijkstra / A*:** min-heap PQ view; tentative `dist` (A*: `g+h=f`) labels **tween down** on relax; edge
  examine = pink flash, and on improvement the node's parent edge re-points (old fades, new draws in); A*
  wavefront visibly leans toward the goal (vs Dijkstra's symmetric expansion). Distinguish **frontier (amber)
  vs finalized (cyan)** — correctness hinges on it. Final path = backward yellow traceback.
- **Topological sort:** layered DAG layout; per-node **in-degree badge** that decrements with a tick as an
  incoming edge is consumed; nodes reaching 0 slide into a ready-queue; emitted nodes animate down into a
  numbered **output rail**; removed nodes/edges fade grey.
- **MST (Kruskal / Prim):** **Kruskal** — sorted edge-list sidebar; candidate edge highlights; different
  Union-Find components → accept (edge cyan/thick, components merge-recolor per D-1.15); same component →
  reject (flash `error` then grey dashed + "cycle!" note). **Prim** — growing tree cyan, frontier = crossing
  edges amber, pick min crossing edge (pink flash → accept); show the cut as a shaded region. Running
  total-weight counter increments on accept.
- **Sequence/Matrix DP (LCS / edit distance / knapsack):** reuse D-1.14. LCS — header strings, match draws a
  diagonal arrow + `+1` pop, traceback collects diagonal chars into an output rail. Edit distance — show the 3
  candidate source costs (insert/delete/replace), highlight the chosen `min`, draw the winning arrow,
  traceback reconstructs labeled ops. Knapsack — current cell shows `max(skip=dp[i-1][w],
  take=value+dp[i-1][w-wt])` with both sources highlighted and the winner's arrow; traceback marks taken
  items. **Mandatory trio: dependency highlight + instantiated recurrence + traceback.**

---

## D-3. How this maps to the data contract
Every `VisualState` variant (§14.6) corresponds to one D-1 primitive and **must enumerate its element states
using only the Layer-1 tokens in D-0.2**. The build-time tracer (§15) is responsible for emitting, per step,
the element states, pointer positions, ghosts/`changedX` fields, and any companion-structure state these
choreographies require. When authoring a new problem, the author picks the primitive(s) and pattern(s) from
this Part; the renderer applies the fixed tokens and motions — so two different authors produce visually
identical, consistent results.

---

*End of PRD v1.1 — Part I (page spec) + Part II (canonical visual design system).*
