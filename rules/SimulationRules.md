# Simulation Rules — Knacktor (Canonical)

> **Authority.** This is the **single source of truth** for *how every data structure, algorithm, and
> pattern looks and animates* in Knacktor. When authoring any problem, the rules and tokens here are
> binding. Goal: **zero inconsistency** — a color, shape, or motion always means the same thing across the
> whole catalog, so two different authors produce visually identical, consistent simulations.
>
> **Look & feel** match [`4Sum Visualizer.html`](4Sum%20Visualizer.html) (the **final** UI/UX reference) exactly.
> This document **supersedes** [dsaPRD.md](dsaPRD.md) Part II (now an archived reference): it carries that
> document's structure/motion knowledge forward, re-mapped to the prototype's exact tokens.
> Page layout lives in [Design.md](Design.md); data contracts in [Schema.md](Schema.md).

---

# PART A — Foundations (the grammar every structure obeys)

## A-0. Aesthetic in one line
A calm, **warm-paper** workspace with **modern, LeetCode-style** shapes: rounded cells and nodes, crisp
2px state-colored strokes, generous whitespace, Inter UI text and JetBrains Mono code/value text. Clean and
cinematic — never noisy.

## A-1. Stage & coordinate model
- One `<svg>` per stage with a `viewBox` and a single root `<g class="camera">` translated/scaled for
  auto-fit, pan, and zoom. **Never hardcode pixel positions on elements.** Compute a layout into a coordinate
  map, bind elements to it, then **transition** elements to new coordinates on structural change.
- **Animate the element group's `transform`**, never the shape's raw `cx/cy/x/y`; text is a child so it
  glides for free.
- Draw **edges before nodes** in DOM order (nodes paint over edges). Edges are `<path>` (not `<line>`) so
  `stroke-dashoffset` "draw-in" and curving are possible.
- After layout, fit content to ~85% of the stage; recompute + glide on every structural change.

## A-2. Design tokens (exact, recovered from the prototype)

### A-2.1 Typography
| Use | Font | Weights |
|---|---|---|
| UI / labels / narration | **Inter** | 400 / 500 / 600 / 700 |
| Code panel, values, counters, indices | **JetBrains Mono** | 400 / 500 / 700; tabular numerals |

### A-2.2 Surfaces & ink
| Token | Light | Warm-dark |
|---|---|---|
| `--bg` (app) | `#F4F1EA` | `#19180F` |
| `--surface` (card) | `#FFFFFF` | `#211F19` |
| `--surface-2` (raised) | `#FAF8F2` | `#26241D` |
| `--surface-stage` (stage well) | `#F7F4ED` | `#1C1B14` / `#1B1A13` |
| `--border` | `#E4DFD3` | `#34302A` |
| `--border-strong` | `#D8D2C4` | `#403B33` |
| `--border-soft` | `#E6E1D5` / `#E2DCCE` | `#322E27` |
| `--ink` (primary text) | `#211F1B` | `#DBD5C7` |
| `--ink-2` (secondary) | `#565147` | `#A39C8C` |
| `--ink-muted` (index labels) | `#8E887A` | `#9A9384` |

### A-2.3 Semantic state palette — **Layer 1** (owns the fill/stroke of cells, nodes, bars, table cells)
The **meaning is fixed across every structure**; the hex is the prototype's. Always pair color with a second
channel (border weight, glyph, label, or motion).

| State token | Meaning (identical everywhere) | Stroke/accent | Tint fill (light) |
|---|---|---|---|
| `idle` | resting / default | `--border` 1.5px | `--surface` |
| `current` | the ONE element processed this step (+ halo ring) | vermillion `#C2603F` 2.5px | `#FBEFD3`-warm |
| `compared` | read/compared this step | blue `#2E72C4` 2.5px | pale blue |
| `changed` / `moving` | value/position changing mid-transition | vermillion `#C2603F` (flash) | warm |
| `frontier` / `candidate` / `in-queue` | discovered, not yet processed | amber `#E0A82E` 2px | `#FBEFD3` |
| `visited` / `done` / `closed` | already processed (kept on screen) | desaturated blue/teal 2px | pale |
| `result` / `found` / `sorted` / `committed` | final / correct | green `#2F9E73` 2.5px | pale green |
| `path` | reconstructed answer path | gold `#C28A1E` 2.5px | `#FBEFD3` |
| `special` / `pivot` / `key` / `end-of-word` | distinguished role | purple `#8A5CC2` 2.5px | pale purple |
| `error` / `miss` / `rejected` / `pruned` | failed / pruned | deep-red `#A6371F` 2.5px (dashed if rejected edge) | pale red |
| `dimmed` / `out-of-scope` | excluded search space (NOT deleted) | `opacity .45`, grey | — |
| `wall` / `blocked` | impassable (grids) | dark slate | — |

### A-2.4 Pointer identity — **Layer 2** (markers in the gutters; NEVER the cell fill)
Each named pointer keeps **one fixed hue for the entire run**: `i / lo / left / slow` = blue `#2E72C4` ·
`j / hi / right / fast` = amber/orange `#C28A1E` · `mid` = purple `#8A5CC2` · additional pointers cycle a
stable categorical ramp. Layers 1 and 2 may reuse hues because they never share a plane (cells vs gutters).

