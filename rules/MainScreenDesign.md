# Direction A — "Classic Split"
### The DSA Problem Page · PRD baseline layout

> **One-line summary:** A no-scroll, three-column workspace with a pinned playback dock. Maps 1:1 to the PRD's seven regions, so it is the safest to build and explain. The center column is an **infinite, Figma-style canvas** for the animation; the left (code) and right (insight) columns are **resizable, collapsible panels**.

---

## 0. Design intent

- **No-scroll promise:** everything a learner needs is visible in one viewport at desktop ≥1080px. Nothing important lives below the fold.
- **Eyes stay center:** the animation stage is the hero; narration sits *directly beneath* it so the gaze never has to travel far between "what's moving" and "what it means."
- **Progressive density:** every side region can collapse to a thin icon rail, letting the stage expand when a structure (tree/graph) needs more room.
- **Semantic color is the language** (see §7). Grey = inert placeholder; color always means a specific algorithmic state.

---

## 1. Overall layout & grid

The frame is a single rounded "window" card. Top-to-bottom it has **three horizontal bands**:

```
┌────────────────────────────────────────────────────────────┐
│  TOP BAR  (problem identity · mode switch · theme)          │  54px, fixed
├──────────────┬───────────────────────────┬─────────────────┤
│              │                           │                 │
│  CODE PANEL  │   STAGE (canvas)          │  INSIGHT RAIL   │
│  (col 1)     │   ───────────────         │  (col 3)        │  body grid
│  resizable   │   NARRATION (under stage) │  resizable      │  height ~592px
│              │                           │                 │
├──────────────┴───────────────────────────┴─────────────────┤
│  DOCK  (scrubber · transport · speed · step)                │  pinned bottom
└────────────────────────────────────────────────────────────┘
```

- **Body** is a CSS grid: `grid-template-columns: [code] 1fr [stage] [rail]`. The code and rail columns have **draggable dividers** (the 2px black borders between columns act as resize handles). The center stage takes all remaining width and is the flex anchor.
- **Default split** ≈ code 26% / stage 46% / rail 28%. These are starting widths, not fixed — the user drags to rebalance.
- **Min widths:** when a side panel is dragged below its minimum (or its collapse chevron is clicked) it snaps to a **~46px icon strip** (see §2.4 and §4.6).
- The frame corners are intentionally hand-drawn / irregular (lo-fi wireframe convention); production uses clean radii.

---

## 2. Region 1 — Top Bar (fixed, 54px)

Left → right:

| Element | Detail | Function |
|---|---|---|
| **Problem dot** | small accent square | status/topic marker |
| **Problem title** | "4Sum" | the active problem |
| **Difficulty pill** | "MEDIUM" | static metadata |
| **Pattern pill** | "TWO-POINTERS" | the canonical pattern tag; could link to the pattern library |
| **Hint text** | "· approach tabs moved onto the code panel →" | annotation only (wireframe note) |
| **Mode switch** *(right)* | segmented control: **Learn** / Focus / Compare | switches the whole page preset. **Learn** is the default shown here |
| **Theme toggle** *(right)* | ◑ icon button | light/dark |

**Mode presets** (the segmented control):
- **Learn** — all three columns + narration + dock visible (this screen).
- **Focus** — side panels auto-collapse to icon strips, stage dominates.
- **Compare** — splits the stage into race lanes (see the Race/Compare exploration).

---

## 3. Region 2 — Code Panel (left column, resizable)

A vertical stack, top to bottom:

### 3.1 Code header bar
- ● dot + **`CODE · PYTHON`** label (language is switchable in production).
- **`⧉ copy`** — copies the full source.
- **`«` collapse** button — collapses the whole panel to the icon strip (§3.4).

### 3.2 Approach tabs (directly **below** the code header bar)
Segmented tabs of available solutions for this problem:
- **Brute Force** (inactive)
- **Sort + Two Ptrs ★** (active — accent fill; ★ marks the recommended/optimal approach)
- **`APPROACH`** label, right-aligned.

