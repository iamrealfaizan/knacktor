// Shared URL-state model for the /home browse panel. All of search, filters,
// sort, and pagination live in one BrowseState object. The client island keeps
// this in React state, fetches the list from /api/problems, and mirrors it into
// the address bar via the History API (no server re-render). On first load the
// server reads the same params (parseState) so the initial list is SSR-correct.

import type { ProblemSort, SortOrder, DifficultySlug } from "./types";

/** Page size for the home problem list. */
export const HOME_PAGE_SIZE = 20;

const VALID_DIFF: DifficultySlug[] = ["easy", "medium", "hard"];
const VALID_STATUS = ["solved", "attempted", "todo"] as const;
const VALID_SORT: ProblemSort[] = ["number", "difficulty", "title", "created"];

export interface BrowseState {
  q: string;
  /** progress statuses — OR (union); filtered client-side on resolved rows */
  status: string[];
  /** difficulty slugs — OR (union) */
  difficulties: string[];
  /** topic slugs — AND (must have all) */
  topics: string[];
  /** pattern slugs — AND (must have all) */
  patterns: string[];
  sort: ProblemSort;
  order: SortOrder;
  page: number;
}

export const DEFAULT_BROWSE_STATE: BrowseState = {
  q: "",
  status: [],
  difficulties: [],
  topics: [],
  patterns: [],
  sort: "number",
  order: "asc",
  page: 1,
};

/** True when nothing but defaults is set (used to show/hide "clear all"). */
export function isDefaultState(s: BrowseState): boolean {
  return (
    !s.q &&
    s.status.length === 0 &&
    s.difficulties.length === 0 &&
    s.topics.length === 0 &&
    s.patterns.length === 0
  );
}

/** Serialize state → query string (omitting defaults) for the address bar + API. */
export function stateToQuery(state: BrowseState): string {
  const p = new URLSearchParams();
  if (state.q.trim()) p.set("q", state.q.trim());
  for (const st of state.status) p.append("status", st);
  for (const d of state.difficulties) p.append("difficulty", d);
  for (const t of state.topics) p.append("topic", t);
  for (const pt of state.patterns) p.append("pattern", pt);
  if (state.sort !== "number") p.set("sort", state.sort);
  if (state.order === "desc") p.set("order", "desc");
  if (state.page > 1) p.set("page", String(state.page));
  return p.toString();
}

type RawParams = Record<string, string | string[] | undefined>;

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}
function toOne(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Parse the server's searchParams object into a validated BrowseState. */
export function parseState(sp: RawParams = {}): BrowseState {
  const sortRaw = toOne(sp.sort);
  const sort = VALID_SORT.includes(sortRaw as ProblemSort)
    ? (sortRaw as ProblemSort)
    : "number";
  return {
    q: toOne(sp.q)?.trim() ?? "",
    status: toArray(sp.status).filter((s) =>
      (VALID_STATUS as readonly string[]).includes(s)
    ),
    difficulties: toArray(sp.difficulty).filter((d) => VALID_DIFF.includes(d as DifficultySlug)),
    topics: toArray(sp.topic),
    patterns: toArray(sp.pattern),
    sort,
    order: toOne(sp.order) === "desc" ? "desc" : "asc",
    page: Math.max(1, Number.parseInt(toOne(sp.page) ?? "1", 10) || 1),
  };
}