### A-2.5 Hard color rules (anti-inconsistency)
- Cells own Layer-1; pointers own Layer-2 in gutters. **Never recolor a cell to indicate a pointer.**
- **Never rely on hue alone** — always add a second channel.
- **≤ 6 simultaneous semantic colors** on screen; beyond the active comparison set + the growing
  result/visited region, keep everything `idle`.
- **Exactly one `current`** (vermillion + halo) at any time, so the eye always knows the focus.

## A-3. Sizing tokens (modern-LeetCode defaults; scale down before wrapping/overflowing)
| Element | Size | Gap | Radius | Border |
|---|---|---|---|---|
| Array / string cell | 48×48 (min 32 when n large) | 8px | 6px | 1.5px |
| Index label | 11px JetBrains Mono, `--ink-muted`, **below** the cell | — | — | — |
| Value text | 16–18px, 600, tabular | — | — | — |
| Pointer caret + label pill | ~14px caret, 11–12px label | — | pill 999 | — |
| Window / range "tray" | cells + 4px pad | — | 10px | 2px dashed |
| Linked-list node | 84×48 (108 doubly): value box + pointer box | 40px | 8px | 1.5px |
| Stack cell (vertical) | 88×40 | 4px | 6px | container 2px |
| Queue cell (horizontal) | 48×48 | 4px | 6px | — |
| Hash bucket (M = 7–13) | 56×40, vertical column | 4px | 6px | 1.5px |
| Sort bar | width `clamp(4, …, 40)`, height ∝ value | `max(1,.15·w)` | 2px top | — |
| Tree / graph node | circle r = 20–22 (trie r = 14–16) | level gap 70–80px | — | 2px |
| Recursion frame / call-stack frame | rounded rect ~120×40 (stack ~full-width×64) | 4px | 8px | 2px |
| Grid / matrix cell | 25–28 (DP cell 44–56) | 1px gridline | 0 grid / 6 DP | 1px |

## A-4. Motion grammar (durations & easing; ALL scaled by the global playback-speed multiplier)
| Transition | Duration | Easing |
|---|---|---|
| Flash / recolor | 120–180ms | linear/ease |
| Pointer hop (2px arc) | 200–300ms | ease-in-out |
| Element glide / swap (arc) | 300–450ms | spring `cubic-bezier(.34,1.2,.4,1)` |
| Enter (appear/settle) | 250–350ms | ease-out `cubic-bezier(.16,1,.3,1)` |
| Exit (leave) | 250–300ms | ease-in |
| Large reflow (re-layout, rehash, merge collapse) | 500–700ms | ease-in-out |
| Confirm pulse (found/locked) | ~600ms | keyframe pulse |
| Wavefront stagger | 12–30ms/element; **≥30ms between BFS levels** | — |

Rules: **one conceptual change per step**; nothing exceeds ~700ms in autoplay; stagger siblings 30–50ms;
every transition is **interruptible** — seeking/stepping mid-transition cancels and **snaps to the target
step** (no queue buildup).

## A-5. The FOUR mandated behaviors (hard rules — the USP)
These are non-negotiable and apply to every structure and pattern.

1. **Creation pop-in.** When code creates a new variable, structure, node, or auxiliary collection, it
   **visibly appears** — scale `0.3→1.0` + fade, ~300ms. A new **variable chip enters the variables view
   rendered empty / `∅`**, so the learner sees "a new, empty variable now exists." Empty containers render
   their outline first, then fill.
2. **Population / change.** When a variable or cell receives/changes a value, it **flashes** (`changed`
   color, 120–180ms) and fills with the new value. Driven by `Step.changedVars` / `cellStates`.
3. **Smooth movement.** When any value or pointer relocates (array→result, node→stack, child→parent, key→
   bucket), it **glides along a visible path** with a fading ghost trail. **Never teleport.** Driven by
   `visual.ghosts` / pointer / `changedLinks` fields ([Schema.md](Schema.md)).
4. **Path-tracing.** When an algorithm traverses or searches, the **covered path is drawn progressively**:
   a `current` cursor glides node→node/cell→cell along edges (~400ms/hop), each visited edge/cell stays lit
   (`visited`), and reconstructed answers trace **backward** in `path` gold. (E.g. tree search: the cursor
   ring slides root→target and the route remains highlighted; BFS: an expanding wavefront; DP/grid: backward
   traceback.)

Plus baseline: **change-flash** on every changed element, and an **always-visible legend** of the active
state colors on the stage.

## A-6. Line-by-line code walkthrough (every executed line — D8)
- **Every executed source line emits one step** with the active line highlighted in the code panel
  (accent left-border + tint + accent line number, auto-scrolled into view) and a **plain-language line
  explanation** in the narration ("LINE EXPLANATION" readout).
- **Loops re-emit:** each iteration of a line produces its own step, so the learner watches the line run
  repeatedly with the variables changing.
