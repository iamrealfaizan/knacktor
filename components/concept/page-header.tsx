import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Detail-page header for a single concept (topic / pattern / sheet): a back link
 * to the index, the concept name (with an optional badge slot, e.g. must-know ★),
 * an optional description, and a problem count. Mirrors the prior detail-page
 * header styling so the page reads consistently.
 */
export function PageHeader({
  backHref,
  backLabel,
  name,
  description,
  count,
  badge,
}: {
  backHref: string;
  backLabel: string;
  name: string;
  description?: string;
  count: number;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-kn-ink-2 hover:text-kn-ink-0 transition-colors mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-kn-ink-0">{name}</h1>
        {badge}
      </div>
      {description && (
        <p className="mt-2 text-sm text-kn-ink-2 max-w-2xl">{description}</p>
      )}
      <p className="mt-1 text-sm text-kn-ink-2">
        {count} problem{count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
