/**
 * Client-side timezone capture. Progress writes key the streak/heatmap "day"
 * off the user's LOCAL calendar day (decision 4), so client callers pass their
 * IANA zone into the write actions; the server stores it on `userStreak` for
 * read-time recomputation.
 */
export function getClientTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