- Trivial lines (e.g. simple returns, `pass`) still get a step but a terse explanation; **key events** (swap,
  match, push/pop, recursion return, answer appended) are additionally flagged with **amber diamond markers**
  on the scrubber for jump-to-key-event navigation.
- The highlighted line, the animation, and all four narration readouts (**what's happening · why it matters ·
  line explanation · invariant/goal**) always describe the **same** step.

## A-7. Visual distinguishability (learners identify a structure at a glance)
Each family has a **distinct silhouette** — never reuse another family's shape:
- **Array / String** → row of **square** cells, index below.
- **Linked List** → **split rounded rects** (value box + pointer box) joined by arrows.
- **Stack** → **vertical container**, open top, grows up.
- **Queue / Deque** → **horizontal lane**, open both ends.
- **Hash Map / Set** → numbered **vertical bucket column** + flying key chip.
- **Heap / PQ** → **tree on top + array strip below**, synced.
- **Tree / BST / Trie** → **circles + edges** (tidy-tree layout); trie labels ride the edges.
- **Graph** → **circles + edges** with a frozen layout (circular / layered / grid).
- **Grid / Matrix** → **tiled squares**, no rounded corners.
- **DP Table** → **square table** with header row/col.
- **Recursion / Call Stack** → **stacked rounded frames** / incremental tree.

## A-8. Cross-cutting rules (the anti-hallucination contract)
1. **Animate state, not layout.** Freeze layout; only re-layout on a real structural change, then glide all
   elements to new tidy positions.
2. One `current` at a time (vermillion + halo).
3. **Stagger waves by discovery/level order**, never by scan/row-major order.
4. **Dim, don't delete** discarded search space (binary search, two-pointer, removed nodes ghost-out).
5. **Color + a second channel**, always; ≤6 simultaneous semantic colors.
6. **Backward traceback** for every path reconstruction (grid path, DP, shortest path, BST successor).
7. **Motion must explain** — show the "why" caption (e.g. `sum -1 < target 0 → p++`) *before* the move.
8. **Companion structure panel** (queue/stack/PQ/heap/adjacency) is visible and synchronized to the stage.
9. **One timeline** drives all synchronized views (recursion tree ↔ call stack; heap tree ↔ array).
10. **Respect `prefers-reduced-motion`:** replace glides with crossfade/snap; keep state colors (they carry
    meaning).

---

# PART B — Data structures (all families, LeetCode wording)

> For each: **shape/appearance** (modern-LeetCode) → **states used** (Layer-1 tokens) → **create / insert /
> remove + movement animation** → **pitfalls**. All obey Part A (esp. A-5 four behaviors, A-6 line-stepping).

## B-1. Arrays
- **Shape:** row of 48×48 square cells, value centered (JetBrains Mono 16–18px), **index 11px muted below**.
  >24 elements → shrink to 32px before wrapping; **never wrap a 1D array mid-algorithm** (pointer geometry
  needs a stable row). Fixed origin x so cells never reflow horizontally.
- **States:** `idle`, `compared`, `current`, `result/sorted`, `dimmed` (excluded ranges).
- **Animation:** read → border flash `compared` 150ms; write → scale-pop `1.0→1.08→1.0` (180ms) + green
  flash. **Range/subarray** = a rounded translucent "tray" rect *behind* the cells (4px pad, radius 10px)
  whose `x`/`width` animate to grow/shrink — never recolor every cell; optional `[ ]` bracket caps.
  Array **creation** = cells pop in left→right (A-5.1).
- **Pitfalls:** don't put index inside the cell; don't reflow the row on a single change; don't mark a range
  by fill alone.

## B-2. Strings
- **Shape:** identical to arrays (cell per character); char value centered, index below. Substrings use the
  array tray. Pattern-matching shows **text row** + a sliding **pattern row** beneath, aligned per shift.
- **States:** `compared` (chars being matched), `current`, `result` (match), `error` (mismatch), `dimmed`.
- **Animation:** char compare → both flash `compared`; mismatch → `error` shake (3px, 200ms); on match
  advance, the pattern row **glides** to the next alignment (A-5.3). Frequency/anagram views spawn a small
  count companion (see B-3).
- **Pitfalls:** keep characters in cells (not floating); always show the pattern's shift as motion.

## B-3. Hash Map / Hash Set
- **Shape:** input **key chip** (`special` purple) on the left; a **vertical bucket array** of M numbered
  slots (M = 7–13). Set = single chips; map = `key : value` mini-rows. Separate chaining = each bucket grows
  a horizontal mini linked-list (reuse B-4 at ~70%); open addressing = flat array with probing.
- **States:** `special` key, `current` target bucket, `compared` probed/chain slots, `result` hit,
  `error` miss, `dimmed` probed-empty.
- **Animation — the hash is the hero:** (1) key chip pulses; show `h("cat") = 7 mod M = i` counting out;
  (2) key chip **flies along an arc** from input to bucket i (400ms) — the arc *is* the mapping (A-5.3);
  (3) insert empty = drop + green pop; **collision (chaining)** = append node with B-4 arrow-draw;
  **collision (probing)** = step slot→slot (each flashes `compared` ~200ms, staggered) to first empty;
  (4) lookup = same arc, walk chain/probe, end on green `found` pulse or red `miss` **shake**.
