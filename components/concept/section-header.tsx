/**
 * Centered page-level section header for the concept index pages (Topics /
 * Patterns / Sheets). Mirrors the landing page's section-header recipe
 * (mono eyebrow + extrabold title + relaxed subcopy) so these pages read as
 * part of the same design system. Uses <h1> since it is the page's primary heading.
 */
export function SectionHeader({
  eyebrow,
  title,
  subcopy,
}: {
  eyebrow: string;
  title: string;
  subcopy?: string;
}) {
  return (
    <div className="text-center max-w-[680px] mx-auto mb-11">
      <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kn-ink-2">
        {eyebrow}
      </span>
      <h1 className="mt-3.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-kn-ink-0">
        {title}
      </h1>
      {subcopy && (
        <p className="mt-3 text-[15px] leading-relaxed text-kn-ink-1">{subcopy}</p>
      )}
    </div>
  );
}
