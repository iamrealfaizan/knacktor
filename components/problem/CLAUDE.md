# components/problem/ — Renderer & Simulation Rules

> Auto-loaded when Claude works on any file in this directory.
> **Canonical authority:** [rules/SimulationRules.md](../../rules/SimulationRules.md) (Parts A/B/C) and [rules/Design.md](../../rules/Design.md).
> When in doubt, read the canonical doc and cite the section.

---

## Shared renderer primitives (D24) — ALWAYS use these, never reimplement

Everything in `components/problem/shared/` is the single source for renderer building blocks:

| Module | Provides | Replaces |
|---|---|---|
| `shared/cell-state.ts` | `cellStateStyle(state)` — THE CellState→{fill,stroke,strokeWidth,opacity,textFill,pulse,dashed} map (+ `left`/`right` wall states) | per-renderer `cellStyle`/`nodeColors`/`bucketStyle` switches |
| `shared/motion.ts` | `MOTION.flash/fade/pointer/glide/reflow/tray`, `DUR`, `EASE` | inline duration/easing literals |
| `shared/pointer-pill.tsx` | `ptrColor(name, lane)` full identity palette (i/j/lo/hi/prev/curr/next/head/tail/lp/rp/slow/fast/mid…), `<PointerPill>`, `<PointerMarker>` | per-renderer PTR_COLOR/PTR_PALETTE copies |
| `shared/ghost-trail.tsx` | `<GhostTrail>` — renders `visual.ghosts` (mandated behavior #3) | (was never rendered) |
| `shared/layout-tidy-tree.ts` | `layoutTidyTree(nodes,{leafSpan,levelGap})` — Reingold–Tilford, binary or n-ary `children` | tree/recursion duplicate layouts |
| `shared/edge-path.ts` | `edgeEndpoints`/`edgePath` boundary-offset geometry | per-renderer endpoint math |
| `shared/atoms.tsx` | `<PopIn>` (behavior #1, nested-group safe), `<StructureLabel>`, `<EmptyPlaceholder>`, `<IndexLabel>` | ad-hoc labels/placeholders |
| `shared/use-reduced-motion.ts` | hook for JS-driven timing only | — |

Animation classes live in `app/globals.css`: `kn-anim-pop-in`, `kn-anim-write-pop`, `kn-anim-cell-pulse` (0.6s), `kn-anim-ghost-fade`, `kn-anim-draw-in` (pair with `pathLength={1}`), `kn-anim-stack-push`, `kn-anim-queue-enter`, `kn-anim-key-fly`, `kn-anim-return-chip`, `kn-anim-cursor-ring`.

**Reduced motion**: inline SVG `transition`s are neutralized globally by the `.kn-stage-root` rule (stage container carries the class) — do NOT thread a hook through render paths; use `useReducedMotion()` only for `setTimeout`/stagger-delay logic.

**Stage auto-fit**: `stage.tsx` measures the camera group's `getBBox()` after mount (grow-only per step; Reset refits exactly). `getLeafViewBox()` remains only the SSR/first-paint estimate — don't tune magic numbers to fix clipping.

---

## D17 — Visualization Decision Rule (mandatory before choosing a renderer)

A **custom per-problem component** (`components/problem/custom/<slug>-visualizer.tsx`) is justified ONLY when **≥2** of these criteria apply:
1. The problem requires coordinating 2+ primitives simultaneously (e.g. array + call stack side by side)
2. The spatial layout of the visualization is itself the teaching point (not just what's shown, but *where*)
3. The animation logic cannot be expressed through the existing cellState / pointer / phase / counter DSL

In all other cases, use an existing generic renderer. Generic renderers are data-driven and add zero bundle cost per new problem. Use `auxMappings[]` (D19) to render a secondary structure alongside the primary before reaching for a custom component.

Custom components must:
- Accept `{ visual: CustomVisualState, step: Step }` props
- Be registered in `stage.tsx` via dynamic import
- Include a top-of-file comment explaining why generic rendering was insufficient
- Honor the semantic color/motion grammar from Design.md

---

## The 10 Generic Renderers

| `primitive` | Component | What it renders | Use for |
|---|---|---|---|
| `array` | `ArrayRenderer` | Row of indexed square cells with pointer lanes | Arrays, strings, two pointers, sliding window, binary search, prefix sums, Kadane |
| `bar-container` | `BarContainerRenderer` | Vertical bars with water fill between two walls | Height/area problems (container with most water, trapping rain) |
| `hashmap` | `HashMapRenderer` | Key→value bucket grid, flying key chip, highlighted entries | Hash map / set lookups (Two Sum, Group Anagrams, frequency counts) |
| `linkedList` | `LinkedListRenderer` | Split value+pointer boxes joined by arrows | Linked list traversal, reversal, cycle detection, merge |
| `tree` | `TreeRenderer` | Circles + edges, tidy-tree layout, pulsing cursor ring | Binary tree, BST, trie traversal, level-order BFS |
| `stack` | `StackRenderer` | Vertical 88×40 cells in open-top container, grows up | Valid parentheses, monotonic stack, expression evaluation |
| `queue` | `QueueRenderer` | Horizontal 48×48 cells, open both ends, front left / rear right | BFS queue, sliding window deque variants |
| `grid` | `GridRenderer` | 25–28px square cells, 1px gridlines, no rounded corners | Matrix problems — islands, shortest path, flood fill, rotate image |
| `graph` | `GraphRenderer` | Circles + weighted/directed edges, frozen layout | Graph DFS/BFS, Dijkstra, topological sort, union-find |
| `recursion` | `RecursionRenderer` | Stacked rounded frames + optional recursion tree, incremental | Any recursive algorithm, memoized DP, backtracking, merge sort |

**Unit-of-work test (D15 Gate 2):** The visual's unit of work must equal the algorithm's unit of work — the smallest thing the algorithm repeatedly *does* must be the thing the animation makes visible and central. Wrong example: drawing whole strings as cells when the algorithm compares characters column-by-column (Longest Common Prefix) — use `grid` for character-level comparison, not `array`.

---

## D19 — Multi-Structure Visualization (`auxMappings`)

When a problem needs a secondary structure alongside the primary (e.g. LinkedList + Stack during reversal), add `auxMappings[]` to `mapping.json` — **do not build a custom component** for this case.

```jsonc
"auxMappings": [
  {
    "label": "Stack",
    "primitive": "stack",
    "itemsFrom": "stack_var",
    "cellStateRules": [{ "state": "current", "when": "idx == len(stack_var)-1" }, { "state": "idle", "when": "true" }]
  }
]
```

- Each aux entry uses the same primitive-specific DSL fields as the primary
- Pipeline fields (`phaseRules`, `counters`, `keyEvents`, `readout`, `flags`) belong to the primary only — omit from aux
- Auto-layout: horizontal primary + vertical aux → side-by-side; all other combos → stacked below
- Empty aux containers always render (learner sees them waiting from step 1)
- The resulting `VisualState` is a `CombinedVisualState`: `{ type: "combined", primary: LeafVisualState, aux: LeafVisualState[] }`
- `stage.tsx` dispatches to `CombinedRenderer` which computes layout and renders each leaf

---

## The 4 Mandated Simulation Behaviors (non-negotiable — the USP)

These apply to **every** renderer, every structure, every pattern:

**1. Creation pop-in**
When code creates a new variable, structure, node, or auxiliary collection, it **visibly appears** — scale `0.3→1.0` + fade, ~300ms. A new variable chip enters the variables view rendered **empty / `∅`**, so the learner sees "a new, empty variable now exists." Empty containers render their outline first, then fill.

**2. Population / change flash**
When a variable or cell receives or changes a value, it **flashes** (`changed` color, 120–180ms) and fills with the new value. Driven by `Step.changedVars` / `cellStates`.

**3. Smooth movement**
When any value or pointer relocates (array→result, node→stack, child→parent, key→bucket), it **glides along a visible path** with a fading ghost trail. **Never teleport.** Driven by `visual.ghosts` / pointer / `changedLinks` fields.

**4. Path-tracing**
When an algorithm traverses or searches, the **covered path is drawn progressively**: a `current` cursor glides node→node/cell→cell along edges (~400ms/hop), each visited edge/cell stays lit (`visited`), and reconstructed answers trace **backward** in `path` gold. (Tree search: cursor ring slides root→target and the route stays highlighted; BFS: expanding wavefront; DP/grid: backward traceback.)

---

## CellState Vocabulary — the ONLY allowed `state` values

`idle` · `current` · `compared` · `frontier` · `visited` · `result` · `path` · `special` · `error` · `dimmed` · `left` · `right`

(`left`/`right` style the two walls blue/amber in `bar-container` only.)

**Semantic meanings (fixed across ALL structures and patterns):**
| State | Meaning | Stroke/accent | Fill tint |
|---|---|---|---|
| `idle` | resting / default | `--border` 1.5px | `--surface` |
| `current` | the ONE element processed this step (+ halo ring) | vermillion `#C2603F` 2.5px | warm `#FBEFD3` |
| `compared` | read/compared this step | blue `#2E72C4` 2.5px | pale blue |
| `frontier` / `candidate` | discovered, not yet processed | amber `#E0A82E` 2px | `#FBEFD3` |
| `visited` / `done` | already processed (kept on screen) | desaturated blue/teal 2px | pale |
| `result` / `found` / `sorted` | final / correct | green `#2F9E73` 2.5px | pale green |
| `path` | reconstructed answer path | gold `#C28A1E` 2.5px | `#FBEFD3` |
| `special` / `pivot` | distinguished role | purple `#8A5CC2` 2.5px | pale purple |
| `error` / `rejected` | failed / pruned | deep-red `#A6371F` 2.5px dashed | pale red |
| `dimmed` | excluded search space (NOT deleted) | `opacity .45`, grey | — |

**Hard color rules:**
- Cells own Layer-1 (state fill/stroke). Pointers own Layer-2 in gutters. **Never recolor a cell to indicate a pointer.**
- **Never rely on hue alone** — always add a second channel (border weight, glyph, label, or motion).
- **≤ 6 simultaneous semantic colors** on screen at once.
- **Exactly one `current`** (vermillion + halo) at any time — the eye always knows the focus.

---

## Pointer Identity (Layer 2 — gutters only, never cell fill)

Each named pointer keeps **one fixed hue for the entire run**:
- `i` / `lo` / `left` / `slow` → blue `#2E72C4`
- `j` / `hi` / `right` / `fast` → amber/orange `#C28A1E`
- `mid` → purple `#8A5CC2`
- Additional pointers → cycle a stable categorical ramp

`varColors` token keys (use these in `mapping.json`, never hex):
`ptr-i` · `ptr-j` · `ptr-lo` · `ptr-hi` · `special` · `result` · `amber` · `compared` · `current` · `error` · `gold`

---

## Design Tokens (exact — match the prototype)

### Typography
| Use | Font | Weights |
|---|---|---|
| UI / labels / narration | **Inter** | 400 / 500 / 600 / 700 |
| Code panel, values, counters, indices | **JetBrains Mono** | 400 / 500 / 700, tabular numerals |

### Surfaces & ink
| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F4F1EA` | `#19180F` |
| `--surface` | `#FFFFFF` | `#211F19` |
| `--surface-2` | `#FAF8F2` | `#26241D` |
| `--surface-stage` | `#F7F4ED` | `#1C1B14` |
| `--border` | `#E4DFD3` | `#34302A` |
| `--border-strong` | `#D8D2C4` | `#403B33` |
| `--ink` | `#211F1B` | `#DBD5C7` |
| `--ink-2` | `#565147` | `#A39C8C` |
| `--ink-muted` | `#8E887A` | `#9A9384` |

### Sizing (modern-LeetCode defaults)
| Element | Size | Gap | Radius | Border |
|---|---|---|---|---|
| Array/string cell | 48×48 (min 32 when n large) | 8px | 6px | 1.5px |
| Index label | 11px JetBrains Mono, `--ink-muted`, below cell | — | — | — |
| Value text | 16–18px, 600, tabular | — | — | — |
| Linked-list node | 84×48 (108 doubly): value box + pointer box | 40px | 8px | 1.5px |
| Stack cell | 88×40 | 4px | 6px | container 2px |
| Queue cell | 48×48 | 4px | 6px | — |
| Hash bucket (M=7–13) | 56×40, vertical column | 4px | 6px | 1.5px |
| Tree/graph node | circle r=20–22 (trie r=14–16) | level gap 70–80px | — | 2px |
| Recursion frame | rounded rect ~120×40 | 4px | 8px | 2px |
| Grid/matrix cell | 25–28px (DP cell 44–56px) | 1px gridline | 0 grid / 6 DP | 1px |

### Motion grammar (all scaled by global playback-speed multiplier)
| Transition | Duration | Easing |
|---|---|---|
| Flash / recolor | 120–180ms | linear/ease |
| Pointer hop (2px arc) | 200–300ms | ease-in-out |
| Element glide / swap (arc) | 300–450ms | spring `cubic-bezier(.34,1.2,.4,1)` |
| Enter (appear/settle) | 250–350ms | ease-out `cubic-bezier(.16,1,.3,1)` |
| Exit | 250–300ms | ease-in |
| Large reflow / rehash / merge | 500–700ms | ease-in-out |
| Confirm pulse (found/locked) | ~600ms | keyframe pulse |
| BFS level stagger | ≥30ms between levels | — |

Rules: one conceptual change per step; nothing exceeds ~700ms in autoplay; stagger siblings 30–50ms;
every transition is **interruptible** — seeking/stepping mid-transition cancels and snaps to the target step (no queue buildup). Respect `prefers-reduced-motion`: replace glides with crossfade/snap; keep state colors (they carry meaning).

---

## Visual Distinguishability — each structure has a distinct silhouette

- **Array / String** → row of **square cells**, index label below
- **Linked List** → **split rounded rects** (value box + pointer box) with arrows
- **Stack** → **vertical container**, open top, grows up
- **Queue / Deque** → **horizontal lane**, open both ends
- **Hash Map / Set** → numbered **vertical bucket columns** + flying key chip
- **Heap / PQ** → **tree on top + array strip below**, synced
- **Tree / BST / Trie** → **circles + edges** (tidy-tree layout); trie chars ride edges, not nodes
- **Graph** → **circles + edges**, frozen layout (never animate node positions during an algorithm)
- **Grid / Matrix** → **tiled squares**, no rounded corners, 1px gridlines
- **DP Table** → **square table** with header row/col
- **Recursion / Call Stack** → **stacked rounded frames** built incrementally

---

## Per-Structure Key Rules (from SimulationRules.md Parts B)

### B-1. Arrays
- Fixed origin x so cells never reflow horizontally. >24 elements → shrink to 32px before wrapping; **never wrap a 1D array mid-algorithm**.
- Read → border flash `compared` 150ms; write → scale-pop `1.0→1.08→1.0` (180ms) + green flash.
- Range/subarray = a rounded translucent "tray" rect *behind* cells (4px pad, radius 10px) whose `x`/`width` animate — never recolor every cell.
- Don't put index inside the cell. Don't mark a range by fill alone.

### B-3. Hash Map / Hash Set
- **The hash arc is the hero**: key chip pulses → show `h("key") = i mod M` → key chip **flies along an arc** from input to bucket (400ms).
- Insert collision (chaining) = append node with arrow draw. Insert collision (probing) = step slot→slot (each flashes `compared` ~200ms, staggered).
- Lookup hit = green pulse; miss = red shake. ALWAYS animate the key→bucket arc and show the modulo math.

### B-4. Linked List
- **Re-link animation (ordered, the crux):** (1) fade old arrow to 30% dashed; (2) new node enters from above (translateY −40→0 + fade, 300ms); (3) **draw new arrow** via `stroke-dashoffset` (250ms); (4) snap old arrow out.
- Delete: redraw bypass arrow first, *then* drop+fade the node, *then* reflow.
- Null = slashed `∅` / grey "null" pill in the pointer box. Arrows originate from the pointer field, not node center.
- `changedLinks` with `to:"-1"` (link cleared) renders nothing by default — correct but explicit null-terminator indicator on the pointer box is better.

### B-5. Stack
- Grows **upward** only; all motion happens at the top.
- Push = new cell enters from above (translateY −48→0 + fade, 280ms) with 2px overshoot bounce.
- Pop = TOS flashes `current`, lifts + fades (250ms), container height tweens down.

### B-6. Queue
- Front left, rear right. Enqueue = cell slides in from right (translateX +40→0 + fade, 280ms). Dequeue = front flashes, slides out left + fades, remaining cells glide left one slot (30ms stagger, 300ms).

### B-7. Heap / Priority Queue
- **Two synced views**: tree on top + array strip below. Every op highlights the corresponding tree node AND array cell simultaneously; faint connectors tie cell i ↔ its node.
- Sift-up/down = **both** views animate at once. Never animate only one view; never skip the "choose larger/smaller child" beat.

### B-8. Trees (Binary / BST)
- **Reingold–Tilford tidy-tree layout** — never naive halving. Null children = dashed `∅` stub.
- Cursor ring glides root→target (~400ms/hop, 250ms pause to show `32<50 → left`); visited edges stay lit.
- Rotation (3 beats ~900ms): highlight pivot+child edge `changed` → rotate subtree as rigid group → re-layout glide. **Never teleport on rotation/insert.**

### B-9. Trie
- Characters ride on the **edge** (chip at edge midpoint), **not** in the node — nodes are junctions. Root labeled "•".
- End-of-word = filled inner `result` dot / doubled ring. Always surface prefix-vs-word distinction.

### B-10. Graphs
- **Layout = compute once, FREEZE.** Never leave a force-directed simulation running during playback.
- Edge traversal = `stroke-dashoffset` draw (300ms). Relax = flash + distance-label tween.
- Directed arrowhead = SVG marker at node *boundary* (back off r px). Weight = small white chip nudged 10px perpendicular (always show the number; thickness is only secondary).

### B-11. 2D Grid
- No rounded corners; must tile. Start/end carry a **glyph** (▶ / ◎) in addition to color.
- Visited wavefront: stagger by **BFS level** (level d+1 begins ≥30ms after d) → expanding diamond ripple.
- Traceback: animate path **backward** end→start, one cell per ~40ms, popping to `path` gold.

### B-12. DP Table
- **Mandatory trio per cell**: flash the source cells it reads (`compared`) + draw thin arrows from each into the current cell + show the instantiated recurrence in a side panel. Never fill without dependency arrows; never show all arrows at once.
- Traceback: ring answer cell, follow stored arrows **backward** in `path` gold.

### B-13. Recursion Tree
- Built **incrementally** (DFS, left→right) — the tree *unfolds*; never pre-draw the whole tree.
- Return: box flashes `result`, **return-value chip slides up the edge** to the parent's pending slot (~400ms). Show returns *moving*.

### B-14. Call Stack
- Newest on top. **Synchronized with the recursion tree via one timeline** — step forward pushes a frame *and* branches the tree.
- Push: frame slides in from top with spring (~350ms). Pop: top flashes its return value, slides up + fades; frame beneath brightens and its pending local receives the value (flash).

---

## Per-Pattern Key Choreography (from SimulationRules.md Part C)

### C-1. Array patterns
- **Two Pointers (converging):** `lo`(blue)/`hi`(amber) below array; **excluded outer region dims to `dimmed`** as they march inward.
- **Sliding Window:** translucent amber **tray** spanning the window + live badge. Grow (right++) = tray `width` animates out, entering cell green-pops. Shrink (left++) = tray `x`+`width` animate in, leaving cell flashes `changed`→`dimmed`. Expand and contract are two beats.
- **Modified Binary Search:** `lo/hi/mid` below; **discarded half dims to `dimmed`** (bright center = live search space); `mid` glides to the new midpoint. Dim, don't delete.
- **Cyclic Sort:** each step shows `nums[i]` **flying to its correct index** (arc-glide), displaced value returning.
- **Dutch National Flag:** three regions (low/mid/high) as colored trays; each swap = arc-glide with region boundaries sliding.

### C-3. Hash Map patterns
- **Two Sum:** array + hash companion; for each `x`, animate the **lookup arc** for `target−x`; hit = both indices flash `result`, miss = insert `x` with key→bucket arc.

### C-4. Linked List patterns
- **In-place Reversal:** `prev/curr/next` pointers; each step does the ordered re-link (fade old arrow → draw reversed arrow) while pointers hop forward.
- **Fast & Slow Pointers:** two pointers move at 1× and 2× speed as **distinct beats**; on meeting, pulse both.

### C-5. Stack patterns
- **Monotonic Stack:** array + vertical stack; a violating element pops elements (staggered 120ms) with a **resolve-arc drawn from the popped index to the triggering `A[i]`** — the arc is the answer pair.
- **Histogram:** when popping, draw the candidate rectangle as a translucent `result` overlay spanning the width.

### C-6. Queue patterns
- **BFS:** explicit FIFO queue strip; frontier amber; **level wave with ≥30ms level stagger**; immutable `dist` stamped on discovery.

### C-8. Tree patterns
- **DFS (preorder/inorder/postorder):** BST layout + cursor ring + result strip that fills on visit; annotate "preorder: emit before children" as the distinguishing beat.
- **Path sum:** running sum rides a badge on the cursor; a satisfying leaf flashes `result` and root→leaf path lights gold.

### C-9. Graph patterns
- **Dijkstra:** min-heap PQ view; tentative `dist` labels **tween down** on relax; distinguish **frontier (amber) vs finalized (visited)**; final path = backward gold traceback.
- **Topological Sort (Kahn's):** per-node **in-degree badge** decrements with a tick as an incoming edge is consumed; nodes reaching 0 slide into a ready-queue; emitted nodes animate down into a numbered output rail.

### C-11. DP patterns
- Always apply the **mandatory trio**: dependency highlight + instantiated recurrence + traceback.
- 0/1 Knapsack: current cell shows `max(skip, take)` with both sources highlighted and the winner's arrow.

### C-12. Backtracking
- **Subsets/Combinations/Permutations:** decision tree + current partial solution. **Try** = element fades in `changed` + branch grows; **prune** = branch flashes `error` then collapses; **undo** = element **plucks off** (scales up → `error` dashed ghost → fades back toward parent) as branch retracts; **solution** = leaf path lights gold.

---

## Anti-Inconsistency Rules (SimulationRules.md §A-8)

1. **Animate state, not layout.** Freeze layout; only re-layout on a real structural change, then glide all elements to new tidy positions.
2. One `current` at a time (vermillion + halo).
3. **Stagger waves by discovery/level order**, never by scan/row-major order.
4. **Dim, don't delete** discarded search space (binary search, two-pointer, removed nodes ghost-out).
5. **Color + a second channel**, always; ≤6 simultaneous semantic colors.
6. **Backward traceback** for every path reconstruction (grid path, DP, shortest path, BST successor).
7. **Motion must explain** — show the "why" caption *before* the move.
8. **Companion structure panel** (queue/stack/PQ/heap) is visible and synchronized to the stage.
9. **One timeline** drives all synchronized views (recursion tree ↔ call stack; heap tree ↔ array strip).
10. **Respect `prefers-reduced-motion`**: replace glides with crossfade/snap; keep state colors.

---

## Stage Dispatch (`stage.tsx`)

`stage.tsx` dispatches on `visual.type`:
- Single primitive → dispatches directly to the matching renderer component
- `type: "combined"` → dispatches to `CombinedRenderer` which reads `visual.primary` and `visual.aux[]`
- Unknown `type` → renders a token-styled "Renderer not implemented" placeholder (loud, not an empty stage)

Custom components registered via dynamic import: `const MyVisualizer = dynamic(() => import('./custom/<slug>-visualizer'))`.

The stage SVG uses a `viewBox` with a single root `<g class="camera">` translated/scaled for auto-fit, pan, and zoom. **Never hardcode pixel positions.** Compute a layout into a coordinate map, bind elements to it, then **transition** elements to new coordinates on structural change. Draw **edges before nodes** in DOM order.

---

## Problem-Page Layout (canonical — match `rules/4Sum Visualizer.html` exactly)

- **Top bar**: problem identity · Learn/Focus/Compare mode switch · theme toggle
- **Left**: Code panel (resizable/collapsible; approach tabs; active-line highlight; hover-line explainer)
- **Center**: Stage (pannable/zoomable SVG canvas, legend chip) + **Narration pinned beneath** (2×2: what / why / line explanation / invariant; collapsible)
- **Right**: Insight rail (variables · complexity meters · data-structure state · call stack · notes), resizable/collapsible
- **Bottom**: pinned ControlDock (scrubber with amber key-event diamonds · transport · speed · step counter · input selector)

Mobile (below `lg` = 1024px): top bar → code → stage → narration → insight rail → ControlDock pinned bottom.

Compare mode: two equal columns side by side, each with lane header + Stage + per-lane strip (current-line readout + vars/result chips). No full code panels in Compare (breaks no-scroll budget). The per-lane current-line readout under each stage carries code sync. Two stages separated by a 1px `--border` divider.