- **Pitfalls:** ALWAYS animate the key→bucket arc and show the modulo math; distinguish hit/miss by motion
  (pulse vs shake), not color alone.

## B-4. Linked List (singly / doubly / circular)
- **Shape:** rounded rect split into **value box + next-pointer box** (~84×48; doubly adds a prev box ~108px),
  with a filled dot at the pointer origin. Horizontal chain, 40px gaps. `head`/`tail` pills above. Circular:
  route tail→head as a curved path *under* the row.
- **States:** node `idle/current/compared/result`; pointers `prev/curr/next` (Layer-2).
- **Re-link animation (ordered, the crux):** (1) fade old arrow to 30% dashed; (2) new node enters from above
  (translateY −40→0 + fade, 300ms; A-5.1); (3) **draw new arrow** via `stroke-dashoffset` (250ms; A-5.3);
  (4) snap old arrow out. **Delete:** redraw bypass arrow first, *then* drop+fade the node, *then* reflow to
  close the gap (400ms). **Null** = a slashed `∅` / grey "null" pill in the pointer box.
- **Pitfalls:** don't reflow before rewiring; arrows originate from the pointer field, not node center.

## B-5. Stack (LIFO)
- **Shape:** vertical cells (88×40) in an **open-top container with a solid base, growing upward**; top = TOS;
  `top →` pill right of the top cell.
- **Animation:** **push** = new cell enters from above (translateY −48→0 + fade, 280ms) with a 2px overshoot
  bounce; **pop** = TOS flashes `current`, lifts + fades (250ms), container height tweens down; if the return
  value matters, fly it to a "returned" slot (A-5.3).
- **Pitfalls:** never grow downward; all motion happens at the top.

## B-6. Queue / Deque (FIFO)
- **Shape:** horizontal cells (48×48), **open both ends, front left / rear right**; `front →` pill
  below-left, `← rear` below-right.
- **Animation:** **enqueue** = cell slides in from the right (translateX +40→0 + fade, 280ms); **dequeue** =
  front flashes, slides out left + fades, remaining cells glide left one slot (30ms stagger, 300ms);
  front/rear pills glide to their new cells. Ring buffer: show wrap as a faint modulo arc, don't reorder.
- **Pitfalls:** be unambiguous and consistent about which end is front.

## B-7. Heap / Priority Queue (min/max)
- **Shape:** **tree on top, array strip below** (complete-binary-tree positions). Array = ~44px squares with
  index labels below. Persistent formula legend (pick one indexing and keep it): `parent=⌊i/2⌋, left=2i,
  right=2i+1`.
- **Cross-view sync (the point):** every op highlights the corresponding **tree node AND array cell at once**;
  faint connectors tie cell i ↔ its node.
- **Animation:** **sift-up** = value enters at last slot/leaf; compare with parent (both `changed`); if
  violated, **swap = two simultaneous arcing glides** in the tree + slide-swap in the array (~450ms); repeat.
  **Sift-down** = at root, highlight both children, **flash the chosen child `current`** before swapping.
  Insert = append + sift-up; extract = root flashes `result`, lifts out, last element glides into root,
  sift-down.
- **Pitfalls:** never animate only one view; never skip the "choose larger/smaller child" beat.

## B-8. Trees (Binary / BST)
- **Shape:** circle r=20–22, value centered 700-weight; edges as 2px `<path>`. **Reingold–Tilford tidy-tree
  layout** (`y = depth·70–80px`; parent centered over children; resolve subtree overlap) — never naive
  halving. Auto-fit after layout. Null children = small dashed `∅` stub (toggleable) — essential for "walked
  left, hit null, insert here."
- **States:** node `idle/current/compared/result/path`; a separate **pulsing cursor ring** for traversal.
- **Animation (A-5.4 path-tracing):** the cursor ring glides root→target along edges (~400ms/hop, 250ms pause
  to show `32<50 → left`); matched node flashes `result`; visited edges stay lit. **Insert** = new node
  fades+scales in at the null slot, then the whole tree re-runs layout and **every node glides** to its tidy
  position. **Rotation (3 beats ~900ms):** highlight pivot+child edge `changed` → rotate subtree as a rigid
  group along an arc → re-layout glide + edges redraw; label it ("Right-Rotate(50)").
- **Pitfalls:** no naive-halving layout; **never teleport** on rotation/insert — the glide is the lesson.

## B-9. Trie (Prefix Tree)
- **Shape:** small circle r=14–16; **the character rides on the EDGE** (chip at edge midpoint), not in the
  node — nodes are junctions. Root labeled "•". m-ary tidy layout, children sorted alphabetically, generous
  pan/auto-fit. **End-of-word** = filled inner `result` dot / doubled ring.
- **Animation:** **insert** = walk char by char; existing edge → glide cursor down it (brief `result` flash =
  shared prefix); missing edge → draw new edge (`stroke-dashoffset` 200ms) + fade-in node + re-layout; final
  char → pop in end-of-word dot. **Search** = same walk; full hit = `result` pulse (verify end-of-word dot,
  else `changed` "prefix only"); miss = `error` at first absent edge.
