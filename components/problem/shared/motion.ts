/**
 * THE motion grammar constants (SimulationRules §A-6 / Design.md).
 * Renderers compose transitions from these — never inline literal
 * durations/easings again, so the grammar stays consistent everywhere.
 *
 * Reduced-motion: inline SVG transitions are neutralized globally by the
 * `.kn-stage-root` rule in globals.css (CSS wins over inline transition),
 * so renderers don't need to thread a hook through every element. Use
 * `useReducedMotion()` only for JS-driven timing (stagger delays, timers).
 */

export const EASE = {
  /** springy glide/swap  */ spring: "cubic-bezier(.34,1.2,.4,1)",
  /** enter (appear/settle) */ enter: "cubic-bezier(.16,1,.3,1)",
  ease: "ease",
  inOut: "ease-in-out",
} as const;

export const DUR = {
  /** flash / recolor      */ flash: 0.18,
  /** pointer hop          */ hop: 0.28,
  /** element glide / swap */ glide: 0.35,
  /** enter                */ enter: 0.3,
  /** exit                 */ exit: 0.25,
  /** large reflow         */ reflow: 0.6,
} as const;

/** Composed `transition` strings for the common cases. */
export const MOTION = {
  /** fill/stroke recolor flash */
  flash: `fill ${DUR.flash}s ease, stroke ${DUR.flash}s ease`,
  /** opacity fade */
  fade: `opacity ${DUR.enter}s ease`,
  /** pointer pill hop between cells */
  pointer: `transform ${DUR.hop}s ${EASE.spring}`,
  /** cell/node positional glide */
  glide: `transform ${DUR.glide}s ${EASE.spring}`,
  /** larger structural reflow */
  reflow: `transform ${DUR.reflow}s ${EASE.inOut}`,
  /** tray/window resize */
  tray: `x ${DUR.glide}s ease, width ${DUR.glide}s ease`,
} as const;