Switching a tab swaps both the code body **and** the animation that plays on the stage.

### 3.3 Code body
- Line-numbered source (rendered as grey bars in the wireframe).
- **Active line highlight:** line 7 has an accent left-border + tinted background + accent-colored line number. This line **stays in sync with the scrubber** — as playback advances, the highlighted line tracks the executing statement.
- **Hover-line explainer popover** (blue dashed card): hovering any line surfaces a plain-language explanation of that line inline. Anchored to the hovered line.

### 3.4 Collapsed state (icon strip)
When collapsed, the panel becomes a ~46px vertical rail of icon buttons, each with a tiny caption:
- **`»` expand** (top)
- **`</>` CODE** (active marker)
- **`★` APPR** (approach)
- **`⧉` COPY**
- **`⌕` EXPL** (hover-line explainer, blue)

Clicking `»` restores the full panel.

---

## 4. Region 3 — Stage + Narration (center column)

This column is itself split vertically: **Stage (flex:1, grows)** on top, **Narration (fixed height)** pinned beneath it.

### 4.1 The Stage = an infinite canvas (Figma-like)
- The hatched background denotes a **pannable / zoomable canvas surface**, not a fixed frame. The learner can **scroll-zoom**, **drag-pan**, and **fit-to-view** the visualization exactly like a Figma/whiteboard canvas. Animated objects (array cells, pointers, trees, graphs) live in canvas-space so large structures can extend beyond the viewport and be navigated.
- **Top-left label:** `ANIMATION STAGE · array + two-pointers` — names the current visualization type.
- **Top-right legend chip:** a floating key — ▢ current / ▢ compared / ▢ result — pinned to the viewport (does not pan with content).

### 4.2 The visualization (current frame shown)
For 4Sum / two-pointers on a sorted array:
- A **row of value cells** (`-2 -1 0 0 1 2`) with **index labels** (0–5) beneath.
- **Cell states:** the index-3 cell is **current** (accent border + glow); the index-5 cell is **compared** (orange border).
- **Window tray:** a dashed amber rectangle spanning a sub-range, labeled **`sum = -1`** above it — the running window/sum being evaluated.
- **Pointer carets** below the row: **`i`** (pink), **`p`** (blue), **`q`** (orange) — colored triangle + pill markers that **animate along the row** as the algorithm steps.

> The exact glyphs are illustrative; the stage renders whatever structure the active problem needs (array, linked list, tree, graph, matrix…).

### 4.3 Narration (pinned under the stage)
A fixed ~158px panel, 2×2 grid of synchronized readouts that update every step:
- **▸ WHAT'S HAPPENING** (accent) — the action this step.
- **✦ WHY IT MATTERS** (green) — the reasoning/intuition.
- **‹/› LINE EXPLANATION** (blue) — what the active code line does.
- **◎ INVARIANT / GOAL** (muted) — the loop invariant or target being maintained.
- **`collapse ⌄`** button, top-right.

### 4.4 Narration collapsed state
Collapses to **two lines**:
1. A row of tab chips — **▸ What's happening** (active) · **‹/› Line** · **✦ Why** · **◎ Invariant** — plus an **`expand ⌃`** button. Only the selected tab's text shows.
2. A single-line readout of the selected tab.

This keeps narration available while giving the stage more vertical room.

### 4.5 Why narration is here
Placing narration immediately under the stage keeps the learner's eyes centered — the "what moved" and the "why" are a few pixels apart. (Trade-off noted in §8.)

---

## 5. Region 4 — Insight Rail (right column, resizable)

A scannable stack of live state widgets. Header: **`INSIGHT RAIL`** + **`collapse »`** button. Sections, top to bottom:

### 5.1 Variables · "flash on change"
Chips for each live variable: `i 0`, `j 1`, `p 3`, `q 5`, `sum -1`. Each chip is color-bordered to match its pointer on the stage (p=blue, q=orange, i=pink, sum=accent). A chip **flashes** when its value changes on the current step.

