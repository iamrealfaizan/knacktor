# Design System & UX Direction — Knacktor

> **Authority:** [`4Sum Visualizer.html`](4Sum%20Visualizer.html) is the **source of truth** for the problem page's look, feel, palette, typography, layout logic, panel behavior, and motion. Where any other doc disagrees on UI/UX, the prototype wins.
> **Simulation authority:** all simulation visuals/motion (tokens, shapes, per-structure/per-pattern choreography) are canonical in [SimulationRules.md](SimulationRules.md). This file covers **page layout/chrome**; it defers to SimulationRules for the stage.
> **Archived references (not authority):** [dsaPRD.md](dsaPRD.md) Part II (its design-system knowledge has been carried into SimulationRules and re-mapped to the prototype palette) and [MainScreenDesign.md](MainScreenDesign.md) (layout exploration "Classic Split").
> **Decision (D3):** the **prototype's warm-paper aesthetic is canonical** — match the prototype's exact hexes and fonts.

## 1. Design principles
- Visualizer-first, not article-first.
- No-scroll desktop teaching loop (code + animation + variables + complexity + controls visible at once).
- Dense but calm; ordered, never noisy.
- **Motion must explain, not decorate** (motion is core product value).
- Familiar discovery surfaces, distinctive learning surfaces.
- Exact prototype fidelity for the flagship page.

## 2. Visual identity — warm-paper palette (canonical surfaces/strokes)
The product reads as a calm, warm "paper workspace," matching the prototype.

| Token | Role | Light (prototype) | Warm-dark (prototype) |
|---|---|---|---|
| `--bg` | app background | `#F4F1EA` (warm cream) | `#19180F` |
| `--surface` | panel/card | `#FFFFFF` | `#211F19` |
| `--surface-2` | raised | `#FAF8F2` | `#26241D` |
| `--surface-stage` | stage well | `#F7F4ED` | `#1C1B14` / `#1B1A13` |
| `--border` | card/divider stroke | `#E4DFD3` | `#34302A` |
| `--border-strong` | strong divider | `#D8D2C4` | `#403B33` |
| `--ink` | primary text | `#211F1B` | `#DBD5C7` |
| `--ink-2` | secondary text | `#565147` | `#A39C8C` |
| `--ink-muted` | index labels | `#8E887A` | `#9A9384` |

Both themes are tokenized from one source. The **complete** token + state palette (incl. semantic and pointer layers) lives in the canonical [SimulationRules.md](SimulationRules.md) §A-2; this table is the page-chrome subset.

## 3. Semantic state colors (meaning from Part II, hexes from the prototype)
The **meaning** of each state is fixed (identical across every problem and primitive); the **hex** is the prototype's. Never rely on hue alone — always pair with a second channel (border weight, glyph `▶/◎/∅`, label, or motion). Keep ≤ 6 simultaneous semantic colors; exactly **one `current`** at a time.

| Semantic state (Part II name) | Meaning | Prototype hue |
|---|---|---|
| `idle` | resting/default | `--border` muted stroke |
| `current` | the one element acted on this step (+ halo) | vermillion `#C2603F` |
| `compared` | read/compared this step | blue `#2E72C4` |
| `changed` / `moving` | value/position changing mid-transition | vermillion `#C2603F` (flash) |
| `result` / `found` / `sorted` | part of the final answer | green `#2F9E73` |
| `visited` / `done` | already processed | desaturated blue/teal |
| `dimmed` / `out-of-scope` | excluded search space (not deleted) | `opacity .45`, grey |
| key event / window tray | jump markers, sliding-window shading | amber |

**Pointer identity (separate layer, lives in the gutters, never recolors a cell):** each named pointer keeps a fixed hue for the whole run — `i`=pink, `p`/left=blue `#2E72C4`, `q`/right=orange, additional pointers cycle a stable categorical ramp (per the prototype).

> Implementation note: the **canonical** semantic + pointer palette (re-mapped to these exact prototype hexes) lives in [SimulationRules.md](SimulationRules.md) §A-2, which **supersedes** dsaPRD Part II (now an archived reference). The table above is the subset needed for page chrome.

