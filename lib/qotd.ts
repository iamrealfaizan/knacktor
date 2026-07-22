/**
 * Question of the Day — a GLOBAL, date-seeded deterministic pick over the whole
 * problems catalog (decision 5). Stores nothing: the same date maps to the same
 * problem for every user. The day boundary is UTC so all users see the same
 * QOTD on the same calendar date regardless of local timezone.
 */
import { getProblemDirectory } from "./content-service";
import type { Qotd } from "./types";

/** Today's date key in UTC ("YYYY-MM-DD"). */
export function utcDateKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Stable 32-bit hash of a date string (FNV-1a) → non-negative integer. */
function hashDate(dateKey: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The QOTD for `dateKey` (defaults to today, UTC). Returns null only when the
 * catalog is empty. Also returns the problem `id` so callers can check whether
 * the signed-in user has solved it.
 */
export async function getQotd(
  dateKey: string = utcDateKey()
): Promise<(Qotd & { id: string }) | null> {
  const directory = await getProblemDirectory();
  if (!directory.length) return null;
  const pick = directory[hashDate(dateKey) % directory.length];
  return {
    id: pick.id,
    title: pick.title,
    slug: pick.slug,
    href: `/problems/${pick.slug}`,
  };
}
