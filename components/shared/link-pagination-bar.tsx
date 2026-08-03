import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/**
 * Navigation-based pager for server-rendered lists: each page is a real href, so
 * the URL is the state and the back button works.
 *
 * The sibling components/home/pagination-bar.tsx is the *controlled* variant —
 * it reports page changes to a client island that swaps rows in place without
 * navigating. Same windowing rules, different state owner; pick by whether the
 * list is a server component (this) or a client island (that).
 */
export function LinkPaginationBar({
  total,
  page,
  pageSize,
  hrefForPage,
}: {
  total: number;
  page: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clamped = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (clamped - 1) * pageSize + 1;
  const to = Math.min(clamped * pageSize, total);

  // Windowed page numbers with ellipses: always first, last, and neighbors.
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - clamped) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const atStart = clamped <= 1;
  const atEnd = clamped >= pageCount;
  const disabled = "pointer-events-none opacity-40";

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-kn-ink-2">
        Showing <b className="font-semibold text-kn-ink-1">{from}</b>–
        <b className="font-semibold text-kn-ink-1">{to}</b> of{" "}
        <b className="font-semibold text-kn-ink-1">{total}</b>
      </p>

      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={atStart ? undefined : hrefForPage(clamped - 1)}
                rel="prev"
                aria-disabled={atStart}
                className={cn(atStart && disabled)}
              />
            </PaginationItem>

            {pages.map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={hrefForPage(p)} isActive={p === clamped}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={atEnd ? undefined : hrefForPage(clamped + 1)}
                rel="next"
                aria-disabled={atEnd}
                className={cn(atEnd && disabled)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
