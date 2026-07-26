"use client";

import { useCallback, useEffect } from "react";
import type { Player } from "./use-player";

/**
 * Independent-playback Compare transport (CompareAndResponsive.md §1.5).
 *
 * Two lane traces usually have different lengths (brute ≫ optimal). Each lane
 * keeps its OWN progress/step/diamonds via its own `usePlayer`; this hook is a
 * thin fan-out that drives both from one shared transport:
 *   - play/pause/step/first/last apply to both players
 *   - `seekFraction` maps a single 0..1 scrubber position onto each lane
 *     independently (round(f · (total−1)))
 *   - a lane that reaches its end simply freezes on its final step while the
 *     other keeps going — the honest "brute takes longer" visualization
 *   - speed is shared (both players cycle together, staying in lockstep)
 *   - keyboard (space/←/→) is owned HERE while Compare is active; both lane
 *     players are created with `enableKeyboard: false` so keys never double-fire
 */
export interface CompareTransport {
  playing: boolean;
  speed: number;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  cycleSpeed: () => void;
  /** map a 0..1 scrubber fraction onto both lanes */
  seekFraction: (f: number) => void;
}

export function useCompareTransport(a: Player, b: Player, active: boolean): CompareTransport {
  const togglePlay = useCallback(() => {
    // Pausing: stop only the lane(s) still playing (never restart a finished lane).
    // Playing: start both (usePlayer.togglePlay rewinds a lane already at its end).
    const anyPlaying = a.playing || b.playing;
    if (anyPlaying) {
      if (a.playing) a.togglePlay();
      if (b.playing) b.togglePlay();
    } else {
      a.togglePlay();
      b.togglePlay();
    }
  }, [a, b]);

  const next = useCallback(() => { a.next(); b.next(); }, [a, b]);
  const prev = useCallback(() => { a.prev(); b.prev(); }, [a, b]);
  const first = useCallback(() => { a.first(); b.first(); }, [a, b]);
  const last = useCallback(() => { a.last(); b.last(); }, [a, b]);
  const cycleSpeed = useCallback(() => { a.cycleSpeed(); b.cycleSpeed(); }, [a, b]);

  const seekFraction = useCallback(
    (f: number) => {
      const g = Math.max(0, Math.min(1, f));
      a.seek(Math.round(g * (a.total - 1)));
      b.seek(Math.round(g * (b.total - 1)));
    },
    [a, b]
  );

  // Own the keyboard while Compare is active (both lane players have keyboard off).
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, togglePlay, next, prev]);

  return {
    playing: a.playing || b.playing,
    speed: a.speed,
    togglePlay,
    next,
    prev,
    first,
    last,
    cycleSpeed,
    seekFraction,
  };
}
