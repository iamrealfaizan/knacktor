"use client";

import { useEffect, useState } from "react";

/**
 * True when the user prefers reduced motion. CSS transitions inside the stage
 * are already neutralized globally (`.kn-stage-root` rule in globals.css);
 * use this hook only for JS-driven timing — stagger delays, setTimeout-based
 * choreography — which CSS cannot gate.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}