- **Pitfalls:** don't put characters in nodes; always surface prefix-vs-word distinction.

## B-10. Graphs (directed/undirected, weighted/unweighted)
- **Shape:** circle r=18–22, white fill, 2px state stroke, centered label. Edge = 2px `<path>`; weight →
  small white chip nudged ~10px perpendicular (always show the number; thickness only a secondary cue).
  Directed arrowhead = SVG marker at the node *boundary* (back off r px). **Layout = compute once, FREEZE:**
  circular (≤12 nodes), layered/Sugiyama (DAGs), grid-snap (lattices). If force-directed, run to convergence
  offline then freeze — **never leave a simulation running during playback.**
- **States:** node `idle/frontier/current/visited/path`; edge idle (muted) / tree-edge (blue, thicker) /
  relaxing (`changed` flash) / path (gold) / rejected (grey dashed).
- **Animation:** discovery = scale-pop `0.3→1.2→1` (400ms) + color; edge traversal = `stroke-dashoffset`
  draw (300ms; A-5.4); relax = flash + distance-label tween. **Never animate node positions during an
  algorithm — only state.**
- **Pitfalls:** no live force jitter; arrowheads must not hide under circles; weights readable.

## B-11. 2D Grid / Matrix
- **Shape:** 25–28px square cells, 1px gridlines, **no rounded corners** (must tile). Start/end carry a
  **glyph** (▶ / ◎) in addition to color. Board ≤ ~50×25 visible. Keep a 1px inner stroke so gridlines
  survive fills.
- **Animation:** **visited wavefront** — stagger newly-visited cells **by BFS level** (level d+1 begins
  ≥30ms after d) → the iconic expanding diamond ripple; per cell scale-pop + settle to `visited`.
  **Traceback** = animate the path **backward** end→start, one cell per ~40ms, popping to `path` gold (A-5.4).
- **Pitfalls:** wavefront not too fast; order by discovery distance, not row/col; traceback goes backward.

## B-12. DP Table (1D / 2D)
- **Shape:** 44–56px square cells; header row/col for indices and (sequence DP) the characters. 1D = a single
  labeled row. Fill in **true recurrence order**; current cell `current` vermillion.
- **Animation (the mandatory trio):** when computing `dp[i][j]`, **flash the source cells it reads**
  (`[i-1][j]`, `[i][j-1]`, `[i-1][j-1]`) `compared` and **draw thin arrows** from each into the current cell;
  show the **instantiated recurrence** in a side panel (`dp[3][4] = 1 + dp[2][3] = 3`). Only show the current
  cell's dependencies (fade others). **Answer + traceback** = ring the answer cell, follow stored arrows
  **backward** in `path` gold (A-5.4).
- **Pitfalls:** never fill without dependency arrows; never show all arrows at once; size for 2–3 digits.

## B-13. Recursion Tree
- **Shape:** rounded rect ~120×40 (two-line: `fib(5)` then `→ 5` on return). Top-down tidy tree, **built
  incrementally** (DFS, left→right) so it *unfolds* (A-5.1).
- **States:** `current` (executing), on-stack border, `result` (returned, value filled), `special` (memo hit),
  base case = solid `result` leaf.
- **Animation:** **call** = parent spawns a child that fades + slides down a drawn edge (~350ms); child
  becomes `current`. **Return** = box flashes `result`, **return-value chip slides up the edge** to the
  parent's pending slot (~400ms; A-5.3); deep returned subtrees may dim/collapse.
- **Pitfalls:** don't pre-draw the whole tree; show returns *moving*; auto-collapse exponential trees.

## B-14. Call Stack
- **Shape:** full-width rounded rect ~64px tall, **newest on top**; function+args header + locals as
  `key→value` chips. Top frame distinct (brighter, slight scale, halo); lower frames dim to .6.
- **Animation:** **push (call)** = frame slides in from top with a spring (~350ms; A-5.1), header flashes;
  old top dims. **Pop (return)** = top flashes its return value, slides up + fades (~300ms); the frame beneath
  brightens and its pending local **receives the value** (flash). **Synchronized with the recursion tree
  (B-13) via one timeline** — step forward pushes a frame *and* branches the tree; step back pops *and*
  collapses.
- **Pitfalls:** never let frames appear/vanish without motion; truncate long locals; cap visible frames with
  a "…N more" collapse.

## B-15. Union-Find / Disjoint Set
- **Shape:** **two synced views** — a parent-pointer **forest** (arrows child→parent, roots ringed) + **set
  membership by color** (one categorical hue per component). Roots horizontally separated.
- **Animation:** **find** = trace node→root flashing each path node `current` (A-5.4); **union** = highlight
  both roots; the smaller/lower-rank root's new parent edge **draws in** to the other root; then **both
  components recolor to one shared hue** (400ms blend). **Path compression** = traversed nodes' parent edges
  **re-point straight to the root** (each endpoint slides old-parent→root, ~300ms).
