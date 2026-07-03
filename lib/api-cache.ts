/**
 * Shared CDN cache headers for read-only content API routes.
 * Content changes only at ingest, so an hour of edge caching with a day of
 * stale-while-revalidate is safe — Vercel's CDN absorbs repeat hits instead
 * of every request paying an Atlas round-trip.
 */
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
} as const;
