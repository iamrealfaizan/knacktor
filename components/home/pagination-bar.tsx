"use client";

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
 * Controlled pager for the home problem list. Reports page changes via
 * onPageChange; the parent island fetches the page and updates the table in
 * place (no navigation, scroll preserved). Hidden when everything fits on one page.
 */
export function PaginationBar({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const clamped = Math.min(Math.max(1, page), pageCount);
  const from = (clamped - 1) * pageSize + 1;
  const to = Math.min(clamped * pageSize, total);

  function go(e: React.MouseEvent, p: number) {
    e.preventDefault();
    if (p < 1 || p > pageCount || p === clamped) return;
    onPageChange(p);
  }

  // Windowed page numbers with ellipses: always show first, last, and neighbors.
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - clamped) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-kn-ink-2">
        Showing <b className="text-kn-ink-1 font-semibold">{from}</b>–
        <b className="text-kn-ink-1 font-semibold">{to}</b> of{" "}
        <b className="text-kn-ink-1 font-semibold">{total}</b>
      </p>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => go(e, clamped - 1)}
              aria-disabled={clamped <= 1}
              className={clamped <= 1 ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>

          {pages.map((p, i) =>
            p === "…" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  onClick={(e) => go(e, p)}
                  isActive={p === clamped}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => go(e, clamped + 1)}
              aria-disabled={clamped >= pageCount}
              className={clamped >= pageCount ? "pointer-events-none opacity-40" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
