"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SPEEDS = [0.5, 1, 2] as const;
const BASE_INTERVAL_MS = 1500;

export interface Player {
  idx: number;
  playing: boolean;
  speed: number;
  total: number;
  step: number; // 1-based for display
  first: () => void;
  prev: () => void;
  next: () => void;
  last: () => void;
  togglePlay: () => void;
  seek: (i: number) => void;
  cycleSpeed: () => void;
  jumpToKey: (dir: 1 | -1) => void;
  progress: number; // 0..1
}

export function usePlayer(total: number, keyEventIndices: number[]): Player {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(total - 1, i)),
    [total]
  );

  const seek = useCallback((i: number) => { setPlaying(false); setIdx(clamp(i)); }, [clamp]);
  const first = useCallback(() => { setPlaying(false); setIdx(0); }, []);
  const last = useCallback(() => { setPlaying(false); setIdx(total - 1); }, [total]);
  const prev = useCallback(() => { setPlaying(false); setIdx((i) => clamp(i - 1)); }, [clamp]);
  const next = useCallback(() => { setPlaying(false); setIdx((i) => clamp(i + 1)); }, [clamp]);
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && idx >= total - 1) setIdx(0); // restart from start if at end
      return !p;
    });
  }, [idx, total]);

  const cycleSpeed = useCallback(() => {
    setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]);
  }, []);

  const jumpToKey = useCallback(
    (dir: 1 | -1) => {
      setPlaying(false);
      setIdx((i) => {
        const sorted = [...keyEventIndices].sort((a, b) => a - b);
        if (dir === 1) return sorted.find((k) => k > i) ?? i;
        return [...sorted].reverse().find((k) => k < i) ?? i;
      });
    },
    [keyEventIndices]
  );

  // autoplay
  useEffect(() => {
    if (!playing) return;
    if (idx >= total - 1) { setPlaying(false); return; }
    timer.current = setTimeout(() => setIdx((i) => clamp(i + 1)), BASE_INTERVAL_MS / speed);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, idx, speed, total, clamp]);

  // keyboard transport
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, prev]);

  return {
    idx,
    playing,
    speed,
    total,
    step: idx + 1,
    first,
    prev,
    next,
    last,
    togglePlay,
    seek,
    cycleSpeed,
    jumpToKey,
    progress: total > 1 ? idx / (total - 1) : 0,
  };
}
