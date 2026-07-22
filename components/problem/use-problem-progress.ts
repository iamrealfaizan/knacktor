"use client";

/**
 * Client hook backing the problem-page solve/bookmark controls. Keeps the
 * problem page STATIC (revalidate=3600): per-user progress is never read on the
 * server — this hook hydrates it client-side on mount via the read action, and
 * mutates optimistically through the write actions.
 *
 * Anonymous handling: a `null` first fetch can't distinguish "anon" from
 * "untouched", so we treat null as todo/not-bookmarked and only flip into
 * anon-mode (disabling further writes) once a mutation returns `{ anon: true }`.
 */
import { useCallback, useEffect, useState } from "react";
import {
  getMyProblemProgressAction,
  markSolvedAction,
  unmarkSolvedAction,
  toggleBookmarkAction,
} from "@/app/actions/progress";
import { getClientTimezone } from "@/lib/tz";
import type { ProgressStatus } from "@/lib/types";

export interface ProblemProgress {
  status: ProgressStatus;
  bookmarked: boolean;
  /** true once the initial hydration fetch has resolved */
  loaded: boolean;
  /** true once a write revealed the user is signed out (writes then disabled) */
  isAnon: boolean;
  toggleSolved: () => void;
  toggleBookmark: () => void;
}

export function useProblemProgress(problemId: string | undefined): ProblemProgress {
  const [status, setStatus] = useState<ProgressStatus>("todo");
  const [bookmarked, setBookmarked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isAnon, setIsAnon] = useState(false);

  // Hydrate once on mount (client-side, keeps the page static).
  useEffect(() => {
    if (!problemId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    getMyProblemProgressAction(problemId)
      .then((p) => {
        if (cancelled) return;
        if (p) {
          setStatus(p.status);
          setBookmarked(p.bookmarked);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [problemId]);

  const toggleSolved = useCallback(() => {
    if (!problemId || isAnon) return;
    const prev = status;
    const next: ProgressStatus = status === "solved" ? "attempted" : "solved";
    setStatus(next); // optimistic
    const run = next === "solved" ? markSolvedAction : unmarkSolvedAction;
    run(problemId, getClientTimezone())
      .then((res) => {
        if (res.ok) return;
        if (res.anon) setIsAnon(true);
        setStatus(prev); // revert on anon or error
      })
      .catch(() => setStatus(prev));
  }, [problemId, status, isAnon]);

  const toggleBookmark = useCallback(() => {
    if (!problemId || isAnon) return;
    const prev = bookmarked;
    setBookmarked(!prev); // optimistic
    toggleBookmarkAction(problemId)
      .then((res) => {
        if (res.ok) {
          setBookmarked(res.bookmarked);
          return;
        }
        if (res.anon) setIsAnon(true);
        setBookmarked(prev); // revert on anon or error
      })
      .catch(() => setBookmarked(prev));
  }, [problemId, bookmarked, isAnon]);

  return { status, bookmarked, loaded, isAnon, toggleSolved, toggleBookmark };
}
