import { cn } from "@/lib/utils";

/**
 * Responsive grid wrapper for concept cards. Matches the landing discovery grid
 * (1 → 2 → cols columns). `cols` is 4 by default (topics/sheets); patterns use 3.
 */
export function ConceptGrid({
  cols = 4,
  children,
}: {
  cols?: 3 | 4;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid sm:grid-cols-2 gap-4",
        cols === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}
    >
      {children}
    </div>
  );
}