## 4. Typography (exact, recovered from the prototype)
- **UI / labels / narration:** **Inter** (weights 400 / 500 / 600 / 700) — embedded in the prototype.
- **Code panel, values, counters, indices:** **JetBrains Mono** (400 / 500 / 700), tabular numerals.
- Match the prototype's weight hierarchy exactly; line-number, badge, and chip styling align with the prototype.

## 5. Motion grammar (from Part II §D-0.4; all durations scale with the global speed multiplier)
| Transition | Duration | Easing |
|---|---|---|
| Flash / recolor | 120–180ms | linear/ease |
| Pointer hop (2px arc) | 200–300ms | ease-in-out |
| Element glide / swap (arc) | 300–450ms | spring `cubic-bezier(.34,1.2,.4,1)` |
| Enter (appear/settle) | 250–350ms | ease-out `cubic-bezier(.16,1,.3,1)` |
| Exit (leave) | 250–300ms | ease-in |
| Large reflow (re-layout) | 500–700ms | ease-in-out |

Rules: one conceptual change per step; nothing exceeds ~700ms in autoplay; stagger sibling animations 30–50ms; every transition is **interruptible** (seeking cancels and snaps to target).

## 6. The three signature motion qualities (required on every primitive)
1. **Smooth motion & morphing** — elements glide to new positions/values; pointers slide; arrows re-curve. **No instant jumps.**
2. **Ghosting / trails** — a changed value/position lingers ~200ms as a fading `changed`-colored ghost so the learner sees *what changed*.
3. **Spotlight / dim** — the `current` element is spotlighted; irrelevant elements dim.
4. (+ baseline) **Change-flash** on any variable/cell that changes; an **always-visible legend** of active state colors on the stage.

### 6.1 Simulation legibility (the USP, restated as design rules)
The **four mandated behaviors** — **creation pop-in**, **population/change flash**, **smooth movement**, and
**path-tracing** — plus all per-data-structure shapes and per-pattern choreography are **canonically defined in
[SimulationRules.md](SimulationRules.md)** (Parts A/B/C). Summary:
- **Variable birth:** a newly created variable's chip visibly enters the variables view, shown empty/`∅`.
- **Population:** the chip flashes and fills when assigned.
- **Movement:** any value moving between structures glides along a visible path (driven by `ghosts`/pointer/link changes in the [Schema.md](Schema.md) `Step`).
- **Path-tracing:** traversals/searches draw the covered path progressively (e.g. a tree search lights the route as the cursor advances).
- **Line-by-line:** every executed line gets its own step + explanation (D8).

> Per-structure/per-pattern motion is **not** specified in this file — see [SimulationRules.md](SimulationRules.md).

## 7. Problem-page layout (canonical, from prototype)
- **Top bar** (problem identity · Learn/Focus/Compare mode switch · theme toggle).
- **Left:** Code panel (resizable, collapsible to icon rail; approach tabs; active-line highlight; hover-line explainer).
- **Center:** Stage (pannable/zoomable canvas, legend chip) with **Narration pinned beneath** (2×2: what / why / line / invariant; collapsible).
- **Right:** Insight rail (variables · complexity meters · data-structure state · call stack · notes), resizable/collapsible.
- **Bottom:** pinned Dock (scrubber with amber key-event diamonds · transport · speed · step counter · input selector + custom-input entry).
- Panels resize via draggable dividers; the stage absorbs remaining width. Modes behave like the prototype, not a simplified reinterpretation.

## 8. Discovery UX
- Homepage balances curated interview-sheet surfaces with direct discovery; **search is a primary CTA**.
- Topic and pattern pages are distinct in framing and content.
- Catalog density is **medium** — practical, not bloated.

## 9. Accessibility (high bar from the start)
- Strong contrast in both themes; semantic headings/regions; keyboard-aware controls; reduced-motion alternative (replace glides with crossfade/snap, keep state colors); tooltip/overlay behavior usable by keyboard.

## 10. Implementation constraints
- `shadcn/ui` components for everything unless explicitly exempted (hard requirement).
- `lucide-react` icons for everything unless explicitly exempted (hard requirement).
- All colors are **tokens**; never inline hexes in components.
- Do not redesign the flagship page away from the prototype baseline during MVP.
