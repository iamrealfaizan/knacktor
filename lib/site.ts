/**
 * Single source of truth for site-wide navigation and catalog stats.
 *
 * Every header/footer imports NAV_LINKS from here — never redefine link lists
 * in a component or a section's data file. Catalog stats are static fallbacks
 * (aspirational marketing numbers) until they're derived from the DB via
 * content-service's getSiteStats(); user-specific numbers (streak, solved
 * counts) stay mock in components/home/home-data.ts until auth lands.
 */

export const NAV_LINKS = [
  { label: "Problems", href: "/problems" },
  { label: "Topics", href: "/topics" },
  { label: "Patterns", href: "/patterns" },
  { label: "Sheets", href: "/sheets" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];

/** Catalog-wide stats (static fallbacks — see getSiteStats() for DB-derived). */
export const SITE_STATS = {
  problems: 480,
  topics: 24,
  patterns: 18,
  sheets: 9,
} as const;
