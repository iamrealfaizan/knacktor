"use server";

/**
 * Server Actions for the UserProgress write path. These are the ONLY mutation
 * entry points for the `user*` collections — the /api layer stays read-only
 * (D16). Called from Client Components on the (static) problem page and the
 * (dynamic) home dashboard; each guards on the session and degrades to a benign
 * `{ ok: false, anon: true }` for anonymous users rather than throwing.
 */
import { ObjectId } from "mongodb";
import {
  getSessionUserId,
  recordAttempt,
  markSolved,
  unmarkSolved,
  toggleBookmark,
  getProblemProgress,
  getNote,
  setNote,
} from "@/lib/progress-service";
import type { ProgressStatus } from "@/lib/types";

const NOTE_MAX = 20_000;

export type ActionResult =
  | { ok: true }
  | { ok: false; anon?: boolean; error?: string };

const ANON: ActionResult = { ok: false, anon: true };

function validId(id: unknown): id is string {
  return typeof id === "string" && ObjectId.isValid(id);
}

/** Auto-attempt on problem open (fire-and-forget from the client). */
export async function recordAttemptAction(
  problemId: string,
  tz: string
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return ANON;
  if (!validId(problemId)) return { ok: false, error: "Invalid problem." };
  try {
    await recordAttempt(userId, problemId, tz);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not record attempt." };
  }
}

export async function markSolvedAction(
  problemId: string,
  tz: string
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return ANON;
  if (!validId(problemId)) return { ok: false, error: "Invalid problem." };
  try {
    await markSolved(userId, problemId, tz);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not mark solved." };
  }
}

export async function unmarkSolvedAction(
  problemId: string,
  tz: string
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return ANON;
  if (!validId(problemId)) return { ok: false, error: "Invalid problem." };
  try {
    await unmarkSolved(userId, problemId, tz);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update." };
  }
}

export type ToggleBookmarkResult =
  | { ok: true; bookmarked: boolean }
  | { ok: false; anon?: boolean; error?: string };

export async function toggleBookmarkAction(
  problemId: string
): Promise<ToggleBookmarkResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, anon: true };
  if (!validId(problemId)) return { ok: false, error: "Invalid problem." };
  try {
    const bookmarked = await toggleBookmark(userId, problemId);
    return { ok: true, bookmarked };
  } catch {
    return { ok: false, error: "Could not update bookmark." };
  }
}

export type MyProgress = {
  status: ProgressStatus;
  bookmarked: boolean;
} | null;

/** Client hydration for the problem-page controls (keeps the page static). */
export async function getMyProblemProgressAction(
  problemId: string
): Promise<MyProgress> {
  const userId = await getSessionUserId();
  if (!userId || !validId(problemId)) return null;
  try {
    return await getProblemProgress(userId, problemId);
  } catch {
    return null;
  }
}

export type MyNote = { note: string; anon: boolean };

/**
 * Load the user's note for client hydration. `anon: true` signals the NotesArea
 * to keep its localStorage-only behavior (and skip the one-time migration).
 */
export async function getMyNoteAction(problemId: string): Promise<MyNote> {
  const userId = await getSessionUserId();
  if (!userId) return { note: "", anon: true };
  if (!validId(problemId)) return { note: "", anon: false };
  try {
    return { note: await getNote(userId, problemId), anon: false };
  } catch {
    return { note: "", anon: false };
  }
}

/** Debounced note save from the problem page. */
export async function saveNoteAction(
  problemId: string,
  note: string
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return ANON;
  if (!validId(problemId)) return { ok: false, error: "Invalid problem." };
  try {
    await setNote(userId, problemId, note.slice(0, NOTE_MAX));
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save note." };
  }
}
