import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONES, type Tone } from "@/lib/tones";

/**
 * A single concept card (one topic / pattern / sheet) linking to its detail page.
 * Adopts the landing card recipe verbatim: bordered rounded-2xl surface, a
 * tone-tinted icon tile, name, description, a count, and a hover arrow. All color
 * comes from the semantic `tone` → kn-* tokens (never inline hex). `badge` is an
 * optional slot for accents like the patterns must-know ★.
 */
export function ConceptCard({
  href,
  icon: Icon,
  tone,
  name,
  description,
  count,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  tone: Tone;
  name: string;
  description?: string;
  count: number;
  badge?: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="group border border-kn-border-0 rounded-2xl bg-kn-surface-0 p-5 pb-6 flex flex-col gap-2.5 hover:border-kn-border-1 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl grid place-items-center", t.tint, t.text)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <span className="font-mono text-[11px] font-semibold text-kn-ink-2">
          {count} problem{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-[17px] text-kn-ink-0">{name}</span>
        {badge}
      </div>
      {description && (
        <p className="text-[13.5px] leading-relaxed text-kn-ink-1 line-clamp-2">{description}</p>
      )}
      <span
        className={cn(
          "mt-auto pt-1 inline-flex items-center gap-1 font-semibold text-[13px]",
          t.text
        )}
      >
        Explore{" "}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
