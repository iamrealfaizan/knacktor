# Compare Mode & Responsive Layout — Knacktor (D14)

> **Status:** v2.0 — Part 2 (mobile) rewritten to the shipped stacked-1a layout (pinned stage +
> scroll body + bottom sheets). Part 1 (Compare) remains the spec for the not-yet-built dual-lane view.
> **Companions:** [Design.md](Design.md) (page layout + tokens), [Rules.md](Rules.md) §1/§8 (no-scroll desktop loop), the locked prototype `4Sum Visualizer.html`.
>
> **Known discrepancy (open item, see Tracker):** §1.4 says `MODE_LAYOUT.Compare` sets
> `code:false, rail:false`, but the shipped `problem-engine.tsx` uses
> `Compare: { code: true (collapsed), rail: false (visible), narr: true }`. Resolve when the
> dual-lane Compare view is built.

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

## Part 2 — Responsive / Mobile Layout (D14, v2 — shipped)

Desktop stays the canonical **no-scroll 5-panel** layout, byte-for-byte unchanged. Below `lg` the
engine renders the **stacked-1a mobile layout**: pinned stage on top, a scrollable content column
beneath, and a pinned bottom dock. One responsive `ProblemEngine` — no separate mobile engine.

### 2.1 Breakpoint & branching
- Single Tailwind breakpoint at **`lg` (1024px)**: `≥ lg` desktop canonical, `< lg` mobile stack
  (phones AND tablets).
- `useIsDesktop()` (`matchMedia(min-width:1024px)`, SSR-defaults desktop → one accepted paint of
  the desktop layout on phones before correction) selects the structural branch inside
  `problem-engine.tsx`; everything inside components uses `lg:` / `max-lg:` classes.
- Route layout: `h-dvh lg:h-screen overflow-hidden` — `dvh` tracks mobile browser chrome so the
  pinned dock never sits under the URL bar. `app/layout.tsx` exports `viewport` with
  `viewportFit: "cover"` so `env(safe-area-inset-*)` works on notch devices.

### 2.2 Mobile structure (top → bottom; only the scroll body scrolls)
1. **Top bar** — back button (`router.back()`) · truncating title · **⋮ overflow button**. The
   overflow opens a **bottom sheet** (`MobileOverflowSheet`) containing: difficulty + topic/pattern
   badges, Problem-statement button (opens its own bottom sheet — base-ui dialogs don't nest),
   Approach selector, Strategy summary + complexity chips, Mode switcher, Theme toggle.
2. **Mode tabs** (`MobileModeTabs`) — slim Learn/Focus/Compare segmented row for one-tap switching
   (duplicates the sheet's Mode control; Compare gated by `supportsCompare`).
3. **Pinned Stage** — always visible. Fluid sizing, **no fixed pixel heights**:
   Learn/Compare `h-[clamp(11rem,30dvh,20rem)]`; Focus `flex-1` (stage fills everything between
   tabs and dock; scroll body not rendered — matches desktop Focus's stage-only semantics).
   Touch: **pointer-event pan + two-finger pinch-zoom** (`touch-none` on stage root); NO
   tap-to-play gesture — playback is dock-only.
4. **Scroll body** (`flex-1 min-h-0 overflow-y-auto overscroll-contain`), reference order:
   Narration (2×2 grid, always open — collapse chevron is desktop-only) → Variables → Result →
   Call stack → **CodePanel** (body capped `max-h-[45dvh]` with internal scroll; an always-on
   line-explanation box below the code shows the **currently executing** line — prefers
   `syntaxExplanations`, falls back to `lineExplanations`; hover tooltip is desktop-only) →
   Complexity → Notes.
5. **ControlDock** — pinned by flex (flex-none sibling, not sticky), safe-area bottom padding:
   input-example **chip** opening a bottom sheet (`PresetSheet`: presets + disabled
   "Custom input · SOON" row per D12) → scrubber (taller `h-8` touch zone, diamonds with ≥24px
   hit wrappers) → transport row (speed · first/prev/**play**/next/last · step counter;
   diamond-jump buttons and the legend/input caption are desktop-only).

### 2.3 Coexistence with desktop
- The desktop branch renders the original 3-column JSX verbatim; `codeW`/`railW` resize handles
  and collapse buttons exist only there.
- CodePanel auto-scroll uses **internal `scrollTop` math** (not `scrollIntoView`) so line-tracking
  never yanks the mobile page scroll (also applies on desktop — same behavior, safer mechanism).
- Touch targets ≥40–44px on mobile (`h-10/h-11` with `lg:h-8` desktop sizes); `touch-manipulation`
  on all transport/tab/zoom controls.

### 2.4 Compare on mobile
Until the dual-lane Compare view (Part 1) is built, Compare on mobile renders **single-lane**
(identical to Learn; tab still gated by `supportsCompare`). When lanes land: both lane blocks
(lane header → stage → per-lane strip) stack **vertically inside the scroll body**, the shared
dock stays pinned, and the pinned-stage slot shows lane A. Side-by-side is desktop-only.

### 2.5 Reuse
One responsive engine; every panel component is shared. Mobile-only additions are thin shells:
`mobile-mode-tabs.tsx`, `mobile-overflow-sheet.tsx`, `preset-sheet.tsx` (all compose existing
shadcn/`kn-*` primitives — the InsightRail's sections are exported individually so the mobile
scroll body can reorder them).