- **Pitfalls:** recolor *both* sets on union; animate the re-pointing (don't compress silently).

## B-16. Adjacency companion views (matrix / list)
- **Matrix** = n×n grid (DP-cell styling ~36px); `[i][j]` filled = edge/weight; **highlight `[i][j]` when
  edge (i,j) is examined**. **List** = each vertex = a row bucket with a horizontal chain of neighbor chips
  (→ connectors); highlight the chip being scanned. **Cross-highlight:** selecting a node in the graph lights
  its matrix row and list bucket and vice versa. Keep this tri-view sync available for all graph problems.

---

# PART C — Pattern choreography (LeetCode wording)

> Each pattern reuses Part B structures; this fixes **the motion that teaches the pattern**. Patterns marked
> ★ are the LeetCode-meta "must-know" set. All obey Part A (four behaviors, line-stepping). Always caption
> the *why* before the move (A-8.7).

## C-1. Array patterns
- **★ Two Pointers (converging):** array + `lo`(blue)/`hi`(amber) below; the **excluded outer region dims to
  `dimmed`** as they march inward (the bright center *is* the live search space). Flash compared cells; match
  → `result`.
- **★ Two Pointers / Fast & Slow (same-direction):** `slow`/`fast` as **two distinct beats** so the speed gap
  is felt; the covered span wears the window tray.
- **★ Sliding Window:** translucent amber **tray** spanning the window + a live badge above (`sum=23`,
  `len=4`). **Grow (right++)** = tray `width` animates out, entering cell green-pops in; **shrink (left++)** =
  tray `x`+`width` animate in, leaving cell flashes `changed`→`dimmed`. Expand and contract are two beats.
- **Prefix Sum:** two index-aligned rows (`A`, `P`); fly ghosts of `A[i]` and `P[i-1]` into `P[i]` (A-5.3);
  a range query lights `P[r]` & `P[l-1]` with a subtraction badge.
- **Kadane's (max subarray):** array + `current`/`best` badges that tween; reset cut-mark when the running
  sum drops below 0; green marker under the best index.
- **Dutch National Flag:** three regions (low/mid/high) as colored trays; `lo/mid/hi` pointers; each swap =
  arc-glide (B-1) with the region boundaries sliding.
- **★ Cyclic Sort:** each step shows `nums[i]` **flying to its correct index** (arc-glide), the displaced
  value returning — the "everything finds its home" motion.
- **★ Merge Intervals:** intervals as horizontal bars on a number line; sort (bars glide to order); sweep
  left→right, overlapping bars **merge** by extending one bar's width and fading the absorbed one.
- **★ Modified Binary Search (incl. rotated):** `lo/hi/mid` below; **the discarded half dims to `dimmed`**
  while the live half stays bright — the shrinking bright band is the halving; `mid` glides to the new
  midpoint; show `mid=(lo+hi)>>1`. **Dim, don't delete.**
- **Boyer-Moore Voting:** a `candidate` chip + `count` badge; matching element ticks count up (green),
  non-match ticks down (`changed`); on zero, the candidate chip is replaced with a pop-in.

## C-2. String patterns
- **Two Pointers / Palindrome (expand around center):** a center marker; two pointers expand outward, each
  step flashing the mirrored pair `compared` → `result` (match) or `error` (stop).
- **Sliding Window (longest substring etc.):** reuse C-1 sliding window + a hash companion (B-3) for the
  char-set/last-seen map.
- **Anagram / Frequency counting:** a small **count table** companion; each scanned char increments its
  bucket (flash + fill, A-5.2); compare two tables cell-by-cell.
- **KMP / Rabin-Karp / Z-algorithm (pattern matching):** text row + sliding pattern row (B-2); on mismatch,
  the pattern **glides forward by the computed shift** (KMP: show the LPS jump as an arc; Rabin-Karp: show the
  rolling-hash value updating in a badge) — the shift distance *is* the lesson.
- **Trie-based matching:** see B-9.

## C-3. Hash Map / Set patterns
- **★ Two Sum pattern:** array + hash companion (B-3); for each `x`, animate the **lookup arc** for
  `target−x`; hit = both indices flash `result`, miss = insert `x` with the key→bucket arc.
- **Frequency counting / Detecting duplicates:** scan + bucket increments; a duplicate triggers a `result`
  (or `error`) pulse on the colliding key.
- **Grouping (group anagrams):** each item flies along an arc to its signature bucket (A-5.3); buckets grow
  as chains.
- **Subarray sum equals K (prefix + hashmap):** prefix-sum row (C-1) + hash of seen prefixes; each step shows
  the lookup of `prefix−K` as an arc.
- **Caching / Memoization:** reuse in recursion tree (B-13) — a memo hit marks the node `special` and **skips
  recursion** (no subtree grows).

## C-4. Linked List patterns
- **★ In-place Reversal (iterative/recursive):** `prev/curr/next` pointers (B-4); each step does the ordered
  re-link (fade old arrow → draw reversed arrow) while pointers hop forward; recursive variant syncs with the
  call stack (B-14).
- **★ Fast & Slow Pointers (Floyd's cycle):** two pointers move at 1× and 2× speed as **distinct beats**; on
  meeting, pulse both; if a cycle, the back-edge curves under the row and stays lit.
- **Merge two lists / K-way merge (★ K-way):** two (or K) source chains + an output chain; the smaller front
  node **glides** into the output (A-5.3); for K-way, a min-heap companion (B-7) picks the next node.
- **Dummy node technique:** the dummy renders as a faint `special` node pinned at the head so learners see the
  simplification.
- **Find middle / nth from end:** fast/slow or gap-of-n pointers, motion as above.

## C-5. Stack patterns
- **Monotonic Stack (next greater/smaller):** array + vertical stack (B-5); a violating element **pops**
  elements (staggered 120ms) with a **resolve-arc drawn from the popped index to the triggering `A[i]`** (the
  arc is the answer pair), then pushes `A[i]`.
- **Parentheses matching / valid brackets:** push opening brackets; a closing bracket flashes the matched top
  `result` then pops it (or `error` shake on mismatch).
- **Expression evaluation:** operand/operator stacks; each reduction flies operands out and a result back in.
- **Histogram (largest rectangle):** bars + stack of indices; when popping, draw the candidate rectangle as a
  translucent `result` overlay spanning the width.
- **Backtracking via call stack:** see C-12.

## C-6. Queue / Deque patterns
- **★ BFS traversal:** explicit FIFO **queue strip** (enqueue slides in right, dequeue slides out left →
  `current`); frontier amber; **level wave with ≥30ms level stagger** (A-5.4); immutable `dist` stamped on
  discovery. Works on graphs and grids (B-10/B-11).
- **Sliding Window Maximum (monotonic deque):** array + a deque companion; elements pop from the back when
  smaller (staggered), front gives the window max each step.
- **Level-order processing:** BFS with a faint band marking the current level.
- **Circular queue:** show wrap as a faint modulo arc (B-6).

## C-7. Heap / Priority Queue patterns
- **★ Top K elements:** a size-K min-heap companion (B-7); each element compared to the root → replace (sift)
  or discard (`dimmed`); the heap holds the running top-K.
- **★ Two Heaps (median in stream):** a max-heap (lower half) + min-heap (upper half) side by side; each
  insert flows to a heap then **rebalances** (a value glides across to the other heap); median read from the
  tops.
- **Scheduling problems:** PQ ordered by key; pop/push as B-7 with a timeline companion.
- **Dijkstra's shortest path:** see C-10.

## C-8. Tree (Binary / BST) patterns
- **★ DFS (preorder/inorder/postorder):** BST layout + cursor ring (B-8) + a **result strip** that fills on
  visit; the three orders differ only in **when** the node flashes `result` and drops to the strip relative
  to descending — annotate that beat ("preorder: emit before children"); show the implicit stack as a side
  column.
- **★ BFS / Level-order:** explicit horizontal queue strip (C-6); dequeue → node `result` → strip; enqueue
  children; faint band marks the current level.
- **Recursion / Divide & Conquer:** sync tree traversal with the recursion tree + call stack (B-13/B-14).
- **Lowest Common Ancestor (LCA):** two target nodes flash `special`; the path from each to the root lights;
  the deepest shared node pulses `result`.
- **BST validation / inorder property:** inorder walk emits values to the strip; a decrease triggers `error`.
- **Path sum problems:** the running sum rides a badge on the cursor; a satisfying leaf flashes `result` and
  the root→leaf path lights gold.
- **Serialize / deserialize:** serialize streams nodes to an output array (A-5.3); deserialize rebuilds the
  tree with node pop-ins (A-5.1).

## C-9. Trie patterns
- **Word search / autocomplete / prefix matching / wildcards:** see B-9; autocomplete highlights all
  descendant end-of-word nodes from the prefix node; wildcard `.` branches the cursor to **all** children
  (parallel faint cursors).
- **Bitwise trie (max XOR):** a binary (0/1-edge) trie; the query walks **preferring the opposite bit** each
  step, lighting the chosen edge — the greedy choice is the lesson.

## C-10. Graph patterns
- **★ DFS:** LIFO stack / call-stack panel; **one active deep tendril** (not a wave); on backtrack the
  returning edge dims to a finished tree edge; optional edge classification (tree=blue, back=red dashed,
  forward=blue, cross=grey) with `d/f` labels.
- **★ Topological Sort (Kahn's / DFS):** layered DAG; per-node **in-degree badge** decrements with a tick as
  an incoming edge is consumed; nodes reaching 0 slide into a ready-queue; emitted nodes animate down into a
  numbered **output rail**.
- **Union-Find / Connected components / Number of provinces:** see B-15; components recolor on union.
- **Dijkstra / Bellman-Ford / Floyd-Warshall:** min-heap PQ view (Dijkstra); tentative `dist` labels **tween
  down** on relax; edge examine = flash, and on improvement the node's parent edge re-points (old fades, new
  draws in). Distinguish **frontier (amber) vs finalized (visited)** — correctness hinges on it. Final path =
  backward gold traceback (A-5.4). Bellman-Ford = repeated edge sweeps with a round counter; Floyd-Warshall =
  the adjacency matrix (B-16) with the `k` intermediate highlighted.
- **Cycle detection / Bipartite check:** DFS coloring; a conflict edge flashes `error`.
- **★ Minimum Spanning Tree (Kruskal / Prim):** **Kruskal** — sorted edge-list sidebar; candidate edge
  highlights; different Union-Find components → accept (edge blue/thick, components merge-recolor) ; same
  component → reject (`error` then grey dashed + "cycle!"). **Prim** — growing tree blue, frontier = crossing
  edges amber, pick min crossing edge (flash → accept); show the cut as a shaded region. Running total-weight
  counter increments on accept.
- **Matrix as graph (islands, flood fill):** grid (B-11) with BFS/DFS wavefront; each island recolors to a
  distinct categorical hue.

## C-11. Dynamic Programming patterns
All DP reuses B-12 with the **mandatory trio: dependency highlight + instantiated recurrence + traceback**.
- **1D DP (Fibonacci, house robber):** single row; each cell reads its 1–2 predecessors (arrows) → fill.
- **2D DP (grid paths, edit distance):** full table; current cell reads up/left/diagonal.
- **★ 0/1 Knapsack (+ unbounded):** current cell shows `max(skip=dp[i-1][w], take=value+dp[i-1][w-wt])` with
  both sources highlighted and the winner's arrow; traceback marks taken items.
- **LCS / Longest Common Substring / edit distance:** header strings; match draws a diagonal arrow + `+1`
  pop; traceback collects diagonal chars into an output rail.
- **Longest Increasing Subsequence:** array + a `dp` length row (or a patience-sort pile companion); each
  extension lights the predecessor.
- **Matrix Chain / Interval DP:** table filled by increasing interval length; show the split point `k`
  sweeping with the two sub-interval sources highlighted.
- **DP on Trees:** the recursion tree (B-13) carries per-node dp values that bubble up on return.
- **Bitmask DP:** a bit-row companion shows the mask; set/unset bits flash as the state transitions.
- **State machine DP (stock problems):** a small state diagram (hold/sold/rest) with the active state
  highlighted and transitions drawn each step.

## C-12. Backtracking patterns
- **★ Subsets / Combinations / Permutations:** **two synced views** — a **decision tree** (B-13) + the
  current partial solution. **Try** = element fades in `changed` + a branch grows; **fail/prune** = the branch
  flashes `error` then collapses/greys; **undo (signature)** = the element **plucks off** (scales up → `error`
  dashed ghost → fades back toward the parent) as the branch retracts; **solution** = the leaf path lights
  gold.
- **N-Queens / Sudoku solver / Word search (grid):** a board/grid + the decision tree; **validate** = attacked
  row/col/diagonal (or conflicting cell) flash a translucent `error` wash; place = piece fades in; undo
  reverses visibly. Board ↔ tree always move together.
- **Constraint satisfaction:** same try/validate/prune/undo grammar.

## C-13. Greedy patterns
- **Interval scheduling:** intervals on a number line; sort by end (bars glide); each accepted interval locks
  `result`, conflicting ones grey out.
- **Jump game:** array + a `furthest-reach` marker that extends; cells beyond reach are `dimmed` until
  covered.
- **Gas station:** circular track of stations; a running tank badge; the start candidate resets on deficit.
- **Huffman coding:** a min-heap (B-7) repeatedly extracts the two smallest and **merges** them into a new
  parent node that pops into the forest (A-5.1).

## C-14. Union-Find patterns
See B-15 (connected components, cycle detection undirected, number of provinces, Kruskal's MST in C-10).

## C-15. Bit Manipulation patterns
- **Shape:** a **bit row** companion (fixed-width boxes of 0/1, MSB→LSB, index labels below).
- **XOR tricks (single number):** each input XORs into an accumulator bit-row; bits toggle with a flash; the
  surviving bits *are* the answer.
- **Bitmasking:** the mask bit-row highlights set bits; subset enumeration shows the mask counting/skipping.
- **Counting set bits / Power of two:** highlight each set bit as it's counted; `n & (n-1)` shows the lowest
  set bit clearing (one bit flips off per step).

## C-16. Math / Number Theory patterns
- **GCD / LCM (Euclid):** two value chips; each step replaces `(a, b)` with `(b, a mod b)` via a glide + a
  modulo badge until one hits 0.
- **Sieve of Eratosthenes:** number grid; each prime `p` pulses `result`, then its multiples are **struck out**
  in a stagger wave (`dimmed`/`error`).
- **Modular arithmetic / Fast exponentiation:** a running `result` badge; fast-exp shows the exponent's bits
  (C-15 bit-row) driving square/multiply steps.

---

## C-17. The must-know set (quick index)
★ patterns above, consolidated: **Two Pointers · Sliding Window · Fast & Slow Pointers · Merge Intervals ·
Cyclic Sort · In-place Reversal · BFS · DFS · Two Heaps · Subsets/Backtracking · Modified Binary Search ·
Top K · K-way Merge · Topological Sort · 0/1 Knapsack DP.** Each maps to one or more Part B structures and
inherits all Part A behaviors.

---

*End of Simulation Rules — Part A (foundations) · Part B (data structures) · Part C (pattern choreography).
This document is canonical; conform every authored problem to it.*
