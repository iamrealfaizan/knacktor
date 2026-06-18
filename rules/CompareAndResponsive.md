# Compare Mode & Responsive Layout — Knacktor (D14)

> **Status:** v1.0 — specs for Compare mode and the mobile/responsive layout.
> **Companions:** [Design.md](Design.md) (page layout + tokens), [Rules.md](Rules.md) §1/§8 (no-scroll desktop loop), the locked prototype `4Sum Visualizer.html`.

---

## Part 1 — Compare Mode

Compare plays **two approaches' simulations side by side on the same input**, so a learner can
watch a brute-force and an optimal solution diverge in real time.

### 1.1 Lanes & players
- The active simulation generalizes to **lanes**: `laneA` (always) and `laneB` (Compare only).
  Each lane = `{ approachId, trace, inputId, traceKey }`.
- Each lane has its **own `usePlayer`** instance. Both players are instantiated **unconditionally**
  in `ProblemEngine` (hooks can't be conditional); `laneB` is simply not rendered outside Compare.

### 1.2 Default pairing
On entering Compare:
- `laneA = approaches.find(kind === "brute")` (fallback: first approach).
- `laneB = approaches.find(kind === "optimal")` (fallback: `recommendedApproachId`, else 2nd).
- Compare requires **≥2 approaches** and `problem.supportsCompare` (the top-bar button is disabled
  otherwise). Both lanes always use the **same `inputId`** (apples-to-apples).

### 1.3 Approach pickers
Each lane has a compact approach dropdown (reusing the top-bar dropdown pattern). Changing a lane's
approach re-derives that lane's trace and resets that lane's player. The approach already chosen in
the *other* lane is disabled in a picker (no comparing an approach with itself).

### 1.4 Layout (desktop, prototype-faithful, no-scroll)
- `TopBar` (full width) and a **single shared `ControlDock`** at the bottom stay.
- The body becomes **two equal columns**, each a vertical stack: lane header (approach name +
  picker + inline complexity) → `Stage` → a compact per-lane strip (current-line text readout +
  vars/result chips).
- **No full code panels** in Compare (would break the no-scroll budget) — the per-lane current-line
  readout under each stage carries the code sync. The full code & right rail are collapsed
  (`MODE_LAYOUT.Compare` already sets `code:false, rail:false`).
- Two stages separated by a `1px` `--kn-border` divider; dot-grid backgrounds preserved.

### 1.5 Playback model — Independent (default)
Two traces usually have **different lengths** (brute O(n⁴) ≫ optimal). Default playback is
**Independent**: each lane keeps its own progress, step counter, and diamonds. A shared transport
**fans out** play/pause/step/seek to both players via a `useCompareTransport(playerA, playerB)`
helper:
- `togglePlay` toggles both; `next`/`prev` step both; `seek(fraction)` maps the fraction onto each
  lane independently (`idx = round(f · (total−1))`).
- When a lane reaches its end it **freezes on its final step** while the other continues — the
  honest visualization of "brute takes longer."
- The shared scrubber shows **two progress fills** (lane A top half, lane B bottom half) and **two
  playheads**; diamonds render per lane.
- **Speed** is shared (same multiplier set on both players; each advances at the same cadence).
- **Keyboard**: in Compare both lane players set `enableKeyboard: false`; the compare transport
  owns space/arrows so keys don't double-fire.

A **Normalized** mode (single 0..1 cursor mapped onto both) is explicitly **rejected as default** —
step 5 of brute ≠ step 5 of optimal, which would break the "code/sim/narration describe the same
moment" rule within a lane. May be offered later as an opt-in toggle.

### 1.6 Data plumbing
- **First slice:** lanes derive traces **client-side** from the precomputed preset traces (or, where
  a problem has no precomputed second-approach trace, this is the documented scale path below).
- **Scale path:** the problem page preloads traces for **all** approaches when
  `problem.supportsCompare` (e.g. `getPresetTraces` per approach → `Record<approachId, Record<inputId, Trace>>`).

---

## Part 2 — Responsive / Mobile Layout (D14)

Desktop stays the canonical **no-scroll 5-panel** layout. Below `lg` the page becomes a vertical
stack with a pinned controller.

### 2.1 Breakpoint
Single Tailwind breakpoint at **`lg` (1024px)**. `≥ lg` = desktop canonical; `< lg` = mobile stack.
Layout is driven by responsive classes (SSR-clean); a `useMediaQuery('(min-width:1024px)')` flag
(defaulting to desktop for SSR) gates the desktop-only inline panel widths.

### 2.2 Mobile DOM order (top → bottom)
1. **Top bar** (condensed; mode switch may move to an overflow menu on narrow widths).
2. **Code panel** — full width, capped height, internal `cs-scroll`.
3. **Simulation window** (Stage) — full width, fixed height (e.g. `h-[40vh]`); pan/zoom via touch.
4. **Narration** — full width; the 2×2 grid stacks to 1 column on the narrowest widths.
5. **Insight rail** — full width.
6. **Controller (`ControlDock`)** — **pinned to bottom** (`sticky bottom-0 z-20`), outside the
   scrolling content column.

### 2.3 Coexistence with desktop resize
- Desktop resize handles are `hidden lg:block`; the inline `width` styles apply only `≥ lg`.
- Mobile panels are `w-full`, so `codeW`/`railW` are harmlessly ignored.
- `app/problems/[slug]/layout.tsx`'s `h-screen overflow-hidden` is relaxed so the **mobile content
  column** owns `overflow-y-auto` while the dock stays pinned. The no-scroll invariant is
  **desktop-only**.
- Panel collapse toggles default to **expanded** on mobile (collapse is a desktop space affordance).

### 2.4 Compare on mobile
`< lg`, the two Compare lanes stack **vertically** (lane A stage, then lane B stage) within the same
scroll column; the shared dock stays pinned. Side-by-side is desktop-only.

### 2.5 Reuse
Every panel component is reused unchanged across desktop and mobile — **only the wrapping
containers and ordering classes differ**. No mobile-specific component variants.
