import { getTopics, getPatterns } from "@/lib/content-service";
import { getProblemStatuses } from "@/lib/progress-service";
import { toHomeRow, type Problem as HomeRow } from "@/components/home/home-data";
import type { Problem as DbProblem, ProgressStatus } from "@/lib/types";

/**
 * Turn resolved DB problems into home-table display rows, with the signed-in
 * user's per-problem status. Shared by the Topics/Patterns/Sheets detail pages.
 * Anonymous callers (userId null) get all-"todo" rows — never throws. Preserves
 * the incoming problem order (callers sort beforehand, e.g. sheets by entry order).
 */
export async function buildProblemRows(
  problems: DbProblem[],
  userId: string | null
): Promise<HomeRow[]> {
  const [topics, patterns] = await Promise.all([getTopics(), getPatterns()]);
  const topicName = Object.fromEntries(topics.map((t) => [t.slug, t.name]));
  const patternName = Object.fromEntries(patterns.map((p) => [p.slug, p.name]));

  const ids = problems.map((p) => p._id).filter((x): x is string => Boolean(x));
  const statuses = userId
    ? await getProblemStatuses(userId, ids)
    : ({} as Record<string, ProgressStatus>);

  return problems.map((p) =>
    toHomeRow(p, topicName, patternName, statuses[p._id ?? ""] ?? "todo")
  );
}