### 5.2 Complexity · "live ops vs budget"
Two horizontal meters comparing actual operations to the asymptotic budget:
- **comparisons** — `14 / n³`, ~34% bar (accent).
- **pointer moves** — `9 / n²`, ~21% bar (green).
These count up live as playback runs, making Big-O tangible.

### 5.3 Data structure · result set
Chips showing the structure being built — here the answer set: `[-1,0,0,1]` (green = result) plus a dashed `…` placeholder for pending entries.

### 5.4 Call stack
Collapsed row: `CALL STACK · auto-hidden · iterative approach` with a `›` expander. Auto-hides for iterative solutions; expands to show frames for recursive ones.

### 5.5 Notes · local
A ruled-paper text area for the learner's own notes, scoped to this problem.

### 5.6 Collapsed state (icon strip)
Becomes a ~46px icon rail: **`«` expand**, then **VARS** (accent, with change-dot), **CPLX** (bar-chart glyph), **DATA** (`{ }`), **STACK**, **NOTES** — each a button that expands the rail back to that section.

---

## 6. Region 5 — Dock (pinned bottom, full width)

Always visible. Vertical stack:

### 6.1 Scrubber (top of dock)
- Full-width track (grey) with an accent **progress fill** (~44%).
- A circular **playhead** handle (draggable to seek).
- **Amber diamond keyframe markers** at notable steps — these are **"jump to key events"** anchors (swaps · matches · answers appended). Clicking a diamond jumps the playhead there.

### 6.2 Transport row (below scrubber)
Left → right:
- **Input selector:** `Example 1 — has duplicates ▾` dropdown + **`＋ custom input`** link (run the visualization on your own data).
- **Transport cluster** (centered): `⏮` first step · `◀` step back · **`▶` play/pause** (large accent button) · `▶` step forward · `⏭` last step.
- **Speed control:** `1.0× ▾` dropdown.
- **Step counter:** `Step 12 / 27`.

### 6.3 Legend line
`◆ jump to key events — swaps · matches · answers appended` — explains the amber diamonds.

---

## 7. Color & state semantics (the visual language)

| Color | Token | Meaning |
|---|---|---|
| Violet / accent | `--accent #7C3AED` | **current** element · active code line · primary actions |
| Blue | `--blue #0072B2` | **compared** element · the `p` pointer · line-explanation |
| Orange | `--orange #E69F00` | secondary compared · the `q` pointer |
| Pink | `#CC79A7` | the `i` pointer |
| Green | `--green #009E73` | **result** · confirmed answers · "why it matters" |
| Amber | `--amber #FFC53D` | **key events / window** · scrubber keyframes · sum window tray |
| Grey | `--bar / --line` | **placeholder** — inert wireframe content, no semantic meaning |

Convention reminder: in the wireframe, **grey = placeholder, color = a real semantic state from the PRD palette.**

---

## 8. Resizing & responsiveness behavior

- **Side panels are independently resizable** by dragging the column dividers. The center stage absorbs the remaining space (`1fr`), so it never collapses to zero.
- Each side panel has a **collapse chevron** (`«` / `»`) and a **minimum width**; past the minimum it snaps to the **icon strip**, freeing width for the stage.
- **Narration** collapses vertically (full → 2-line → ) to trade height back to the stage.
- The **dock stays pinned** regardless of panel states.
- Because the stage is a canvas, even when its column is narrow the user can **zoom/pan** to inspect large structures rather than relying on layout width alone.

---

## 9. Known trade-off (from the design notes)

> ⚠ At ~46% width the stage can feel cramped for **trees / graphs**, and the insight rail competes for horizontal space. Mitigations: collapse the rail and/or code panel to icon strips (Focus mode), and lean on canvas **zoom/pan** for big structures.

**Why this direction:** it's the safe baseline — maps 1:1 to the PRD's 7-region IA, is the easiest to build and explain, and keeps narration glued under the stage so attention stays centered.
