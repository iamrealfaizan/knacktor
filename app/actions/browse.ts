"use server";

/**
 * Authenticated browse for the /home problem list. Reads only — but it is
 * user-aware (unlike the public /api/problems route, which stays read-only and
 * status-agnostic per D16), so status filtering spans the WHOLE catalog and
 * paginates correctly instead of filtering a single already-fetched page.
 */
import { getProblemsPage } from "@/lib/content-service";
import {
  getSessionUserId,
  getProblemStatuses,
  resolveStatusFilterIds,
} from "@/lib/progress-service";
import { HOME_PAGE_SIZE, type BrowseState } from "@/lib/home-url";
import type { Problem, ProgressStatus, DifficultySlug } from "@/lib/types";

export interface BrowseResult {
  data: Problem[];
  total: number;
  /** problem `_id` → this user's status, for the returned page */
  statuses: Record<string, ProgressStatus>;
}

export async function browseProblemsAction(
  state: BrowseState
): Promise<BrowseResult> {
  const userId = await getSessionUserId();

  // Resolve the status filter into an _id include/exclude set (whole-catalog).
  let ids: { includeIds?: string[]; excludeIds?: string[] } = {};
  if (userId && state.status.length) {
    ids = await resolveStatusFilterIds(userId, state.status as ProgressStatus[]);
  }

  const { items, total } = await getProblemsPage({
    search: state.q || undefined,
    difficulties: state.difficulties as DifficultySlug[],
    topicSlugs: state.topics,
    patternSlugs: state.patterns,
    sort: state.sort,
    order: state.order,
    page: state.page,
    limit: HOME_PAGE_SIZE,
    ...ids,
  });

  // Real per-row status for the returned page (fixes stale statuses on pages 2+).
  const pageIds = items
    .map((p) => p._id)
    .filter((id): id is string => Boolean(id));
  const statuses =
    userId && pageIds.length ? await getProblemStatuses(userId, pageIds) : {};

  return { data: items, total, statuses };
}
